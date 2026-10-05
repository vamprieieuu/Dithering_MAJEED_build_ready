(function () {
  'use strict';

  var LICENSE_HOST = 'portal.doronsupply.com';

  function unlockUI() {
    try {
      var lic = document.getElementById('LicSection');
      var container = document.querySelector('.container');
      if (lic) {
        lic.style.display = 'none';
        lic.style.visibility = 'hidden';
        lic.style.pointerEvents = 'none';
      }
      if (container) {
        container.style.display = 'flex';
        container.style.visibility = 'visible';
        container.style.pointerEvents = 'auto';
        container.style.opacity = '1';
      }
      document.querySelectorAll('.container .locked, .container [class*="locked"]').forEach(function (el) {
        el.classList.remove('locked');
      });
      document.querySelectorAll('.container sp-slider, .container sp-picker, .container sp-textfield, .container sp-checkbox, .container input, .container button, .container a').forEach(function (el) {
        el.disabled = false;
        el.readOnly = false;
        el.removeAttribute('readonly');
        el.style.pointerEvents = 'auto';
        el.style.opacity = '';
      });
      ['#RenderButton', '#SaveButton', '#CancelButton'].forEach(function (sel) {
        var btn = document.querySelector(sel);
        if (btn) {
          btn.style.display = '';
          btn.style.pointerEvents = 'auto';
          btn.style.opacity = '1';
        }
      });
    } catch (e) {
      /* ignore */
    }
  }

  function patchFetch() {
    if (typeof window.fetch !== 'function' || window.__ditherFetchPatched) return;
    window.__ditherFetchPatched = true;
    var nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var url = typeof input === 'string' ? input : (input && input.url) || '';
      if (url.indexOf(LICENSE_HOST) !== -1 && url.indexOf('license') !== -1) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              success: true,
              entitlement_token: 'local-bypass',
              expires_at: '2099-12-31T23:59:59Z',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        );
      }
      return nativeFetch(input, init);
    };
  }

  unlockUI();
  patchFetch();
  document.addEventListener('DOMContentLoaded', function () {
    unlockUI();
    patchFetch();
  });
  window.addEventListener('load', unlockUI);

  try {
    var observer = new MutationObserver(function () {
      unlockUI();
    });
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'disabled', 'readonly'],
    });
  } catch (e) {
    setInterval(unlockUI, 500);
  }
})();
