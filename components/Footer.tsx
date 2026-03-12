import { Activity, Github } from "lucide-react";
import Link from "next/link";

async function getServerStatus(): Promise<{ status: string; latency?: number }> {
  // Mock server status check — replace with actual health check API
  try {
    const start = Date.now();
    const latency = Date.now() - start;
    return { status: "operational", latency };
  } catch {
    return { status: "degraded" };
  }
}

export async function Footer() {
  const serverStatus = await getServerStatus();

  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="text-lg font-semibold text-slate-900 dark:text-slate-50"
            >
              Headcanon Generator
            </Link>
            <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
              AI-powered headcanon generator for fanfiction, roleplay, and creative inspiration.
            </p>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
            <div className="flex items-center gap-2">
              <Activity
                className={`h-4 w-4 ${
                  serverStatus.status === "operational"
                    ? "text-emerald-500"
                    : "text-amber-500"
                }`}
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Status:{" "}
                <span
                  className={
                    serverStatus.status === "operational"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-amber-600 dark:text-amber-400"
                  }
                >
                  {serverStatus.status === "operational" ? "Operational" : "Degraded"}
                </span>
              </span>
            </div>

            <div className="flex gap-6">
              <Link
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-8 dark:border-slate-800">
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            © {new Date().getFullYear()} Headcanon Generator. For creative reference only.
          </p>
        </div>
      </div>
    </footer>
  );
}
