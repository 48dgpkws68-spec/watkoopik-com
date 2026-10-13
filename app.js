/* watkoopik pro · beweging (GSAP + ScrollTrigger + Lenis) en interactie */
(function () {
  var root = window.ROOT || "";
  var html = document.documentElement;
  html.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touch = window.matchMedia("(hover: none)").matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var small = touch || window.innerWidth < 760;
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Lenis: soepel scrollen (alleen met muis, niet op touch) ---------- */
  var lenis = null;
  if (window.Lenis && !reduce && !touch) {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href"); if (id.length < 2) return;
        var el = document.querySelector(id); if (!el) return;
        e.preventDefault(); lenis.scrollTo(el, { offset: -80 });
      });
    });
  }

  /* ---------- nav, menu, voortgangsbalk ---------- */
  var nav = document.querySelector(".nav");
  var prog = document.querySelector(".progress");
  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle("scrolled", y > 8);
    if (prog) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.transform = "scaleX(" + (h > 0 ? Math.min(1, y / h) : 0) + ")";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  var burger = document.querySelector(".burger");
  if (burger) burger.addEventListener("click", function () {
    var open = document.body.classList.toggle("menu-open");
    burger.setAttribute("aria-expanded", open);
    if (lenis) open ? lenis.stop() : lenis.start();
  });

  /* ---------- zoeken met suggesties en productfoto's ---------- */
  var idx = null;
  function load(cb) { if (idx) return cb(idx); fetch(root + "search.json").then(function (r) { return r.json(); }).then(function (j) { idx = j; cb(j); }).catch(function () {}); }
  function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  document.querySelectorAll("[data-search]").forEach(function (form) {
    var inp = form.querySelector("input"); var box = form.parentNode.querySelector(".results"); var sel = -1;
    function render(q) {
      load(function (list) {
        var words = norm(q).split(/\s+/).filter(Boolean);
        var hits = list.map(function (it) {
          var hay = norm(it.t + " " + it.k), s = 0;
          words.forEach(function (w) { if (hay.indexOf(w) > -1) s += (norm(it.t).indexOf(w) > -1 ? 3 : 1); else s -= 10; });
          return { it: it, s: s };
        }).filter(function (x) { return x.s > 0; }).sort(function (a, b) { return b.s - a.s; }).slice(0, 7);
        box.innerHTML = hits.length ? hits.map(function (h) {
          return '<a href="' + root + h.it.u + '">' + (h.it.i ? '<img src="' + h.it.i + '" alt="">' : "") + '<span>' + h.it.t + '<small>' + h.it.c + ' · winnaar: ' + h.it.w + '</small></span></a>';
        }).join("") : '<a href="' + root + 'gidsen.html">Geen directe match. Bekijk alle gidsen</a>';
        box.classList.add("show"); sel = -1;
      });
    }
    inp.addEventListener("input", function () { var q = inp.value.trim(); if (q.length < 2) { box.classList.remove("show"); return; } render(q); });
    inp.addEventListener("keydown", function (e) {
      var items = box.querySelectorAll("a"); if (!items.length) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length; items.forEach(function (a, i) { a.classList.toggle("hl", i === sel); }); }
    });
    form.addEventListener("submit", function (e) { e.preventDefault(); var a = box.querySelector("a.hl") || box.querySelector("a"); if (a) location.href = a.href; else if (inp.value.trim().length > 1) render(inp.value.trim()); });
    document.addEventListener("click", function (e) { if (!form.parentNode.contains(e.target)) box.classList.remove("show"); });
  });

  /* ---------- spotlight-hover op kaarten ---------- */
  if (!touch) document.querySelectorAll(".spot").forEach(function (el) {
    el.addEventListener("pointermove", function (e) { var r = el.getBoundingClientRect(); el.style.setProperty("--mx", (e.clientX - r.left) + "px"); el.style.setProperty("--my", (e.clientY - r.top) + "px"); });
  });

  /* ---------- magnetische knoppen ---------- */
  if (hasGsap && !touch && !reduce) document.querySelectorAll(".magnet").forEach(function (b) {
    b.addEventListener("pointermove", function (e) { var r = b.getBoundingClientRect(); gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .3, ease: "power3.out" }); });
    b.addEventListener("pointerleave", function () { gsap.to(b, { x: 0, y: 0, duration: .6, ease: "elastic.out(1,.4)" }); });
  });

  /* ---------- aurora-achtergrond in de hero ---------- */
  var cv = document.querySelector("canvas.aurora");
  if (cv && !reduce) {
    var ctx = cv.getContext("2d"), w, h, t = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    var blobs = [{ c: [124, 92, 255], x: .2, y: .3, r: .55, s: .00025 }, { c: [255, 122, 61], x: .8, y: .4, r: .45, s: .0003 }, { c: [91, 63, 214], x: .5, y: .9, r: .6, s: .0002 }, { c: [255, 196, 90], x: .7, y: .1, r: .35, s: .00035 }];
    function size() { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr * .5; cv.height = h * dpr * .5; ctx.setTransform(dpr * .5, 0, 0, dpr * .5, 0, 0); }
    size(); window.addEventListener("resize", size);
    var visible = true;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }).observe(cv);
    (function draw() {
      if (visible) {
        t += 16; ctx.clearRect(0, 0, w, h); ctx.globalCompositeOperation = "lighter";
        blobs.forEach(function (b, i) {
          var x = (b.x + Math.sin(t * b.s + i) * .12) * w, y = (b.y + Math.cos(t * b.s * 1.3 + i) * .1) * h, r = b.r * Math.max(w, h);
          var g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, "rgba(" + b.c + ",.42)"); g.addColorStop(1, "rgba(" + b.c + ",0)");
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        });
      }
      requestAnimationFrame(draw);
    })();
  }

  if (!hasGsap || reduce) { document.querySelectorAll(".rv").forEach(function (e) { e.style.opacity = 1; e.style.transform = "none"; }); initQuiz(); initFilters(); initSticky(); initToc(); return; }

  /* ---------- split-text koppen ---------- */
  if (!small) document.querySelectorAll(".split").forEach(function (el) {
    var html2 = el.innerHTML;
    // woorden in spans, html-tags (zoals <span class="grad">) blijven heel
    var out = html2.replace(/(<[^>]+>)|([^<\s]+)/g, function (m, tag, word) { return tag ? tag : '<span class="w"><span>' + word + "</span></span>"; });
    el.innerHTML = out;
    gsap.from(el.querySelectorAll(".w>span"), { yPercent: 110, duration: .9, ease: "power4.out", stagger: .05, delay: .1 });
  });

  /* ---------- reveal bij scrollen ---------- */
  ScrollTrigger.batch(".rv", {
    start: "top 90%",
    onEnter: function (els) { gsap.to(els, { opacity: 1, y: 0, duration: .8, ease: "power3.out", stagger: .07, overwrite: true }); }
  });

  /* ---------- tellers ---------- */
  if (!small) document.querySelectorAll("[data-count]").forEach(function (el) {
    var end = +el.getAttribute("data-count"), o = { v: 0 };
    ScrollTrigger.create({ trigger: el, start: "top 92%", once: true, onEnter: function () {
      gsap.to(o, { v: end, duration: 1.6, ease: "power2.out", onUpdate: function () { el.textContent = Math.round(o.v).toLocaleString("nl-NL"); } });
    } });
  });

  /* ---------- scorebalken ---------- */
  document.querySelectorAll(".bar em").forEach(function (b) {
    gsap.from(b, { scaleX: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: b, start: "top 92%" } });
  });

  /* ---------- gepinde horizontale scroll (desktop) ---------- */
  var mm = gsap.matchMedia();
  mm.add("(min-width: 981px)", function () {
    var sec = document.querySelector(".hs-desktop"), track = sec && sec.querySelector(".hs-track");
    if (!track) return;
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 36); };
    gsap.to(track, { x: function () { return -dist(); }, ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: .6, invalidateOnRefresh: true } });
  });

  /* ---------- hero parallax ---------- */
  var hb = document.querySelector(".hero-in");
  if (hb && !small) gsap.to(hb, { yPercent: 18, opacity: .3, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  initQuiz(); initFilters(); initSticky(); initToc();

  /* ---------- helpers ---------- */
  function initSticky() {
    var s = document.querySelector(".sticky-buy"), pd = document.querySelector(".podium");
    if (!s || !pd) return; document.body.classList.add("has-sticky");
    function chk() { s.classList.toggle("on", pd.getBoundingClientRect().bottom < 0); }
    window.addEventListener("scroll", chk, { passive: true }); chk();
  }
  function initToc() {
    var toc = document.querySelector(".toc"); if (!toc) return;
    if (window.innerWidth > 980) toc.open = true;
    var links = toc.querySelectorAll("a[href^='#']");
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) links.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + x.target.id); }); });
    }, { rootMargin: "-40% 0px -55% 0px" });
    links.forEach(function (a) { var t = document.querySelector(a.getAttribute("href")); if (t) io.observe(t); });
  }
  function initFilters() {
    var bar = document.querySelector(".filters"); if (!bar) return;
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      bar.querySelectorAll("button").forEach(function (x) { x.classList.toggle("on", x === b); });
      var c = b.getAttribute("data-cat");
      document.querySelectorAll("[data-cat-item]").forEach(function (el) { el.style.display = (c === "alle" || el.getAttribute("data-cat-item") === c) ? "" : "none"; });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }
  function initQuiz() {
    var q = document.querySelector(".quiz"); if (!q || !window.QUIZ) return;
    var data = window.QUIZ, state = {}, steps = q.querySelectorAll(".q-step"), bar = q.querySelector(".q-prog i");
    function show(i) { steps.forEach(function (s, j) { s.classList.toggle("on", j === i); }); bar.style.width = (i / (steps.length - 1) * 100) + "%"; }
    q.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-k]");
      if (b) {
        state[b.getAttribute("data-k")] = b.getAttribute("data-v");
        if (b.getAttribute("data-k") === "gids") {
          var g = data[state.gids], opts = q.querySelector("#q-budget");
          opts.innerHTML = g.budgets.map(function (x) { return '<button data-k="budget" data-v="' + x.max + '"><b>' + x.label + '</b><small>' + x.hint + '</small></button>'; }).join("");
        }
        var next = +b.closest(".q-step").getAttribute("data-i") + 1;
        if (next === steps.length - 1) result();
        show(next); return;
      }
      if (e.target.closest(".q-back")) { var cur = +q.querySelector(".q-step.on").getAttribute("data-i"); show(Math.max(0, cur - 1)); }
    });
    function result() {
      var g = data[state.gids], max = +state.budget, prio = state.prio;
      var pool = g.products.filter(function (p) { return p.price <= max; });
      if (!pool.length) pool = g.products.slice().sort(function (a, b) { return a.price - b.price; }).slice(0, 1);
      pool.sort(function (a, b) {
        if (prio === "prijs") return (b.score / b.price) - (a.score / a.price);
        if (prio === "premium") return b.price - a.price || b.score - a.score;
        return b.score - a.score;
      });
      var p = pool[0], alt = pool[1];
      q.querySelector(".q-out").innerHTML =
        '<div class="q-res">' + (p.image ? '<img src="' + p.image + '" alt="">' : "") + '<div><span class="kick">Jouw beste keuze</span><h3 style="font-size:1.4rem">' + p.name + '</h3><p class="muted">' + p.oneliner + '</p><p><b style="font-family:Sora;font-size:1.3rem">€ ' + p.priceTxt + '</b> · score ' + p.score + '/10</p>' +
        '<a class="btn btn-buy" href="' + p.link + '" rel="sponsored nofollow noopener" target="_blank" data-umami-event="bol-klik" data-umami-event-gids="keuzehulp-' + state.gids + '" data-umami-event-product="' + p.name + '">Bekijk bij bol <span class="arr">→</span></a> ' +
        '<a class="btn btn-light" href="' + root + g.url + '">Hele top 10</a>' + (alt ? '<p class="muted" style="margin-top:12px;font-size:.9rem">Ook goed: <b>' + alt.name + '</b> voor € ' + alt.priceTxt + '</p>' : "") + "</div></div>";
    }
    show(0);
  }
})();
