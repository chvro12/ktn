"use client";

import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";
import { fetchVideoLibraryState } from "@/lib/library-api";

type MeResponse =
  | { user: { id: string } }
  | { error: { code: string; message: string } };

async function fetchMe(): Promise<MeResponse> {
  const res = await apiFetch("/v1/auth/me");
  return res.json() as Promise<MeResponse>;
}

/** Intervalle entre deux enregistrements pendant lecture (secondes). */
const SYNC_INTERVAL_SEC = 12;

/** Progression minimale (s) pour proposer une reprise. */
const RESUME_MIN_SEC = 5;

export function WatchVideoPlayer({
  slugId,
  hlsUrl,
  poster,
  durationSec,
}: {
  slugId: string;
  hlsUrl: string;
  poster?: string | null;
  durationSec: number | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<import("hls.js").default | null>(null);
  const lastSyncWallRef = useRef(0);
  const resumeAppliedRef = useRef(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    resumeAppliedRef.current = false;
    lastSyncWallRef.current = 0;
  }, [slugId]);

  // ── HLS initialisation ──────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setHasError(false);

    // Cas 1 : MP4 / fichier passthrough — lecture native directe
    if (!hlsUrl.toLowerCase().includes(".m3u8")) {
      video.src = hlsUrl;
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    // Cas 2 : Safari — HLS natif
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = hlsUrl;
      return () => {
        video.removeAttribute("src");
        video.load();
      };
    }

    // Cas 3 : Chrome / Firefox — HLS.js
    let destroyed = false;
    import("hls.js")
      .then(({ default: Hls }) => {
        if (destroyed || !videoRef.current) return;
        if (!Hls.isSupported()) {
          setHasError(true);
          return;
        }

        const hls = new Hls({
          startLevel: -1,
          manifestLoadingMaxRetry: 2,
          levelLoadingMaxRetry: 2,
        });
        hlsRef.current = hls;

        hls.on(Hls.Events.ERROR, (_evt, data) => {
          if (data.fatal) {
            setHasError(true);
            hls.destroy();
            hlsRef.current = null;
          }
        });

        hls.loadSource(hlsUrl);
        hls.attachMedia(videoRef.current);
      })
      .catch(() => {
        if (!destroyed) setHasError(true);
      });

    return () => {
      destroyed = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      const v = videoRef.current;
      if (v) {
        v.removeAttribute("src");
        v.load();
      }
    };
  }, [hlsUrl]);

  const meQuery = useQuery({ queryKey: ["auth", "me"], queryFn: fetchMe });
  const loggedIn = Boolean(meQuery.data && "user" in meQuery.data);

  const libraryStateQuery = useQuery({
    queryKey: ["library", "video-state", slugId],
    queryFn: () => fetchVideoLibraryState(slugId),
    enabled: loggedIn,
  });

  const postHistory = useCallback(
    (progressSec: number, completed: boolean) => {
      if (!loggedIn) return;
      void apiFetch("/v1/library/history", {
        method: "POST",
        body: JSON.stringify({ slugId, progressSec, completed }),
      });
    },
    [loggedIn, slugId],
  );

  useEffect(() => {
    const el = videoRef.current;
    const data = libraryStateQuery.data;
    if (!el || !data || resumeAppliedRef.current) return;

    if (data.completed || data.progressSec < RESUME_MIN_SEC) {
      resumeAppliedRef.current = true;
      return;
    }

    const durFromVideo = Number.isFinite(el.duration) ? el.duration : NaN;
    const dur =
      durationSec != null && durationSec > 0
        ? durationSec
        : durFromVideo;

    if (Number.isFinite(dur) && dur > 0) {
      if (data.progressSec >= dur - 3) {
        resumeAppliedRef.current = true;
        return;
      }
    }

    const cap =
      Number.isFinite(dur) && dur > 0 ? Math.max(0, dur - 3) : data.progressSec;
    const seekTo = Math.min(data.progressSec, cap);

    const trySeek = () => {
      if (resumeAppliedRef.current) return;
      resumeAppliedRef.current = true;
      try {
        el.currentTime = seekTo;
      } catch {
        /* seek interdit tant que la piste n'est pas prête */
      }
    };

    if (el.readyState >= 1) {
      trySeek();
    } else {
      el.addEventListener("loadedmetadata", trySeek, { once: true });
    }

    return () => {
      el.removeEventListener("loadedmetadata", trySeek);
    };
  }, [libraryStateQuery.data, durationSec]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const isNearEnd = () => {
      if (durationSec == null) return false;
      return Math.floor(el.currentTime) >= Math.max(0, durationSec - 2);
    };

    const onPlay = () => {
      if (!loggedIn) return;
      const sec = Math.floor(el.currentTime);
      postHistory(sec, isNearEnd());
      lastSyncWallRef.current = Date.now();
    };

    const onTimeUpdate = () => {
      if (!loggedIn || el.paused) return;
      const now = Date.now();
      if (now - lastSyncWallRef.current < SYNC_INTERVAL_SEC * 1000) return;
      const sec = Math.floor(el.currentTime);
      lastSyncWallRef.current = now;
      postHistory(sec, isNearEnd());
    };

    const onPause = () => {
      if (!loggedIn) return;
      const sec = Math.floor(el.currentTime);
      postHistory(sec, isNearEnd());
    };

    const onEnded = () => {
      if (!loggedIn) return;
      const sec =
        durationSec != null
          ? durationSec
          : Number.isFinite(el.duration)
            ? Math.floor(el.duration)
            : Math.floor(el.currentTime);
      postHistory(sec, true);
    };

    el.addEventListener("play", onPlay);
    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("play", onPlay);
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [loggedIn, postHistory, durationSec]);

  const handleVideoError = useCallback(() => setHasError(true), []);

  if (hasError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black px-6 text-center">
        <p className="text-sm text-white/70">
          Vidéo temporairement indisponible — réessaie plus tard.
        </p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      className="h-full w-full bg-black object-contain"
      controls
      playsInline
      poster={poster ?? undefined}
      preload="metadata"
      onError={handleVideoError}
    />
  );
}
