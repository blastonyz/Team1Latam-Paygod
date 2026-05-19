import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseKey);

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
  const subscription = supabase
    .from("transactions")
    .on("*", (payload) => {
      if (payload.new) {
        callback(payload.new as Transaction);
      }
    })
    .subscribe();

  return subscription;
}
