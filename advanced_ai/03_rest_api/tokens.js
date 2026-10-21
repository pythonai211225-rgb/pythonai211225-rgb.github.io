/* ══════════════════════════════════════════════════════════════════
   REST deck · "Stateless tokens" panels (13 Base64, 14 JWT anatomy, 15 sign & verify)
   Real numbers only: Base64 is computed from your text's UTF-8 bytes, the JWT is the
   same HS256 token as /jwt/index.html (checked against PyJWT 2.15.1), and the
   sign/verify demo runs HMAC-SHA256 in the browser (Web Crypto).
   ══════════════════════════════════════════════════════════════════ */

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
let b64Url = false, b64Timer = null;

function tokensStop() { if (b64Timer) { clearInterval(b64Timer); b64Timer = null; } }

function setB64Url(on, btn) {
  b64Url = on;
  document.querySelectorAll('#b64-seg button').forEach(b => b.classList.toggle('on', b === btn));
  b64Play();
}
const charOf = v => b64Url ? B64[v].replace('+', '-').replace('/', '_') : B64[v];

/* one block = up to 3 bytes → 4 output characters */
function b64Play() {
  tokensStop();
  const text = $('b64-in').value;
  const bytes = [...new TextEncoder().encode(text)].slice(0, 18);
  const chars = [...text];
  // which character each byte came from (UTF-8 can use several bytes per character)
  const owner = [];
  chars.forEach((ch, ci) => { for (let k = 0; k < new TextEncoder().encode(ch).length; k++) owner.push(ci); });
  const blocks = [];
  for (let i = 0; i < bytes.length; i += 3) blocks.push(bytes.slice(i, i + 3).map((b, k) => ({ b, i: i + k })));
  let html = '';
  const sextets = []; // [blockIndex, sextetIndex]
  blocks.forEach((blk, bi) => {
    const bits = blk.flatMap(({ b, i }) => [...b.toString(2).padStart(8, '0')].map(bit => ({ bit, i })));
    const nSext = Math.ceil(bits.length / 6);
    while (bits.length < nSext * 6) bits.push({ bit: '0', i: -1 });          // zero padding bits
    let top = '';
    blk.forEach(({ b, i }) => {
      const ch = chars[owner[i]] ?? '';
      const first = owner.indexOf(owner[i]) === i;
      top += `<div class="b64-byte c${i % 3}"><span class="b64-ch">${first ? esc(ch === ' ' ? '␣' : ch) : '·'}</span><span class="b64-dec">${b}</span></div>`;
    });
    const cells = bits.map(({ bit, i }, k) => `<span class="b64-bit${i < 0 ? ' pad' : ' c' + (i % 3)}" data-s="${Math.floor(k / 6)}">${bit}</span>`).join('');
    let bottom = '';
    for (let s = 0; s < 4; s++) {
      if (s < nSext) {
        const v = parseInt(bits.slice(s * 6, s * 6 + 6).map(x => x.bit).join(''), 2);
        bottom += `<div class="b64-out-c" data-s="${s}"><span class="b64-v">${v}</span><span class="b64-l">${charOf(v)}</span></div>`;
        sextets.push([bi, s]);
      } else if (!b64Url) bottom += `<div class="b64-out-c pad" data-s="${s}"><span class="b64-v">pad</span><span class="b64-l">=</span></div>`;
    }
    html += `<div class="b64-blk" data-b="${bi}"><div class="b64-top">${top}</div><div class="b64-bits">${cells}</div><div class="b64-bot">${bottom}</div></div>`;
  });
  $('b64').innerHTML = html || '<div class="b64-empty">type some text</div>';
  const full = btoa(String.fromCharCode(...bytes));
  const out = b64Url ? full.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : full;
  const tail = [...new TextEncoder().encode(text)].length > 18 ? ' (first 18 bytes)' : '';
  $('b64-out').textContent = `${bytes.length} bytes${tail} → ${out.length} characters\n${b64Url ? 'base64url' : 'base64'}: ${out}`;
  // reveal: each 6-bit group lights up and drops its letter, one after another
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const outs = [...document.querySelectorAll('#b64 .b64-out-c')];
  if (reduce) { outs.forEach(o => o.classList.add('show')); return; }
  let k = 0;
  const step = () => {
    document.querySelectorAll('#b64 .b64-bit.now').forEach(c => c.classList.remove('now'));
    if (k >= sextets.length) { outs.forEach(o => o.classList.add('show')); tokensStop(); return; }
    const [bi, s] = sextets[k++];
    const blk = document.querySelector(`#b64 .b64-blk[data-b="${bi}"]`);
    blk.querySelectorAll(`.b64-bit[data-s="${s}"]`).forEach(c => c.classList.add('now', 'done'));
    blk.querySelector(`.b64-out-c[data-s="${s}"]`).classList.add('show');
    if (s === Math.ceil(blk.querySelectorAll('.b64-bit').length / 6) - 1) blk.querySelectorAll('.b64-out-c.pad').forEach(o => o.classList.add('show'));
  };
  outs.forEach(o => o.classList.remove('show'));
  step();
  b64Timer = setInterval(step, 520);
}

/* ══════════ PANEL 14 — the token, decoded part by part ══════════ */
const JWT_DEMO = {
  secret: 'class-demo-secret-7f3c91e2a4b8d6f05e1c2a9b7d4e8f36',
  header: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  payload: 'eyJzdWIiOiI0MiIsIm5hbWUiOiJEYW5hIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3OTI1NzMyMDAsImV4cCI6MTc5MjU3NTAwMH0',
  sig: 'yQQxFPiFcAlOfESI2WWor0wtT2FRYAwnmctmaf-ctjQ',
  adminPayload: 'eyJzdWIiOiI0MiIsIm5hbWUiOiJEYW5hIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzkyNTczMjAwLCJleHAiOjE3OTI1NzUwMDB9',
  adminSig: 'bWprEjPduGsm9xfwtMiqRUgKbhOU1eM79vJFTPi9UtE',   // what the server computes for the admin payload
};
const fromB64Url = s => atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
let jwtPart = 'payload';
function jwtShow(part) {
  jwtPart = part;
  const J = JWT_DEMO;
  $('jwt-tok').innerHTML = ['header', 'payload', 'sig'].map(p =>
    `<button class="jt ${p}${p === part ? ' on' : ''}" onclick="jwtShow('${p}')">${J[p]}</button>`).join('<span class="jt-dot">.</span>');
  let body;
  if (part === 'sig') {
    const raw = fromB64Url(J.sig);
    const hex = [...raw].map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
    body = `<div class="jd-h">signature: Base64URL → ${raw.length} raw bytes (not text)</div><pre>${hex}</pre>
      <div class="jd-n">HMAC-SHA256 output is always 32 bytes = 256 bits. Only someone with the secret can produce it.</div>`;
  } else {
    const json = fromB64Url(J[part]);
    const obj = JSON.parse(json);
    let extra = '';
    if (part === 'payload') {
      const d = s => new Date(s * 1000).toISOString().replace('.000Z', ' UTC').replace('T', ' ');
      extra = `<div class="jd-n"><code>iat</code> ${obj.iat} = ${d(obj.iat)} · <code>exp</code> ${obj.exp} = ${d(obj.exp)} (valid for ${(obj.exp - obj.iat) / 60} minutes)</div>`;
    }
    body = `<div class="jd-h">${part}: Base64URL → ${json.length} bytes of JSON</div><pre>${esc(JSON.stringify(obj, null, 2))}</pre>${extra}`;
  }
  $('jwt-dec').innerHTML = body;
  $('jwt-dec').className = 'jwt-dec ' + part;
}

/* ══════════ PANEL 15 — sign, send, verify with real HMAC ══════════ */
const te = new TextEncoder();
const bytesToB64Url = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function hmac(data) {
  if (!window.crypto || !crypto.subtle) return null;          // file:// in some browsers: fall back to the precomputed value
  const key = await crypto.subtle.importKey('raw', te.encode(JWT_DEMO.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return bytesToB64Url(await crypto.subtle.sign('HMAC', key, te.encode(data)));
}
const short = s => s.slice(0, 10) + '…' + s.slice(-6);
const tokHtml = (h, p, s, bad) => `<span class="t-h">${short(h)}</span>.<span class="t-p${bad ? ' t-edit' : ''}">${short(p)}</span>.<span class="t-s">${short(s)}</span>`;
function diffSig(a, b) {
  return [...a].map((ch, i) => `<span class="${ch === b[i] ? 'same' : 'diff'}">${ch}</span>`).join('');
}
let svGen = 0;
async function svStep(i, btn) {
  if (btn) document.querySelectorAll('#sv-seg button').forEach(b => b.classList.toggle('on', b === btn));
  const g = ++svGen;
  const J = JWT_DEMO;
  const boxes = ['sv-srv1', 'sv-cli', 'sv-srv2'].map($);
  boxes.forEach(b => b.classList.remove('on', 'ok', 'bad'));
  const sigUser = (await hmac(`${J.header}.${J.payload}`)) || J.sig;
  if (g !== svGen) return;
  const pause = ms => new Promise(r => setTimeout(r, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms));
  // ① server signs
  boxes[0].classList.add('on');
  $('sv-sign').innerHTML = `payload <code>{"sub":"42","name":"Dana","role":"user",…}</code><br>HMAC(🔑, header.payload) =<br><span class="mono t-s">${short(sigUser)}</span>`;
  $('sv-client').innerHTML = '<span class="muted">waiting…</span>';
  $('sv-verify').innerHTML = '<span class="muted">—</span>';
  $('sv-out').textContent = 'Login OK → 200 {"token": "' + J.header.slice(0, 8) + '…"}. The server stores nothing.';
  if (i === 0) { await pause(450); if (g !== svGen) return; boxes[1].classList.add('on'); $('sv-client').innerHTML = `saved in localStorage:<div class="sv-tok">${tokHtml(J.header, J.payload, sigUser)}</div>`; return; }
  await pause(500); if (g !== svGen) return;
  // ② client keeps or edits the payload
  const edited = i === 2;
  const sentPayload = edited ? J.adminPayload : J.payload;
  boxes[1].classList.add('on');
  $('sv-client').innerHTML = edited
    ? `decodes the payload, changes <code>"role":"user"</code> → <code>"admin"</code>, re-encodes it, keeps the old signature:<div class="sv-tok">${tokHtml(J.header, sentPayload, sigUser, true)}</div>`
    : `sends it back: <code>Authorization: Bearer …</code><div class="sv-tok">${tokHtml(J.header, sentPayload, sigUser)}</div>`;
  await pause(650); if (g !== svGen) return;
  // ③ server recomputes from what it received
  const expected = (await hmac(`${J.header}.${sentPayload}`)) || (edited ? J.adminSig : J.sig);
  if (g !== svGen) return;
  const ok = expected === sigUser;
  boxes[2].classList.add('on', ok ? 'ok' : 'bad');
  const nDiff = [...expected].filter((c, k) => c !== sigUser[k]).length;
  $('sv-verify').innerHTML = `recomputed: <div class="mono sig">${diffSig(expected, sigUser)}</div>received: <div class="mono sig">${diffSig(sigUser, expected)}</div>
    <div class="sv-verdict">${ok ? '✓ identical → 200 {"id": 42, "name": "Dana"}' : `✗ ${nDiff} of ${expected.length} characters differ → 401 Invalid token`}</div>`;
  $('sv-out').textContent = ok
    ? 'Same header + payload + same secret → same signature. The server trusts the claims without any database lookup.'
    : 'The payload changed, so the correct signature changed too. The attacker kept the old one, and making the new one needs the secret.';
}
