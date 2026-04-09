import { UserLibraryPage } from "@/components/library/user-library-page";

export default function WatchLaterPage() {
  return (
    <UserLibraryPage
      apiPath="/v1/library/watch-later"
      title="À regarder plus tard"
      description="Vidéos que tu as mises de côté."
      loginNextPath="/watch-later"
      emptyMessage="Aucune vidéo dans « Plus tard ». Ajoute-en depuis une page de lecture."
    />
  );
}
