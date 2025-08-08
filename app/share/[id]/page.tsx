import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import CodeRunner from '@/components/code-runner';
import { getServerSupabase } from '@/lib/supabase-server';

/*
  This is the Share page for v1 apps, before the chat interface was added.

  It's here to preserve existing URLs.
*/
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data: generatedApp, error } = await getGeneratedAppByID(id);

  if (error || !generatedApp) {
    console.error('Error fetching app for metadata:', error);
    return {
      title: 'App Not Found | LlamaCoder.io',
      description: 'The requested app could not be found.',
    };
  }

  const prompt = generatedApp?.prompt;
  if (typeof prompt !== 'string') {
    notFound();
  }

  const searchParams = new URLSearchParams();
  searchParams.set('prompt', prompt);

  return {
    title: 'An app generated on LlamaCoder.io',
    description: `Prompt: ${prompt}`,
    openGraph: {
      images: [`/api/og?${searchParams}`],
    },
    twitter: {
      title: 'An app generated on LlamaCoder.io',
      card: 'summary_large_image',
      images: [`/api/og?${searchParams}`],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (typeof id !== 'string') {
    notFound();
  }

  const { data: generatedApp, error } = await getGeneratedAppByID(id);

  if (error) {
    console.error('Error fetching shared app:', error);
    return <div>Error loading app. Please try again later.</div>;
  }

  if (!generatedApp) {
    return <div>App not found</div>;
  }

  if (typeof generatedApp.code !== 'string') {
    console.error(
      "Fetched app data missing code property or it's not a string:",
      generatedApp
    );
    return <div>App data is incomplete.</div>;
  }

  return (
    <div className="flex h-full w-full grow items-center justify-center">
      <CodeRunner code={generatedApp.code} language="tsx" />
    </div>
  );
}

const getGeneratedAppByID = cache(async (id: string) => {
  const supabase = await getServerSupabase(false);
  return supabase.from('generatedApp').select('*').eq('id', id).single();
});
