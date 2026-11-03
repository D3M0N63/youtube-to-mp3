"use client";

import { formatBytes } from "@/lib/samples";
import { ProcessingStep } from "@/types/audio";
import {
  AlertTriangle,
  CheckCircle2,
  DownloadCloud,
  Loader2,
  Sparkles,
} from "lucide-react";

interface StatusStepIndicatorProps {
  step: ProcessingStep;
  progress: number;
  downloadedBytes: number;
  totalBytes: number | null;
}

const STEP_LABELS: Record<
  ProcessingStep,
  { title: string; subtitle: string; badge: string }
> = {
  idle: {
    title: "Esperando enlace de YouTube",
    subtitle: "Pega la URL de un video autorizado de YouTube para continuar.",
    badge: "Listo",
  },
  inspecting: {
    title: "Identificando video de YouTube...",
    subtitle:
      "Validando el enlace y obteniendo miniatura, título y duración del video...",
    badge: "Analizando",
  },
  ready: {
    title: "Video de YouTube identificado",
    subtitle:
      "Formato MP3 seleccionado. Elige la calidad (128, 192 o 320 kbps) y presiona DESCARGAR MP3.",
    badge: "MP3 Listo",
  },
  converting: {
    title: "Convirtiendo video a MP3...",
    subtitle:
      "Procesando flujo de audio MP3 en la calidad seleccionada...",
    badge: "Convirtiendo",
  },
  downloading: {
    title: "Descargando archivo MP3...",
    subtitle: "Transfiriendo el archivo de audio MP3 a tu dispositivo...",
    badge: "Descargando",
  },
  completed: {
    title: "¡Descarga MP3 completada!",
    subtitle:
      "El archivo MP3 se ha guardado en tu dispositivo. Puedes convertir otro enlace de YouTube.",
    badge: "100% Completado",
  },
  error: {
    title: "No se pudo completar la operación",
    subtitle: "Revisa los detalles del aviso a continuación.",
    badge: "Atención",
  },
};

export function StatusStepIndicator({
  step,
  progress,
  downloadedBytes,
  totalBytes,
}: StatusStepIndicatorProps) {
  if (step === "idle") {
    return null;
  }

  const current = STEP_LABELS[step];
  const isBusy =
    step === "inspecting" || step === "converting" || step === "downloading";

  return (
    <div
      role="status"
      aria-live="polite"
      className="animate-fade-in mt-5 w-full rounded-2xl border border-[#7C3AED]/30 bg-[#12121A] p-4 transition-all duration-300"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {isBusy && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED]/20 text-[#A78BFA]">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {step === "ready" && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED]/20 text-[#A78BFA]">
              <Sparkles className="h-4 w-4" />
            </div>
          )}
          {step === "completed" && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          )}
          {step === "error" && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">
                {current.title}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  step === "completed"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : step === "error"
                    ? "bg-rose-500/15 text-rose-300"
                    : "bg-[#7C3AED]/25 text-[#A78BFA]"
                }`}
              >
                {current.badge}
              </span>
            </div>
            <p className="text-xs text-[#A1A1AA]">{current.subtitle}</p>
          </div>
        </div>

        {(isBusy || step === "completed") && (
          <div className="flex items-center gap-2 text-xs font-bold text-[#A78BFA]">
            <DownloadCloud className="h-4 w-4" />
            <span>
              {downloadedBytes > 0
                ? `${formatBytes(downloadedBytes)}${
                    totalBytes ? ` / ${formatBytes(totalBytes)}` : ""
                  } (${progress}%)`
                : `${progress}%`}
            </span>
          </div>
        )}
      </div>

      {(isBusy || step === "completed") && (
        <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-[#0B0B0F]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              step === "completed"
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : "bg-gradient-to-r from-[#7C3AED] to-[#A78BFA]"
            }`}
            style={{ width: `${Math.max(8, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
}
