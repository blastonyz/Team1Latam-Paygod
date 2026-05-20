import { createClient, SupabaseClient } from "@supabase/supabase-js";

function readEnv(name: string): string {
  const value = (process.env[name] || "").trim();
  if (!value) return "";

  // Ignore template placeholders in local development.
  const upper = value.toUpperCase();
  if (upper === `YOUR_${name.replace(/^NEXT_PUBLIC_/, "")}` || upper.includes("YOUR_SUPABASE")) {
    return "";
  }

  return value;
}

const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

let supabase: SupabaseClient | null = null;

if (isValidHttpUrl(supabaseUrl) && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else if (supabaseUrl || supabaseKey) {
  console.warn("Supabase env vars are present but invalid. Realtime disabled until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are valid.");
}

export { supabase };

export type Transaction = {
  id: string;
  tx_hash: string;
  sender_wallet: string;
  recipient_wallet: string;
  amount_encrypted: string;
  status: "approved" | "pending" | "flagged";
  auditor_decision?: string;
  risk_score?: number;
  timestamp: string;
  created_at: string;
};

export async function fetchRecentTransactions(limit: number = 6): Promise<Transaction[]> {
  if (!supabase) {
    console.warn("Supabase not configured - returning empty transactions");
    return [];
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }

  return (data as Transaction[]) || [];
}

export function subscribeToTransactions(
  callback: (tx: Transaction) => void,
) {
  if (!supabase) {
    console.warn("Supabase not configured - realtime subscriptions unavailable");
    return null;
  }

  const subscription = supabase
    .channel("transactions-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "transactions" },
      (payload) => {
        if (payload.new) {
          callback(payload.new as Transaction);
        }
      },
    )
    .subscribe();

  return subscription;
}
