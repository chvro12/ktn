import { AdminUsersTable } from "@/components/admin/admin-users-table";

export default function AdminUsersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Utilisateurs
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Rôles et statuts des comptes (spectateur, créateur, admin).
        </p>
      </div>
      <AdminUsersTable />
    </div>
  );
}
