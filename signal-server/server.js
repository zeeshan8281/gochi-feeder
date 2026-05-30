// gochi feeder relay (plain Node, no deps)
const http = require('http');

const queue = [];
const recent = [];

const html = `<!doctype html>
<meta charset="utf-8"><title>Feed my gochi</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root{--bg:#0e0b18;--ink:#fff;--accent:#ff7eb6;--soft:#ffd6e8;--muted:#8b8aa8}
  *{box-sizing:border-box}
  html,body{margin:0;min-height:100%;background:radial-gradient(1200px 800px at 50% -10%,#2a1c3d 0,var(--bg) 60%);
    color:var(--ink);font:16px/1.4 -apple-system,system-ui,Segoe UI,Roboto,sans-serif}
  .wrap{max-width:560px;margin:0 auto;padding:48px 22px 80px;text-align:center}
  h1{font-size:38px;margin:0 0 6px;letter-spacing:.5px}
  .sub{color:var(--muted);margin:0 0 28px}
  .pet{font-size:96px;line-height:1;margin:8px 0 28px;filter:drop-shadow(0 8px 20px rgba(255,126,182,.35))}
  form{display:grid;gap:12px;margin:0 auto;max-width:340px}
  input{font:18px inherit;color:var(--ink);background:#1a1530;border:1px solid #2c2547;
    padding:14px 16px;border-radius:14px;outline:none;text-align:center}
  input:focus{border-color:var(--accent)}
  button{font:700 18px/1 inherit;color:#1a0d14;background:var(--accent);border:0;
    padding:16px 22px;border-radius:14px;cursor:pointer;transition:transform .08s}
  button:active{transform:translateY(1px)}
  button:disabled{opacity:.5;cursor:wait}
  #out{margin-top:14px;color:var(--soft);min-height:22px;font-weight:600}
  .wall{margin-top:42px;text-align:left;border-top:1px solid #2c2547;padding-top:18px}
  .wall h2{font-size:14px;text-transform:uppercase;color:var(--muted);letter-spacing:1.5px;margin:0 0 10px}
  .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #221b3b;color:#d9d4ee;font-size:14px}
  .row span:last-child{color:var(--muted)}
  footer{margin-top:32px;color:var(--muted);font-size:12px}
</style>
<div class="wrap">
  <div class="pet">\u{1F423}</div>
  <h1>Feed my gochi</h1>
  <p class="sub">A real ESP32 pet on a desk somewhere. Sign your treat and it'll see you.</p>
  <form id="f">
    <input id="name" placeholder="your name" maxlength="24" autocomplete="off" required>
    <button type="submit">\u{1F36A} Feed it</button>
  </form>
  <div id="out"></div>
  <div class="wall">
    <h2>Recently fed by</h2>
    <div id="wall"></div>
  </div>
  <footer>powered by an ESP32-C3, devfolio gochi, and an EigenCloud TEE</footer>
</div>
<script>
const f=document.getElementById('f'),n=document.getElementById('name'),
      b=f.querySelector('button'),o=document.getElementById('out'),w=document.getElementById('wall');
const ago=t=>{const s=Math.max(0,(Date.now()-t)/1000);
  if(s<60)return Math.floor(s)+'s ago';
  if(s<3600)return Math.floor(s/60)+'m ago';
  return Math.floor(s/3600)+'h ago';};
async function refresh(){
  try{const r=await fetch('/recent');const j=await r.json();
    w.innerHTML=j.recent.length?j.recent.map(x=>'<div class="row"><span>'+
      x.name.replace(/[<>&]/g,'')+'</span><span>'+ago(x.at)+'</span></div>').join(''):
      '<div class="row" style="color:#8b8aa8">no one yet \u2014 be the first</div>';
  }catch{}
}
f.onsubmit=async e=>{e.preventDefault();b.disabled=true;o.textContent='sending\u2026';
  try{const r=await fetch('/feed',{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({name:n.value.trim()})});
    if(r.ok){o.textContent='\u2713 treat delivered';n.value='';refresh();}
    else o.textContent='hmm, try again';
  }catch{o.textContent='offline?';}
  finally{b.disabled=false;setTimeout(()=>o.textContent='',3000);}
};
refresh();setInterval(refresh,5000);
n.focus();
</script>`;

const sanitize = s => (s || '').replace(/[^\p{L}\p{N} _.,'!?-]/gu, '').slice(0, 24).trim();

const readJson = req => new Promise((resolve) => {
  let data = '';
  req.on('data', c => { data += c; if (data.length > 4096) req.destroy(); });
  req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
  req.on('error', () => resolve({}));
});

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
};

const json = (res, code, obj) => {
  res.writeHead(code, { 'content-type': 'application/json', ...CORS });
  res.end(JSON.stringify(obj));
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  const url = new URL(req.url, 'http://x');
  if (req.method === 'GET' && url.pathname === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(html);
  }
  if (req.method === 'GET' && url.pathname === '/health') {
    return json(res, 200, { ok: true, queued: queue.length, recent: recent.length });
  }
  if (req.method === 'GET' && url.pathname === '/recent') {
    return json(res, 200, { recent: recent.slice().reverse() });
  }
  if (req.method === 'POST' && url.pathname === '/feed') {
    const body = await readJson(req);
    const name = sanitize(body.name);
    if (!name) return json(res, 400, { ok: false, error: 'name required' });
    const item = { name, at: Date.now() };
    queue.push(item);
    recent.push(item);
    if (recent.length > 20) recent.shift();
    console.log('[feed+]', name, 'depth=', queue.length);
    return json(res, 200, { ok: true, queued: queue.length });
  }
  if (req.method === 'GET' && url.pathname === '/feed/poll') {
    const deadline = Date.now() + 25_000;
    const tick = () => {
      const item = queue.shift();
      if (item) {
        console.log('[feed-]', item.name);
        return json(res, 200, { fed: true, ...item });
      }
      if (Date.now() >= deadline || res.destroyed) return json(res, 200, { fed: false });
      setTimeout(tick, 400);
    };
    return tick();
  }
  res.writeHead(404); res.end('not found');
});

const port = Number(process.env.PORT || 8080);
server.listen(port, '0.0.0.0', () => console.log('gochi feeder listening on', port));
