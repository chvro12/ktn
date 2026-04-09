import { AdminVideosModerationTable } from "@/components/admin/admin-videos-moderation-table";

export default function AdminVideosModerationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Modération vidéo
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Les vidéos « bloquées » disparaissent du catalogue public. « Limitée »
          reste visible (affinement métier possible plus tard).
        </p>
      </div>
      <AdminVideosModerationTable />
    </div>
  );
}
