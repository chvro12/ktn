"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CircleCheckBig,
  FileVideo,
  LoaderCircle,
  Sparkles,
  TriangleAlert,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, apiUrlForRequest } from "@/lib/api";
import {
  PLAYLIST_PRIVACY_OPTIONS,
  type PlaylistPrivacyValue,
} from "@/lib/playlist-ui";

type MeResponse =
  | { user: { displayName: string } }
  | { error: { code: string; message: string } };

type UploadApiError = {
  error?: { message?: string };
};

const MAX_VIDEO_SIZE_BYTES = 512 * 1024 * 1024;
const ACCEPTED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "application/octet-stream",
]);
const ACCEPTED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".avi"];

async function fetchMe(): Promise<MeResponse> {
  const res = await apiFetch("/v1/auth/me");
  return res.json() as Promise<MeResponse>;
}

/** Réutilise les mêmes valeurs que les vidéos (PUBLIC / UNLISTED / PRIVATE). */
const VISIBILITY_OPTIONS = PLAYLIST_PRIVACY_OPTIONS;

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 o";
  const units = ["o", "Ko", "Mo", "Go"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const digits = value >= 100 || unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unitIndex]}`;
}

function guessTitleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isAcceptedVideoFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return (
    ACCEPTED_VIDEO_TYPES.has(file.type.toLowerCase()) ||
    ACCEPTED_VIDEO_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
  );
}

function parseUploadError(
  payload: XMLHttpRequest["response"],
  fallback: string,
): Error {
  if (payload && typeof payload === "object") {
    const body = payload as UploadApiError;
    return new Error(body.error?.message ?? fallback);
  }

  if (typeof payload === "string" && payload.trim().length > 0) {
    try {
      const body = JSON.parse(payload) as UploadApiError;
      return new Error(body.error?.message ?? fallback);
    } catch {
      return new Error(fallback);
    }
  }

  return new Error(fallback);
}

async function uploadStudioFile(
  videoId: string,
  file: File,
  onProgress: (value: number) => void,
): Promise<void> {
  const url = await apiUrlForRequest(
    `/v1/studio/videos/${encodeURIComponent(videoId)}/upload`,
  );

  await new Promise<void>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.responseType = "json";

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total <= 0) return;
      const ratio = Math.min(event.loaded / event.total, 1);
      onProgress(Math.round(ratio * 100));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
        return;
      }
      reject(parseUploadError(xhr.response, "Upload impossible"));
    };

    xhr.onerror = () => {
      reject(new Error("Le réseau a interrompu l’envoi du fichier"));
    };

    xhr.send(formData);
  });
}

export function StudioUploadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<PlaylistPrivacyValue>("PUBLIC");
  const [file, setFile] = useState<File | null>(null);
  const [stepMsg, setStepMsg] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const meQuery = useQuery({ queryKey: ["auth", "me"], queryFn: fetchMe });
  const loggedIn = Boolean(meQuery.data && "user" in meQuery.data);

  useEffect(() => {
    if (meQuery.isPending) return;
    if (!loggedIn) router.replace("/login?next=/studio/upload");
  }, [meQuery.isPending, loggedIn, router]);

  function handlePickedFile(nextFile: File | null) {
    if (!nextFile) return;

    if (!isAcceptedVideoFile(nextFile)) {
      setFieldError("Format non pris en charge. Utilise mp4, mov, webm ou avi.");
      return;
    }

    if (nextFile.size > MAX_VIDEO_SIZE_BYTES) {
      setFieldError("Le fichier dépasse 512 Mo.");
      return;
    }

    setFieldError(null);
    setUploadProgress(0);
    setFile(nextFile);
    setStepMsg(null);
    setTitle((currentTitle) =>
      currentTitle.trim().length > 0
        ? currentTitle
        : guessTitleFromFilename(nextFile.name),
    );
  }

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle || !file) {
        throw new Error("Ajoute un titre et une vidéo avant de continuer");
      }

      setFieldError(null);
      setUploadProgress(0);
      setStepMsg("Création de la fiche vidéo…");
      const createResponse = await apiFetch("/v1/studio/videos", {
        method: "POST",
        body: JSON.stringify({
          title: trimmedTitle,
          description: description.trim() || undefined,
          visibility,
        }),
      });

      if (!createResponse.ok) {
        const errorBody = (await createResponse.json().catch(() => null)) as UploadApiError | null;
        throw new Error(errorBody?.error?.message ?? "Création impossible");
      }

      const { video } = (await createResponse.json()) as { video: { id: string } };

      setStepMsg("Envoi de la vidéo…");
      await uploadStudioFile(video.id, file, setUploadProgress);
      return video.id;
    },
    onSuccess: async (videoId) => {
      setStepMsg(
        visibility === "PRIVATE"
          ? "Vidéo envoyée. Elle restera privée jusqu’à ton prochain changement de visibilité."
          : "Vidéo envoyée. Dès que le traitement est terminé, elle sera publiée automatiquement.",
      );
      await queryClient.invalidateQueries({ queryKey: ["studio", "videos"] });
      router.push(`/studio?_new=${encodeURIComponent(videoId)}`);
    },
    onError: () => {
      setStepMsg(null);
    },
  });

  if (meQuery.isPending || !loggedIn) {
    return (
      <AppShell>
        <div className="mx-auto max-w-5xl space-y-6">
          <Skeleton className="h-24 rounded-[1.75rem]" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
            <Skeleton className="h-[22rem] rounded-[1.75rem]" />
            <Skeleton className="h-[22rem] rounded-[1.75rem]" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles className="size-3.5" aria-hidden />
              Studio upload
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Importer une vidéo
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Dépose ton fichier, vérifie le titre, puis laisse le studio faire le
                reste. Les vidéos publiques apparaîtront automatiquement après
                traitement.
              </p>
            </div>
          </div>
          <Link
            href="/studio"
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Retour au studio
          </Link>
        </div>

        <form
          className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]"
          onSubmit={(event) => {
            event.preventDefault();
            if (uploadMutation.isPending) return;
            uploadMutation.mutate();
          }}
        >
          <section className="rounded-[1.75rem] border border-border/70 bg-card/80 p-4 shadow-[0_24px_65px_-45px_rgba(23,23,23,0.45)] sm:rounded-[2rem] sm:p-6">
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="uv-title">Titre</Label>
                <Input
                  id="uv-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  disabled={uploadMutation.isPending}
                  maxLength={200}
                  placeholder="Titre de la vidéo"
                  className="h-11 rounded-xl border-border/70 bg-background/70"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="uv-desc">Description</Label>
                <textarea
                  id="uv-desc"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={8000}
                  disabled={uploadMutation.isPending}
                  rows={6}
                  placeholder="Ajoute un contexte utile, sans surcharger."
                  className="min-h-32 w-full resize-y rounded-2xl border border-input/80 bg-background/70 px-3.5 py-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="uv-vis">Visibilité</Label>
                <select
                  id="uv-vis"
                  value={visibility}
                  onChange={(event) =>
                    setVisibility(event.target.value as PlaylistPrivacyValue)
                  }
                  disabled={uploadMutation.isPending}
                  className="h-11 w-full rounded-xl border border-input/80 bg-background/70 px-3 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                >
                  {VISIBILITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Public pour apparaître dans l’accueil, Non répertoriée pour
                  partager par lien seulement, Privée pour garder le brouillon.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-background/65 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Formats
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    MP4, MOV, WEBM ou AVI jusqu’à 512 Mo.
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/65 p-4">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Publication
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    Les vidéos publiques et non répertoriées se publient dès que
                    le traitement est prêt.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(248,247,244,0.92))] p-4 shadow-[0_24px_65px_-45px_rgba(23,23,23,0.45)] sm:rounded-[2rem] sm:p-6">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Fichier vidéo
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Glisse-dépose ou choisis un fichier jusqu’à 512 Mo.
                  </p>
                </div>
                {uploadMutation.isPending ? (
                  <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
                ) : null}
              </div>

              <input
                ref={inputRef}
                id="uv-file"
                type="file"
                accept="video/mp4,video/quicktime,video/webm,video/x-msvideo,.mp4,.mov,.webm,.avi"
                className="sr-only"
                disabled={uploadMutation.isPending}
                onChange={(event) => handlePickedFile(event.target.files?.[0] ?? null)}
              />

              <button
                type="button"
                disabled={uploadMutation.isPending}
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                  if (uploadMutation.isPending) return;
                  event.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={(event) => {
                  if (uploadMutation.isPending) return;
                  event.preventDefault();
                  setIsDraggingFile(false);
                  handlePickedFile(event.dataTransfer.files?.[0] ?? null);
                }}
                className={[
                  "group relative flex min-h-56 w-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed px-4 py-6 text-center transition sm:min-h-72 sm:rounded-[1.75rem] sm:px-5 sm:py-8",
                  isDraggingFile
                    ? "border-foreground/40 bg-background shadow-[0_20px_60px_-45px_rgba(23,23,23,0.5)]"
                    : "border-border/80 bg-background/75 hover:border-foreground/25 hover:bg-background disabled:cursor-not-allowed disabled:opacity-70",
                ].join(" ")}
              >
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-foreground/15 to-transparent" />
                <div className="flex size-14 items-center justify-center rounded-2xl bg-foreground text-primary-foreground shadow-[0_18px_35px_-25px_rgba(0,0,0,0.7)] transition group-hover:scale-[1.03]">
                  {file ? <FileVideo className="size-6" /> : <Upload className="size-6" />}
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-base font-semibold tracking-tight">
                    {file ? file.name : "Dépose ta vidéo ici"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {file
                      ? `${formatBytes(file.size)} · prête à être envoyée`
                      : "MP4, MOV, WEBM ou AVI"}
                  </p>
                </div>
                <span className="mt-5 inline-flex rounded-full border border-border/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                  Cliquer pour choisir un fichier
                </span>
              </button>

              {file ? (
                <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{file.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null);
                        setFieldError(null);
                        setUploadProgress(0);
                        if (inputRef.current) inputRef.current.value = "";
                      }}
                      disabled={uploadMutation.isPending}
                    >
                      Retirer
                    </Button>
                  </div>
                </div>
              ) : null}

              {uploadMutation.isPending ? (
                <div className="space-y-2 rounded-2xl border border-border/70 bg-background/75 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-foreground">Progression</span>
                    <span className="tabular-nums text-muted-foreground">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-foreground transition-[width] duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground" aria-live="polite">
                    {stepMsg ?? "Envoi en cours…"}
                  </p>
                </div>
              ) : null}

              {!uploadMutation.isPending ? (
                <div className="rounded-2xl border border-border/70 bg-background/70 p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <CircleCheckBig className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
                    <div className="text-muted-foreground">
                      Vérifie surtout le titre et la visibilité. Une fois le
                      fichier envoyé, le studio suivra automatiquement l’encodage.
                    </div>
                  </div>
                </div>
              ) : null}

              <Button
                type="submit"
                className="h-11 w-full rounded-xl"
                disabled={uploadMutation.isPending || !title.trim() || !file}
              >
                {uploadMutation.isPending ? "Envoi en cours…" : "Envoyer la vidéo"}
              </Button>

              {stepMsg && !uploadMutation.isPending ? (
                <p className="text-xs text-muted-foreground" aria-live="polite">
                  {stepMsg}
                </p>
              ) : null}

              {fieldError ? (
                <div
                  className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive"
                  role="alert"
                >
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <p>{fieldError}</p>
                </div>
              ) : null}

              {uploadMutation.isError ? (
                <div
                  className="flex items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs text-destructive"
                  role="alert"
                >
                  <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <p>
                    {uploadMutation.error instanceof Error
                      ? uploadMutation.error.message
                      : "Erreur pendant l’upload"}
                  </p>
                </div>
              ) : null}
            </div>
          </section>
        </form>
      </div>
    </AppShell>
  );
}
