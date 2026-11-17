/* Intellible analytics: consent notice and GA4 events.
   The gtag loader and Consent Mode defaults sit inline in each page's <head>.
   No form field values or personal details are ever sent to Google. */
(function () {
  "use strict";
  var KEY = "intellible-consent";
  var gtag = window.gtag || function () { (window.dataLayer = window.dataLayer || []).push(arguments); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function stored() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  // ------------------------------------------------------------ consent notice
  function banner() {
    if (stored()) return;
    var css = document.createElement("style");
    css.textContent =
      '@font-face{font-family:"Inter Tight";src:url(/InterTight-Variable.woff2) format("woff2");font-weight:100 900;font-display:swap}' +
      ".consent{position:fixed;left:50%;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:50;transform:translateX(-50%);width:max-content;max-width:calc(100% - 24px);display:flex;align-items:center;flex-wrap:wrap;justify-content:center;gap:10px 18px;padding:10px 10px 10px 20px;border-radius:999px;background:rgba(22,18,16,.82);border:1px solid rgba(238,234,220,.14);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 10px 40px rgba(0,0,0,.45);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#cdc9b5;font:400 14px/1.4 \"Inter Tight\",\"Helvetica Neue\",Arial,sans-serif;-webkit-font-smoothing:antialiased;animation:consent-in .5s cubic-bezier(.2,.7,.2,1) both}" +
      ".consent p{margin:0}" +
      ".consent-btns{display:flex;gap:8px}" +
      ".consent button{min-height:36px;padding:8px 16px;border-radius:999px;border:1px solid #5e594a;background:transparent;color:#eeeadc;font:500 14px/1 \"Inter Tight\",\"Helvetica Neue\",Arial,sans-serif;cursor:pointer;transition:border-color .25s,color .25s,background .25s}" +
      ".consent button:hover{border-color:#ff9d00;color:#ff9d00}" +
      ".consent button.consent-yes{background:#eeeadc;border-color:#eeeadc;color:#010001}" +
      ".consent button.consent-yes:hover{background:#ff9d00;border-color:#ff9d00;color:#010001}" +
      ".consent button:focus-visible{outline:2px solid #ff9d00;outline-offset:3px}" +
      "@keyframes consent-in{from{opacity:0;transform:translate(-50%,12px)}to{opacity:1;transform:translate(-50%,0)}}" +
      "@media(max-width:520px){.consent{border-radius:16px;padding:12px 14px;bottom:calc(10px + env(safe-area-inset-bottom,0px));text-align:center}}" +
      ".consent.consent-vv{left:var(--consent-x);bottom:calc(var(--consent-b) + 12px);max-width:calc(var(--consent-w) - 24px)}" +
      "html.consent-open.consent-pad body{padding-bottom:calc(var(--consent-h,72px) + 32px)}" +
      "@media(prefers-reduced-motion:reduce){.consent{animation:none}.consent button{transition:none}}";
    document.head.appendChild(css);

    var el = document.createElement("div");
    el.className = "consent";
    el.setAttribute("role", "region");
    el.setAttribute("aria-label", "Cookie notice");
    el.innerHTML = '<p>We use Google Analytics to see how the site is used.</p>' +
      '<div class="consent-btns"><button type="button" class="consent-no">Decline</button>' +
      '<button type="button" class="consent-yes">Accept</button></div>';
    function choose(v) {
      store(v);
      if (v === "granted") gtag("consent", "update", { analytics_storage: "granted" });
      el.remove();
      document.documentElement.classList.remove("consent-open");
      if (vv) { vv.removeEventListener("resize", place); vv.removeEventListener("scroll", place); }
    }
    el.querySelector(".consent-yes").addEventListener("click", function () { choose("granted"); });
    el.querySelector(".consent-no").addEventListener("click", function () { choose("denied"); });
    document.body.appendChild(el);
    // if the phone has zoomed the page out (wide content), keep the notice inside what is on screen
    var vv = window.visualViewport;
    function place() {
      if (!vv) return;
      var zoomed = vv.width < window.innerWidth - 1 || vv.height < window.innerHeight - 1;
      el.classList.toggle("consent-vv", zoomed);
      if (!zoomed) return;
      el.style.setProperty("--consent-x", (vv.offsetLeft + vv.width / 2) + "px");
      el.style.setProperty("--consent-b", Math.max(0, window.innerHeight - vv.offsetTop - vv.height) + "px");
      el.style.setProperty("--consent-w", vv.width + "px");
    }
    if (vv) { place(); vv.addEventListener("resize", place); vv.addEventListener("scroll", place); }
    // on the video pages, keep the speed buttons clear of the notice
    var root = document.documentElement;
    root.classList.add("consent-open");
    if (location.pathname.indexOf("/v/") === 0) {
      root.classList.add("consent-pad");
      root.style.setProperty("--consent-h", el.offsetHeight + "px");
    }
  }

  // ------------------------------------------------------------ calendly clicks
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[href*="calendly.com/"]');
    if (!a) return;
    var text = (a.textContent || "").replace(/[\u2190-\u21FF]/g, "").replace(/\s+/g, " ").trim().slice(0, 100);
    gtag("event", "calendly_click", { link_page: location.pathname, link_text: text, link_url: a.href, transport_type: "beacon" });
  }, true);

  // ------------------------------------------------------------ talk form (successful sends only)
  function watchTalk() {
    var done = document.getElementById("talk-done");
    if (!done || !window.MutationObserver) return;
    var sent = false;
    new MutationObserver(function () {
      if (!done.hidden && !sent) { sent = true; gtag("event", "generate_lead", { form_name: "talk" }); }
      if (done.hidden) sent = false;
    }).observe(done, { attributes: true, attributeFilter: ["hidden"] });
  }

  // ------------------------------------------------------------ video pages
  function watchVideo() {
    if (location.pathname.indexOf("/v/") !== 0) return;
    var v = document.querySelector("video");
    if (!v) return;
    var title = location.pathname.split("/").filter(Boolean)[1] || document.title;
    var started = false, done = {}, ended = false;
    function send(name, extra) {
      var p = { video_title: title, video_url: location.pathname };
      for (var k in extra) p[k] = extra[k];
      gtag("event", name, p);
    }
    v.addEventListener("play", function () { if (!started) { started = true; send("video_start", { video_percent: 0 }); } });
    v.addEventListener("timeupdate", function () {
      if (!v.duration || !isFinite(v.duration)) return;
      var pct = (v.currentTime / v.duration) * 100;
      [25, 50, 75].forEach(function (m) { if (pct >= m && !done[m]) { done[m] = true; send("video_progress", { video_percent: m }); } });
    });
    v.addEventListener("ended", function () { if (!ended) { ended = true; send("video_complete", { video_percent: 100 }); } });
  }

  function init() { banner(); watchTalk(); watchVideo(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
