/**
 * Vercel Serverless Function - 代理请求到 Gitee Raw
 * 绕过 Gitee 防盗链：服务端请求不携带 Referer/Origin，模拟浏览器 User-Agent
 */
export default async function handler(req, res) {
  const BASE_URL = 'https://raw.giteeusercontent.com/gaolk/fydy/raw/master';

  const pathSegments = (req.query.path || []).join('/');
  const targetUrl = `${BASE_URL}/${pathSegments}`;

  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log(`[proxy] fetching: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        // 模拟真实浏览器，不传 Referer/Origin 以绕过防盗链
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
      // 不转发原始请求的 Referer/Origin
      redirect: 'follow',
    });

    console.log(`[proxy] status: ${response.status}, content-type: ${response.headers.get('content-type')}`);

    if (!response.ok) {
      console.error(`[proxy] upstream error: ${response.status}`);
      return res.status(response.status).json({
        error: `upstream ${response.status}`,
        url: targetUrl,
      });
    }

    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    // 尝试解析为 JSON
    try {
      const json = JSON.parse(rawText);
      return res.status(200).json(json);
    } catch {
      // 非 JSON 则原样返回文本
      return res.status(200).send(rawText);
    }
  } catch (error) {
    console.error('[proxy] fetch error:', error.message);
    return res.status(500).json({
      error: '服务端代理请求失败',
      detail: error.message,
    });
  }
}
