/* Intellible analytics: GA4 events. Cookieless for everyone.
   The gtag loader and Consent Mode defaults (all denied, never updated) sit inline in each page's <head>.
   No form field values, email addresses or other personal details are ever sent to Google. */
(function () {
  "use strict";
  var gtag = window.gtag || function () { (window.dataLayer = window.dataLayer || []).push(arguments); };
  var EMAIL = /[^\s@\/?&=]+@[^\s@\/?&=]+\.[a-z]{2,}/gi;

  function clean(s) { return String(s || "").replace(EMAIL, "[email]"); }
  function textOf(a) {
    var t = a.textContent || a.getAttribute("aria-label") || a.getAttribute("title") || "";
    return clean(t.replace(/[\u2190-\u21FF]/g, "").replace(/\s+/g, " ").trim()).slice(0, 100);
  }
  function locationOf(a) {
    if (a.closest(".nav, nav, .menu, [role='navigation']")) return "nav";
    if (a.closest("footer, .foot")) return "footer";
    if (a.closest(".hero, #hero")) return "hero";
    return "body";
  }

  // ------------------------------------------------------------ link clicks (every <a>)
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var raw = a.getAttribute("href") || "";
    var proto = (a.protocol || "").toLowerCase();
    var url, outbound = false;
    if (proto === "mailto:") url = "mailto";
    else if (proto === "tel:") url = "tel";
    else if (proto === "http:" || proto === "https:") {
      url = clean(a.href).slice(0, 300);
      outbound = a.hostname.replace(/^www\./, "") !== location.hostname.replace(/^www\./, "");
    } else url = clean(raw).slice(0, 100);
    var page = location.pathname, text = textOf(a);
    gtag("event", "link_click", {
      link_url: url, link_text: text, link_page: page,
      link_location: locationOf(a), outbound: outbound, transport_type: "beacon"
    });
    if (/calendly\.com\//i.test(a.href)) {
      gtag("event", "calendly_click", { link_page: page, link_text: text, link_url: a.href, transport_type: "beacon" });
    }
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

  function init() { watchTalk(); watchVideo(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
