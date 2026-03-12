import { notFound } from "next/navigation";
import { STATIC_HEADCANON_EXAMPLES } from "@/lib/static-examples";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const runtime = "edge";

// ISR: 每 3600 秒重新验证
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ "fandom-slug": string; "character-slug": string }>;
}

/**
 * 静态模式 (pSEO)：预生成的 Batch API 内容
 * 路径示例：/fandom/genshin-impact/raiden-shogun
 */
export default async function FandomCharacterPage({ params }: PageProps) {
  const { "fandom-slug": fandomSlug, "character-slug": characterSlug } =
    await params;

  // TODO: 从 Supabase 拉取预生成的 Batch API 内容
  // const { data } = await createSupabaseClient()
  //   .from('headcanons')
  //   .select('*')
  //   .eq('fandom_slug', fandomSlug)
  //   .eq('character_slug', characterSlug)
  //   .single();

  // 当前使用静态示例匹配，后续从 Supabase 拉取 Batch API 预生成内容
  const expectedPath = `/fandom/${fandomSlug}/${characterSlug}`;
  const match = STATIC_HEADCANON_EXAMPLES.find(
    (ex) => ex.shareUrl === expectedPath
  );

  if (!match) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card>
          <CardHeader>
            <CardTitle>
              {match.characterName}
              {match.workName && (
                <span className="ml-2 text-base font-normal text-slate-500">
                  · {match.workName}
                </span>
              )}
            </CardTitle>
            <CardDescription>Headcanon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
              {match.content}
            </p>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-sm text-slate-500">
          <a href="/" className="hover:underline">
            Back to homepage to generate more
          </a>
        </p>
      </div>
    </div>
  );
}
