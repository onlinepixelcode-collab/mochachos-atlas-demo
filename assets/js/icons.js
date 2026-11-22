/* Mochachos Atlas Road — drawn UI icons (no emojis anywhere on the site).
   MIcon("phone") returns an inline SVG string. Static markup can use <i data-ic="phone"></i>,
   which is filled in on load. Icons use currentColor so they follow the text colour. */
(function () {
  "use strict";
  var S = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  var F = 'fill="currentColor"';
  var P = {
    chilli: '<path ' + F + ' d="M17.5 6.5c2.3 1.6 2.9 5 1 8.6-2.1 4-6.6 6.9-12.6 6.9-1.3 0-1.6-1.4-.5-1.9 4.3-2 6.1-4.6 7-8.2.6-2.6 1.6-4.6 3.4-5.4z"/><path ' + S + ' d="M17 6.6c.2-1.8 1.1-3.2 2.8-3.9"/>',
    flame: '<path ' + F + ' d="M12 2c.6 3.4 3.6 5.3 4.9 8.3 1.6 3.7.1 8.5-4.9 9.7-5 .9-8.6-2.8-7.8-7.3.4-2.4 1.9-3.9 2.9-5.3.3 1.6 1.1 2.7 2.4 3.2C9 7.4 10.2 4.6 12 2z"/><path fill="#fff" opacity=".55" d="M12.2 12.3c1.6 1.6 2.4 3 1.9 4.7-.4 1.4-1.6 2.2-2.9 2.1-1.6-.2-2.6-1.7-2.1-3.3.3-1.1 1.4-2 3.1-3.5z"/>',
    phone: '<path ' + S + ' d="M5 3h3.5l1.8 4.6-2.3 1.5a11 11 0 0 0 6.9 6.9l1.5-2.3L21 15.5V19a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    car: '<path ' + S + ' d="M5 17H3v-5l2.2-5.2A2 2 0 0 1 7 5.5h10a2 2 0 0 1 1.8 1.3L21 12v5h-2"/><path ' + S + ' d="M3 12h18M9 17h6"/><circle cx="7" cy="17" r="2" ' + S + '/><circle cx="17" cy="17" r="2" ' + S + '/>',
    scooter: '<circle cx="6" cy="17" r="3" ' + S + '/><circle cx="18" cy="17" r="3" ' + S + '/><path ' + S + ' d="M9 17h6l2-7h-4M15 5h3l1.5 9M3 12h7l2 3"/><rect x="3" y="7" width="6" height="5" rx="1" ' + S + '/>',
    bell: '<path ' + S + ' d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 21h4"/>',
    belloff: '<path ' + S + ' d="M8.7 5.3A6 6 0 0 1 18 11v4M6 11v5l-1.5 2H17M10 21h4M3 3l18 18"/>',
    chat: '<path ' + S + ' d="M4 5h16v11H9l-5 4z"/><path ' + S + ' d="M8 10h8M8 13h5"/>',
    clock: '<circle cx="12" cy="12" r="9" ' + S + '/><path ' + S + ' d="M12 7v5l3 2"/>',
    pause: '<rect x="6" y="5" width="4" height="14" rx="1" ' + F + '/><rect x="14" y="5" width="4" height="14" rx="1" ' + F + '/>',
    play: '<path ' + F + ' d="M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.8l-12-7.5A1 1 0 0 0 7 4.5z"/>',
    cog: '<circle cx="12" cy="12" r="3" ' + S + '/><path ' + S + ' d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1"/>',
    expand: '<path ' + S + ' d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2" ' + S + '/><path ' + S + ' d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    check: '<path ' + S + ' d="M5 12.5l4.5 4.5L19 7"/>',
    cash: '<rect x="2.5" y="6" width="19" height="12" rx="2" ' + S + '/><circle cx="12" cy="12" r="2.6" ' + S + '/><path ' + S + ' d="M6 9.5v5M18 9.5v5"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2" ' + S + '/><path ' + S + ' d="M2.5 10h19M6 15h4"/>',
    cart: '<path ' + S + ' d="M3 4h2.5l2.2 11h10.6L20.5 8H7"/><circle cx="9.5" cy="19" r="1.5" ' + F + '/><circle cx="17" cy="19" r="1.5" ' + F + '/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3" ' + S + '/><path ' + S + ' d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/>',
    send: '<path ' + F + ' d="M3.4 20.4L21 12 3.4 3.6 3.4 10l12 2-12 2z"/>',
    backspace: '<path ' + S + ' d="M8 5h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H8l-6-7z"/><path ' + S + ' d="M11 9l6 6M17 9l-6 6"/>',
    speaker: '<path ' + F + ' d="M4 9h4l5-4v14l-5-4H4z"/><path ' + S + ' d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
    mute: '<path ' + F + ' d="M4 9h4l5-4v14l-5-4H4z"/><path ' + S + ' d="M16.5 9.5l5 5M21.5 9.5l-5 5"/>',
    sun: '<circle cx="12" cy="12" r="4.5" ' + F + '/><path ' + S + ' d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
    moon: '<path ' + F + ' d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
    taco: '<path ' + F + ' d="M2.5 17a9.5 9.5 0 0 1 19 0z"/><path fill="#fff" opacity=".35" d="M5 15.5c1-3.3 3.8-5.5 7-5.5s6 2.2 7 5.5z"/><circle cx="8" cy="11" r="1.4" fill="#fff" opacity=".7"/><circle cx="13.5" cy="9.5" r="1.4" fill="#fff" opacity=".7"/>',
    fries: '<path ' + F + ' d="M5.5 10h13l-1.6 11H7.1z"/><path ' + S + ' d="M8 10V3.5M11 10V2.5M14 10V3M17 10V5"/>',
    drumstick: '<path ' + F + ' d="M14.6 3.2a6 6 0 0 1 6.2 6.2c-.2 3.6-3.6 6.2-7.3 5.4l-3.3 3.3a2.2 2.2 0 1 1-2.9 2.9 2.2 2.2 0 1 1-2.9-2.9 2.2 2.2 0 1 1 2.9-2.9l3.3-3.3c-.8-3.7 1.6-8.5 4-8.7z"/>',
    burger: '<path ' + F + ' d="M3 10a9 6 0 0 1 18 0z"/><rect x="2.5" y="12" width="19" height="2.4" rx="1.2" ' + F + ' opacity=".6"/><path ' + F + ' d="M3 16.5h18v1A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z"/>',
    burrito: '<rect x="3" y="8" width="18" height="9" rx="4.5" transform="rotate(-20 12 12.5)" ' + F + '/><path stroke="#fff" stroke-width="1.6" opacity=".55" fill="none" d="M7.5 9.5l2.5 7M12 7.8l2.5 7"/>',
    cup: '<path ' + F + ' d="M6 8h12l-1.5 13h-9z"/><rect x="5" y="6" width="14" height="2.5" rx="1" ' + F + '/><path ' + S + ' d="M13 6l2-4"/>',
    star: '<path ' + F + ' d="M12 2.5l2.9 6 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.2 1.3-6.6-4.9-4.6 6.6-.8z"/>',
    dynamite: '<rect x="5" y="9" width="4" height="12" rx="1" ' + F + '/><rect x="10" y="9" width="4" height="12" rx="1" ' + F + '/><rect x="15" y="9" width="4" height="12" rx="1" ' + F + '/><path ' + S + ' d="M12 9c0-3 2-5 5-5"/><circle cx="18.5" cy="3.5" r="1.6" fill="#f5c000"/>',
    party: '<path ' + F + ' d="M3 21l4.5-12.5 8 8z"/><path ' + S + ' d="M14 3v2M19 5l-1.5 1.5M21 10h-2M11 6l1 1.5M16 11l1.5 1"/>',
    crescent: '<path ' + F + ' d="M15.5 3.5A8.5 8.5 0 1 0 20 18a7 7 0 0 1-4.5-14.5z"/><path ' + F + ' d="M18 7l.8 1.7 1.8.2-1.3 1.2.4 1.8-1.7-.9-1.6.9.3-1.8-1.3-1.2 1.8-.2z"/>',
    sleep: '<path ' + S + ' d="M4 8h5l-5 6h5M13 4h4l-4 5h4M15 14h5l-5 6h5"/>',
    pin: '<path ' + F + ' d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.6" fill="#fff"/>',
    note: '<path ' + S + ' d="M5 3h10l4 4v14H5z"/><path ' + S + ' d="M8 10h8M8 14h8M8 18h5"/>',
    printer: '<path ' + S + ' d="M7 8V3h10v5M7 17H4v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7h-3"/><rect x="7" y="14" width="10" height="7" ' + S + '/>',
    warning: '<path ' + S + ' d="M12 3l10 18H2z"/><path ' + S + ' d="M12 10v5M12 18v.01"/>',
    close: '<path ' + S + ' d="M6 6l12 12M18 6L6 18"/>',
    salad: '<path ' + F + ' d="M2.5 12h19a9.5 8 0 0 1-19 0z"/><path fill="#7cb342" d="M6 12c-.5-2.5 1-4.5 3-4.3.6-2 3.4-2.8 5-1 1.8-1 4.2.3 4 2.7 1.3.6 1.6 1.6 1 2.6z"/>',
    kid: '<circle cx="12" cy="6" r="3" ' + F + '/><path ' + F + ' d="M7 21v-6l-2-3 2-2.5h10l2 2.5-2 3v6h-3.5v-5h-3v5z"/>',
    heart: '<path ' + F + ' d="M12 20.5l-1.3-1.2C5.6 14.7 2.5 11.9 2.5 8.4 2.5 5.6 4.7 3.5 7.4 3.5c1.8 0 3.5.9 4.6 2.2 1.1-1.3 2.8-2.2 4.6-2.2 2.7 0 4.9 2.1 4.9 4.9 0 3.5-3.1 6.3-8.2 10.9z"/>',
    churro: '<rect x="4" y="9.5" width="16" height="5" rx="2.5" transform="rotate(-35 12 12)" ' + F + '/><path stroke="#fff" stroke-width="1.2" opacity=".5" fill="none" d="M7 15.5l9.5-6.6"/>'
  };
  function MIcon(name, cls) {
    var p = P[name]; if (!p) return "";
    return '<svg class="ic ic-' + name + (cls ? " " + cls : "") + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + p + "</svg>";
  }
  MIcon.repeat = function (name, n, cls) { var s = ""; for (var i = 0; i < n; i++) s += MIcon(name, cls); return s; };
  MIcon.fill = function (root) {
    (root || document).querySelectorAll("[data-ic]:not([data-ic-done])").forEach(function (el) {
      var n = +el.getAttribute("data-ic-n") || 1;
      el.innerHTML = MIcon.repeat(el.getAttribute("data-ic"), n);
      el.setAttribute("data-ic-done", "");
    });
  };
  // a standalone image of an icon in a fixed colour (for canvas drawing)
  MIcon.image = function (name, color) {
    var img = new Image();
    img.src = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" color="' + color + '">' + (P[name] || "") + "</svg>");
    return img;
  };
  window.MIcon = MIcon;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { MIcon.fill(); });
  else MIcon.fill();
})();
