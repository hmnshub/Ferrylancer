import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

/**
 * Runs `queryFn(supabase)` (an async function returning { data, error }) and
 * returns { data, loading, error, refetch }. Falls back to `fallbackData`
 * when Supabase isn't configured, the query errors, or returns an empty list
 * — so every screen renders something sensible in a fresh project before any
 * real data exists, without hiding real (configured + populated) data.
 */
export function useSupabaseQuery(queryFn, deps = [], fallbackData = null) {
  const [state, setState] = useState({ data: fallbackData, loading: true, error: null });

  const run = async () => {
    if (!supabase) {
      setState({ data: fallbackData, loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const { data, error } = await queryFn(supabase);
      if (error) throw error;
      const isEmptyList = Array.isArray(data) && data.length === 0;
      setState({ data: isEmptyList || data == null ? fallbackData : data, loading: false, error: null });
    } catch (error) {
      console.error("Supabase query failed:", error);
      setState({ data: fallbackData, loading: false, error });
    }
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, refetch: run };
}
