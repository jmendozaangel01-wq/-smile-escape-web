# Smile & Escape — Landing

Scroll-driven landing page for **Smile & Escape** (AI-assisted dental tourism, Costa Rica),
rebuilt from a single-file export into a real **React + Vite + Tailwind** project.

## What changed vs. the original standalone HTML

- **Images are real files, not base64.** The 3.8 MB inline payload is gone. Hero frames now
  live in `public/frames/` as WebP and load progressively with browser caching.
- **Sharper hero.** The inline export shipped downscaled 480×852 frames (that's what looked
  blurry). This build uses the 1080×1916 originals, re-encoded to WebP (~74 KB each vs. 170 KB JPG).
- **Lighter.** The "dentist POV / services" scroll sequence (a second 60-frame set) was removed
  on purpose to cut weight and speed up load.
- **Same motion.** GSAP + ScrollTrigger + Lenis drive the exact same pinned canvas sequence,
  chapter cross-fades, reveals, before/after sliders, and team carousel.

## Stack

- React 18 + Vite 5
- GSAP + ScrollTrigger (scroll-scrubbed canvas + reveals)
- Lenis (smooth scroll)
- Tailwind CSS (configured and available; existing styles are kept inline)

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build locally
```

## Regenerate optimized images (optional)

The `public/frames` and `public/images` assets are already generated and committed.
To rebuild them from the source frames, run:

```bash
node scripts/build-assets.mjs
```

> This script reads from the sibling `../frames`, `../before-after`, and the original
> bundle HTML. It is only needed if you want to re-encode the assets — it is **not**
> part of the normal build.

## Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Import it in Vercel — framework preset **Vite** is auto-detected
   (build: `vite build`, output: `dist`).
3. Deploy. `vercel.json` sets long-lived caching for `/frames` and `/images`.

## Notes

- The hero frames carry a "KlingAI 3.0" watermark from the original source render.
  Replace the files in `public/frames/` with clean renders to remove it.
- `Talk to Maia` / CTA buttons currently anchor to the `#maia` chat mockup section.
  Wire them to a real destination when the booking flow exists.
