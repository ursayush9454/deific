/* Default country code follows the page: India = +91, UAE (English and Arabic) = +971, USA = +1.
   If the visitor picks a code themselves, it is never overridden. */
(function () {
  "use strict";
  var EN = "+91", AR = "+971", US = "+1";
  var touched = new WeakSet();

  function isArabic() {
    return /^ar(?:-|$)/i.test(document.documentElement.lang || "") ||
      /^\/uae\/ar(?:\/|$)/i.test(location.pathname);
  }

  function isUAE() {
    return /^\/uae(?:\/|$)/i.test(location.pathname) || /^[a-z]{2}-AE$/i.test(document.documentElement.lang || "");
  }

  function isUSA() {
    return /^\/usa(?:\/|$)/i.test(location.pathname);
  }

  function selects() {
    var out = [];
    Array.prototype.forEach.call(document.querySelectorAll('input[type="tel"]'), function (inp) {
      var sel = inp.previousElementSibling;
      if (!sel || sel.tagName !== "SELECT") sel = inp.parentElement && inp.parentElement.querySelector("select");
      if (sel && sel.tagName === "SELECT" && !sel.id) out.push(sel);
    });
    return out;
  }

  function apply() {
    var code = (isArabic() || isUAE()) ? AR : (isUSA() ? US : EN);
    selects().forEach(function (sel) {
      if (touched.has(sel)) return;
      if (!touched.has(sel)) {
        sel.addEventListener("change", function () { touched.add(sel); });
      }
      var has = Array.prototype.some.call(sel.options, function (o) { return o.value === code; });
      if (has && sel.value !== code) sel.value = code;
    });
  }

  function init() {
    apply();
    new MutationObserver(apply).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
    /* React-free pages can rebuild nodes after translation; re-check shortly after load */
    setTimeout(apply, 800);
    setTimeout(apply, 2500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
