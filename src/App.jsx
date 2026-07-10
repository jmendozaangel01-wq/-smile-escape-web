import React, { useEffect, useMemo, useState } from 'react';
import MaiaChat from './MaiaChat';

const images = {
  hero: '/images/costa-rica-hero.png',
  tamarindo: '/images/destination-tamarindo.png',
  monteverde: '/images/destination-monteverde.png',
  manuelAntonio: '/images/destination-manuel-antonio.png',
  sanJose: '/images/destination-san-jose.png',
};

const copy = {
  es: {
    langLabel: 'ES',
    otherLang: 'EN',
    nav: {
      home: 'Inicio',
      treatments: 'Tratamientos',
      destinations: 'Destinos',
      why: 'Por que Costa Rica?',
      about: 'Sobre nosotros',
      contact: 'Contacto',
      cta: 'Agenda tu evaluacion',
    },
    hero: {
      kicker: 'Turismo medico en Costa Rica',
      line1: 'Tu salud,',
      script1: 'nuestra prioridad',
      line2: 'Tu bienestar,',
      script2: 'nuestra pasion',
      copy: 'Turismo medico de clase mundial en Costa Rica. Tratamientos dentales de alta calidad a precios accesibles, en un paraiso natural.',
      cta: 'Agenda tu evaluacion gratuita',
      secondary: 'Conoce mas',
    },
    benefitsLabel: 'Beneficios',
    benefits: [
      { icon: 'tooth', title: 'Odontologia', text: 'Sonrisas que transforman vidas' },
      { icon: 'pulse', title: 'Cirugias', text: 'Procedimientos seguros y profesionales' },
      { icon: 'leaf', title: 'Bienestar', text: 'Tu recuperacion en un entorno natural' },
      { icon: 'shield', title: 'Seguridad', text: 'Clinicas certificadas con estandares internacionales' },
      { icon: 'savings', title: 'Ahorro', text: 'Ahorra hasta 70% en tu tratamiento' },
    ],
    intro: {
      kicker: 'Bienvenido a',
      title: 'Meditour Costa Rica',
      copy: 'Combinamos atencion medica de excelencia con la belleza incomparable de Costa Rica para ofrecerte una experiencia de recuperacion unica, segura y confortable.',
      cta: 'Conoce mas sobre nosotros',
      imageAlt: 'Costa Rica con volcan, selva y agua azul',
      checklist: [
        'Atencion personalizada antes, durante y despues de tu tratamiento.',
        'Doctores altamente calificados.',
        'Instalaciones modernas y certificadas.',
        'Asesoria en viaje, hospedaje y actividades turisticas.',
      ],
    },
    destinations: {
      kicker: 'Descubre',
      title: 'Destinos que te enamoran',
      items: [
        { name: 'La Fortuna', text: 'Aventura y naturaleza', image: images.hero },
        { name: 'Tamarindo', text: 'Playas paradisiacas', image: images.tamarindo },
        { name: 'Monteverde', text: 'Bosques nublados magicos', image: images.monteverde },
        { name: 'Manuel Antonio', text: 'Relax y vida silvestre', image: images.manuelAntonio },
        { name: 'San Jose', text: 'Cultura y modernidad', image: images.sanJose },
      ],
    },
    journey: {
      kicker: 'Asi de facil es tu viaje',
      title: 'En 4 pasos',
      steps: [
        { icon: 'chat', title: 'Contactanos', text: 'Cuentanos tus necesidades y recibe una evaluacion gratuita.' },
        { icon: 'plan', title: 'Planificamos tu viaje', text: 'Te ayudamos con tratamiento, viaje, hospedaje y experiencias.' },
        { icon: 'plane', title: 'Viaja a Costa Rica', text: 'Disfruta tu tratamiento con seguridad y comodidad.' },
        { icon: 'heart', title: 'Recuperate y disfruta', text: 'Tu bienestar es nuestra prioridad, disfruta de la pura vida.' },
      ],
    },
    ctaBand: {
      line: 'Transforma tu salud,',
      script: 'disfruta la vida',
      copy: 'Agenda tu evaluacion gratuita y da el primer paso hacia una mejor version de ti mismo en Costa Rica.',
    },
    chat: {
      kicker: 'Evaluacion gratuita',
      title: 'Tu viaje medico empieza con una conversacion',
      copy: 'Maia recopila la informacion inicial de tu caso y ayuda a encaminar la evaluacion para que el equipo pueda planificar tu tratamiento, estadia y recuperacion en Costa Rica.',
      previewTitle: 'Hablar con Maia',
      previewText: 'Evaluacion gratuita y plan inicial',
      floating: 'Evaluacion gratuita',
      modalKicker: 'Meditour Costa Rica',
      modalTitle: 'Evaluacion con Maia',
      openLabel: 'Abrir chat con Maia',
      closeLabel: 'Cerrar chat',
    },
    footer: 'Todos los derechos reservados.',
  },
  en: {
    langLabel: 'EN',
    otherLang: 'ES',
    nav: {
      home: 'Home',
      treatments: 'Treatments',
      destinations: 'Destinations',
      why: 'Why Costa Rica?',
      about: 'About us',
      contact: 'Contact',
      cta: 'Book your evaluation',
    },
    hero: {
      kicker: 'Medical tourism in Costa Rica',
      line1: 'Your health,',
      script1: 'our priority',
      line2: 'Your wellbeing,',
      script2: 'our passion',
      copy: 'World-class medical tourism in Costa Rica. High-quality dental treatments at accessible prices, surrounded by nature.',
      cta: 'Book your free evaluation',
      secondary: 'Learn more',
    },
    benefitsLabel: 'Benefits',
    benefits: [
      { icon: 'tooth', title: 'Dentistry', text: 'Smiles that transform lives' },
      { icon: 'pulse', title: 'Surgery', text: 'Safe, professional procedures' },
      { icon: 'leaf', title: 'Wellness', text: 'Recover in a natural setting' },
      { icon: 'shield', title: 'Safety', text: 'Certified clinics with international standards' },
      { icon: 'savings', title: 'Savings', text: 'Save up to 70% on your treatment' },
    ],
    intro: {
      kicker: 'Welcome to',
      title: 'Meditour Costa Rica',
      copy: 'We combine excellent medical care with Costa Rica\'s incomparable beauty to offer you a unique, safe, and comfortable recovery experience.',
      cta: 'Learn more about us',
      imageAlt: 'Costa Rica with volcano, rainforest, and blue water',
      checklist: [
        'Personalized attention before, during, and after your treatment.',
        'Highly qualified doctors.',
        'Modern, certified facilities.',
        'Travel, lodging, and tourism activity guidance.',
      ],
    },
    destinations: {
      kicker: 'Discover',
      title: 'Destinations you will love',
      items: [
        { name: 'La Fortuna', text: 'Adventure and nature', image: images.hero },
        { name: 'Tamarindo', text: 'Paradise beaches', image: images.tamarindo },
        { name: 'Monteverde', text: 'Magical cloud forests', image: images.monteverde },
        { name: 'Manuel Antonio', text: 'Relaxation and wildlife', image: images.manuelAntonio },
        { name: 'San Jose', text: 'Culture and modernity', image: images.sanJose },
      ],
    },
    journey: {
      kicker: 'Your trip is this simple',
      title: 'In 4 steps',
      steps: [
        { icon: 'chat', title: 'Contact us', text: 'Tell us what you need and receive a free evaluation.' },
        { icon: 'plan', title: 'We plan your trip', text: 'We help with treatment, travel, lodging, and experiences.' },
        { icon: 'plane', title: 'Travel to Costa Rica', text: 'Enjoy your treatment with safety and comfort.' },
        { icon: 'heart', title: 'Recover and enjoy', text: 'Your wellbeing is our priority. Enjoy pura vida.' },
      ],
    },
    ctaBand: {
      line: 'Transform your health,',
      script: 'enjoy life',
      copy: 'Book your free evaluation and take the first step toward a better version of yourself in Costa Rica.',
    },
    chat: {
      kicker: 'Free evaluation',
      title: 'Your medical journey starts with a conversation',
      copy: 'Maia gathers the initial information about your case and helps guide the evaluation so the team can plan your treatment, stay, and recovery in Costa Rica.',
      previewTitle: 'Talk to Maia',
      previewText: 'Free evaluation and initial plan',
      floating: 'Free evaluation',
      modalKicker: 'Meditour Costa Rica',
      modalTitle: 'Evaluation with Maia',
      openLabel: 'Open chat with Maia',
      closeLabel: 'Close chat',
    },
    footer: 'All rights reserved.',
  },
};

function Icon({ name }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

  if (name === 'tooth') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M7.5 3.7c1.7 0 2.6.9 4.5.9s2.8-.9 4.5-.9c2.4 0 4 2 4 4.8 0 2.3-.9 4.1-1.8 6.1-.8 1.8-1 5.7-3 5.7-1.5 0-1.3-4.6-3.7-4.6s-2.2 4.6-3.7 4.6c-2 0-2.2-3.9-3-5.7-.9-2-1.8-3.8-1.8-6.1 0-2.8 1.6-4.8 4-4.8Z" />
      </svg>
    );
  }

  if (name === 'pulse') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M20.8 8.6c0 6.2-8.8 11.1-8.8 11.1S3.2 14.8 3.2 8.6A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8.8 1.9Z" />
        <path {...common} d="M5 12h4l1.4-3.2 2.4 6.1 1.4-2.9H19" />
      </svg>
    );
  }

  if (name === 'leaf') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M12 21c1.2-5.6 4.8-8.8 9-11.2C16.9 9.4 13.9 6.7 12 3c-1.9 3.7-4.9 6.4-9 6.8 4.2 2.4 7.8 5.6 9 11.2Z" />
        <path {...common} d="M12 3v18M5 10c3.2.8 5.5 2.5 7 5M19 10c-3.2.8-5.5 2.5-7 5" />
      </svg>
    );
  }

  if (name === 'shield') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M12 3 20 6v5.5c0 4.8-3.2 7.8-8 9.5-4.8-1.7-8-4.7-8-9.5V6l8-3Z" />
        <path {...common} d="m8.5 12 2.2 2.2 4.8-5" />
      </svg>
    );
  }

  if (name === 'savings') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M5 11.5c0-3.2 2.8-5.5 7-5.5 3.8 0 6.8 2 7 5.1l2 1.2v3.4l-2.2.7a7.8 7.8 0 0 1-2 2.2V21h-3v-1.2a12 12 0 0 1-3.5 0V21h-3v-2.1C5.9 17.6 5 15.1 5 11.5Z" />
        <path {...common} d="M9 6.5C9.2 4.8 10.2 4 12 4c1.6 0 2.7.7 3.1 2M17 11h.1" />
      </svg>
    );
  }

  if (name === 'chat') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M4 5h13a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-5 4v-4a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z" />
        <path {...common} d="M7 10h7M7 13h4" />
      </svg>
    );
  }

  if (name === 'plan') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M8 3h8l1 3h2v15H5V6h2l1-3Z" />
        <path {...common} d="M9 10h6M9 14h6M9 18h4" />
      </svg>
    );
  }

  if (name === 'plane') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path {...common} d="M3 11.5 21 4l-7.5 18-3-7.5-7.5-3Z" />
        <path {...common} d="m10.5 14.5 4-4" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path {...common} d="M20.8 8.6c0 6.2-8.8 11.1-8.8 11.1S3.2 14.8 3.2 8.6A4.6 4.6 0 0 1 12 6.7a4.6 4.6 0 0 1 8.8 1.9Z" />
    </svg>
  );
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    setMatches(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'es';
  const stored = window.localStorage.getItem('meditourLanguage');
  if (stored === 'es' || stored === 'en') return stored;
  return window.navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'es';
}

export default function App() {
  const [chatOpen, setChatOpen] = useState(false);
  const [language, setLanguage] = useState(getInitialLanguage);
  const isMobile = useMediaQuery('(max-width: 640px)');
  const t = copy[language];
  const openChat = () => setChatOpen(true);
  const closeChat = () => setChatOpen(false);

  const onLanguageChange = (event) => setLanguage(event.target.value);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem('meditourLanguage', language);
  }, [language]);

  const footerYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <main className="site-shell">
      <header className="hero" id="inicio">
        <nav className="nav" aria-label="Main">
          <a className="brand" href="#inicio" aria-label="Meditour Costa Rica">
            <span className="brand-mark" aria-hidden="true">
              <Icon name="leaf" />
            </span>
            <span>
              <strong>Meditour</strong>
              <small>Costa Rica</small>
            </span>
          </a>

          <div className="nav-links">
            <a href="#inicio">{t.nav.home}</a>
            <a href="#tratamientos">{t.nav.treatments}</a>
            <a href="#destinos">{t.nav.destinations}</a>
            <a href="#costa-rica">{t.nav.why}</a>
            <a href="#nosotros">{t.nav.about}</a>
            <button type="button" onClick={openChat}>{t.nav.contact}</button>
          </div>

          <button className="nav-cta" type="button" onClick={openChat}>{t.nav.cta}</button>
          <label className="language-select" aria-label="Language selector">
            <span aria-hidden="true">{language === 'es' ? '🇪🇸' : '🇬🇧'}</span>
            <select value={language} onChange={onLanguageChange}>
              <option value="es">🇪🇸 ES</option>
              <option value="en">🇬🇧 EN</option>
            </select>
          </label>
        </nav>

        <div className="hero-content">
          <p className="eyebrow">{t.hero.kicker}</p>
          <h1>
            {t.hero.line1}
            <em> {t.hero.script1}</em>
            <span>{t.hero.line2}</span>
            <em> {t.hero.script2}</em>
          </h1>
          <p className="hero-copy">{t.hero.copy}</p>
          <div className="hero-actions">
            <button className="button primary" type="button" onClick={openChat}>{t.hero.cta}</button>
            <a className="button ghost" href="#nosotros">{t.hero.secondary}</a>
          </div>
        </div>
      </header>

      <section className="benefit-bar" id="tratamientos" aria-label={t.benefitsLabel}>
        {t.benefits.map((item) => (
          <article className="benefit" key={item.title}>
            <Icon name={item.icon} />
            <h2>{item.title}</h2>
            <p>{item.text}</p>
          </article>
        ))}
      </section>

      <section className="intro-section" id="nosotros">
        <div className="intro-copy">
          <p className="section-kicker">{t.intro.kicker}</p>
          <h2>{t.intro.title}</h2>
          <p>{t.intro.copy}</p>
          <ul>
            {t.intro.checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button className="button primary compact" type="button" onClick={openChat}>{t.intro.cta}</button>
        </div>
        <div className="intro-image">
          <img src={images.hero} alt={t.intro.imageAlt} />
        </div>
      </section>

      <section className="destinations" id="destinos">
        <p className="section-kicker center">{t.destinations.kicker}</p>
        <h2>{t.destinations.title}</h2>
        <div className="destination-grid">
          {t.destinations.items.map((item) => (
            <article className="destination-card" key={item.name}>
              <img src={item.image} alt={item.name} />
              <div>
                <h3>{item.name}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="journey" id="costa-rica">
        <p className="section-kicker center">{t.journey.kicker}</p>
        <h2>{t.journey.title}</h2>
        <div className="step-row">
          {t.journey.steps.map((step, index) => (
            <article className="step" key={step.title}>
              <span className="step-number">{index + 1}</span>
              <span className="step-icon"><Icon name={step.icon} /></span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div>
          <h2>
            {t.ctaBand.line}
            <em> {t.ctaBand.script}</em>
          </h2>
          <p>{t.ctaBand.copy}</p>
        </div>
        <div className="cta-actions">
          <button className="button primary" type="button" onClick={openChat}>{t.hero.cta}</button>
          <a className="contact-chip" href="tel:+50660401234">+506 6040 1234</a>
          <a className="contact-chip" href="mailto:info@meditourcr.com">info@meditourcr.com</a>
        </div>
      </section>

      <section className="chat-section" id="maia">
        <div className="chat-copy">
          <p className="section-kicker">{t.chat.kicker}</p>
          <h2>{t.chat.title}</h2>
          <p>{t.chat.copy}</p>
        </div>
        <button className="chat-preview" type="button" onClick={openChat}>
          <span className="chat-preview-icon"><Icon name="chat" /></span>
          <span>
            <strong>{t.chat.previewTitle}</strong>
            <small>{t.chat.previewText}</small>
          </span>
        </button>
      </section>

      <footer className="footer">
        <a className="brand" href="#inicio" aria-label="Meditour Costa Rica">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="leaf" />
          </span>
          <span>
            <strong>Meditour</strong>
            <small>Costa Rica</small>
          </span>
        </a>
        <div className="footer-links">
          <a href="#inicio">{t.nav.home}</a>
          <a href="#tratamientos">{t.nav.treatments}</a>
          <a href="#destinos">{t.nav.destinations}</a>
          <button type="button" onClick={openChat}>{t.nav.contact}</button>
        </div>
        <p>(c) {footerYear} Meditour Costa Rica. {t.footer}</p>
      </footer>

      <button className="floating-chat" type="button" onClick={openChat} aria-label={t.chat.openLabel}>
        <Icon name="chat" />
        <span>{t.chat.floating}</span>
      </button>

      {chatOpen && (
        <div className="chat-modal" role="dialog" aria-modal="true" aria-labelledby="chat-modal-title">
          <button className="chat-backdrop" type="button" onClick={closeChat} aria-label={t.chat.closeLabel} />
          <div className="chat-panel">
            <div className="chat-panel-head">
              <div>
                <p className="section-kicker">{t.chat.modalKicker}</p>
                <h2 id="chat-modal-title">{t.chat.modalTitle}</h2>
              </div>
              <button className="chat-close" type="button" onClick={closeChat} aria-label={t.chat.closeLabel}>x</button>
            </div>
            <MaiaChat isMobile={isMobile} />
          </div>
        </div>
      )}
    </main>
  );
}
