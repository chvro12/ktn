import { AdminDashboard } from "@/components/admin/admin-dashboard";

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Tableau de bord
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Vue d’ensemble de la plateforme.
        </p>
      </div>
      <AdminDashboard />
    </div>
  );
}
