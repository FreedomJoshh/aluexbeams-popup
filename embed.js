(function () {
  'use strict';

  var el = document.currentScript;
  var base = (el && el.getAttribute('data-url')) ||
             (el && el.src.replace(/\/embed\.js[\s\S]*$/, '')) || '';
  var FRAME_URL    = base + '/index.html';
  var LABEL        = (el && el.getAttribute('data-label'))    || 'Get a Quote';
  var COLOR        = (el && el.getAttribute('data-color'))    || '#3b79bd';
  var SETTINGS_B64 = (el && el.getAttribute('data-settings')) || '';

  /* ── Stats storage (Shopify-side) ───────────── */
  var STATS_KEY = 'ax_stats';
  function getStats() { try { return JSON.parse(localStorage.getItem(STATS_KEY) || '{}'); } catch(_) { return {}; } }
  function saveStats(s) { try { localStorage.setItem(STATS_KEY, JSON.stringify(s)); } catch(_) {} }

  /* ── Styles ─────────────────────────────────── */
  var css = [
    '#ax-bubble{',
      'position:fixed;bottom:24px;right:24px;z-index:2147483646;',
      'display:flex;align-items:center;gap:10px;',
      'background:' + COLOR + ';color:#fff;border:none;border-radius:50px;',
      'padding:14px 22px 14px 18px;',
      'font-size:15px;font-weight:600;cursor:pointer;letter-spacing:.01em;',
      'box-shadow:0 4px 20px rgba(0,0,0,.25);',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;',
      'transition:transform .15s,box-shadow .15s;',
    '}',
    '#ax-bubble:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.32);}',
    '#ax-overlay{',
      'display:none;position:fixed;inset:0;z-index:2147483647;',
      'background:rgba(0,0,0,.55);',
      'align-items:center;justify-content:center;padding:16px;',
      'animation:ax-fade-in .2s ease;',
    '}',
    '#ax-overlay.open{display:flex;}',
    '@keyframes ax-fade-in{from{opacity:0}to{opacity:1}}',
    '#ax-modal{',
      'position:relative;width:100%;max-width:560px;height:90vh;max-height:820px;',
      'border-radius:20px;overflow:hidden;',
      'box-shadow:0 24px 64px rgba(0,0,0,.35);',
      'animation:ax-slide-up .25s ease;',
    '}',
    '@keyframes ax-slide-up{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}',
    '#ax-frame{width:100%;height:100%;border:none;display:block;}',
    '#ax-close{',
      'position:absolute;top:12px;right:12px;z-index:1;',
      'width:32px;height:32px;border-radius:50%;',
      'background:rgba(0,0,0,.28);border:none;color:#fff;',
      'font-size:15px;cursor:pointer;',
      'display:flex;align-items:center;justify-content:center;',
      'transition:background .15s;font-family:inherit;padding:0;',
    '}',
    '#ax-close:hover{background:rgba(0,0,0,.48);}',
    '@media(max-width:600px){',
      '#ax-overlay{padding:0;align-items:flex-end;}',
      '#ax-modal{max-width:100%;height:93vh;border-radius:20px 20px 0 0;}',
      '#ax-bubble{bottom:18px;right:14px;padding:13px 18px 13px 15px;font-size:14px;}',
    '}'
  ].join('');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ── Bubble button ──────────────────────────── */
  var bubble = document.createElement('button');
  bubble.id = 'ax-bubble';
  bubble.setAttribute('aria-label', LABEL);
  bubble.innerHTML =
    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
      '<polyline points="14,2 14,8 20,8"/>' +
      '<line x1="16" y1="13" x2="8" y2="13"/>' +
      '<line x1="16" y1="17" x2="8" y2="17"/>' +
    '</svg>' + LABEL;
  document.body.appendChild(bubble);

  /* ── Modal overlay ──────────────────────────── */
  var overlay = document.createElement('div');
  overlay.id = 'ax-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML =
    '<div id="ax-modal">' +
      '<button id="ax-close" title="Close">✕</button>' +
      '<iframe id="ax-frame" src="' + FRAME_URL + '" title="' + LABEL + '" allow="autoplay"></iframe>' +
    '</div>';
  document.body.appendChild(overlay);

  /* ── Open / close ───────────────────────────── */
  function openModal() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    bubble.style.display = 'none';
  }

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    bubble.style.display = '';
  }

  bubble.addEventListener('click', openModal);
  document.getElementById('ax-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  /* ── Pass settings to iframe via postMessage ─── */
  if (SETTINGS_B64) {
    document.getElementById('ax-frame').addEventListener('load', function () {
      try {
        var data = JSON.parse(decodeURIComponent(escape(atob(SETTINGS_B64))));
        document.getElementById('ax-frame').contentWindow.postMessage(
          { type: 'AX_SETTINGS', data: data }, '*'
        );
      } catch (_) {}
    });
  }

  /* ── Receive stats from iframe & store here ─── */
  window.addEventListener('message', function (e) {
    if (!e.data || e.data.type !== 'AX_STAT') return;
    var s = getStats();
    if (e.data.event === 'session')     s.sessions     = (s.sessions     || 0) + 1;
    if (e.data.event === 'interaction') s.interactions = (s.interactions || 0) + 1;
    if (e.data.event === 'submission')  {
      s.submissions = (s.submissions || 0) + 1;
      s.log = s.log || [];
      s.log.unshift(e.data.data);
      if (s.log.length > 500) s.log.length = 500;
    }
    saveStats(s);
  });

  /* ── Respond to admin stats sync request ─────── */
  if (window.location.hash === '#aluexbeams-stats' && window.opener) {
    try {
      window.opener.postMessage({ type: 'AX_STATS_RESPONSE', data: getStats() }, '*');
      setTimeout(function () { try { window.close(); } catch (_) {} }, 800);
    } catch (_) {}
  }
})();
