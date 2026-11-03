# YOUTUBE TO MP3

Aplicación minimalista para convertir y descargar audio en formato **MP3** (`128 kbps`, `192 kbps`, `320 kbps`) a partir de enlaces de contenido autorizado utilizando **FFmpeg instalado localmente en el backend**, sin depender de APIs comerciales ni claves externas.

---

## 1. Arquitectura

- **Frontend**: Next.js, TypeScript y Tailwind CSS (preparado para desplegarse en Vercel o junto al backend).
- **Backend**: Node.js + FFmpeg local (`/api/convert` y `/api/download/[fileId]`), preparado para ejecutarse en un **VPS Ubuntu**.
- **Limpieza automática**: Los archivos temporales generados en `/tmp/ytmp3-temp` se eliminan automáticamente tras cumplir su tiempo de expiración (`TEMP_FILE_TTL_SECONDS`, por defecto 300 segundos).

---

## 2. Requisitos en VPS Ubuntu / Local

1. **Node.js 20+**
2. **FFmpeg instalado en el sistema**:
   ```bash
   sudo apt update && sudo apt install -y ffmpeg
   ```

---

## 3. Instalación y Ejecución

```bash
npm install
npm run dev
```

Para producción en un **VPS Ubuntu**:
```bash
npm run build
npm run start
```

Si despliegas únicamente el **Frontend en Vercel** y el **Backend en un VPS Ubuntu**, configura en Vercel la variable `NEXT_PUBLIC_BACKEND_URL=https://tu-vps-ubuntu.com`.
