import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const token = randomBytes(24).toString('hex');
const path = `/setup/${token}`;
const file = resolve('commerce/.dev.vars');
let saved = false;
const server = http.createServer(async (request, response) => {
  const origin = `http://127.0.0.1:${server.address().port}`;
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
  if (request.headers.host !== new URL(origin).host || request.url !== path) { response.writeHead(404).end(); return; }
  if (request.method === 'POST') {
    if (request.headers.origin !== origin) { response.writeHead(403).end(); return; }
    let body = '';
    for await (const chunk of request) {
      body += chunk.toString();
      if (body.length > 4096) { response.writeHead(413).end(); return; }
    }
    const key = new URLSearchParams(body).get('key')?.trim() || '';
    if (key.length < 16 || key.length > 512 || /[\s\r\n"']/.test(key)) {
      response.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' }).end('<p>密钥格式不正确，请返回后检查。不要填写 KIE_API_KEY=，只填写密钥本身。</p>'); return;
    }
    const current = await readFile(file, 'utf8').catch(() => '');
    const lines = current.split(/\r?\n/).filter(line => !line.startsWith('KIE_API_KEY=') && line.trim());
    await writeFile(file, [...lines, `KIE_API_KEY=${key}`, ''].join('\n'), { mode: 0o600 });
    saved = true;
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end('<!doctype html><meta charset="utf-8"><title>密钥已保存</title><h1>密钥已保存</h1><p>仅写入本机服务端配置，没有发送给第三方。可以关闭此页，返回聊天。</p>');
    console.log('Kie credential saved locally. Value hidden.');
    return;
  }
  if (request.method !== 'GET') { response.writeHead(405).end(); return; }
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Headcanon 本机密钥设置</title><style>body{font:16px system-ui;max-width:560px;margin:80px auto;padding:24px;color:#172027}label,input,button{display:block;width:100%;box-sizing:border-box}input{margin:12px 0 20px;padding:14px;border:1px solid #888;border-radius:6px;font-size:18px}button{padding:14px;background:#4f46e5;color:white;border:0;border-radius:6px;font-size:16px}p{line-height:1.7}</style><h1>Headcanon 本机密钥设置</h1><p>仅填写 Kie API key，不要填写变量名。密钥只保存到本机被 Git 忽略的服务端配置。</p>${saved ? '<p>已保存过一次；重新提交会替换本机 Kie 密钥。</p>' : ''}<form method="post" action="${path}"><label for="key">Kie API key</label><input id="key" name="key" type="password" autocomplete="off" required minlength="16" maxlength="512" autofocus><button type="submit">保存到本机</button></form></html>`);
});
server.listen(0, '127.0.0.1', () => console.log(`Local credential input: http://127.0.0.1:${server.address().port}${path}`));
