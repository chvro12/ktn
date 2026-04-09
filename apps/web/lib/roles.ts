/** Rôle renvoyé par l’API (enum Prisma sérialisé en string). */
export function isAdminRole(role: string | undefined): boolean {
  return String(role ?? "").toUpperCase() === "ADMIN";
}
