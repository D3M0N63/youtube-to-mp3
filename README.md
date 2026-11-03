# YOUTUBE TO MP3 — Web App (Next.js + TypeScript + Tailwind CSS + FFmpeg)

Aplicación web para trabajar con enlaces de **YouTube** y convertir a formato **MP3** (`128 kbps`, `192 kbps` y `320 kbps`) los archivos de audio/video que el usuario tenga autorización para descargar, utilizando **FFmpeg instalado localmente** en el backend.

---

## 1. Arquitectura Separada (Sin Mirrors ni APIs Comerciales)

1. **Inspección Oficial (`services/metadata-inspector.service.ts`)**:
   - Valida el enlace de YouTube (`youtube.com/watch?v=...`, `youtu.be/...`) y consulta únicamente la API pública oficial **YouTube oEmbed** (`https://www.youtube.com/oembed`) para mostrar el título, el canal y la miniatura oficial.
   - No busca mirrors en Internet Archive (`archive.org`) ni en servidores de terceros.
2. **Descarga / Adquisición Autorizada (`services/authorized-downloader.service.ts`)**:
   - Módulo separado de la conversión que verifica si el video cuenta con un archivo de origen autorizado en `authorized-media/<videoId>.*` o una URL directa autorizada.
   - Si el enlace no cuenta con una fuente de descarga autorizada, informa claramente al usuario sin eludir las restricciones de YouTube.
3. **Conversión a MP3 con FFmpeg Local (`services/ffmpeg-converter.service.ts`)**:
   - Módulo dedicado exclusivamente a codificar el archivo autorizado a **MP3** (`libmp3lame`) en el bitrate elegido (`128 kbps`, `192 kbps` o `320 kbps`) y limpiar automáticamente los archivos temporales tras su expiración.
