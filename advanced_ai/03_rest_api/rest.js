/* ══════════════════════════════════════════════════════════════════
   REST API — deck 03 (Advanced AI)
   The demos mirror the class project (github.com/pythonai211225-rgb/18.10.2026):
   the toy /messages server follows messages.py's rules (author-only edits,
   201/204/403/404/422), the FastAPI pipeline shows the real order of
   dependency → body validation → handler, and the Swagger mock lists the
   app's actual routes in registration order.
   ══════════════════════════════════════════════════════════════════ */

const $ = id => document.getElementById(id);

const TOTAL = 13;
const LABELS = ['Overview','What is a REST API?','The HTTP methods','Status codes','FastAPI','Uvicorn',
                'Swagger /docs','Postman','The Chat API app','The database behind it','Vibe-coding the app',
                'Exercises','A1 · FastAPI cheat-sheet'];
const CURRICULUM_ORDER = [0,1,2,3,4,5,6,7,8,9,10,11,12];

let current = 0;
let ovRaf = null, pipeTimer = null;

function stopTimers() {
  if (ovRaf) { cancelAnimationFrame(ovRaf); ovRaf = null; }
  if (pipeTimer) { clearInterval(pipeTimer); pipeTimer = null; }
}

function goTo(idx) {
  if (idx === current) return;
  const oldP = $('panel-' + current), newP = $('panel-' + idx);
  if (current > 0) {
    const btn = document.querySelector(`[data-panel="${current}"]`);
    if (btn) btn.classList.add('done');
  }
  stopTimers();
  oldP.classList.remove('active'); oldP.classList.add('exit');
  setTimeout(() => oldP.classList.remove('exit'), 280);
  current = idx;
  newP.classList.add('active');
  $('viewport').scrollTop = 0;
  document.querySelectorAll('.s-item').forEach(b => b.classList.toggle('active', +b.dataset.panel === idx));
  updateDots();
  history.replaceState(null, '', '#p' + idx);
  const enters = [startOverview, null, null, null, () => runPipe(pipeMode), null, null, null, null, null, null, null, null];
  if (enters[idx]) setTimeout(enters[idx], 60);
}

function updateDots() {
  for (let i = 0; i < TOTAL; i++) {
    const cont = $('dots-' + i); if (!cont) continue;
    cont.innerHTML = '';
    for (const d of CURRICULUM_ORDER) {
      const btn = document.createElement('button');
      btn.className = 'pnav-dot' + (d === current ? ' active' : '');
      btn.title = LABELS[d]; btn.onclick = () => goTo(d);
      cont.appendChild(btn);
    }
  }
}

$('viewport').addEventListener('scroll', () => {
  const el = $('viewport');
  $('progress').style.width = (el.scrollTop / (el.scrollHeight - el.clientHeight) * 100) + '%';
});

function cp(btn) {
  navigator.clipboard.writeText(btn.closest('.code-wrap').querySelector('pre').innerText.trim()).then(() => {
    btn.textContent = '✓ copied'; setTimeout(() => btn.textContent = 'copy', 1600);
  });
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ══════════ tiny Python highlighter for <pre data-hl> ══════════ */
const KW = new Set(['from','import','as','def','class','return','if','elif','else','for','in','not','and','or','is',
  'with','try','except','finally','raise','None','True','False','async','await','yield','lambda','pass','while','break','continue']);
function highlight(src) {
  const re = /("""[\s\S]*?"""|[rfb]?"(?:[^"\\\n]|\\.)*"|[rfb]?'(?:[^'\\\n]|\\.)*')|(#[^\n]*)|(@[\w.]+)|\b(\d[\d_]*(?:\.\d+)?)\b|\b([A-Za-z_]\w*)\b(?=\s*\()|\b([A-Za-z_]\w*)\b/g;
  let out = '', last = 0, m;
  while ((m = re.exec(src))) {
    out += esc(src.slice(last, m.index));
    const t = esc(m[0]);
    if (m[1]) out += `<span class="str">${t}</span>`;
    else if (m[2]) out += `<span class="cm">${t}</span>`;
    else if (m[3]) out += `<span class="fn">${t}</span>`;
    else if (m[4]) out += `<span class="num">${t}</span>`;
    else if (m[5]) out += KW.has(m[5]) ? `<span class="kw">${t}</span>` : /^[A-Z]/.test(m[5]) ? `<span class="cls">${t}</span>` : `<span class="fn">${t}</span>`;
    else if (m[6]) out += KW.has(m[6]) ? `<span class="kw">${t}</span>` : /^[A-Z][a-z]/.test(m[6]) ? `<span class="cls">${t}</span>` : t;
    last = re.lastIndex;
  }
  return out + esc(src.slice(last));
}
document.querySelectorAll('pre[data-hl]').forEach(p => { p.innerHTML = highlight(p.textContent); });

/* ══════════ PANEL 0 — one request through every layer ══════════ */
const OV = [
  { m:'GET',    col:'#61affe', req:'GET /messages?limit=200',               fn:'list_messages()',  sql:'SELECT * FROM messages ORDER BY id DESC LIMIT 200', res:'200 OK · [ {"id": 32, …}, {"id": 31, …} ]', rc:'#10b981', code:'200' },
  { m:'POST',   col:'#49cc90', req:'POST /messages  {"content": "hi"}',      fn:'create_message()', sql:'INSERT INTO messages (…) VALUES (…)',               res:'201 Created · {"id": 33, "content": "hi", …}', rc:'#10b981', code:'201' },
  { m:'PATCH',  col:'#50e3c2', req:'PATCH /messages/33  {"content": "hi all"}', fn:'update_message()', sql:'UPDATE messages SET content = ? WHERE id = 33', res:'200 OK · {"id": 33, "content": "hi all", …}', rc:'#10b981', code:'200' },
  { m:'DELETE', col:'#f93e3e', req:'DELETE /messages/33',                    fn:'delete_message()', sql:'DELETE FROM messages WHERE id = 33',              res:'204 No Content · (empty body)',               rc:'#10b981', code:'204' },
  { m:'PATCH',  col:'#50e3c2', req:'PATCH /messages/5  (Liran\'s message)',  fn:'update_message()', sql:'SELECT * FROM messages WHERE id = 5  → not yours', res:'403 Forbidden · {"detail": "You can only change your own messages"}', rc:'#f43f5e', code:'403' },
];
const OV_X = [85, 280, 485, 685], OV_PERIOD = 5200;
let ovStart = 0;
function startOverview() {
  if (ovRaf) cancelAnimationFrame(ovRaf);
  ovStart = performance.now();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const frame = now => {
    const t = now - ovStart, k = Math.floor(t / OV_PERIOD) % OV.length, ph = (t % OV_PERIOD) / OV_PERIOD;
    drawOverview(OV[k], reduce ? 0.47 : ph);
    ovRaf = requestAnimationFrame(frame);
  };
  ovRaf = requestAnimationFrame(frame);
}
function drawOverview(ex, ph) {
  const ease = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
  let x, label, fill, going = true;
  if (ph < .42) { x = OV_X[0] + (OV_X[3] - OV_X[0]) * ease(ph / .42); label = ex.m; fill = ex.col; }
  else if (ph < .55) { x = OV_X[3]; label = 'SQL'; fill = '#a78bfa'; }
  else if (ph < .95) { going = false; x = OV_X[3] - (OV_X[3] - OV_X[0]) * ease((ph - .55) / .4); label = ex.code; fill = ex.rc; }
  else { going = false; x = OV_X[0]; label = ex.code; fill = ex.rc; }
  $('ov-pkt').setAttribute('transform', `translate(${x},125)`);
  $('ov-pkt-r').setAttribute('fill', fill);
  $('ov-pkt-t').textContent = label;
  $('ov-pkt-t').setAttribute('fill', fill === '#f93e3e' || fill === '#f43f5e' ? '#fff' : '#08101f');
  $('ov-req').textContent = ex.req;
  $('ov-fn').textContent = ex.fn;
  $('ov-sql').textContent = ex.sql;
  $('ov-sql').setAttribute('opacity', ph >= .38 ? 1 : .25);
  $('ov-res').textContent = ex.res;
  $('ov-res').setAttribute('fill', ex.rc);
  $('ov-res').setAttribute('opacity', going ? .2 : 1);
}

/* ══════════ PANEL 2 — toy /messages server ══════════ */
const ME = { id: 1, name: 'itay' };
const SEED = [
  { id: 1, user_id: 1, sender: 'itay',  content: 'hi' },
  { id: 2, user_id: 1, sender: 'itay',  content: 'how are you ?' },
  { id: 3, user_id: 2, sender: 'Liran', content: 'hello' },
];
let rows, nextId, method = 'GET';
function resetToy() {
  rows = SEED.map(r => ({ ...r })); nextId = 4;
  $('toy-res').textContent = 'Data reset. Pick a method and press Send.';
  $('toy-sql').textContent = '-- the SQL the server runs appears here';
  renderDb();
}
function renderDb(flashId, kind) {
  $('toy-db').innerHTML = `<table class="mini-table"><tr><th>id</th><th>user_id</th><th>sender</th><th>content</th></tr>${
    rows.map(r => `<tr data-id="${r.id}" class="${r.id === flashId ? 'flash-' + kind : ''}"><td>${r.id}</td><td>${r.user_id}</td><td>${esc(r.sender)}</td><td>${esc(r.content)}</td></tr>`).join('')
  }</table>`;
}
const STATUS = { 200:'OK', 201:'Created', 204:'No Content', 403:'Forbidden', 404:'Not Found', 422:'Unprocessable Entity' };
const DEFAULT_BODY = { POST: 'new message', PUT: 'replaced text', PATCH: 'edited text' };
function buildReqLine() {
  const needsId = ['PUT','PATCH','DELETE','HEAD'].includes(method);
  const hasBody = ['POST','PUT','PATCH'].includes(method);
  let html = `<span class="mth ${method.toLowerCase()}">${method}</span>`;
  if (method === 'GET') html += `<select id="toy-path"><option value="list">/messages</option><option value="one">/messages/{id}</option></select><input type="number" id="toy-id" value="1" min="1" style="display:none">`;
  else if (needsId) html += `<span>/messages/</span><input type="number" id="toy-id" value="2" min="1">`;
  else html += `<span>/messages</span>`;
  if (hasBody) html += `<span style="color:var(--muted)">body {"content":</span><input class="body-in" id="toy-body" value="${DEFAULT_BODY[method]}" placeholder="${method === 'PATCH' ? 'leave empty → {}' : ''}"><span style="color:var(--muted)">}</span>`;
  html += `<button class="play-btn send-btn" onclick="sendToy()">Send ▶</button>`;
  $('req-line').innerHTML = html;
  const sel = $('toy-path');
  if (sel) sel.onchange = () => { $('toy-id').style.display = sel.value === 'one' ? '' : 'none'; };
}
document.querySelectorAll('#m-seg button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#m-seg button').forEach(x => x.classList.toggle('on', x === b));
  method = b.dataset.m; buildReqLine();
});
function sendToy() {
  const idEl = $('toy-id'), bodyEl = $('toy-body');
  const one = method !== 'GET' || ($('toy-path') && $('toy-path').value === 'one');
  const id = idEl ? parseInt(idEl.value, 10) : null;
  const text = bodyEl ? bodyEl.value : '';
  const row = rows.find(r => r.id === id);
  const pub = r => ({ id: r.id, user_id: r.user_id, sender: r.sender, content: r.content });
  let status = 200, body, sql, headers = { 'content-type': 'application/json' }, flash = null, kind = 'read';
  const notFound = () => { status = 404; body = { detail: 'Message not found' }; };
  const tooShort = () => { status = 422; body = { detail: [{ type: 'string_too_short', loc: ['body', 'content'], msg: 'String should have at least 1 character', input: '' }] }; sql = '-- nothing: FastAPI rejected the body before your function ran'; };
  const notMine = () => { status = 403; body = { detail: 'You can only change your own messages' }; };

  if (method === 'GET' && !one) {
    sql = 'SELECT * FROM messages ORDER BY id DESC LIMIT 100 OFFSET 0';
    body = rows.slice().reverse().map(pub);
  } else if (method === 'GET' || method === 'HEAD') {
    sql = `SELECT * FROM messages WHERE id = ${id}`;
    if (!row) notFound(); else { body = pub(row); flash = id; }
    if (method === 'HEAD') { headers['content-length'] = String(JSON.stringify(body).length); }
  } else if (method === 'POST') {
    if (!text) tooShort();
    else {
      sql = `INSERT INTO messages (user_id, sender, content, …) VALUES (1, 'itay', '${text}', …)`;
      const r = { id: nextId++, user_id: ME.id, sender: ME.name, content: text };
      rows.push(r); status = 201; body = pub(r); flash = r.id; kind = 'write';
      headers.location = `/messages/${r.id}`;
    }
  } else if (method === 'PUT' || method === 'PATCH') {
    if (method === 'PUT' && !text) tooShort();
    else {
      sql = `SELECT * FROM messages WHERE id = ${id}`;
      if (!row) notFound();
      else if (row.user_id !== ME.id) { notMine(); sql += `   -- user_id ${row.user_id} ≠ you (1) → stop`; flash = id; }
      else if (method === 'PATCH' && !text) { body = pub(row); sql += '\n-- body was {} → nothing to update'; flash = id; }
      else { row.content = text; body = pub(row); flash = id; kind = 'write'; sql += `\nUPDATE messages SET content = '${text}', updated_at = … WHERE id = ${id}`; }
    }
  } else if (method === 'DELETE') {
    sql = `SELECT * FROM messages WHERE id = ${id}`;
    if (!row) notFound();
    else if (row.user_id !== ME.id) { notMine(); sql += `   -- user_id ${row.user_id} ≠ you (1) → stop`; flash = id; }
    else { sql += `\nDELETE FROM messages WHERE id = ${id}`; status = 204; body = null; flash = id; kind = 'gone'; }
  } else if (method === 'OPTIONS') {
    sql = '-- no database work: OPTIONS only describes the URL';
    body = null; headers = { allow: 'GET, POST, HEAD, OPTIONS', 'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, HEAD' };
  }

  const cls = status < 300 ? 'st-ok' : status < 500 ? (status === 404 ? 'st-warn' : 'st-err') : 'st-err';
  const reqId = one && method !== 'POST' && method !== 'OPTIONS' ? `/messages/${id}` : '/messages';
  let out = `<span style="color:var(--muted)">${method} ${reqId}</span>\n\n<span class="${cls}">HTTP/1.1 ${status} ${STATUS[status]}</span>\n`;
  out += Object.entries(headers).map(([k, v]) => `<span style="color:var(--muted)">${k}:</span> ${esc(v)}`).join('\n');
  if (method === 'HEAD') out += `\n\n<span style="color:var(--muted)">(no body: HEAD sends only the status line and headers)</span>`;
  else if (status === 204) out += `\n\n<span style="color:var(--muted)">(no body)</span>`;
  else if (body !== null && body !== undefined) out += '\n\n' + esc(JSON.stringify(body, null, 2));
  $('toy-res').innerHTML = out;
  $('toy-sql').textContent = sql;

  if (kind === 'gone') {
    renderDb();
    const tr = document.querySelector(`#toy-db tr[data-id="${id}"]`);
    if (tr) tr.classList.add('gone');
    rows = rows.filter(r => r.id !== id);
    setTimeout(() => renderDb(), 1300);
  } else renderDb(flash, kind);
}

/* ══════════ PANEL 4 — FastAPI request pipeline ══════════ */
const PIPE = {
  ok:     { req: 'POST /messages\nAuthorization: Bearer 9fKx2…\n\n{"content": "hello"}', stop: -1,
            res: '<span class="st-ok">201 Created</span>\n{\n  "id": 33,\n  "user_id": 1,\n  "sender": "itay",\n  "content": "hello",\n  "created_at": "2026-10-18T17:50:02.114+00:00",\n  "updated_at": "2026-10-18T17:50:02.114+00:00"\n}' },
  notoken:{ req: 'POST /messages\n(no Authorization header)\n\n{"content": "hello"}', stop: 1,
            res: '<span class="st-err">401 Unauthorized</span>\n{"detail": "Not logged in"}\n\n<span style="color:#8b93c4">current_user() raised HTTPException(401) → create_message never ran, the body was never even checked.</span>' },
  empty:  { req: 'POST /messages\nAuthorization: Bearer 9fKx2…\n\n{"content": ""}', stop: 2,
            res: '<span class="st-err">422 Unprocessable Entity</span>\n{\n  "detail": [{\n    "type": "string_too_short",\n    "loc": ["body", "content"],\n    "msg": "String should have at least 1 character",\n    "input": "",\n    "ctx": {"min_length": 1}\n  }]\n}\n\n<span style="color:#8b93c4">Generated by Pydantic from Field(..., min_length=1). Your code did not write this.</span>' },
  nojson: { req: 'POST /messages\nAuthorization: Bearer 9fKx2…\n\n{"text": "hello"}', stop: 2,
            res: '<span class="st-err">422 Unprocessable Entity</span>\n{\n  "detail": [{\n    "type": "missing",\n    "loc": ["body", "content"],\n    "msg": "Field required",\n    "input": {"text": "hello"}\n  }]\n}\n\n<span style="color:#8b93c4">The model requires "content"; a different key name is not accepted.</span>' },
};
let pipeMode = 'ok';
function runPipe(mode, btn) {
  pipeMode = mode;
  if (btn) document.querySelectorAll('#fa-seg button').forEach(b => b.classList.toggle('on', b === btn));
  if (pipeTimer) clearInterval(pipeTimer);
  const sc = PIPE[mode], steps = [...document.querySelectorAll('#fa-pipe .pipe-step')];
  $('fa-req').textContent = sc.req;
  $('fa-res').innerHTML = '<span style="color:#8b93c4">…</span>';
  steps.forEach(s => s.className = 'pipe-step');
  let i = 0;
  pipeTimer = setInterval(() => {
    steps.forEach(s => s.classList.remove('now'));
    if (sc.stop === i) { steps[i].classList.add('fail'); $('fa-res').innerHTML = sc.res; clearInterval(pipeTimer); pipeTimer = null; return; }
    steps[i].classList.add('on', 'now');
    i++;
    if (i === steps.length) { $('fa-res').innerHTML = sc.res; clearInterval(pipeTimer); pipeTimer = null; setTimeout(() => steps.forEach(s => s.classList.remove('now')), 700); }
  }, 600);
}

/* ══════════ PANEL 6 — Swagger UI mock (routes in registration order) ══════════ */
const SW = [
  ['users', [
    ['get', '/avatars', 'List Avatar Presets', 0, '', '[{"id": "1534528741775-53994a69daeb", "url": "https://images.unsplash.com/…"}]'],
    ['get', '/users', 'List Users', 0, '', '[{"id": 1, "name": "itay", "created_at": "2026-10-18T17:36:56+00:00", "has_avatar": false}]'],
    ['get', '/users/me', 'Get Me', 1, '', '{"id": 1, "name": "itay", "created_at": "…", "has_avatar": false}'],
    ['get', '/users/{user_id}/avatar', 'Get Avatar', 0, 'user_id* (path) · if-none-match (header)', 'image bytes · or 307 → Unsplash · or 304 · or 404'],
    ['get', '/users/{user_id}', 'Get User', 0, 'user_id* (path)', '{"id": 2, "name": "Liran", "created_at": "…", "has_avatar": true}'],
    ['post', '/users', 'Create User', 0, 'body: {"name": "string", "password": "string", "avatar": "string", "avatar_preset": "string"}', '201 → {"id": 11, "name": "dana", "created_at": "…", "has_avatar": true}'],
    ['put', '/users/{user_id}', 'Replace User', 1, 'user_id* (path) · body: UserCreate', '{"id": 11, "name": "dana", …, "has_avatar": false}'],
    ['patch', '/users/{user_id}', 'Update User', 1, 'user_id* (path) · body: UserPatch (all fields optional)', '{"id": 11, "name": "dana", …}'],
    ['delete', '/users/{user_id}', 'Delete User', 1, 'user_id* (path)', '204 (no body)'],
    ['head', '/users/{user_id}', 'Head User', 0, 'user_id* (path)', '200 or 404, headers only'],
    ['post', '/login', 'Login', 0, 'body: {"name": "string", "password": "string"}', '{"token": "Xq3v…", "user": {"id": 11, "name": "dana", …}}'],
    ['post', '/logout', 'Logout', 1, '', '204 (no body)'],
  ]],
  ['messages', [
    ['get', '/messages', 'List Messages', 0, 'sender (query) · limit (query, default 100) · offset (query, default 0)', '[{"id": 32, "user_id": 3, "sender": "Ben Dover", "content": "…", "created_at": "…", "updated_at": "…"}]'],
    ['get', '/messages/{message_id}', 'Get Message', 0, 'message_id* (path)', '{"id": 7, "user_id": 1, "sender": "itay", "content": "hi", …}'],
    ['post', '/messages', 'Create Message', 1, 'body: {"content": "string"}', '201 → {"id": 33, …}'],
    ['put', '/messages/{message_id}', 'Replace Message', 1, 'message_id* (path) · body: {"content": "string"}', '{"id": 7, …}'],
    ['patch', '/messages/{message_id}', 'Update Message', 1, 'message_id* (path) · body: {"content": "string"} (optional)', '{"id": 7, …}'],
    ['delete', '/messages/{message_id}', 'Delete Message', 1, 'message_id* (path)', '204 (no body)'],
    ['head', '/messages/{message_id}', 'Head Message', 0, 'message_id* (path)', '200 or 404, headers only'],
  ]],
];
function buildSwagger() {
  let h = `<div class="swag-top"><h3>Messages API</h3><span class="swag-ver">1.5</span><span class="swag-ver oas">OAS 3.1</span><span class="swag-url">/openapi.json</span></div>`;
  for (const [tag, ops] of SW) {
    h += `<div class="swag-tag">${tag}</div>`;
    for (const [m, path, sum, lock, params, ex] of ops) {
      const p = (params ? params + (lock ? ' · ' : '') : '') + (lock ? 'authorization (header): Bearer &lt;token&gt;' : '');
      h += `<div class="op ${m}"><div class="op-head"><span class="mth">${m.toUpperCase()}</span><span class="op-path">${path}</span><span class="op-sum">${sum} ${lock ? '<span class="lock">🔒</span>' : ''}</span></div>
        <div class="op-body"><span class="op-try">Try it out</span><h6>Parameters</h6><div>${p || 'No parameters'}</div>
        <h6>Example response</h6><pre>${esc(ex)}</pre>${params || lock ? '<h6>Also documented</h6><div>422 Validation Error</div>' : ''}</div></div>`;
    }
  }
  $('swag').innerHTML = h;
  $('swag').querySelectorAll('.op-head').forEach(el => el.onclick = () => el.parentElement.classList.toggle('open'));
}

/* ══════════ PANEL 7 — Postman stepper ══════════ */
const PM = [
  { m: 'POST', url: 'http://127.0.0.1:8000/users', tab: 'Body', sec: '{\n  "name": "dana",\n  "password": "1234",\n  "avatar_preset": "1500648767791-00dcc994a43e"\n}',
    st: '201 Created', res: '{\n  "id": 11,\n  "name": "dana",\n  "created_at": "2026-10-18T18:02:11.530+00:00",\n  "has_avatar": true\n}',
    note: 'Body → raw → JSON. No token needed: anyone may sign up. The password is hashed before it is stored.' },
  { m: 'POST', url: 'http://127.0.0.1:8000/login', tab: 'Body', sec: '{\n  "name": "dana",\n  "password": "1234"\n}',
    st: '200 OK', res: '{\n  "token": "<span class="hl-tok">Xq3vN8bQ0pJ…r2Lw</span>",\n  "user": { "id": 11, "name": "dana", "has_avatar": true, … }\n}',
    note: 'The server created a row in sessions and returned its token. Copy it: it is your key for every request that needs a login.' },
  { m: 'POST', url: 'http://127.0.0.1:8000/messages', tab: 'Headers', sec: 'Content-Type: application/json\nAuthorization: Bearer <span class="hl-tok">Xq3vN8bQ0pJ…r2Lw</span>\n\nBody: {"content": "hello from Postman"}',
    st: '201 Created', res: '{\n  "id": 33,\n  "user_id": 11,\n  "sender": "dana",\n  "content": "hello from Postman",\n  "created_at": "…", "updated_at": "…"\n}',
    note: 'You did not send "sender": "dana". The server worked out who you are from the token. A client can never post as someone else.' },
  { m: 'POST', url: 'http://127.0.0.1:8000/messages', tab: 'Headers', sec: 'Content-Type: application/json\n(no Authorization header)\n\nBody: {"content": "hello from Postman"}',
    st: '401 Unauthorized', res: '{\n  "detail": "Not logged in"\n}',
    note: 'Same request without the token. Stateless: the server does not remember that you logged in a moment ago.' },
];
function pmStep(i, btn) {
  if (btn) document.querySelectorAll('#pm-seg button').forEach(b => b.classList.toggle('on', b === btn));
  const s = PM[i], col = s.st.startsWith('2') ? '#10b981' : '#f43f5e';
  $('pm').innerHTML = `<div class="pm-bar"><span class="pm-method" style="color:#ffb400">${s.m}</span><span class="pm-url">${s.url}</span><span class="pm-send">Send</span></div>
    <div class="pm-tabs"><span>Params</span><span${s.tab === 'Headers' ? ' class="on"' : ''}>Headers</span><span${s.tab === 'Body' ? ' class="on"' : ''}>Body</span><span>Scripts</span></div>
    <div class="pm-sec">${s.sec}</div>
    <div class="pm-res"><div class="pm-res-h"><span>Response · Body · JSON</span><span>Status: <b style="color:${col}">${s.st}</b></span></div><div class="pm-sec">${s.res}</div></div>`;
  $('pm-note').textContent = s.note;
}

/* ══════════ keyboard + boot ══════════ */
document.addEventListener('keydown', e => {
  if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  const pos = CURRICULUM_ORDER.indexOf(current);
  if (e.key === 'ArrowRight' && pos < CURRICULUM_ORDER.length - 1) goTo(CURRICULUM_ORDER[pos + 1]);
  if (e.key === 'ArrowLeft'  && pos > 0) goTo(CURRICULUM_ORDER[pos - 1]);
});

buildReqLine();
resetToy();
buildSwagger();
pmStep(0);
updateDots();
const startAt = /^#p(\d+)$/.exec(location.hash);
drawOverview(OV[0], 0);
if (startAt && +startAt[1] > 0 && +startAt[1] < TOTAL) goTo(+startAt[1]); else startOverview();
