/* Intellible site motion: smooth scroll, one dot field behind the page, parallax layers,
   the account file, the web of agents, the glass menu and the contact panel. */
(function () {
  "use strict";
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const narrow = () => window.innerWidth <= 860;
  root.classList.add("js");
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const lerp = (a, b, t) => a + (b - a) * t;

  // ---------------------------------------------------------- smooth scroll
  let lenis = null;
  if (!reduce && window.Lenis) {
    try { lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true }); } catch (e) { lenis = null; }
  }

  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const speedEls = $$("[data-speed]"), driftEls = $$("[data-drift]"), xdriftEls = $$("[data-xdrift]"), slideEls = $$("[data-slide]");
  const strikes = $$(".strike");
  const hero = document.getElementById("hero");

  // ---------------------------------------------------------- reveals
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.05 });
  $$(".reveal, .mask").forEach((el, i) => {
    if (el.classList.contains("mask")) el.firstElementChild.style.transitionDelay = (i % 4) * 0.12 + "s";
    io.observe(el);
  });

  // ---------------------------------------------------------- the account file
  const steps = $$(".step"), rows = $$(".drow"), ticks = $$(".ticks i");
  const stamp = document.getElementById("stamp"), stepNo = document.getElementById("step-no");
  let activeStep = -1;
  function setStep(i) {
    if (i === activeStep) return;
    activeStep = i;
    steps.forEach((s, k) => s.classList.toggle("on", k === i));
    rows.forEach((r, k) => { r.classList.toggle("on", k <= i); r.classList.toggle("now", k === i); });
    ticks.forEach((t, k) => t.classList.toggle("on", k <= i));
    stepNo.textContent = String(i + 1).padStart(2, "0");
    stamp.textContent = i < 0 ? "In review" : steps[i].dataset.stamp;
    stamp.classList.toggle("on", i >= 0);
    stamp.classList.remove("bump"); void stamp.offsetWidth; if (i >= 0) stamp.classList.add("bump");
  }

  // ---------------------------------------------------------- one dot field behind the page
  const field = document.getElementById("field");
  const fctx = field.getContext("2d");
  let dots = [], FW = 0, FH = 0, dpr = 1, GAP = 24;
  const hash = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  function sizeField() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    FW = window.innerWidth; FH = window.innerHeight;
    field.width = FW * dpr; field.height = FH * dpr;
    GAP = narrow() ? 20 : 24;
    dots = []; let i = 0;
    for (let y = -GAP; y < FH + GAP; y += GAP) for (let x = 8; x < FW; x += GAP) dots.push({ x, y, a: hash(i), b: hash(i + 999), c: hash(i++ + 5555) });
  }
  // what the field looks like in each section: density, heat, where the heat sits, how wide
  const LOOK = {
    hero: { d: 0, h: 0, x: 0.8, y: 0.5, w: 0.3 },
    leak: { d: 0.55, h: 0.85, x: 0.85, y: 0.5, w: 0.32, travel: -0.55 },
    steps: { d: 0.28, h: 0.35, x: 0.18, y: 0.45, w: 0.28 },
    rehearse: { d: 0.12, h: 0.0, x: 0.6, y: 0.5, w: 0.3 },
    desk: { d: 0.3, h: 0.4, x: 0.85, y: 0.35, w: 0.25, travel: -0.4 },
    wont: { d: 0.3, h: 0.3, x: 0.15, y: 0.6, w: 0.25, travel: 0.3 },
    who: { d: 0.22, h: 0.15, x: 0.95, y: 0.2, w: 0.15 },
    faq: { d: 0.2, h: 0.35, x: 0.15, y: 0.5, w: 0.3 },
    close: { d: 0.1, h: 0.2, x: 0.5, y: 0.7, w: 0.9 },
  };
  const sections = $$("[data-field]");
  const cur = { d: 0, h: 0, x: 0.8, y: 0.5, w: 0.3 };
  function fieldTarget(H) {
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.top <= H * 0.5 && r.bottom >= H * 0.5) {
        const look = LOOK[s.dataset.field];
        const p = clamp((H * 0.5 - r.top) / Math.max(1, r.height));
        return Object.assign({}, look, { x: look.x + (look.travel || 0) * p });
      }
    }
    return LOOK.close;
  }
  function drawField(t, scrollY) {
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fctx.clearRect(0, 0, FW, FH);
    if (cur.d < 0.01 && cur.h < 0.01) return;
    const shift = -((scrollY * 0.18) % GAP);            // dots drift slower than the page
    for (const d of dots) {
      const y = d.y + shift, nx = d.x / FW, ny = y / FH;
      const tw = 0.5 + 0.5 * Math.sin(t * 0.0012 + d.a * 40);
      const near = Math.max(0, 1 - Math.abs(nx - cur.x) / cur.w) * Math.max(0, 1 - Math.abs(ny - cur.y) / 0.7);
      const soft = narrow() ? 0.45 : 1;
      const hot = d.b < near * 0.85 * cur.h * soft;
      if (!hot && d.a > cur.d * (narrow() ? 0.6 : 1)) continue;
      const r = hot ? 1.3 + d.c * 2.8 : 0.8 + d.c * 1.5;
      fctx.fillStyle = hot ? (d.c > 0.6 ? `rgba(255,157,0,${0.4 + 0.6 * tw})` : `rgba(227,70,8,${0.35 + 0.6 * tw})`)
        : `rgba(${100 + d.c * 50 | 0},${96 + d.c * 46 | 0},${80 + d.c * 40 | 0},${0.16 + 0.38 * tw})`;
      fctx.beginPath(); fctx.arc(d.x, y, r, 0, 6.283); fctx.fill();
    }
  }

  // ---------------------------------------------------------- the web of agents
  const reh = document.getElementById("rehearse");
  const web = document.getElementById("web");
  const wctx = web.getContext("2d");
  const stageEls = $$(".stage");
  const raisedEl = document.getElementById("raised"), answeredEl = document.getElementById("answered");
  let WW = 0, WH = 0;
  const SOURCES = ["Exit emails", "Support tickets", "Usage logs", "Call notes"];
  const AGENTS = [
    { id: "CFO", role: "Finance", note: "Watches the cost" },
    { id: "OPS", role: "Ops lead", note: "Remembers the rollout" },
    { id: "USER", role: "Daily user", note: "Lived in the product" },
  ];
  const DEBATE = [
    { from: 0, ask: "No reporting?", reply: "Shipped two months ago" },
    { from: 1, ask: "Onboarding failed us", reply: "A named guide for two weeks" },
    { from: 2, ask: "Budget is frozen", reply: "You raised in August" },
  ];
  const parts = Array.from({ length: 150 }, (_, i) => ({ s: i % 4, a: Math.floor(hash(i + 7) * 3), r: hash(i + 3), q: hash(i + 11), o: hash(i + 19) * 6.283 }));
  function sizeWeb() {
    const r = web.getBoundingClientRect();
    WW = r.width; WH = r.height;
    web.width = WW * dpr; web.height = WH * dpr;
  }
  function layout() {
    const m = narrow();
    const src = SOURCES.map((_, i) => ({ x: WW * (m ? 0.13 + i * 0.247 : 0.07), y: m ? WH * 0.08 : WH * (0.18 + i * 0.21) }));
    const pitch = { x: WW * (m ? 0.5 : 0.63), y: WH * (m ? 0.6 : 0.52) };
    const ag = m
      ? [{ x: WW * 0.5, y: WH * 0.3 }, { x: WW * 0.16, y: WH * 0.86 }, { x: WW * 0.84, y: WH * 0.86 }]
      : [{ x: WW * 0.63, y: WH * 0.15 }, { x: WW * 0.38, y: WH * 0.84 }, { x: WW * 0.88, y: WH * 0.84 }];
    return { src, ag, pitch };
  }
  function ringAt(x, y, r, t, alpha, hot) {
    wctx.save();
    wctx.translate(x, y); wctx.rotate(t * 0.0004);
    wctx.setLineDash([2, 5]);
    wctx.strokeStyle = `rgba(255,157,0,${alpha})`;
    wctx.lineWidth = 2;
    wctx.beginPath(); wctx.arc(0, 0, r, 0, 6.283); wctx.stroke();
    wctx.restore();
    wctx.setLineDash([]);
    const g = wctx.createRadialGradient(x, y, 0, x, y, r * 1.6);
    g.addColorStop(0, `rgba(255,157,0,${0.22 * alpha * (hot ? 1.8 : 1)})`); g.addColorStop(1, "rgba(255,157,0,0)");
    wctx.fillStyle = g; wctx.beginPath(); wctx.arc(x, y, r * 1.6, 0, 6.283); wctx.fill();
    wctx.fillStyle = `rgba(22,18,16,${0.9 * alpha})`;
    wctx.beginPath(); wctx.arc(x, y, r * 0.66, 0, 6.283); wctx.fill();
  }
  function label(text, x, y, size, color, align, weight) {
    wctx.font = `${weight || 500} ${size}px Archivo, "Arial Narrow", sans-serif`;
    wctx.fillStyle = color; wctx.textAlign = align || "center"; wctx.textBaseline = "middle";
    wctx.fillText(text, x, y);
  }
  function pill(text, x, y, color, bg) {
    wctx.font = `500 13px "Inter Tight", Arial, sans-serif`;
    const w = wctx.measureText(text).width + 22, h = 28;
    wctx.fillStyle = bg; roundRect(x - w / 2, y - h / 2, w, h, 14); wctx.fill();
    wctx.fillStyle = color; wctx.textAlign = "center"; wctx.textBaseline = "middle"; wctx.fillText(text, x, y + 1);
  }
  function roundRect(x, y, w, h, r) { wctx.beginPath(); wctx.moveTo(x + r, y); wctx.arcTo(x + w, y, x + w, y + h, r); wctx.arcTo(x + w, y + h, x, y + h, r); wctx.arcTo(x, y + h, x, y, r); wctx.arcTo(x, y, x + w, y, r); wctx.closePath(); }

  function drawWeb(t, p) {
    if (!WW) return;
    wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    wctx.clearRect(0, 0, WW, WH);
    const L = layout();
    const s1 = ease(clamp(p / 0.2)), s2 = ease(clamp((p - 0.24) / 0.24)), s3 = clamp((p - 0.52) / 0.34), s4 = ease(clamp((p - 0.86) / 0.12));
    const R = narrow() ? 26 : 38;

    // sources: what the account already told you
    L.src.forEach((s, i) => {
      const a = s1 * (1 - s2 * 0.55);
      wctx.fillStyle = `rgba(238,234,220,${0.7 * a})`;
      wctx.beginPath(); wctx.arc(s.x, s.y, 3, 0, 6.283); wctx.fill();
      label(SOURCES[i].toUpperCase(), s.x + (narrow() ? 0 : 12), s.y + (narrow() ? 16 : 0), narrow() ? 9 : 12, `rgba(149,145,128,${a})`, narrow() ? "center" : "left");
    });

    // threads from everything they said to each agent: the web forming
    const thread = s2 * (1 - s4 * 0.6);
    if (thread > 0.02) {
      wctx.lineWidth = 1;
      L.src.forEach((s) => L.ag.forEach((g, j) => {
        wctx.strokeStyle = `rgba(227,70,8,${0.14 * thread})`;
        wctx.beginPath(); wctx.moveTo(s.x, s.y);
        wctx.quadraticCurveTo((s.x + g.x) / 2, (s.y + g.y) / 2 + (j - 1) * 40, g.x, g.y); wctx.stroke();
      }));
    }
    // the web between agents and the pitch
    const webA = clamp((s2 - 0.55) / 0.45);
    if (webA > 0) {
      const glow = s4;
      const lines = [[0, 1], [1, 2], [2, 0]];
      wctx.lineWidth = 1;
      lines.forEach(([a, b]) => {
        wctx.strokeStyle = `rgba(${glow ? "255,157,0" : "94,89,74"},${0.5 * webA + 0.3 * glow})`;
        wctx.setLineDash([3, 7]); wctx.beginPath(); wctx.moveTo(L.ag[a].x, L.ag[a].y); wctx.lineTo(L.ag[b].x, L.ag[b].y); wctx.stroke();
      });
      L.ag.forEach((g) => {
        wctx.strokeStyle = `rgba(255,157,0,${0.35 * webA + 0.45 * glow})`;
        wctx.setLineDash([]); wctx.beginPath(); wctx.moveTo(g.x, g.y); wctx.lineTo(L.pitch.x, L.pitch.y); wctx.stroke();
      });
      wctx.setLineDash([]);
    }

    // particles: fragments travel from what they said into who they are
    parts.forEach((q) => {
      const src = L.src[q.s], ag = L.ag[q.a];
      const sx = src.x + (narrow() ? (q.r - 0.5) * 50 : 30 + q.r * 90), sy = src.y + (q.q - 0.5) * (narrow() ? 26 : 40);
      const orbit = R * (1.15 + q.r * 0.55), ang = q.o + t * 0.0006 * (0.6 + q.q);
      const ox = ag.x + Math.cos(ang) * orbit, oy = ag.y + Math.sin(ang) * orbit;
      const k = ease(clamp((s2 * 1.25) - q.q * 0.25));
      const mx = (sx + ox) / 2, my = (sy + oy) / 2 - 60 * (q.r - 0.5);
      const x = (1 - k) * (1 - k) * sx + 2 * (1 - k) * k * mx + k * k * ox;
      const y = (1 - k) * (1 - k) * sy + 2 * (1 - k) * k * my + k * k * oy;
      const a = s1 * (0.35 + 0.55 * q.q) * (1 - s4 * 0.3);
      if (a < 0.02) return;
      wctx.fillStyle = q.q > 0.6 ? `rgba(255,157,0,${a})` : `rgba(227,70,8,${a * 0.9})`;
      wctx.beginPath(); wctx.arc(x, y, 1.2 + q.r * 1.8, 0, 6.283); wctx.fill();
    });

    // agents form
    L.ag.forEach((g, i) => {
      const a = ease(clamp((s2 - 0.35 - i * 0.12) / 0.4));
      if (a <= 0) return;
      ringAt(g.x, g.y, R, t, a, s4 > 0);
      label(AGENTS[i].id, g.x, g.y, narrow() ? 11 : 14, `rgba(238,234,220,${a})`, "center", 600);
      label(AGENTS[i].role.toUpperCase(), g.x, g.y + R + 18, narrow() ? 10 : 13, `rgba(238,234,220,${a})`);
      if (!narrow()) label(AGENTS[i].note, g.x, g.y + R + 36, 12, `rgba(149,145,128,${a})`, "center", 400);
    });

    // the pitch sits in the middle
    const pa = ease(clamp((p - 0.5) / 0.06));
    if (pa > 0) {
      const pr = (narrow() ? 20 : 28) * (1 + 0.06 * Math.sin(t * 0.004) * (s4 ? 1 : 0.3));
      const g = wctx.createRadialGradient(L.pitch.x, L.pitch.y, 0, L.pitch.x, L.pitch.y, pr * 3);
      g.addColorStop(0, `rgba(255,157,0,${0.35 * pa + 0.3 * s4})`); g.addColorStop(1, "rgba(255,157,0,0)");
      wctx.fillStyle = g; wctx.beginPath(); wctx.arc(L.pitch.x, L.pitch.y, pr * 3, 0, 6.283); wctx.fill();
      wctx.fillStyle = `rgba(255,157,0,${pa})`; wctx.beginPath(); wctx.arc(L.pitch.x, L.pitch.y, pr, 0, 6.283); wctx.fill();
      label("PITCH", L.pitch.x, L.pitch.y, narrow() ? 9 : 11, `rgba(1,0,1,${pa})`, "center", 700);
    }

    // the debate: an objection travels in, an answer travels back
    let raised = 0, answered = 0;
    DEBATE.forEach((d, i) => {
      const w0 = i / 3, w1 = (i + 1) / 3;
      const local = clamp((s3 - w0) / (w1 - w0));
      if (s3 >= w0 + 0.02) raised++;
      if (s3 >= w0 + (w1 - w0) * 0.55) answered++;
      if (local <= 0 || local >= 1 || s4 > 0) return;
      const g = L.ag[d.from];
      const going = local < 0.5;
      const k = ease(going ? local / 0.5 : (local - 0.5) / 0.5);
      const ax = going ? g.x : L.pitch.x, ay = going ? g.y : L.pitch.y;
      const bx = going ? L.pitch.x : g.x, by = going ? L.pitch.y : g.y;
      const x = ax + (bx - ax) * k, y = ay + (by - ay) * k;
      wctx.fillStyle = going ? "#e34608" : "#ff9d00";
      wctx.shadowColor = wctx.fillStyle; wctx.shadowBlur = 16;
      wctx.beginPath(); wctx.arc(x, y, 5, 0, 6.283); wctx.fill();
      wctx.shadowBlur = 0;
      const mx = (g.x + L.pitch.x) / 2, my = (g.y + L.pitch.y) / 2;
      pill(going ? d.ask : d.reply, mx, my - (narrow() ? 0 : 24), going ? "#eeeadc" : "#010001", going ? "rgba(227,70,8,.92)" : "rgba(255,157,0,.95)");
    });
    if (s4 > 0) pill("Pitch survived", L.pitch.x, L.pitch.y + (narrow() ? 44 : 64), "#010001", `rgba(255,157,0,${s4})`);
    raisedEl.textContent = raised; answeredEl.textContent = answered;
  }
  function setStages(p) {
    stageEls.forEach((el) => el.classList.toggle("on", p >= parseFloat(el.dataset.from) && p < parseFloat(el.dataset.to)));
  }

  sizeField(); sizeWeb();
  window.addEventListener("resize", () => { sizeField(); sizeWeb(); });

  // ---------------------------------------------------------- frame loop
  function progressOf(el, H) {
    const r = el.getBoundingClientRect();
    const span = r.height - H;
    return span <= 0 ? 0 : clamp(-r.top / span);
  }
  function frame(t) {
    if (lenis) lenis.raf(t);
    const H = window.innerHeight, W = window.innerWidth, sy = window.scrollY;
    if (!reduce) {
      for (const el of speedEls) {
        const host = el.closest("section") || el;
        const r = host.getBoundingClientRect();
        if (r.bottom < -200 || r.top > H + 200) continue;
        const off = (r.top + r.height / 2 - H / 2) * parseFloat(el.dataset.speed);
        el.style.transform = `translate3d(0,${(-off).toFixed(1)}px,0)`;
      }
      const hr = hero.getBoundingClientRect();
      const hp = clamp(-hr.top / Math.max(1, hr.height));
      for (const el of driftEls) el.style.transform = `translate3d(${(hp * parseFloat(el.dataset.drift) * W).toFixed(1)}px,${(hp * -60).toFixed(1)}px,0)`;
      // headings drift sideways as they pass through the screen
      for (const el of xdriftEls) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -100 || r.top > H + 100) continue;
        const local = clamp((H - r.top) / (H + r.height));
        el.style.transform = `translate3d(${((0.5 - local) * parseFloat(el.dataset.xdrift) * Math.min(W, 1400) * 0.9).toFixed(1)}px,0,0)`;
      }
      // list rows slide in from the right as they rise
      slideEls.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const k = clamp((H * 0.95 - r.top) / (H * 0.4));
        el.style.transform = `translate3d(${((1 - ease(k)) * (90 + i * 40)).toFixed(1)}px,0,0)`;
        el.style.opacity = (0.15 + 0.85 * k).toFixed(3);
      });
    }
    // the will-not lines get struck through as they reach the middle
    for (const el of strikes) {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--s", reduce ? 1 : ease(clamp((H * 0.72 - r.top) / (H * 0.25))).toFixed(3));
    }
    // dot field follows whichever section is on screen
    const tg = fieldTarget(H);
    const k = reduce ? 1 : 0.06;
    for (const key of ["d", "h", "x", "y", "w"]) cur[key] = lerp(cur[key], tg[key], k);
    drawField(t, sy);
    // account file
    let best = -1, bestD = Infinity;
    steps.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - H * 0.5);
      if (r.top < H * 0.75 && d < bestD) { bestD = d; best = i; }
    });
    setStep(best);
    // web of agents
    const rr = reh.getBoundingClientRect();
    if (rr.bottom > 0 && rr.top < H) {
      const p = reduce ? 1 : progressOf(reh, H);
      setStages(p); drawWeb(t, p);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------------------------------------------------------- glass menu
  const menu = document.getElementById("menu"), menuBtn = document.getElementById("menu-btn"), veil = document.getElementById("menu-veil");
  const menuOpen = () => document.body.classList.contains("menu-open");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", open); menu.setAttribute("aria-hidden", !open);
    if (lenis) open ? lenis.stop() : lenis.start();
    if (open) setTimeout(() => { const f = menu.querySelector("a,button"); if (f) f.focus({ preventScroll: true }); }, 250);
  }
  menuBtn.addEventListener("click", () => setMenu(!menuOpen()));
  veil.addEventListener("click", () => setMenu(false));
  menu.querySelectorAll("[data-menu-link]").forEach((el) => el.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && menuOpen()) { setMenu(false); menuBtn.focus(); } });

  // one faq answer open at a time
  const qas = $$(".qa");
  qas.forEach((d) => d.addEventListener("toggle", () => { if (d.open) qas.forEach((o) => { if (o !== d) o.open = false; }); }));

  // ---------------------------------------------------------- get in touch
  const talk = document.getElementById("talk-overlay");
  const talkForm = document.getElementById("talk-form");
  const talkDone = document.getElementById("talk-done");
  const talkErr = document.getElementById("talk-err");
  const talkSend = document.getElementById("talk-send");
  let talkOpener = null;
  function openTalk(from) {
    talkOpener = from;
    talk.classList.add("open"); talk.setAttribute("aria-hidden", "false");
    if (lenis) lenis.stop();
    setTimeout(() => document.getElementById("talk-email").focus({ preventScroll: true }), 250);
  }
  function closeTalk() {
    if (!talk.classList.contains("open")) return;
    talk.classList.remove("open"); talk.setAttribute("aria-hidden", "true");
    if (lenis) lenis.start();
    if (talkOpener) talkOpener.focus({ preventScroll: true });
  }
  document.querySelectorAll("#talk-open, [data-talk-open]").forEach((b) => b.addEventListener("click", () => openTalk(b)));
  talk.querySelectorAll("[data-talk-close]").forEach((el) => el.addEventListener("click", closeTalk));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeTalk(); });
  talkForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    talkErr.textContent = "";
    const email = talkForm.email.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { talkErr.textContent = "That email doesn't look right."; talkForm.email.focus(); return; }
    if (talkForm.botcheck.checked) return;
    talkSend.disabled = true; talkSend.textContent = "Sending";
    const data = Object.fromEntries(new FormData(talkForm));
    delete data.botcheck;
    data.sent_at = new Date().toString();
    data.page = location.href;
    try {
      const r = await fetch("https://api.web3forms.com/submit", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(data)
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok || out.success === false) throw new Error(out.message || "failed");
      talkForm.hidden = true; talkDone.hidden = false;
      setTimeout(closeTalk, 2600);
    } catch (err) {
      talkErr.textContent = "Couldn't send just now. Please try again in a minute.";
    } finally {
      talkSend.disabled = false; talkSend.textContent = "Send";
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    e.preventDefault();
    const tgt = id === "#top" ? null : document.querySelector(id);
    if (lenis) lenis.scrollTo(tgt || 0, { offset: tgt ? -80 : 0 }); else if (tgt) tgt.scrollIntoView({ behavior: "smooth" }); else window.scrollTo({ top: 0, behavior: "smooth" });
  }));
})();
