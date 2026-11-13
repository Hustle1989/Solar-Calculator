"use client";

import { useCallback, useState, type ReactNode } from "react";
import { createRealtimeClient, type SealedLiveQuery } from "@neon/realtime/client";
import { drizzleParsers } from "@neon/realtime-drizzle/client";
import { RealtimeProvider, useLiveQuery } from "@neon/realtime-react";

/** One Realtime client per page load, created in the browser tree (never at module level, per SSR guidance). */
export function RealtimeRoot({ children }: { children: ReactNode }) {
  const [client] = useState(() =>
    createRealtimeClient({
      url: process.env.NEXT_PUBLIC_NEON_REALTIME_URL!,
      parsers: { ...drizzleParsers },
    }),
  );
  return <RealtimeProvider client={client}>{children}</RealtimeProvider>;
}

// A full page load resets this. Once a renewal fails as signed out, stop calling the server.
let signedOut = false;

/**
 * Subscribes to a server-sealed live query. Renders `initialData` straight away, then live rows.
 * Renewals go through /api/live/<name> for the same user the page was rendered for.
 */
export function useLive<Row>(name: string, userId: string, sealedQuery: SealedLiveQuery<Row>, initialData: Row[]) {
  const [query] = useState(sealedQuery); // keep the first sealed query; renewals go through refreshQuery
  const refreshQuery = useCallback(async () => {
    if (signedOut) throw new Error("Signed out");
    const res = await fetch(`/api/live/${name}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.status === 401) {
      signedOut = true;
      window.location.reload(); // leave with a full page load; the server redirects to sign-in
      throw new Error("Signed out");
    }
    if (!res.ok) throw new Error(`Could not renew live data (${res.status})`);
    return (await res.json()) as SealedLiveQuery<Row>;
  }, [name, userId]);

  const { data, status, error } = useLiveQuery(query, { refreshQuery, initialData });
  return { rows: (data ?? initialData) as readonly Row[], status, error };
}
