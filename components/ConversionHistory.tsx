"use client";

import { ConversionHistoryItem } from "@/types/audio";
import { Clock, History, RotateCcw, Trash2 } from "lucide-react";

interface ConversionHistoryProps {
  history: ConversionHistoryItem[];
  onSelectUrl: (url: string) => void;
  onRemoveItem: (videoId: string, downloadedAt: string) => void;
  onClearAll: () => void;
}

export function ConversionHistory({
  history,
  onSelectUrl,
  onRemoveItem,
  onClearAll,
}: ConversionHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Conversiones recientes de YouTube a MP3"
      className="mx-auto mt-10 max-w-4xl px-4 sm:px-6"
    >
      <div className="rounded-3xl border border-white/10 bg-[#13131C]/90 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]/20 text-[#A78BFA]">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Videos convertidos recientemente
              </h3>
              <p className="text-xs text-[#A1A1AA]">
                Guardado en tu navegador
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#0B0B0F] px-3 py-1.5 text-xs font-medium text-[#A1A1AA] transition-colors hover:border-rose-500/40 hover:text-rose-300"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Limpiar</span>
          </button>
        </div>

        <div className="mt-4 divide-y divide-white/5">
          {history.map((item) => (
            <div
              key={`${item.videoId}-${item.downloadedAt}`}
              className="flex flex-col justify-between gap-3 py-3 sm:flex-row sm:items-center"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                {/* Miniatura pequeña */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.thumbnailUrl}
                  alt={item.title}
                  className="h-12 w-20 shrink-0 rounded-lg border border-white/10 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                      {item.title}
                    </span>
                    <span className="shrink-0 rounded bg-[#7C3AED]/25 px-2 py-0.5 text-[10px] font-bold text-[#A78BFA]">
                      MP3 · {item.bitrate} kbps
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[#A1A1AA]">
                    <span>{item.channelTitle}</span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.formattedDuration}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => onSelectUrl(item.youtubeUrl)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#7C3AED]/40 bg-[#7C3AED]/15 px-3 py-1.5 text-xs font-semibold text-[#A78BFA] transition-colors hover:bg-[#7C3AED] hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Convertir de nuevo</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onRemoveItem(item.videoId, item.downloadedAt)
                  }
                  aria-label={`Eliminar ${item.title} del historial`}
                  className="rounded-xl p-1.5 text-[#A1A1AA] transition-colors hover:bg-white/5 hover:text-rose-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
