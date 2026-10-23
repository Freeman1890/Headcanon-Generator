export async function proxyCommerce(request: Request) {
  const endpoint = process.env.COMMERCE_DEV_URL;
  if (process.env.NODE_ENV === "production" || !endpoint || !/^http:\/\/127\.0\.0\.1:\d+$/.test(endpoint)) return Response.json({ error: "The account service is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  const url = new URL(request.url);
  const headers = new Headers(request.headers); headers.delete("host");
  try {
    return await fetch(`${endpoint}${url.pathname}${url.search}`, { method: request.method, headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer(), redirect: "manual", cache: "no-store" });
  } catch { return Response.json({ error: "The local account service is not running." }, { status: 503 }); }
}
