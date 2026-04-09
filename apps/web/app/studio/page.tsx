import { Suspense } from "react";
import { StudioDashboard } from "@/components/studio/studio-dashboard";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ _new?: string }>;
}) {
  const { _new } = await searchParams;

  return (
    <Suspense fallback={<div className="min-h-[40vh] p-8 text-sm text-muted-foreground">Chargement…</div>}>
      <StudioDashboard newVideoId={_new} />
    </Suspense>
  );
}
