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


/* Products grid: poora card clickable — tap/click par product page khulta hai.
   Buttons/links (More, Get a tailored quote, View details etc.) apna kaam karte rahenge. */
(function () {
  "use strict";
  var SKIP = "a, button, input, select, textarea, label, summary, [role='button']";

  function cardLink(card) {
    var links = card.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      var h = (links[i].getAttribute("href") || "").trim();
      if (h && h.charAt(0) !== "#" && !/^(?:mailto:|tel:|javascript:|https?:\/\/wa\.me)/i.test(h)) {
        return links[i];
      }
    }
    return null;
  }

  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    var t = e.target;
    if (!t.closest) return;
    var card = t.closest("#catalogue .grid > article");
    if (!card || t.closest(SKIP)) return;
    var link = cardLink(card);
    if (!link) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      window.open(link.href, "_blank", "noopener");
    } else {
      window.location.href = link.href;
    }
  });

  var style = document.createElement("style");
  style.textContent = "#catalogue .grid > article { cursor: pointer; }" +
    "#catalogue .grid > article a, #catalogue .grid > article button { cursor: pointer; }";
  document.head.appendChild(style);
})();