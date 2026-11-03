# YOUTUBE TO MP3 — Web App (Next.js + TypeScript + Tailwind CSS)

Aplicación web especializada en enlaces de **videos de YouTube** para obtener archivos de audio en formato **MP3** (`128 kbps`, `192 kbps` y `320 kbps`) a partir de contenidos autorizados, sin requerir claves API externas, preparada para desplegarse en **Vercel** y **Netlify**.

---

## 1. Funcionamiento del Flujo YouTube to MP3

1. **Validación estricta de enlaces de YouTube (`lib/security.ts`)**:
   - El sistema acepta únicamente URLs válidas de YouTube (`youtube.com/watch?v=...`, `youtu.be/...`, `youtube.com/shorts/...`, `m.youtube.com/...`) y extrae el identificador único de 11 caracteres (`videoId`).
2. **Obtención de Miniatura, Título, Canal y Duración (`services/metadata-inspector.service.ts`)**:
   - Consulta en tiempo real la API pública oficial **YouTube oEmbed** (`https://www.youtube.com/oembed`) y el repositorio autorizado (`archive.org/metadata/youtube-{videoId}`) sin necesidad de claves API.
3. **Selección de Calidad MP3 (`components/AudioResultCard.tsx`)**:
   - Presenta el formato de salida **MP3** y permite elegir entre **128 kbps**, **192 kbps** y **320 kbps**.
4. **Conversión y Descarga Real (`services/audio-processor.service.ts` + `app/api/audio/stream/route.ts`)**:
   - Al pulsar **DESCARGAR MP3**, el backend transfiere el archivo binario `.mp3` real hacia el navegador mostrando el progreso byte a byte (`ReadableStream`).

---

## 2. Instalación y Uso Local

```bash
npm install
npm run dev
```

Abre `http://localhost:3000` en tu navegador.
