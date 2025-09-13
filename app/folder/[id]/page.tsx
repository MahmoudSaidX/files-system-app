import { redirect } from 'next/navigation';

interface Props {
  params: { id: string };
}

export default function FolderPage({ params }: Props) {
  // Redirect to the new public folder system
  redirect(`/public-folder/${params.id}`);
}
