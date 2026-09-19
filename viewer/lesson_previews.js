// Featured lesson cards keep their ordinary links as a fallback. A plain primary
// click can instead show the matching native dialog; modified clicks retain the
// browser's usual new-tab and download behaviour.
(function () {
  function init() {
    if (window.__hodosLessonPreviewsInitialized) return;
    window.__hodosLessonPreviewsInitialized = true;

    var root = document.documentElement;
    var dialogs = new Map();

    function close(dialog) {
      if (dialog.open && typeof dialog.close === 'function') dialog.close();
    }

    function isPlainPrimaryClick(event, anchor) {
      return !event.defaultPrevented &&
        (!event.button || event.button === 0) &&
        !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey &&
        !anchor.hasAttribute('download') &&
        (!anchor.target || anchor.target === '_self');
    }

    function bindDialog(dialog) {
      if (dialogs.has(dialog)) return dialogs.get(dialog);
      var state = { opener: null, scroll: null, active: false };

      function restore() {
        if (!state.active) return;
        var opener = state.opener;
        var scroll = state.scroll;
        state.opener = null;
        state.scroll = null;
        state.active = false;
        root.classList.remove('has-lesson-preview');

        if (opener && opener.isConnected) {
          try { opener.focus({ preventScroll: true }); }
          catch (_) { opener.focus(); }
        }
        if (scroll) {
          requestAnimationFrame(function () {
            if (!dialog.open) window.scrollTo(scroll.x, scroll.y);
          });
        }
      }

      function open(anchor) {
        if (dialog.open || typeof dialog.showModal !== 'function') return false;
        var scroll = { x: window.scrollX, y: window.scrollY };
        try { dialog.showModal(); }
        catch (_) { return false; }

        state.opener = anchor;
        state.scroll = scroll;
        state.active = true;
        root.classList.add('has-lesson-preview');

        var image = dialog.querySelector('[data-preview-image]');
        var source = image && image.getAttribute('data-src');
        if (image && source && !image.getAttribute('src')) image.setAttribute('src', source);
        return true;
      }

      dialog.addEventListener('close', restore);
      dialog.addEventListener('keydown', function (event) {
        if (event.key !== 'Tab') return;
        var focusable = Array.prototype.filter.call(
          dialog.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'),
          function (node) { return node.getClientRects().length > 0; }
        );
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
      dialog.addEventListener('click', function (event) {
        if (event.target !== dialog) return;
        var bounds = dialog.getBoundingClientRect();
        var outside = event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom;
        if (outside) close(dialog);
      });
      dialog.querySelectorAll('[data-preview-close]').forEach(function (button) {
        button.addEventListener('click', function () { close(dialog); });
      });

      var controller = { open: open };
      dialogs.set(dialog, controller);
      return controller;
    }

    document.querySelectorAll('a[data-preview-target]').forEach(function (anchor) {
      var dialog = document.getElementById(anchor.getAttribute('data-preview-target'));
      if (!dialog || dialog.nodeName !== 'DIALOG') return;
      if (typeof dialog.showModal !== 'function') return;
      var controller = bindDialog(dialog);
      anchor.setAttribute('aria-haspopup', 'dialog');
      anchor.setAttribute('aria-controls', dialog.id);
      var cue = anchor.querySelector('.lesson-preview-cue');
      if (cue) cue.hidden = false;
      anchor.addEventListener('click', function (event) {
        if (!isPlainPrimaryClick(event, anchor)) return;
        if (controller.open(anchor)) event.preventDefault();
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
