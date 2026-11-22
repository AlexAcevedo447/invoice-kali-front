// Cloudflare Pages Function: proxy same-origin de /api/* hacia las APIs.
//
// Replica el reparto por ruta de nginx.conf: catálogos, facturas, ítems y
// métricas van a kali-invoice-service; el resto de /api/ a kali-auth-context.
// Así el navegador solo habla con el dominio del front y las APIs no
// necesitan CORS. Los orígenes se configuran como variables de la Function
// (no VITE_*, no llegan al bundle):
//   AUTH_API_ORIGIN       p. ej. https://kali-auth-demo.onrender.com
//   INVOICING_API_ORIGIN  p. ej. https://kali-invoice-demo.onrender.com

const INVOICING_PATH =
  /^\/api\/v1\/(invoices|invoice-items|customers|products|metrics)(\/|$)/;

export function resolveOrigin(pathname, env) {
  return INVOICING_PATH.test(pathname)
    ? env.INVOICING_API_ORIGIN
    : env.AUTH_API_ORIGIN;
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const origin = resolveOrigin(url.pathname, env);
  if (!origin) {
    return new Response(
      JSON.stringify({ error: "API origin not configured" }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }

  const target = new URL(url.pathname + url.search, origin);
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.set("x-forwarded-host", url.host);
  headers.set("x-forwarded-proto", url.protocol.replace(":", ""));

  const hasBody = !["GET", "HEAD"].includes(request.method);
  return fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: "manual",
    ...(hasBody ? { duplex: "half" } : {}),
  });
}
