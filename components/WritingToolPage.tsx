import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { JsonLd } from '@/components/JsonLd';
import { HeadcanonWorksheet } from '@/components/HeadcanonWorksheet';
import { CuratedWritingTool } from '@/components/CuratedWritingTool';
import { PaidWritingTool } from '@/components/PaidWritingTool';
import { WritingActions } from '@/components/WritingActions';
import { findWritingTool, type WritingToolId } from '@/lib/writing-tools';
import { SITE_URL } from '@/lib/site';

export function writingToolMetadata(id: WritingToolId): Metadata {
  const tool = findWritingTool(id);
  const title = `${tool.title} | Headcanon Generator`;
  return {
    title,
    description: tool.description,
    alternates: { canonical: `${SITE_URL}${tool.path}` },
    openGraph: {
      title,
      description: tool.description,
      url: `${SITE_URL}${tool.path}`,
      siteName: 'Headcanon Generator',
      type: 'website',
      images: [{ url: `${SITE_URL}/web-app-manifest-512x512.png`, width: 512, height: 512, alt: 'Headcanon Generator character card and inspiration star' }],
    },
  };
}

export function WritingToolPage({ id }: { id: WritingToolId }) {
  const tool = findWritingTool(id);
  const url = `${SITE_URL}${tool.path}`;
  return <>
    <Navigation />
    <main className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <JsonLd data={[
        { '@context': 'https://schema.org', '@type': 'WebPage', name: tool.title, description: tool.description, url, isPartOf: { '@type': 'WebSite', name: 'Headcanon Generator', url: SITE_URL } },
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL }, { '@type': 'ListItem', position: 2, name: tool.title, item: url }] },
        { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: tool.faqs.map(faq => ({ '@type': 'Question', name: faq.q, acceptedAnswer: { '@type': 'Answer', text: faq.a } })) },
      ]} />
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap gap-2 text-sm text-slate-500"><Link href="/" className="hover:text-indigo-600 hover:underline">Home</Link><span aria-hidden="true">/</span><span>{tool.title}</span></nav>
        <div className="mb-8 max-w-3xl"><p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{tool.free ? 'Free writing resource' : 'AI writing tool'}</p><h1 className="mt-2 break-words text-3xl font-bold leading-tight sm:text-4xl">{tool.title}</h1><p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">{tool.intro}</p></div>
        {id === 'template' ? <HeadcanonWorksheet /> : id === 'questions' || id === 'trope' ? <CuratedWritingTool key={id} kind={id} /> : <PaidWritingTool key={id} kind={id} />}
      </div>
      <section className="border-y border-slate-200 bg-slate-50 py-12 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">{tool.free ? 'A starting point' : 'Example, not a generated result'}</h2><WritingActions text={tool.example} /></div><p className="mt-4 whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">{tool.example}</p></div>
      </section>
      <div className="mx-auto max-w-4xl space-y-10 px-4 py-14 sm:px-6 lg:px-8">{tool.sections.map(section => <section key={section.title}><h2 className="text-xl font-semibold">{section.title}</h2><p className="mt-4 leading-relaxed text-slate-600 dark:text-slate-400">{section.body}</p></section>)}</div>
      <section className="border-t border-slate-200 py-12 dark:border-slate-800"><div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"><h2 className="text-2xl font-semibold">Questions writers ask</h2><div className="mt-6 divide-y divide-slate-200 dark:divide-slate-800">{tool.faqs.map(faq => <details key={faq.q} className="py-4"><summary className="min-h-11 cursor-pointer py-2 font-medium focus-visible:outline-2 focus-visible:outline-indigo-600">{faq.q}</summary><p className="pb-3 pt-2 leading-relaxed text-slate-600 dark:text-slate-400">{faq.a}</p></details>)}</div></div></section>
      <section className="border-t border-slate-200 py-10 dark:border-slate-800"><div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"><h2 className="text-lg font-semibold">Keep writing</h2><div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">{tool.related.map(id => { const related = findWritingTool(id); return <Link key={id} href={related.path} className="inline-flex min-h-11 items-center gap-2 text-indigo-600 hover:underline dark:text-indigo-400">{related.title}<ArrowRight className="h-4 w-4 shrink-0" /></Link>; })}<Link href="/#generator" className="inline-flex min-h-11 items-center text-indigo-600 hover:underline dark:text-indigo-400">Headcanon Generator</Link><Link href="/oc-headcanon-generator" className="inline-flex min-h-11 items-center text-indigo-600 hover:underline dark:text-indigo-400">OC Headcanon Generator</Link><Link href="/writing-prompt-generator" className="inline-flex min-h-11 items-center text-indigo-600 hover:underline dark:text-indigo-400">Writing Prompt Generator</Link></div></div></section>
    </main>
    <Footer />
  </>;
}
