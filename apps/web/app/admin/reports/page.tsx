import { AdminReportsTable } from "@/components/admin/admin-reports-table";

export default function AdminReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Signalements
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Traiter les rapports utilisateurs ; chaque changement est consigné dans
          le journal.
        </p>
      </div>
      <AdminReportsTable />
    </div>
  );
}
