/* The lab journey: where the student is and how far they have come.
 *
 * Every numbered section of the lab has up to four steps:
 *   Read  - scrolled through the section's explanation
 *   Watch - stepped every animation in the section to its end
 *   Play  - solved the section's puzzle
 *   Do    - passed Check my output for the section's DIY
 * A map of the sections sits at the top of the guide: each station's ring fills and turns
 * from red through amber to green as its steps are done (untouched sections stay a calm
 * grey). Each section also gets a row of step chips, the sidebar gets rings, a thin bar at
 * the top shows the whole lab, and there are celebrations and a few badges.
 *
 * It listens for what the rest of the page announces:
 *   lab:check {diy, status, message}  guide.js, after Check my output
 *   lab:anim  {id, done}              stepper.js, an animation stepped to its end
 *   lab:play  {id, done, section}     play.js, a puzzle solved
 * and announces lab:journey {state} after every change (the SCORM bridge saves it in the
 * LMS). State is kept in localStorage; without storage everything still works for the visit.
 */
(function () {
  "use strict";

  var lab = document.body.getAttribute("data-lab");
  var main = document.querySelector("main.wrap") || document.querySelector("div.wrap");
  if (!lab || !main) return;

  var KEY = "lab:" + lab + ":journey";
  var motion = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var meta = {};
  try { meta = JSON.parse((document.getElementById("lab-meta") || {}).textContent || "{}"); } catch (e) { meta = {}; }
  var labels = meta.labels || {};
  var SVG = "http://www.w3.org/2000/svg";

  // ---- state ---------------------------------------------------------------------
  var state;
  try { state = JSON.parse(window.localStorage.getItem(KEY)) || {}; } catch (e) { state = {}; }
  ["read", "watched", "played", "passed", "tries", "oob", "badges"].forEach(function (k) {
    if (!state[k] || typeof state[k] !== "object") state[k] = {};
  });
  try {   // passes guide.js recorded before the journey existed
    var older = JSON.parse(window.localStorage.getItem("lab:" + lab + ":status") || "{}");
    Object.keys(older).forEach(function (d) { if (older[d] === "pass") state.passed[d] = true; });
  } catch (e) { /* no storage */ }

  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* no storage */ }
    document.dispatchEvent(new CustomEvent("lab:journey", { detail: { state: state } }));
  }

  // ---- the sections, read from the page -----------------------------------------------
  var sections = [];
  var current = null;
  Array.prototype.forEach.call(main.children, function (node) {
    if (node.tagName === "H2") {
      var m = node.textContent.match(/^\s*(\d+)\.\s*(.+?)\s*$/);
      current = m ? { n: m[1], title: m[2], heading: node, anims: [], plays: [], diys: [],
                      sentinel: null, diyHeading: null } : null;
      if (current) sections.push(current);
      return;
    }
    if (!current) return;
    var isAnim = node.classList && node.classList.contains("lab-anim");
    var isPlay = node.classList && node.classList.contains("lab-play");
    var isDiy = node.tagName === "H3" && /^diy-/.test(node.id || "");
    if (isAnim) current.anims.push(node.getAttribute("data-anim"));
    if (isPlay) current.plays.push(node.getAttribute("data-play"));
    if (isDiy && !current.diyHeading) current.diyHeading = node;
    if (node.classList && node.classList.contains("lab-check")) current.diys.push(node.getAttribute("data-diy"));
    if (!current.sentinel && (isAnim || isPlay || isDiy)) current.sentinel = node;
  });
  if (!sections.length) return;
  document.body.classList.add("journey-on");

  function steps(sec) {
    var list = [{ key: "read", label: "Read", done: !!state.read[sec.n] }];
    if (sec.anims.length) list.push({ key: "watch", label: "Watch",
      done: sec.anims.every(function (id) { return state.watched[id]; }) });
    if (sec.plays.length) list.push({ key: "play", label: "Play",
      done: sec.plays.every(function (id) { return state.played[id]; }) });
    if (sec.diys.length) list.push({ key: "do", label: "Do",
      done: sec.diys.every(function (d) { return state.passed[d]; }) });
    return list;
  }
  function fraction(sec) {
    var list = steps(sec);
    return list.filter(function (s) { return s.done; }).length / list.length;
  }
  function overall() {
    var sum = 0;
    sections.forEach(function (s) { sum += fraction(s); });
    return sum / sections.length;
  }
  function completeCount() {
    return sections.filter(function (s) { return fraction(s) >= 1; }).length;
  }

  // red (just started) -> amber (half way) -> green (done); null when not started
  var STOPS = [[0, [217, 58, 72]], [0.5, [232, 163, 23]], [1, [46, 125, 79]]];
  function tone(f) {
    if (f <= 0) return null;
    for (var i = 1; i < STOPS.length; i++) {
      if (f <= STOPS[i][0]) {
        var a = STOPS[i - 1], b = STOPS[i], t = (f - a[0]) / (b[0] - a[0]);
        var c = a[1].map(function (v, k) { return Math.round(v + (b[1][k] - v) * t); });
        return "rgb(" + c.join(",") + ")";
      }
    }
    return "rgb(46,125,79)";
  }

  // ---- small helpers ---------------------------------------------------------------
  function el(tag, className, text) {
    var n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function svg(tag, attrs) {
    var n = document.createElementNS(SVG, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  var ICONS = {   // 24x24 line icons
    read: "M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5A1.5 1.5 0 0 1 4 17.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5-.7 1.5-1.5z",
    watch: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
    play: "M9 3h6v3.5a2 2 0 1 0 0 4V14h-3.5a2 2 0 1 1-4 0H4V9.5a2 2 0 1 0 0-4V3zM15 14h3.5a2 2 0 1 1 0 4H15v3H4v-4",
    do: "M8.5 7 3.5 12l5 5M15.5 7l5 5-5 5M13.5 4.5l-3 15",
    check: "M5 12.5 10 17 19 7.5",
    star: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"
  };
  function icon(name, cls) {
    var s = svg("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", "class": cls || "j-icon" });
    s.appendChild(svg("path", { d: ICONS[name] }));
    return s;
  }
  function scrollToNode(node) {
    if (!node) return;
    node.scrollIntoView({ behavior: motion ? "smooth" : "auto", block: "start" });
  }

  // ---- celebrations --------------------------------------------------------------------
  var COLOURS = ["#0E7C86", "#7B4FBF", "#C2366E", "#E2A200", "#2E7D4F", "#E76F00", "#33698C"];
  function confetti(x, y, count) {
    if (!motion) return;
    var canvas = el("canvas", "j-confetti");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    var ctx = canvas.getContext("2d");
    var bits = [];
    for (var i = 0; i < (count || 70); i++) {
      var angle = Math.random() * Math.PI * 2, speed = 3 + Math.random() * 6;
      bits.push({ x: x, y: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 4,
                  w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, r: Math.random() * 6,
                  vr: (Math.random() - 0.5) * 0.4, c: COLOURS[i % COLOURS.length] });
    }
    var start = null;
    function frame(t) {
      if (start === null) start = t;
      var age = (t - start) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      bits.forEach(function (b) {
        b.vy += 0.25; b.vx *= 0.99; b.x += b.vx; b.y += b.vy; b.r += b.vr;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - age / 1.6);
        ctx.translate(b.x, b.y);
        ctx.rotate(b.r);
        ctx.fillStyle = b.c;
        ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        ctx.restore();
      });
      if (age < 1.6) window.requestAnimationFrame(frame); else canvas.remove();
    }
    window.requestAnimationFrame(frame);
  }
  function burstFrom(node, count) {
    if (!node) return confetti(window.innerWidth / 2, window.innerHeight / 3, count);
    var r = node.getBoundingClientRect();
    confetti(r.left + r.width / 2, r.top + r.height / 2, count);
  }

  var toasts = el("div", "j-toasts");
  toasts.setAttribute("aria-live", "polite");
  document.body.appendChild(toasts);
  function toast(title, text, kind) {
    var t = el("div", "j-toast " + (kind || ""));
    t.appendChild(icon(kind === "badge" ? "star" : "check", "j-toast-icon"));
    var body = el("div");
    body.appendChild(el("strong", "", title));
    if (text) body.appendChild(el("span", "", text));
    t.appendChild(body);
    toasts.appendChild(t);
    window.setTimeout(function () { t.classList.add("j-leaving"); }, 4200);
    window.setTimeout(function () { t.remove(); }, 4800);
  }

  // ---- badges --------------------------------------------------------------------------
  // Only the steps and badges this page can offer: the public lab pages have no
  // Check my output, so no Do step and no check badges there.
  var has = { diys: false, anims: false, plays: false };
  sections.forEach(function (s) {
    has.diys = has.diys || s.diys.length > 0;
    has.anims = has.anims || s.anims.length > 0;
    has.plays = has.plays || s.plays.length > 0;
  });
  var BADGES = [
    { id: "first-green", name: "First green", how: "Pass your first Check my output.", needs: "diys" },
    { id: "first-try", name: "Nailed it", how: "Pass a DIY on your first check.", needs: "diys" },
    { id: "oob-survivor", name: "Off-by-one survivor",
      how: "Hit an index out of bounds exception, then fix it.", needs: "diys" },
    { id: "film-buff", name: "Film buff", how: "Watch every animation to the end.", needs: "anims" },
    { id: "puzzle-master", name: "Puzzle master", how: "Solve every puzzle.", needs: "plays" },
    { id: "on-a-roll", name: "On a roll", how: "Complete three sections." },
    { id: "lab-master", name: meta.masterBadge || "Lab master", how: "Complete the whole lab." }
  ].filter(function (b) { return !b.needs || has[b.needs]; });
  function allIds(key) {
    var ids = [];
    sections.forEach(function (s) { ids = ids.concat(s[key]); });
    return ids;
  }
  function earn(id, quiet) {
    if (state.badges[id]) return false;
    state.badges[id] = Date.now();
    var badge = BADGES.filter(function (b) { return b.id === id; })[0];
    if (badge && !quiet) toast("Badge: " + badge.name, badge.how, "badge");
    return true;
  }
  function checkBadges(quiet) {
    if (Object.keys(state.passed).length) earn("first-green", quiet);
    var anims = allIds("anims"), plays = allIds("plays");
    if (anims.length && anims.every(function (id) { return state.watched[id]; })) earn("film-buff", quiet);
    if (plays.length && plays.every(function (id) { return state.played[id]; })) earn("puzzle-master", quiet);
    if (completeCount() >= 3) earn("on-a-roll", quiet);
    if (completeCount() === sections.length) earn("lab-master", quiet);
  }

  // ---- the map at the top -------------------------------------------------------------
  var card = el("section", "journey");
  card.setAttribute("aria-label", "Your journey through this lab");
  var head = el("div", "journey-head");
  var headText = el("div");
  headText.appendChild(el("p", "journey-title", "Your journey"));
  var summary = el("p", "journey-summary");
  headText.appendChild(summary);
  var cont = el("button", "journey-continue", "Continue where you left off");
  cont.type = "button";
  head.appendChild(headText);
  head.appendChild(cont);
  var map = el("div", "journey-map");
  var trail = svg("svg", { "class": "journey-trail", "aria-hidden": "true" });
  var stations = el("ol", "journey-stations");
  map.appendChild(trail);
  map.appendChild(stations);
  var legend = el("p", "journey-legend");
  ["read", "watch", "play", "do"].filter(function (k) {
    return k === "read" || (k === "watch" && has.anims) || (k === "play" && has.plays) || (k === "do" && has.diys);
  }).forEach(function (k) {
    var item = el("span", "journey-legend-item");
    item.appendChild(icon(k));
    item.appendChild(document.createTextNode(k.charAt(0).toUpperCase() + k.slice(1)));
    legend.appendChild(item);
  });
  var badgeRow = el("div", "journey-badges");
  card.appendChild(head);
  card.appendChild(map);
  card.appendChild(legend);
  card.appendChild(badgeRow);
  var h1 = main.querySelector("h1");
  main.insertBefore(card, h1 ? h1.nextSibling : main.firstChild);

  var CIRC = 2 * Math.PI * 21;
  sections.forEach(function (sec) {
    var li = el("li", "journey-station");
    var btn = el("button", "station");
    btn.type = "button";
    var ring = svg("svg", { viewBox: "0 0 52 52", "class": "station-ring", "aria-hidden": "true" });
    ring.appendChild(svg("circle", { cx: 26, cy: 26, r: 21, "class": "station-track" }));
    var arc = svg("circle", { cx: 26, cy: 26, r: 21, "class": "station-arc",
                             "stroke-dasharray": "0 " + CIRC, transform: "rotate(-90 26 26)" });
    ring.appendChild(arc);
    btn.appendChild(ring);
    btn.appendChild(el("span", "station-num", sec.n));
    var done = icon("check", "station-check");
    btn.appendChild(done);
    var tip = el("span", "station-tip");
    btn.appendChild(tip);
    li.appendChild(btn);
    li.appendChild(el("span", "station-label", labels[sec.n] || sec.title));
    stations.appendChild(li);
    btn.addEventListener("click", function () { scrollToNode(sec.heading); });
    sec.station = { li: li, btn: btn, arc: arc, tip: tip };

    // the chips under the section heading
    var chips = el("div", "journey-steps");
    chips.setAttribute("role", "list");
    chips.setAttribute("aria-label", "Section " + sec.n + " steps");
    sec.chips = {};
    steps(sec).forEach(function (step) {
      var chip = el("button", "journey-chip chip-" + step.key);
      chip.type = "button";
      chip.setAttribute("role", "listitem");
      chip.appendChild(icon(step.key));
      chip.appendChild(el("span", "", step.label));
      chip.appendChild(icon("check", "chip-check"));
      chip.addEventListener("click", function () { scrollToNode(target(sec, step.key)); });
      chips.appendChild(chip);
      sec.chips[step.key] = chip;
    });
    sec.heading.parentNode.insertBefore(chips, sec.heading.nextSibling);
  });

  BADGES.forEach(function (b) {
    var badge = el("span", "journey-badge");
    badge.setAttribute("data-badge", b.id);
    badge.appendChild(icon("star"));
    badge.appendChild(el("span", "", b.name));
    badge.title = b.how;
    badgeRow.appendChild(badge);
  });

  function target(sec, key) {
    if (key === "read") return sec.heading;
    if (key === "watch") {
      var id = sec.anims.filter(function (a) { return !state.watched[a]; })[0] || sec.anims[0];
      return main.querySelector('.lab-anim[data-anim="' + id + '"]');
    }
    if (key === "play") return main.querySelector('.lab-play[data-play="' + sec.plays[0] + '"]');
    return sec.diyHeading;
  }

  // the trail behind the stations: solid and coloured where sections are complete
  function drawTrail() {
    while (trail.firstChild) trail.removeChild(trail.firstChild);
    var box = map.getBoundingClientRect();
    trail.setAttribute("width", box.width);
    trail.setAttribute("height", box.height);
    var points = sections.map(function (s) {
      var r = s.station.btn.getBoundingClientRect();
      return [r.left - box.left + r.width / 2, r.top - box.top + r.height / 2];
    });
    for (var i = 0; i + 1 < points.length; i++) {
      var a = points[i], b = points[i + 1];
      if (Math.abs(a[1] - b[1]) > 30) continue;          // no line across a wrapped row
      var mid = (a[0] + b[0]) / 2, lift = i % 2 ? 9 : -9;
      var path = svg("path", { d: "M" + a[0] + "," + a[1] + " Q" + mid + "," + (a[1] + lift) + " " + b[0] + "," + b[1],
                               "class": "trail-seg" + (fraction(sections[i]) >= 1 ? " trail-done" : "") });
      trail.appendChild(path);
    }
  }

  // the thin bar at the very top
  var bar = el("div", "journey-bar");
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-label", "Progress through the lab");
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", "100");
  var barFill = el("div", "journey-bar-fill");
  bar.appendChild(barFill);
  document.body.appendChild(bar);

  // rings in the sidebar (DIY k is section k's DIY)
  sections.forEach(function (sec) {
    sec.diys.forEach(function (d) {
      var dot = document.querySelector('[data-diy-dot="' + d + '"]');
      if (!dot) return;
      var ring = el("span", "side-ring");
      ring.setAttribute("aria-hidden", "true");
      dot.parentNode.insertBefore(ring, dot);
      sec.sideRing = ring;
    });
  });

  // ---- drawing the state ---------------------------------------------------------------
  var shownComplete = {};
  function render(celebrate) {
    sections.forEach(function (sec) {
      var f = fraction(sec), list = steps(sec), colour = tone(f);
      var doneCount = list.filter(function (s) { return s.done; }).length;
      var st = sec.station;
      st.arc.setAttribute("stroke-dasharray", (f * CIRC) + " " + CIRC);
      st.btn.style.setProperty("--tone", colour || "var(--rule)");
      st.li.setAttribute("data-state", f >= 1 ? "done" : f > 0 ? "started" : "new");
      st.btn.setAttribute("aria-label", "Section " + sec.n + ", " + sec.title + ": " + doneCount +
        " of " + list.length + " steps done. Go to section.");
      st.tip.textContent = "";
      st.tip.appendChild(el("strong", "", sec.n + ". " + sec.title));
      list.forEach(function (s) {
        st.tip.appendChild(el("span", s.done ? "tip-done" : "", (s.done ? "✓ " : "○ ") + s.label));
      });
      list.forEach(function (s) {
        var chip = sec.chips[s.key];
        if (!chip) return;
        var was = chip.getAttribute("data-done") === "yes";
        chip.setAttribute("data-done", s.done ? "yes" : "no");
        chip.setAttribute("aria-label", s.label + (s.done ? ": done" : ": not done yet"));
        chip.style.setProperty("--tone", colour || "var(--rule)");
        if (s.done && !was && celebrate && motion) {
          chip.classList.remove("chip-pop");
          void chip.offsetWidth;
          chip.classList.add("chip-pop");
        }
      });
      if (sec.sideRing) {
        sec.sideRing.style.setProperty("--f", f);
        sec.sideRing.style.setProperty("--tone", colour || "var(--rule)");
        sec.sideRing.setAttribute("data-state", f >= 1 ? "done" : f > 0 ? "started" : "new");
      }
      if (f >= 1 && !shownComplete[sec.n]) {
        shownComplete[sec.n] = true;
        if (celebrate) {
          toast("Section " + sec.n + " complete", sec.title);
          burstFrom(st.btn, 50);
          if (motion) { st.li.classList.remove("station-pop"); void st.li.offsetWidth; st.li.classList.add("station-pop"); }
        }
      }
    });
    var all = overall(), pct = Math.round(all * 100), done = completeCount();
    summary.textContent = done + " of " + sections.length + " sections complete · " + pct + "%";
    barFill.style.width = pct + "%";
    barFill.style.background = tone(all) || "var(--rule)";
    bar.setAttribute("aria-valuenow", String(pct));
    cont.textContent = done === sections.length ? "Lab complete: see your badges"
      : all > 0 ? "Continue where you left off" : "Start the lab";
    BADGES.forEach(function (b) {
      var node = badgeRow.querySelector('[data-badge="' + b.id + '"]');
      if (node) node.setAttribute("data-earned", state.badges[b.id] ? "yes" : "no");
    });
    drawTrail();
  }

  function nextStep() {
    for (var i = 0; i < sections.length; i++) {
      var list = steps(sections[i]);
      for (var j = 0; j < list.length; j++) {
        if (!list[j].done) return target(sections[i], list[j].key);
      }
    }
    return badgeRow;
  }
  cont.addEventListener("click", function () { scrollToNode(nextStep()); });

  // ---- the finale ------------------------------------------------------------------------
  function finale() {
    if (state.finaleShown) return;
    state.finaleShown = true;
    var dialog = el("div", "j-finale");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-label", "Lab complete");
    var box = el("div", "j-finale-box");
    box.appendChild(icon("star", "j-finale-star"));
    box.appendChild(el("p", "j-finale-title", "You finished the lab!"));
    var anims = allIds("anims"), plays = allIds("plays");
    box.appendChild(el("p", "j-finale-text",
      allIds("diys").length + " DIYs passed, " + plays.length + " puzzles solved, " + anims.length +
      " animations watched, " + Object.keys(state.badges).length + " badges."));
    var ok = el("button", "journey-continue", "Keep exploring");
    ok.type = "button";
    box.appendChild(ok);
    dialog.appendChild(box);
    document.body.appendChild(dialog);
    ok.focus();
    function close() { dialog.remove(); }
    ok.addEventListener("click", close);
    dialog.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    confetti(window.innerWidth / 2, window.innerHeight / 2, 160);
  }

  // ---- listening ---------------------------------------------------------------------
  function changed(celebrateFrom) {
    checkBadges(false);
    save();
    render(true);
    if (celebrateFrom) burstFrom(celebrateFrom);
    if (completeCount() === sections.length) finale();
  }

  document.addEventListener("lab:check", function (e) {
    var d = String(e.detail.diy);
    state.tries[d] = (state.tries[d] || 0) + 1;
    if (/IndexOutOfBoundsException/.test(e.detail.message || "")) state.oob[d] = true;
    var fresh = false;
    if (e.detail.status === "pass" && !state.passed[d]) {
      state.passed[d] = true;
      fresh = true;
      if (state.tries[d] === 1) earn("first-try");
      if (state.oob[d]) earn("oob-survivor");
    }
    changed(fresh ? document.querySelector('.lab-check[data-diy="' + d + '"] .check-btn') : null);
  });
  document.addEventListener("lab:anim", function (e) {
    if (!e.detail || !e.detail.id || state.watched[e.detail.id]) return;
    state.watched[e.detail.id] = true;
    changed(null);
  });
  document.addEventListener("lab:play", function (e) {
    if (!e.detail || !e.detail.id || state.played[e.detail.id]) return;
    state.played[e.detail.id] = true;
    changed(null);
  });

  // Read: the section's heading was seen, and some seconds later the student had scrolled
  // past the explanation to the section's first animation, puzzle or DIY.
  var seenAt = {};
  if ("IntersectionObserver" in window) {
    var watcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var n = entry.target.getAttribute("data-journey-section");
        var role = entry.target.getAttribute("data-journey-role");
        if (role === "heading" && !seenAt[n]) seenAt[n] = Date.now();
        if (role === "sentinel" && seenAt[n] && Date.now() - seenAt[n] > 5000 && !state.read[n]) {
          state.read[n] = true;
          changed(null);
        }
      });
    }, { threshold: 0.1 });
    sections.forEach(function (sec) {
      sec.heading.setAttribute("data-journey-section", sec.n);
      sec.heading.setAttribute("data-journey-role", "heading");
      watcher.observe(sec.heading);
      if (sec.sentinel) {
        sec.sentinel.setAttribute("data-journey-section", sec.n);
        sec.sentinel.setAttribute("data-journey-role", "sentinel");
        watcher.observe(sec.sentinel);
      }
    });
    // a sentinel can stay in view after the 5 s pass: look again now and then
    window.setInterval(function () {
      sections.forEach(function (sec) {
        if (state.read[sec.n] || !seenAt[sec.n] || !sec.sentinel) return;
        var r = sec.sentinel.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0 && Date.now() - seenAt[sec.n] > 5000) {
          state.read[sec.n] = true;
          changed(null);
        }
      });
    }, 2000);
  }

  // "You are here": the station of the section in view glows.
  var raf = 0;
  function whereAmI() {
    raf = 0;
    var here = null;
    sections.forEach(function (sec) {
      if (sec.heading.getBoundingClientRect().top < window.innerHeight * 0.4) here = sec;
    });
    sections.forEach(function (sec) { sec.station.li.classList.toggle("station-here", sec === here); });
  }
  window.addEventListener("scroll", function () { if (!raf) raf = window.requestAnimationFrame(whereAmI); },
                          { passive: true });
  window.addEventListener("resize", function () { drawTrail(); });

  sections.forEach(function (sec) { if (fraction(sec) >= 1) shownComplete[sec.n] = true; });
  checkBadges(true);
  save();
  render(false);
  whereAmI();
  window.setTimeout(drawTrail, 300);     // after fonts and animations settle
})();
