/**
 * One-off asset pipeline for Smile & Escape.
 * - Hero frames: sharp 1080x1916 originals from ../../frames -> WebP
 * - Before/After: high-res PNGs from ../../before-after -> WebP
 * - Team headshots: extracted from the original bundle manifest -> WebP
 * Run once with: node scripts/build-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(projectRoot, '..');
const framesSrc = path.join(repoRoot, 'frames');
const baSrc = path.join(repoRoot, 'before-after');
const bundlePath = path.join(repoRoot, 'Smile & Escape Landing (standalone).html');

const framesOut = path.join(projectRoot, 'public', 'frames');
const imagesOut = path.join(projectRoot, 'public', 'images');
fs.mkdirSync(framesOut, { recursive: true });
fs.mkdirSync(imagesOut, { recursive: true });

const WEBP = { quality: 82, effort: 4 };

async function buildFrames() {
  const files = fs.readdirSync(framesSrc).filter((f) => /^frame\d{3}\.jpg$/i.test(f)).sort();
  let bytes = 0;
  for (const f of files) {
    const out = path.join(framesOut, f.replace(/\.jpg$/i, '.webp'));
    await sharp(path.join(framesSrc, f)).webp(WEBP).toFile(out);
    bytes += fs.statSync(out).size;
  }
  console.log(`frames: ${files.length} -> WebP (${(bytes / 1e6).toFixed(2)} MB total)`);
}

async function buildBeforeAfter() {
  const map = {
    'whitening-before.png': 'whitening-before.webp',
    'whitening-after.png': 'whitening-after.webp',
    'dentalimplantbefore.png': 'implant-before.webp',
    'dentalimplantafter.png': 'implant-after.webp',
  };
  for (const [src, dst] of Object.entries(map)) {
    const p = path.join(baSrc, src);
    if (!fs.existsSync(p)) { console.warn('missing before/after:', src); continue; }
    // Cap very large exports at 1400px wide; the cards render ~620px.
    await sharp(p).resize({ width: 1400, withoutEnlargement: true }).webp(WEBP).toFile(path.join(imagesOut, dst));
  }
  console.log('before/after: 4 -> WebP');
}

async function buildTeam() {
  const lines = fs.readFileSync(bundlePath, 'utf8').split(/\r?\n/);
  const manifest = JSON.parse(lines[171]);
  const ext = JSON.parse(lines[175]);
  const byId = Object.fromEntries(ext.map((e) => [e.id, e.uuid]));
  const team = {
    teamCamila: 'team-camila.webp',
    teamSofia: 'team-sofia.webp',
    teamCosme: 'team-cosme.webp',
    teamSaulo: 'team-saulo.webp',
  };
  for (const [id, dst] of Object.entries(team)) {
    const asset = manifest[byId[id]];
    if (!asset) { console.warn('missing team asset:', id); continue; }
    const buf = Buffer.from(asset.data, 'base64');
    await sharp(buf).webp(WEBP).toFile(path.join(imagesOut, dst));
  }
  console.log('team: 4 -> WebP');
}

await buildFrames();
await buildBeforeAfter();
await buildTeam();
console.log('Done.');
