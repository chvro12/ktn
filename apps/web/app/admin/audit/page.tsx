import { AdminAuditTable } from "@/components/admin/admin-audit-table";

export default function AdminAuditPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Journal de modération
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Historique des actions admin (signalements, états vidéo, etc.).
        </p>
      </div>
      <AdminAuditTable />
    </div>
  );
}
