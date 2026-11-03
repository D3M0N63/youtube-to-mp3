"use client";

import { formatBytes } from "@/lib/samples";
import {
  AudioBitrate,
  ProcessingStep,
  YouTubeVideoMetadata,
} from "@/types/audio";
import {
  Check,
  Clock,
  Download,
  ExternalLink,
  FileAudio,
  Info,
  Loader2,
  Sliders,
  Tv,
} from "lucide-react";
import { useState } from "react";

interface AudioResultCardProps {
  metadata: YouTubeVideoMetadata;
  selectedBitrate: AudioBitrate;
  onSelectBitrate: (bitrate: AudioBitrate) => void;
  onDownload: () => void;
  step: ProcessingStep;
  providerNotice: string | null;
}

export function AudioResultCard({
  metadata,
  selectedBitrate,
  onSelectBitrate,
  onDownload,
  step,
  providerNotice,
}: AudioResultCardProps) {
  const [imgError, setImgError] = useState(false);
  const isBusy = step === "converting" || step === "downloading";

  return (
    <div className="animate-fade-in mt-6 overflow-hidden rounded-3xl border border-[#7C3AED]/30 bg-[#13131C] p-5 shadow-2xl shadow-black/70 sm:p-7">
      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        {/* Miniatura 16:9 del video de YouTube */}
        <div className="relative w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0B0B0F] shadow-xl md:w-72">
          <div className="aspect-video w-full">
            {!imgError && metadata.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={metadata.thumbnailUrl}
                alt={`Miniatura de ${metadata.title}`}
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#0B0B0F] text-[#A78BFA]">
                <FileAudio className="h-12 w-12 opacity-70" />
              </div>
            )}
          </div>

          {/* Badge de duración en la esquina inferior derecha estilo YouTube */}
          <div className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-md bg-black/85 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
            <Clock className="h-3 w-3 text-[#A78BFA]" />
            <span>{metadata.formattedDuration}</span>
          </div>

          {/* Etiqueta de formato MP3 en la esquina superior izquierda */}
          <div className="absolute top-2.5 left-2.5 rounded-md bg-[#7C3AED] px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-white shadow">
            FORMATO: {metadata.format}
          </div>
        </div>

        {/* Detalles del video y selector de calidad MP3 */}
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#7C3AED]/40 bg-[#7C3AED]/15 px-3 py-0.5 text-xs font-semibold text-[#A78BFA]">
                <FileAudio className="h-3.5 w-3.5" />
                Audio {metadata.format}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] text-[#A1A1AA]">
                ID: {metadata.videoId}
              </span>
            </div>

            <h2 className="mt-2.5 text-lg font-bold leading-snug text-white sm:text-xl">
              {metadata.title}
            </h2>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#A1A1AA]">
              <span className="inline-flex items-center gap-1.5 font-medium text-white/90">
                <Tv className="h-4 w-4 text-[#A78BFA]" />
                {metadata.channelTitle}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-xs">
                <Clock className="h-3.5 w-3.5 text-[#A78BFA]" />
                Duración: {metadata.formattedDuration}
              </span>
            </div>
          </div>

          {/* Selector de calidad: 128 kbps, 192 kbps, 320 kbps */}
          <div className="mt-5">
            <label className="mb-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
              <Sliders className="h-3.5 w-3.5 text-[#A78BFA]" />
              Calidad de audio MP3
            </label>

            <div className="grid grid-cols-3 gap-2.5">
              {metadata.qualities.map((q) => {
                const isSelected = selectedBitrate === q.bitrate;
                return (
                  <button
                    key={q.bitrate}
                    type="button"
                    disabled={isBusy}
                    onClick={() => onSelectBitrate(q.bitrate)}
                    className={`relative flex flex-col items-start rounded-xl border p-3 text-left transition-all duration-200 ${
                      isSelected
                        ? "border-[#7C3AED] bg-[#7C3AED]/20 shadow-md shadow-[#7C3AED]/20"
                        : "border-white/10 bg-[#0B0B0F] hover:border-[#7C3AED]/50 hover:bg-white/[0.03]"
                    } ${isBusy ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={`text-sm font-extrabold ${
                          isSelected ? "text-white" : "text-white/85"
                        }`}
                      >
                        {q.label}
                      </span>
                      {isSelected && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#7C3AED] text-white">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                    <span className="mt-1 text-[11px] text-[#A1A1AA]">
                      {q.estimatedSizeBytes
                        ? `~${formatBytes(q.estimatedSizeBytes)}`
                        : q.description.split("·")[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {!metadata.authorizedAudioAvailable && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <span>
                Este video fue identificado mediante YouTube oEmbed, pero no
                cuenta con un flujo de audio de libre descarga disponible.
              </span>
            </div>
          )}

          {providerNotice && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#7C3AED]/30 bg-[#7C3AED]/10 px-3.5 py-2.5 text-xs text-[#A78BFA]">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{providerNotice}</span>
            </div>
          )}

          {/* Botón principal: DESCARGAR MP3 */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onDownload}
              disabled={isBusy}
              className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-2xl bg-[#7C3AED] px-6 py-4 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg shadow-[#7C3AED]/40 transition-all duration-200 hover:bg-[#6D28D9] hover:shadow-[#7C3AED]/60 focus:outline-none focus:ring-2 focus:ring-[#A78BFA] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>
                    {step === "converting"
                      ? "CONVIRTIENDO..."
                      : "DESCARGANDO MP3..."}
                  </span>
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  <span>DESCARGAR MP3 ({selectedBitrate} kbps)</span>
                </>
              )}
            </button>

            <a
              href={metadata.canonicalWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-[#0B0B0F] px-4 py-4 text-xs font-semibold text-[#A1A1AA] transition-colors hover:border-[#7C3AED]/40 hover:text-white"
            >
              <span>Ver en YouTube</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
