"use client";

import { parseAndValidateYouTubeUrl } from "@/lib/security";
import {
  ApiErrorResponse,
  AudioBitrate,
  ConvertYouTubeResponse,
  ProcessingStep,
  YouTubeVideoMetadata,
} from "@/types/audio";
import { useCallback, useState } from "react";

interface UseAudioDownloaderOptions {
  onDownloadSuccess?: (params: {
    metadata: YouTubeVideoMetadata;
    bitrate: AudioBitrate;
  }) => void;
}

export function useAudioDownloader(options?: UseAudioDownloaderOptions) {
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<ProcessingStep>("idle");
  const [metadata, setMetadata] = useState<YouTubeVideoMetadata | null>(null);
  const [selectedBitrate, setSelectedBitrate] = useState<AudioBitrate>(192);
  const [progress, setProgress] = useState<number>(0);
  const [downloadedBytes, setDownloadedBytes] = useState<number>(0);
  const [totalBytes, setTotalBytes] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [providerNotice, setProviderNotice] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setStep("idle");
    setMetadata(null);
    setProgress(0);
    setDownloadedBytes(0);
    setTotalBytes(null);
    setErrorMessage(null);
    setErrorCode(null);
    setProviderNotice(null);
  }, []);

  const inspectYouTubeVideo = useCallback(
    async (overrideUrl?: string) => {
      const targetUrl = (overrideUrl !== undefined ? overrideUrl : url).trim();
      if (overrideUrl !== undefined) {
        setUrl(overrideUrl);
      }

      setErrorMessage(null);
      setErrorCode(null);
      setProviderNotice(null);
      setProgress(0);
      setDownloadedBytes(0);
      setTotalBytes(null);

      // Validación inmediata en frontend de que sea un enlace de YouTube
      const ytCheck = parseAndValidateYouTubeUrl(targetUrl);
      if (!ytCheck.valid) {
        setMetadata(null);
        setStep("error");
        setErrorCode(ytCheck.errorCode || "INVALID_YOUTUBE_URL");
        setErrorMessage(
          ytCheck.errorMessage || "Pega un enlace válido de YouTube."
        );
        return;
      }

      setStep("inspecting");
      setProgress(30);

      try {
        const res = await fetch("/api/audio/inspect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl }),
        });

        const data = await res.json();

        if (!res.ok) {
          const apiErr = data as ApiErrorResponse;
          setMetadata(null);
          setStep("error");
          setErrorCode(apiErr.code || "UPSTREAM_ERROR");
          setErrorMessage(
            apiErr.error ||
              "No se pudo obtener la información del video de YouTube."
          );
          setProgress(0);
          return;
        }

        const videoMeta = data as YouTubeVideoMetadata;
        setMetadata(videoMeta);
        setSelectedBitrate(192);
        setProgress(100);
        setStep("ready");
      } catch (err) {
        setMetadata(null);
        setStep("error");
        setErrorCode("UPSTREAM_ERROR");
        setErrorMessage(
          err instanceof Error
            ? `Error de conexión al verificar el enlace de YouTube: ${err.message}`
            : "Error inesperado de red."
        );
        setProgress(0);
      }
    },
    [url]
  );

  const downloadMp3 = useCallback(async () => {
    if (!metadata) return;

    setErrorMessage(null);
    setErrorCode(null);
    setProviderNotice(null);
    setStep("converting");
    setProgress(15);
    setDownloadedBytes(0);
    setTotalBytes(null);

    try {
      const convertRes = await fetch("/api/audio/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: metadata.videoId,
          youtubeUrl: metadata.canonicalWatchUrl,
          title: metadata.title,
          channelTitle: metadata.channelTitle,
          bitrate: selectedBitrate,
          authorizedAudioUrl: metadata.authorizedAudioUrl,
        }),
      });

      const convertData = await convertRes.json();

      if (!convertRes.ok) {
        const apiErr = convertData as ApiErrorResponse;
        setStep("error");
        setErrorCode(apiErr.code || "UPSTREAM_ERROR");
        setErrorMessage(
          apiErr.error || "No se pudo convertir el video de YouTube a MP3."
        );
        setProgress(0);
        return;
      }

      const conversion = convertData as ConvertYouTubeResponse;
      if (conversion.notice) {
        setProviderNotice(conversion.notice);
      }

      setStep("downloading");
      setProgress(25);

      const streamRes = await fetch(conversion.downloadUrl);
      if (!streamRes.ok) {
        let streamErrMsg = `Error HTTP ${streamRes.status} durante la descarga del archivo MP3.`;
        try {
          const errJson = (await streamRes.json()) as ApiErrorResponse;
          if (errJson.error) streamErrMsg = errJson.error;
        } catch {
          // Ignore non-JSON body
        }
        throw new Error(streamErrMsg);
      }

      const contentLengthHeader = streamRes.headers.get("content-length");
      const expectedTotal = contentLengthHeader
        ? parseInt(contentLengthHeader, 10)
        : conversion.sizeBytes || metadata.authorizedAudioSizeBytes || null;

      if (expectedTotal && expectedTotal > 0) {
        setTotalBytes(expectedTotal);
      }

      if (!streamRes.body) {
        const blob = await streamRes.blob();
        triggerBrowserDownload(blob, conversion.filename);
      } else {
        const reader = streamRes.body.getReader();
        const chunks: Uint8Array[] = [];
        let receivedLength = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            receivedLength += value.length;
            setDownloadedBytes(receivedLength);

            if (expectedTotal && expectedTotal > 0) {
              const pct = Math.min(
                98,
                Math.max(25, Math.round((receivedLength / expectedTotal) * 100))
              );
              setProgress(pct);
            } else {
              setProgress((prev) => Math.min(95, prev + 4));
            }
          }
        }

        const audioBlob = new Blob(chunks as BlobPart[], {
          type: "audio/mpeg",
        });
        triggerBrowserDownload(audioBlob, conversion.filename);
      }

      setProgress(100);
      setStep("completed");

      options?.onDownloadSuccess?.({
        metadata,
        bitrate: selectedBitrate,
      });
    } catch (err) {
      setStep("error");
      setErrorCode("UPSTREAM_ERROR");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al descargar el archivo MP3."
      );
      setProgress(0);
    }
  }, [metadata, selectedBitrate, options]);

  return {
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
    errorCode,
    providerNotice,
    inspectYouTubeVideo,
    downloadMp3,
    resetState,
  };
}

function triggerBrowserDownload(blob: Blob, filename: string) {
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename.endsWith(".mp3") ? filename : `${filename}.mp3`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
}
