import { useEffect, useState } from "react";
import { Transaction, fetchRecentTransactions, subscribeToTransactions } from "@/lib/supabase";

export function useRealtimeTransactions(limit: number = 6) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTransactions = async () => {
      try {
        const data = await fetchRecentTransactions(limit);
        if (mounted) {
          setTransactions(data);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load transactions");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadTransactions();

    // Subscribe to real-time updates
    const subscription = subscribeToTransactions((newTx) => {
      if (mounted) {
        setTransactions((prev) => [newTx, ...prev.slice(0, limit - 1)]);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [limit]);

  return { transactions, loading, error };
}
