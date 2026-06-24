/* ============================================================
   Innorbia — interacciones
   ============================================================ */
(function () {
  "use strict";

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Año dinámico ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Navbar: estado al hacer scroll + barra de progreso ---------- */
  const nav = $("#nav");
  const progress = $("#scrollProgress");
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("scrolled", y > 30);
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menú móvil ---------- */
  const toggle = $("#navToggle");
  const links = $("#navLinks");
  const closeMenu = () => { toggle.classList.remove("open"); links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); };
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
  $$("#navLinks a").forEach(a => a.addEventListener("click", closeMenu));
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMenu(); });

  /* ---------- Reveal al hacer scroll ---------- */
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add("in"); obs.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("in"));
  }

  /* ---------- Contadores animados ---------- */
  const counters = $$(".count");
  const runCount = (el) => {
    const to = parseInt(el.dataset.to, 10) || 0;
    const dur = 1400; const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => { if (en.isIntersecting) { runCount(en.target); obs.unobserve(en.target); } });
    }, { threshold: 0.6 });
    counters.forEach(c => cio.observe(c));
  } else {
    counters.forEach(c => c.textContent = c.dataset.to);
  }

  /* ---------- Nav activo según sección visible ---------- */
  const sections = $$("main section[id]");
  const navAnchors = $$('#navLinks a[href^="#"]');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        const id = en.target.id;
        navAnchors.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + id));
      }
    });
  }, { threshold: 0.4, rootMargin: "-20% 0px -55% 0px" });
  sections.forEach(s => spy.observe(s));

  /* ---------- Sistema ÓRBITA: nodos ↔ tarjetas de fase ---------- */
  const nodes = $$(".orbita__node");
  const phases = $$(".phase");
  const setActive = (letter) => {
    nodes.forEach(n => n.classList.toggle("active", n.dataset.phase === letter));
    phases.forEach(p => p.classList.toggle("active", p.dataset.phase === letter));
  };
  const clearActive = () => { nodes.forEach(n => n.classList.remove("active")); phases.forEach(p => p.classList.remove("active")); };
  nodes.forEach(n => {
    n.addEventListener("mouseenter", () => setActive(n.dataset.phase));
    n.addEventListener("focus", () => setActive(n.dataset.phase));
    n.addEventListener("click", () => {
      const card = phases.find(p => p.dataset.phase === n.dataset.phase);
      if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
      setActive(n.dataset.phase);
    });
  });
  phases.forEach(p => {
    p.addEventListener("mouseenter", () => setActive(p.dataset.phase));
    p.addEventListener("mouseleave", clearActive);
  });
  const orbitaSystem = $(".orbita__system");
  if (orbitaSystem) orbitaSystem.addEventListener("mouseleave", clearActive);

  /* ---------- Brillo que sigue al cursor en tarjetas de servicio ---------- */
  $$(".svc").forEach(card => {
    card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    });
  });

  /* ---------- Formulario de contacto (estático: abre el cliente de correo) ---------- */
  const form = $("#contactForm");
  const note = $("#formNote");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      if (!data.nombre.trim() || !data.correo.trim() || !data.mensaje.trim()) {
        note.textContent = "Por favor completa nombre, correo y mensaje.";
        note.className = "contact__note err";
        return;
      }
      const correoRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!correoRe.test(data.correo)) {
        note.textContent = "Ingresa un correo electrónico válido.";
        note.className = "contact__note err";
        return;
      }
      const asunto = `Solicitud de consultoría — ${data.nombre}` + (data.empresa ? ` (${data.empresa})` : "");
      const cuerpo =
        `Nombre: ${data.nombre}\n` +
        `Empresa: ${data.empresa || "—"}\n` +
        `Correo: ${data.correo}\n` +
        `Teléfono: ${data.telefono || "—"}\n\n` +
        `Mensaje:\n${data.mensaje}`;
      const mailto = `mailto:contacto@innorbia.com?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;

      note.textContent = "¡Gracias! Abrimos tu correo para enviar el mensaje a Innorbia…";
      note.className = "contact__note ok";
      window.location.href = mailto;
      form.reset();
    });
  }
})();
