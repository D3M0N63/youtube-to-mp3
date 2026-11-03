"use client";

import { useAudioDownloader } from "@/hooks/useAudioDownloader";
import { useConversionHistory } from "@/hooks/useConversionHistory";
import {
  AlertCircle,
  Check,
  ClipboardPaste,
  Loader2,
  PlaySquare,
  Sparkles,
  X,
} from "lucide-react";
import { FormEvent, useState } from "react";
import { AudioResultCard } from "./AudioResultCard";
import { ConversionHistory } from "./ConversionHistory";
import { StatusStepIndicator } from "./StatusStepIndicator";

export function AudioDownloaderHero() {
  const { history, addHistoryItem, removeHistoryItem, clearHistory } =
    useConversionHistory();

  const {
    url,
    setUrl,
    step,
    metadata,
    selectedBitrate,
    setSelectedBitrate,
    progress,
    downloadedBytes,
    totalBytes,
    errorMessage,
    providerNotice,
    inspectYouTubeVideo,
    downloadMp3,
    resetState,
  } = useAudioDownloader({
    onDownloadSuccess: ({ metadata: meta, bitrate }) => {
      addHistoryItem({
        videoId: meta.videoId,
        title: meta.title,
        channelTitle: meta.channelTitle,
        thumbnailUrl: meta.thumbnailUrl,
        formattedDuration: meta.formattedDuration,
        bitrate,
        youtubeUrl: meta.canonicalWatchUrl,
      });
    },
  });

  const [clipboardCopiedFeedback, setClipboardCopiedFeedback] = useState(false);
  const [clipboardError, setClipboardError] = useState<string | null>(null);

  const isBusy =
    step === "inspecting" || step === "converting" || step === "downloading";

  const handlePasteFromClipboard = async () => {
    setClipboardError(null);
    try {
      if (!navigator.clipboard?.readText) {
        setClipboardError(
          "Tu navegador requiere pegar manualmente con Ctrl+V / Cmd+V."
        );
        return;
      }
      const text = await navigator.clipboard.readText();
      if (text && text.trim()) {
        setUrl(text.trim());
        setClipboardCopiedFeedback(true);
        setTimeout(() => setClipboardCopiedFeedback(false), 2000);
      }
    } catch {
      setClipboardError(
        "Permiso de portapapeles denegado. Usa Ctrl+V o mantén presionado en el campo."
      );
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isBusy) return;
    await inspectYouTubeVideo();
  };

  return (
    <section
      id="inicio"
      className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24"
    >
      {/* Resplandor violeta central sobre fondo negro */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-36 left-1/2 -z-10 h-[440px] w-[820px] -translate-x-1/2 rounded-full bg-[#7C3AED]/25 blur-[140px]"
      />

      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Encabezado Principal */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#7C3AED]/40 bg-[#13131C] px-4 py-1.5 text-xs font-semibold text-[#A78BFA]">
            <Sparkles className="h-3.5 w-3.5 text-[#7C3AED]" />
            <span>FFmpeg Local · 128 kbps · 192 kbps · 320 kbps</span>
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-6xl">
            YOUTUBE TO{" "}
            <span className="bg-gradient-to-r from-[#7C3AED] to-[#A78BFA] bg-clip-text text-transparent">
              MP3
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base text-[#A1A1AA] sm:text-lg">
            Convierte contenido autorizado de YouTube a MP3.
          </p>
        </div>

        {/* Caja central del convertidor YouTube a MP3 */}
        <div className="mt-10 rounded-3xl border border-[#7C3AED]/30 bg-[#13131C]/95 p-4 shadow-2xl shadow-[#7C3AED]/10 backdrop-blur-md sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative flex flex-col gap-3 sm:flex-row">
              {/* Campo central grande para pegar enlaces de YouTube */}
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#A78BFA]">
                  <PlaySquare className="h-5 w-5" />
                </div>

                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isBusy}
                  placeholder="Pega aquí el enlace de YouTube..."
                  aria-label="Pega aquí el enlace de YouTube"
                  className="w-full rounded-2xl border border-white/15 bg-[#09090D] py-4 pl-12 pr-24 text-sm text-white placeholder-[#A1A1AA]/65 transition-all focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/50 disabled:opacity-60 sm:py-5 sm:text-base"
                />

                {/* Botones limpiar y pegar dentro del campo */}
                <div className="absolute inset-y-0 right-2.5 flex items-center gap-1">
                  {url && !isBusy && (
                    <button
                      type="button"
                      onClick={() => {
                        setUrl("");
                        resetState();
                      }}
                      title="Limpiar enlace"
                      aria-label="Limpiar enlace"
                      className="rounded-xl p-2 text-[#A1A1AA] transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    disabled={isBusy}
                    title="Pegar enlace desde el portapapeles"
                    aria-label="Pegar enlace desde el portapapeles"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#7C3AED]/30 bg-[#17171F] px-3 py-2 text-xs font-semibold text-[#A78BFA] transition-all hover:border-[#7C3AED] hover:bg-[#7C3AED]/20 hover:text-white disabled:opacity-50"
                  >
                    {clipboardCopiedFeedback ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-400" />
                        <span className="hidden sm:inline">Pegado</span>
                      </>
                    ) : (
                      <>
                        <ClipboardPaste className="h-4 w-4" />
                        <span className="hidden sm:inline">Pegar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Botón violeta destacado: CONVERTIR A MP3 */}
              <button
                type="submit"
                disabled={isBusy || !url.trim()}
                className="inline-flex shrink-0 items-center justify-center gap-2.5 rounded-2xl bg-[#7C3AED] px-8 py-4 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg shadow-[#7C3AED]/40 transition-all duration-200 hover:bg-[#6D28D9] hover:shadow-[#7C3AED]/60 focus:outline-none focus:ring-2 focus:ring-[#A78BFA] disabled:cursor-not-allowed disabled:opacity-50 sm:py-5 sm:text-base"
              >
                {step === "inspecting" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>ANALIZANDO...</span>
                  </>
                ) : (
                  <span>CONVERTIR A MP3</span>
                )}
              </button>
            </div>

            {clipboardError && (
              <p className="text-xs text-amber-400">{clipboardError}</p>
            )}
          </form>

          {/* Indicador de progreso y estado real */}
          <StatusStepIndicator
            step={step}
            progress={progress}
            downloadedBytes={downloadedBytes}
            totalBytes={totalBytes}
          />

          {/* Mensajes de error claros */}
          {step === "error" && errorMessage && (
            <div
              role="alert"
              className="animate-fade-in mt-5 flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
              <div className="space-y-1">
                <p className="font-bold text-white">
                  Enlace sin fuente de descarga autorizada
                </p>
                <p className="text-xs leading-relaxed text-rose-200/90">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Tarjeta del video de YouTube */}
          {metadata && (
            <AudioResultCard
              metadata={metadata}
              selectedBitrate={selectedBitrate}
              onSelectBitrate={setSelectedBitrate}
              onDownload={downloadMp3}
              step={step}
              providerNotice={providerNotice}
            />
          )}
        </div>
      </div>

      {/* Historial local de videos de YouTube convertidos */}
      <ConversionHistory
        history={history}
        onSelectUrl={(selectedUrl) => inspectYouTubeVideo(selectedUrl)}
        onRemoveItem={removeHistoryItem}
        onClearAll={clearHistory}
      />
    </section>
  );
}
