export const PLAYLIST_PRIVACY_OPTIONS = [
  { value: "PRIVATE", label: "Privée" },
  { value: "UNLISTED", label: "Non répertoriée" },
  { value: "PUBLIC", label: "Publique" },
] as const;

export type PlaylistPrivacyValue = (typeof PLAYLIST_PRIVACY_OPTIONS)[number]["value"];

export function playlistPrivacyLabel(code: string): string {
  const o = PLAYLIST_PRIVACY_OPTIONS.find((x) => x.value === code);
  return o?.label ?? code;
}
