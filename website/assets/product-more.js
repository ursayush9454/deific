/* Products grid: "More" / "Less" toggle for card details */
(function () {
  "use strict";
  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest(".dd-more-btn");
    if (!btn) return;
    var body = document.getElementById(btn.getAttribute("aria-controls"));
    if (!body) return;
    var open = !body.classList.contains("is-open");
    body.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
})();
