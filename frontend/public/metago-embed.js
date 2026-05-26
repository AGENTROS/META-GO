/* eslint-disable */
/* Meta Go — Try-Me Embed Widget
 * ===============================
 * Drop into ANY website with one line:
 *   <script src="https://soulbound-identity.preview.emergentagent.com/metago-embed.js" defer></script>
 *   <div data-metago-embed="signin"></div>
 *
 * Renders a "Sign in with Meta Go" button. On click, opens a modal iframe
 * to the live identity-forge wizard. On success, posts a message back to
 * the parent containing the user's DID.
 */
(function () {
  'use strict';
  if (window.__metago_embed_loaded) return;
  window.__metago_embed_loaded = true;

  var ORIGIN = 'https://soulbound-identity.preview.emergentagent.com';

  function track(payload) {
    try {
      fetch(ORIGIN + '/api/demo/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ referrer: location.href }, payload)),
      }).catch(function () {});
    } catch (e) {}
  }

  function createButton(host) {
    var btn = document.createElement('button');
    btn.setAttribute('data-metago-button', 'true');
    btn.style.cssText = [
      'all: unset',
      'display: inline-flex',
      'align-items: center',
      'gap: 10px',
      'padding: 12px 22px',
      'background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
      'color: #fff',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'font-weight: 700',
      'font-size: 14px',
      'border-radius: 12px',
      'cursor: pointer',
      'box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25)',
      'transition: transform 0.15s ease, box-shadow 0.15s ease',
      'letter-spacing: 0.02em'
    ].join(';');
    btn.innerHTML = [
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">',
      '<circle cx="12" cy="12" r="10"></circle>',
      '<circle cx="12" cy="10" r="3"></circle>',
      '<path d="M7 20.66c.7-2.18 2.73-3.66 5-3.66s4.3 1.48 5 3.66"></path>',
      '</svg>',
      '<span>Sign in with Meta Go</span>'
    ].join('');
    btn.addEventListener('mouseenter', function () { btn.style.transform = 'translateY(-1px)'; });
    btn.addEventListener('mouseleave', function () { btn.style.transform = 'translateY(0)'; });
    btn.addEventListener('click', function () { openModal(host); });
    host.innerHTML = '';
    host.appendChild(btn);
  }

  function openModal(host) {
    track({ completed: false });
    var overlay = document.createElement('div');
    overlay.style.cssText = [
      'position: fixed', 'inset: 0', 'background: rgba(8, 8, 12, 0.78)',
      'backdrop-filter: blur(8px)', 'z-index: 2147483647',
      'display: flex', 'align-items: center', 'justify-content: center',
      'padding: 16px', 'animation: metagoFadeIn 0.2s ease'
    ].join(';');

    var modal = document.createElement('div');
    modal.style.cssText = [
      'width: 100%', 'max-width: 480px', 'height: 80vh', 'max-height: 720px',
      'background: #fff', 'border-radius: 24px', 'overflow: hidden',
      'position: relative', 'box-shadow: 0 30px 80px rgba(0,0,0,0.4)'
    ].join(';');

    var iframe = document.createElement('iframe');
    iframe.src = ORIGIN + '/embed?source=' + encodeURIComponent(location.hostname);
    iframe.allow = 'camera; microphone';
    iframe.style.cssText = 'width:100%; height:100%; border:0; display:block;';

    var close = document.createElement('button');
    close.innerHTML = '×';
    close.style.cssText = [
      'all: unset', 'position: absolute', 'top: 12px', 'right: 16px',
      'width: 32px', 'height: 32px', 'border-radius: 50%',
      'background: rgba(0,0,0,0.06)', 'color: #18181b', 'font-size: 22px',
      'font-weight: 700', 'cursor: pointer', 'display: flex',
      'align-items: center', 'justify-content: center', 'z-index: 2'
    ].join(';');
    close.addEventListener('click', function () { document.body.removeChild(overlay); });

    modal.appendChild(iframe);
    modal.appendChild(close);
    overlay.appendChild(modal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) document.body.removeChild(overlay);
    });
    document.body.appendChild(overlay);

    // Listen for completion message from iframe
    window.addEventListener('message', function handler(e) {
      if (e.origin !== ORIGIN) return;
      var d = e.data || {};
      if (d.type === 'metago:identity-forged') {
        track({ completed: true, handle: d.handle, durationMs: d.durationMs });
        host.dispatchEvent(new CustomEvent('metago:success', { detail: d }));
        if (window.metagoOnSuccess) try { window.metagoOnSuccess(d); } catch (e) {}
        setTimeout(function () {
          if (overlay.parentNode) document.body.removeChild(overlay);
        }, 2500);
        window.removeEventListener('message', handler);
      }
    });
  }

  function init() {
    var nodes = document.querySelectorAll('[data-metago-embed]');
    nodes.forEach(createButton);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.MetaGo = {
    version: '1.0.0',
    mount: function (selector) {
      var host = typeof selector === 'string' ? document.querySelector(selector) : selector;
      if (host) createButton(host);
    },
    open: function () {
      var host = document.createElement('div'); document.body.appendChild(host); openModal(host);
    }
  };
})();
