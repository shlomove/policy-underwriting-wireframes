// Assembles the editable HTML spec document from spec-items.json + captured screenshots.
const fs = require('fs');
const path = require('path');
const REPO = __dirname;
const SHOTS = process.argv[2] || path.join(REPO, 'shots');
const OUT = process.argv[3] || path.join(REPO, 'apex-v1.4-spec.html');

const spec = JSON.parse(fs.readFileSync(path.join(REPO, 'spec-items.json'), 'utf8'));
const esc = s => ('' + (s == null ? '' : s)).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function imgTag(id) {
  const jpg = path.join(SHOTS, id + '.jpg');
  const png = path.join(SHOTS, id + '.png');
  const p = fs.existsSync(jpg) ? jpg : png;
  if (!fs.existsSync(p)) return '<div class="noimg">— צילום מסך חסר —</div>';
  const mime = p.endsWith('.jpg') ? 'image/jpeg' : 'image/png';
  const b64 = fs.readFileSync(p).toString('base64');
  return `<img class="shot" alt="${esc(id)}" loading="lazy" src="data:${mime};base64,${b64}">`;
}

// group states by unique "section" name (preserving first-appearance order) for the TOC
const order = spec.order;
const groups = [];
const byName = {};
order.forEach(id => {
  const st = spec.states[id]; if (!st) return;
  const g = st.section || 'כללי';
  if (!byName[g]) { byName[g] = { name: g, ids: [] }; groups.push(byName[g]); }
  byName[g].ids.push(id);
});

let screenNo = 0;
const sections = order.map(id => {
  const st = spec.states[id]; if (!st) return '';
  screenNo++;
  const legend = (st.items || []).map((it, i) => `
        <tr>
          <td class="ln"><span class="pin">${i + 1}</span></td>
          <td class="lbl" contenteditable="true">${esc(it.label)}</td>
          <td class="dsc" contenteditable="true">${esc(it.desc)}</td>
        </tr>`).join('');
  return `
    <section class="screen" id="scr-${esc(id)}">
      <div class="screen-head">
        <span class="screen-no">${screenNo}</span>
        <div>
          <h2 contenteditable="true">${esc(st.title)}</h2>
          <div class="screen-tag">${esc(st.section || '')}</div>
        </div>
      </div>
      <p class="screen-desc" contenteditable="true">${esc(st.desc || '')}</p>
      <div class="shot-wrap">${imgTag(id)}</div>
      <table class="legend">
        <thead><tr><th class="ln">#</th><th class="lbl">רכיב</th><th class="dsc">תיאור מקצועי</th></tr></thead>
        <tbody>${legend || '<tr><td colspan="3" class="dsc">—</td></tr>'}</tbody>
      </table>
    </section>`;
}).join('\n');

const toc = groups.map(g => `
      <div class="toc-group">
        <div class="toc-group-name">${esc(g.name)}</div>
        <ul>${g.ids.map(id => `<li><a href="#scr-${esc(id)}">${esc(spec.states[id].title)}</a></li>`).join('')}</ul>
      </div>`).join('');

const html = `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>מפרט ממשק — APEX AI · חיתום פוליסה (v1)</title>
<style>
  :root{--blue:#2b3a67;--accent:#2f6df6;--ink:#1e2436;--muted:#5b6478;--line:#e3e7ee;--bg:#f4f6fa;--card:#fff;--red:#e5352b;}
  *{box-sizing:border-box;}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:"Segoe UI",Arial,"Helvetica Neue",sans-serif;line-height:1.6;}
  .bar{position:sticky;top:0;z-index:50;background:var(--blue);color:#fff;display:flex;align-items:center;gap:14px;padding:10px 20px;box-shadow:0 1px 6px rgba(0,0,0,.15);}
  .bar h1{font-size:16px;margin:0;font-weight:800;}
  .bar .sub{font-size:12px;opacity:.8;}
  .bar .spacer{margin-inline-start:auto;}
  .bar button{font-family:inherit;font-size:12.5px;font-weight:700;border:1px solid rgba(255,255,255,.4);background:transparent;color:#fff;border-radius:7px;padding:7px 12px;cursor:pointer;}
  .bar button:hover{background:rgba(255,255,255,.12);}
  .bar button.on{background:#fff;color:var(--blue);}
  .wrap{max-width:1120px;margin:0 auto;padding:22px 20px 80px;}
  .intro{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 20px;margin-bottom:20px;}
  .intro h2{margin:0 0 6px;font-size:15px;color:var(--blue);}
  .intro p{margin:0;color:var(--muted);font-size:13px;}
  .toc{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 20px;margin-bottom:26px;column-gap:26px;}
  .toc h2{margin:0 0 10px;font-size:14px;color:var(--blue);}
  .toc-group{break-inside:avoid;margin-bottom:12px;}
  .toc-group-name{font-size:12px;font-weight:800;color:var(--accent);margin-bottom:4px;letter-spacing:.02em;}
  .toc ul{margin:0;padding-inline-start:18px;}
  .toc li{font-size:12.5px;margin-bottom:2px;}
  .toc a{color:var(--ink);text-decoration:none;}
  .toc a:hover{text-decoration:underline;color:var(--accent);}
  @media(min-width:820px){.toc{columns:2;}}
  .screen{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px 22px;margin-bottom:22px;scroll-margin-top:70px;}
  .screen-head{display:flex;align-items:center;gap:14px;margin-bottom:8px;}
  .screen-no{flex:none;width:34px;height:34px;border-radius:9px;background:var(--blue);color:#fff;font-weight:800;font-size:16px;display:flex;align-items:center;justify-content:center;}
  .screen h2{margin:0;font-size:17px;color:var(--blue);}
  .screen-tag{font-size:11.5px;color:var(--accent);font-weight:700;}
  .screen-desc{margin:0 0 14px;color:var(--muted);font-size:13.5px;}
  .shot-wrap{border:1px solid var(--line);border-radius:10px;overflow:hidden;background:#eef1f6;margin-bottom:14px;}
  .shot{display:block;width:100%;height:auto;}
  .noimg{padding:40px;text-align:center;color:var(--muted);}
  .legend{width:100%;border-collapse:collapse;font-size:13px;}
  .legend th,.legend td{border:1px solid var(--line);padding:8px 10px;text-align:right;vertical-align:top;}
  .legend th{background:#eef2f9;color:var(--blue);font-weight:800;font-size:12px;}
  .legend .ln{width:44px;text-align:center;}
  .legend .lbl{width:210px;font-weight:700;}
  .pin{display:inline-block;min-width:20px;height:20px;line-height:18px;padding:0 4px;background:var(--red);color:#fff;border-radius:11px;border:2px solid #fff;box-shadow:0 1px 2px rgba(0,0,0,.3);font-weight:800;font-size:12px;text-align:center;}
  [contenteditable="true"]{outline:none;}
  body.editing [contenteditable="true"]{background:#fffdf3;box-shadow:inset 0 0 0 1px #f0dfa8;border-radius:4px;}
  [contenteditable="true"]:focus{box-shadow:inset 0 0 0 2px var(--accent)!important;background:#fff;}
  .foot{text-align:center;color:var(--muted);font-size:11.5px;margin-top:10px;}
  @media print{.bar{position:static;} body{background:#fff;}}
</style>
</head>
<body>
  <div class="bar">
    <h1>מפרט ממשק — APEX AI</h1>
    <span class="sub">חיתום פוליסה · גרסה v1</span>
    <div class="spacer"></div>
    <button id="edit-toggle" onclick="toggleEdit()">✎ מצב עריכה</button>
    <button onclick="downloadDoc()">⬇ שמור עותק (HTML)</button>
  </div>
  <div class="wrap">
    <div class="intro">
      <h2 contenteditable="true">מסמך זה</h2>
      <p contenteditable="true">מפרט חזותי מלא של ממשק החיתום (גרסה v1) — כל מסך, חלון ורכיב מלווים בצילום מסך עם מספור, ותיאור מקצועי של כל שדה, כפתור ואפשרות. המסמך ניתן לעריכה: הפעילו «מצב עריכה» כדי לערוך כותרות/תיאורים, ולחצו «שמור עותק (HTML)» לשמירת גרסה מעודכנת.</p>
    </div>
    <div class="toc">
      <h2>תוכן עניינים</h2>
      ${toc}
    </div>
    ${sections}
    <div class="foot">APEX AI — מסמך מפרט ממשק · נוצר אוטומטית מצילומי המסך של גרסה v1</div>
  </div>
<script>
  function toggleEdit(){
    document.body.classList.toggle('editing');
    document.getElementById('edit-toggle').classList.toggle('on', document.body.classList.contains('editing'));
  }
  function downloadDoc(){
    const clone=document.documentElement.cloneNode(true);
    clone.querySelector('body')?.classList.remove('editing');
    const html='<!doctype html>\\n'+clone.outerHTML;
    const blob=new Blob([html],{type:'text/html'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download='apex-v1-spec.html';a.click();
  }
</script>
</body>
</html>`;

fs.writeFileSync(OUT, html);
const kb = Math.round(fs.statSync(OUT).size / 1024);
console.log('WROTE', OUT, kb + 'KB', 'screens=' + screenNo);
