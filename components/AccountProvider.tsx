"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Coins, Loader2, LogIn, LogOut, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { commerceRequest, type AccountState } from "@/lib/commerce";

type Context = { account: AccountState | null; refresh: () => Promise<AccountState>; openLogin: () => void; buy: () => Promise<void> };
const AccountContext = createContext<Context | null>(null);
export function useAccount() {
  const value = useContext(AccountContext);
  if (!value) throw new Error("AccountProvider is missing.");
  return value;
}
export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AccountState | null>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const checkoutKey = useRef<string | null>(null);
  const refresh = useCallback(async () => {
    const state = await commerceRequest<AccountState>("/api/state");
    setAccount(state); return state;
  }, []);
  useEffect(() => {
    let active = true;
    void commerceRequest<AccountState>("/api/state").then(state => { if (active) setAccount(state); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("payment")) return;
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      void refresh().then(state => {
        if (state.user && state.balance > 0) {
          window.clearInterval(timer);
          const url = new URL(window.location.href); url.searchParams.delete("payment");
          window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
        }
      }).catch(() => {});
      if (attempts >= 20) window.clearInterval(timer);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  const openLogin = useCallback(() => { setError(""); setOpen(true); }, []);
  const buy = useCallback(async () => {
    const current = await refresh();
    if (!current.user) { openLogin(); return; }
    if (!current.capabilities.payments) throw new Error("Purchases are temporarily unavailable. Please try again later.");
    const idempotencyKey = checkoutKey.current ??= crypto.randomUUID();
    const result = await commerceRequest<{ checkoutUrl: string | null }>("/api/checkout", {
      method: "POST", headers: { "Content-Type": "application/json", "x-csrf-token": current.csrfToken || "" },
      body: JSON.stringify({ product: "pack", idempotencyKey }),
    });
    if (!result.checkoutUrl) { checkoutKey.current = null; throw new Error("Checkout could not be opened. No payment has been confirmed."); }
    const url = new URL(result.checkoutUrl);
    if (url.protocol !== "https:" || !(url.hostname === "waffo.ai" || url.hostname.endsWith(".waffo.ai"))) throw new Error("The payment address could not be verified.");
    window.location.assign(url.toString());
  }, [refresh, openLogin]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      if (!sent) {
        await commerceRequest("/api/auth/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
        setSent(true);
      } else {
        const state = await commerceRequest<AccountState>("/api/auth/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, code }) });
        setAccount(state); setOpen(false); setCode(""); setSent(false);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Sign-in could not be completed."); }
    finally { setBusy(false); }
  };
  return <AccountContext.Provider value={{ account, refresh, openLogin, buy }}>
    {children}
    <dialog ref={dialogRef} onCancel={() => setOpen(false)} onClose={() => setOpen(false)} aria-labelledby="signin-title" className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg border border-slate-200 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-black/40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
      <div className="mb-5 flex items-center justify-between gap-4"><h2 id="signin-title" className="text-xl font-semibold">Sign in</h2><button type="button" aria-label="Close sign-in" title="Close" onClick={() => setOpen(false)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><X className="h-5 w-5" /></button></div>
      <form onSubmit={submit} className="space-y-4">
        <div><label htmlFor="account-email" className="mb-2 block text-sm font-medium">Email</label><Input id="account-email" type="email" autoComplete="email" required maxLength={320} value={email} readOnly={sent} onChange={event => setEmail(event.target.value)} className="h-11" /></div>
        {sent && <div><label htmlFor="account-code" className="mb-2 block text-sm font-medium">Six-digit email code</label><Input id="account-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required maxLength={6} value={code} onChange={event => setCode(event.target.value)} className="h-11" /><p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Check your inbox. The code expires in 10 minutes.</p></div>}
        {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
        <Button type="submit" variant="primary" disabled={busy} className="min-h-11 w-full">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{sent ? "Sign in" : "Send code"}</Button>
        {sent && <button type="button" onClick={() => { setSent(false); setCode(""); }} className="min-h-11 text-sm text-indigo-600 underline dark:text-indigo-400">Use another email or resend</button>}
        <p className="text-xs leading-relaxed text-slate-500">By continuing, you agree to the <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy policy</Link>.</p>
      </form>
    </dialog>
  </AccountContext.Provider>;
}
export function AccountMenu() {
  const { account, refresh, openLogin, buy } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const purchase = async () => { setBusy(true); setError(""); try { await buy(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Checkout is unavailable."); } finally { setBusy(false); } };
  const signOut = async () => {
    setError("");
    try { await commerceRequest("/api/auth/logout", { method: "POST", headers: { "x-csrf-token": account?.csrfToken || "" } }); await refresh(); }
    catch { setError("Sign-out could not finish. Please try again."); }
  };
  return <div className="relative flex shrink-0 items-center gap-2">
    {account?.user ? <>
      <span className="inline-flex items-center gap-1 text-sm tabular-nums" title={`${account.balance} credits available`}><Coins className="h-4 w-4 text-indigo-600" />{account.balance}</span>
      <button type="button" onClick={purchase} disabled={busy} className="min-h-11 rounded-md px-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-400 dark:hover:bg-indigo-950">{busy ? "Opening..." : "$9.90 / 100"}</button>
      <button type="button" onClick={signOut} aria-label="Sign out" title="Sign out" className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"><LogOut className="h-4 w-4" /></button>
    </> : <button type="button" onClick={openLogin} className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800"><LogIn className="h-4 w-4" /><span>Sign in</span></button>}
    {error && <p role="alert" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-md border border-red-200 bg-white p-3 text-sm text-red-700 shadow dark:bg-slate-950">{error}</p>}
  </div>;
}
