import Link from "next/link";
import type { WritingGuide } from "@/lib/guides";
import { recipeHref, recipeText } from "@/lib/deep-guides";
import { WritingActions } from "@/components/WritingActions";

type GuideSection = WritingGuide["sections"][number];

export function GuideDetails({ section }: { section: GuideSection }) {
  return <>
    {section.example && <div className="mt-6 space-y-6 text-base leading-relaxed text-slate-700 dark:text-slate-300">
      <dl className="space-y-5">{[["Starting input", section.example.input], ["First draft", section.example.draft], ["What needs work", section.example.problem], ["Revised headcanon", section.example.revised]].map(([label, value]) => <div key={label} className="border-l-2 border-slate-300 pl-4 dark:border-slate-700"><dt className="text-sm font-semibold text-slate-900 dark:text-slate-100">{label}</dt><dd className="mt-1">{value}</dd></div>)}</dl>
      <div><h3 className="font-semibold text-slate-900 dark:text-slate-100">A scene to test it</h3><blockquote className="mt-3 space-y-3 border-l-2 border-indigo-400 pl-4">{section.example.scene.map(line => <p key={line}>{line}</p>)}</blockquote></div>
      <p><strong className="font-semibold text-slate-900 dark:text-slate-100">Why the revision works: </strong>{section.example.reason}</p>
    </div>}
    {section.table && <div className="mt-6">
      <table role="table" className="block w-full border-collapse text-left text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:table">
        <caption className="mb-3 block text-left text-sm text-slate-500 sm:table-caption">{section.table.caption}</caption>
        <thead role="rowgroup" className="sr-only border-b-2 border-slate-300 dark:border-slate-700 sm:not-sr-only sm:table-header-group">
          <tr role="row">{section.table.columns.map((column, i) => <th key={column} scope="col" role="columnheader" className={`${i === 0 ? "w-[25%]" : ""} break-words px-2 py-3 font-semibold`}>{column}</th>)}</tr>
        </thead>
        <tbody role="rowgroup" className="block sm:table-row-group">{section.table.rows.map(row => <tr role="row" key={row[0]} className="block border-b border-slate-200 py-5 align-top first:border-t dark:border-slate-800 sm:table-row sm:py-0 sm:first:border-t-0">
          {row.map((cell, i) => i === 0
            ? <th key={i} scope="row" role="rowheader" className="block break-words pb-1 text-base font-semibold sm:table-cell sm:px-2 sm:py-4 sm:text-sm sm:font-medium">{cell}</th>
            : <td key={i} role="cell" className="block break-words pt-3 sm:table-cell sm:px-2 sm:py-4"><span aria-hidden="true" className="mb-1 block text-xs font-semibold text-slate-500 sm:hidden">{section.table?.columns[i]}</span>{cell}</td>)}
        </tr>)}</tbody>
      </table>
      {section.table.downloadFilename && <div className="mt-3 flex justify-end"><WritingActions text={section.table.rows.map(row => row.join(": ")).join("\n\n")} filename={section.table.downloadFilename} download /></div>}
    </div>}
    {section.recipes && <div className="mt-6 divide-y divide-slate-200 dark:divide-slate-800">{section.recipes.map((recipe, i) => <section key={recipe.title} id={`recipe-${i + 1}`} className="scroll-mt-24 py-7 first:pt-0">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{i + 1}. {recipe.title}</h3><p className="mt-2 text-slate-600 dark:text-slate-400">{recipe.purpose}</p>
      <dl className="mt-4 grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-4 gap-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{recipeText(recipe).split("\n").map(line => { const split = line.indexOf(": "); return <div key={line} className="contents"><dt className="font-medium">{line.slice(0, split)}</dt><dd className="min-w-0 break-words">{line.slice(split + 2)}</dd></div>; })}</dl>
      <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400"><strong>Look for: </strong>{recipe.lookFor}</p>
      <div className="mt-4 flex flex-wrap items-center gap-4"><Link href={recipeHref(recipe)} className="inline-flex min-h-11 items-center font-medium text-indigo-600 underline underline-offset-4 dark:text-indigo-400">Load input</Link><WritingActions text={recipeText(recipe)} /></div>
    </section>)}</div>}
    {section.links && <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">{section.links.map(link => <Link key={link.href} href={link.href} className="inline-flex min-h-11 items-center text-sm font-medium text-indigo-600 underline underline-offset-4 dark:text-indigo-400">{link.label}</Link>)}</div>}
  </>;
}
