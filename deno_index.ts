async function handler(req: Request): Promise<Response> {
  const incomingUrl = new URL(req.url);

  // 根路径：返回简单提示，供 Deno Deploy 热身检查使用
  if (incomingUrl.pathname === "/") {
    return new Response("此地址只用于为 AstrBot 提供更快速的 GitHub 访问服务", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // 从路径中提取目标 URL
  const targetUrlString = decodeURIComponent(incomingUrl.pathname.slice(1));

  if (
    !targetUrlString ||
    (!targetUrlString.startsWith("http://") && !targetUrlString.startsWith("https://"))
  ) {
    return new Response("路径中目标 URL 无效或缺失。用法：/<target_url>", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  console.log(`Proxying request to: ${targetUrlString}`);

  try {
    const response = await fetch(targetUrlString, {
      headers: req.headers,
      method: req.method,
      body: req.body,
      redirect: "manual",
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, *");

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: responseHeaders });
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`Error fetching ${targetUrlString}:`, error);
    return new Response(`Failed to proxy request: ${(error as Error).message}`, {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

console.log("此地址只用于帮助 AstrBot 更快的连接 GitHub");
Deno.serve(handler);
