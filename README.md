# Meditour Costa Rica Landing

Landing page para turismo medico y dental en Costa Rica, construida con
React + Vite. El sitio incluye diseno visual inspirado en la referencia de
Meditour Costa Rica, selector de idioma Espanol/Ingles, assets locales y el
chat Maia ya integrado.

## Lo importante

- La integracion del chat vive en `src/MaiaChat.jsx`.
- No borres ni cambies los webhooks de Maia si quieres conservar el chat:
  - `START_URL`
  - `CHAT_URL`
  - `AGENT_ID`
- La landing abre el chat como modal/burbuja desde los CTA principales.
- El idioma se maneja en `src/App.jsx` con un diccionario interno `es/en`.
- La preferencia de idioma se guarda en `localStorage` con la llave
  `meditourLanguage`.

## Requisitos

Instala Node.js 18 o superior.

Puedes usar `npm` o `pnpm`. Si vas a subirlo al repositorio original, usa el
mismo manejador que ya use ese repo. Este paquete incluye `package-lock.json`
y `pnpm-lock.yaml`, pero no incluye `node_modules`.

## Instalacion local

Con npm:

```bash
npm install
npm run dev
```

Con pnpm:

```bash
pnpm install
pnpm run dev
```

Luego abre la URL que muestre Vite, normalmente:

```text
http://localhost:5173
```

Si ese puerto esta ocupado, Vite usara otro puerto automaticamente.

## Build de produccion

Con npm:

```bash
npm run build
```

Con pnpm:

```bash
pnpm run build
```

El resultado queda en:

```text
dist/
```

Para probar el build localmente:

```bash
npm run preview
```

o:

```bash
pnpm run preview
```

## Despliegue recomendado en Vercel

1. Sube esta carpeta al repositorio original de GitHub.
2. En Vercel, importa el repositorio.
3. Selecciona framework preset: `Vite`.
4. Usa estos valores:

```text
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Si usas pnpm:

```text
Build Command: pnpm run build
Output Directory: dist
Install Command: pnpm install
```

5. Despliega.

El archivo `vercel.json` ya esta incluido y configura cache para assets en
`/frames` e `/images`.

## Despliegue en Netlify

1. Sube el proyecto al repositorio.
2. Crea un nuevo sitio desde Git.
3. Usa:

```text
Build command: npm run build
Publish directory: dist
```

Con pnpm:

```text
Build command: pnpm run build
Publish directory: dist
```

## Estructura principal

```text
src/
  App.jsx        Landing, textos ES/EN, modal del chat
  MaiaChat.jsx   Integracion real del chat Maia
  index.css      Estilos globales y responsive

public/
  images/        Imagenes de hero y destinos
  frames/        Assets existentes del proyecto original

dist/            Build generado, se puede regenerar
```

## Cambiar textos o traducciones

Edita `src/App.jsx`, objeto `copy`.

Ejemplo:

```js
const copy = {
  es: { ... },
  en: { ... },
};
```

No necesitas instalar una libreria de i18n para este sitio, porque la landing
es pequena y el selector actual cambia todo al instante.

## Cambiar imagenes

Las imagenes nuevas estan en:

```text
public/images/
```

Archivos principales:

```text
costa-rica-hero.png
destination-tamarindo.png
destination-monteverde.png
destination-manuel-antonio.png
destination-san-jose.png
```

Si reemplazas una imagen, conserva el mismo nombre de archivo o actualiza la
ruta en `src/App.jsx`.

## Chat Maia

El chat esta pensado para mantenerse sin cambios en `src/MaiaChat.jsx`.

La landing solo renderiza:

```jsx
<MaiaChat isMobile={isMobile} />
```

Esto significa que puedes redisenar la pagina sin romper la conexion mientras
no cambies la logica interna de `MaiaChat.jsx`.

## Subir al repositorio original

Desde el equipo donde tengas GitHub configurado:

```bash
git status
git add .
git commit -m "Redesign Meditour landing with bilingual chat CTA"
git push
```

Si prefieres rama nueva:

```bash
git checkout -b landing-meditour-redesign
git add .
git commit -m "Redesign Meditour landing with bilingual chat CTA"
git push -u origin landing-meditour-redesign
```

## Notas

- No subas `node_modules`.
- El zip entregado ya excluye `node_modules`.
- Si cambias el chat, prueba primero en local antes de desplegar.
- Si el navegador conserva un idioma anterior, borra `localStorage` o cambia el
  selector de idioma en el header.
