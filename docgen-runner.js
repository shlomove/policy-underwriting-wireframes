/* Doc-generation runner — appended to a copy of apex-v1.4.html.
   Reads ?state=ID, drives the interface to that state, then draws numbered pins
   on the annotated elements (from spec-items.json). Used only for screenshot capture. */
(function () {
  const params = new URLSearchParams(location.search);
  const STATE = params.get('state');
  if (!STATE) return;

  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const hide = s => $$(s).forEach(e => e && (e.style.display = 'none'));
  const rp = () => document.getElementById('right-panel');

  function bypass() {
    ['login', 'landing'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
  }
  // isolate one right-panel section (0-based index); hide header/footer/left panel + sibling sections
  function section(idx) {
    bypass();
    document.getElementById('header').style.display = 'none';
    document.getElementById('footer').style.display = 'none';
    document.getElementById('left-toggle').style.display = 'none';
    document.getElementById('left-panel').style.display = 'none';
    [...rp().children].forEach((c, i) => { if (i !== idx) c.style.setProperty('display', 'none', 'important'); });
    // the financial section re-shows itself on coverage select — force-hide unless it is the target
    if (idx !== 3) { const f = document.getElementById('financial-section'); if (f) f.style.setProperty('display', 'none', 'important'); }
    document.getElementById('body').style.padding = '10px';
  }
  // replace an embedded PDF <object> with a clean placeholder (headless can't render PDF)
  function pdfPlaceholder(label) {
    document.querySelectorAll('.doc-embed').forEach(o => {
      const ph = document.createElement('div');
      ph.className = 'pdf-ph';
      ph.style.cssText = 'height:420px;border:1px solid #d7dce6;border-radius:8px;background:#f7f9fc;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#5b6478;';
      ph.innerHTML = '<div style="font-size:44px">📄</div><div style="font-size:14px;font-weight:800;color:#2b3a67">' + label + '</div><div style="font-size:12px">מסמך PDF מקורי משובץ (מוצג inline בדפדפן)</div>';
      o.replaceWith(ph);
    });
  }
  // convert an open popup overlay into normal document flow so the FULL modal is captured
  function staticModal(id) {
    ['header', 'body', 'footer', 'login', 'landing'].forEach(x => { const e = document.getElementById(x); if (e) e.style.display = 'none'; });
    $$('.popup-overlay').forEach(o => { if (o.id !== id) { o.classList.remove('open'); o.style.display = 'none'; } });
    const ov = document.getElementById(id);
    ov.style.cssText += ';position:static;display:block;background:transparent;padding:16px;';
    const box = ov.querySelector('.popup-box');
    if (box) { box.style.maxWidth = '1000px'; box.style.margin = '0 auto'; box.style.maxHeight = 'none'; box.style.boxShadow = '0 1px 3px rgba(0,0,0,.12)'; }
    ov.querySelectorAll('.popup-body').forEach(b => { b.style.maxHeight = 'none'; b.style.overflow = 'visible'; });
    document.body.style.background = '#eef1f6';
  }

  const DRIVE = {
    login() { /* default screen */ },
    landing() { document.getElementById('login').classList.add('hidden'); },
    process() { bypass(); openProcessList(); staticModal('proc-popup'); },

    header() { bypass(); selectCoverage('RISK'); document.getElementById('body').style.display = 'none'; document.getElementById('footer').style.display = 'none'; },
    'sec-health'() { section(0); },
    'sec-lifestyle'() { selectCoverage('RISK'); toggleLs('occupation'); section(1); },
    'sec-metrics'() { section(2); },
    'sec-financial'() { selectCoverage('RISK'); renderFinancial && renderFinancial(); section(3); },
    'sec-diagnoses'() { selectCoverage('RISK'); toggleTl(0); section(4); },
    'sec-coverage-uw'() { selectCoverage('RISK'); saveGroup(); section(6); },
    'sec-documents'() { section(5); },
    'sec-uwnotes'() { section(7); },
    footer() { bypass(); document.getElementById('header').style.display = 'none'; document.getElementById('body').style.display = 'none'; },
    leftpanel() { bypass(); switchMainTab('scout'); document.getElementById('body').classList.remove('left-collapsed'); document.getElementById('header').style.display = 'none'; document.getElementById('footer').style.display = 'none'; rp().style.display = 'none'; },

    enrollment() { bypass(); openEnrollmentForm(); staticModal('enrollment-popup'); pdfPlaceholder('טופס הצעה לביטוח חיים למשכנתא — טופס 621'); },
    agent() { bypass(); openAgentAgreement(); staticModal('agent-popup'); },
    healthform() { bypass(); openHealthForm(0); staticModal('hdform-popup'); pdfPlaceholder('הצהרת בריאות חתומה — טופס 415'); },
    metrics() { bypass(); selectCoverage('RISK'); openMetrics(); staticModal('metrics-popup'); },
    'event-view'() { bypass(); openEventInfo(0, 0); staticModal('evinfo-popup'); },
    'event-edit'() { bypass(); openEventInfo(0, 0, true); staticModal('evinfo-popup'); },
    docview() { bypass(); openDoc('doc-sarc-4'); staticModal('doc-popup'); },
    dxsummary() { bypass(); selectCoverage('RISK'); openItemSummary('dx', '0'); staticModal('dxsum-popup'); },
    temp() { bypass(); selectCoverage('RISK'); openItemTemp('dx', '0'); staticModal('uwtemp-popup'); },
    exclusion() { bypass(); selectCoverage('ACC_DIS'); openExclusion('dx', '0'); staticModal('excl-popup'); },
    overview() { bypass(); selectCoverage('RISK'); saveGroup(); openUwOverview(); staticModal('overview-popup'); },
    approval() { bypass(); openApprovalPopup(); staticModal('approval-popup'); },
    missing() { bypass(); openMissingDocs(0); staticModal('missing-popup'); },
    loadings() { bypass(); openLoadingsLetter(); staticModal('loading-popup'); },
    rejection() { bypass(); openRejectionLetter(); staticModal('loading-popup'); },
    nouw() { bypass(); openNoUnderwriting(); staticModal('nouw-popup'); },
  };

  function drawPins(items) {
    items.forEach((it, n) => {
      let elm = null;
      try { elm = it.sel ? document.querySelector(it.sel) : null; } catch (e) {}
      if (!elm) return;
      const r = elm.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      const pin = document.createElement('div');
      pin.textContent = (n + 1);
      pin.style.cssText = 'position:absolute;z-index:99999;min-width:20px;height:20px;padding:0 3px;box-sizing:border-box;'
        + 'background:#e5352b;color:#fff;font:700 12px/20px Arial;text-align:center;border-radius:11px;'
        + 'border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);';
      pin.style.left = (r.left + window.scrollX - 6) + 'px';
      pin.style.top = (r.top + window.scrollY - 6) + 'px';
      document.body.appendChild(pin);
    });
    document.title = 'DOCGEN_READY';
  }

  function run() {
    try { (DRIVE[STATE] || DRIVE.login)(); } catch (e) { document.title = 'DOCGEN_ERR:' + e.message; return; }
    const spec = window.SPEC || { states: {} };
    const items = (spec.states[STATE] && spec.states[STATE].items) || [];
    // force a layout pass, then draw pins synchronously
    document.body.offsetHeight;
    drawPins(items);
  }
  window.__docgenRun = run;
  // the app's init IIFE has already executed by the time this script loads
  run();
})();
