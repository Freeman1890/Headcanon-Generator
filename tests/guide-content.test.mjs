import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const dependency = createRequire(import.meta.url);
const cache = new Map();

function load(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, process: { env: {} }, URL, URLSearchParams, Intl, Date,
    require(name) {
      if (["@/components/Footer", "@/components/Navigation"].includes(name)) {
        return { Footer: () => null, Navigation: () => null };
      }
      if (name === "next/link") return { __esModule: true, default: ({ href, children, ...props }) => React.createElement("a", { ...props, href }, children) };
      if (name === "next/navigation") return { notFound() { throw new Error("not found"); } };
      if (name.startsWith("@/") || name.startsWith(".")) {
        const base = name.startsWith("@/") ? path.join(root, name.slice(2)) : path.resolve(path.dirname(file), name);
        const target = [base, `${base}.ts`, `${base}.tsx`].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
        if (!target) throw new Error(`Missing local test module: ${name}`);
        return load(target);
      }
      return dependency(name);
    },
  }, { filename: file });
  return module.exports;
}

const { WRITING_GUIDES, formatGuideDate } = load("lib/guides.ts");
const guidePage = load("app/guides/[slug]/page.tsx");
const sitemap = load("app/sitemap.ts").default;
const render = async (slug) => renderToStaticMarkup(await guidePage.default({ params: Promise.resolve({ slug }) }));
const articleSchema = (html) => JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]).find((item) => item["@type"] === "Article");

test("pricing explains the approved one-time pack and how to purchase", () => {
  const page = load("app/pricing/page.tsx");
  const html = renderToStaticMarkup(React.createElement(page.default));
  assert.ok(html.includes("100 credits for US$9.90"));
  assert.ok(html.includes("No subscription, automatic renewal, or expiry date"));
  assert.ok(!html.includes("temporarily paused"));
  assert.ok(html.includes("Waffo hosts checkout"));
  assert.ok(html.includes("Credits are added after payment is confirmed"));
  assert.ok(html.includes("100 successful batches, or 500 individual results"));
  assert.ok(html.includes("Buy 100 credits"));
  assert.equal(page.metadata.alternates.canonical, "https://headcanongenerator.run/pricing");
  assert.ok(sitemap().some(item => item.url === page.metadata.alternates.canonical));
  for (const route of ["pricing", "contact", "terms"]) {
    assert.ok(renderToStaticMarkup(React.createElement(load(`app/${route}/page.tsx`).default)).includes("ljt463015573+headcanon@gmail.com"));
  }
  assert.ok(!renderToStaticMarkup(React.createElement(load("app/privacy/page.tsx").default)).includes("Google Gemini"));
});

test("guide dates are explicit, valid, and stable across sitemap generation", () => {
  assert.equal(WRITING_GUIDES.length, 6);
  for (const guide of WRITING_GUIDES) {
    for (const value of [guide.published, guide.updated]) {
      assert.match(value, /^\d{4}-\d{2}-\d{2}$/);
      assert.equal(new Date(value).toISOString().slice(0, 10), value);
    }
    assert.ok(guide.updated >= guide.published);
    assert.equal(sitemap().find((item) => item.url.endsWith(`/guides/${guide.slug}`)).lastModified, guide.updated);
  }
  assert.equal(JSON.stringify(sitemap()), JSON.stringify(sitemap()));
  assert.equal(formatGuideDate("2026-10-24"), "October 24, 2026");
});

test("all guide pages align visible dates, Article data, social metadata, and byline", async () => {
  for (const guide of WRITING_GUIDES) {
    const html = await render(guide.slug);
    const schema = articleSchema(html);
    assert.equal(schema.datePublished, guide.published);
    assert.equal(schema.dateModified, guide.updated);
    assert.ok(html.includes(`<time dateTime="${guide.updated}">${formatGuideDate(guide.updated)}</time>`));
    assert.ok(html.includes(`<time dateTime="${guide.published}">${formatGuideDate(guide.published)}</time>`));
    assert.equal(schema.author.url, "https://headcanongenerator.run/about#content-review");
    assert.ok(html.includes('href="/about#content-review"'));
    const metadata = await guidePage.generateMetadata({ params: Promise.resolve({ slug: guide.slug }) });
    assert.equal(metadata.openGraph.modifiedTime, guide.updated);
    assert.equal(metadata.openGraph.publishedTime, guide.published);
  }
});

test("a guide edit updates dates in every consumer without changing publication history", async () => {
  const guide = WRITING_GUIDES[0];
  const previous = guide.updated;
  try {
    guide.updated = "2026-11-01";
    const html = await render(guide.slug);
    assert.equal(articleSchema(html).dateModified, "2026-11-01");
    assert.equal(articleSchema(html).datePublished, "2026-07-30");
    assert.ok(html.includes('dateTime="2026-11-01"'));
    assert.equal(sitemap().find((item) => item.url.endsWith(`/guides/${guide.slug}`)).lastModified, "2026-11-01");
    assert.equal(sitemap().find((item) => item.url.endsWith("/guides")).lastModified, "2026-11-01");
  } finally { guide.updated = previous; }
});

test("comparison table and writing steps use semantic accessible HTML", async () => {
  const comparison = await render("headcanon-vs-canon");
  assert.match(comparison, /<caption[^>]*>Fandom terms compared with invented examples<\/caption>/);
  assert.equal((comparison.match(/scope="col"/g) ?? []).length, 3);
  assert.equal((comparison.match(/scope="row"/g) ?? []).length, 4);
  assert.match(await render("how-to-write-a-character-headcanon"), /<ol[^>]*>.*?<li>/s);
  assert.match(await render("how-to-create-an-oc-headcanon"), /<ol[^>]*>.*?<li>/s);
});

test("citations point to the references visible on the same page", async () => {
  for (const guide of WRITING_GUIDES) {
    const references = guide.sections.flatMap((section) => section.reference ? [section.reference] : []);
    const html = await render(guide.slug);
    const schema = articleSchema(html);
    assert.equal(JSON.stringify(schema.citation ?? []), JSON.stringify(references.map((reference) => reference.href)));
    for (const reference of references) {
      assert.ok(["www.dictionary.com", "www.merriam-webster.com"].includes(new URL(reference.href).hostname));
      assert.ok(html.includes(`href="${reference.href}"`));
    }
    assert.ok(html.includes("Original writing examples by Headcanon Generator."));
  }
});

test("llms reading guide links only to canonical public pages", () => {
  const text = fs.readFileSync(path.join(root, "public/llms.txt"), "utf8");
  const pages = new Set(sitemap().map((item) => new URL(item.url).pathname));
  pages.add("/sitemap.xml");
  const links = [...text.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map((match) => new URL(match[1]));
  assert.ok(links.length >= 15);
  for (const url of links) {
    assert.equal(url.origin, "https://headcanongenerator.run");
    assert.ok(pages.has(url.pathname), `${url.pathname} must be a public sitemap page`);
    assert.ok(!url.search);
  }
  assert.ok(!/[\u2013\u2014]/.test(text));
  assert.ok(text.includes("not a replacement for robots.txt"));
});

test("about page exposes the byline destination without claiming outside credentials", () => {
  const About = load("app/about/page.tsx").default;
  const html = renderToStaticMarkup(React.createElement(About));
  assert.ok(html.includes('id="content-review"'));
  assert.ok(html.includes("not an outside expert"));
});

test("deep guides include complete revisions, nine relationship cases, and an actual six-field worksheet", async () => {
  const writing = WRITING_GUIDES.find(guide => guide.slug === "how-to-write-a-character-headcanon");
  const examples = writing.sections.filter(section => section.example);
  assert.equal(examples.length, 3);
  for (const { example } of examples) {
    for (const field of ["input", "draft", "problem", "revised", "reason"]) assert.ok(example[field].length > 30);
    assert.ok(example.scene.length >= 4);
    assert.notEqual(example.draft, example.revised);
  }
  const relationship = WRITING_GUIDES.find(guide => guide.slug === "relationship-headcanon-ideas");
  const tables = relationship.sections.filter(section => section.table);
  assert.equal(tables.length, 3);
  assert.equal(tables.flatMap(section => section.table.rows).length, 9);
  for (const { table } of tables) assert.equal(table.rows.map(row => row[0]).join(","), "Friendship,Romance,Rivals");
  const oc = await render("how-to-create-an-oc-headcanon");
  for (const field of ["Character / setting", "What they want", "One habit or contradiction", "What gets in their way", "What I have not decided", "A scene that would test it"]) assert.ok(oc.includes(field));
  assert.ok(oc.includes('aria-label="Download text"'));
  const paragraphs = WRITING_GUIDES.slice(2).flatMap(guide => guide.sections.flatMap(section => section.paragraphs));
  assert.equal(new Set(paragraphs).size, paragraphs.length);
  assert.ok(!/[\u2013\u2014]/.test(JSON.stringify(WRITING_GUIDES.slice(2))));
  assert.ok(!/not a test|not official|rather than separate near-identical|without flattening|not quotations/.test(JSON.stringify(WRITING_GUIDES.slice(2))));
});

test("ten input recipes round-trip through the real draft parser and respect every field limit", async () => {
  const { INPUT_RECIPES, recipeHref, recipeText } = load("lib/deep-guides.ts");
  const { readGeneratorDraft } = load("lib/generator-draft.ts");
  assert.equal(INPUT_RECIPES.length, 10);
  for (const recipe of INPUT_RECIPES) {
    const url = new URL(recipeHref(recipe), "https://headcanongenerator.run");
    const draft = readGeneratorDraft(url.search, { characterName: "Old name", secondCharacter: "Old pair", workName: "Old fandom", tone: "fluff" });
    assert.equal(draft.characterName, recipe.character);
    assert.equal(draft.secondCharacter, recipe.secondCharacter ?? "");
    assert.equal(draft.workName, recipe.fandom ?? "");
    assert.equal(draft.mode, recipe.mode);
    assert.equal(draft.relationshipKind, recipe.relationshipKind ?? "any");
    assert.equal(draft.tone, recipe.tone ?? "any");
    assert.equal(draft.scenario, recipe.scenario);
    assert.ok(recipe.scenario.length <= 240);
    assert.ok(recipe.character.length <= 80);
    assert.ok((recipe.secondCharacter?.length ?? 0) <= 80);
    assert.ok(recipeText(recipe).includes(`Scene: ${recipe.scenario}`));
  }
  const html = await render("headcanon-generator-prompts");
  assert.equal((html.match(/>Load input<\/a>/g) ?? []).length, 10);
  const metadata = await guidePage.generateMetadata({ params: Promise.resolve({ slug: "headcanon-generator-prompts" }) });
  assert.equal(metadata.alternates.canonical, "https://headcanongenerator.run/guides/headcanon-generator-prompts");
  assert.ok(sitemap().some(item => item.url === metadata.alternates.canonical));
});

test("Gojo study separates official sources, interpretation, and original fiction", async () => {
  const { GOJO_STUDY, GOJO_EXAMPLE } = load("lib/gojo-study.ts");
  const page = load("app/fandom/[fandom-slug]/[character-slug]/page.tsx");
  const params = Promise.resolve({ "fandom-slug": "jujutsu-kaisen", "character-slug": "gojo-satoru" });
  const html = renderToStaticMarkup(await page.default({ params }));
  const schema = articleSchema(html);
  assert.equal(schema.dateModified, GOJO_STUDY.updated);
  assert.equal(JSON.stringify(schema.citation), JSON.stringify(GOJO_STUDY.sources.map(source => source.href)));
  for (const source of GOJO_STUDY.sources) {
    assert.equal(new URL(source.href).hostname, "jujutsukaisen.jp");
    assert.ok(html.includes(source.href));
  }
  for (const label of ["Two source anchors", "A reading to build on", "Original fan-writing example", "season 1 episode 7"]) assert.ok(html.includes(label));
  assert.equal(GOJO_EXAMPLE.moreIdeas.length, 4);
  assert.equal(sitemap().find(item => item.url.endsWith(GOJO_EXAMPLE.shareUrl)).lastModified, GOJO_STUDY.updated);
  assert.equal(sitemap().find(item => item.url.endsWith("/relationship-headcanon-generator")).lastModified, "2026-10-30");
  assert.ok(!/afraid of being alone|blindfold helps him control|loneliness themes/.test(html));
});

const renderHomeArticle = () => {
  const { SeoSection } = load("components/SeoSection.tsx");
  const html = renderToStaticMarkup(React.createElement(SeoSection));
  const article = html.match(/<article id="headcanon-basics"[^>]*>(.*?)<\/article>/s)?.[1];
  assert.ok(article, "Homepage overview must be rendered without opening an accordion");
  return article;
};

test("homepage overview has a visible direct definition and attributed source quotation", () => {
  const article = renderHomeArticle();
  assert.match(article, /<h2[^>]*>What is a headcanon\?<\/h2><p[^>]*>A headcanon is/);
  const source = "https://www.merriam-webster.com/wordplay/words-were-watching-headcanon-fanon";
  assert.ok(article.includes(`<blockquote cite="${source}"`));
  assert.ok(article.includes(`<a href="${source}"`));
  assert.ok(article.includes("<q>something that a fan imagines to be true about a character</q>"));
  assert.ok(article.includes("not facts about official canon"));
});

test("homepage mode comparison uses accessible table headers and describes real inputs", () => {
  const article = renderHomeArticle();
  assert.match(article, /<caption[^>]*>Three generation modes and when to use them<\/caption>/);
  assert.equal((article.match(/scope="col"/g) ?? []).length, 3);
  assert.equal((article.match(/scope="row"/g) ?? []).length, 3);
  assert.ok(article.includes("[overflow-wrap:anywhere]"));
  for (const mode of ["Character", "Relationship", "Original character"]) {
    assert.ok(article.includes(`font-medium">${mode}</th>`));
  }
  assert.ok(article.includes("Both names"));
  assert.ok(article.includes("optional context"));
});

test("homepage cost facts agree with visible product and successful batch rules", () => {
  const article = renderHomeArticle();
  const form = fs.readFileSync(path.join(root, "components/HeroSection.tsx"), "utf8");
  const generation = fs.readFileSync(path.join(root, "commerce/src/server/text-generation.ts"), "utf8");
  const pack = JSON.parse(fs.readFileSync(path.join(root, "commerce/src/config/plans.json"), "utf8")).products.pack;
  assert.equal(pack.price, 990);
  assert.equal(pack.credits, 100);
  assert.ok(form.includes("1 credit for 5 ideas. 100 credits for $9.90, no subscription."));
  assert.ok(generation.includes("items.length !== 5"));
  assert.ok(generation.includes("No credit was charged."));
  assert.match(article, /<ul[^>]*>.*?<li>.*?100 credits:.*?<\/li>.*?500 ideas:/s);
  assert.ok(article.includes("One successful batch costs 1 credit and returns 5 ideas."));
  assert.ok(article.includes("not a promise of 500 publish-ready passages"));
  assert.ok(!/[\u2013\u2014]/.test(article));
});
