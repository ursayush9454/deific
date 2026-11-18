/* Visitsly product page: lost-lead calculator (illustrative estimate) */
(function () {
  "use strict";
  var root = document.querySelector("[data-roi]");
  if (!root) return;
  var v = {};
  function q(s) { return root.querySelector(s); }
  function inr(n) { return "₹" + Math.round(n).toLocaleString("en-IN"); }
  function num(n) { return Math.round(n).toLocaleString("en-IN"); }
  function calc() {
    var cold = v.leads * (1 - v.fast / 100);
    var visits = cold * (v.book / 100);
    var deals = visits * (v.deal / 100);
    q('[data-r="cold"]').textContent = num(cold);
    q('[data-r="visits"]').textContent = num(visits);
    q('[data-r="deals"]').textContent = deals < 10 ? (Math.round(deals * 10) / 10).toString() : num(deals);
    q('[data-r="money"]').textContent = inr(deals * v.earn);
  }
  [].slice.call(root.querySelectorAll("[data-i]")).forEach(function (el) {
    var k = el.getAttribute("data-i");
    function upd() {
      v[k] = parseFloat(el.value);
      var o = q('[data-o="' + k + '"]');
      o.textContent = k === "leads" ? num(v[k]) : k === "earn" ? inr(v[k]) : v[k] + "%";
      calc();
    }
    el.addEventListener("input", upd);
    upd();
  });
})();
