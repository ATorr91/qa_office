import type { Signal, SignalOrigin } from "./signals";

export type SignalsQueryMode = "search" | "featured";

export interface SignalsQuery {
  query?: string;
  origin?: SignalOrigin | "all";
  mode?: SignalsQueryMode;
}

/**
 * Client-side seam for signal retrieval. Calls our own same-origin API route
 * (src/app/api/trends/search/route.ts), which today just serves the curated,
 * manually-verified dataset in src/lib/signals.ts. Swapping to a real live
 * search API later only requires changing that route handler — this function
 * and every component that calls it stay the same.
 */
export async function fetchSignals(params: SignalsQuery): Promise<Signal[]> {
  const qs = new URLSearchParams();
  if (params.query) qs.set("q", params.query);
  if (params.origin && params.origin !== "all") qs.set("origin", params.origin);
  if (params.mode) qs.set("mode", params.mode);

  const res = await fetch(`/api/trends/search?${qs.toString()}`);
  if (!res.ok) throw new Error("No se pudieron obtener señales de tendencias.");
  const data = (await res.json()) as { signals: Signal[] };
  return data.signals;
}
