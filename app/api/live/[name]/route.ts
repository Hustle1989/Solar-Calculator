// Renews sealed live queries for the browser (they expire after ~60 seconds).
// The user comes from the session cookie, never from the request. A page sends the user id it was
// rendered for; a different session is treated as signed out, so an old tab can't keep another user's data live.
import { getViewer } from "@/lib/auth/viewer";
import { live, sealLive, type LiveName } from "@/lib/realtime";

export async function POST(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const name = (await params).name as LiveName;
  const viewer = await getViewer();
  const body = (await request.json().catch(() => ({}))) as { userId?: unknown };

  if (!viewer || !viewer.profile.active || body.userId !== viewer.userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const noStore = { headers: { "Cache-Control": "no-store" } };
  switch (name) {
    case "customer-status":
      return Response.json(await sealLive(live.customerStatus(viewer.userId)), noStore);
    case "admin-queue":
      if (viewer.profile.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
      return Response.json(await sealLive(live.adminQueue()), noStore);
    default:
      return Response.json({ error: "Unknown live query" }, { status: 404 });
  }
}
