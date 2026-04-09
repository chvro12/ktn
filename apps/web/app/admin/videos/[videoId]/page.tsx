import { AdminVideoDetailView } from "@/components/admin/admin-video-detail-view";

type PageProps = {
  params: Promise<{ videoId: string }>;
};

export default async function AdminVideoDetailPage({ params }: PageProps) {
  const { videoId } = await params;

  return <AdminVideoDetailView videoId={videoId} />;
}
