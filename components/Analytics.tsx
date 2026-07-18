"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const CONSENT_KEY = "headcanon-analytics-consent";

export function Analytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<"accepted" | "declined" | null>(null);

  useEffect(() => {
    let savedConsent: "accepted" | "declined" = "declined";

    try {
      const saved = window.localStorage.getItem(CONSENT_KEY);
      if (saved === "accepted" || saved === "declined") {
        savedConsent = saved;
      }
    } catch {
      savedConsent = "declined";
    }

    const timer = window.setTimeout(() => setConsent(savedConsent), 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (pathname.startsWith("/share/")) {
    return null;
  }

  const chooseConsent = (value: "accepted" | "declined") => {
    try {
      window.localStorage.setItem(CONSENT_KEY, value);
    } catch {
      // The choice still applies for this page when storage is unavailable.
    }
    setConsent(value);
  };

  return (
    <>
      {consent === "accepted" && (
        <>
          <Script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-L1SQ5EQQ4Q"
            strategy="lazyOnload"
          />
          <Script id="gtag-init" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-L1SQ5EQQ4Q');
            `}
          </Script>
        </>
      )}

      {consent === null && (
        <div
          role="dialog"
          aria-label="Analytics consent"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:flex sm:items-center sm:gap-5"
        >
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            This site uses Google Analytics to understand which pages are useful.
            Choose whether to allow analytics cookies. Read the{" "}
            <Link href="/privacy" className="text-indigo-600 underline dark:text-indigo-400">
              privacy policy
            </Link>
            .
          </p>
          <div className="mt-3 flex shrink-0 gap-2 sm:mt-0">
            <button
              type="button"
              onClick={() => chooseConsent("declined")}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => chooseConsent("accepted")}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Allow analytics
            </button>
          </div>
        </div>
      )}
    </>
  );
}
