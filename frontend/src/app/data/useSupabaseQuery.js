import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

/**
 * Runs `queryFn(supabase)` (an async function returning { data, error }) and
 * returns { data, loading, error, refetch }. Falls back to `fallbackData`
 * when Supabase isn't configured, the query errors, or returns an empty list
 * — so every screen renders something sensible in a fresh project before any
 * real data exists, without hiding real (configured + populated) data.
 */
export function useSupabaseQuery(queryFn, deps = [], initialData = null) {
  const [state, setState] = useState({ data: initialData, loading: true, error: null });

  const run = async () => {
    if (!supabase) {
      setState({ data: initialData, loading: false, error: new Error("Supabase is not configured.") });
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const { data, error } = await queryFn(supabase);
      if (error) throw error;
      setState({ data, loading: false, error: null });
    } catch (error) {
      console.error("Supabase query failed:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      });
      setState({ data: initialData, loading: false, error });
    }
  };

  useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ...state, refetch: run };
}
