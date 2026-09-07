(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =====================================================
     STARFIELD — canvas particles with twinkle + parallax
  ===================================================== */
  const canvas = document.getElementById("stars-canvas");
  const ctx = canvas.getContext("2d");

  let width, height, dpr;
  let stars = [];
  let pointer = { x: 0, y: 0, targetX: 0, targetY: 0 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildStars();
  }

  function buildStars() {
    const density = Math.min(180, Math.floor((width * height) / 6000));
    stars = [];
    for (let i = 0; i < density; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.4 + 0.3,
        depth: Math.random() * 0.8 + 0.2, // parallax factor
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.015 + 0.006,
        drift: (Math.random() - 0.5) * 0.05
      });
    }
  }

  function drawStars(time) {
    ctx.clearRect(0, 0, width, height);

    // gentle parallax easing toward pointer
    pointer.x += (pointer.targetX - pointer.x) * 0.04;
    pointer.y += (pointer.targetY - pointer.y) * 0.04;

    for (const s of stars) {
      const twinkle = 0.55 + Math.sin(time * s.speed + s.phase) * 0.45;
      const px = s.x + pointer.x * s.depth * 18 + Math.sin(time * 0.0002 + s.phase) * s.drift * 40;
      const py = s.y + pointer.y * s.depth * 18;

      ctx.beginPath();
      ctx.arc(px, py, s.r * (0.8 + twinkle * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(246,242,255,${0.35 + twinkle * 0.55})`;
      ctx.fill();

      if (s.r > 1.1) {
        ctx.beginPath();
        ctx.arc(px, py, s.r * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,159,214,${0.06 * twinkle})`;
        ctx.fill();
      }
    }

    if (!prefersReducedMotion) {
      requestAnimationFrame(drawStars);
    }
  }

  window.addEventListener("resize", resize, { passive: true });

  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    },
    { passive: true }
  );

  window.addEventListener(
    "deviceorientation",
    (e) => {
      if (e.gamma == null || e.beta == null) return;
      pointer.targetX = Math.max(-1, Math.min(1, e.gamma / 30));
      pointer.targetY = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    },
    { passive: true }
  );

  resize();
  drawStars(0);
  if (prefersReducedMotion) {
    // draw a single static frame
    drawStars(0);
  }

  /* =====================================================
     TAP / TOUCH SPARKLE
  ===================================================== */
  function spawnSparkle(x, y) {
    const el = document.createElement("div");
    el.className = "tap-sparkle";
    el.style.left = x + "px";
    el.style.top = y + "px";
    const hue = Math.random() > 0.5;
    if (hue) el.style.background = "var(--pink-soft)";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 750);
  }

  window.addEventListener(
    "pointerdown",
    (e) => {
      // skip if the press is directly on an interactive control to avoid double effects on buttons
      spawnSparkle(e.clientX, e.clientY);
    },
    { passive: true }
  );

  /* =====================================================
     SCENE MANAGER
  ===================================================== */
  const scenes = {
    opening: document.getElementById("scene-opening"),
    1: document.getElementById("scene-1"),
    2: document.getElementById("scene-2"),
    3: document.getElementById("scene-3"),
    4: document.getElementById("scene-4")
  };
  const veil = document.getElementById("transition-veil");

  // show opening immediately
  scenes.opening.classList.add("active");

  function goToScene(nextKey) {
    const current = document.querySelector(".scene.active");
    const next = scenes[nextKey];
    if (!next || next === current) return;

    const doSwitch = () => {
      if (current) {
        current.classList.remove("active", "reveal");
        current.classList.remove("leave");
      }
      next.classList.add("active");
      next.classList.add("reveal");
      window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
    };

    if (prefersReducedMotion) {
      doSwitch();
      return;
    }

    if (current) current.classList.add("leave");
    veil.classList.remove("streak");
    // force reflow to restart animation
    void veil.offsetWidth;
    veil.classList.add("streak");

    setTimeout(doSwitch, 260);
    setTimeout(() => veil.classList.remove("streak"), 800);
  }

  document.querySelectorAll(".next-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      goToScene(btn.dataset.next);
    });
  });

  /* =====================================================
     ENVELOPE OPENING SEQUENCE
  ===================================================== */
  const envelopeWrap = document.getElementById("envelope-wrap");
  const hintText = document.getElementById("hint-text");
  let opened = false;

  function openEnvelope() {
    if (opened) return;
    opened = true;
    hintText.style.opacity = "0";
    envelopeWrap.classList.add("open");

    setTimeout(() => {
      envelopeWrap.classList.add("burst");
      if (!prefersReducedMotion) {
        veil.classList.add("streak");
      }
    }, 650);

    setTimeout(() => {
      goToScene(1);
    }, prefersReducedMotion ? 700 : 950);
  }

  envelopeWrap.addEventListener("click", openEnvelope);
  envelopeWrap.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openEnvelope();
    }
  });
})();