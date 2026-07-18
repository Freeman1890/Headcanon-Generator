"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

interface ShareContentProps {
  characterName: string;
  legacyHeadcanon?: string;
  legacyWorkName?: string;
}

export function ShareContent({
  characterName,
  legacyHeadcanon,
  legacyWorkName,
}: ShareContentProps) {
  const [headcanon, setHeadcanon] = useState(legacyHeadcanon);
  const [workName, setWorkName] = useState(legacyWorkName);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fragment = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(fragment);
    const fragmentHeadcanon = params.get("headcanon");
    const fragmentWorkName = params.get("work");

    const timer = window.setTimeout(() => {
      if (fragmentHeadcanon) {
        setHeadcanon(fragmentHeadcanon);
      }
      if (fragmentWorkName) {
        setWorkName(fragmentWorkName);
      }
      setLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight">
              {characterName}
              {workName ? ` headcanon for ${workName}` : " headcanon"}
            </h1>
            <CardDescription>Shared headcanon</CardDescription>
          </CardHeader>
          <CardContent>
            {!loaded && !headcanon ? (
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                Loading shared headcanon...
              </p>
            ) : headcanon ? (
              <p className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300">
                {headcanon}
              </p>
            ) : (
              <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                This shared link does not include a saved headcanon. Generate a
                fresh one and share it again.
              </p>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/" className="hover:underline">
            Back to homepage to generate more
          </Link>
        </p>
      </div>
    </main>
  );
}
