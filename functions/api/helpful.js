export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").replace(/[^a-zA-Z0-9_-]/g, "");
  if (!slug) return Response.json({ count: 0 });

  const val = env.HELPFUL_KV ? await env.HELPFUL_KV.get(`helpful:${slug}`) : "0";
  return Response.json(
    { count: parseInt(val || "0", 10) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const slug = (url.searchParams.get("slug") || "").replace(/[^a-zA-Z0-9_-]/g, "");
  if (!slug || !env.HELPFUL_KV) return Response.json({ count: 0 }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const delta = body.action === "unlike" ? -1 : 1;

  const key = `helpful:${slug}`;
  const current = parseInt((await env.HELPFUL_KV.get(key)) || "0", 10);
  const next = Math.max(0, current + delta);
  await env.HELPFUL_KV.put(key, String(next));

  return Response.json(
    { count: next },
    { headers: { "Cache-Control": "no-store" } }
  );
}
