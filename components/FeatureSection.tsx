import { PenLine, Sparkles, Lightbulb } from "lucide-react";
import { STATIC_HEADCANON_EXAMPLES } from "@/lib/static-examples";

const STEPS = [
  {
    icon: PenLine,
    title: "Enter Character",
    description: "Add a character name and, if it helps, the fandom they come from.",
  },
  {
    icon: Sparkles,
    title: "Generate Idea",
    description: "Get a short headcanon with a concrete detail you can use in a scene.",
  },
  {
    icon: Lightbulb,
    title: "Shape the Scene",
    description: "Keep the idea as-is, rewrite it, or use it as a starting point.",
  },
];

const USE_CASES = [
  {
    title: "Fanfiction Writing",
    desc: "Find a small character detail when a scene needs a hook.",
  },
  {
    title: "Roleplay Reference",
    desc: "Give a character one private habit, preference, or reaction to play with.",
  },
  {
    title: "Social Sharing",
    desc: "Copy or share a headcanon when it feels worth keeping.",
  },
];

export function FeatureSection() {
  return (
    <section id="features" className="scroll-mt-24 border-t border-slate-200 bg-slate-50/50 py-20 dark:border-slate-800 dark:bg-slate-900/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-20">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                  <step.icon className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                </div>
                <span className="mb-2 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  Step {i + 1}
                </span>
                <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-20">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Use Cases
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {USE_CASES.map((uc) => (
              <div
                key={uc.title}
                className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
              >
                <h3 className="mb-2 font-semibold text-slate-900 dark:text-slate-50">
                  {uc.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {uc.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Featured Examples
          </h2>
          <p className="mb-8 text-center text-slate-600 dark:text-slate-400">
            A few sample headcanons you can adapt or rewrite.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {STATIC_HEADCANON_EXAMPLES.map((ex) => (
              <article
                key={ex.id}
                className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"
              >
                <h3 className="mb-1 font-semibold text-slate-900 dark:text-slate-50">
                  {ex.characterName}
                  {ex.workName && (
                    <>
                      &nbsp;
                      <span className="ml-2 text-sm font-normal text-slate-500">
                        in {ex.workName}
                      </span>
                    </>
                  )}
                </h3>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {ex.content}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
