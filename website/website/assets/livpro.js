/* LIVpro product page: scroll-driven app walkthrough */
(function () {
  "use strict";
  var steps = [].slice.call(document.querySelectorAll(".lp-step"));
  var shots = [].slice.call(document.querySelectorAll(".lp-shot"));
  var dots = [].slice.call(document.querySelectorAll(".lp-dot"));
  if (!steps.length) return;

  function setActive(i) {
    steps.forEach(function (el, k) { el.classList.toggle("is-on", k === i); });
    shots.forEach(function (el, k) { el.classList.toggle("is-on", k === i); });
    dots.forEach(function (el, k) {
      el.classList.toggle("is-on", k === i);
      el.setAttribute("aria-current", k === i ? "true" : "false");
    });
  }
  setActive(0);

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setActive(steps.indexOf(e.target));
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    steps.forEach(function (s) { io.observe(s); });
  }

  dots.forEach(function (d, i) {
    d.addEventListener("click", function () {
      var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      steps[i].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    });
  });
})();
