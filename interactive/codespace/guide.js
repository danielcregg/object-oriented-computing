/* "Check my output" and "Watch my code run" on a lab page, in the student's Codespace.

   server.py serves the module's published lab page and adds this script, which puts a
   Check my output button under each exercise's Expected output. A check compiles and runs
   the student's own code in this Codespace and compares what it prints; a pass turns the
   exercise's dot green and fires "lab:check", which the progress journey listens for.
   Everything the server sends back goes on the page with textContent, never as HTML.

   It runs before the journey (both are deferred, this one first), so the journey finds
   the check slots and shows a Do step for every exercise. */
(function () {
  "use strict";

  var script = document.currentScript;
  var lab = script && script.getAttribute("data-lab");
  var folder = script && script.getAttribute("data-folder");
  if (!lab) return;
  var storeKey = "lab:" + lab + ":status";      // the journey reads this key too

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function loadStatus() {
    try { return JSON.parse(window.localStorage.getItem(storeKey)) || {}; } catch (e) { return {}; }
  }
  function saveStatus(all) {
    try { window.localStorage.setItem(storeKey, JSON.stringify(all)); } catch (e) { /* private mode */ }
  }

  var main = document.querySelector("main.wrap") || document.querySelector("div.wrap");
  if (!main) return;

  // The page was published as a read-only preview; here the student is in their own copy.
  var banner = main.querySelector(".copy-banner");
  if (banner) {
    banner.textContent = "";
    banner.classList.add("codespace-banner");
    banner.appendChild(document.createTextNode("Your lab, running in your Codespace. Write your code in "));
    banner.appendChild(el("code", "", (folder || "the lab folder") + "/"));
    banner.appendChild(document.createTextNode(", run it, then press "));
    banner.appendChild(el("strong", "", "Check my output"));
    banner.appendChild(document.createTextNode(" under each exercise."));
  }

  var offline = el("div", "offline", "The lab guide in your Codespace isn't answering. Reload this page; " +
    "if that doesn't help, stop and restart the Codespace (your files are safe).");
  offline.hidden = true;
  main.insertBefore(offline, main.firstChild);

  // ---- a slot under each exercise's Expected output, and a dot on its heading ----------
  var slots = [];
  Array.prototype.forEach.call(main.children, function (heading) {
    if (heading.tagName !== "H3" || !/^diy-/.test(heading.id || "")) return;
    var m = heading.textContent.match(/^\s*DIY\s+(\d+)\s*:/);
    if (!m) return;
    var diy = m[1];
    var pre = null;
    for (var node = heading.nextElementSibling; node && !/^H[23]$/.test(node.tagName);
         node = node.nextElementSibling) {
      var next = node.nextElementSibling;
      if (node.tagName === "P" && /^\s*Expected output\s*$/.test(node.textContent) &&
          next && next.tagName === "PRE") {
        pre = next;
        break;
      }
    }
    if (!pre) return;
    var dot = el("span", "diy-dot");
    dot.setAttribute("data-check-dot", diy);
    dot.setAttribute("role", "img");
    heading.appendChild(dot);
    var slot = el("div", "lab-check");
    slot.setAttribute("data-diy", diy);
    pre.parentNode.insertBefore(slot, pre.nextSibling);
    slots.push(slot);
  });
  if (!slots.length) return;

  var statuses = loadStatus();
  function setDot(diy, status) {
    var dot = main.querySelector('[data-check-dot="' + diy + '"]');
    if (!dot) return;
    dot.setAttribute("data-status", status);
    dot.setAttribute("aria-label", status === "pass" ? "Check my output passed" : "Not passing yet");
    dot.title = dot.getAttribute("aria-label");
  }
  Object.keys(statuses).forEach(function (diy) { setDot(diy, statuses[diy]); });

  function linesBlock(lines, highlight) {
    var pre = el("pre");
    var code = el("code");
    if (!lines.length) code.appendChild(el("span", "line empty", "(nothing printed)"));
    lines.forEach(function (line, i) {
      code.appendChild(el("span", i === highlight ? "line diff" : "line", line));
    });
    pre.appendChild(code);
    return pre;
  }
  function splitLines(text) { return text ? text.split("\n") : []; }

  var TITLES = {
    pass: "✓ Matches the expected output",
    fail: "Not matching yet",
    compile_error: "Java couldn't compile your code",
    runtime_error: "Your program crashed",
    timeout: "Your program was stopped",
    no_code: "No code to check yet"
  };

  function render(panel, result) {
    panel.textContent = "";
    var box = el("div", "result " + (result.status === "pass" ? "pass" : "bad"));
    // A loose exercise's expected output is only an example (the README says so): a run
    // that prints every line passes, and the student compares the two themselves.
    var example = result.loose && result.status === "pass";
    box.appendChild(el("p", "result-title", example ? "\u2713 It runs: compare it with the example"
      : TITLES[result.status] || "Check finished"));
    if (result.status === "fail" || example) {
      box.appendChild(el("p", "", result.message));
      var expected = splitLines(result.expected);
      var actual = splitLines(result.actual);
      var diff = result.loose ? -1 : (result.firstDiff || 1) - 1;
      var start = actual.indexOf(expected[0]);
      var actualDiff = diff < 0 ? -1 : (start >= 0 ? start : 0) + diff;
      var compare = el("div", "compare");
      var left = el("div");
      left.appendChild(el("h4", "", result.loose ? "The example" : "Expected output"));
      left.appendChild(linesBlock(expected, diff));
      var right = el("div");
      right.appendChild(el("h4", "", "Your program printed"));
      right.appendChild(linesBlock(actual, actualDiff < actual.length ? actualDiff : -1));
      compare.appendChild(left);
      compare.appendChild(right);
      box.appendChild(compare);
    } else if (result.status !== "pass") {
      if (result.status === "compile_error" || result.status === "runtime_error") {
        box.appendChild(linesBlock(splitLines(result.message), -1));
      } else {
        box.appendChild(el("p", "", result.message));
      }
      if ((result.status === "runtime_error" || result.status === "timeout") && result.actual) {
        box.appendChild(el("p", "", "What it printed first:"));
        box.appendChild(linesBlock(splitLines(result.actual).slice(0, 40), -1));
      }
    }
    if (result.note) box.appendChild(el("p", "result-note", result.note));
    panel.appendChild(box);
  }

  function failed(panel, problem) {
    panel.textContent = "";
    var box = el("div", "result bad");
    if (problem && problem.httpStatus) {           // the guide answered, but couldn't check
      box.appendChild(el("p", "result-title", "This exercise couldn't be checked"));
      box.appendChild(el("p", "", "The guide answered with error " + problem.httpStatus +
        ". Reload the page; if it happens again, tell your lecturer."));
    } else {                                       // no answer at all
      offline.hidden = false;
      box.appendChild(el("p", "result-title", "The lab guide isn't answering"));
      box.appendChild(el("p", "", "Reload this page, then press Check my output again."));
    }
    panel.appendChild(box);
  }

  function post(path) {
    return fetch("/api/" + path, { method: "POST", headers: { "X-Lab-Check": "1" }, cache: "no-store" })
      .then(function (response) {
        if (!response.ok) {
          var problem = new Error("HTTP " + response.status);
          problem.httpStatus = response.status;
          throw problem;
        }
        offline.hidden = true;
        return response.json();
      });
  }

  slots.forEach(function (slot) {
    var diy = slot.getAttribute("data-diy");
    var button = el("button", "check-btn", "Check my output");
    button.type = "button";
    button.setAttribute("aria-label", "Check my output for DIY " + diy);
    var panel = el("div", "check-result");
    panel.setAttribute("aria-live", "polite");
    slot.appendChild(button);
    slot.appendChild(panel);

    button.addEventListener("click", function () {
      button.disabled = true;
      button.textContent = "Checking…";
      post("check/" + encodeURIComponent(lab) + "/" + encodeURIComponent(diy)).then(function (result) {
        render(panel, result);
        if (result.status !== "no_code") {
          statuses[diy] = result.status === "pass" ? "pass" : "fail";
          saveStatus(statuses);
          setDot(diy, statuses[diy]);
        }
        document.dispatchEvent(new CustomEvent("lab:check", {
          detail: { diy: parseInt(diy, 10), status: result.status, message: result.message || "" }
        }));
      }).catch(function (problem) {
        failed(panel, problem);
      }).then(function () {
        button.disabled = false;
        button.textContent = "Check my output";
      });
    });
  });

  // ---- Watch my code run -------------------------------------------------------------
  // The tracer runs the student's own program under the Java debugger; its steps play in a
  // full-screen viewer drawn by the page's animation engine (loaded here if the page has none).
  var loading = null;                  // the engine is fetched once, however many traces open
  function stepper() {
    if (window.LabStepper) return Promise.resolve(window.LabStepper);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var css = el("link");
      css.rel = "stylesheet";
      css.href = "/labs/static/stepper.css";
      document.head.appendChild(css);
      var js = el("script");
      js.src = "/labs/static/stepper.js";
      js.onload = function () { window.LabStepper ? resolve(window.LabStepper) : reject(new Error("no engine")); };
      js.onerror = function (e) { loading = null; reject(e); };
      document.head.appendChild(js);
    });
    return loading;
  }

  function openTrace(diy, opener) {
    var overlay = el("div", "trace-overlay");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Your code, step by step");
    var panel = el("div", "trace-panel");
    var top = el("div", "trace-top");
    top.appendChild(el("p", "trace-title", "Your code, step by step"));
    var closeBtn = el("button", "trace-close", "×");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close");
    top.appendChild(closeBtn);
    var stage = el("div", "trace-stage");
    stage.appendChild(el("p", "trace-wait", "Running your program under the debugger…"));
    panel.appendChild(top);
    panel.appendChild(stage);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    closeBtn.focus();
    var mounted = null;
    var closed = false;
    if (opener) opener.disabled = true;  // one trace at a time from each button
    function close() {
      if (closed) return;
      closed = true;
      if (mounted && mounted.destroy) mounted.destroy();
      overlay.remove();
      if (opener) { opener.disabled = false; opener.focus(); }
    }
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    overlay.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    Promise.all([post("trace/" + encodeURIComponent(lab)), stepper()]).then(function (both) {
      if (closed) return;                // closed while the program ran: draw nothing
      var data = both[0];
      stage.textContent = "";
      if (data.error) {
        stage.appendChild(el("p", "result-title", data.error === "compile"
          ? "Java couldn't compile your code" : "Your program couldn't be traced"));
        stage.appendChild(linesBlock(splitLines(data.message || ""), -1));
        return;
      }
      mounted = both[1].mount(stage, data, { title: "DIY " + diy + ": your Main.java" });
    }).catch(function (problem) {
      if (closed) return;
      stage.textContent = "";
      stage.appendChild(el("p", "", problem && problem.httpStatus
        ? "The guide couldn't trace your program (error " + problem.httpStatus + ")."
        : "The lab guide isn't answering. Reload this page, then try once more."));
    });
  }

  fetch("/api/trace/status", { cache: "no-store" }).then(function (r) {
    return r.ok ? r.json() : null;
  }).then(function (status) {
    if (!status || !status.enabled) return;
    slots.forEach(function (slot) {
      var diy = slot.getAttribute("data-diy");
      var watch = el("button", "watch-btn", "▶ Watch my code run");
      watch.type = "button";
      watch.setAttribute("aria-label", "Watch your code for DIY " + diy + " run step by step");
      watch.addEventListener("click", function () { openTrace(diy, watch); });
      var checkBtn = slot.querySelector(".check-btn");
      slot.insertBefore(watch, checkBtn ? checkBtn.nextSibling : null);
    });
  }).catch(function () { /* no tracer */ });
})();
