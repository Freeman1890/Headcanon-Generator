export type Style =
  "3d" | "cartoon" | "anime" | "watercolor" | "fantasy" | "realistic";
export type Operation =
  | "generate"
  | "edit"
  | "expressions"
  | "views"
  | "scenes"
  | "remove-background"
  | "upscale";
export type Product =
  | "pack"
  | "creator-monthly"
  | "creator-yearly"
  | "studio-monthly"
  | "studio-yearly";
export interface Asset {
  id: string;
  url: string;
  style: Style;
  prompt: string;
  operation: Operation;
  characterId?: string;
  parentId?: string;
  createdAt: string;
  expiresAt: string;
  watermarked: boolean;
  mode: "preview" | "live";
  width: number;
  height: number;
  name?: string;
}
export interface Character {
  id: string;
  name: string;
  notes: string;
  referenceUrl: string;
  style: Style;
  createdAt: string;
  assetId?: string;
  readOnly?: boolean;
  readOnlyUntil?: string;
}
export interface CharacterRetention {
  limit: number;
  selectedIds: string[];
  overLimit: boolean;
  selectionRequired: boolean;
  readOnlyUntil: string | null;
}
export type ExpiryNotificationKind = "asset_expiry" | "character_retention_expiry";
export type ExpiryNotificationStatus = "unread" | "read" | "ignored" | "expired";
export interface ExpiryNotification {
  id: string;
  kind: ExpiryNotificationKind;
  assetId?: string;
  characterId?: string;
  deadline: string;
  status: ExpiryNotificationStatus;
  createdAt: string;
  expiredAt?: string;
}
export interface Job {
  id: string;
  operation: Operation;
  status: "queued" | "processing" | "succeeded" | "failed" | "partial";
  cost: number;
  createdAt: string;
  children: {
    id: string;
    label: string;
    status: "queued" | "processing" | "succeeded" | "failed";
    assetId?: string;
    error?: string;
  }[];
}
export interface Grant {
  id: string;
  source: string;
  remaining: number;
  amount: number;
  expiresAt: string;
  createdAt: string;
}
export interface Ledger {
  id: string;
  kind: string;
  amount: number;
  description: string;
  createdAt: string;
}
export interface Order {
  id: string;
  product: Product;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  mode: string;
}
export interface Subscription {
  plan: "creator" | "studio";
  interval: "monthly" | "yearly";
  status: string;
  periodEnd: string;
  cancelAtPeriodEnd: boolean;
  nextPlan?: Product;
}
export interface AppState {
  mode: "preview" | "live";
  user: { id: string; email: string; name: string } | null;
  balance: number;
  reserved: number;
  plan: "free" | "pack" | "creator" | "studio";
  characterLimit: number;
  parallelism: number;
  characters: Character[];
  assets: Asset[];
  jobs: Job[];
  grants: Grant[];
  ledger: Ledger[];
  orders: Order[];
  subscription: Subscription | null;
  capabilities: { generation: boolean; payments: boolean; email: boolean };
  characterRetention?: CharacterRetention | null;
  notifications?: ExpiryNotification[];
  csrfToken?: string;
}
export interface JobInput {
  operation: Operation;
  referenceUrl: string;
  style: Style;
  prompt: string;
  framing: string;
  ratio: string;
  characterId?: string;
  parentAssetId?: string;
  items?: string[];
  idempotencyKey: string;
}
