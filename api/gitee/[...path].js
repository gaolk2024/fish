/**
 * Vercel Serverless Function - 代理请求到 Gitee Raw
 * 解决浏览器端跨域问题，由服务端代为请求
 */
export default async function handler(req, res) {
  const BASE_URL = 'https://raw.giteeusercontent.com/gaolk/fydy/raw/master';

  // 构建目标路径
  const pathSegments = (req.query.path || []).join('/');
  const targetUrl = `${BASE_URL}/${pathSegments}`;

  // 设置 CORS 响应头（可选，因为已经在同域了，但双保险）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Vercel-Proxy/1.0',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Upstream request failed with status ${response.status}`,
      });
    }

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    return res.status(200).json(data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    return res.status(500).json({ error: '服务端代理请求失败，请稍后重试' });
  }
}
