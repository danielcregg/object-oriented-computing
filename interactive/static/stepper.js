/* Step-through animations for the lab guide.
 *
 * Every <div class="lab-anim" data-anim="ID"> on the page becomes an animation:
 * the code with the current line highlighted (none for a task animation), a
 * memory picture (variables as labelled cells, arrays as numbered boxes,
 * objects as cards, references as arrows: "an arrow, not the thing"), a
 * console and a caption, stepped with Back, Step, Play and Reset.
 *
 * The step data comes from the element's data-src attribute, or from
 * animations/ID.json next to the page. No libraries and no other network
 * requests, so the guide works offline. Nothing moves until the reader asks:
 * Step and Play animate what changed (CSS transitions and the Web Animations
 * API); Back and Reset jump. With prefers-reduced-motion every change is
 * instant.
 *
 * Step data (interactive/<lab>/animations/*.json):
 *   {id, title, task?, layout?: "wide", segments: [{example, extra, title, code?: [lines], steps: [step]}]}
 *     layout "wide": the picture spans the card, with the code and console under it (long Strings)
 *   step: {line?, caption, print?, from?, error?, vars?, arrays?, objects?, compare?, flow?}
 *     vars:    [{name, value} | {name, ref}]            ref = an array or object id
 *     arrays:  [{id, values | rows | text, keys?, highlight?, match?, dim?, marks?, badges?,
 *                ghost?, ruler?, note?, color?, class?, pool?, dead?, capacity?, solid?, mini?}]
 *              a value is "text", {"ref": id} or {"text", "faint"?, "num"?}
 *              text: a String object, one character per box (a space shows as ␣, a line break as ↵);
 *                solid: the whole text in one box instead; capacity: a StringBuilder's empty slots
 *                after its characters; mini: slim slots without letters (a big buffer)
 *              class: the class name over the boxes; pool: inside the string pool;
 *                dead: no arrows left (garbage)
 *     objects: [{id, class, fields: [[name, value]], kind?: "method", place?: "right",
 *                highlight?, color?}]
 *     from / flow[].from / flow[].to / compare[].a / compare[].b are targets:
 *              {array, index} | {array, row, col} | {array} | {var} | {object, field?}
 *     compare: [{a, b, same}]      flow: [{from, to, text}]
 * Each step is a complete picture; only print and error build up, in the
 * segment's console.
 *
 * API: window.LabStepper.mount(element, data, {title}) draws an animation from
 * data already in memory (a trace of the student's own program, say) and
 * returns {destroy()}; window.LabStepper.scan() mounts any new placeholders.
 * Reaching an animation's last step by Step or Play fires, once per page load,
 * document "lab:anim" with detail {id, done: true}.
 */
(() => {
  'use strict';

  if (window.LabStepper) return; // loaded twice: the first copy does the work

  const watched = new Set(); // animations whose last step was reached, reported once per page load

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SPRING = 'cubic-bezier(.34, 1.56, .64, 1)';
  const GLIDE = 'cubic-bezier(.45, 0, .25, 1)';
  const MS = { pop: 420, float: 460, glide: 600, flight: 680, enter: 420, stagger: 40, flowGap: 110,
    shake: 480, fade: 260 };
  const READING = { perChar: 45, min: 1600, max: 7000 };
  const ARRAY_HUES = ['teal', 'purple', 'pink', 'blue'];
  const OBJECT_HUES = ['pink', 'teal', 'purple', 'blue'];
  const HUES = new Set(['teal', 'purple', 'pink', 'blue', 'green', 'gold', 'orange', 'red', 'slate']);
  const MARK_TONES = { champion: 'gold', match: 'green', found: 'green', last: 'blue', first: 'blue' };
  // Characters a reader cannot see, drawn as a faint sign in their box.
  const GLYPHS = { ' ': '␣', '\n': '↵', '\t': '⇥' };
  // Character boxes shrink as the longest String in a scene grows: [most characters, size] (see charSizes).
  const CHAR_SIZES = [[10, 'l'], [16, 'm'], [22, 's'], [32, 'xs'], [Infinity, 'xxs']];
  const KEYWORDS = new Set((
    'abstract boolean break byte case catch char class continue default do double else enum extends final ' +
    'finally float for if implements import instanceof int interface long new package private protected ' +
    'public return short static super switch this throw throws try var void while true false null').split(' '));
  const TOKENS = /"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|\/\/.*|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?/g;
  const ICONS = {
    back: '<path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" stroke-linejoin="round"/>',
    step: '<path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.2" ' +
      'stroke-linecap="round" stroke-linejoin="round"/>',
    play: '<path d="M4.5 2.5v11l9-5.5z" fill="currentColor"/>',
    pause: '<path d="M4 3h3v10H4zm5 0h3v10H9z" fill="currentColor"/>',
    reset: '<path d="M3.6 8.6A4.5 4.5 0 1 0 5 4.6" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round"/><path d="M4.6 1.6v3.3h3.3" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  const BADGES = {
    crown: '<path d="M3.2 8.6 7.6 12.4 12 5l4.4 7.4 4.4-3.8L19 17.6H5z" fill="currentColor" ' +
      'stroke="rgba(60,40,0,.45)" stroke-width="1" stroke-linejoin="round"/>' +
      '<rect x="5" y="18.6" width="14" height="2.6" rx="1.2" fill="currentColor"/>' +
      '<circle cx="12" cy="4.6" r="1.7" fill="currentColor"/><circle cx="3.2" cy="8.4" r="1.4" ' +
      'fill="currentColor"/><circle cx="20.8" cy="8.4" r="1.4" fill="currentColor"/>',
    magnifier: '<circle cx="10" cy="10" r="6.2" fill="rgba(255,255,255,.9)" stroke="currentColor" ' +
      'stroke-width="2.6"/><path d="m14.7 14.7 5.6 5.6" stroke="currentColor" stroke-width="3.4" ' +
      'stroke-linecap="round"/>',
    low: '<circle cx="12" cy="12" r="9.6" fill="currentColor"/><path d="M12 6.6v10.2m-4.3-4.3 4.3 4.3 ' +
      '4.3-4.3" fill="none" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  const VERDICTS = {
    same: '<path d="m5.5 12.5 4 4L18.5 7.5" fill="none" stroke="currentColor" stroke-width="3" ' +
      'stroke-linecap="round" stroke-linejoin="round"/>',
    differ: '<path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="3" ' +
      'stroke-linecap="round"/>',
  };

  // ---- small helpers ------------------------------------------------------------

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function svgNode(tag, attrs) {
    const node = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs || {}).forEach((name) => node.setAttribute(name, attrs[name]));
    return node;
  }

  function icon(markup, box) {
    const svg = svgNode('svg', { viewBox: box || '0 0 16 16', 'aria-hidden': 'true', focusable: 'false' });
    svg.innerHTML = markup;
    return svg;
  }

  // Runs fn, and reports instead of throwing: an animation must never break the page.
  function safe(fn) {
    return function guarded(...args) {
      try {
        return fn.apply(this, args);
      } catch (err) {
        console.warn('lab animation:', err);
        return undefined;
      }
    };
  }

  // Captions are plain text in which `backticks` mark code.
  function fillCaption(node, text) {
    node.textContent = '';
    String(text).split('`').forEach((part, i) => {
      if (part) node.appendChild(i % 2 ? make('code', null, part) : document.createTextNode(part));
    });
  }

  // One line of Java, lightly coloured like the guide's code blocks.
  function fillCode(node, text) {
    let last = 0;
    for (const match of text.matchAll(TOKENS)) {
      const word = match[0];
      let kind = null;
      if (word[0] === '"' || word[0] === "'") kind = 'anim-tok-str';
      else if (word.startsWith('//')) kind = 'anim-tok-com';
      else if (/^\d/.test(word)) kind = 'anim-tok-num';
      else if (KEYWORDS.has(word)) kind = 'anim-tok-kw';
      if (!kind) continue;
      if (match.index > last) node.appendChild(document.createTextNode(text.slice(last, match.index)));
      node.appendChild(make('span', kind, word));
      last = match.index + word.length;
    }
    if (last < text.length) node.appendChild(document.createTextNode(text.slice(last)));
    glueEnding(node);
  }

  // A wrapped line never leaves its closing ");" alone: the punctuation stays with the word before it.
  function glueEnding(node) {
    const tail = node.lastChild;
    if (!tail || tail.nodeType !== 3) return;
    const match = /^(.*?)(\S*[)\];,}]+)$/.exec(tail.textContent);
    if (!match) return;
    if (!match[1] && !tail.previousSibling && match[2].length > 28) {
      // a whole line that is one long chain of calls: too long to keep together, so it may
      // break after a dot or an opening bracket instead of running out of the panel
      const parts = match[2].split(/(?<=[.(])/);
      tail.replaceWith(...parts.flatMap((part, i) => (i ? [document.createElement('wbr'), part] : [part])));
      return;
    }
    const glue = make('span', 'anim-glue');
    const before = match[1];
    let head = match[2];
    tail.textContent = before;
    if (!before && tail.previousSibling) { // the ending follows a token (a string, a number...)
      glue.appendChild(tail.previousSibling);
    } else if (before && !/\s$/.test(before) && /\S+$/.test(before)) {
      const word = /\S+$/.exec(before)[0];
      tail.textContent = before.slice(0, -word.length);
      head = word + head;
    }
    glue.appendChild(document.createTextNode(head));
    node.appendChild(glue);
    if (!tail.textContent) tail.remove();
  }

  const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const isRef = (v) => isObj(v) && typeof v.ref === 'string';
  const valueKey = (v) => (isObj(v) ? JSON.stringify(v) : String(v));
  const valueText = (v) => {
    if (isRef(v)) return '';
    if (isObj(v)) return v.text === undefined || v.text === null ? '' : String(v.text);
    return v === undefined || v === null ? '' : String(v);
  };
  const valueChars = (v) => {
    if (isRef(v)) return 1;
    const n = Array.from(valueText(v)).length;
    return isObj(v) && v.faint ? Math.ceil(n * 0.6) : n; // a faint glyph is drawn small
  };
  const varValue = (v) => (has(v, 'ref') ? { ref: v.ref } : v.value);
  const isText = (a) => isObj(a) && typeof a.text === 'string'; // a String drawn from its text
  const charValue = (ch) => (GLYPHS[ch] ? { text: GLYPHS[ch], ws: true } : ch);
  const textLength = (a) => Array.from(a.text).length;
  // A 1D array's box values: a String has one box per character, or one for its whole text (solid).
  const boxValues = (a) => {
    if (!isText(a)) return Array.isArray(a.values) ? a.values : [];
    if (a.solid) return [{ text: a.text, solid: true }];
    return Array.from(a.text).map(charValue);
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const setHue = (el, hue) => {
    Array.from(el.classList).forEach((name) => {
      if (name.startsWith('anim-hue-')) el.classList.remove(name);
    });
    if (hue) el.classList.add(`anim-hue-${hue}`);
  };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2);

  // A from/to/compare target as a string key.
  function targetKey(t) {
    if (!isObj(t)) return '';
    if (has(t, 'var')) return `v:${t.var}`;
    if (has(t, 'object')) return has(t, 'field') ? `f:${t.object}:${t.field}` : `o:${t.object}`;
    if (has(t, 'array')) {
      if (Number.isInteger(t.row) && Number.isInteger(t.col)) return `c:${t.array}:${t.row}:${t.col}`;
      if (Number.isInteger(t.index)) return `b:${t.array}:${t.index}`;
      return `a:${t.array}`;
    }
    return '';
  }

  // Visual rectangle of el relative to base (transforms included).
  function rectIn(el, base) {
    const r = el.getBoundingClientRect();
    const b = base.getBoundingClientRect();
    return { x: r.left - b.left, y: r.top - b.top, w: r.width, h: r.height };
  }

  function literal(arr) {
    if (isText(arr)) return JSON.stringify(arr.text);
    const show = (v) => (isRef(v) ? `an arrow to ${v.ref}` : valueText(v));
    if (Array.isArray(arr.rows)) return `{${arr.rows.map((row) => `{${row.map(show).join(', ')}}`).join(', ')}}`;
    return `{${(arr.values || []).map(show).join(', ')}}`;
  }

  // The picture in words, for screen readers.
  function describe(step) {
    const arrays = new Map((step.arrays || []).map((a) => [a.id, a]));
    const objects = new Map((step.objects || []).map((o) => [o.id, o]));
    const named = new Map();
    const parts = (step.vars || []).map((v) => {
      if (!has(v, 'ref')) return `${v.name} is ${v.value}`;
      if (named.has(v.ref)) return `${v.name} points to the same thing as ${named.get(v.ref)}`;
      named.set(v.ref, v.name);
      const arr = arrays.get(v.ref);
      if (arr && isText(arr)) {
        const where = arr.pool ? ', in the string pool' : '';
        return `${v.name} points to a ${String(arr.class || 'String').split(/[\s#@]/)[0]} object holding ${literal(arr)}${where}`;
      }
      if (arr) return `${v.name} points to the array ${literal(arr)}`;
      if (objects.has(v.ref)) return `${v.name} points to a ${objects.get(v.ref).class} object`;
      return `${v.name} points to ${v.ref}`;
    });
    objects.forEach((o) => {
      const fields = (o.fields || []).map(([name, value]) => `${name} ${isRef(value) ? 'points to an array' : valueText(value)}`);
      parts.push(`${o.class} ${o.id}: ${fields.join(', ')}`);
    });
    return parts.length ? `Memory: ${parts.join('; ')}.` : 'Memory: nothing yet.';
  }

  function outputLines(seg) {
    let text = '';
    seg.steps.forEach((step) => {
      if (step.print) text += step.print;
      if (step.error) text += (text && !text.endsWith('\n') ? '\n' : '') + step.error + '\n';
    });
    if (!text) return 0;
    return text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
  }

  function analyse(seg) {
    const info = {
      noCode: !Array.isArray(seg.code) || seg.code.length === 0,
      lines: outputLines(seg),
      marks: new Set(),
      badges: new Set(),
      rulers: new Set(),
      right: false,
      below: false,
      varLinks: false,
      ghosts: new Set(),
      maxVars: 0,
      maxPrims: 0,
      maxRefs: 0,
      compact: Array.isArray(seg.code) && seg.code.length > 40,
      chars: false, // any String drawn from its text
      arrays: false, // any array at all (a traced program may draw only objects)
      charSizes: [], // per step: the size of its character boxes (see charSizes)
      tags: false, // any class name over an array
      pool: false, // any object in the string pool
    };
    seg.steps.forEach((step) => {
      info.maxVars = Math.max(info.maxVars, (step.vars || []).length);
      const refs = (step.vars || []).filter((v) => has(v, 'ref')).length;
      info.maxRefs = Math.max(info.maxRefs, refs);
      info.maxPrims = Math.max(info.maxPrims, (step.vars || []).length - refs);
      if ((step.vars || []).length > 6) info.compact = true;
      if ((step.arrays || []).length) info.arrays = true;
      (step.arrays || []).forEach((a) => {
        if (a.marks && Object.keys(a.marks).length) info.marks.add(a.id);
        if (a.badges && Object.keys(a.badges).length) info.badges.add(a.id);
        if (a.ruler) info.rulers.add(a.id);
        if (Number.isInteger(a.ghost)) info.ghosts.add(a.id);
        if ((a.values || []).length > 12) info.compact = true;
        if (a.class) info.tags = true;
        if (a.pool) info.pool = true;
        if (isText(a)) info.chars = true;
      });
      (step.objects || []).forEach((o) => {
        if (o.place === 'right') info.right = true;
        else info.below = true;
      });
      (step.compare || []).forEach((c) => {
        if (isObj(c.a) && isObj(c.b) && has(c.a, 'var') && has(c.b, 'var')) info.varLinks = true;
      });
    });
    if (info.chars) info.charSizes = charSizes(seg.steps);
    return info;
  }

  // Character boxes shrink as Strings grow longer, one size for a whole scene: a run of steps
  // in which each step keeps an object of the one before. So boxes never resize mid-scene, and
  // a long String in one part of a task does not shrink the next part's boxes.
  function charSizes(steps) {
    const ids = steps.map((step) => new Set((step.arrays || []).map((a) => a.id)));
    const width = (step) => (step.arrays || []).reduce((most, a) => {
      if (!isText(a) || a.solid || a.mini) return most;
      const spare = Number.isInteger(a.capacity) ? Math.max(0, a.capacity - textLength(a)) : 0;
      return Math.max(most, textLength(a) + spare);
    }, 0);
    const sizes = [];
    let start = 0;
    for (let k = 1; k <= steps.length; k += 1) {
      if (k < steps.length && Array.from(ids[k]).some((id) => ids[k - 1].has(id))) continue;
      const most = Math.max(...steps.slice(start, k).map(width));
      const size = CHAR_SIZES.find(([limit]) => most <= limit)[1];
      for (let n = start; n < k; n += 1) sizes[n] = size;
      start = k;
    }
    return sizes;
  }

  // What can move between two steps: which variables, arrays (and their sizes) and objects exist.
  // Two steps with the same shape only change values, so nothing needs measuring before them.
  function shape(step) {
    const textShape = (a) => (isText(a) ? `:${a.solid ? `s${a.text.length}` : textLength(a)}:${a.capacity || ''}` +
      `${a.pool ? 'p' : ''}${a.class ? `n${String(a.class).length}` : ''}${a.note ? 'o' : ''}` : '');
    const arrays = (step.arrays || []).map((a) => (Array.isArray(a.rows)
      ? `${a.id}:${a.rows.map((r) => r.length).join('x')}`
      : `${a.id}:${(a.values || []).length}:${Number.isInteger(a.ghost) ? 'g' : ''}${a.keys ? 'k' : ''}${textShape(a)}`));
    return [(step.vars || []).map((v) => v.name).join(','), arrays.join(','),
      (step.objects || []).map((o) => `${o.id}:${(o.fields || []).length}`).join(',')].join('|');
  }

  function flowDelays(step) {
    const delays = new Map();
    (step.flow || []).forEach((f, n) => {
      const key = targetKey(f.to);
      if (key) delays.set(key, n * MS.flowGap + MS.flight - 140);
    });
    return delays;
  }

  function checkData(data) {
    const ok = data && Array.isArray(data.segments) && data.segments.length > 0 &&
      data.segments.every((seg) => seg && Array.isArray(seg.steps) && seg.steps.length > 0 &&
        seg.steps.every((step) => isObj(step)));
    if (!ok) throw new Error('the step data has no segments or steps');
  }

  // ---- one animation -----------------------------------------------------------

  class Stepper {
    constructor(root, data, options) {
      this.root = root;
      this.data = data;
      this.options = options || {};
      this.title = String(this.options.title || data.title || '');
      this.order = [];
      data.segments.forEach((seg, s) => seg.steps.forEach((_, k) => this.order.push([s, k])));
      this.info = data.segments.map(analyse);
      this.hues = new Map(); // array or object id -> hue, in order of first appearance
      let arrayCount = 0;
      let objectCount = 0;
      data.segments.forEach((seg) => seg.steps.forEach((step) => {
        (step.arrays || []).forEach((a) => {
          if (this.hues.has(a.id)) return;
          this.hues.set(a.id, HUES.has(a.color) ? a.color : ARRAY_HUES[arrayCount % ARRAY_HUES.length]);
          arrayCount += 1;
        });
        (step.objects || []).forEach((o) => {
          if (this.hues.has(o.id)) return;
          let hue = HUES.has(o.color) ? o.color : null;
          if (!hue && o.kind === 'method') hue = 'purple';
          if (!hue) {
            hue = OBJECT_HUES[objectCount % OBJECT_HUES.length];
            objectCount += 1;
          }
          this.hues.set(o.id, hue);
        });
      }));
      this.pos = 0;
      this.shownPos = -1;
      this.shownSeg = -1;
      this.playing = false;
      this.playTimer = 0;
      this.moving = false;
      this.motionEnd = 0;
      this.trackFrame = 0;
      this.layoutFrame = 0;
      this.before = null;
      this.delays = new Map();
      this.vars = new Map();
      this.arrays = new Map();
      this.objects = new Map();
      this.arrows = new Map();
      this.links = new Map();
      this.lines = [];
      this.currentLine = null;
      this.step = null;
      this.consoleAt = -1;
      this.newOut = null;
      this.newErr = null;
      this.still = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
      this.build();
      this.render(false);
      this.watch();
    }

    build() {
      const root = this.root;
      root.textContent = '';
      root.classList.add('anim-root');
      if (this.data.task) root.classList.add('anim-task');
      if (this.data.layout === 'wide') root.classList.add('anim-wide');
      root.setAttribute('role', 'group');
      root.setAttribute('aria-label', `${this.title || 'Animation'}: step-through animation`);

      const head = make('div', 'anim-head');
      head.append(make('div', 'anim-title', this.title), make('div', 'anim-kicker', 'step through'));

      const controls = make('div', 'anim-controls');
      controls.setAttribute('role', 'group');
      controls.setAttribute('aria-label', 'Animation controls');
      this.backBtn = this.button('back', 'Back', 'Back one step', () => this.go(this.pos - 1, false));
      this.stepBtn = this.button('step', 'Step', 'Step forward', () => this.go(this.pos + 1, true), true);
      this.playBtn = this.button('play', 'Play', 'Play', () => this.togglePlay());
      this.resetBtn = this.button('reset', 'Reset', 'Reset to the first step', () => this.go(0, false));
      this.counter = make('span', 'anim-counter');
      controls.append(this.backBtn, this.stepBtn, this.playBtn, this.resetBtn, this.counter);
      controls.addEventListener('keydown', safe((event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        const move = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
        if (!move) return;
        event.preventDefault();
        this.go(this.pos + move, move > 0);
      }));

      const segment = make('div', 'anim-seg');
      this.segTag = make('span', 'anim-seg-tag');
      this.segTitle = make('span', 'anim-seg-title');
      segment.append(this.segTag, this.segTitle);

      this.code = make('div', 'anim-code');

      this.memory = make('div', 'anim-memory');
      this.memoryText = make('p', 'anim-sr');
      this.stage = make('div', 'anim-stage');
      this.stage.setAttribute('aria-hidden', 'true');
      this.linkSvg = svgNode('svg', { class: 'anim-links' });
      const top = make('div', 'anim-top');
      const varsCol = make('div', 'anim-col anim-col-vars');
      this.varsList = make('div', 'anim-vars');
      varsCol.append(make('div', 'anim-col-head', 'variables'), this.varsList);
      const arraysCol = make('div', 'anim-col anim-col-arrays');
      this.arraysCol = arraysCol;
      this.arraysList = make('div', 'anim-arrays');
      this.arraysHead = make('div', 'anim-col-head', 'arrays');
      arraysCol.append(this.arraysHead, this.arraysList);
      // the string pool: a dashed frame at the top of the column, holding the pooled Strings
      this.poolBox = make('div', 'anim-pool');
      this.poolList = make('div', 'anim-pool-list');
      this.poolBox.append(make('div', 'anim-pool-label', 'string pool'), this.poolList);
      this.rightCol = make('div', 'anim-col anim-col-right');
      top.append(varsCol, arraysCol, this.rightCol);
      this.belowRow = make('div', 'anim-below'); // objects, under the arrays whose boxes point at them
      this.arrowSvg = svgNode('svg', { class: 'anim-arrows' });
      this.overlay = make('div', 'anim-overlay');
      this.stage.append(this.linkSvg, top, this.belowRow, this.arrowSvg, this.overlay);
      this.memory.append(this.memoryText, this.stage);

      const consoleBox = make('div', 'anim-console');
      this.out = make('div', 'anim-console-out');
      this.silent = make('div', 'anim-console-none', 'This code prints nothing.');
      this.silent.hidden = true;
      consoleBox.append(make('div', 'anim-console-head', 'console'), this.silent, this.out);

      this.caption = make('div', 'anim-caption');
      this.caption.setAttribute('aria-live', 'polite');
      this.captionLead = make('span', 'anim-sr');
      this.captionText = make('span', 'anim-caption-text');
      this.caption.append(this.captionLead, this.captionText);

      // Code over console on the left, the picture over its caption on the right.
      const left = make('div', 'anim-left');
      left.append(this.code, consoleBox);
      const right = make('div', 'anim-right');
      right.append(this.memory, this.caption);
      const body = make('div', 'anim-body');
      body.append(left, right);
      this.flyLayer = make('div', 'anim-fly');
      this.flyLayer.setAttribute('aria-hidden', 'true');
      root.append(head, controls, segment, body, this.flyLayer);
    }

    button(name, text, label, action, primary) {
      const btn = make('button', `anim-btn anim-${name}${primary ? ' anim-primary' : ''}`);
      btn.type = 'button';
      btn.setAttribute('aria-label', label);
      const words = make('span', 'anim-btn-text', text);
      if (name === 'step') btn.append(words, icon(ICONS[name]));
      else btn.append(icon(ICONS[name]), words);
      btn.addEventListener('click', safe(() => {
        if (btn.getAttribute('aria-disabled') === 'true') return;
        action();
      }));
      return btn;
    }

    // ---- moving -----------------------------------------------------------------

    go(n, animate) {
      this.stop();
      this.show(n, animate);
    }

    show(n, animate) {
      const next = Math.max(0, Math.min(this.order.length - 1, n));
      if (next === this.pos) {
        this.updateControls();
        return 0;
      }
      this.pos = next;
      return this.render(animate);
    }

    togglePlay() {
      if (this.playing) this.stop();
      else this.play();
    }

    play() {
      if (this.pos >= this.order.length - 1) return;
      this.playing = true;
      this.setPlaying(true);
      this.advance();
    }

    // Play waits for the motion to finish, then for long enough to read the caption.
    advance() {
      if (!this.playing) return;
      const motion = this.show(this.pos + 1, true);
      if (this.pos >= this.order.length - 1) {
        this.stop();
        return;
      }
      const [s, k] = this.order[this.pos];
      const words = String(this.data.segments[s].steps[k].caption || '').length;
      const pause = Math.min(READING.max, Math.max(READING.min, words * READING.perChar));
      this.playTimer = window.setTimeout(safe(() => this.advance()), motion + pause);
    }

    stop() {
      if (this.playTimer) window.clearTimeout(this.playTimer);
      this.playTimer = 0;
      this.playing = false;
      this.setPlaying(false);
      this.updateControls();
    }

    setPlaying(playing) {
      const btn = this.playBtn;
      if (btn.dataset.playing === String(playing)) return;
      btn.dataset.playing = String(playing);
      btn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      btn.querySelector('svg').replaceWith(icon(ICONS[playing ? 'pause' : 'play']));
      btn.querySelector('.anim-btn-text').textContent = playing ? 'Pause' : 'Play';
    }

    updateControls() {
      const atStart = this.pos === 0;
      const atEnd = this.pos === this.order.length - 1;
      const disable = (btn, off) => btn.setAttribute('aria-disabled', String(off));
      disable(this.backBtn, atStart);
      disable(this.stepBtn, atEnd);
      disable(this.playBtn, atEnd && !this.playing);
      disable(this.resetBtn, atStart && !this.playing);
      this.counter.textContent = `step ${this.pos + 1} of ${this.order.length}`;
    }

    // ---- one step -----------------------------------------------------------------

    render(animate) {
      const [s, k] = this.order[this.pos];
      const seg = this.data.segments[s];
      const step = seg.steps[k];
      const moving = Boolean(animate) && this.shownPos === this.pos - 1 && !(this.still && this.still.matches);
      this.settle();
      this.moving = moving;
      this.motionEnd = performance.now();
      this.changeBudget = 16; // a step that changes many values at once animates only the first few
      this.root.classList.toggle('anim-instant', !moving);
      if (s !== this.shownSeg) this.showSegment(s);
      this.step = step;
      this.delays = moving ? flowDelays(step) : new Map();
      const sources = moving ? this.capture(step) : new Map();
      const stepShape = shape(step);
      const reorders = (step.arrays || []).some((a) => Array.isArray(a.keys));
      this.before = moving && (stepShape !== this.shownShape || reorders) ? this.measure() : null;
      this.shownShape = stepShape;
      const charSize = this.info[s].charSizes[k] || null; // after measuring, so a new size glides too
      CHAR_SIZES.forEach(([, size]) => this.root.classList.toggle(`anim-chars-${size}`, size === charSize));
      this.showLine(step.line);
      this.updateVars(step);
      this.updateArrays(s, step);
      this.updateObjects(step);
      // read first (one layout), then write: no layout thrashing on big traces
      const overlays = this.planOverlays();
      const moves = this.before ? this.planFlip() : [];
      const lineScroll = this.planLineScroll();
      this.applyOverlays(overlays);
      moves.forEach((move) => this.slide(move));
      this.applyLineScroll(lineScroll);
      this.updateLinks(step);
      this.updateConsole(seg, k);
      if (moving) this.launch(step, sources);
      this.showCaption(seg, step, k);
      this.memoryText.textContent = describe(step);
      this.shownPos = this.pos;
      this.updateControls();
      this.follow();
      if (animate && this.pos === this.order.length - 1) this.reportWatched();
      this.before = null;
      if (!moving) {
        void this.root.offsetWidth; // apply the jump with transitions off, then turn them back on
        this.root.classList.remove('anim-instant');
      }
      return moving ? Math.max(0, this.motionEnd - performance.now()) : 0;
    }

    reportWatched() {
      const id = String(this.data.id || this.options.id || '');
      if (!id || watched.has(id)) return;
      watched.add(id);
      document.dispatchEvent(new CustomEvent('lab:anim', { detail: { id, done: true } }));
    }

    destroy() {
      this.destroyed = true;
      this.stop();
      this.settle();
      if (this.observer) this.observer.disconnect();
      if (this.onResize) window.removeEventListener('resize', this.onResize);
      if (this.layoutFrame) window.cancelAnimationFrame(this.layoutFrame);
      const root = this.root;
      root.textContent = '';
      root.classList.remove('anim-root', 'anim-task', 'anim-nocode', 'anim-instant', 'anim-wide', 'anim-compact');
      CHAR_SIZES.forEach(([, size]) => root.classList.remove(`anim-chars-${size}`));
      ['role', 'aria-label', 'data-anim-state'].forEach((name) => root.removeAttribute(name));
      if (root.stepper === this) delete root.stepper;
    }

    // Finish whatever the last step left moving, so every step starts from rest.
    settle() {
      if (this.trackFrame) window.cancelAnimationFrame(this.trackFrame);
      this.trackFrame = 0;
      (this.running || []).forEach((anim) => {
        try {
          anim.finish();
        } catch (err) {
          anim.cancel();
        }
      });
      this.running = [];
      this.flyLayer.textContent = '';
      this.overlay.querySelectorAll('.anim-leaving').forEach((n) => n.remove());
      this.stage.querySelectorAll('.anim-val-old').forEach((n) => n.remove());
      this.out.querySelectorAll('.anim-pending').forEach((n) => n.classList.remove('anim-pending'));
      this.arrows.forEach((arrow) => {
        arrow.tween = null;
      });
    }

    animate(el, frames, options) {
      if (!this.moving || !el || typeof el.animate !== 'function') return null;
      const timing = Object.assign({ fill: 'backwards' }, options);
      const anim = el.animate(frames, timing);
      if (!this.running) this.running = [];
      this.running.push(anim);
      this.motionEnd = Math.max(this.motionEnd, performance.now() + (timing.delay || 0) + (timing.duration || 0));
      return anim;
    }

    fadeOut(el) {
      if (el.classList) el.classList.add('anim-gone');
      const anim = this.animate(el, [{ opacity: 1 }, { opacity: 0 }], { duration: MS.fade, fill: 'forwards' });
      if (anim) anim.finished.then(() => el.remove(), () => el.remove());
      else el.remove();
    }

    enter(el, delay) {
      this.animate(el, [{ opacity: 0, transform: 'translateY(10px) scale(.88)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: MS.enter, delay, easing: SPRING });
    }

    leave(el, key) {
      const at = this.before && this.before.get(key);
      el.remove();
      if (!this.moving || !at) return;
      const ghost = el.cloneNode(true);
      ghost.classList.add('anim-leaving');
      ghost.style.left = `${at.x}px`;
      ghost.style.top = `${at.y}px`;
      ghost.style.width = `${at.w}px`;
      ghost.style.height = `${at.h}px`;
      this.overlay.appendChild(ghost);
      const anim = this.animate(ghost, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.9)' }],
        { duration: MS.fade, easing: 'ease-in', fill: 'forwards' });
      if (anim) anim.finished.then(() => ghost.remove(), () => ghost.remove());
      else ghost.remove();
    }

    // A box, cell or field shows "text", a dot for a reference, or a faint glyph with its number.
    paint(holder, v) {
      holder.querySelectorAll(':scope > .anim-val, :scope > .anim-dot, :scope > .anim-num').forEach((n) => n.remove());
      const ref = isRef(v);
      holder.classList.toggle('anim-holds-ref', ref);
      holder.classList.toggle('anim-faint', isObj(v) && !ref && Boolean(v.faint));
      holder.classList.toggle('anim-ws', isObj(v) && !ref && Boolean(v.ws));
      if (ref) {
        const dot = make('span', `anim-dot anim-hue-${this.hues.get(v.ref) || 'blue'}`);
        holder.appendChild(dot);
        return dot;
      }
      const solid = isObj(v) && Boolean(v.solid);
      const val = make('span', 'anim-val', solid ? null : valueText(v));
      if (solid) { // a whole String in one box: each line break shows as a faint ↵ and starts a new line
        String(v.text).split('\n').forEach((line, i, lines) => {
          if (line) val.appendChild(document.createTextNode(line));
          if (i < lines.length - 1) val.append(make('span', 'anim-nl', GLYPHS['\n']), document.createTextNode('\n'));
        });
      }
      holder.appendChild(val);
      if (isObj(v) && v.num !== undefined && v.num !== null) holder.appendChild(make('span', 'anim-num', v.num));
      return val;
    }

    // A changed value: the old one floats up and fades, the new one pops in.
    change(holder, oldV, newV, delay) {
      if (valueKey(oldV) === valueKey(newV)) return;
      const animated = this.moving && this.changeBudget > 0;
      if (animated) this.changeBudget -= 1;
      const old = holder.querySelector(':scope > .anim-val');
      const ghost = animated && old && !isRef(oldV) && valueText(oldV) !== '' ? old.cloneNode(true) : null;
      const fresh = this.paint(holder, newV);
      if (!animated) return;
      if (ghost) {
        ghost.classList.add('anim-val-old');
        holder.appendChild(ghost);
        const anim = this.animate(ghost, [{ opacity: 1, transform: 'translateY(0)' },
          { opacity: 0, transform: 'translateY(-95%)' }], { duration: MS.float, delay, easing: 'ease-out', fill: 'both' });
        if (anim) anim.finished.then(() => ghost.remove(), () => ghost.remove());
        else ghost.remove();
      }
      this.animate(fresh, [{ opacity: 0, transform: 'scale(.2)' }, { opacity: 1, transform: 'scale(1)' }],
        { duration: MS.pop, delay: delay + 60, easing: SPRING });
      this.animate(holder, [{ boxShadow: '0 0 0 7px rgba(231, 111, 0, .42)' }, { boxShadow: '0 0 0 0 rgba(231, 111, 0, 0)' }],
        { duration: 760, delay, fill: 'none' });
    }

    capture(step) {
      const at = new Map();
      const grab = (t) => {
        const key = targetKey(t);
        if (!key || at.has(key)) return;
        const el = this.resolve(t);
        if (el) at.set(key, rectIn(el, this.root));
      };
      if (step.from) grab(step.from);
      (step.flow || []).forEach((f) => grab(f.from));
      return at;
    }

    measure() {
      const at = new Map();
      this.vars.forEach((item, name) => at.set(`v:${name}`, rectIn(item.el, this.stage)));
      this.objects.forEach((item, id) => at.set(`o:${id}`, rectIn(item.el, this.stage)));
      this.arrays.forEach((item, id) => {
        at.set(`a:${id}`, rectIn(item.el, this.stage));
        if (item.twoD || !item.keyed) return;
        item.boxByKey.forEach((box, key) => at.set(`k:${id}:${key}`, rectIn(box.el, item.body)));
      });
      return at;
    }

    // Elements that stayed but moved slide from where they were (FLIP). Reads only.
    planFlip() {
      const before = this.before;
      const moves = [];
      const shift = (key, el, base, arc) => {
        const was = before.get(key);
        if (!was) return;
        const now = rectIn(el, base);
        const dx = was.x - now.x;
        const dy = was.y - now.y;
        if (Math.abs(dx) >= 0.5 || Math.abs(dy) >= 0.5) moves.push({ el, dx, dy, arc });
      };
      this.vars.forEach((item, name) => {
        if (!item.entering) shift(`v:${name}`, item.el, this.stage, false);
      });
      this.objects.forEach((item, id) => {
        if (!item.entering) shift(`o:${id}`, item.el, this.stage, false);
      });
      this.arrays.forEach((item, id) => {
        if (item.entering) return;
        shift(`a:${id}`, item.el, this.stage, false);
        if (item.twoD || !item.keyed) return;
        item.boxByKey.forEach((box, key) => {
          if (!box.entering) shift(`k:${id}:${key}`, box.el, item.body, true);
        });
      });
      return moves;
    }

    // Boxes that change places arc past each other: leftward over the top, rightward underneath.
    slide({ el, dx, dy, arc }) {
      if (arc && Math.abs(dx) > 8) {
        const lift = dx > 0 ? -30 : 30;
        this.animate(el, [
          { transform: `translate(${dx}px, ${dy}px) scale(1)` },
          { transform: `translate(${dx / 2}px, ${dy / 2 + lift}px) scale(1.08)`, offset: 0.5 },
          { transform: 'translate(0px, 0px) scale(1)' }], { duration: MS.glide + 200, easing: GLIDE });
        return;
      }
      this.animate(el, [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0px, 0px)' }],
        { duration: MS.glide, easing: GLIDE });
    }

    resolve(t) {
      if (!isObj(t)) return null;
      if (has(t, 'var')) {
        const item = this.vars.get(String(t.var));
        return item ? item.cell : null;
      }
      if (has(t, 'object')) {
        const item = this.objects.get(String(t.object));
        if (!item) return null;
        if (has(t, 'field')) {
          const field = item.fields.get(String(t.field));
          return field ? field.holder : null;
        }
        return item.el;
      }
      if (has(t, 'array')) {
        const item = this.arrays.get(String(t.array));
        if (!item) return null;
        if (item.twoD) {
          if (Number.isInteger(t.row) && Number.isInteger(t.col)) {
            const cell = item.cells.get(`${t.row},${t.col}`);
            return cell ? cell.el : null;
          }
          return item.el;
        }
        if (Number.isInteger(t.index)) return item.boxes.children[t.index] || null;
        return item.boxes;
      }
      return null;
    }

    // ---- the segment and the code ------------------------------------------------------

    showSegment(s) {
      const seg = this.data.segments[s];
      const info = this.info[s];
      this.shownSeg = s;
      this.consoleAt = -1;
      this.shownShape = null;
      if (this.data.task) this.segTag.textContent = seg.extra ? 'Extra' : `DIY ${this.data.task}`;
      else if (seg.extra) this.segTag.textContent = 'Extra';
      else this.segTag.textContent = seg.example ? `README example: ${seg.example}` : '';
      this.segTag.hidden = !this.segTag.textContent;
      this.segTag.classList.toggle('anim-extra', Boolean(seg.extra));
      this.segTitle.textContent = seg.title || '';
      this.root.classList.toggle('anim-nocode', info.noCode);
      this.root.classList.toggle('anim-compact', info.compact);
      this.arraysHead.textContent = info.chars || ((info.below || info.right) && !info.arrays)
        ? 'objects' : 'arrays';
      this.code.textContent = '';
      this.currentLine = null;
      this.lines = info.noCode ? [] : seg.code.map((text) => {
        const line = make('div', 'anim-line');
        const lead = /^[ \t]*/.exec(String(text))[0];
        line.style.setProperty('--anim-indent', String(lead.replace(/\t/g, '    ').length));
        fillCode(line, String(text).slice(lead.length));
        this.code.appendChild(line);
        return line;
      });
      // A fresh picture for every segment.
      [this.varsList, this.arraysList, this.poolList, this.rightCol, this.belowRow, this.overlay].forEach((n) => {
        n.textContent = '';
      });
      if (info.pool) this.arraysList.appendChild(this.poolBox); // first in the column
      this.poolBox.hidden = true;
      this.stage.classList.toggle('anim-tags', info.tags);
      [this.linkSvg, this.arrowSvg].forEach((n) => {
        while (n.firstChild) n.removeChild(n.firstChild);
      });
      this.vars.clear();
      this.arrays.clear();
      this.objects.clear();
      this.arrows.clear();
      this.links.clear();
      this.stage.classList.toggle('anim-has-right', info.right);
      this.stage.classList.toggle('anim-has-below', info.below);
      this.stage.classList.toggle('anim-var-links', info.varLinks);
      this.stage.classList.toggle('anim-has-badges', info.badges.size > 0);
      // Many variables: values in the first columns, references in the last, next to the arrays.
      const rows = 5;
      this.manyVars = info.maxVars > rows;
      this.primCols = this.manyVars ? Math.ceil(info.maxPrims / rows) : 0;
      this.varRows = rows;
      const columns = this.manyVars ? this.primCols + Math.ceil(info.maxRefs / rows) : 1;
      this.varsList.style.gridTemplateColumns = `repeat(${columns}, max-content)`;
      // The console keeps one height for the whole segment, so nothing jumps as it fills.
      this.out.textContent = '';
      this.out.style.minHeight = `${Math.min(12, Math.max(info.lines ? 3 : 1, info.lines)) * 1.5}em`;
      this.silent.hidden = info.lines > 0 || info.noCode; // an example that prints nothing says so
    }

    showLine(n) {
      if (this.currentLine) {
        this.currentLine.classList.remove('anim-current');
        this.currentLine.removeAttribute('aria-current');
      }
      this.currentLine = (Number.isInteger(n) && this.lines[n - 1]) || null;
      if (!this.currentLine) return;
      this.currentLine.classList.add('anim-current');
      this.currentLine.setAttribute('aria-current', 'step');
    }

    // A long program scrolls inside the code panel: keep the current line in view. Reads only.
    planLineScroll() {
      const panel = this.code;
      const line = this.currentLine;
      if (!line || panel.scrollHeight <= panel.clientHeight + 1) return null;
      const top = line.offsetTop;
      const bottom = top + line.offsetHeight;
      if (top >= panel.scrollTop + 24 && bottom <= panel.scrollTop + panel.clientHeight - 24) return null;
      return Math.max(0, top - panel.clientHeight / 3);
    }

    applyLineScroll(top) {
      if (top === null) return;
      const panel = this.code;
      if (this.moving && typeof panel.scrollTo === 'function') panel.scrollTo({ top, behavior: 'smooth' });
      else panel.scrollTop = top;
    }

    // ---- variables ----------------------------------------------------------------------

    updateVars(step) {
      const keep = new Set();
      const list = step.vars || [];
      let prims = 0;
      let refs = 0;
      list.forEach((v, i) => {
        const value = varValue(v);
        let item = this.vars.get(v.name);
        if (!item) {
          item = { el: make('div', 'anim-var'), cell: make('div', 'anim-var-cell'), value, entering: true };
          item.el.append(make('div', 'anim-var-name', v.name), item.cell);
          this.paint(item.cell, value);
          this.vars.set(v.name, item);
          this.enter(item.el, this.delays.get(`v:${v.name}`) || 0);
        } else {
          item.entering = false;
          this.change(item.cell, item.value, value, this.delays.get(`v:${v.name}`) || 0);
          item.value = value;
        }
        item.cell.classList.toggle('anim-ref', isRef(value));
        setHue(item.cell, isRef(value) ? this.hues.get(value.ref) || 'blue' : null);
        keep.add(v.name);
        const slot = this.varsList.children[i];
        if (slot !== item.el) this.varsList.insertBefore(item.el, slot || null);
        if (this.manyVars) {
          const n = isRef(value) ? refs++ : prims++;
          const col = (isRef(value) ? this.primCols : 0) + Math.floor(n / this.varRows) + 1;
          item.el.style.gridColumn = String(col);
          item.el.style.gridRow = String((n % this.varRows) + 1);
        } else {
          item.el.style.gridColumn = '';
          item.el.style.gridRow = '';
        }
      });
      this.vars.forEach((item, name) => {
        if (keep.has(name)) return;
        this.vars.delete(name);
        this.leave(item.el, `v:${name}`);
      });
    }

    // ---- arrays -------------------------------------------------------------------------

    updateArrays(s, step) {
      const info = this.info[s];
      const keep = new Set();
      const lead = info.pool ? 1 : 0; // the pool frame comes first in the column
      let heap = 0;
      let pooled = 0;
      (step.arrays || []).forEach((a) => {
        const twoD = Array.isArray(a.rows);
        let item = this.arrays.get(a.id);
        if (item && item.twoD !== twoD) {
          item.el.remove();
          item = null;
        }
        const isNew = !item;
        if (isNew) {
          item = twoD ? this.make2d(a) : this.make1d(a, info);
          this.arrays.set(a.id, item);
        }
        item.entering = isNew;
        keep.add(a.id);
        const inPool = info.pool && Boolean(a.pool) && !twoD;
        const list = inPool ? this.poolList : this.arraysList;
        const slot = list.children[inPool ? pooled : lead + heap];
        if (inPool) pooled += 1;
        else heap += 1;
        if (slot !== item.el) list.insertBefore(item.el, slot || null);
        if (twoD) this.fill2d(item, a, isNew);
        else this.fill1d(item, a, isNew);
        item.data = a;
      });
      if (info.pool) this.poolBox.hidden = pooled === 0;
      this.arrays.forEach((item, id) => {
        if (keep.has(id)) return;
        this.arrays.delete(id);
        this.leave(item.el, `a:${id}`);
      });
    }

    make1d(a, info) {
      const el = make('div', `anim-array anim-hue-${this.hues.get(a.id) || 'teal'}`);
      const body = make('div', 'anim-array-body');
      const badgeRow = make('div', 'anim-badge-row');
      badgeRow.hidden = !info.badges.has(a.id);
      const boxes = make('div', 'anim-boxes');
      const idxRow = make('div', 'anim-idx-row');
      const markRow = make('div', 'anim-mark-row');
      markRow.hidden = !info.marks.has(a.id);
      const ruler = make('div', 'anim-ruler');
      ruler.hidden = !info.rulers.has(a.id);
      const rulerLabel = make('span', 'anim-ruler-label');
      ruler.appendChild(rulerLabel);
      const rings = make('div', 'anim-rings');
      // the class name, level with the variable names; a note then rides on that line too
      const tagLine = make('div', 'anim-tag-line');
      const tag = make('div', 'anim-class-tag');
      tagLine.appendChild(tag);
      tagLine.hidden = !info.tags;
      body.append(tagLine, badgeRow, boxes, idxRow, markRow, ruler, rings);
      const scroller = make('div', 'anim-array-scroll'); // a long array scrolls in its own row
      scroller.classList.toggle('anim-badged', info.badges.has(a.id));
      scroller.appendChild(body);
      const note = make('div', 'anim-note');
      if (info.tags) tagLine.appendChild(note);
      else el.append(note);
      el.prepend(scroller);
      return {
        el, body, scroller, tag, badgeRow, boxes, idxRow, markRow, ruler, rulerLabel, rings, note, twoD: false,
        boxByKey: new Map(), ghost: null, marks: new Map(), badges: new Map(), ringEls: new Map(),
        spares: [], empty: null, chars: false,
      };
    }

    fill1d(item, a, isNew) {
      const values = boxValues(a);
      const text = isText(a);
      item.chars = text && !a.solid;
      item.el.classList.toggle('anim-chars', item.chars);
      item.el.classList.toggle('anim-solid', text && Boolean(a.solid));
      item.el.classList.toggle('anim-mini', item.chars && Boolean(a.mini));
      item.el.classList.toggle('anim-dead', Boolean(a.dead));
      item.tag.textContent = a.class || '';
      item.keyed = Array.isArray(a.keys) && a.keys.length === values.length;
      const keys = item.keyed ? a.keys.map(String) : values.map((_, i) => `#${i}`);
      const chars = text ? 1 : values.reduce((n, v) => Math.max(n, valueChars(v)), 1);
      item.el.style.setProperty('--anim-chars', String(chars));
      item.el.toggleAttribute('data-wide', chars >= 7);
      const hot = new Set(a.highlight || []);
      const match = new Set(a.match || []);
      const dim = new Set(a.dim || []);
      const keep = new Set();
      let fresh = 0; // characters added to an existing String or builder arrive left to right
      keys.forEach((key, i) => {
        const v = values[i];
        let box = item.boxByKey.get(key);
        if (!box) {
          box = { el: make('div', 'anim-box'), value: v, entering: true };
          this.paint(box.el, v);
          item.boxByKey.set(key, box);
          const wait = isNew ? i * MS.stagger : (text ? fresh * MS.stagger : 0);
          if (!isNew) fresh += 1;
          this.enter(box.el, Math.max(wait, this.delays.get(`b:${a.id}:${i}`) || 0));
        } else {
          box.entering = false;
          this.change(box.el, box.value, v, this.delays.get(`b:${a.id}:${i}`) || 0);
          box.value = v;
        }
        keep.add(key);
        const slot = item.boxes.children[i];
        if (slot !== box.el) item.boxes.insertBefore(box.el, slot || null);
        box.el.classList.toggle('anim-hl', hot.has(i));
        box.el.classList.toggle('anim-match', match.has(i));
        box.el.classList.toggle('anim-dim', dim.has(i));
      });
      item.boxByKey.forEach((box, key) => {
        if (keep.has(key)) return;
        item.boxByKey.delete(key);
        box.el.remove();
      });
      // a StringBuilder's spare room: empty slots after its characters; when it grows, more slots appear
      const spare = item.chars && Number.isInteger(a.capacity) ? Math.max(0, a.capacity - values.length) : 0;
      while (item.spares.length > spare) item.spares.pop().remove();
      while (item.spares.length < spare) {
        const slot = make('div', 'anim-box anim-spare');
        if (!isNew) this.enter(slot, MS.glide + (item.spares.length % 40) * 12);
        item.spares.push(slot);
      }
      item.spares.forEach((slot) => {
        if (slot.parentNode !== item.boxes) item.boxes.appendChild(slot);
      });
      // an empty String has no boxes at all: a dashed outline stands for the object
      const hollow = item.chars && values.length === 0 && spare === 0;
      if (hollow && !item.empty) {
        item.empty = make('div', 'anim-box anim-empty');
        item.empty.appendChild(make('span', 'anim-val', '""'));
        this.enter(item.empty, 0);
      }
      if (hollow) item.boxes.insertBefore(item.empty, item.boxes.firstChild);
      else if (item.empty) {
        item.empty.remove();
        item.empty = null;
      }
      item.el.classList.toggle('anim-hollow', hollow);
      // the box one past the end, which does not exist (its place is kept for the whole segment)
      const ghostHere = Number.isInteger(a.ghost);
      if (ghostHere || this.info[this.shownSeg].ghosts.has(a.id)) {
        if (!item.ghost) {
          item.ghost = make('div', 'anim-box anim-ghost anim-ghost-off');
          item.ghost.appendChild(icon(VERDICTS.differ, '0 0 24 24'));
        }
        item.boxes.appendChild(item.ghost);
        if (ghostHere && item.ghost.classList.contains('anim-ghost-off')) this.enter(item.ghost, 0);
        item.ghost.classList.toggle('anim-ghost-off', !ghostHere);
        item.ghost.classList.toggle('anim-boom', ghostHere && Boolean(this.step && this.step.error));
      } else if (item.ghost) {
        item.ghost.remove();
        item.ghost = null;
      }
      const count = values.length + (item.ghost ? 1 : 0);
      while (item.idxRow.children.length > count) item.idxRow.lastChild.remove();
      while (item.idxRow.children.length < count) {
        const pill = make('div', 'anim-idx');
        pill.appendChild(make('span', null, item.idxRow.children.length));
        item.idxRow.appendChild(pill);
      }
      Array.from(item.idxRow.children).forEach((pill, i) => {
        pill.classList.toggle('anim-hot', hot.has(i));
        pill.classList.toggle('anim-match', match.has(i));
        pill.classList.toggle('anim-ghost-idx', Boolean(item.ghost) && i === values.length);
        pill.classList.toggle('anim-ghost-off', Boolean(item.ghost) && i === values.length && !ghostHere);
        if (isNew) this.enter(pill, i * MS.stagger + 80);
      });
      if (item.note.textContent !== (a.note || '')) {
        item.note.textContent = a.note || '';
        if (a.note) this.enter(item.note, MS.glide);
      }
      item.rulerLabel.textContent = a.ruler || '';
      item.ruler.classList.toggle('anim-on', Boolean(a.ruler));
    }

    make2d(a) {
      const el = make('div', `anim-array anim-2d anim-hue-${this.hues.get(a.id) || 'teal'}`);
      const body = make('div', 'anim-array-body anim-grid');
      const rings = make('div', 'anim-rings');
      el.appendChild(body);
      return { el, body, rings, twoD: true, cells: new Map(), rowHeads: [], colHeads: [], ringEls: new Map(), dims: '' };
    }

    fill2d(item, a, isNew) {
      const rows = a.rows;
      const cols = rows.reduce((n, row) => Math.max(n, row.length), 0);
      const dims = `${rows.length}x${cols}`;
      const chars = rows.reduce((n, row) => row.reduce((m, v) => Math.max(m, valueChars(v)), n), 1);
      item.el.style.setProperty('--anim-chars', String(chars));
      item.el.toggleAttribute('data-wide', chars >= 7);
      if (item.dims !== dims) {
        item.body.textContent = '';
        item.cells.clear();
        item.body.style.gridTemplateColumns = `auto repeat(${cols}, auto)`;
        item.body.appendChild(make('div', 'anim-corner'));
        item.colHeads = [];
        for (let c = 0; c < cols; c += 1) {
          const head = make('div', 'anim-idx anim-col-idx');
          head.appendChild(make('span', null, c));
          item.colHeads.push(head);
          item.body.appendChild(head);
        }
        item.rowHeads = [];
        rows.forEach((row, r) => {
          const head = make('div', 'anim-idx anim-row-idx');
          head.appendChild(make('span', null, r));
          item.rowHeads.push(head);
          item.body.appendChild(head);
          for (let c = 0; c < cols; c += 1) {
            if (c >= row.length) {
              item.body.appendChild(make('div', 'anim-gap'));
              continue;
            }
            const cell = { el: make('div', 'anim-box anim-cell'), value: row[c] };
            this.paint(cell.el, row[c]);
            item.cells.set(`${r},${c}`, cell);
            item.body.appendChild(cell.el);
            if (isNew) this.enter(cell.el, (r * cols + c) * (MS.stagger - 10));
          }
        });
        item.body.appendChild(item.rings);
        item.dims = dims;
      } else {
        rows.forEach((row, r) => row.forEach((v, c) => {
          const cell = item.cells.get(`${r},${c}`);
          if (!cell) return;
          this.change(cell.el, cell.value, v, this.delays.get(`c:${a.id}:${r}:${c}`) || 0);
          cell.value = v;
        }));
      }
      const pairs = (a.highlight || []).filter((p) => Array.isArray(p) && p.length === 2);
      const matches = (a.match || []).filter((p) => Array.isArray(p) && p.length === 2);
      const dims2 = (a.dim || []).filter((p) => Array.isArray(p) && p.length === 2);
      const hot = new Set(pairs.map(([r, c]) => `${r},${c}`));
      const green = new Set(matches.map(([r, c]) => `${r},${c}`));
      const faded = new Set(dims2.map(([r, c]) => `${r},${c}`));
      item.cells.forEach((cell, key) => {
        cell.el.classList.toggle('anim-hl', hot.has(key));
        cell.el.classList.toggle('anim-match', green.has(key));
        cell.el.classList.toggle('anim-dim', faded.has(key));
      });
      item.rowHeads.forEach((head, r) => head.classList.toggle('anim-hot', pairs.some(([pr]) => pr === r)));
      item.colHeads.forEach((head, c) => head.classList.toggle('anim-hot', pairs.some(([, pc]) => pc === c)));
    }

    layoutOverlays() {
      this.applyOverlays(this.planOverlays());
    }

    // Rings (the cursor), marks and badges glide to their boxes, placed from layout positions.
    // planOverlays only reads the layout; applyOverlays only writes.
    planOverlays() {
      const geo = (el) => ({ x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight });
      const panel = this.memory.getBoundingClientRect();
      const padRight = parseFloat(getComputedStyle(this.memory).paddingRight) || 0;
      const room = Math.floor(panel.right - padRight - this.arraysCol.getBoundingClientRect().left);
      const plans = [];
      this.arrays.forEach((item) => {
        if (item.twoD) {
          const cells = new Map();
          item.cells.forEach((cell, key) => cells.set(key, geo(cell.el)));
          plans.push({ item, cells });
        } else {
          const noteWidth = item.note.textContent && item.note.parentNode === item.el ? item.note.offsetWidth + 12 : 0;
          const boxEls = Array.from(item.boxes.children).filter((el) => el !== item.empty);
          plans.push({ item, boxes: boxEls.map(geo), room: room - noteWidth, empty: item.empty ? geo(item.empty) : null,
            natural: item.body.offsetWidth, scrollLeft: item.scroller.scrollLeft });
        }
      });
      return plans;
    }

    applyOverlays(plans) {
      const error = Boolean(this.step && this.step.error);
      plans.forEach((plan) => {
        const { item, cells, boxes } = plan;
        const a = item.data || {};
        if (item.twoD) {
          const cellAt = (p, tone) => {
            const g = Array.isArray(p) ? cells.get(`${p[0]},${p[1]}`) : null;
            return g ? Object.assign({ tone }, g) : null;
          };
          this.placeRings(item, [...(a.highlight || []).map((p) => cellAt(p, 'cursor')),
            ...(a.match || []).map((p) => cellAt(p, 'match'))].filter(Boolean));
          return;
        }
        const values = boxValues(a);
        const ghostAt = item.ghost ? boxes.length - 1 : -1;
        if (boxes[0]) item.el.style.setProperty('--anim-cell-px', `${boxes[0].w}px`);
        // too long for the picture: this array scrolls in its own row, keeping the cursor in view
        const scrolls = plan.natural > plan.room + 1 && plan.room > 80;
        item.scroller.classList.toggle('anim-scrolls', scrolls);
        item.scroller.style.maxWidth = scrolls ? `${plan.room}px` : '';
        if (scrolls) {
          const hot = (a.highlight || []).concat(a.match || []).filter((i) => boxes[i]);
          if (hot.length) {
            const left = Math.min(...hot.map((i) => boxes[i].x)) - 16;
            const right = Math.max(...hot.map((i) => boxes[i].x + boxes[i].w)) + 16;
            let target = plan.scrollLeft;
            if (left < target) target = left;
            else if (right > target + plan.room) target = right - plan.room;
            if (target !== plan.scrollLeft) {
              if (this.moving && typeof item.scroller.scrollTo === 'function') {
                item.scroller.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
              } else {
                item.scroller.scrollLeft = Math.max(0, target);
              }
            }
          }
        } else if (plan.scrollLeft) {
          item.scroller.scrollLeft = 0;
        }
        const runs = (indexes, tone) => {
          const sorted = Array.from(new Set(indexes)).filter((i) => boxes[i]).sort((x, y) => x - y);
          const out = [];
          sorted.forEach((i) => {
            const last = out[out.length - 1];
            if (last && last.to === i - 1) last.to = i;
            else out.push({ from: i, to: i });
          });
          return out.map(({ from, to }) => {
            const l = boxes[from];
            const r = boxes[to];
            return { x: l.x, y: l.y, w: r.x + r.w - l.x, h: l.h,
              tone: tone === 'cursor' && error && to === ghostAt ? 'error' : tone };
          });
        };
        this.placeRings(item, [...runs(a.highlight || [], 'cursor'), ...runs(a.match || [], 'match')]);
        const centre = (i) => boxes[i].x + boxes[i].w / 2;
        this.placeTags(item.marks, item.markRow, a.marks || {}, boxes, centre, (label) => {
          const tone = MARK_TONES[label] || 'orange';
          return make('div', `anim-mark anim-tone-${tone}`, label);
        });
        this.placeTags(item.badges, item.badgeRow, a.badges || {}, boxes, centre, (kind) => {
          const badge = make('div', `anim-badge anim-badge-${kind}`);
          badge.appendChild(icon(BADGES[kind] || BADGES.magnifier, '0 0 24 24'));
          return badge;
        });
        const first = boxes[0];
        const last = boxes[values.length - 1];
        if (plan.empty) item.ruler.style.width = `${plan.empty.w}px`; // an empty String: under its outline
        else if (first && last) item.ruler.style.width = `${last.x + last.w - first.x}px`;
      });
    }

    placeRings(item, wanted) {
      const seen = new Set();
      const count = {};
      wanted.forEach(({ x: left, y: top, w, h, tone }) => {
        count[tone] = (count[tone] || 0) + 1;
        const key = `${tone === 'error' ? 'cursor' : tone}:${count[tone]}`;
        let ring = item.ringEls.get(key);
        const fresh = !ring;
        if (fresh) {
          ring = make('div', `anim-ring anim-ring-${tone}`);
          item.rings.appendChild(ring);
          item.ringEls.set(key, ring);
        }
        const x = left - 5;
        const y = top - 5;
        ring.className = `anim-ring anim-ring-${tone}`;
        ring.style.transform = `translate(${x}px, ${y}px)`;
        ring.style.width = `${w + 10}px`;
        ring.style.height = `${h + 10}px`;
        if (fresh) {
          this.animate(ring, [{ opacity: 0, transform: `translate(${x}px, ${y}px) scale(1.35)` },
            { opacity: 1, transform: `translate(${x}px, ${y}px) scale(1)` }], { duration: MS.pop, easing: SPRING });
        }
        seen.add(key);
      });
      item.ringEls.forEach((ring, key) => {
        if (seen.has(key)) return;
        item.ringEls.delete(key);
        this.fadeOut(ring);
      });
    }

    placeTags(tags, row, wanted, boxes, centre, create) {
      const seen = new Set();
      Object.keys(wanted).forEach((index) => {
        const label = String(wanted[index]);
        const i = Number(index);
        if (!boxes[i] || !label) return;
        let tag = tags.get(label);
        const fresh = !tag;
        if (fresh) {
          tag = create(label);
          row.appendChild(tag);
          tags.set(label, tag);
        }
        const x = centre(i);
        tag.style.transform = `translateX(${x}px) translateX(-50%) translateY(0px)`;
        if (fresh) {
          this.animate(tag, [{ opacity: 0, transform: `translateX(${x}px) translateX(-50%) translateY(-8px)` },
            { opacity: 1, transform: `translateX(${x}px) translateX(-50%) translateY(0px)` }],
          { duration: MS.pop, easing: SPRING });
        }
        seen.add(label);
      });
      tags.forEach((tag, label) => {
        if (seen.has(label)) return;
        tags.delete(label);
        this.fadeOut(tag);
      });
    }

    // ---- objects ------------------------------------------------------------------------

    updateObjects(step) {
      const keep = new Set();
      const below = [];
      const right = [];
      (step.objects || []).forEach((o) => (o.place === 'right' ? right : below).push(o));
      const place = (list, container) => list.forEach((o, i) => {
        let item = this.objects.get(o.id);
        const isNew = !item;
        if (isNew) {
          item = this.makeObject(o);
          this.objects.set(o.id, item);
          this.enter(item.el, 0);
        }
        item.entering = isNew;
        keep.add(o.id);
        const slot = container.children[i];
        if (item.el.parentNode !== container || slot !== item.el) container.insertBefore(item.el, slot || null);
        this.fillObject(item, o);
      });
      place(below, this.belowRow);
      place(right, this.rightCol);
      this.objects.forEach((item, id) => {
        if (keep.has(id)) return;
        this.objects.delete(id);
        this.leave(item.el, `o:${id}`);
      });
    }

    makeObject(o) {
      const el = make('div', `anim-obj anim-hue-${this.hues.get(o.id) || 'pink'}${o.kind === 'method' ? ' anim-method' : ''}`);
      const head = make('div', 'anim-obj-head');
      const fieldsBox = make('div', 'anim-obj-fields');
      el.append(head, fieldsBox);
      return { el, head, fieldsBox, fields: new Map() };
    }

    fillObject(item, o) {
      item.head.textContent = o.class || '';
      item.el.classList.toggle('anim-hl', Boolean(o.highlight));
      const keep = new Set();
      (o.fields || []).forEach(([name, value], i) => {
        let field = item.fields.get(name);
        if (!field) {
          field = { row: make('div', 'anim-field'), holder: make('div', 'anim-field-val'), value };
          field.row.append(make('span', 'anim-field-name', name), field.holder);
          this.paint(field.holder, value);
          item.fields.set(name, field);
          if (!item.entering) this.enter(field.row, 0);
        } else {
          this.change(field.holder, field.value, value, this.delays.get(`f:${o.id}:${name}`) || 0);
          field.value = value;
        }
        field.row.classList.toggle('anim-field-ref', isRef(value));
        keep.add(name);
        const slot = item.fieldsBox.children[i];
        if (slot !== field.row) item.fieldsBox.insertBefore(field.row, slot || null);
      });
      item.fields.forEach((field, name) => {
        if (keep.has(name)) return;
        item.fields.delete(name);
        field.row.remove();
      });
    }

    // ---- arrows and comparisons --------------------------------------------------------

    updateLinks(step) {
      const compared = new Set();
      (step.compare || []).forEach((c) => [c.a, c.b].forEach((t) => {
        if (isObj(t) && has(t, 'var')) compared.add(String(t.var));
      }));
      const want = new Map();
      this.vars.forEach((item, name) => {
        if (isRef(item.value)) want.set(`v:${name}`, { from: item.cell, target: item.value.ref, hot: compared.has(name) });
      });
      this.arrays.forEach((item, id) => {
        if (item.twoD) return;
        item.boxByKey.forEach((box, key) => {
          if (isRef(box.value)) {
            want.set(`b:${id}:${key}`, { from: box.el, target: box.value.ref, hot: box.el.classList.contains('anim-hl') });
          }
        });
      });
      this.objects.forEach((item, id) => item.fields.forEach((field, name) => {
        if (isRef(field.value)) {
          want.set(`f:${id}:${name}`, { from: field.holder, target: field.value.ref, hot: item.el.classList.contains('anim-hl') });
        }
      }));
      const now = performance.now();
      want.forEach((w, key) => {
        let arrow = this.arrows.get(key);
        if (!arrow) {
          arrow = { path: svgNode('path', { pathLength: '1' }), head: svgNode('path', {}), end: null, tween: null };
          this.arrowSvg.append(arrow.path, arrow.head);
          this.arrows.set(key, arrow);
          this.animate(arrow.path, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
            { duration: 560, delay: 140, easing: GLIDE });
          this.animate(arrow.head, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: 600 });
        } else if (arrow.target !== w.target && arrow.end && this.moving) {
          arrow.tween = { from: arrow.end, start: now, duration: MS.glide };
        }
        Object.assign(arrow, w);
        const hue = this.hues.get(w.target) || 'blue';
        arrow.path.setAttribute('class', `anim-arrow anim-hue-${hue}${w.hot ? ' anim-hot' : ''}`);
        arrow.head.setAttribute('class', `anim-arrowhead anim-hue-${hue}${w.hot ? ' anim-hot' : ''}`);
      });
      this.arrows.forEach((arrow, key) => {
        if (want.has(key)) return;
        this.arrows.delete(key);
        this.fadeOut(arrow.path);
        this.fadeOut(arrow.head);
      });

      const links = new Map();
      (step.compare || []).forEach((c) => links.set(`${targetKey(c.a)}|${targetKey(c.b)}`, c));
      links.forEach((c, key) => {
        let link = this.links.get(key);
        if (!link) {
          link = { path: svgNode('path', {}), badge: make('div', 'anim-verdict') };
          this.linkSvg.appendChild(link.path);
          this.overlay.appendChild(link.badge);
          this.links.set(key, link);
          this.animate(link.path, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
          this.animate(link.badge, [{ opacity: 0, scale: '.3' }, { opacity: 1, scale: '1' }],
            { duration: MS.pop, delay: 120, easing: SPRING });
        }
        const same = Boolean(c.same);
        // character against character: boxes sit close together, so the verdicts are smaller
        const small = [c.a, c.b].every((t) => isObj(t) && has(t, 'array') && Number.isInteger(t.index) &&
          Boolean((this.arrays.get(String(t.array)) || {}).chars));
        link.path.setAttribute('class', `anim-link ${same ? 'anim-same' : 'anim-differ'}`);
        link.badge.className = `anim-verdict ${same ? 'anim-same' : 'anim-differ'}${small ? ' anim-small' : ''}`;
        link.badge.textContent = '';
        link.badge.appendChild(icon(VERDICTS[same ? 'same' : 'differ'], '0 0 24 24'));
        link.a = this.resolve(c.a);
        link.b = this.resolve(c.b);
        link.vars = has(c.a || {}, 'var') && has(c.b || {}, 'var');
        link.arrays = [c.a, c.b].map((t) => (isObj(t) && has(t, 'array') ? this.arrays.get(String(t.array)) : null));
      });
      this.links.forEach((link, key) => {
        if (links.has(key)) return;
        this.links.delete(key);
        this.fadeOut(link.path);
        this.fadeOut(link.badge);
      });
    }

    anchorOf(id) {
      const arr = this.arrays.get(id);
      if (arr) return arr.twoD ? { el: arr.el, head: arr.colHeads[0] || null } : { el: arr.scroller, head: null, row: arr.boxes };
      const obj = this.objects.get(id);
      if (obj) return { el: obj.el, head: obj.head };
      return null;
    }

    // Recomputed from the elements' live positions, every frame while things move.
    drawLinks() {
      const stageBox = this.stage.getBoundingClientRect();
      const rel = (el) => {
        const r = el.getBoundingClientRect();
        return { l: r.left - stageBox.left, t: r.top - stageBox.top, r: r.right - stageBox.left,
          b: r.bottom - stageBox.top, w: r.width, h: r.height };
      };
      const groups = new Map();
      this.arrows.forEach((arrow) => {
        if (!groups.has(arrow.target)) groups.set(arrow.target, []);
        groups.get(arrow.target).push(arrow);
      });
      const now = performance.now();
      groups.forEach((list, target) => {
        const anchor = this.anchorOf(target);
        let box = anchor && anchor.el.isConnected ? rel(anchor.el) : null;
        const headBox = anchor && anchor.head && anchor.head.isConnected ? rel(anchor.head) : null;
        if (box && anchor.row && anchor.row.isConnected) { // the box row, but never wider than its scroller
          const row = rel(anchor.row);
          box = { l: Math.max(box.l, row.l), r: Math.min(box.r, row.r), t: row.t, b: row.b, w: row.w, h: row.h };
        }
        list.forEach((arrow, n) => {
          const dot = arrow.from && arrow.from.isConnected ? arrow.from.querySelector('.anim-dot') || arrow.from : null;
          if (!box || !dot || !box.w) {
            arrow.path.setAttribute('d', '');
            arrow.head.setAttribute('d', '');
            return;
          }
          const d = rel(dot);
          const S = { x: d.l + d.w / 2, y: d.t + d.h / 2 };
          const spread = (n - (list.length - 1) / 2) * 10;
          const midY = (headBox ? headBox.t + headBox.h / 2 : box.t + box.h / 2) + spread;
          let E;
          if (S.x <= box.l - 8) E = { x: box.l - 1, y: midY, ux: 1, uy: 0 };
          else if (S.x >= box.r + 8) E = { x: box.r + 1, y: midY, ux: -1, uy: 0 };
          else {
            const x = Math.min(Math.max(S.x + spread, box.l + 14), box.r - 14);
            E = S.y < box.t ? { x, y: box.t - 1, ux: 0, uy: 1 } : { x, y: box.b + 1, ux: 0, uy: -1 };
          }
          if (arrow.tween) {
            const t = Math.min(1, (now - arrow.tween.start) / arrow.tween.duration);
            const e = ease(t);
            E = { x: lerp(arrow.tween.from.x, E.x, e), y: lerp(arrow.tween.from.y, E.y, e), ux: E.ux, uy: E.uy };
            if (t >= 1) arrow.tween = null;
          }
          arrow.end = E;
          const base = { x: E.x - E.ux * 9, y: E.y - E.uy * 9 };
          const pull = Math.max(16, Math.min(110, Math.hypot(base.x - S.x, base.y - S.y) / 2));
          arrow.path.setAttribute('d', `M${S.x} ${S.y} C${S.x + E.ux * pull} ${S.y + E.uy * pull} ` +
            `${base.x - E.ux * pull} ${base.y - E.uy * pull} ${base.x} ${base.y}`);
          const px = -E.uy * 5.5;
          const py = E.ux * 5.5;
          arrow.head.setAttribute('d', `M${E.x} ${E.y} L${base.x + px} ${base.y + py} L${base.x - px} ${base.y - py} Z`);
        });
      });

      this.links.forEach((link) => {
        if (!link.a || !link.b || !link.a.isConnected || !link.b.isConnected) {
          link.path.setAttribute('d', '');
          link.badge.style.visibility = 'hidden';
          return;
        }
        link.badge.style.visibility = '';
        const a = rel(link.a);
        const b = rel(link.b);
        let d;
        let bx;
        let by;
        if (link.vars) { // two variables: a bracket on their left, clear of their arrows
          const x = Math.min(a.l, b.l) - 16;
          const y1 = a.t + a.h / 2;
          const y2 = b.t + b.h / 2;
          d = `M${a.l} ${y1} H${x} V${y2} H${b.l}`;
          bx = x;
          by = (y1 + y2) / 2;
        } else {
          const [top, low] = a.t <= b.t ? [a, b] : [b, a];
          if (top.b <= low.t) { // one above the other
            const x1 = top.l + top.w / 2;
            const x2 = low.l + low.w / 2;
            d = `M${x1} ${top.b} L${x2} ${low.t}`;
            const upper = link.arrays.find((arr) => arr && arr.el.isConnected && rel(arr.el).b <= low.t + 1);
            const gapTop = upper ? rel(upper.el).b : top.b;
            // the lower array's own top: above its boxes sits its class name, which the verdict must not cover
            const lower = link.arrays.find((arr) => arr && arr !== upper && arr.el.isConnected && rel(arr.el).t >= gapTop - 1);
            const gapBottom = lower ? Math.min(rel(lower.el).t, low.t) : low.t;
            bx = (x1 + x2) / 2;
            by = (Math.max(gapTop, top.b) + gapBottom) / 2;
          } else { // side by side
            const [lft, rgt] = a.l <= b.l ? [a, b] : [b, a];
            d = `M${lft.r} ${lft.t + lft.h / 2} L${rgt.l} ${rgt.t + rgt.h / 2}`;
            bx = (lft.r + rgt.l) / 2;
            by = (lft.t + lft.h / 2 + rgt.t + rgt.h / 2) / 2;
          }
        }
        link.path.setAttribute('d', d);
        link.badge.style.transform = `translate(${bx}px, ${by}px) translate(-50%, -50%)`;
      });
    }

    // Keep the arrows on their boxes while anything is still moving.
    follow() {
      if (this.trackFrame) window.cancelAnimationFrame(this.trackFrame);
      this.trackFrame = 0;
      this.drawLinks();
      if (!this.moving) return;
      const until = this.motionEnd + 60;
      const tick = safe(() => {
        this.trackFrame = 0;
        this.drawLinks();
        if (performance.now() < until) this.trackFrame = window.requestAnimationFrame(tick);
        else if (this.layoutPending) this.scheduleLayout();
      });
      this.trackFrame = window.requestAnimationFrame(tick);
    }

    // ---- console, print flights and flows ------------------------------------------------

    updateConsole(seg, k) {
      this.newOut = null;
      this.newErr = null;
      if (this.moving && this.consoleAt === k - 1) {
        this.out.querySelectorAll('.anim-out-new').forEach((n) => n.classList.remove('anim-out-new'));
        this.appendOutput(seg.steps[k], true);
      } else {
        this.out.textContent = '';
        for (let i = 0; i <= k; i += 1) this.appendOutput(seg.steps[i], i === k);
      }
      this.consoleAt = k;
      this.out.scrollTop = this.out.scrollHeight;
    }

    appendOutput(step, latest) {
      if (step.print) {
        const span = make('span', latest ? 'anim-out-new' : null, step.print);
        this.out.appendChild(span);
        if (latest) this.newOut = span;
      }
      if (step.error) {
        if (this.out.textContent && !this.out.textContent.endsWith('\n')) this.out.appendChild(document.createTextNode('\n'));
        const err = make('span', 'anim-error', step.error);
        this.out.append(err, document.createTextNode('\n'));
        if (latest) this.newErr = err;
      }
    }

    launch(step, sources) {
      const where = (t) => {
        const key = targetKey(t);
        if (sources.has(key)) return sources.get(key);
        const el = this.resolve(t);
        return el ? rectIn(el, this.root) : null;
      };
      const flows = Array.isArray(step.flow) ? step.flow : [];
      flows.forEach((f, n) => {
        const from = where(f.from);
        const toEl = this.resolve(f.to);
        if (from && toEl) this.fly(String(f.text === undefined ? '' : f.text), from, rectIn(toEl, this.root), n * MS.flowGap, false);
      });
      const after = flows.length ? (flows.length - 1) * MS.flowGap + MS.flight - 100 : 0;
      if (this.newOut) {
        const span = this.newOut;
        const text = step.print.replace(/\n+$/, '');
        const from = step.from ? where(step.from) : null;
        if (from && text.trim()) {
          span.classList.add('anim-pending');
          const box = span.getClientRects()[0];
          const rootBox = this.root.getBoundingClientRect();
          const to = box ? { x: box.left - rootBox.left, y: box.top - rootBox.top, w: box.width, h: box.height } : null;
          if (to) {
            this.fly(text, from, to, after, true).then(() => {
              span.classList.remove('anim-pending');
              if (typeof span.animate === 'function') {
                span.animate([{ backgroundColor: 'rgba(231, 111, 0, .75)' }, { backgroundColor: 'rgba(231, 111, 0, .3)' }], { duration: 500 });
              }
            });
          } else {
            span.classList.remove('anim-pending');
          }
        } else {
          this.animate(span, [{ opacity: 0 }, { opacity: 1 }], { duration: 320, delay: after });
        }
      }
      if (step.error) {
        const shaken = [];
        this.arrays.forEach((item) => {
          if (item.twoD) return;
          if (item.ghost) shaken.push(item.ghost);
          else item.boxes.querySelectorAll('.anim-hl').forEach((el) => shaken.push(el));
        });
        shaken.forEach((el) => this.animate(el, [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' },
          { transform: 'translateX(7px)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(3px)' },
          { transform: 'translateX(0)' }], { duration: MS.shake, delay: 180, easing: 'ease-in-out' }));
        if (this.newErr) {
          this.animate(this.newErr, [{ opacity: 0, textShadow: '0 0 0 rgba(255, 107, 107, 0)' },
            { opacity: 1, textShadow: '0 0 12px rgba(255, 107, 107, .9)' }, { opacity: 1, textShadow: '0 0 0 rgba(255, 107, 107, 0)' }],
          { duration: 900, delay: 300 });
        }
      }
    }

    // A value lifts off one element and flies (on an arc) to another, or into the console.
    fly(text, from, to, delay, land) {
      const token = make('span', `anim-token${land ? ' anim-token-print' : ''}`, text);
      this.flyLayer.appendChild(token);
      const tw = token.offsetWidth;
      const th = token.offsetHeight;
      const room = this.root.clientWidth - 4;
      const startScale = land ? Math.min(1.35, Math.max(0.6, (room - 8) / Math.max(1, tw))) : 1.15;
      const endScale = land ? 1 : 0.85;
      const sx = from.x + from.w / 2 - (tw * startScale) / 2;
      const sy = from.y + from.h / 2 - (th * startScale) / 2;
      const inset = land ? (parseFloat(getComputedStyle(token).paddingLeft) || 0) + (parseFloat(getComputedStyle(token).borderLeftWidth) || 0) : 0;
      const ex = land ? to.x - inset : to.x + to.w / 2 - (tw * endScale) / 2;
      const ey = land ? to.y - (th - to.h) / 2 : to.y + to.h / 2 - (th * endScale) / 2;
      const lift = Math.min(110, 34 + Math.abs(ex - sx) * 0.18);
      const cx = (sx + ex) / 2;
      const cy = Math.min(sy, ey) - lift;
      const frames = [];
      for (let i = 0; i <= 12; i += 1) {
        const t = i / 12;
        const scale = lerp(startScale, endScale, t);
        const free = (1 - t) ** 2 * sx + 2 * (1 - t) * t * cx + t ** 2 * ex;
        const x = Math.max(4, Math.min(free, room - tw * scale)); // the token never leaves the card
        const y = (1 - t) ** 2 * sy + 2 * (1 - t) * t * cy + t ** 2 * ey;
        let opacity = 1;
        if (i === 0) opacity = 0;
        if (!land && i === 12) opacity = 0;
        frames.push({ offset: t, opacity, transform: `translate(${x}px, ${y}px) scale(${scale})` });
      }
      const anim = this.animate(token, frames, { duration: MS.flight, delay, easing: GLIDE, fill: 'both' });
      if (!anim) {
        token.remove();
        return Promise.resolve();
      }
      return anim.finished.then(() => token.remove(), () => token.remove());
    }

    showCaption(seg, step, k) {
      let lead = `Step ${this.pos + 1} of ${this.order.length}.`;
      if (k === 0) {
        const title = String(seg.title || '');
        const end = /[.?!]$/.test(title) ? '' : '.';
        lead += this.segTag.textContent ? ` ${this.segTag.textContent}: ${title}${end}` : ` ${title}${end}`;
      }
      this.captionLead.textContent = `${lead} `;
      fillCaption(this.captionText, step.caption || '');
    }

    // ---- resizing ---------------------------------------------------------------------------

    watch() {
      const relayout = () => this.scheduleLayout();
      if (typeof ResizeObserver === 'function') {
        this.observer = new ResizeObserver(relayout);
        this.observer.observe(this.stage);
        this.observer.observe(this.memory);
      } else {
        this.onResize = relayout;
        window.addEventListener('resize', relayout);
      }
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout, () => {});
    }

    scheduleLayout() {
      if (this.layoutFrame || this.destroyed) return;
      this.layoutFrame = window.requestAnimationFrame(safe(() => {
        this.layoutFrame = 0;
        if (this.trackFrame) { // a step is moving: lay out again when it ends
          this.layoutPending = true;
          return;
        }
        this.layoutPending = false;
        const wasMoving = this.moving;
        this.moving = false;
        this.root.classList.add('anim-instant');
        this.layoutOverlays();
        this.drawLinks();
        void this.root.offsetWidth;
        this.root.classList.remove('anim-instant');
        this.moving = wasMoving;
      }));
    }
  }

  // ---- finding and loading the placeholders --------------------------------------

  function fail(root, err) {
    console.warn('lab animation could not be loaded:', err);
    root.textContent = '';
    root.classList.add('anim-root', 'anim-failed');
    root.setAttribute('data-anim-state', 'failed');
    root.appendChild(make('p', 'anim-fail-msg',
      'This animation could not be loaded. The rest of the guide still works.'));
  }

  function start(root, data, options) {
    checkData(data);
    root.stepper = new Stepper(root, data, options);
    root.setAttribute('data-anim-state', 'ready');
    return root.stepper;
  }

  function load(root) {
    if (root.getAttribute('data-anim-state')) return;
    root.setAttribute('data-anim-state', 'loading');
    const id = root.getAttribute('data-anim') || '';
    const src = root.getAttribute('data-src') || `animations/${encodeURIComponent(id)}.json`;
    Promise.resolve()
      .then(() => fetch(src, { credentials: 'same-origin' }))
      .then((response) => {
        if (!response.ok) throw new Error(`${src}: HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => start(root, data))
      .catch((err) => {
        try {
          fail(root, err);
        } catch (ignored) {
          // nothing more can be done for this placeholder
        }
      });
  }

  // Draws an animation from data already in memory (no fetch) into any element.
  function mount(element, data, options) {
    if (!element || element.nodeType !== 1) throw new TypeError('LabStepper.mount needs an element');
    if (element.stepper && typeof element.stepper.destroy === 'function') element.stepper.destroy();
    let stepper = null;
    try {
      stepper = start(element, data, options);
    } catch (err) {
      fail(element, err);
    }
    return {
      destroy() {
        if (stepper) stepper.destroy();
        else {
          element.textContent = '';
          element.classList.remove('anim-root', 'anim-failed');
          element.removeAttribute('data-anim-state');
        }
      },
    };
  }

  const scan = safe(() => {
    document.querySelectorAll('.lab-anim').forEach((root) => load(root));
  });

  window.LabStepper = { mount, scan };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
})();
