import { useState } from 'react';
import CreateAmbassadorPost from './CreateAmbassadorPost';
import AmbassadorPosts from './AmbassadorPosts';
import { PageHeader } from '../ui/primitives';

export default function AmbassadorAnnouncements() {
  const [refetch, setRefetch] = useState(0);

  return (
    <div>
      <PageHeader
        title="Mis Anuncios"
        description="Comparte pasantías y oportunidades con tu comunidad"
      />

      <div className="space-y-6">
        <CreateAmbassadorPost onPostCreated={() => setRefetch((p) => p + 1)} />
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Tus anuncios</h2>
          <AmbassadorPosts refetch={refetch} />
        </div>
      </div>
    </div>
  );
}
