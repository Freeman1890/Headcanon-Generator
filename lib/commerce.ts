export type AccountState = {
  user: { id: string; email: string; name: string } | null;
  balance: number; reserved: number; csrfToken?: string;
  capabilities: { email: boolean; generation: boolean; payments: boolean };
};
export type GenerationMode = "character" | "relationship" | "oc";
export type HeadcanonResult = {
  id: string; characterName: string; workName?: string; content: string;
  headcanons?: string[]; shareUrl?: string; status?: string; error?: string;
};
export class CommerceError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export async function commerceRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...options, credentials: "same-origin", cache: "no-store" });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new CommerceError(typeof body.error === "string" ? body.error : "The service is unavailable. Please try again later.", response.status);
  return body as T;
}
