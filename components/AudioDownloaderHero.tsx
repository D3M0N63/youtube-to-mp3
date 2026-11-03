"use client";

import {
  AudioBitrate,
  AudioFormat,
  ConvertErrorResponse,
  ConvertResponse,
} from "@/types/audio";
import { AlertCircle, CheckCircle2, Download, Loader2 } from "lucide-react";
import { FormEvent, useState } from "react";

const BITRATES: AudioBitrate[] = [128, 192, 320];

export function AudioDownloaderHero() {
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState<AudioFormat>("MP3");
  const [bitrate, setBitrate] = useState<AudioBitrate>(192);
  const [status, setStatus] = useState<
    "idle" | "processing" | "ready" | "error"
  >("idle");
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>("audio.mp3");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const backendBase = (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(
    /\/+$/,
    ""
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim() || status === "processing") return;

    setStatus("processing");
    setErrorMessage(null);
    setDownloadLink(null);

    try {
      const res = await fetch(`${backendBase}/api/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          format,
          bitrate,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const err = data as ConvertErrorResponse;
        setStatus("error");
        setErrorMessage(err.error || "No se pudo procesar el audio.");
        return;
      }

      const result = data as ConvertResponse;
      const fullDownloadUrl = `${backendBase}${result.downloadUrl}`;
      setDownloadLink(fullDownloadUrl);
      setDownloadFilename(result.filename);
      setStatus("ready");

      // Iniciar descarga automáticamente cuando el archivo MP3 esté listo
      const anchor = document.createElement("a");
      anchor.href = fullDownloadUrl;
      anchor.download = result.filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error
          ? `Error de conexión con el servidor: ${err.message}`
          : "Error inesperado al procesar la solicitud."
      );
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0B0B0F] px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-[#7C3AED]/30 bg-[#13131C] p-6 shadow-2xl shadow-black/80 sm:p-8">
        <h1 className="text-center text-3xl font-black tracking-tight text-white sm:text-4xl">
          YOUTUBE TO <span className="text-[#7C3AED]">MP3</span>
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Campo de entrada */}
          <div>
            <label
              htmlFor="yt-url-input"
              className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]"
            >
              Enlace
            </label>
            <input
              id="yt-url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={status === "processing"}
              placeholder="Pega aquí el enlace de YouTube."
              className="w-full rounded-2xl border border-white/15 bg-[#09090D] px-4 py-4 text-sm text-white placeholder-[#A1A1AA]/60 transition-colors focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 disabled:opacity-60 sm:text-base"
            />
          </div>

          {/* Selector de formato y Selector de calidad */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="format-select"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]"
              >
                Formato
              </label>
              <select
                id="format-select"
                value={format}
                onChange={(e) => setFormat(e.target.value as AudioFormat)}
                disabled={status === "processing"}
                className="w-full rounded-2xl border border-white/15 bg-[#09090D] px-4 py-3.5 text-sm font-bold text-white focus:border-[#7C3AED] focus:outline-none"
              >
                <option value="MP3">MP3</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="bitrate-select"
                className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]"
              >
                Calidad
              </label>
              <select
                id="bitrate-select"
                value={bitrate}
                onChange={(e) =>
                  setBitrate(Number(e.target.value) as AudioBitrate)
                }
                disabled={status === "processing"}
                className="w-full rounded-2xl border border-white/15 bg-[#09090D] px-4 py-3.5 text-sm font-bold text-white focus:border-[#7C3AED] focus:outline-none"
              >
                {BITRATES.map((b) => (
                  <option key={b} value={b}>
                    {b} kbps
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Botón principal: DESCARGAR MP3 */}
          <button
            type="submit"
            disabled={status === "processing" || !url.trim()}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#7C3AED] px-6 py-4 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg shadow-[#7C3AED]/40 transition-all hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
          >
            {status === "processing" ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>PROCESANDO CON FFMPEG...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>DESCARGAR MP3</span>
              </>
            )}
          </button>
        </form>

        {/* Enlace directo de descarga cuando está listo */}
        {status === "ready" && downloadLink && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Archivo MP3 ({bitrate} kbps) generado.</span>
            </div>
            <a
              href={downloadLink}
              download={downloadFilename}
              className="rounded-xl bg-emerald-600 px-3 py-1.5 font-bold text-white transition-colors hover:bg-emerald-500"
            >
              Guardar archivo
            </a>
          </div>
        )}

        {/* Mensaje de error si ocurre */}
        {status === "error" && errorMessage && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
