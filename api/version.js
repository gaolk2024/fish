/**
 * Vercel Serverless Function - 获取版本信息
 * 服务端请求 Gitee，绕过防盗链和跨域限制
 */
const https = require('https');
const http = require('http');

function fetchJSON(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const timer = setTimeout(() => {
      req.destroy();
      reject(new Error('请求超时'));
    }, timeout);

    const req = client.get(
      url,
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
      (res) => {
        clearTimeout(timer);
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}`));
          return;
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('JSON 解析失败'));
          }
        });
      }
    );
    req.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

module.exports = async (req, res) => {
  const url = 'https://raw.giteeusercontent.com/gaolk/fydy/raw/master/data/version.json';

  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const data = await fetchJSON(url);
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
