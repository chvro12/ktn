import { UserLibraryPage } from "@/components/library/user-library-page";

export default function HistoryPage() {
  return (
    <UserLibraryPage
      apiPath="/v1/library/history"
      title="Historique"
      description="Vidéos récemment consultées sur ce navigateur (compte connecté)."
      loginNextPath="/history"
      emptyMessage="Aucune vidéo dans l’historique pour l’instant."
    />
  );
}
