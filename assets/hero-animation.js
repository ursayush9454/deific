
(() => {
  const canvas = document.getElementById("it-particles");
  if (!canvas || canvas.dataset.ready) return;

  canvas.dataset.ready = "true";
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const section = canvas.closest(".it-hero-bg");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  let width = 0;
  let height = 0;
  let particles = [];
  let frame = 0;
  let running = false;

  const mouse = { x: -1000, y: -1000 };

  function resize() {
    const rect = section.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    width = rect.width;
    height = rect.height;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(
      75,
      Math.max(25, Math.round(width / 18))
    );

    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 2 + 0.7
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 110) {
        p.x += dx / (distance + 1) * 0.25;
        p.y += dy / (distance + 1) * 0.25;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(220, 23, 41, 0.65)";
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);

        if (distance < 115) {
          const opacity = (1 - distance / 115) * 0.28;

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(220, 23, 41, ${opacity})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Moving red light streak
    const sweep = (frame * 1.3) % (width + 240) - 120;
    const gradient = ctx.createLinearGradient(
      sweep - 65, 0, sweep + 65, 0
    );

    gradient.addColorStop(0, "rgba(255, 0, 0, 0)");
    gradient.addColorStop(0.5, "rgba(225, 29, 46, 0.24)");
    gradient.addColorStop(1, "rgba(255, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(sweep - 65, 0, 130, height);

    frame++;
    if (!reduceMotion.matches) {
      running = true;
      requestAnimationFrame(draw);
    } else {
      running = false;
    }
  }

  function start() {
    if (running) return;
    running = true;

    if (reduceMotion.matches) {
      draw();
    } else {
      requestAnimationFrame(draw);
    }
  }

  section.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
  });

  section.addEventListener("pointerleave", () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });
  
/* Premium interactive tech parallax */
(() => {
  const hero = document.querySelector(".it-hero-bg");
  if (!hero || hero.dataset.parallaxReady) return;

  hero.dataset.parallaxReady = "true";

  const icons = hero.querySelectorAll(".tech-float");
  const motionOff = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );

  hero.addEventListener("pointermove", (event) => {
    if (motionOff.matches || event.pointerType === "touch") return;

    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    icons.forEach((icon, index) => {
      const depth = (index + 1) * 5;

      icon.style.setProperty("--mx", `${x * depth}px`);
      icon.style.setProperty("--my", `${y * depth}px`);
    });
  });

  hero.addEventListener("pointerleave", () => {
    icons.forEach((icon) => {
      icon.style.setProperty("--mx", "0px");
      icon.style.setProperty("--my", "0px");
    });
  });
})();


  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        start();
      } else {
        running = false;
      }
    }).observe(section);
  } else {
    start();
  }

  window.addEventListener("resize", resize);
  resize();
})();
