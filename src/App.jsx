import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import MaiaChat from './MaiaChat';

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ *
 * Helper: turn an inline CSS string into a React style object so the
 * original markup styles can be ported verbatim.
 * ------------------------------------------------------------------ */
function css(str) {
  const style = {};
  for (const decl of str.split(';')) {
    const idx = decl.indexOf(':');
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim();
    const val = decl.slice(idx + 1).trim();
    if (!prop) continue;
    const camel = prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    style[camel] = val;
  }
  return style;
}

/* ------------------------------------------------------------------ *
 * Hero frame sequence (the model). Real files, no base64.
 * ------------------------------------------------------------------ */
const FRAME_COUNT = 60;
const FRAME_PATH = (i) => `/frames/frame${String(i).padStart(3, '0')}.webp`;

/* ------------------------------------------------------------------ *
 * Static content
 * ------------------------------------------------------------------ */
const TEAM_BASE = [
  { photo: '/images/team-camila.webp', name: 'Camila Rojas', role: 'Dental Hygienist' },
  { photo: '/images/team-sofia.webp', name: 'Sofía Vargas', role: 'Orthodontist' },
  { photo: '/images/team-cosme.webp', name: 'Dr. Cosme Fernández', role: 'Oral Surgeon' },
  { photo: '/images/team-saulo.webp', name: 'Saulo Saraiva', role: 'General Dentist' },
];
const TEAM_MEMBERS = [...TEAM_BASE, ...TEAM_BASE];

const CASES = [
  {
    id: 'whitening',
    category: 'whitening',
    categoryLabel: 'Teeth Whitening',
    title: 'Professional Whitening',
    before: '/images/whitening-before.webp',
    after: '/images/whitening-after.webp',
  },
  {
    id: 'implant',
    category: 'implant',
    categoryLabel: 'Dental Implant',
    title: 'Single Tooth Implant',
    before: '/images/implant-before.webp',
    after: '/images/implant-after.webp',
  },
];

const FILTER_DEFS = [
  { value: 'all', label: 'All' },
  { value: 'whitening', label: 'Teeth Whitening' },
  { value: 'implant', label: 'Dental Implant' },
];

const STEPS = [
  { num: '01', title: 'Talk to Maia (AI)', desc: 'Describe your smile goals, share a few photos, and get an instant treatment estimate — day or night.', shape: '6px' },
  { num: '02', title: 'The clinic contacts you', desc: 'A licensed care coordinator reviews your case and builds a personalized itinerary and quote.', shape: '50%' },
  { num: '03', title: 'Live the full experience', desc: 'Fly in, get treated by top-rated specialists, and recover in paradise — not a waiting room.', shape: '2px' },
];

const PACKAGES = [
  {
    name: 'Essential Smile', price: '$1,890', accent: '#00A896', featured: false,
    border: '1px solid rgba(0,168,150,0.22)', shadow: 'none',
    btnBg: 'rgba(0,168,150,0.12)', btnColor: '#00786F', btnBorder: '1px solid rgba(0,168,150,0.4)',
    features: ['Full dental exam & diagnostics', 'Up to 2 cosmetic procedures', '4 nights hotel stay', 'Airport transfers included'],
  },
  {
    name: 'Paradise Escape', price: '$3,490', accent: '#00A896', featured: true,
    border: '1.5px solid rgba(0,168,150,0.5)', shadow: '0 25px 60px rgba(0,168,150,0.18)',
    btnBg: '#00A896', btnColor: '#fff', btnBorder: 'none',
    features: ['Full smile makeover (veneers/implants)', '7 nights beachfront resort', 'Private bilingual guide', 'Spa day included'],
  },
  {
    name: 'Elite Gold', price: '$6,900', accent: '#C1652E', featured: false,
    border: '1px solid rgba(244,162,97,0.5)', shadow: '0 25px 60px rgba(244,162,97,0.18)',
    btnBg: 'rgba(244,162,97,0.18)', btnColor: '#A34E1E', btnBorder: '1px solid rgba(244,162,97,0.55)',
    features: ['Premium implants & full reconstruction', '10 nights luxury villa', 'Private chef', 'Helicopter volcano & coast tour'],
  },
];

const REASONS = [
  { stat: '70%', title: 'Save vs. US/Canada prices', desc: 'World-class dentistry at a fraction of the cost — without compromising on materials or expertise.' },
  { stat: 'JCI', title: 'Accredited clinics', desc: 'US-trained specialists working in internationally accredited facilities you can trust.' },
  { stat: '★', title: 'Pura Vida recovery', desc: 'Heal on the beach, not in a waiting room — Costa Rica turns treatment into a getaway.' },
];

/* ------------------------------------------------------------------ *
 * Breakpoint hook: the layout is inline-styled with no media queries,
 * so responsive branches are driven from JS instead.
 * ------------------------------------------------------------------ */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);
  return matches;
}

export default function App() {
  const [activeFilter, setActiveFilter] = useState('all');
  const isMobile = useMediaQuery('(max-width: 768px)');

  const refs = {
    root: useRef(null),
    heroPin: useRef(null),
    canvas: useRef(null),
    preloader: useRef(null),
    preloaderBar: useRef(null),
    carouselTrack: useRef(null),
    baGrid: useRef(null),
  };

  // Mutable, non-reactive instance state (mirrors the original class fields).
  const S = useRef({
    images: [],
    frameState: { index: 0 },
    sliderPositions: {},
    lenis: null,
    rafId: null,
    carouselTween: null,
    baCleanup: null,
    sequenceReady: false,
    handleResize: null,
  }).current;

  /* ---------------- canvas drawing ---------------- */
  const drawFrame = useCallback((index) => {
    const canvas = refs.canvas.current;
    if (!canvas) return;
    const img = S.images[Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(index)))];
    if (!img || !img.complete || !img.naturalWidth) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / scale, sh = h / scale;
    const sx = (img.naturalWidth - sw) / 2, sy = (img.naturalHeight - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------- before/after sliders ---------------- */
  const setupBASliders = useCallback((rebind) => {
    const grid = refs.baGrid.current;
    if (!grid) { setTimeout(() => setupBASliders(rebind), 150); return; }
    if (S.baCleanup) S.baCleanup();

    const cleanups = [];
    const roots = grid.querySelectorAll('[data-slider-root]');

    roots.forEach((root) => {
      const beforeImg = root.querySelector('[data-slider-before]');
      const handle = root.querySelector('[data-slider-handle]');
      const id = root.getAttribute('data-case-id');

      const setPct = (pct) => {
        pct = Math.max(0, Math.min(100, pct));
        S.sliderPositions[id] = pct;
        // Both images are full-size; reveal the "before" from the left up to
        // `pct` by clipping the rest. Resize-proof — no width syncing needed.
        if (beforeImg) beforeImg.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
        if (handle) handle.style.left = pct + '%';
      };

      setPct(S.sliderPositions[id] ?? 50);

      let dragging = false;
      const posFromEvent = (clientX) => {
        const rect = root.getBoundingClientRect();
        return ((clientX - rect.left) / rect.width) * 100;
      };
      const onDown = (e) => {
        dragging = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        setPct(posFromEvent(clientX));
      };
      const onMove = (e) => {
        if (!dragging) return;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        setPct(posFromEvent(clientX));
        e.preventDefault();
      };
      const onUp = () => { dragging = false; };

      root.addEventListener('mousedown', onDown);
      root.addEventListener('touchstart', onDown, { passive: true });
      window.addEventListener('mousemove', onMove);
      window.addEventListener('touchmove', onMove, { passive: false });
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchend', onUp);

      cleanups.push(() => {
        root.removeEventListener('mousedown', onDown);
        root.removeEventListener('touchstart', onDown);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('mouseup', onUp);
        window.removeEventListener('touchend', onUp);
      });
    });

    S.baCleanup = () => cleanups.forEach((fn) => fn());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshRevealsInGrid = useCallback(() => {
    const grid = refs.baGrid.current;
    if (!grid) return;
    const cards = grid.querySelectorAll('[data-case-card]');
    gsap.fromTo(cards, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------- mount: frames, lenis, reveals, carousel ---------------- */
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    // ----- Lenis smooth scroll -----
    const lenis = new Lenis({ duration: 1.4, smoothWheel: true, wheelMultiplier: 0.75, touchMultiplier: 0.9 });
    S.lenis = lenis;
    lenis.stop();
    const raf = (time) => {
      lenis.raf(time);
      S.rafId = requestAnimationFrame(raf);
    };
    S.rafId = requestAnimationFrame(raf);
    lenis.on('scroll', ScrollTrigger.update);
    const tickerFn = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    // ----- scroll sequence (built once frames are ready) -----
    const setupHeroChapters = (pinEl) => {
      const chapters = Array.from(pinEl.querySelectorAll('[data-chapter]'));
      if (!chapters.length) return;
      const segDuration = 1;
      const transDuration = 0.32;
      const tl = gsap.timeline({
        scrollTrigger: { trigger: pinEl, start: 'top top', end: 'bottom bottom', scrub: 0.5 },
      });
      chapters.forEach((el, i) => {
        if (i === 0) return;
        const startTime = i * segDuration - transDuration;
        tl.to(chapters[i - 1], { opacity: 0, y: -40, duration: transDuration, ease: 'power1.inOut' }, startTime);
        tl.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: transDuration, ease: 'power1.inOut' }, startTime);
      });
    };

    const setupScrollSequence = () => {
      if (S.sequenceReady) return;
      S.sequenceReady = true;
      const pinEl = refs.heroPin.current;
      if (!pinEl) return;
      gsap.to(S.frameState, {
        index: FRAME_COUNT - 1,
        ease: 'none',
        scrollTrigger: { trigger: pinEl, start: 'top top', end: 'bottom bottom', scrub: 0.4 },
        onUpdate: () => drawFrame(S.frameState.index),
      });
      setupHeroChapters(pinEl);
    };

    const onFramesReady = () => {
      if (S.sequenceReady) return;
      setupScrollSequence();
      const el = refs.preloader.current;
      if (el) {
        el.style.opacity = '0';
        setTimeout(() => { if (el) el.style.display = 'none'; }, 650);
      }
      document.body.style.overflow = '';
      if (S.lenis) S.lenis.start();
    };

    // ----- preload the frame images -----
    let loaded = 0;
    const onProgress = () => {
      loaded++;
      const pct = Math.round((loaded / FRAME_COUNT) * 100);
      if (refs.preloaderBar.current) refs.preloaderBar.current.style.width = pct + '%';
      if (loaded === FRAME_COUNT) onFramesReady();
    };
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = FRAME_PATH(i);
      img.onload = () => { if (i === 1) drawFrame(0); onProgress(); };
      img.onerror = onProgress;
      S.images[i - 1] = img;
    }
    const safety = setTimeout(() => { if (!S.sequenceReady) onFramesReady(); }, 12000);

    // ----- generic scroll reveals -----
    const revealTimer = setInterval(() => {
      if (!refs.root.current) return;
      clearInterval(revealTimer);
      const els = refs.root.current.querySelectorAll('[data-reveal]');
      els.forEach((el) => {
        gsap.to(el, {
          opacity: 1, y: 0, duration: 0.9, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%' },
        });
      });
    }, 100);

    // ----- team carousel -----
    const carouselTimer = setInterval(() => {
      const track = refs.carouselTrack.current;
      if (!track) return;
      clearInterval(carouselTimer);
      const setWidth = track.scrollWidth / 2;
      gsap.set(track, { x: 0 });
      S.carouselTween = gsap.to(track, { x: -setWidth, duration: 14, ease: 'none', repeat: -1 });
      track.addEventListener('mouseenter', () => S.carouselTween.timeScale(0.15));
      track.addEventListener('mouseleave', () => S.carouselTween.timeScale(1));
    }, 100);

    // ----- resize -----
    S.handleResize = () => drawFrame(S.frameState.index);
    window.addEventListener('resize', S.handleResize);

    return () => {
      clearTimeout(safety);
      clearInterval(revealTimer);
      clearInterval(carouselTimer);
      window.removeEventListener('resize', S.handleResize);
      gsap.ticker.remove(tickerFn);
      if (S.lenis) S.lenis.destroy();
      if (S.rafId) cancelAnimationFrame(S.rafId);
      if (S.carouselTween) S.carouselTween.kill();
      ScrollTrigger.getAll().forEach((t) => t.kill());
      if (S.baCleanup) S.baCleanup();
      document.body.style.overflow = '';
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------------- re-bind sliders / reveal new cards on filter change ---------------- */
  const firstFilterRun = useRef(true);
  useEffect(() => {
    setupBASliders(true);
    if (firstFilterRun.current) {
      firstFilterRun.current = false;
    } else {
      requestAnimationFrame(() => refreshRevealsInGrid());
    }
  }, [activeFilter, setupBASliders, refreshRevealsInGrid]);

  /* ---------------- derived view data ---------------- */
  const visibleCases = (activeFilter === 'all' ? CASES : CASES.filter((c) => c.category === activeFilter));
  const cardWidth = visibleCases.length === 1 ? '620px' : '380px';

  const filters = FILTER_DEFS.map((f) => {
    const active = f.value === activeFilter;
    return {
      ...f,
      bg: active ? '#00A896' : 'rgba(232,248,245,0.7)',
      color: active ? '#fff' : '#1A1A2E',
      border: active ? '1px solid #00A896' : '1px solid rgba(0,168,150,0.2)',
    };
  });

  return (
    <div
      ref={refs.root}
      style={css("position:relative;background:#F8FFFE;font-family:'Neue Haas Grotesk Display Pro','Inter','Helvetica Neue',Arial,sans-serif;width:100%")}
    >
      {/* NAV */}
      <nav style={css('position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:22px 48px;background:linear-gradient(180deg, rgba(26,26,46,0.85), rgba(26,26,46,0));backdrop-filter:blur(6px)')}>
        <div style={css("font-family:'Neue Haas Grotesk Display Pro','Inter','Helvetica Neue',Arial,sans-serif;font-size:20px;font-weight:500;letter-spacing:0.5px;color:#fff")}>Smile &amp; Escape</div>
        <a href="#maia" style={css('font-size:13px;font-weight:600;padding:10px 20px;border:1px solid rgba(255,255,255,0.35);border-radius:100px;color:#fff;letter-spacing:0.3px')}>Talk to Maia</a>
      </nav>

      {/* PRELOADER */}
      <div ref={refs.preloader} style={css('position:fixed;inset:0;z-index:100;background:#F8FFFE;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;transition:opacity 0.6s ease')}>
        <div style={css("font-family:'Neue Haas Grotesk Display Pro','Inter','Helvetica Neue',Arial,sans-serif;font-size:22px;font-weight:500;letter-spacing:0.5px;color:#1A1A2E")}>Smile &amp; Escape</div>
        <div style={css('width:220px;height:2px;background:rgba(26,26,46,0.1);border-radius:2px;overflow:hidden')}>
          <div ref={refs.preloaderBar} style={css('width:0%;height:100%;background:#00A896;transition:width 0.15s ease')} />
        </div>
        <div style={css('font-size:12px;letter-spacing:2px;text-transform:uppercase;color:rgba(26,26,46,0.5)')}>Preparing your experience</div>
      </div>

      {/* HERO */}
      <section ref={refs.heroPin} style={css('position:relative;height:600vh;width:100%')}>
        <div style={css('position:sticky;top:0;left:0;height:100vh;width:100%;overflow:hidden;background:#1A1A2E')}>
          <canvas ref={refs.canvas} style={css('position:absolute;top:0;left:0;width:100%;height:100%;display:block')} />
          <div style={css('position:absolute;inset:0;background:linear-gradient(180deg, rgba(26,26,46,0.55) 0%, rgba(26,26,46,0.05) 32%, rgba(26,26,46,0.15) 60%, rgba(26,26,46,0.85) 100%)')} />

          <div style={css('position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 24px')}>
            <div style={css('position:relative;display:grid;width:100%;max-width:820px')}>
              <div data-chapter="0" style={css('grid-area:1/1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:6px 0;opacity:1;transform:translateY(0px)')}>
                <h1 style={css("font-family:'Neue Haas Grotesk Display Pro','Inter','Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:clamp(30px,5.4vw,62px);line-height:1.18;margin:0;max-width:16ch;letter-spacing:-0.5px;color:#fff")}>Meet Maia.<br />Your smile's new best friend.</h1>
                <p style={css('font-size:clamp(14px,1.6vw,18px);color:rgba(255,255,255,0.8);margin:24px 0 0;max-width:38ch;font-weight:400;line-height:1.5')}>The first AI agent that plans, matches, and books your dental transformation.</p>
              </div>

              <div data-chapter="1" style={css('grid-area:1/1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:6px 0;opacity:0;transform:translateY(40px)')}>
                <h1 style={css("font-family:'Neue Haas Grotesk Display Pro','Inter','Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:clamp(30px,5.4vw,62px);line-height:1.18;margin:0;max-width:16ch;letter-spacing:-0.5px;color:#fff")}>A confident smile starts with a conversation.</h1>
                <p style={css('font-size:clamp(14px,1.6vw,18px);color:rgba(255,255,255,0.8);margin:24px 0 0;max-width:38ch;font-weight:400;line-height:1.5')}>Describe your goals — Maia builds your treatment plan in minutes.</p>
              </div>

              <div data-chapter="2" style={css('grid-area:1/1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:6px 0;opacity:0;transform:translateY(40px)')}>
                <h1 style={css("font-family:'Neue Haas Grotesk Display Pro','Inter','Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:clamp(30px,5.4vw,62px);line-height:1.18;margin:0;max-width:16ch;letter-spacing:-0.5px;color:#fff")}>World-class dentists. Paradise recovery.</h1>
                <p style={css('font-size:clamp(14px,1.6vw,18px);color:rgba(255,255,255,0.8);margin:24px 0 0;max-width:38ch;font-weight:400;line-height:1.5')}>JCI-accredited clinics paired with Costa Rica's Pura Vida lifestyle.</p>
              </div>

              <div data-chapter="3" style={css('grid-area:1/1;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:6px 0;opacity:0;transform:translateY(40px)')}>
                <h1 style={css("font-family:'Neue Haas Grotesk Display Pro','Inter','Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:clamp(30px,5.4vw,62px);line-height:1.18;margin:0;max-width:16ch;letter-spacing:-0.5px;color:#fff")}>Your New Smile Awaits.</h1>
                <p style={css('font-size:clamp(14px,1.6vw,18px);color:rgba(255,255,255,0.85);margin:24px 0 0;max-width:38ch;font-weight:400;line-height:1.5')}>World-class dental care. Costa Rica experience.</p>
                <a href="#maia" style={css('margin-top:32px;display:inline-flex;align-items:center;gap:10px;background:transparent;color:#fff;font-weight:600;font-size:16px;padding:16px 34px;border-radius:100px;border:1.5px solid rgba(255,255,255,0.7);backdrop-filter:blur(4px)')}>Start with Maia <span>→</span></a>
              </div>
            </div>
          </div>

          <div style={css('position:absolute;bottom:36px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;color:rgba(255,255,255,0.55);font-size:11px;letter-spacing:2px;text-transform:uppercase;animation:floatSlow 2.4s ease-in-out infinite')}>
            <div style={css('width:1px;height:34px;background:linear-gradient(180deg, rgba(255,255,255,0.8), transparent)')} />
          </div>
        </div>
      </section>

      {/* TEAM CAROUSEL */}
      <section style={css('position:relative;padding:120px 0 130px;overflow:hidden;background:#F8FFFE')}>
        <div style={css(`display:flex;align-items:flex-start;gap:${isMobile ? '36px' : '64px'};max-width:1400px;margin:0 auto;padding:0 ${isMobile ? '24px' : '48px'}${isMobile ? ';flex-direction:column' : ''}`)}>
          <div data-reveal="" style={css(`opacity:0;transform:translateY(28px);flex:${isMobile ? '0 0 auto' : '0 0 320px'};${isMobile ? 'width:100%;max-width:420px' : 'position:sticky;top:140px'}`)}>
            <div style={css('display:flex;align-items:center;gap:14px;margin-bottom:22px')}>
              <div style={css('display:flex')}>
                <div style={css('width:34px;height:34px;border-radius:50%;background:#00A896;border:2px solid #F8FFFE;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:600')}>😊</div>
                <div style={css('width:34px;height:34px;border-radius:50%;background:#F4A261;border:2px solid #F8FFFE;margin-left:-10px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:600')}>😁</div>
              </div>
              <div>
                <div style={css('font-size:15px;font-weight:700;color:#1A1A2E')}>2,400+</div>
                <div style={css('font-size:12px;color:rgba(26,26,46,0.5)')}>Happy Patients</div>
              </div>
            </div>
            <h2 style={css("font-family:'Neue Haas Grotesk Display Pro','Inter','Helvetica Neue',Arial,sans-serif;font-weight:400;font-size:32px;line-height:1.25;margin:0 0 18px;letter-spacing:-0.3px;color:#1A1A2E")}>The people behind every smile.</h2>
            <p style={css('font-size:14.5px;line-height:1.65;color:rgba(26,26,46,0.6);margin:0 0 28px;max-width:32ch')}>Meet the specialists, hygienists and surgeons who'll take care of you from your first consult to your last checkup.</p>
            <a href="#maia" style={css('display:inline-flex;align-items:center;gap:10px;background:#1A1A2E;color:#fff;font-weight:600;font-size:14px;padding:14px 26px;border-radius:100px')}>Meet the Team <span>→</span></a>
          </div>

          <div style={css(`flex:1;min-width:0;position:relative;overflow:hidden;${isMobile ? 'width:100%;' : ''}-webkit-mask-image:linear-gradient(90deg, transparent 0, #000 ${isMobile ? '40px' : '110px'}, #000 100%);mask-image:linear-gradient(90deg, transparent 0, #000 ${isMobile ? '40px' : '110px'}, #000 100%)`)}>
            <div ref={refs.carouselTrack} style={css('display:flex;gap:24px;width:max-content')}>
              {TEAM_MEMBERS.map((mem, i) => (
                <div key={i} style={css('flex:0 0 220px;border-radius:20px;overflow:hidden;box-shadow:0 12px 30px rgba(26,26,46,0.08);background:#fff')}>
                  <div style={css('width:100%;aspect-ratio:3/4;overflow:hidden')}>
                    <img src={mem.photo} alt={mem.name} style={css('width:100%;height:100%;object-fit:cover;display:block')} />
                  </div>
                  <div style={css('padding:16px 18px 20px')}>
                    <div style={css('font-size:15px;font-weight:600;color:#1A1A2E')}>{mem.name}</div>
                    <div style={css('font-size:12px;color:rgba(26,26,46,0.5);margin-top:3px')}>{mem.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BEFORE & AFTER */}
      <section style={css('position:relative;padding:60px 24px 160px;max-width:1220px;margin:0 auto')}>
        <div data-reveal="" style={css('text-align:center;margin-bottom:56px;opacity:0;transform:translateY(28px)')}>
          <div style={css('font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#00A896;font-weight:600;margin-bottom:16px')}>Before and After</div>
          <h2 style={css("font-family:'Neue Haas Grotesk Display Pro','Inter','Helvetica Neue',Arial,sans-serif;font-weight:400;font-size:36px;margin:0;letter-spacing:-0.3px;color:#1A1A2E")}>See the Difference</h2>
        </div>

        <div data-reveal="" style={css('opacity:0;transform:translateY(28px);display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-bottom:52px')}>
          {filters.map((filt) => (
            <button
              key={filt.value}
              onClick={() => setActiveFilter(filt.value)}
              data-filter-value={filt.value}
              style={css(`padding:12px 22px;border-radius:100px;font-size:13.5px;font-weight:600;cursor:pointer;border:${filt.border};background:${filt.bg};color:${filt.color};transition:all 0.2s ease`)}
            >
              {filt.label}
            </button>
          ))}
        </div>

        <div ref={refs.baGrid} style={css('display:flex;flex-wrap:wrap;justify-content:center;gap:32px')}>
          {visibleCases.map((c) => (
            <div
              key={c.id}
              data-reveal=""
              data-case-card=""
              style={css(`opacity:0;transform:translateY(28px);flex:0 1 ${cardWidth};width:${cardWidth};max-width:100%;border-radius:22px;overflow:hidden;background:rgba(232,248,245,0.55);backdrop-filter:blur(14px);border:1px solid rgba(0,168,150,0.15);box-shadow:0 20px 50px rgba(26,26,46,0.08)`)}
            >
              <div data-slider-root="" data-case-id={c.id} style={css('position:relative;width:100%;aspect-ratio:4/3;overflow:hidden;user-select:none;touch-action:none;cursor:ew-resize')}>
                <img src={c.after} draggable="false" alt={`${c.title} after`} style={css('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none')} />
                <img data-slider-before="" src={c.before} draggable="false" alt={`${c.title} before`} style={css('position:absolute;inset:0;width:100%;height:100%;object-fit:cover;pointer-events:none;clip-path:inset(0 50% 0 0)')} />
                <div style={css('position:absolute;top:14px;left:14px;background:rgba(26,26,46,0.55);color:#fff;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;padding:5px 12px;border-radius:100px;backdrop-filter:blur(4px)')}>Before</div>
                <div style={css('position:absolute;top:14px;right:14px;background:rgba(0,168,150,0.85);color:#fff;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;padding:5px 12px;border-radius:100px;backdrop-filter:blur(4px)')}>After</div>
                <div data-slider-handle="" style={css('position:absolute;top:0;bottom:0;left:50%;width:0;display:flex;align-items:center;justify-content:center;pointer-events:none')}>
                  <div style={css('position:absolute;top:0;bottom:0;left:0;width:2px;background:#fff;box-shadow:0 0 8px rgba(0,0,0,0.3)')} />
                  <div style={css('width:40px;height:40px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(26,26,46,0.3);color:#00A896;font-size:14px;font-weight:700')}>⟷</div>
                </div>
              </div>
              <div style={css('padding:24px 26px 28px')}>
                <div style={css('font-size:11.5px;letter-spacing:1px;text-transform:uppercase;color:#F4A261;font-weight:700;margin-bottom:8px')}>{c.categoryLabel}</div>
                <h3 style={css('font-size:18px;font-weight:600;margin:0;color:#1A1A2E')}>{c.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={css('position:relative;padding:160px 24px 140px;max-width:1180px;margin:0 auto')}>
        <div data-reveal="" style={css('text-align:center;margin-bottom:80px;opacity:0;transform:translateY(28px)')}>
          <div style={css('font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#00A896;font-weight:600;margin-bottom:16px')}>How It Works</div>
          <h2 style={css("font-family:'Neue Haas Grotesk Display Pro','Inter','Helvetica Neue',Arial,sans-serif;font-weight:400;font-size:36px;margin:0;letter-spacing:-0.3px;color:#1A1A2E")}>Three steps to your smile</h2>
        </div>

        <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:40px')}>
          {STEPS.map((step) => (
            <div key={step.num} data-reveal="" style={css('opacity:0;transform:translateY(28px);position:relative;padding:44px 34px;background:rgba(232,248,245,0.7);border:1px solid rgba(0,168,150,0.15);border-radius:20px')}>
              <div style={css("font-family:'Neue Haas Grotesk Display Pro','Inter','Helvetica Neue',Arial,sans-serif;font-size:15px;color:rgba(26,26,46,0.35);font-weight:500;margin-bottom:26px")}>{step.num}</div>
              <div style={css('width:52px;height:52px;border-radius:14px;background:rgba(0,168,150,0.14);display:flex;align-items:center;justify-content:center;margin-bottom:24px')}>
                <div style={css(`width:22px;height:22px;border-radius:${step.shape};background:#00A896`)} />
              </div>
              <h3 style={css('font-size:20px;font-weight:600;margin:0 0 12px;color:#1A1A2E')}>{step.title}</h3>
              <p style={css('font-size:15px;line-height:1.65;color:rgba(26,26,46,0.62);margin:0')}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PACKAGES */}
      <section style={css('position:relative;padding:120px 24px 160px;background:radial-gradient(ellipse at 50% 0%, rgba(0,168,150,0.08), transparent 60%)')}>
        <div style={css('max-width:1180px;margin:0 auto')}>
          <div data-reveal="" style={css('text-align:center;margin-bottom:72px;opacity:0;transform:translateY(28px)')}>
            <div style={css('font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#00A896;font-weight:600;margin-bottom:16px')}>Packages</div>
            <h2 style={css("font-family:'Neue Haas Grotesk Display Pro','Inter','Helvetica Neue',Arial,sans-serif;font-weight:400;font-size:36px;margin:0;letter-spacing:-0.3px;color:#1A1A2E")}>Choose your escape</h2>
          </div>

          <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:32px;align-items:stretch')}>
            {PACKAGES.map((pkg) => (
              <div key={pkg.name} data-reveal="" style={css(`opacity:0;transform:translateY(28px);position:relative;display:flex;flex-direction:column;padding:40px 34px;border-radius:22px;background:rgba(232,248,245,0.65);backdrop-filter:blur(14px);border:${pkg.border};box-shadow:${pkg.shadow}`)}>
                {pkg.featured && (
                  <div style={css('position:absolute;top:-14px;left:34px;background:#F4A261;color:#1A1A2E;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:6px 14px;border-radius:100px')}>Most Popular</div>
                )}
                <div style={css(`font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:${pkg.accent};font-weight:700;margin-bottom:18px`)}>{pkg.name}</div>
                <div style={css('display:flex;align-items:baseline;gap:8px;margin-bottom:28px')}>
                  <span style={css('font-size:14px;color:rgba(26,26,46,0.55)')}>from</span>
                  <span style={css("font-family:'Neue Haas Grotesk Display Pro','Inter','Helvetica Neue',Arial,sans-serif;font-size:42px;font-weight:400;color:#1A1A2E;letter-spacing:-0.5px")}>{pkg.price}</span>
                </div>
                <div style={css('height:1px;background:rgba(26,26,46,0.1);margin-bottom:28px')} />
                <div style={css('display:flex;flex-direction:column;gap:16px;margin-bottom:36px;flex:1')}>
                  {pkg.features.map((f, i) => (
                    <div key={i} style={css('display:flex;align-items:flex-start;gap:12px;font-size:14.5px;line-height:1.5;color:rgba(26,26,46,0.72)')}>
                      <span style={css(`color:${pkg.accent};font-weight:700;margin-top:1px`)}>✓</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <a href="#maia" style={css(`text-align:center;padding:15px;border-radius:100px;font-weight:600;font-size:15px;background:${pkg.btnBg};color:${pkg.btnColor};border:${pkg.btnBorder}`)}>Select {pkg.name}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY COSTA RICA */}
      <section style={css('position:relative;padding:140px 24px 150px;max-width:1180px;margin:0 auto')}>
        <div data-reveal="" style={css('text-align:center;margin-bottom:80px;opacity:0;transform:translateY(28px)')}>
          <div style={css('font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#00A896;font-weight:600;margin-bottom:16px')}>Why Costa Rica</div>
          <h2 style={css("font-family:'Neue Haas Grotesk Display Pro','Inter','Helvetica Neue',Arial,sans-serif;font-weight:400;font-size:36px;margin:0;letter-spacing:-0.3px;color:#1A1A2E")}>Pura Vida, world-class care</h2>
        </div>

        <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:40px')}>
          {REASONS.map((reason) => (
            <div key={reason.title} data-reveal="" style={css('opacity:0;transform:translateY(28px);text-align:center;padding:0 12px')}>
              <div style={css('width:90px;height:90px;border-radius:50%;background:rgba(0,168,150,0.10);border:1px solid rgba(0,168,150,0.25);display:flex;align-items:center;justify-content:center;margin:0 auto 28px')}>
                <div style={css("font-family:'Neue Haas Grotesk Display Pro','Inter','Helvetica Neue',Arial,sans-serif;font-size:26px;font-weight:500;color:#00A896")}>{reason.stat}</div>
              </div>
              <h3 style={css('font-size:19px;font-weight:600;margin:0 0 12px;color:#1A1A2E')}>{reason.title}</h3>
              <p style={css('font-size:14.5px;line-height:1.65;color:rgba(26,26,46,0.62);margin:0;max-width:34ch;margin-inline:auto')}>{reason.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CHAT WITH MAIA */}
      <section id="maia" style={css('position:relative;padding:150px 24px 160px;background:linear-gradient(180deg, #F8FFFE 0%, #E8F8F5 100%)')}>
        <div style={css('max-width:760px;margin:0 auto')}>
          <div data-reveal="" style={css('text-align:center;margin-bottom:56px;opacity:0;transform:translateY(28px)')}>
            <div style={css('font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#F4A261;font-weight:600;margin-bottom:16px')}>Meet Maia</div>
            <h2 style={css("font-family:'Neue Haas Grotesk Display Pro','Inter','Helvetica Neue',Arial,sans-serif;font-weight:400;font-size:36px;margin:0 0 18px;letter-spacing:-0.3px;color:#1A1A2E")}>Your AI smile concierge</h2>
            <p style={css('font-size:16px;color:rgba(26,26,46,0.65);margin:0;max-width:46ch;margin-inline:auto')}>Tell Maia what you're looking for. She'll estimate your treatment and connect you with your clinic — no waiting rooms required.</p>
          </div>

          <div data-reveal="" style={css('opacity:0;transform:translateY(28px)')}>
            <MaiaChat isMobile={isMobile} />
          </div>

          <div data-reveal="" style={css('opacity:0;transform:translateY(28px);text-align:center;margin-top:44px')}>
            <a href="#maia" style={css('display:inline-flex;align-items:center;gap:10px;background:#F4A261;color:#1A1A2E;font-weight:700;font-size:16px;padding:17px 38px;border-radius:100px')}>Start with Maia →</a>
          </div>
        </div>
      </section>

      <footer style={css('padding:40px 24px;text-align:center;font-size:13px;color:rgba(26,26,46,0.45);border-top:1px solid rgba(26,26,46,0.08)')}>
        Smile &amp; Escape · San José, Costa Rica
      </footer>
    </div>
  );
}
