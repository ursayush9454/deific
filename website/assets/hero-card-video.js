/* Plays the hero card video only while the "auto mode" switch is on. */
(function () {
  "use strict";
  var video = document.getElementById("dd-card-video");
  var sw = document.querySelector('button[role="switch"]');
  if (!video || !sw) return;
  var host = video.closest(".dd-card-vid-host");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var visible = true;
  var on = false;

  function sync() {
    var play = on && visible && !reduce && !document.hidden;
    host.classList.toggle("dd-vid-on", on && !reduce);
    if (play) {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    } else {
      video.pause();
    }
  }

  function read() {
    on = sw.getAttribute("aria-checked") === "true";
    sync();
  }

  new MutationObserver(read).observe(sw, { attributes: true, attributeFilter: ["aria-checked"] });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      sync();
    }).observe(host);
  }
  document.addEventListener("visibilitychange", sync);
  read();
})();
