# YOUTUBE TO MP3 — Web App (Next.js + TypeScript + Tailwind CSS)

Aplicación web especializada en enlaces de **videos de YouTube** para obtener archivos de audio en formato **MP3** (`128 kbps`, `192 kbps` y `320 kbps`) a partir de contenidos propios, Creative Commons o autorizados, preparada para desplegarse en **Vercel** y **Netlify**.

---

## 1. Funcionamiento del Flujo YouTube to MP3

1. **Validación estricta de enlaces de YouTube (`lib/security.ts`)**:
   - El sistema acepta únicamente URLs válidas de YouTube (`youtube.com/watch?v=...`, `youtu.be/...`, `youtube.com/shorts/...`, `m.youtube.com/...`) y extrae el identificador único de 11 caracteres (`videoId`).
   - Cualquier enlace que no pertenezca a YouTube es rechazado de inmediato en cliente y servidor.
2. **Obtención de Miniatura, Título, Canal y Duración (`services/metadata-inspector.service.ts`)**:
   - Consulta en tiempo real la API pública oficial **YouTube oEmbed** (`https://www.youtube.com/oembed`) para recuperar el título real del video, el nombre del canal y la miniatura oficial (`i.ytimg.com`).
   - Consulta en paralelo **YouTube Data API v3** (cuando se configura `YOUTUBE_DATA_API_KEY`) y el repositorio de preservación autorizada (`archive.org/metadata/youtube-{videoId}`) para obtener la duración exacta del video y verificar si existe un flujo de audio autorizado disponible.
3. **Selección de Calidad MP3 (`components/AudioResultCard.tsx`)**:
   - Presenta el formato de salida **MP3** y permite elegir entre:
     - **128 kbps**
     - **192 kbps**
     - **320 kbps**
4. **Conversión y Descarga Real (`services/audio-processor.service.ts` + `app/api/audio/stream/route.ts`)**:
   - Al pulsar **DESCARGAR MP3**, el backend procesa el audio mediante el proveedor autorizado configurado y transfiere el archivo binario `.mp3` real hacia el navegador mostrando el progreso byte a byte (`ReadableStream`), sin simular conversiones ni descargas.

---

## 2. Qué funciona sin credenciales y qué requiere servicios externos

| Funcionalidad | ¿Requiere credenciales externas? | Detalle técnico |
| :--- | :--- | :--- |
| **Validación de enlaces de YouTube** | **No** | Validación nativa de `youtube.com` / `youtu.be` y extracción de `videoId`. |
| **Miniatura, Título y Canal de cualquier video público de YouTube** | **No** | Utiliza la API oficial pública **YouTube oEmbed** (`youtube.com/oembed`). |
| **Duración y descarga MP3 real de videos de YouTube con espejo autorizado** | **No** | Funciona de inmediato con videos de YouTube que cuentan con espejo autorizado en `archive.org/metadata/youtube-{videoId}` (incluyendo los 3 videos de YouTube reales integrados en la interfaz para pruebas). |
| **Duración exacta ISO-8601 y licencia de cualquier video de YouTube** | **Sí (`YOUTUBE_DATA_API_KEY`)** | Requiere clave de **YouTube Data API v3** en Google Cloud Console. |
| **Conversión a MP3 de cualquier video autorizado de YouTube sin espejo público** | **Sí (`AUTHORIZED_YT_API_URL` + `AUTHORIZED_YT_API_KEY`)** | Como la aplicación no implementa evasión de protecciones de YouTube, para convertir videos arbitrarios requiere conectar un proveedor/API externo autorizado. |
| **Recodificación dedicada a 128 / 192 / 320 kbps en la nube** | **Sí (`CLOUDCONVERT_API_KEY`)** | Opcional. Recodifica el flujo de audio autorizado al bitrate exacto usando CloudConvert API v2 sin consumir CPU en funciones Serverless. |

---

## 3. Instalación y Uso Local

```bash
# 1. Instalar dependencias
npm install

# 2. (Opcional) Configurar variables de entorno
cp .env.example .env.local

# 3. Iniciar servidor de desarrollo
npm run dev
```

Abre `http://localhost:3000` en tu navegador.

---

## 4. Despliegue en Vercel y Netlify

- **Vercel**: Incluye [`vercel.json`](./vercel.json) con límites `maxDuration` configurados para `/api/audio/inspect`, `/api/audio/convert` y `/api/audio/stream`.
- **Netlify**: Incluye [`netlify.toml`](./netlify.toml) listo para construir con Next.js Runtime (`npm run build`).
