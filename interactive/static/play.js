/* "Try it" puzzles for the lab guide.
 *
 * Every <div class="lab-play" data-play="ID"> on the page becomes a small puzzle
 * card that teaches its section's idea through play: three to five short rounds,
 * each something to click, judge or predict, with a "why" for every wrong answer.
 *
 * The puzzle comes from the element's data-src attribute, or from puzzles/ID.json
 * next to the page. A puzzle names one of the TYPES below; a round may name a
 * type of its own. Values are drawn from the file's pools on every play, and
 * every answer is worked out here from those values, never stored in the file.
 *
 *   {id, section, type, title, intro, shuffle?, rounds: [round], ...pools}
 *   round: {type?, prompt?, right?, why: "text" | {key: "text", "*": "text"}, ...}
 *   Texts are plain, `backticks` mark code and {name} is filled in from the round.
 *
 * Solving the last round celebrates inside the card, gives it the class
 * play-solved, remembers the puzzle in localStorage ("lab:<body data-lab>:play")
 * and fires document "lab:play" with {detail: {id, section, done: true, mistakes}}.
 * No libraries and no network requests but the JSON. Everything works from the
 * keyboard, feedback is announced, and with prefers-reduced-motion nothing moves.
 */
(() => {
  'use strict';

  if (window.LabPlay) return; // loaded twice: the first copy does the work

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const SPRING = 'cubic-bezier(.34, 1.56, .64, 1)';
  const GLIDE = 'cubic-bezier(.45, 0, .25, 1)';
  const MS = { pop: 420, fly: 560, glide: 560, shake: 420, draw: 560, stagger: 110, beat: 520 };
  const ORDINALS = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth',
    'ninth', 'tenth', 'eleventh', 'twelfth'];
  const NUL = "'\\u0000'";
  const EMPTY = { empty: true };
  const DEFAULTS = { byte: '0', short: '0', int: '0', long: '0', float: '0.0', double: '0.0', boolean: 'false',
    char: NUL };
  const OBJECT_HUES = ['pink', 'teal', 'purple', 'blue'];
  const CONFETTI = ['teal', 'purple', 'pink', 'gold', 'green', 'blue', 'orange'];
  const KEYWORDS = new Set((
    'abstract boolean break byte case catch char class continue default do double else enum extends final ' +
    'finally float for if implements import instanceof int interface long new package private protected ' +
    'public return short static super switch this throw throws try var void while true false null').split(' '));
  const TOKENS = /"(?:[^"\\]|\\.)*"?|'(?:[^'\\]|\\.)*'?|\/\/.*|[A-Za-z_$][\w$]*|\d+(?:\.\d+)?/g;
  const ICONS = {
    check: '<path d="m5 12.5 4.4 4.4L19 7.4" fill="none" stroke="currentColor" stroke-width="2.8" ' +
      'stroke-linecap="round" stroke-linejoin="round"/>',
    cross: '<path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
    hint: '<path d="M12 3.2a6.3 6.3 0 0 0-3.6 11.5c.7.5 1.1 1.2 1.1 2v.6h5v-.6c0-.8.4-1.5 1.1-2A6.3 6.3 0 0 0 12 3.2Z" ' +
      'fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9.8 20.6h4.4" ' +
      'stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    next: '<path d="m9 5.5 6.5 6.5L9 18.5" fill="none" stroke="currentColor" stroke-width="2.6" ' +
      'stroke-linecap="round" stroke-linejoin="round"/>',
    replay: '<path d="M5.2 12.6A7 7 0 1 0 7.4 6.3" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round"/><path d="M6.6 2.6v4.6h4.6" fill="none" stroke="currentColor" stroke-width="2.4" ' +
      'stroke-linecap="round" stroke-linejoin="round"/>',
    stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="2.2" fill="currentColor"/>',
    go: '<path d="M7.5 5.2v13.6L18.6 12z" fill="currentColor" stroke="currentColor" stroke-width="1.2" ' +
      'stroke-linejoin="round"/>',
    plus: '<path d="M12 5.5v13M5.5 12h13" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/>',
    target: '<circle cx="12" cy="12" r="8.2" fill="none" stroke="currentColor" stroke-width="2.2"/>' +
      '<circle cx="12" cy="12" r="3.4" fill="currentColor"/>',
    crown: '<path d="M3.2 8.6 7.6 12.4 12 5l4.4 7.4 4.4-3.8L19 17.6H5z" fill="currentColor" ' +
      'stroke="rgba(60,40,0,.45)" stroke-width="1" stroke-linejoin="round"/>' +
      '<rect x="5" y="18.6" width="14" height="2.6" rx="1.2" fill="currentColor"/>' +
      '<circle cx="12" cy="4.6" r="1.7" fill="currentColor"/><circle cx="3.2" cy="8.4" r="1.4" ' +
      'fill="currentColor"/><circle cx="20.8" cy="8.4" r="1.4" fill="currentColor"/>',
    magnifier: '<circle cx="10" cy="10" r="6.2" fill="rgba(255,255,255,.92)" stroke="currentColor" ' +
      'stroke-width="2.6"/><path d="m14.7 14.7 5.6 5.6" stroke="currentColor" stroke-width="3.4" ' +
      'stroke-linecap="round"/>',
    star: '<path d="M12 2.8 14.6 9l6.6.5-5 4.3 1.6 6.5L12 16.8l-5.8 3.5 1.6-6.5-5-4.3L9.4 9z" fill="currentColor" ' +
      'stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>',
    swap: '<path d="M6 8.5h12m-3.5-3.5L18 8.5 14.5 12M18 15.5H6m3.5-3.5L6 15.5 9.5 19" fill="none" ' +
      'stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>',
    join: '<path d="M4.5 12h5M14.5 12h5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M9.5 7.5a4.5 4.5 0 0 1 0 9M14.5 7.5a4.5 4.5 0 0 0 0 9" fill="none" stroke="currentColor" ' +
      'stroke-width="2.4" stroke-linecap="round"/>',
    bug: '<ellipse cx="12" cy="13.5" rx="5" ry="6.3" fill="currentColor"/><path d="M12 7.2v12.6" stroke="#FFFFFF" ' +
      'stroke-width="1.4"/><path d="M9.2 7.6 7.4 5.2M14.8 7.6l1.8-2.4M7 12H3.6M17 12h3.4M7.4 16.4l-3 1.8M16.6 16.4l3 1.8" ' +
      'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  };
  const SHOW_CHAR = { ' ': '␣', '\n': '⏎', '\t': '⇥' }; // ␣ ⏎ ⇥: whitespace you can see

  // ---- small helpers ----------------------------------------------------------------

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

  function icon(name, cls) {
    const svg = svgNode('svg', { viewBox: '0 0 24 24', 'aria-hidden': 'true', focusable: 'false',
      class: `play-icon${cls ? ` ${cls}` : ''}` });
    svg.innerHTML = ICONS[name] || '';
    return svg;
  }

  // Runs fn, and reports instead of throwing: a puzzle must never break the page.
  function safe(fn) {
    return function guarded(...args) {
      try {
        return fn.apply(this, args);
      } catch (err) {
        console.warn('lab puzzle:', err);
        return undefined;
      }
    };
  }

  const has = (obj, key) => obj !== null && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, key);
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (list) => list[rnd(list.length)];
  const range = (n) => Array.from({ length: n }, (_, i) => i);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const still = () => Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i -= 1) {
      const j = rnd(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const sample = (list, k) => shuffle(list).slice(0, k);

  // {name} placeholders are filled from vars; anything else in braces (Java's {1, 2}) is left alone.
  function fmt(text, vars) {
    return String(text === undefined || text === null ? '' : text)
      .replace(/\{(\w+)\}/g, (whole, key) => (vars && has(vars, key) ? String(vars[key]) : whole));
  }

  // Texts are plain text in which `backticks` mark code.
  function rich(node, text) {
    node.textContent = '';
    String(text).split('`').forEach((part, i) => {
      if (part) node.appendChild(i % 2 ? make('code', null, part) : document.createTextNode(part));
    });
    return node;
  }

  // One line of Java, lightly coloured like the guide's code blocks (appends to node).
  function fillCode(node, text) {
    let last = 0;
    for (const match of text.matchAll(TOKENS)) {
      const word = match[0];
      let kind = null;
      if (word[0] === '"' || word[0] === "'") kind = 'play-tok-str';
      else if (word.startsWith('//')) kind = 'play-tok-com';
      else if (/^\d/.test(word)) kind = 'play-tok-num';
      else if (KEYWORDS.has(word)) kind = 'play-tok-kw';
      if (!kind) continue;
      if (match.index > last) node.appendChild(document.createTextNode(text.slice(last, match.index)));
      const tok = make('span', kind, word);
      if (word[0] === '"' && word.includes('\\')) { // an escape inside a literal stands out: \n is one character
        tok.textContent = '';
        word.split(/(\\.)/).forEach((bit, k) => { if (bit) tok.appendChild(k % 2 ? make('span', 'play-tok-esc', bit) : document.createTextNode(bit)); });
      }
      node.appendChild(tok);
      last = match.index + word.length;
    }
    if (last < text.length) node.appendChild(document.createTextNode(text.slice(last)));
  }

  function animate(el, frames, opts) {
    if (still() || !el || typeof el.animate !== 'function') return Promise.resolve();
    try {
      return el.animate(frames, opts).finished.then(() => {}, () => {});
    } catch (err) {
      return Promise.resolve();
    }
  }

  const SHAKE = [{ transform: 'translateX(0)' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' },
    { transform: 'translateX(-4px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }];
  const POP = [{ transform: 'scale(.4)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: 0.6 },
    { transform: 'scale(1)', opacity: 1 }];
  const shake = (el) => animate(el, SHAKE, { duration: MS.shake, easing: 'ease-out' });
  const pop = (el, delay) => animate(el, POP, { duration: MS.pop, easing: 'ease-out', delay: delay || 0, fill: 'backwards' });
  const wait = (ms) => new Promise((resolve) => { window.setTimeout(resolve, still() ? 0 : ms); });

  // ---- Java values --------------------------------------------------------------------

  const defaultOf = (elem) => (has(DEFAULTS, elem) ? DEFAULTS[elem] : 'null');

  // A value as Java source: "Lee" for a String, 'A' for a char, 2.0 for a double.
  function lit(elem, v) {
    if (v === null || v === undefined) return 'null';
    if (elem === 'String') return `"${v}"`;
    if (elem === 'char') return v === NUL ? NUL : `'${v}'`;
    if ((elem === 'double' || elem === 'float') && typeof v === 'number' && Number.isInteger(v)) return `${v}.0`;
    return String(v);
  }
  const literal = (elem, values) => `{${values.map((v) => lit(elem, v)).join(', ')}}`;
  // As println and Arrays.toString show it.
  function shown(elem, v) {
    if (v === null || v === undefined) return 'null';
    if ((elem === 'double' || elem === 'float') && typeof v === 'number' && Number.isInteger(v)) return `${v}.0`;
    return String(v);
  }
  const toStr = (elem, values) => `[${values.map((v) => shown(elem, v)).join(', ')}]`;

  function sameValues(a, b) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }

  // ---- pieces of a picture ---------------------------------------------------------------

  // What a box shows: a literal, "null", "?" when empty, or the NUL character's faint name and number.
  // A String's characters (elem "text") show bare, with a space, a tab and a new line made visible.
  function paint(box, elem, v) {
    box.querySelectorAll(':scope > .play-val, :scope > .play-num').forEach((n) => n.remove());
    if (elem === 'text') {
      box.classList.toggle('play-space', has(SHOW_CHAR, v));
      const val = make('span', 'play-val', has(SHOW_CHAR, v) ? SHOW_CHAR[v] : v);
      box.appendChild(val);
      return val;
    }
    const empty = v === EMPTY;
    const nul = elem === 'char' && v === NUL;
    box.classList.toggle('play-empty', empty);
    box.classList.toggle('play-faint', nul);
    box.classList.toggle('play-isnull', v === null);
    if (nul) {
      box.append(make('span', 'play-val', 'NUL'), make('span', 'play-num', '0'));
      return box.firstElementChild;
    }
    const val = make('span', 'play-val', empty ? '?' : lit(elem, v));
    box.appendChild(val);
    return val;
  }

  const spoken = (elem, v) => (v === EMPTY ? 'empty' : (elem === 'char' && v === NUL ? 'the NUL character' : lit(elem, v)));
  const widthOf = (elem, v) => (v === EMPTY ? 1 : (elem === 'char' && v === NUL ? 3 : lit(elem, v).length));

  function codeView(lines) {
    const el = make('div', 'play-code');
    const view = { el, lines: [], parts: {} };
    view.set = (list) => {
      el.textContent = '';
      view.lines = [];
      view.parts = {};
      list.forEach((line) => {
        const row = make('div', 'play-line');
        const segs = Array.isArray(line) ? line.slice() : [{ text: String(line) }];
        const first = segs[0] ? String(segs[0].text) : '';
        const indent = first.length - first.trimStart().length;
        if (segs[0]) segs[0] = { ...segs[0], text: first.trimStart() };
        row.style.setProperty('--play-indent', indent);
        segs.forEach((seg) => {
          if (seg.part) {
            const span = make('span', `play-part play-part-${seg.part}`);
            if (seg.part.startsWith('blank')) {
              span.textContent = seg.text;
              span.classList.add('play-blank');
            } else fillCode(span, seg.text);
            row.appendChild(span);
            view.parts[seg.part] = span;
          } else fillCode(row, seg.text);
        });
        el.appendChild(row);
        view.lines.push(row);
      });
    };
    view.on = (i, on) => { if (view.lines[i]) view.lines[i].classList.toggle('play-line-on', Boolean(on)); };
    view.part = (name, on) => { if (view.parts[name]) view.parts[name].classList.toggle('play-part-on', Boolean(on)); };
    view.tick = (i) => {
      const row = view.lines[i];
      if (!row || row.querySelector('.play-line-tick')) return;
      const t = make('span', 'play-line-tick');
      t.appendChild(icon('check'));
      row.appendChild(t);
      pop(t);
    };
    view.set(lines);
    return view;
  }

  function consoleView() {
    const el = make('div', 'play-console');
    const out = make('div', 'play-console-out');
    el.append(make('div', 'play-console-head', 'console'), out);
    let open = null; // the line print() is still adding to
    const view = {
      el,
      print(text, cls) { // like System.out.print
        if (!open) {
          open = make('div', 'play-out');
          out.appendChild(open);
        }
        const bit = make('span', cls || 'play-out-new', text);
        out.querySelectorAll('.play-out-new').forEach((n) => n.classList.remove('play-out-new'));
        open.appendChild(bit);
        out.scrollTop = out.scrollHeight;
        return bit;
      },
      println(text, cls) { // like System.out.println
        const bit = text ? view.print(text, cls) : null;
        if (!bit && !open) out.appendChild(make('div', 'play-out', ''));
        open = null;
        return bit;
      },
      text: () => Array.from(out.children).map((n) => n.textContent).join('\n'),
    };
    return view;
  }

  // A labelled value: a variable's name over its cell, or a key = value pill.
  function readout(label, value, cls) {
    const el = make('span', `play-read${cls ? ` ${cls}` : ''}`);
    const k = make('span', 'play-read-k');
    fillCode(k, label);
    const v = make('span', 'play-read-v', value);
    el.append(k, v);
    return {
      el,
      set(x, flash) {
        if (v.textContent === String(x)) return;
        v.textContent = String(x);
        if (flash) pop(v);
      },
    };
  }

  function btn(text, opts) {
    const o = opts || {};
    const b = make('button', `play-btn${o.primary ? ' play-primary' : ''}${o.cls ? ` ${o.cls}` : ''}`);
    b.type = 'button';
    const words = rich(make('span', 'play-btn-text'), text);
    if (o.icon && o.after) b.append(words, icon(o.icon));
    else if (o.icon) b.append(icon(o.icon), words);
    else b.append(words);
    if (o.label) b.setAttribute('aria-label', o.label);
    if (o.onClick) {
      b.addEventListener('click', safe((event) => {
        if (b.disabled || b.getAttribute('aria-disabled') === 'true') return;
        o.onClick(event);
      }));
    }
    return b;
  }

  // A wrong option stays visible, marked, and can't be chosen again.
  function tried(b) {
    b.classList.add('play-tried');
    b.setAttribute('aria-disabled', 'true');
    if (!b.querySelector('.play-tried-mark')) b.appendChild(icon('cross', 'play-tried-mark'));
    shake(b);
  }

  function lockAll(container, except) {
    container.querySelectorAll('button').forEach((b) => {
      if (b !== except) b.setAttribute('aria-disabled', 'true');
    });
  }

  // An array drawn the way the lecture draws one: a row of boxes, each over its blue index pill.
  function arrayRow(o) {
    const el = make('div', `play-array play-hue-${o.hue || 'teal'}`);
    if (o.name && o.showName !== false) el.appendChild(make('div', 'play-array-name', o.name));
    const track = make('div', 'play-cells');
    el.appendChild(track);
    const row = { el, track, cells: [], boxes: [], values: o.values.slice(), elem: o.elem, name: o.name };
    const chars = Math.max(1, ...o.values.map((v) => widthOf(o.elem, v)), o.chars || 1);
    el.style.setProperty('--play-chars', chars);
    if (chars * o.values.length > 22) el.classList.add('play-long'); // compact on a narrow card
    const label = o.label ? (i) => o.label(i, row.values[i]) : (i) => `${o.name}[${i}], holding ${spoken(o.elem, row.values[i])}`;
    o.values.forEach((v, i) => {
      const cell = make('div', 'play-cell');
      const box = make(o.clickable ? 'button' : 'div', 'play-box');
      if (o.clickable) {
        box.type = 'button';
        box.setAttribute('aria-label', label(i));
        box.addEventListener('click', safe(() => {
          if (box.getAttribute('aria-disabled') === 'true') return;
          o.onClick(i);
        }));
      }
      paint(box, o.elem, v);
      const idx = make('span', 'play-idx');
      idx.appendChild(make('span', null, String(i)));
      cell.append(box, idx);
      track.appendChild(cell);
      row.cells.push(cell);
      row.boxes.push(box);
    });
    if (o.ghost) { // the box one past the end, which does not exist
      const cell = make('div', 'play-cell play-ghost-cell');
      const box = make('div', 'play-box play-ghost');
      box.appendChild(icon('cross'));
      const idx = make('span', 'play-idx');
      idx.appendChild(make('span', null, String(o.values.length)));
      cell.append(box, idx);
      track.appendChild(cell);
      row.ghost = cell;
    }
    row.set = (i, v, how) => {
      const box = row.boxes[i];
      const old = box.querySelector(':scope > .play-val');
      const leaving = how && old && !still() ? old.cloneNode(true) : null;
      row.values[i] = v;
      const fresh = paint(box, row.elem, v);
      if (o.clickable) box.setAttribute('aria-label', label(i));
      if (leaving) {
        leaving.classList.add('play-val-old');
        box.appendChild(leaving);
        animate(leaving, [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-16px)' }],
          { duration: 360, easing: 'ease-in' }).then(() => leaving.remove());
      }
      if (how) pop(fresh, how === 'late' ? 120 : 0);
    };
    row.relabel = (i) => { if (o.clickable) row.boxes[i].setAttribute('aria-label', label(i)); };
    // A marker under the boxes (like "i = 2") that glides from box to box.
    row.marker = (text, tone) => {
      track.classList.add('play-has-marks');
      const m = make('div', `play-mark play-tone-${tone || 'orange'}`);
      const words = make('span', 'play-mark-text', text);
      m.appendChild(words);
      track.appendChild(m);
      m.say = (t) => { words.textContent = t; };
      return m;
    };
    // A badge over the boxes (the crown, the magnifier).
    row.badge = (name) => {
      track.classList.add('play-has-badges');
      el.classList.add('play-array-badged');
      const b = make('div', `play-badge play-badge-${name}`);
      b.appendChild(icon(name));
      track.appendChild(b);
      return b;
    };
    row.at = (i) => { // the middle of box i, or of the place just past the end
      const cell = row.cells[i] || row.ghost;
      if (cell) return cell.offsetLeft + cell.offsetWidth / 2;
      const lastCell = row.cells[row.cells.length - 1];
      return lastCell ? lastCell.offsetLeft + lastCell.offsetWidth * 1.5 + 6 : 0;
    };
    row.place = (node, i, instant) => {
      node.playAt = i;
      if (!row.watch && typeof ResizeObserver === 'function') { // keep markers on their boxes if the card resizes
        row.watch = new ResizeObserver(safe(() => {
          if (!el.isConnected) {
            row.watch.disconnect();
            return;
          }
          track.querySelectorAll('.play-mark, .play-badge').forEach((n) => {
            if (typeof n.playAt === 'number') row.place(n, n.playAt, true);
          });
        }));
        row.watch.observe(el);
      }
      if (instant) node.classList.add('play-instant');
      node.style.transform = `translateX(${row.at(i)}px) translateX(-50%)`;
      if (instant) {
        void node.offsetWidth;
        node.classList.remove('play-instant');
      }
      row.follow(i, instant);
    };
    // On a card too narrow for the whole row, the picture scrolls to keep box i in view.
    row.follow = (i, instant) => {
      const pane = el.closest('.play-pic, .play-board');
      const cell = row.cells[i] || row.ghost;
      if (!pane || !cell || pane.scrollWidth <= pane.clientWidth + 1) return;
      const p = pane.getBoundingClientRect();
      const c = cell.getBoundingClientRect();
      const left = pane.scrollLeft + (c.left + c.width / 2) - (p.left + p.width / 2);
      pane.scrollTo({ left, behavior: instant || still() ? 'auto' : 'smooth' });
    };
    return row;
  }

  // A 2D array: a framed grid, column indexes above, row indexes on the left.
  function gridView(o) {
    const R = o.rows.length;
    const C = o.rows[0].length;
    const el = make('div', `play-grid-wrap play-hue-${o.hue || 'teal'}`);
    if (o.name) el.appendChild(make('div', 'play-array-name', o.name));
    const frame = make('div', 'play-grid');
    frame.style.gridTemplateColumns = `auto auto repeat(${C}, auto)`;
    const chars = Math.max(1, ...o.rows.flat().map((v) => widthOf(o.elem, v)));
    el.style.setProperty('--play-chars', chars);
    const at = (node, row, col, span) => {
      node.style.gridRow = String(row);
      node.style.gridColumn = span ? `${col} / span ${span}` : String(col);
      frame.appendChild(node);
      return node;
    };
    at(make('span', 'play-axis play-axis-c', 'column'), 1, 3, C);
    for (let c = 0; c < C; c += 1) {
      const pill = make('span', 'play-idx play-col-idx');
      pill.appendChild(make('span', null, String(c)));
      at(pill, 2, 3 + c);
    }
    const axisR = at(make('span', 'play-axis play-axis-r', 'row'), 3, 1);
    axisR.style.gridRow = `3 / span ${R}`;
    const view = { el, frame, boxes: [], R, C, rows: o.rows.map((r) => r.slice()) };
    const label = (r, c) => `${o.name}[${r}][${c}], holding ${spoken(o.elem, view.rows[r][c])}`;
    for (let r = 0; r < R; r += 1) {
      const pill = make('span', 'play-idx play-row-idx');
      pill.appendChild(make('span', null, String(r)));
      at(pill, 3 + r, 2);
      view.boxes.push([]);
      for (let c = 0; c < C; c += 1) {
        const box = make(o.clickable ? 'button' : 'div', 'play-box');
        if (o.clickable) {
          box.type = 'button';
          box.setAttribute('aria-label', label(r, c));
          box.addEventListener('click', safe(() => {
            if (box.getAttribute('aria-disabled') === 'true') return;
            o.onClick(r, c);
          }));
        }
        paint(box, o.elem, o.rows[r][c]);
        at(box, 3 + r, 3 + c);
        view.boxes[r].push(box);
      }
    }
    el.appendChild(frame);
    return view;
  }

  // A variable: its name over a cell. A reference variable's cell holds the dot its arrow starts from.
  function varCell(name, hue, value) {
    const el = make('div', 'play-var');
    const nameEl = make('div', 'play-var-name');
    fillCode(nameEl, name);
    const cell = make('div', 'play-var-cell');
    el.append(nameEl, cell);
    const v = { el, cell, dot: null };
    v.point = (h) => {
      cell.textContent = '';
      cell.classList.add('play-ref');
      v.dot = make('span', `play-dot play-hue-${h || hue || 'blue'}`);
      cell.appendChild(v.dot);
      return v.dot;
    };
    v.show = (text) => {
      cell.textContent = '';
      cell.classList.remove('play-ref');
      v.dot = null;
      cell.appendChild(make('span', 'play-val', text));
    };
    if (value !== undefined) v.show(value);
    else if (hue) v.point(hue);
    return v;
  }

  // An object: a card with the class name on its head and a row per field.
  function objectCard(o) {
    const el = make(o.clickable ? 'button' : 'div', `play-obj play-hue-${o.hue}`);
    if (o.clickable) el.type = 'button';
    if (o.tag) {
      const tag = make('span', 'play-obj-tag');
      fillCode(tag, o.tag);
      el.appendChild(tag);
    }
    el.appendChild(make('span', 'play-obj-head', o.cls));
    const fields = make('span', 'play-obj-fields');
    const cells = {};
    o.fields.forEach(([name, value]) => {
      const f = make('span', 'play-field');
      const k = make('span', 'play-field-name', name);
      const v = make('span', 'play-field-val');
      fillCode(v, value);
      f.append(k, v);
      fields.appendChild(f);
      cells[name] = f;
    });
    el.appendChild(fields);
    return { el, fields: cells };
  }

  // Arrows drawn over a picture, in the colour of what they point at: "an arrow, not the thing".
  class Wires {
    constructor(host, ctx) {
      this.host = host;
      this.svg = svgNode('svg', { class: 'play-wires', 'aria-hidden': 'true', focusable: 'false' });
      host.appendChild(this.svg);
      this.list = [];
      this.frame = 0;
      if (typeof ResizeObserver === 'function') {
        this.observer = new ResizeObserver(() => this.draw());
        this.observer.observe(host);
        if (ctx) ctx.onEnd(() => this.observer.disconnect());
      }
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => this.draw(), () => {});
    }

    add(from, to, hue, opts) {
      const o = opts || {};
      const w = { from, to, hue, enter: o.enter || 'auto', path: svgNode('path', { pathLength: '1' }), head: svgNode('path', {}) };
      this.paint(w, Boolean(o.hot), o.dashed);
      this.svg.append(w.path, w.head);
      this.list.push(w);
      this.draw();
      if (o.animate) {
        animate(w.path, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: MS.draw, easing: GLIDE });
        animate(w.head, [{ opacity: 0 }, { opacity: 0, offset: 0.7 }, { opacity: 1 }], { duration: MS.draw });
      }
      return w;
    }

    paint(w, hot, dashed) {
      w.hot = hot;
      const cls = `play-hue-${w.hue}${hot ? ' play-hot' : ''}${dashed ? ' play-dashed' : ''}`;
      w.path.setAttribute('class', `play-wire ${cls}`);
      w.head.setAttribute('class', `play-wire-head ${cls}`);
    }

    hot(w, on) { this.paint(w, on, false); }

    retarget(w, to, hue) {
      w.to = to;
      if (hue) w.hue = hue;
      this.paint(w, w.hot, false);
      this.draw();
      animate(w.path, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: MS.draw, easing: GLIDE });
    }

    remove(w, fade) {
      this.list = this.list.filter((x) => x !== w);
      const done = () => { w.path.remove(); w.head.remove(); };
      if (fade && !still()) {
        animate(w.path, [{ opacity: 1 }, { opacity: 0 }], { duration: 260 }).then(done);
        animate(w.head, [{ opacity: 1 }, { opacity: 0 }], { duration: 260 });
      } else done();
    }

    // Recomputed from the elements' live positions.
    draw() {
      const base = this.host.getBoundingClientRect();
      const rel = (el) => {
        const r = el.getBoundingClientRect();
        return { l: r.left - base.left, t: r.top - base.top, r: r.right - base.left, b: r.bottom - base.top,
          w: r.width, h: r.height };
      };
      const groups = new Map();
      this.list.forEach((w) => {
        if (!groups.has(w.to)) groups.set(w.to, []);
        groups.get(w.to).push(w);
      });
      groups.forEach((list) => list.forEach((w, n) => {
        if (!w.from || !w.to || !w.from.isConnected || !w.to.isConnected) {
          w.path.setAttribute('d', '');
          w.head.setAttribute('d', '');
          return;
        }
        const d = rel(w.from);
        const box = rel(w.to);
        if (!box.w || !d.w) return;
        const S = { x: d.l + d.w / 2, y: d.t + d.h / 2 };
        const spread = (n - (list.length - 1) / 2) * 12;
        let E;
        if (w.enter === 'top') E = { x: clamp(S.x + spread, box.l + 16, box.r - 16), y: box.t - 1, ux: 0, uy: 1 };
        else if (S.x <= box.l - 8) E = { x: box.l - 1, y: box.t + box.h / 2 + spread, ux: 1, uy: 0 };
        else if (S.x >= box.r + 8) E = { x: box.r + 1, y: box.t + box.h / 2 + spread, ux: -1, uy: 0 };
        else {
          const x = clamp(S.x + spread, box.l + 14, box.r - 14);
          E = S.y < box.t ? { x, y: box.t - 1, ux: 0, uy: 1 } : { x, y: box.b + 1, ux: 0, uy: -1 };
        }
        const tip = { x: E.x - E.ux * 9, y: E.y - E.uy * 9 };
        const pull = clamp(Math.hypot(tip.x - S.x, tip.y - S.y) / 2, 16, 110);
        w.path.setAttribute('d', `M${S.x} ${S.y} C${S.x + E.ux * pull} ${S.y + E.uy * pull} ` +
          `${tip.x - E.ux * pull} ${tip.y - E.uy * pull} ${tip.x} ${tip.y}`);
        const px = -E.uy * 5.5;
        const py = E.ux * 5.5;
        w.head.setAttribute('d', `M${E.x} ${E.y} L${tip.x + px} ${tip.y + py} L${tip.x - px} ${tip.y - py} Z`);
      }));
    }

    // Keep the arrows on their boxes while things glide.
    track(ms) {
      const until = performance.now() + (still() ? 0 : ms);
      const tick = () => {
        this.draw();
        if (performance.now() < until) this.frame = window.requestAnimationFrame(tick);
      };
      window.cancelAnimationFrame(this.frame);
      tick();
    }
  }

  // A value flies from one element to another (a chip into a box): over the card, in the fx layer.
  function fly(ctx, from, to, text, delay) {
    if (still()) return Promise.resolve();
    const layer = ctx.puzzle.fx;
    const base = layer.getBoundingClientRect();
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const token = make('span', 'play-token', text);
    layer.appendChild(token);
    const x0 = a.left + a.width / 2 - base.left;
    const y0 = a.top + a.height / 2 - base.top;
    const x1 = b.left + b.width / 2 - base.left;
    const y1 = b.top + b.height / 2 - base.top;
    const lift = Math.min(70, 24 + Math.abs(x1 - x0) / 6);
    const at = (x, y, s) => `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s})`;
    return animate(token, [
      { transform: at(x0, y0, 1), opacity: 0 },
      { transform: at(x0, y0, 1.05), opacity: 1, offset: 0.12 },
      { transform: at((x0 + x1) / 2, Math.min(y0, y1) - lift, 1.12), opacity: 1, offset: 0.55 },
      { transform: at(x1, y1, 0.9), opacity: 1 },
    ], { duration: MS.fly, delay: delay || 0, easing: GLIDE, fill: 'both' }).then(() => token.remove());
  }

  // The celebration: a short burst of confetti from the solved badge, inside the card.
  function confetti(layer, origin) {
    if (still()) return;
    const base = layer.getBoundingClientRect();
    const o = origin.getBoundingClientRect();
    const ox = o.left + o.width / 2 - base.left;
    const oy = o.top + o.height / 2 - base.top;
    for (let k = 0; k < 64; k += 1) {
      const shape = pick(['rect', 'rect', 'dot', 'strip']);
      const piece = make('span', `play-confetto play-c-${shape} play-hue-${pick(CONFETTI)}`);
      piece.style.left = `${ox}px`;
      piece.style.top = `${oy}px`;
      layer.appendChild(piece);
      const angle = ((-90 + (Math.random() * 2 - 1) * 75) * Math.PI) / 180;
      const speed = 120 + Math.random() * 260;
      const dx = Math.cos(angle) * speed * 1.25;
      const dy = Math.sin(angle) * speed;
      const fall = 120 + Math.random() * 180;
      const spin = (Math.random() * 2 - 1) * 900;
      const at = (x, y, r, s) => `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`;
      animate(piece, [
        { transform: at(0, 0, 0, 0.4), opacity: 1, easing: 'cubic-bezier(.1,.75,.35,1)' },
        { transform: at(dx * 0.85, dy * 0.85, spin * 0.45, 1), opacity: 1, offset: 0.3, easing: 'cubic-bezier(.45,0,.75,.6)' },
        { transform: at(dx, dy * 0.85 + fall * 0.6, spin * 0.8, 0.95), opacity: 1, offset: 0.75 },
        { transform: at(dx * 1.05, dy * 0.85 + fall, spin, 0.85), opacity: 0 },
      ], { duration: 1500 + Math.random() * 900, delay: Math.random() * 140, fill: 'both' }).then(() => piece.remove());
    }
  }

  // ---- storage -----------------------------------------------------------------------

  const store = {
    key() {
      const lab = document.body ? document.body.getAttribute('data-lab') : null;
      return `lab:${lab || 'page'}:play`;
    },
    all() {
      try {
        const v = JSON.parse(window.localStorage.getItem(this.key()));
        return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
      } catch (err) {
        return {};
      }
    },
    get(id) {
      const all = this.all();
      return has(all, id) ? all[id] : null;
    },
    put(id, record) {
      try {
        const all = this.all();
        all[id] = record;
        window.localStorage.setItem(this.key(), JSON.stringify(all));
      } catch (err) {
        // storage is blocked (private mode): the puzzle still works, it just isn't remembered
      }
    },
  };

  // ---- the card ------------------------------------------------------------------------

  let uid = 0;

  class Puzzle {
    constructor(root, data) {
      this.root = root;
      this.data = data;
      this.id = String(data.id);
      this.epoch = 0;
      this.cleanups = [];
      this.uid = (uid += 1);
      this.build();
      const saved = store.get(this.id);
      if (saved && saved.done) this.showSaved(saved);
      else this.start(false);
    }

    build() {
      const { root, data } = this;
      root.textContent = '';
      root.classList.add('play-card');
      root.setAttribute('role', 'group');
      root.setAttribute('aria-label', `Try it: ${data.title}`);
      const head = make('div', 'play-head');
      const titles = make('div', 'play-titles');
      const title = make('p', 'play-title', data.title);
      if (/[?!.]$/.test(data.title)) title.classList.add('play-title-q');
      titles.append(make('p', 'play-kicker', 'try it'), title);
      this.progress = make('div', 'play-progress');
      head.append(titles, this.progress);
      this.intro = rich(make('p', 'play-intro'), data.intro || '');
      this.body = make('div', 'play-body');
      this.feedback = make('div', 'play-feedback');
      this.feedback.id = `play-fb-${this.uid}`;
      this.feedback.setAttribute('role', 'status');
      this.feedback.setAttribute('aria-live', 'polite');
      this.feedback.setAttribute('aria-atomic', 'true');
      this.foot = make('div', 'play-foot');
      this.fx = make('div', 'play-fx');
      this.fx.setAttribute('aria-hidden', 'true');
      root.append(head, this.intro, this.body, this.feedback, this.foot, this.fx);
    }

    end() {
      this.epoch += 1;
      this.cleanups.splice(0).forEach((fn) => safe(fn)());
      this.fx.textContent = '';
    }

    start(focus) {
      const n = this.data.rounds.length;
      this.mistakes = 0;
      this.state = {};
      this.order = this.data.shuffle ? shuffle(range(n)) : range(n);
      this.k = 0;
      this.root.classList.remove('play-finished', 'play-saved');
      this.intro.hidden = false;
      this.run(focus);
    }

    renderProgress() {
      const p = this.progress;
      p.textContent = '';
      const n = this.order.length;
      const done = Math.min(this.k, n);
      const words = done >= n ? `All ${n} rounds solved` : `Round ${this.k + 1} of ${n}`;
      p.appendChild(make('span', 'play-round-label', words));
      const pips = make('span', 'play-pips');
      pips.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < n; i += 1) {
        const pip = make('span', `play-pip${i < done ? ' play-pip-done' : ''}${i === this.k && done < n ? ' play-pip-now' : ''}`);
        if (i < done) pip.appendChild(icon('check'));
        pips.appendChild(pip);
      }
      p.appendChild(pips);
    }

    run(focus) {
      this.end();
      const epoch = this.epoch;
      const round = this.data.rounds[this.order[this.k]];
      const type = round.type || this.data.type;
      this.body.textContent = '';
      this.foot.textContent = '';
      this.clearFeedback();
      this.renderProgress();
      this.root.setAttribute('data-play-type', type);
      const task = make('p', 'play-task');
      task.tabIndex = -1;
      task.appendChild(icon('target', 'play-task-icon'));
      const taskText = make('span', 'play-task-text');
      taskText.setAttribute('aria-live', 'polite');
      task.appendChild(taskText);
      this.body.appendChild(task);
      const ctx = this.context(round, epoch, taskText);
      try {
        TYPES[type](ctx);
      } catch (err) {
        console.warn('lab puzzle round:', err);
        this.say('hint', 'This round could not be drawn. Reload the page to try again.');
      }
      if (focus) task.focus({ preventScroll: true });
    }

    context(round, epoch, taskText) {
      const p = this;
      const ctx = {
        data: p.data,
        round,
        state: p.state,
        puzzle: p,
        stage: p.body,
        alive: () => p.epoch === epoch,
        task(text, vars) { rich(taskText, fmt(text, vars)); },
        why(key, vars) {
          const w = round.why;
          let text = '';
          if (typeof w === 'string') text = w;
          else if (w && typeof w === 'object') text = has(w, key) ? w[key] : (w['*'] || '');
          return fmt(text, vars);
        },
        good(text, vars) { if (ctx.alive()) p.say('good', fmt(text, vars)); },
        bad(text, vars) {
          if (!ctx.alive()) return;
          p.mistakes += 1;
          p.say('bad', fmt(text, vars));
        },
        hint(text, vars) { if (ctx.alive()) p.say('hint', fmt(text, vars)); },
        quiet() { p.clearFeedback(); },
        solved(text, vars) { if (ctx.alive()) p.roundSolved(fmt(text || 'Round solved.', vars)); },
        later(fn, ms) {
          const t = window.setTimeout(safe(() => { if (ctx.alive()) fn(); }), still() ? 0 : ms);
          p.cleanups.push(() => window.clearTimeout(t));
        },
        onEnd(fn) { p.cleanups.push(fn); },
        expose(obj) { p.root.setAttribute('data-play-round', JSON.stringify({ ...obj, round: p.k })); },
      };
      return ctx;
    }

    say(kind, text) {
      const fb = this.feedback;
      fb.textContent = '';
      fb.className = `play-feedback play-fb-${kind}`;
      const badge = make('span', 'play-fb-icon');
      badge.appendChild(icon(kind === 'good' ? 'check' : kind === 'bad' ? 'cross' : 'hint'));
      const words = make('p', 'play-fb-text');
      const lead = { good: 'Right. ', bad: 'Not quite. ', hint: 'Hint: ' }[kind] || '';
      if (lead) words.appendChild(make('strong', 'play-fb-lead', lead));
      const rest = make('span');
      rich(rest, text);
      words.appendChild(rest);
      fb.append(badge, words);
      animate(fb, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }],
        { duration: 240, easing: 'ease-out' });
      if (kind === 'bad') animate(badge, SHAKE, { duration: MS.shake, easing: 'ease-out' });
    }

    clearFeedback() {
      this.feedback.textContent = '';
      this.feedback.className = 'play-feedback';
    }

    roundSolved(text) {
      this.say('good', text);
      this.k += 1;
      this.renderProgress();
      const pips = this.progress.querySelectorAll('.play-pip-done');
      if (pips.length) pop(pips[pips.length - 1]);
      if (this.k >= this.order.length) {
        this.finish();
        return;
      }
      const next = btn('Next round', { primary: true, icon: 'next', after: true, cls: 'play-next',
        onClick: () => this.run(true) });
      next.setAttribute('aria-describedby', this.feedback.id);
      this.foot.appendChild(next);
      next.focus({ preventScroll: true });
    }

    banner(fresh, record) {
      const box = make('div', 'play-banner');
      const badge = make('span', 'play-banner-badge');
      badge.appendChild(icon('star'));
      const words = make('div', 'play-banner-words');
      words.appendChild(make('p', 'play-banner-title', 'Solved ✓'));
      const m = fresh ? this.mistakes : (record && typeof record.mistakes === 'number' ? record.mistakes : null);
      let line = 'Every play draws new values.';
      if (fresh) {
        line = m === 0 ? 'First try, no wrong answers.'
          : `Solved with ${m} wrong ${m === 1 ? 'answer' : 'answers'} on the way, each one explained.`;
      } else line = 'You solved this one earlier. Every play draws new values.';
      words.appendChild(make('p', 'play-banner-line', line));
      const again = btn('Play again', { icon: 'replay', cls: 'play-again', onClick: () => this.start(true) });
      box.append(badge, words, again);
      return { box, badge, again };
    }

    finish() {
      this.root.classList.add('play-solved', 'play-finished');
      const prev = store.get(this.id);
      const best = prev && typeof prev.best === 'number' ? Math.min(prev.best, this.mistakes) : this.mistakes;
      store.put(this.id, { done: true, mistakes: this.mistakes, best, at: new Date().toISOString() });
      const b = this.banner(true);
      this.foot.textContent = '';
      this.foot.appendChild(b.box);
      if (still()) b.box.classList.add('play-glow');
      else {
        pop(b.badge, 80);
        animate(b.box, [{ opacity: 0, transform: 'translateY(10px) scale(.98)' }, { opacity: 1, transform: 'none' }],
          { duration: 420, easing: SPRING });
        window.requestAnimationFrame(() => confetti(this.fx, b.badge));
      }
      document.dispatchEvent(new CustomEvent('lab:play', {
        detail: { id: this.id, section: this.data.section, done: true, mistakes: this.mistakes },
      }));
      b.again.focus({ preventScroll: true });
    }

    // Solved on an earlier visit: the solved state, ready to play again.
    showSaved(record) {
      this.end();
      this.order = range(this.data.rounds.length);
      this.k = this.order.length;
      this.root.classList.add('play-solved', 'play-saved');
      this.renderProgress();
      this.body.textContent = '';
      this.clearFeedback();
      this.foot.textContent = '';
      const b = this.banner(false, record);
      b.box.classList.add('play-glow');
      this.foot.appendChild(b.box);
    }
  }

  // ---- shared bits of the round types ----------------------------------------------------------

  const TYPES = Object.create(null);

  function board(ctx, cls) {
    const b = make('div', `play-board${cls ? ` ${cls}` : ''}`);
    ctx.stage.appendChild(b);
    return b;
  }

  function controls(ctx, label, cls) {
    const c = make('div', `play-controls${cls ? ` ${cls}` : ''}`);
    if (label) {
      c.setAttribute('role', 'group');
      c.setAttribute('aria-label', label);
    }
    ctx.stage.appendChild(c);
    return c;
  }

  function drawArray(ctx) {
    const pool = ctx.round.arrays || ctx.data.arrays;
    return clone(pick(pool));
  }

  const ordinal = (n) => ORDINALS[n] || `${n}th`;

  // Choice buttons, one right answer: a wrong one is explained and crossed out.
  function choices(ctx, holder, options, answer, onRight, whyOf) {
    holder.textContent = '';
    holder.classList.add('play-choices');
    let done = false;
    options.forEach((opt) => {
      const b = btn(opt.text, { label: opt.label, cls: `play-choice${opt.mono ? ' play-mono' : ''}${opt.cls ? ` ${opt.cls}` : ''}`, onClick: () => {
        if (done) return;
        if (opt.key === answer) {
          done = true;
          b.classList.add('play-right');
          b.appendChild(icon('check', 'play-right-mark'));
          lockAll(holder, b);
          pop(b.querySelector('.play-right-mark'));
          onRight(opt);
        } else {
          tried(b);
          ctx.bad(whyOf(opt));
        }
      } });
      b.setAttribute('data-key', String(opt.key));
      if (opt.node) b.querySelector('.play-btn-text').appendChild(opt.node);
      holder.appendChild(b);
    });
  }

  // ---- 1. fill: give a new array's boxes their default value ----------------------------------

  TYPES.fill = (ctx) => {
    const { round, data } = ctx;
    const elem = round.elem;
    const name = pick(round.names);
    const size = pick(round.sizes);
    const answer = defaultOf(elem);
    const value = answer === 'null' ? null : (elem === 'char' ? NUL : (answer === 'false' ? false : 0));
    const vars = { name, size, elem };
    ctx.expose({ type: 'fill', elem, name, size });
    ctx.task(round.prompt || 'A brand-new array, and nothing written to it yet. What does every box of `{name}` hold?', vars);
    const brd = board(ctx, 'play-board-fill');
    const code = codeView([`${elem}[] ${name} = new ${elem}[${size}];`]);
    const row = arrayRow({ name, elem, values: Array(size).fill(EMPTY), chars: widthOf(elem, value) });
    brd.append(code.el, row.el);
    const chips = controls(ctx, 'Pick a default value', 'play-chips');
    let done = false;
    (data.chips || []).forEach((chip) => {
      const b = btn(chip.text, { label: chip.label || chip.text, cls: 'play-chip play-mono', onClick: () => {
        if (done) return;
        if (chip.text === answer) {
          done = true;
          b.classList.add('play-right');
          lockAll(chips, b);
          code.tick(0);
          const landings = row.boxes.map((box, i) => fly(ctx, b, box, chip.text, i * MS.stagger)
            .then(() => { if (ctx.alive()) row.set(i, value, 'pop'); }));
          Promise.all(landings).then(() => {
            row.el.classList.add('play-all-good');
            ctx.solved(round.right, vars);
          });
        } else {
          tried(b);
          row.boxes.forEach((box) => shake(box));
          ctx.bad(ctx.why(chip.text, { ...vars, chip: chip.text }));
        }
      } });
      chips.appendChild(b);
    });
  };

  // ---- 2. loop: be the counting loop -------------------------------------------------------------

  TYPES.loop = (ctx) => {
    const { round } = ctx;
    const { name, elem, values } = drawArray(ctx);
    const n = values.length;
    const start = clamp(round.start || 0, 0, n);
    const vars = { name, length: n, last: n - 1, start };
    ctx.expose({ type: 'loop', name, elem, values, start });
    ctx.task(round.prompt || 'Run the loop over `{name}`: check the condition, let the body run, then `i++`.', vars);

    const brd = board(ctx, 'play-split');
    const left = make('div', 'play-col');
    const right = make('div', 'play-col');
    brd.append(left, right);
    const code = codeView([
      [{ text: 'for (' }, { text: 'int i = 0', part: 'init' }, { text: '; ' }, { text: `i < ${name}.length`, part: 'cond' },
        { text: '; ' }, { text: 'i++', part: 'inc' }, { text: ') {' }],
      `    System.out.println(${name}[i]);`,
      '}',
    ]);
    const out = consoleView();
    left.append(code.el, out.el);
    const pic = make('div', 'play-pic');
    const row = arrayRow({ name, elem, values, ghost: true });
    const mark = row.marker('i = 0');
    const reads = make('div', 'play-reads');
    const readI = readout('i', String(start));
    const readLen = readout(`${name}.length`, String(n));
    const cond = make('span', 'play-cond');
    reads.append(readI.el, readLen.el, cond);
    pic.append(row.el, reads);
    right.appendChild(pic);

    const group = controls(ctx, `Is i < ${name}.length still true?`, 'play-decide');
    let i = start;
    let phase = 'check';
    let boomed = false;
    const goBtn = btn('Keep going', { icon: 'go', cls: 'play-go', onClick: () => decide(true) });
    const stopBtn = btn('Stop', { icon: 'stop', cls: 'play-stop', onClick: () => decide(false) });
    const incBtn = btn('i++', { icon: 'plus', cls: 'play-inc play-mono', label: 'i++', onClick: () => step() });
    group.append(goBtn, stopBtn, incBtn);

    for (let k = 0; k < start; k += 1) {
      row.cells[k].classList.add('play-visited');
      out.println(shown(elem, values[k]), 'play-out-old');
    }

    function showCond(result) {
      cond.textContent = '';
      const expr = make('code', null, `${i} < ${n}`);
      cond.append(expr);
      if (result === undefined) cond.append(make('span', 'play-cond-q', '?'));
      else cond.append(make('span', `play-cond-v ${result ? 'play-true' : 'play-false'}`, result ? 'true' : 'false'));
    }

    function sync(instant) {
      readI.set(String(i), !instant);
      mark.say(`i = ${i}`);
      row.place(mark, i, instant);
      code.part('cond', phase === 'check');
      code.part('inc', phase === 'inc');
      code.on(1, phase === 'body');
      goBtn.disabled = phase !== 'check';
      stopBtn.disabled = phase !== 'check';
      incBtn.disabled = phase !== 'inc';
      row.cells.forEach((cell, k) => cell.classList.toggle('play-here', k === i && phase !== 'done'));
      if (row.ghost) row.ghost.classList.toggle('play-here', i === n && phase !== 'done');
      if (phase === 'check') showCond();
    }

    function clearMissed() {
      row.cells.forEach((cell) => cell.classList.remove('play-missed'));
    }

    function decide(keep) {
      if (phase !== 'check') return;
      clearMissed();
      if (keep && i < n) {
        showCond(true);
        phase = 'body';
        sync();
        row.cells[i].classList.add('play-visited');
        pop(row.boxes[i]);
        out.println(shown(elem, values[i]));
        ctx.good('`{i} < {length}` is true, so the body runs and prints `{name}[{i}]`.', { ...vars, i });
        ctx.later(() => {
          phase = 'inc';
          sync();
          incBtn.focus({ preventScroll: true });
        }, MS.beat);
      } else if (!keep && i >= n) {
        showCond(false);
        phase = 'done';
        row.ghost.classList.remove('play-boom');
        sync();
        mark.classList.add('play-tone-green');
        row.el.classList.add('play-all-good');
        ctx.solved(round.right, vars);
      } else if (keep) { // one pass too many: the body would read a box that doesn't exist
        showCond(false);
        if (!boomed) {
          boomed = true;
          out.println(`Exception in thread "main" java.lang.ArrayIndexOutOfBoundsException: Index ${n} out of bounds for length ${n}`,
            'play-out-err');
        }
        row.ghost.classList.add('play-boom');
        shake(row.ghost);
        ctx.bad(ctx.why('late', { ...vars, i }));
      } else { // stopped too early: the rest of the boxes are never visited
        showCond(true);
        const missed = range(n).filter((k) => k >= i);
        missed.forEach((k) => row.cells[k].classList.add('play-missed'));
        const list = missed.map((k) => `\`${name}[${k}]\``);
        const words = list.length === 1 ? list[0] : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
        ctx.bad(ctx.why('early', { ...vars, i, missed: words, count: missed.length }));
      }
    }

    function step() {
      if (phase !== 'inc') return;
      i += 1;
      phase = 'check';
      sync();
      goBtn.focus({ preventScroll: true });
    }

    window.requestAnimationFrame(() => sync(true));
    ctx.later(() => sync(true), 60);
  };

  // ---- 3. pick: click the box an index (or an instruction) names; answer questions about it ----------

  TYPES.pick = (ctx) => {
    const { round, data, state } = ctx;
    let arr;
    if (round.arrays) arr = drawArray(ctx);
    else {
      if (!state.array) state.array = clone(pick(data.arrays));
      arr = state.array;
    }
    if (arr.rows) {
      if (round.trace) pickTrace(ctx, arr);
      else pickGrid(ctx, arr);
    } else pickRow(ctx, arr);
  };

  // The index a task means, and how to say it.
  function resolve1D(t, arr) {
    const n = arr.values.length;
    const name = arr.name;
    const out = { spec: t };
    if (has(t, 'nth')) {
      out.index = t.nth === 'last' ? n - 1 : t.nth - 1;
      out.words = t.nth === 'last' ? 'the last element' : `the ${ordinal(t.nth)} element`;
    } else if (has(t, 'index')) {
      out.index = t.index === 'last' ? n - 1 : t.index;
      out.expr = t.index === 'last' ? `${name}[${name}.length - 1]` : `${name}[${t.index}]`;
    }
    return out;
  }

  function pickRow(ctx, arr) {
    const { round } = ctx;
    const { name, elem } = arr;
    const n = arr.values.length;
    const tasks = round.tasks.map((t) => resolve1D(t, arr));
    ctx.expose({ type: 'pick', name, elem, values: arr.values.slice(), tasks: round.tasks });
    const brd = board(ctx, 'play-board-pick');
    const code = codeView(['']);
    const row = arrayRow({ name, elem, values: arr.values, clickable: true, onClick: (i) => onBox(i),
      chars: Math.max(...arr.values.map((v) => widthOf(elem, v)), 2) });
    const ruler = make('div', 'play-ruler');
    const rulerLabel = make('span', 'play-ruler-label');
    ruler.appendChild(rulerLabel);
    if (round.tasks.some((t) => t.ask === 'length')) {
      row.track.appendChild(ruler);
      row.track.classList.add('play-has-ruler');
    }
    brd.append(code.el, row.el);
    const ctl = controls(ctx, 'Answers', 'play-chips');
    let k = 0;
    let stepKind = null;

    const vars = (t, more) => ({ name, length: n, last: n - 1, index: t.index, ordinal: t.words || '',
      expr: t.expr || '', ...(more || {}) });

    function boxesOn(on) {
      row.boxes.forEach((b) => b.setAttribute('aria-disabled', on ? 'false' : 'true'));
      row.el.classList.toggle('play-clickable', on);
    }

    function begin() {
      ctl.textContent = '';
      ctl.hidden = true;
      if (k >= tasks.length) {
        boxesOn(false);
        ctx.solved(round.right, { name, length: n, last: n - 1, array: toStr(elem, row.values) });
        return;
      }
      const t = tasks[k];
      const s = t.spec;
      if (s.ask) {
        stepKind = 'ask';
        boxesOn(false);
        askStep(t);
        return;
      }
      stepKind = 'click';
      boxesOn(true);
      if (s.set && has(s.set, 'value')) {
        ctx.task(s.say || 'Make {ordinal} `{value}`.', vars(t, { value: s.set.value }));
        code.set([[{ text: `${name}[` }, { text: '?', part: 'blank' }, { text: `] = ${lit(elem, s.set.value)};` }]]);
      } else if (s.set && has(s.set, 'copy')) {
        const src = resolve1D(s.set.copy, arr);
        ctx.task(s.say || 'Make {ordinal} equal to {source}.', vars(t, { source: src.words }));
        code.set([[{ text: `${name}[` }, { text: '?', part: 'blank' }, { text: '] = ' }, { text: '?', part: 'blank2' },
          { text: ';' }]]);
      } else {
        ctx.task(s.say || 'Click `{expr}`.', vars(t));
        code.set([t.expr || `${name}[?]`]);
      }
    }

    function askStep(t) {
      const s = t.spec;
      let options;
      let answer;
      let say;
      if (s.ask === 'length') {
        answer = n;
        options = [n - 1, n, n + 1];
        say = 'What is `{name}.length`?';
        code.set([`${name}.length`]);
      } else { // lastIndex
        answer = n - 1;
        options = [n - 2, n - 1, n];
        say = 'Which index holds the last element of `{name}`?';
        code.set([`${name}[?]`]);
      }
      ctx.task(s.say || say, vars(t));
      ctl.hidden = false;
      choices(ctx, ctl, options.map((v) => ({ key: v, text: String(v), mono: true })), answer, () => {
        code.set([s.ask === 'length' ? `${name}.length   // ${n}` : `${name}[${n - 1}]   // the last box`]);
        code.tick(0);
        if (s.ask === 'length') {
          rulerLabel.textContent = `length ${n}`;
          ruler.classList.add('play-on');
          ctx.good('`{name}.length` is {length}: it counts the boxes. Their indexes run from 0 to {last}.', vars(t));
        } else {
          row.cells[n - 1].classList.add('play-hit');
          ctx.good('The last element sits at index {last}, which is `{name}.length - 1`.', vars(t));
        }
        k += 1;
        ctx.later(begin, MS.beat * 2);
      }, () => ctx.why(s.ask, vars(t)));
    }

    function onBox(i) {
      if (stepKind !== 'click') return;
      const t = tasks[k];
      const s = t.spec;
      if (i !== t.index) {
        shake(row.boxes[i]);
        const key = s.index === 'last' || s.nth === 'last' ? 'last' : 'click';
        ctx.bad(ctx.why(key, vars(t, { clicked: `${name}[${i}]`, clickedOrdinal: ordinal(i + 1), clickedIndex: i })));
        return;
      }
      row.cells[i].classList.add('play-hit');
      pop(row.boxes[i]);
      if (s.set && has(s.set, 'value')) {
        stepKind = null;
        boxesOn(false);
        code.set([`${name}[${i}] = ${lit(elem, s.set.value)};`]);
        code.tick(0);
        row.set(i, s.set.value, 'pop');
        arr.values[i] = s.set.value;
        ctx.good('{ordinal} is at index {index}, so the statement is `{name}[{index}] = {value};`.',
          vars(t, { value: lit(elem, s.set.value), ordinal: capital(t.words) }));
        k += 1;
        ctx.later(begin, MS.beat * 2);
      } else if (s.set && has(s.set, 'copy')) {
        stepKind = 'copy';
        boxesOn(false);
        copyStep(t, i);
      } else {
        stepKind = null;
        boxesOn(false);
        ctx.good('`{expr}` is index {index}{extra}.', vars(t, {
          extra: s.index === 'last' ? `: \`${name}.length\` is ${n}, minus 1` : '' }));
        k += 1;
        ctx.later(() => {
          row.cells[i].classList.remove('play-hit');
          begin();
        }, MS.beat * 2);
      }
    }

    function copyStep(t, i) {
      const s = t.spec;
      const src = resolve1D(s.set.copy, arr);
      code.set([[{ text: `${name}[${i}] = ` }, { text: '?', part: 'blank2' }, { text: ';' }]]);
      ctx.task('Now pick the value of {source}.', vars(t, { source: src.words }));
      // the right box's value, and its neighbours' (the off-by-one answers)
      const near = [src.index, src.index + 1, src.index - 1, src.index + 2].filter((x) => x >= 0 && x < n && x !== i);
      const seen = new Set();
      const opts = [];
      near.forEach((x) => {
        const v = row.values[x];
        if (seen.has(lit(elem, v)) || opts.length >= 3) return;
        seen.add(lit(elem, v));
        opts.push({ key: x, text: lit(elem, v), mono: true });
      });
      ctl.hidden = false;
      choices(ctx, ctl, opts.sort((a, b) => a.key - b.key), src.index, () => {
        const v = row.values[src.index];
        code.set([`${name}[${i}] = ${name}[${src.index}];`]);
        code.tick(0);
        fly(ctx, row.boxes[src.index], row.boxes[i], lit(elem, v)).then(() => {
          if (!ctx.alive()) return;
          row.set(i, v, 'pop');
          arr.values[i] = v;
        });
        ctx.good('{source} is `{name}[{src}]`, so its value goes into `{name}[{index}]`.',
          vars(t, { source: capital(src.words), src: src.index }));
        k += 1;
        ctx.later(begin, MS.beat * 2 + MS.fly);
      }, (opt) => ctx.why('copy', vars(t, { chosen: opt.text, chosenExpr: `${name}[${opt.key}]`,
        chosenOrdinal: ordinal(opt.key + 1), source: src.words })));
    }

    begin();
  }

  const capital = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

  function gridExpr(name, part, which) {
    if (which === 'last') return part === 'row' ? `${name}.length - 1` : `${name}[0].length - 1`;
    return String(which);
  }

  function pickGrid(ctx, arr) {
    const { round } = ctx;
    const { name, elem } = arr;
    const R = arr.rows.length;
    const C = arr.rows[0].length;
    const used = new Set();
    const tasks = round.tasks.map((s) => {
      if (s.ask) return { spec: s };
      let r;
      let c;
      if (s.random) {
        let tries = 0;
        do { // a fresh cell, and mostly ones whose row and column differ (so a swap can be spotted)
          r = rnd(R);
          c = rnd(C);
          tries += 1;
        } while ((used.has(`${r},${c}`) || (r === c && tries < 30)) && tries < 60);
      } else {
        r = s.row === 'last' ? R - 1 : s.row;
        c = s.col === 'last' ? C - 1 : s.col;
      }
      used.add(`${r},${c}`);
      const rowE = s.random ? String(r) : gridExpr(name, 'row', s.row);
      const colE = s.random ? String(c) : gridExpr(name, 'col', s.col);
      return { spec: s, r, c, expr: `${name}[${rowE}][${colE}]` };
    });
    ctx.expose({ type: 'pick', name, elem, rows: arr.rows, tasks: tasks.map((t) => (t.spec.ask ? t.spec : { row: t.r, col: t.c })) });
    const brd = board(ctx, 'play-board-grid');
    const code = codeView(['']);
    const grid = gridView({ name, elem, rows: arr.rows, clickable: true, onClick: (r, c) => onCell(r, c) });
    brd.append(code.el, grid.el);
    const ctl = controls(ctx, 'Answers', 'play-chips');
    let k = 0;
    let clicking = false;
    const base = { name, rows: R, cols: C, lastRow: R - 1, lastCol: C - 1 };

    function cellsOn(on) {
      grid.boxes.flat().forEach((b) => b.setAttribute('aria-disabled', on ? 'false' : 'true'));
      grid.el.classList.toggle('play-clickable', on);
    }

    function begin() {
      ctl.textContent = '';
      ctl.hidden = true;
      grid.boxes.flat().forEach((b) => b.classList.remove('play-hit'));
      if (k >= tasks.length) {
        cellsOn(false);
        ctx.solved(round.right, base);
        return;
      }
      const t = tasks[k];
      if (t.spec.ask) {
        clicking = false;
        cellsOn(false);
        const rowsQ = t.spec.ask === 'rows';
        const answer = rowsQ ? R : C;
        const opts = Array.from(new Set([R, C, R * C, answer + 1])).slice(0, 3);
        if (!opts.includes(answer)) opts[2] = answer;
        code.set([rowsQ ? `${name}.length` : `${name}[0].length`]);
        ctx.task(t.spec.say || (rowsQ ? 'What is `{name}.length`?' : 'What is `{name}[0].length`?'), base);
        ctl.hidden = false;
        choices(ctx, ctl, opts.sort((a, b) => a - b).map((v) => ({ key: v, text: String(v), mono: true })), answer, () => {
          ctx.good(rowsQ ? '`{name}` is an array of {rows} rows, so `{name}.length` is {rows}. Each row is an array of {cols}.'
            : 'Row 0 is an array of {cols} boxes, so `{name}[0].length` is {cols}.', base);
          code.set([`${rowsQ ? `${name}.length` : `${name}[0].length`}   // ${answer}`]);
          code.tick(0);
          k += 1;
          ctx.later(begin, MS.beat * 2);
        }, () => ctx.why(rowsQ ? 'rows' : 'cols', base));
        return;
      }
      clicking = true;
      cellsOn(true);
      code.set([t.expr]);
      ctx.task(t.spec.say || 'Click `{expr}`.', { ...base, expr: t.expr });
    }

    function onCell(r, c) {
      if (!clicking) return;
      const t = tasks[k];
      const v = { ...base, expr: t.expr, r: t.r, c: t.c, cr: r, cc: c, clicked: `${name}[${r}][${c}]` };
      if (r !== t.r || c !== t.c) {
        shake(grid.boxes[r][c]);
        const swapped = r === t.c && c === t.r;
        const key = swapped ? 'swap' : (t.spec.row === 'last' || t.spec.col === 'last' ? 'last' : 'click');
        ctx.bad(ctx.why(key, v));
        return;
      }
      clicking = false;
      cellsOn(false);
      grid.boxes[r][c].classList.add('play-hit');
      pop(grid.boxes[r][c]);
      code.tick(0);
      ctx.good('`{expr}` is row {r}, column {c}, which holds {value}.', { ...v, value: lit(elem, arr.rows[r][c]) });
      k += 1;
      ctx.later(begin, MS.beat * 2);
    }

    begin();
  }

  function pickTrace(ctx, arr) {
    const { round } = ctx;
    const { name, elem, rows } = arr;
    const R = rows.length;
    const C = rows[0].length;
    const order = [];
    rows.forEach((row, r) => row.forEach((_, c) => order.push([r, c])));
    ctx.expose({ type: 'trace', name, elem, rows });
    ctx.task(round.prompt || 'Click the cells of `{name}` in the order the nested loops visit them.', { name });
    const brd = board(ctx, 'play-split');
    const left = make('div', 'play-col');
    const right = make('div', 'play-col');
    brd.append(left, right);
    const code = codeView([
      [{ text: 'for (' }, { text: `int r = 0; r < ${name}.length; r++`, part: 'outer' }, { text: ') {' }],
      [{ text: '    for (' }, { text: `int c = 0; c < ${name}[r].length; c++`, part: 'inner' }, { text: ') {' }],
      `        System.out.print(${name}[r][c] + " ");`,
      '    }',
      '    System.out.println();',
      '}',
    ]);
    const out = consoleView();
    left.append(code.el, out.el);
    const grid = gridView({ name, elem, rows, clickable: true, onClick: (r, c) => onCell(r, c) });
    grid.el.classList.add('play-clickable');
    const reads = make('div', 'play-reads');
    const readR = readout('r', '0');
    const readC = readout('c', '0');
    reads.append(readR.el, readC.el);
    const pic = make('div', 'play-pic');
    pic.append(grid.el, reads);
    right.appendChild(pic);
    let k = 0;

    function onCell(r, c) {
      if (k >= order.length) return;
      const [er, ec] = order[k];
      const vars = { name, r: er, c: ec, cr: r, cc: c, rows: R, cols: C, clicked: `${name}[${r}][${c}]` };
      if (r !== er || c !== ec) {
        shake(grid.boxes[r][c]);
        const visited = order.slice(0, k).some(([a, b]) => a === r && b === c);
        const key = visited ? 'visited' : (r === er ? 'skip' : (c === ec && r > er ? 'column' : 'jump'));
        ctx.bad(ctx.why(key, vars));
        return;
      }
      const box = grid.boxes[r][c];
      box.classList.add('play-visited', 'play-hit');
      box.setAttribute('aria-disabled', 'true');
      box.setAttribute('aria-label', `${name}[${r}][${c}], visited ${k + 1}${k === 0 ? 'st' : k === 1 ? 'nd' : k === 2 ? 'rd' : 'th'}`);
      const badge = make('span', 'play-order', String(k + 1));
      box.appendChild(badge);
      pop(badge);
      readR.set(String(r), true);
      readC.set(String(c), true);
      code.part('outer', true);
      code.part('inner', true);
      out.print(`${shown(elem, rows[r][c])} `);
      if (c === C - 1) out.println('');
      k += 1;
      grid.boxes.flat().forEach((b) => { if (b !== box) b.classList.remove('play-hit'); });
      if (k >= order.length) {
        grid.el.classList.add('play-all-good');
        const word = rows.map((row) => row.map((v) => shown(elem, v)).join('')).join('');
        ctx.solved(round.right, { name, rows: R, cols: C, word, cells: R * C });
      } else ctx.quiet();
    }
  }

  // ---- 4. wire: an array of references, wired to objects ---------------------------------------------

  TYPES.wire = (ctx) => {
    const { round, data, state } = ctx;
    const cls = data.class.name;
    if (!state.objects) {
      state.objects = sample(data.objects, data.pick || 3)
        .map((o, k) => ({ ...clone(o), hue: OBJECT_HUES[k % OBJECT_HUES.length] }));
    }
    const objs = state.objects;
    const byVar = new Map(objs.map((o) => [o.var, o]));
    if (round.array) {
      const size = round.array.size;
      const want = Array(size).fill(null);
      const count = round.assign === 'all' ? Math.min(size, objs.length) : round.assign;
      const boxes = round.assign === 'all' ? range(size).slice(0, count) : sample(range(size), count).sort((a, b) => a - b);
      const chosen = sample(objs, count);
      boxes.forEach((b, j) => { want[b] = chosen[j].var; });
      state.current = { name: round.array.name, size, want, wired: Array(size).fill(null), fresh: true };
    }
    const cur = state.current;
    const { name, size, want } = cur;
    const wiring = Boolean(round.array);
    const statements = range(size).filter((b) => want[b]).map((b) => ({ box: b, var: want[b] }));
    const unwired = range(size).filter((b) => !want[b]);
    const askBox = round.ask === 'getName' ? pick(statements).box : (unwired.length ? pick(unwired) : 0);
    ctx.expose({ type: 'wire', wiring, name, size, objects: objs.map((o) => ({ var: o.var, fields: o.fields })),
      statements: statements.map((s) => [s.box, s.var]), ask: round.ask || null, askBox: round.ask ? askBox : null });

    const brd = board(ctx, 'play-split play-solo');
    const left = make('div', 'play-col');
    const right = make('div', 'play-col');
    brd.append(left, right);
    const lines = [`${cls}[] ${name} = new ${cls}[${size}];`, ...statements.map((s) => `${name}[${s.box}] = ${s.var};`)];
    const code = codeView(lines);
    left.appendChild(code.el);
    const pic = make('div', 'play-pic play-wire-pic');
    right.appendChild(pic);
    const row = arrayRow({ name, elem: cls, values: Array(size).fill(null), clickable: wiring, onClick: (b) => onBox(b), chars: 4 });
    const cards = make('div', 'play-cards');
    const cardOf = new Map();
    objs.forEach((o) => {
      const fields = data.class.fields.map((f) => [f, typeof o.fields[f] === 'string' ? `"${o.fields[f]}"` : String(o.fields[f])]);
      const card = objectCard({ cls, hue: o.hue, fields, tag: o.var, clickable: wiring });
      card.el.setAttribute('aria-label', `the ${cls} object ${o.var}: ${fields.map(([f, v]) => `${f} ${v}`).join(', ')}`);
      if (wiring) card.el.addEventListener('click', safe(() => onCard(o.var)));
      cards.appendChild(card.el);
      cardOf.set(o.var, card);
    });
    pic.append(row.el, cards);
    const wires = new Wires(pic, ctx);

    function label(b) {
      return cur.wired[b] ? `${name}[${b}]: points at ${cur.wired[b]}` : `${name}[${b}]: null`;
    }

    function connect(b, v, animated) {
      cur.wired[b] = v;
      const o = byVar.get(v);
      const box = row.boxes[b];
      box.querySelectorAll('.play-val').forEach((n) => n.remove());
      box.classList.remove('play-isnull');
      box.classList.add('play-holds-ref');
      const dot = make('span', `play-dot play-hue-${o.hue}`);
      box.appendChild(dot);
      if (wiring) box.setAttribute('aria-label', label(b));
      if (animated) pop(dot);
      return wires.add(dot, cardOf.get(v).el, o.hue, { animate: animated, enter: 'top' });
    }

    // the wiring so far (an ask round shows the finished array)
    const arrows = new Map();
    range(size).forEach((b) => {
      if (cur.wired[b]) arrows.set(b, connect(b, cur.wired[b], false));
      else if (wiring) row.boxes[b].setAttribute('aria-label', label(b));
    });
    statements.forEach((s, j) => { if (cur.wired[s.box] === s.var) code.tick(j + 1); });

    let selected = null;
    const vars = { name, cls };

    function select(b) {
      selected = b;
      row.boxes.forEach((box, j) => {
        box.classList.toggle('play-selected', j === b);
        box.setAttribute('aria-pressed', j === b ? 'true' : 'false');
      });
      pic.classList.toggle('play-picking', b !== null);
    }

    function onBox(b) {
      if (cur.wired[b]) {
        ctx.hint('`{name}[{box}]` is wired already. Pick a box that is still `null`.', { ...vars, box: b });
        return;
      }
      select(selected === b ? null : b);
      if (selected !== null) ctx.hint('Now click the object `{name}[{box}]` should point at.', { ...vars, box: b });
    }

    function onCard(v) {
      if (selected === null) {
        ctx.hint('Pick a box first: click one of `{name}`\'s boxes, then the object it points at.', vars);
        shake(cardOf.get(v).el);
        return;
      }
      const b = selected;
      const o = byVar.get(v);
      const expected = want[b];
      const more = { ...vars, box: b, chosen: v, chosenName: o.fields.name, expected: expected || '',
        expectedName: expected ? byVar.get(expected).fields.name : '' };
      if (expected !== v) {
        shake(cardOf.get(v).el);
        ctx.bad(ctx.why(expected ? 'wrong' : 'unassigned', more));
        return;
      }
      select(null);
      arrows.set(b, connect(b, v, true));
      code.tick(statements.findIndex((s) => s.box === b) + 1);
      const left2 = statements.filter((s) => cur.wired[s.box] !== s.var);
      if (left2.length) {
        ctx.good('`{name}[{box}] = {chosen};` copies the arrow in `{chosen}` into box {box}.', more);
        return;
      }
      row.boxes.forEach((box) => box.setAttribute('aria-disabled', 'true'));
      cardOf.forEach((card) => card.el.setAttribute('aria-disabled', 'true'));
      const help = ctx.stage.querySelector('.play-help');
      if (help) help.remove();
      if (round.ask) {
        ctx.good(statements.length < size ? 'Wired. One box got no statement at all.' : 'Wired: every box holds an arrow.');
        ctx.later(() => ask(), MS.beat * 2);
      } else ctx.solved(round.right, vars);
    }

    function ask() {
      const ctl = controls(ctx, 'Answers', 'play-chips');
      const b = askBox;
      const target = cur.wired[b] ? byVar.get(cur.wired[b]) : null;
      const v = { ...vars, box: b };
      if (round.ask === 'getName') {
        ctx.task('What does `{name}[{box}].getName()` return?', v);
        const opts = objs.map((o) => ({ key: o.var, text: `"${o.fields.name}"`, mono: true }));
        opts.push({ key: 'null', text: 'null', mono: true });
        choices(ctx, ctl, opts, target ? target.var : 'null', () => {
          const arrow = arrows.get(b);
          if (arrow) wires.hot(arrow, true);
          row.cells[b].classList.add('play-hit');
          const card = cardOf.get(target.var);
          card.el.classList.add('play-hit');
          if (card.fields.name) card.fields.name.classList.add('play-hit');
          ctx.solved(round.right || 'Follow the arrow from box {box}: it reaches the `{who}` object, whose name is `"{who}"`.',
            { ...v, who: target.fields.name });
        }, () => ctx.why('getName', v));
      } else if (round.ask === 'unwired') {
        ctx.task('No line writes to `{name}[{box}]`. What does that box hold?', v);
        const opts = (round.options || []).map((o) => ({ key: o.key, text: o.text, mono: Boolean(o.mono) }));
        const answer = defaultOf(cls) === 'null' ? 'null' : 'zero';
        choices(ctx, ctl, opts, answer, () => {
          row.cells[b].classList.add('play-hit');
          ctx.solved(round.right, v);
        }, (opt) => ctx.why(opt.key, v));
      } else { // callOnNull
        ctx.task('What happens when this line runs: `{name}[{box}].getName()`?', v);
        code.set([...lines, `${name}[${b}].getName();`]);
        statements.forEach((s, j) => code.tick(j + 1));
        const opts = (round.options || []).map((o) => ({ key: o.key, text: o.text, mono: Boolean(o.mono) }));
        const answer = target ? 'returns' : 'npe';
        choices(ctx, ctl, opts, answer, () => {
          row.cells[b].classList.add('play-boom-cell');
          shake(row.boxes[b]);
          ctx.solved(round.right, v);
        }, (opt) => ctx.why(opt.key, v));
      }
    }

    if (!wiring && round.ask) {
      row.boxes.forEach((box) => box.setAttribute('aria-disabled', 'true'));
      ask();
    } else {
      ctx.task(round.prompt || 'Run the code: click a box, then the object the code puts in it.', vars);
      const help = make('p', 'play-help', 'Click a box, then a card. The arrow draws itself.');
      ctx.stage.appendChild(help);
    }
  };

  // ---- 5. swap: sort by swapping -------------------------------------------------------------------

  function isSorted(values) {
    return values.every((v, i) => i === 0 || values[i - 1] <= v);
  }

  // Ascending order as Arrays.sort sees it: numbers by value, Strings by compareTo (one char code at a time).
  const ascending = (a, b) => (typeof a === 'string' ? compareTo(a, String(b)) : a - b);

  // The fewest swaps that sort distinct values: n minus the number of cycles.
  function minSwaps(values) {
    const sorted = values.slice().sort(ascending);
    const target = values.map((v) => sorted.indexOf(v));
    const seen = Array(values.length).fill(false);
    let cycles = 0;
    for (let i = 0; i < values.length; i += 1) {
      if (seen[i]) continue;
      cycles += 1;
      let j = i;
      while (!seen[j]) {
        seen[j] = true;
        j = target[j];
      }
    }
    return values.length - cycles;
  }

  TYPES.swap = (ctx) => {
    const { round } = ctx;
    const arr = drawArray(ctx);
    const { name, elem } = arr;
    let values = arr.values.slice();
    for (let tries = 0; tries < 80 && (isSorted(values) || minSwaps(values) < (round.minSwaps || 2)); tries += 1) {
      values = shuffle(arr.values);
    }
    const n = values.length;
    const sorted = values.slice().sort(ascending);
    const par = minSwaps(values);
    ctx.expose({ type: 'swap', name, elem, values: values.slice() });
    const vars = { name, par };
    ctx.task(round.prompt || 'Sort `{name}` into ascending order: click two boxes to swap them.', vars);
    const brd = board(ctx, 'play-board-swap');
    const code = codeView([`Arrays.sort(${name});   // ...by hand`]);
    const row = arrayRow({ name, elem, values, clickable: true, onClick: (i) => onBox(i) });
    row.el.classList.add('play-clickable');
    const reads = make('div', 'play-reads');
    const readSwaps = readout('swaps', '0');
    const readPar = readout('fewest possible', String(par), 'play-read-par');
    reads.append(readSwaps.el, readPar.el);
    brd.append(code.el, row.el, reads);
    let selected = null;
    let swaps = 0;
    let done = false;

    function marks() {
      row.cells.forEach((cell, i) => cell.classList.toggle('play-in-place', row.values[i] === sorted[i]));
    }

    function select(i) {
      selected = i;
      row.boxes.forEach((box, j) => {
        box.classList.toggle('play-selected', j === i);
        box.setAttribute('aria-pressed', j === i ? 'true' : 'false');
      });
    }

    function onBox(i) {
      if (done) return;
      if (selected === null) {
        select(i);
        return;
      }
      if (selected === i) {
        select(null);
        return;
      }
      const a = selected;
      const b = i;
      select(null);
      doSwap(a, b);
    }

    function doSwap(a, b) {
      const va = row.values[a];
      const vb = row.values[b];
      const valA = row.boxes[a].querySelector('.play-val');
      const valB = row.boxes[b].querySelector('.play-val');
      const dx = row.cells[b].offsetLeft - row.cells[a].offsetLeft;
      row.set(a, vb);
      row.set(b, va);
      swaps += 1;
      readSwaps.set(String(swaps), true);
      if (!still() && valA && valB) {
        const na = row.boxes[a].querySelector('.play-val');
        const nb = row.boxes[b].querySelector('.play-val');
        // each value starts where it was and glides over (or under) the other
        animate(nb, [{ transform: `translate(${-dx}px, 0)` }, { transform: `translate(${-dx / 2}px, -26px)`, offset: 0.5 },
          { transform: 'translate(0, 0)' }], { duration: MS.glide, easing: GLIDE });
        animate(na, [{ transform: `translate(${dx}px, 0)` }, { transform: `translate(${dx / 2}px, 26px)`, offset: 0.5 },
          { transform: 'translate(0, 0)' }], { duration: MS.glide, easing: GLIDE });
      }
      marks();
      const landed = row.values[a] === sorted[a] || row.values[b] === sorted[b];
      if (isSorted(row.values)) {
        done = true;
        row.boxes.forEach((box) => box.setAttribute('aria-disabled', 'true'));
        code.tick(0);
        ctx.later(() => {
          row.el.classList.add('play-all-good');
          row.boxes.forEach((box, k) => pop(box, k * 70));
        }, still() ? 0 : MS.glide);
        const verdict = swaps === par ? `${swaps} swaps, the fewest possible.` : `${swaps} swaps; ${par} is the fewest possible.`;
        ctx.solved(round.right || 'Sorted: {verdict}', { ...vars, swaps, verdict });
      } else if (!landed) {
        ctx.hint(ctx.why('wasted', vars));
      } else ctx.quiet();
    }

    row.el.addEventListener('keydown', safe((event) => {
      if (event.key === 'Escape' && selected !== null) {
        select(null);
        event.preventDefault();
      }
    }));
    marks();
    row.boxes.forEach((box) => box.setAttribute('aria-pressed', 'false'));
  };

  // ---- 6. refs: two variables, one array or two ---------------------------------------------------

  TYPES.refs = (ctx) => {
    const { round } = ctx;
    const base = drawArray(ctx);
    const elem = base.elem || 'int';
    let a = base.values.slice();
    const asks = round.ask;
    if (asks.includes('sortChangesA')) {
      for (let tries = 0; tries < 40 && isSorted(a); tries += 1) a = shuffle(base.values);
    }
    const make2 = round.make;
    let b = a.slice();
    let change = null;
    if (make2 === 'different') {
      if (Math.random() < 0.5 && a.length > 1) { // same values, another order
        const i = rnd(a.length - 1);
        [b[i], b[i + 1]] = [b[i + 1], b[i]];
        if (sameValues(a, b)) b[i] += 1;
        change = 'order';
      } else {
        const i = rnd(a.length);
        b[i] += 1 + rnd(3);
        change = 'value';
      }
    }
    const alias = make2 === 'alias';
    ctx.expose({ type: 'refs', make: make2, a: a.slice(), b: alias ? a.slice() : b.slice(), ask: asks });
    const lines = [`${elem}[] a = ${literal(elem, a)};`];
    if (make2 === 'alias') lines.push(`${elem}[] b = a;`);
    else if (make2 === 'clone') lines.push(`${elem}[] b = a.clone();`);
    else if (make2 === 'same' || make2 === 'different') lines.push(`${elem}[] b = ${literal(elem, b)};`);
    if (asks.includes('sortChangesA')) lines.push('Arrays.sort(b);');

    const brd = board(ctx, make2 === 'copy' ? 'play-split' : 'play-split play-solo');
    const left = make('div', 'play-col');
    const right = make('div', 'play-col');
    brd.append(left, right);
    const code = codeView(lines);
    left.appendChild(code.el);
    if (make2 === 'copy') left.appendChild(rich(make('p', 'play-aside'), round.aside || '`b` is a copy of `a`: its own boxes, holding the same values.'));
    const pic = make('div', 'play-pic play-refs-pic');
    right.appendChild(pic);
    const va = varCell('a', 'teal');
    const vb = varCell('b', alias ? 'teal' : 'purple');
    const rowA = arrayRow({ name: '', elem, values: a, hue: 'teal', showName: false });
    const rowB = alias ? null : arrayRow({ name: '', elem, values: b, hue: 'purple', showName: false });
    pic.append(va.el, rowA.el, vb.el, rowB ? rowB.el : make('div', 'play-array-spacer'));
    const wires = new Wires(pic, ctx);
    const wA = wires.add(va.dot, rowA.boxes[0], 'teal');
    const wB = wires.add(vb.dot, alias ? rowA.boxes[0] : rowB.boxes[0], alias ? 'teal' : 'purple');
    const overlay = make('div', 'play-overlay');
    pic.appendChild(overlay);

    // a dashed bracket joining the two variables, with its verdict
    function bracket(same) {
      const base2 = pic.getBoundingClientRect();
      const r1 = va.cell.getBoundingClientRect();
      const r2 = vb.cell.getBoundingClientRect();
      const x = Math.min(r1.left, r2.left) - base2.left - 20;
      const y1 = r1.top + r1.height / 2 - base2.top;
      const y2 = r2.top + r2.height / 2 - base2.top;
      const line = make('span', `play-bracket ${same ? 'play-same' : 'play-differ'}`);
      line.style.left = `${x}px`;
      line.style.top = `${y1}px`;
      line.style.height = `${y2 - y1}px`;
      line.style.width = `${Math.min(r1.left, r2.left) - base2.left - x}px`;
      const badge = make('span', `play-verdict ${same ? 'play-same' : 'play-differ'}`);
      badge.appendChild(icon(same ? 'check' : 'cross'));
      badge.style.left = `${x}px`;
      badge.style.top = `${(y1 + y2) / 2}px`;
      overlay.append(line, badge);
      animate(line, [{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
      pop(badge);
    }

    function markBox(box, ok) {
      box.classList.add(ok ? 'play-match' : 'play-nomatch');
      const m = make('span', `play-corner-mark ${ok ? 'play-same' : 'play-differ'}`);
      m.appendChild(icon(ok ? 'check' : 'cross'));
      box.appendChild(m);
      pop(m);
    }

    const diffAt = alias ? -1 : a.findIndex((v, i) => v !== b[i]);
    const vars = { diff: diffAt, av: diffAt >= 0 ? lit(elem, a[diffAt]) : '', bv: diffAt >= 0 ? lit(elem, b[diffAt]) : '' };
    const QUESTIONS = {
      '==': { text: '`a == b`', label: 'a == b', answer: alias,
        opts: [{ key: true, text: 'true', mono: true }, { key: false, text: 'false', mono: true }] },
      equals: { text: '`Arrays.equals(a, b)`', label: 'Arrays.equals(a, b)', answer: alias || sameValues(a, b),
        opts: [{ key: true, text: 'true', mono: true }, { key: false, text: 'false', mono: true }] },
      sortChangesA: { text: 'After `Arrays.sort(b)`, has `a` changed?', label: 'After Arrays.sort(b), has a changed?', answer: alias,
        opts: [{ key: true, text: 'Yes, `a` is sorted too' }, { key: false, text: 'No, `a` keeps its order' }] },
    };
    ctx.task(round.prompt || (asks.includes('sortChangesA') ? 'Predict: does sorting `b` change `a`?'
      : 'Judge both: `true` or `false`?'), vars);
    const qBox = make('div', 'play-questions');
    ctx.stage.appendChild(qBox);
    let q = 0;

    function revealSame() {
      wires.hot(wA, true);
      wires.hot(wB, true);
      bracket(alias);
    }

    function revealEquals() {
      wires.hot(wA, false);
      wires.hot(wB, false);
      if (alias) { // one array, compared with itself
        rowA.boxes.forEach((box, i) => ctx.later(() => markBox(box, true), i * MS.stagger));
        return;
      }
      a.forEach((v, i) => ctx.later(() => {
        const same = v === b[i];
        markBox(rowA.boxes[i], same);
        markBox(rowB.boxes[i], same);
      }, i * MS.stagger * 1.6));
    }

    function revealSort() {
      const target = alias ? rowA : rowB;
      const sortedVals = target.values.slice().sort((x, y) => x - y);
      const before = target.cells.map((cell) => cell.offsetLeft);
      const from = target.values.slice();
      sortedVals.forEach((v, i) => target.set(i, v));
      if (!still()) { // each value glides from its old box to its new one
        const used = new Set();
        sortedVals.forEach((v, i) => {
          const j = from.findIndex((x, k) => x === v && !used.has(k));
          used.add(j);
          const val = target.boxes[i].querySelector('.play-val');
          animate(val, [{ transform: `translateX(${before[j] - before[i]}px)` }, { transform: 'translateX(0)' }],
            { duration: MS.glide, easing: GLIDE, delay: 150 });
        });
      }
      code.on(lines.length - 1, true);
      ctx.later(() => {
        if (alias) {
          wires.hot(wA, true);
          wires.hot(wB, true);
          rowA.el.classList.add('play-all-good');
          const tag = make('span', 'play-tag play-tag-same', 'a and b: one array');
          rowA.el.appendChild(tag);
          pop(tag);
        } else {
          rowA.el.classList.add('play-untouched');
          const tag = make('span', 'play-tag', 'unchanged');
          rowA.el.appendChild(tag);
          pop(tag);
        }
      }, MS.glide + 200);
    }

    function nextQuestion() {
      if (q >= asks.length) {
        ctx.solved(round.right, vars);
        return;
      }
      const key = asks[q];
      const spec = QUESTIONS[key];
      const line = make('div', 'play-question');
      const label = make('p', 'play-q-label');
      rich(label, spec.text);
      const opts = make('div', 'play-q-opts');
      opts.setAttribute('role', 'group');
      opts.setAttribute('aria-label', spec.label);
      line.append(label, opts);
      qBox.appendChild(line);
      animate(line, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 240 });
      choices(ctx, opts, spec.opts, spec.answer, () => {
        line.classList.add('play-q-done');
        if (key === '==') revealSame();
        else if (key === 'equals') revealEquals();
        else revealSort();
        q += 1;
        const right = round.rightEach && round.rightEach[key] ? round.rightEach[key] : '';
        if (q < asks.length) {
          if (right) ctx.good(right, vars);
          ctx.later(nextQuestion, MS.beat * 1.5);
        } else ctx.later(nextQuestion, key === 'sortChangesA' ? MS.glide + 500 : MS.beat * 2);
      }, () => ctx.why(key, vars));
      const first = opts.querySelector('button');
      if (q > 0 && first) first.focus({ preventScroll: true });
    }

    nextQuestion();
  };

  // ---- 7. method: what a method can do to the caller's array ---------------------------------------

  function applyOp(m, values) {
    if (m.op === 'add') return values.map((v) => v + m.by);
    if (m.op === 'square') return values.map((v) => v * v);
    if (m.op === 'setFirst') return values.map((v, i) => (i === 0 ? m.value : v));
    throw new Error(`unknown op ${m.op}`);
  }

  TYPES.method = (ctx) => {
    const { round } = ctx;
    const m = round.method;
    const arr = drawArray(ctx);
    const { name } = arr;
    const values = arr.values.slice();
    const n = values.length;
    const zeros = Array(n).fill(0);
    const outcomes = {
      before: values.slice(),
      after: applyOp(m, values),
      fresh: applyOp(m, zeros),
    };
    const answer = m.kind === 'mutate' ? 'after' : 'before';
    const keys = (round.options || ['before', 'after']).filter((k, i, all) => all.findIndex((x) =>
      sameValues(outcomes[x], outcomes[k])) === i);
    ctx.expose({ type: 'method', name, values, method: { name: m.name, kind: m.kind, op: m.op, by: m.by, value: m.value },
      options: keys.map((k) => outcomes[k]) });
    const vars = { name, method: m.name };
    ctx.task(round.prompt || 'Predict: what does `{name}` hold after the call?', vars);

    const brd = board(ctx, 'play-split play-board-method');
    const left = make('div', 'play-col');
    const right = make('div', 'play-col');
    brd.append(left, right);
    const callLines = [`int[] ${name} = ${literal('int', values)};`, round.call,
      `System.out.println(Arrays.toString(${name}));`];
    const codeM = codeView(m.code);
    codeM.el.classList.add('play-code-method');
    const codeC = codeView(callLines);
    codeC.el.classList.add('play-code-call');
    const out = consoleView();
    left.append(codeM.el, codeC.el, out.el);

    const pic = make('div', 'play-pic play-method-pic');
    right.appendChild(pic);
    const mainFrame = make('div', 'play-frame');
    mainFrame.appendChild(make('span', 'play-frame-name', 'main'));
    const vNums = varCell(name, 'teal');
    const resultVar = round.call.match(/^int\[\]\s+(\w+)\s*=/);
    const vRes = resultVar ? varCell(resultVar[1]) : null;
    if (vRes) {
      vRes.el.classList.add('play-later');
      vRes.show('');
    }
    mainFrame.append(vNums.el);
    if (vRes) mainFrame.appendChild(vRes.el);
    const callFrame = make('div', 'play-frame play-frame-method play-waiting');
    const sig = make('span', 'play-frame-name');
    fillCode(sig, m.code[0].replace(/^static\s+/, '').replace(/\s*\{\s*$/, ''));
    callFrame.appendChild(sig);
    const vArr = varCell('arr');
    vArr.show('');
    callFrame.appendChild(vArr.el);
    const vTmp = m.kind === 'fresh' ? varCell('result') : null;
    if (vTmp) {
      vTmp.show('');
      vTmp.el.classList.add('play-later');
      callFrame.appendChild(vTmp.el);
    }
    const varsCol = make('div', 'play-vars');
    varsCol.append(mainFrame, callFrame);
    const arrCol = make('div', 'play-arrays');
    const rowA = arrayRow({ name: '', elem: 'int', values, hue: 'teal', showName: false,
      chars: Math.max(...outcomes.after.map((v) => String(v).length), ...values.map((v) => String(v).length)) });
    arrCol.appendChild(rowA.el);
    const second = m.kind === 'mutate' ? null : (m.kind === 'fresh' ? outcomes.after : outcomes.fresh);
    const rowB = second ? arrayRow({ name: '', elem: 'int', values: zeros, hue: 'purple', showName: false,
      chars: Math.max(...second.map((v) => String(v).length)) }) : null;
    if (rowB) {
      rowB.el.classList.add('play-later');
      arrCol.appendChild(rowB.el);
    }
    pic.append(varsCol, arrCol);
    const wires = new Wires(pic, ctx);
    wires.add(vNums.dot, rowA.boxes[0], 'teal');

    const ctl = controls(ctx, `What ${name} holds after the call`, 'play-chips play-options');
    const opts = keys.map((k) => {
      const mini = make('span', 'play-mini');
      outcomes[k].forEach((v) => mini.appendChild(make('span', 'play-mini-box', String(v))));
      return { key: k, text: '', node: mini, label: `${name} holds ${toStr('int', outcomes[k])}` };
    });
    choices(ctx, ctl, shuffle(opts), answer, () => reveal(), () => ctx.why(m.kind, vars));

    async function reveal() {
      const live = () => ctx.alive();
      codeC.on(1, true);
      callFrame.classList.remove('play-waiting');
      callFrame.classList.add('play-running');
      vArr.point('teal');
      const wArr = wires.add(vArr.dot, rowA.boxes[0], 'teal', { animate: true, hot: true });
      wires.track(MS.draw);
      const same = make('span', 'play-tag play-tag-same', 'same array');
      rowA.el.appendChild(same);
      pop(same);
      await wait(MS.draw + 380);
      if (!live()) return;
      if (m.kind === 'mutate') {
        const after = outcomes.after;
        for (let i = 0; i < n; i += 1) {
          if (after[i] !== rowA.values[i]) {
            rowA.set(i, after[i], 'pop');
            await wait(240);
            if (!live()) return;
          }
        }
      } else if (m.kind === 'fresh') {
        vTmp.el.classList.remove('play-later');
        rowB.el.classList.remove('play-later');
        pop(rowB.el);
        vTmp.point('purple');
        wires.add(vTmp.dot, rowB.boxes[0], 'purple', { animate: true });
        wires.track(MS.draw + 200);
        await wait(MS.draw + 200);
        for (let i = 0; i < n; i += 1) {
          rowB.set(i, second[i], 'pop');
          await wait(240);
          if (!live()) return;
        }
        vRes.el.classList.remove('play-later');
        vRes.point('purple');
        wires.add(vRes.dot, rowB.boxes[0], 'purple', { animate: true });
        wires.track(MS.draw);
      } else { // reassign: the parameter's arrow swings to a new array; the caller's stays
        rowB.el.classList.remove('play-later');
        pop(rowB.el);
        vArr.point('purple');
        wires.remove(wArr);
        wires.add(vArr.dot, rowB.boxes[0], 'purple', { animate: true, hot: true });
        same.remove();
        wires.track(MS.draw + 200);
        await wait(MS.draw + 300);
        if (!live()) return;
        for (let i = 0; i < n; i += 1) {
          if (second[i] !== 0) {
            rowB.set(i, second[i], 'pop');
            await wait(240);
          }
        }
      }
      await wait(500);
      if (!live()) return;
      // the method returns: its frame and its arrows go
      callFrame.classList.add('play-gone');
      wires.list.filter((w) => w.from === vArr.dot || (vTmp && w.from === vTmp.dot)).forEach((w) => wires.remove(w, true));
      if (m.kind === 'reassign') rowB.el.classList.add('play-gone');
      if (same.isConnected) same.remove();
      codeC.on(1, false);
      codeC.on(2, true);
      out.println(toStr('int', rowA.values));
      rowA.el.classList.add(m.kind === 'mutate' ? 'play-all-good' : 'play-untouched');
      wires.track(400);
      ctx.solved(round.right, { ...vars, result: toStr('int', rowA.values) });
    }
  };

  // ---- 8. champion: keep the crown ----------------------------------------------------------------

  // A run of values in which the crown changes hands at least twice, and stays put at least once.
  function championRun(items, count) {
    for (let tries = 0; tries < 200; tries += 1) {
      const run = sample(items, count);
      let best = run[0][1];
      let moves = 0;
      let stays = 0;
      run.slice(1).forEach(([, v]) => {
        if (v > best) {
          best = v;
          moves += 1;
        } else stays += 1;
      });
      if (moves >= 2 && stays >= 1) return run;
    }
    return sample(items, count);
  }

  TYPES.champion = (ctx) => {
    const { round, data } = ctx;
    if (round.start === 'zero') {
      championZero(ctx);
      return;
    }
    const run = championRun(data.items, round.count || 5);
    const name = round.name || 'heights';
    const values = run.map(([, v]) => v);
    const names = run.map(([who]) => who);
    const n = values.length;
    ctx.expose({ type: 'champion', name, values, names });
    const unit = data.unit || '';
    const brd = board(ctx, 'play-split play-solo');
    const left = make('div', 'play-col');
    const right = make('div', 'play-col');
    brd.append(left, right);
    const code = codeView([
      `int highest = ${name}[0];`,
      `for (int i = 1; i < ${name}.length; i++) {`,
      `    if (${name}[i] > highest) {`,
      `        highest = ${name}[i];`,
      '    }',
      '}',
    ]);
    left.appendChild(code.el);
    const pic = make('div', 'play-pic');
    const row = arrayRow({ name, elem: 'int', values });
    const crown = row.badge('crown');
    row.cells.forEach((cell) => cell.classList.add('play-waiting'));
    const champ = make('div', 'play-champ');
    const readHigh = readout('highest', String(values[0]), 'play-read-gold');
    const champName = make('span', 'play-champ-name');
    champ.append(readHigh.el, champName);
    const challenger = make('p', 'play-challenger');
    pic.append(row.el, champ, challenger);
    right.appendChild(pic);
    const group = controls(ctx, 'Does it take the crown?', 'play-decide');
    const yes = btn('New champion', { icon: 'crown', cls: 'play-yes', onClick: () => decide(true) });
    const no = btn('Keep the crown', { icon: 'cross', cls: 'play-no', onClick: () => decide(false) });
    group.append(yes, no);
    let best = 0;
    let i = 0;

    function arrive(k) {
      const cell = row.cells[k];
      cell.classList.remove('play-waiting');
      animate(cell, [{ opacity: 0, transform: 'translateX(28px)' }, { opacity: 1, transform: 'none' }],
        { duration: 380, easing: SPRING });
    }

    function crownTo(k, instant) {
      best = k;
      row.place(crown, k, instant);
      readHigh.set(String(values[k]), !instant);
      champName.textContent = `${names[k]}, ${values[k]}${unit ? ` ${unit}` : ''}`;
      row.cells.forEach((cell, j) => cell.classList.toggle('play-champion', j === k));
    }

    function ready(on) {
      [yes, no].forEach((b) => b.setAttribute('aria-disabled', on ? 'false' : 'true'));
    }

    function ask(k) {
      i = k;
      ready(true);
      arrive(k);
      row.cells.forEach((cell, j) => cell.classList.toggle('play-here', j === k));
      code.on(2, true);
      challenger.textContent = '';
      rich(challenger, `\`${name}[${k}]\` is ${values[k]}${unit ? ` ${unit}` : ''}: ${names[k]}.`);
      ctx.task('`{name}[{i}]` = {value} challenges `highest` = {champ}. Does it take the crown?',
        { name, i: k, value: values[k], champ: values[best] });
    }

    function decide(take) {
      if (i <= 0 || i >= n) return;
      const v = values[i];
      const c = values[best];
      const right2 = (v > c) === take;
      const vars = { name, i, value: v, champ: c, who: names[i], champName: names[best], unit };
      if (!right2) {
        shake(row.boxes[i]);
        ctx.bad(ctx.why(take ? 'yes' : 'no', vars));
        return;
      }
      if (take) {
        code.on(3, true);
        crownTo(i);
        ctx.good('`{value} > {champ}` is true: {who} takes the crown.', vars);
      } else {
        row.cells[i].classList.add('play-beaten');
        ctx.good('`{value} > {champ}` is false: the crown stays.', vars);
      }
      const k = i + 1;
      i = -1;
      ready(false);
      ctx.later(() => {
        code.on(3, false);
        if (k < n) ask(k);
        else {
          row.cells.forEach((cell) => cell.classList.remove('play-here'));
          challenger.textContent = '';
          code.on(2, false);
          ctx.solved(round.right, { name, best: values[best], who: names[best], unit });
        }
      }, MS.beat * 1.4);
    }

    // the first value arrives and takes the crown without a fight
    ready(false);
    arrive(0);
    window.requestAnimationFrame(() => crownTo(0, true));
    code.on(0, true);
    ctx.later(() => {
      code.on(0, false);
      ask(1);
    }, 50);
    ctx.task('The first value starts with the crown.', {});
  }

  function championZero(ctx) {
    const { round } = ctx;
    const arr = drawArray(ctx);
    const { name, values } = arr;
    const max = Math.max(...values);
    const printedValue = values.reduce((h, t) => (t > h ? t : h), 0);
    ctx.expose({ type: 'championZero', name, values });
    const vars = { name, max, first: values[0] };
    ctx.task(round.prompt || 'Every value is below zero. What does this code print?', vars);
    const brd = board(ctx, 'play-split');
    const left = make('div', 'play-col');
    const right = make('div', 'play-col');
    brd.append(left, right);
    const code = codeView([
      `int[] ${name} = ${literal('int', values)};`,
      'int highest = 0;',
      `for (int t : ${name}) {`,
      '    if (t > highest) {',
      '        highest = t;',
      '    }',
      '}',
      'System.out.println(highest);',
    ]);
    const out = consoleView();
    left.append(code.el, out.el);
    const pic = make('div', 'play-pic');
    const row = arrayRow({ name, elem: 'int', values });
    const champ = make('div', 'play-champ');
    const readHigh = readout('highest', '0', 'play-read-gold');
    const crown = make('span', 'play-champ-crown');
    crown.appendChild(icon('crown'));
    champ.append(crown, readHigh.el);
    pic.append(row.el, champ);
    right.appendChild(pic);
    const ctl = controls(ctx, 'What does it print?', 'play-chips');
    const opts = Array.from(new Set([0, max, Math.min(...values), values[0]])).sort((x, y) => x - y)
      .map((v) => ({ key: v, text: String(v), mono: true }));
    choices(ctx, ctl, opts, printedValue, async () => {
      code.on(1, true);
      for (let k = 0; k < values.length; k += 1) {
        await wait(320);
        if (!ctx.alive()) return;
        code.on(1, false);
        code.on(3, true);
        row.cells[k].classList.add('play-beaten');
        shake(row.boxes[k]);
      }
      await wait(300);
      if (!ctx.alive()) return;
      code.on(3, false);
      code.on(7, true);
      out.println(String(printedValue));
      champ.classList.add('play-champ-wrong');
      ctx.solved(round.right, vars);
    }, () => ctx.why('predict', vars));
  }

  // ---- 9. search: stop the search ---------------------------------------------------------------

  TYPES.search = (ctx) => {
    const { round } = ctx;
    const arr = drawArray(ctx);
    const { name, elem, values } = arr;
    const n = values.length;
    let target;
    if (round.find === 'absent') target = pick((round.decoys || []).filter((d) => !values.includes(d)));
    else if (round.find === 'first') {
      target = values.find((v, i) => values.indexOf(v) !== i);
    } else {
      const unique = range(n).filter((i) => i >= 1 && i <= n - 2 && values.indexOf(values[i]) === values.lastIndexOf(values[i]));
      target = values[pick(unique)];
    }
    const found = values.indexOf(target);
    ctx.expose({ type: 'search', name, elem, values, target });
    const T = lit(elem, target);
    const vars = { name, target: T, length: n, last: n - 1 };
    ctx.task(round.prompt || 'You are `find({name}, {target})`. Walk the boxes and stop at the right moment.', vars);
    const brd = board(ctx, 'play-split');
    const left = make('div', 'play-col');
    const right = make('div', 'play-col');
    brd.append(left, right);
    const code = codeView([
      `static int find(String[] ${name}, String target) {`,
      `    for (int i = 0; i < ${name}.length; i++) {`,
      `        if (${name}[i].equals(target)) {`,
      '            return i;',
      '        }',
      '    }',
      '    return -1;',
      '}',
    ]);
    const out = consoleView();
    left.append(code.el, out.el);
    const pic = make('div', 'play-pic');
    const row = arrayRow({ name, elem, values, ghost: true });
    const glass = row.badge('magnifier');
    const reads = make('div', 'play-reads');
    const readT = readout('target', T);
    const readI = readout('i', '0');
    const readN = readout('comparisons', '0', 'play-read-count');
    reads.append(readT.el, readI.el, readN.el);
    const test = make('p', 'play-test');
    pic.append(row.el, reads, test);
    right.appendChild(pic);
    const group = controls(ctx, 'What does the search do now?', 'play-decide');
    const nextBtn = btn('Not this one: i++', { icon: 'next', cls: 'play-next-box', onClick: () => act('next') });
    const foundBtn = btn('Found it: return i', { icon: 'check', cls: 'play-found', onClick: () => act('found') });
    const noneBtn = btn('return -1', { icon: 'stop', cls: 'play-none play-mono', label: 'return -1', onClick: () => act('none') });
    group.append(nextBtn, foundBtn, noneBtn);
    let i = 0;
    let comparisons = 0;
    let over = false;

    function look(instant) {
      row.place(glass, i, instant);
      readI.set(String(i), !instant);
      row.cells.forEach((cell, k) => cell.classList.toggle('play-here', k === i));
      if (row.ghost) row.ghost.classList.toggle('play-here', i === n);
      test.textContent = '';
      code.on(2, i < n);
      code.on(1, i >= n);
      if (i < n) {
        comparisons += 1;
        readN.set(String(comparisons), !instant);
        rich(test, `\`${name}[${i}].equals(${T})\` → \`${lit(elem, values[i])}.equals(${T})\``);
      } else rich(test, `\`i\` is ${n}, and \`i < ${name}.length\` is \`${n} < ${n}\`.`);
    }

    function act(what) {
      if (over) return;
      const here = i < n ? lit(elem, values[i]) : '';
      const v = { ...vars, i, value: here, comparisons, next: i + 1 };
      const match = i < n && values[i] === target;
      if (what === 'next') {
        if (i >= n) {
          ctx.bad(ctx.why('end', v));
          shake(row.ghost);
          return;
        }
        if (match) {
          shake(row.boxes[i]);
          ctx.bad(ctx.why('missed', v));
          return;
        }
        row.cells[i].classList.add('play-checked');
        i += 1;
        look(false);
        ctx.quiet();
        return;
      }
      if (what === 'found') {
        if (!match) {
          shake(i < n ? row.boxes[i] : row.ghost);
          ctx.bad(ctx.why(i < n ? 'notMatch' : 'end', v));
          return;
        }
        over = true;
        row.cells[i].classList.add('play-match');
        code.on(2, false);
        code.on(3, true);
        out.println(`find(${name}, ${T}) returned ${i}`);
        finish(v, i);
        return;
      }
      // return -1
      if (i < n) {
        shake(group.querySelector('.play-none'));
        ctx.bad(ctx.why(match ? 'missed' : 'early', v));
        return;
      }
      over = true;
      code.on(1, false);
      code.on(6, true);
      out.println(`find(${name}, ${T}) returned -1`);
      finish(v, -1);
    }

    function finish(v, result) {
      [nextBtn, foundBtn, noneBtn].forEach((b) => { b.disabled = true; });
      const later = found >= 0 ? values.slice(found + 1).filter((x) => x === target).length : 0;
      ctx.solved(round.right, { ...v, result, comparisons, skipped: n - comparisons, later });
    }

    window.requestAnimationFrame(() => look(true));
  };

  // ======================================================================================================
  // Strings. A String is drawn the way the lecture draws one: its characters in a row of boxes over index
  // pills (the array inside the object), and a String variable holds an arrow to the object.
  // ======================================================================================================

  // ---- what String methods return, worked out as Java works them out (the puzzles' text is ASCII) -----

  const isWhite = (c) => c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f' || c === '\u000B';
  const javaEscape = (s) => String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
  const jlit = (s) => (s === null ? 'null' : `"${javaEscape(s)}"`);
  const charLit = (c) => `'${({ '\n': '\\n', '\t': '\\t', "'": "\\'", '\\': '\\\\' })[c] || c}'`;
  const asciiUpper = (s) => s.replace(/[a-z]/g, (c) => c.toUpperCase());
  const asciiLower = (s) => s.replace(/[A-Z]/g, (c) => c.toLowerCase());
  const jtrim = (s) => s.replace(/^[\u0000- ]+/, '').replace(/[\u0000- ]+$/, '');
  const signWord = (n) => (n < 0 ? 'negative' : n > 0 ? 'positive' : 'zero');

  // A literal as typed between its quotes, in the pieces that each make one character: `\n` is one.
  function literalPieces(body) {
    return (String(body).match(/\\[\s\S]|[\s\S]/g) || []).map((src) => ({
      src, esc: src.length === 2, ch: src.length === 2 ? ({ n: '\n', t: '\t' })[src[1]] || src[1] : src }));
  }
  const unescapeJava = (body) => literalPieces(body).map((p) => p.ch).join('');

  // compareTo: the first pair of characters that differ decides (their char codes subtracted); if one
  // String runs out first, the lengths do.
  function compareTo(a, b) {
    const n = Math.min(a.length, b.length);
    for (let k = 0; k < n; k += 1) if (a[k] !== b[k]) return a.charCodeAt(k) - b.charCodeAt(k);
    return a.length - b.length;
  }
  function firstDiff(a, b) {
    const n = Math.min(a.length, b.length);
    for (let k = 0; k < n; k += 1) if (a[k] !== b[k]) return k;
    return n;
  }

  // split with a separator that holds no regex characters: empty parts at the end are dropped.
  function splitJ(s, sep) {
    if (!s.includes(sep)) return [s];
    const parts = s.split(sep);
    while (parts.length && parts[parts.length - 1] === '') parts.pop();
    return parts;
  }

  // String.format with %s, %d, %.Nf and %%: the pieces of the result, each knowing the argument it shows.
  function formatPieces(template, args) {
    const out = [];
    let next = 0;
    let last = 0;
    for (const m of template.matchAll(/%(?:\.(\d+))?([sdf%])/g)) {
      if (m.index > last) out.push({ text: template.slice(last, m.index) });
      if (m[2] === '%') out.push({ text: '%' });
      else {
        const v = args[next];
        const text = m[2] === 'f' ? Number(v).toFixed(m[1] === undefined ? 6 : Number(m[1])) : String(v);
        out.push({ text, arg: next, spec: m[0], value: v });
        next += 1;
      }
      last = m.index + m[0].length;
    }
    if (last < template.length) out.push({ text: template.slice(last) });
    return out;
  }

  const thrown = (name, message) => ({ thrown: name, message: message || '' });
  const isThrown = (v) => Boolean(v && typeof v === 'object' && !Array.isArray(v) && v.thrown);
  const exceptionLine = (t) => `Exception in thread "main" java.lang.${t.thrown}${t.message ? `: ${t.message}` : ''}`;
  const NPE_SIG = { equals: 'equals(Object)', equalsIgnoreCase: 'equalsIgnoreCase(String)', isEmpty: 'isEmpty()',
    isBlank: 'isBlank()', length: 'length()', compareTo: 'compareTo(String)', trim: 'trim()',
    toUpperCase: 'toUpperCase()', contains: 'contains(java.lang.CharSequence)' };

  // One call from a puzzle file: {on, call, args, then}. on and each argument name a variable, or are
  // {"lit": text} for a String literal, {"chr": c} for a char literal, or a number.
  function callParts(spec, env) {
    const term = (a) => {
      if (has(a, 'lit')) return { src: jlit(a.lit), value: a.lit, lit: true };
      if (has(a, 'chr')) return { src: charLit(a.chr), value: a.chr, lit: true };
      if (typeof a === 'number') return { src: String(a), value: a, lit: true };
      return { src: String(a), value: has(env, a) ? env[a] : undefined, name: String(a) };
    };
    const on = spec.on === undefined ? null : term(spec.on);
    const args = (spec.args || []).map(term);
    let src = `${on ? `${on.src}.` : ''}${spec.call}(${args.map((a) => a.src).join(', ')})`;
    if (spec.then === 'length') src += '.length';
    else if (typeof spec.then === 'number') src += `[${spec.then}]`;
    return { on, args, src };
  }

  function evalCall(spec, env) {
    const { on, args } = callParts(spec, env);
    const a = args.map((x) => x.value);
    const s = on ? on.value : null;
    if (on && s === null) {
      return thrown('NullPointerException',
        `Cannot invoke "String.${NPE_SIG[spec.call] || `${spec.call}()`}" because "${on.name}" is null`);
    }
    let v;
    switch (spec.call) {
      case 'length': v = s.length; break;
      case 'isEmpty': v = s.length === 0; break;
      case 'isBlank': v = Array.from(s).every(isWhite); break;
      case 'equals': v = a[0] !== null && s === a[0]; break;
      case 'equalsIgnoreCase': v = a[0] !== null && s.length === a[0].length && asciiUpper(s) === asciiUpper(a[0]); break;
      case 'compareTo': v = compareTo(s, a[0]); break;
      case 'toUpperCase': v = asciiUpper(s); break;
      case 'toLowerCase': v = asciiLower(s); break;
      case 'trim': v = jtrim(s); break;
      case 'replace': v = s.split(a[0]).join(a[1]); break;
      case 'contains': v = s.includes(a[0]); break;
      case 'indexOf': v = s.indexOf(a[0]); break;
      case 'split': v = splitJ(s, a[0]); break;
      case 'String.format': v = formatPieces(a[0], a.slice(1)).map((p) => p.text).join(''); break;
      case 'String.join': v = a.slice(1).join(a[0]); break;
      default: throw new Error(`unknown String call ${spec.call}`);
    }
    if (spec.then === 'length') v = v.length;
    else if (typeof spec.then === 'number') v = v[spec.then];
    return v;
  }

  const BOOLEAN_CALLS = new Set(['isEmpty', 'isBlank', 'equals', 'equalsIgnoreCase', 'contains']);
  const answerKind = (spec) => (spec.call === 'compareTo' ? 'sign'
    : (BOOLEAN_CALLS.has(spec.call) && spec.then === undefined ? 'boolean' : 'value'));

  // The wrong answers worth offering for a call that returns a value, each named for its mistake.
  function decoys(spec, env, right) {
    const { on, args } = callParts(spec, env);
    const s = on ? on.value : null;
    const a = args.map((x) => x.value);
    const out = [];
    const add = (kind, v) => { if (v !== undefined && v !== null && v !== right && !out.some((d) => d.value === v)) out.push({ kind, value: v }); };
    if (spec.call === 'trim') {
      add('all', s.replace(/ /g, ''));
      add('front', s.replace(/^ +/, ''));
      add('same', s);
    } else if (spec.call === 'replace') {
      add('first', s.replace(a[0], a[1]));
      add('same', s);
    } else if (spec.call === 'toUpperCase') {
      add('same', s);
      add('first', s ? s[0].toUpperCase() + s.slice(1) : s);
    } else if (spec.call === 'String.format') {
      const pieces = formatPieces(a[0], a.slice(1));
      const variant = (fn) => pieces.map((p) => (p.spec && p.spec.endsWith('f') ? fn(p) : p.text)).join('');
      add('unrounded', variant((p) => String(p.value)));
      add('cut', variant((p) => {
        const d = Number((p.spec.match(/\.(\d+)/) || [0, 6])[1]);
        return (Math.trunc(p.value * 10 ** d) / 10 ** d).toFixed(d);
      }));
    } else if (spec.call === 'String.join') {
      const parts = a.slice(1);
      add('after', parts.join(a[0]) + a[0]);
      add('around', a[0] + parts.join(a[0]) + a[0]);
      add('none', parts.join(''));
    } else if (spec.call === 'split' && spec.then === 'length') {
      add('commas', right - 1);
      add('plus', right + 1);
    } else if (spec.call === 'split') {
      const parts = splitJ(s, a[0]);
      add('before', parts[spec.then - 1]);
      add('after', parts[spec.then + 1]);
    } else if (spec.call === 'indexOf') {
      add('count', right + 1);
      add('absent', -1);
    }
    return out;
  }

  // ---- pieces of a String picture ---------------------------------------------------------------------

  // A String's characters as a row of boxes over index pills: charAt(i) is box i.
  function textRow(o) {
    const text = String(o.text);
    const row = arrayRow({ name: o.name, elem: 'text', values: Array.from(text), hue: o.hue || 'teal',
      showName: o.showName, clickable: o.clickable, onClick: o.onClick, ghost: o.ghost,
      label: (i, v) => `${o.name}.charAt(${i}), holding ${v === ' ' ? 'a space' : charLit(v)}` });
    row.el.classList.add('play-string');
    row.el.style.setProperty('--play-n', Math.max(text.length, 1)); // on a narrow card, long Strings get smaller boxes
    row.text = text;
    if (!text.length) {
      const none = make('span', 'play-no-chars');
      rich(none, 'no characters: `length()` is 0');
      row.track.appendChild(none);
    }
    return row;
  }

  // The gap just before box i (i = length: just after the last box), in the row's own coordinates.
  function gapX(row, i) {
    const cells = row.cells;
    if (!cells.length) return 0;
    const gap = parseFloat(window.getComputedStyle(row.track).columnGap) || 6;
    if (i < cells.length) return cells[i].offsetLeft - gap / 2;
    const end = cells[cells.length - 1];
    return end.offsetLeft + end.offsetWidth + gap / 2;
  }

  // Scissors at the gaps where substring cuts: begin before box b, end before box e.
  function cutAt(row, i, word) {
    row.track.classList.add('play-has-cuts');
    const cut = make('span', 'play-cut');
    const tag = make('span', 'play-cut-tag', `${word} ${i}`);
    cut.appendChild(tag);
    cut.style.left = `${gapX(row, i)}px`;
    row.track.appendChild(cut);
    animate(cut, [{ opacity: 0, transform: 'scaleY(.2)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: SPRING });
    return cut;
  }

  // A new String, returned by a call: a row of its characters with a tag.
  function resultRow(host, text, tagText, hue) {
    const wrap = make('div', 'play-result');
    const row = textRow({ name: 'result', text, showName: false, hue: hue || 'purple' });
    const tag = make('span', 'play-tag play-tag-new');
    rich(tag, tagText || 'a new String');
    wrap.append(row.el, tag);
    host.appendChild(wrap);
    row.boxes.forEach((box, k) => pop(box, k * 45));
    pop(tag, 120);
    return row;
  }

  function cornerMark(box, ok) {
    if (!box || box.querySelector('.play-corner-mark')) return;
    box.classList.add(ok ? 'play-match' : 'play-nomatch');
    const m = make('span', `play-corner-mark ${ok ? 'play-same' : 'play-differ'}`);
    m.appendChild(icon(ok ? 'check' : 'cross'));
    box.appendChild(m);
    pop(m);
  }

  // The first of several keys the round's why has text for (its "*" text when it has none of them).
  function whyAny(ctx, keys, vars) {
    const w = ctx.round.why;
    const key = keys.find((k) => w && typeof w === 'object' && has(w, k));
    return ctx.why(key === undefined ? keys[keys.length - 1] : key, vars);
  }

  // Answer buttons that look like the console: one line each, as println would show the text.
  function consoleOption(text) {
    const box = make('span', 'play-mini-console');
    String(text).split('\n').forEach((line) => box.appendChild(make('span', 'play-mini-line', line)));
    return box;
  }
  const printsLabel = (text) => `prints ${String(text).split('\n').map((l) => `[${l}]`).join(' then ')}`;

  // A row of question lines, asked one at a time (as the == or equals? puzzle does).
  function askOne(ctx, host, spec, onRight) {
    const line = make('div', 'play-question');
    const label = make('p', 'play-q-label');
    rich(label, spec.text);
    const opts = make('div', 'play-q-opts');
    opts.setAttribute('role', 'group');
    opts.setAttribute('aria-label', spec.label);
    line.append(label, opts);
    host.appendChild(line);
    animate(line, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 240 });
    choices(ctx, opts, spec.opts, spec.answer, (opt) => {
      line.classList.add('play-q-done');
      onRight(opt);
    }, spec.whyOf);
    return line;
  }

  // ---- 10. escape: what a literal prints ------------------------------------------------------------

  TYPES.escape = (ctx) => {
    const { round } = ctx;
    const source = round.ask === 'source';
    const drawn = pick(source ? round.texts : round.literals);
    const body = source ? javaEscape(drawn) : drawn; // between the quotes, as typed
    const text = source ? drawn : unescapeJava(drawn); // what the String holds
    const pieces = literalPieces(body);
    const traps = round.traps || [];
    ctx.expose({ type: 'escape', ask: source ? 'source' : 'prints', body, text, traps });
    const vars = { length: text.length, typed: body.length };
    ctx.task(round.prompt || (source ? 'Which literal makes this line print exactly the text below?'
      : 'What does this line print?'), vars);

    const brd = board(ctx, 'play-split play-board-escape');
    const left = make('div', 'play-col');
    const right = make('div', 'play-col');
    brd.append(left, right);
    const code = codeView([source
      ? [{ text: 'System.out.println(' }, { text: '?', part: 'blank' }, { text: ');' }]
      : `System.out.println("${body}");`]);
    const out = consoleView();
    left.append(code.el, out.el);
    const pic = make('div', 'play-pic play-escape-pic');
    right.appendChild(pic);
    if (source) {
      const want = make('div', 'play-want');
      want.append(make('span', 'play-want-head', 'it must print'), consoleOption(text));
      pic.appendChild(want);
    } else pic.appendChild(tilesView(pieces));

    const candidates = source ? {
      right: jlit(text),
      naive: `"${text}"`,
      double: `"${javaEscape(javaEscape(text))}"`,
      single: `'${text}'`,
    } : {
      right: text,
      raw: body,
      quotes: `"${text}"`,
      dropped: body.replace(/\\(.)/g, '$1'),
      space: text.replace(/\n/g, ' '),
    };
    const seen = new Set();
    const opts = ['right', ...traps].filter((k) => {
      if (!has(candidates, k) || seen.has(candidates[k])) return false;
      seen.add(candidates[k]);
      return true;
    }).map((k) => (source
      ? { key: k, text: candidates[k], mono: true, cls: 'play-lit' }
      : { key: k, text: '', node: consoleOption(candidates[k]), label: printsLabel(candidates[k]) }));
    const ctl = controls(ctx, source ? 'Which literal?' : 'What it prints', 'play-chips play-options');
    choices(ctx, ctl, shuffle(opts), 'right', () => reveal(), (opt) => ctx.why(opt.key, vars));

    async function reveal() {
      if (source) {
        code.set([`System.out.println(${jlit(text)});`]);
        pic.appendChild(tilesView(pieces));
      }
      code.tick(0);
      const tiles = pic.querySelector('.play-tiles');
      const row = textRow({ name: 'the String', text, hue: 'purple' });
      row.el.classList.add('play-string-made');
      pieces.forEach((p, k) => { if (p.esc) row.boxes[k].classList.add('play-esc'); });
      pic.appendChild(row.el);
      if (tiles) tiles.classList.add('play-tiles-done');
      row.boxes.forEach((box, k) => pop(box, k * 40));
      for (const ch of text) { // the console types it out, character by character
        await wait(34);
        if (!ctx.alive()) return;
        if (ch === '\n') out.println('');
        else out.print(ch);
      }
      out.println('');
      ctx.solved(round.right, vars);
    }
  };

  // What was typed between the quotes, a tile per character; an escape is one tile of two keys.
  function tilesView(pieces) {
    const el = make('div', 'play-tiles');
    el.appendChild(make('span', 'play-tiles-head', 'typed between the quotes'));
    const row = make('div', 'play-tiles-row');
    pieces.forEach((p) => {
      const t = make('span', `play-tile${p.esc ? ' play-tile-esc' : ''}`, p.src === ' ' ? SHOW_CHAR[' '] : p.src);
      row.appendChild(t);
    });
    el.appendChild(row);
    return el;
  }

  // ---- 11. chars: a String's characters, by index ---------------------------------------------------------

  TYPES.chars = (ctx) => {
    const { round, data } = ctx;
    const word = clone(pick(round.words || data.words));
    const { name, text } = word;
    const n = text.length;
    const tasks = round.tasks.map((t) => {
      const spec = clone(t);
      if (has(t, 'find')) { // the character to look for, drawn from this word
        const counts = {};
        Array.from(text).forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
        if (t.find === 'absent') spec.ch = pick((round.decoys || ['z']).filter((c) => !text.includes(c)));
        else spec.ch = pick(Object.keys(counts).filter((c) => c !== ' ' && (t.find === 'repeat' ? counts[c] > 1 : counts[c] === 1)));
      }
      return spec;
    });
    ctx.expose({ type: 'chars', name, text, tasks });
    const brd = board(ctx, 'play-board-chars');
    const code = codeView([`String ${name} = ${jlit(text)};`, '']);
    const row = textRow({ name, text, clickable: true, onClick: (i) => onBox(i),
      ghost: tasks.some((t) => t.ask === 'pastEnd') });
    const ruler = make('div', 'play-ruler');
    const rulerLabel = make('span', 'play-ruler-label');
    ruler.appendChild(rulerLabel);
    if (tasks.some((t) => t.ask === 'length')) {
      row.track.appendChild(ruler);
      row.track.classList.add('play-has-ruler');
    }
    if (tasks.some((t) => has(t, 'slice') || has(t, 'sliceCall'))) {
      row.track.classList.add('play-has-cuts');
      row.el.classList.add('play-array-cut');
    }
    const glass = tasks.some((t) => has(t, 'find')) ? row.badge('magnifier') : null;
    if (glass) glass.classList.add('play-hidden');
    const help = make('p', 'play-test');
    brd.append(code.el, row.el, help);
    const ctl = controls(ctx, 'Answers', 'play-chips');
    const notFound = btn('`-1`: not found', { cls: 'play-mono play-none', label: 'not found: -1', onClick: () => onNone() });
    let k = 0;
    let stepKind = null;
    let selStart = null;
    const base = { name, length: n, last: n - 1, text: jlit(text) };

    function boxesOn(on) {
      row.boxes.forEach((b) => b.setAttribute('aria-disabled', on ? 'false' : 'true'));
      row.el.classList.toggle('play-clickable', on);
    }

    function clean() {
      row.cells.forEach((c) => c.classList.remove('play-hit', 'play-here', 'play-checked', 'play-sel'));
      row.track.querySelectorAll('.play-cut').forEach((c) => c.remove());
      brd.querySelectorAll('.play-result').forEach((r) => r.remove());
      if (row.ghost) row.ghost.classList.remove('play-boom', 'play-here');
      if (glass) glass.classList.add('play-hidden');
      help.textContent = '';
      help.classList.remove('play-test-err');
    }

    function next() {
      k += 1;
      ctx.later(begin, MS.beat * 2.4);
    }

    function begin() {
      ctl.textContent = '';
      ctl.hidden = true;
      clean();
      selStart = null;
      if (k >= tasks.length) {
        boxesOn(false);
        code.set([`String ${name} = ${jlit(text)};`]);
        ctx.solved(round.right, base);
        return;
      }
      const t = tasks[k];
      if (has(t, 'ask')) {
        stepKind = 'ask';
        boxesOn(false);
        ask(t);
      } else if (has(t, 'click')) {
        stepKind = 'click';
        boxesOn(true);
        const expr = t.click === 'last' ? `${name}.charAt(${name}.length() - 1)` : `${name}.charAt(${t.click})`;
        code.set([`String ${name} = ${jlit(text)};`, expr]);
        ctx.task(t.say || 'Click `{expr}`.', { ...base, expr });
      } else if (has(t, 'slice')) {
        stepKind = 'slice';
        boxesOn(true);
        const expr = sliceExpr(t.slice);
        code.set([`String ${name} = ${jlit(text)};`, expr]);
        ctx.task(t.say || 'Select what `{expr}` returns: click its first character, then its last.', { ...base, expr });
      } else if (has(t, 'sliceCall')) {
        stepKind = 'ask';
        boxesOn(false);
        sliceCall(t);
      } else if (has(t, 'find')) {
        stepKind = 'find';
        boxesOn(true);
        const expr = `${name}.indexOf(${charLit(t.ch)})`;
        code.set([`String ${name} = ${jlit(text)};`, expr]);
        ctx.task(t.say || 'Where does `{expr}` point? Click the box, or `-1` if there is none.', { ...base, expr });
        ctl.hidden = false;
        ctl.appendChild(notFound);
        notFound.setAttribute('aria-disabled', 'false');
        notFound.classList.remove('play-tried', 'play-right');
        notFound.querySelectorAll('.play-tried-mark, .play-right-mark').forEach((m) => m.remove());
      }
    }

    const sliceExpr = ([b, e]) => (e === undefined ? `${name}.substring(${b})` : `${name}.substring(${b}, ${e})`);

    function ask(t) {
      if (t.ask === 'length') {
        code.set([`String ${name} = ${jlit(text)};`, `${name}.length()`]);
        ctx.task(t.say || 'What is `{name}.length()`?', base);
        ctl.hidden = false;
        choices(ctx, ctl, [n - 1, n, n + 1].map((v) => ({ key: v, text: String(v), mono: true })), n, () => {
          code.set([`String ${name} = ${jlit(text)};`, `${name}.length()   // ${n}`]);
          code.tick(1);
          rulerLabel.textContent = `length() ${n}`;
          ruler.classList.add('play-on');
          ctx.good('`{name}.length()` is {length}: it counts every character, spaces too. The indexes run from 0 to {last}.', base);
          next();
        }, () => ctx.why('length', base));
      } else { // pastEnd: one past the last box
        const expr = `${name}.charAt(${name}.length())`;
        code.set([`String ${name} = ${jlit(text)};`, expr]);
        ctx.task(t.say || 'What does `{expr}` do?', { ...base, expr });
        ctl.hidden = false;
        const opts = (round.options || []).map((o) => ({ key: o.key, text: o.text, mono: Boolean(o.mono) }));
        choices(ctx, ctl, opts, 'throws', () => {
          row.ghost.classList.add('play-boom', 'play-here');
          shake(row.ghost);
          help.textContent = '';
          rich(help, `\`${exceptionLine(thrown('StringIndexOutOfBoundsException', `Index ${n} out of bounds for length ${n}`))}\``);
          help.classList.add('play-test-err');
          ctx.good('Index {length} is one past the last box: `charAt` throws, just as an array would.', base);
          next();
        }, (opt) => ctx.why(opt.key, base));
      }
    }

    function sliceCall(t) {
      const [b, e] = t.sliceCall;
      const want = text.slice(b, e);
      code.set([`String ${name} = ${jlit(text)};`, `${name}.substring(?, ?)`]);
      ctx.task(t.say || 'Which call returns `{want}`?', { ...base, want: jlit(want) });
      row.cells.forEach((c, i) => c.classList.toggle('play-sel', i >= b && i < e));
      const ends = Array.from(new Set([e - 1, e, e + 1])).filter((x) => x > b && x <= n);
      const opts = ends.map((x) => ({ key: x, text: `${name}.substring(${b}, ${x})`, mono: true }));
      ctl.hidden = false;
      choices(ctx, ctl, opts, e, () => {
        sliced(b, e, `${name}.substring(${b}, ${e})`);
        ctx.good('The end index is one past the last character you want: `{expr}` stops before index {e}.',
          { ...base, expr: `${name}.substring(${b}, ${e})`, e });
        next();
      }, (opt) => ctx.why('call', { ...base, chosen: opt.text, got: jlit(text.slice(b, opt.key)), e }));
    }

    function sliced(b, e, expr) {
      const part = text.slice(b, e);
      code.set([`String ${name} = ${jlit(text)};`, `${expr}   // ${jlit(part)}`]);
      code.tick(1);
      row.cells.forEach((c, i) => {
        c.classList.remove('play-sel');
        c.classList.toggle('play-hit', i >= b && i < e);
      });
      cutAt(row, b, 'begin');
      cutAt(row, e, 'end');
      resultRow(brd, part);
    }

    function onBox(i) {
      const t = tasks[k];
      if (stepKind === 'click') {
        const want = t.click === 'last' ? n - 1 : t.click;
        const v = { ...base, clicked: `${name}.charAt(${i})`, clickedIndex: i, index: want,
          expr: t.click === 'last' ? `${name}.charAt(${name}.length() - 1)` : `${name}.charAt(${want})` };
        if (i !== want) {
          shake(row.boxes[i]);
          ctx.bad(ctx.why(t.click === 'last' ? 'last' : 'click', v));
          return;
        }
        stepKind = null;
        boxesOn(false);
        row.cells[i].classList.add('play-hit');
        pop(row.boxes[i]);
        code.set([`String ${name} = ${jlit(text)};`, `${v.expr}   // ${charLit(text[i])}`]);
        code.tick(1);
        ctx.good(t.click === 'last' ? '`{name}.length()` is {length}, so the last character is at index {last}: `{ch}`.'
          : '`{expr}` is box {index}, counting from 0: `{ch}`.', { ...v, ch: charLit(text[i]) });
        next();
      } else if (stepKind === 'slice') {
        const [b, eRaw] = t.slice;
        const e = eRaw === undefined ? n : eRaw;
        const v = { ...base, b, e, lastIn: e - 1, expr: sliceExpr(t.slice), clicked: i };
        if (selStart === null) {
          if (i !== b) {
            shake(row.boxes[i]);
            ctx.bad(ctx.why('begin', v));
            return;
          }
          selStart = i;
          row.cells[i].classList.add('play-sel');
          pop(row.boxes[i]);
          ctx.quiet();
          rich(help, 'Now click its last character.');
          return;
        }
        if (i !== e - 1) {
          shake(row.boxes[i]);
          ctx.bad(ctx.why(i === e ? 'end' : 'span', v));
          return;
        }
        stepKind = null;
        boxesOn(false);
        help.textContent = '';
        sliced(b, e, v.expr);
        ctx.good(eRaw === undefined ? 'With no end index, `substring` runs to the end of the String.'
          : 'Boxes {b} to {lastIn}: `substring` includes the begin index and stops before the end index.', v);
        next();
      } else if (stepKind === 'find') {
        const at = text.indexOf(t.ch);
        const v = { ...base, ch: charLit(t.ch), index: at, clicked: i, clickedCh: charLit(text[i]),
          expr: `${name}.indexOf(${charLit(t.ch)})` };
        if (at < 0) {
          shake(row.boxes[i]);
          ctx.bad(ctx.why('absent', v));
        } else if (i !== at) {
          shake(row.boxes[i]);
          ctx.bad(ctx.why(text[i] === t.ch ? 'later' : 'other', v));
        } else found(at, v);
      }
    }

    function onNone() {
      if (stepKind !== 'find') return;
      const t = tasks[k];
      const at = text.indexOf(t.ch);
      const v = { ...base, ch: charLit(t.ch), index: at, expr: `${name}.indexOf(${charLit(t.ch)})` };
      if (at >= 0) {
        tried(notFound);
        ctx.bad(ctx.why('missing', v));
        return;
      }
      found(-1, v);
    }

    async function found(at, v) {
      stepKind = null;
      boxesOn(false);
      notFound.setAttribute('aria-disabled', 'true');
      if (at < 0) {
        notFound.classList.add('play-right');
        notFound.appendChild(icon('check', 'play-right-mark'));
      }
      code.set([`String ${name} = ${jlit(text)};`, `${v.expr}   // ${at}`]);
      code.tick(1);
      ctx.good(at < 0 ? 'No box holds {ch}, so `indexOf` returns `-1`: an index no character can have.'
        : 'The search starts at index 0 and stops at the first match: index {index}.', v);
      glass.classList.remove('play-hidden');
      const stop = at < 0 ? n : at;
      for (let j = 0; j <= stop && j < n; j += 1) {
        row.place(glass, j, j === 0);
        row.cells.forEach((c, x) => c.classList.toggle('play-here', x === j));
        await wait(260);
        if (!ctx.alive()) return;
        if (j !== at) row.cells[j].classList.add('play-checked');
      }
      row.cells.forEach((c) => c.classList.remove('play-here'));
      if (at >= 0) {
        row.cells[at].classList.add('play-hit');
        pop(row.boxes[at]);
      } else glass.classList.add('play-hidden');
      next();
    }

    begin();
  };

  // ---- 12. judge: what a String call returns ---------------------------------------------------------

  TYPES.judge = (ctx) => {
    const { round, data } = ctx;
    const decl = round.vars || data.vars;
    const set = clone(pick(round.sets || data.sets));
    const env = {};
    decl.forEach((d, i) => { env[d.name] = set[i]; });
    const asks = round.asks;
    ctx.expose({ type: 'judge', env, asks });
    const canThrow = asks.some((q) => isThrown(evalCall(q, env)));
    ctx.task(round.prompt || 'What does each call return?', {});
    const brd = board(ctx, canThrow ? 'play-split' : 'play-split play-solo');
    const left = make('div', 'play-col');
    const right = make('div', 'play-col');
    brd.append(left, right);
    const declLine = (d) => `${d.type} ${d.name} = ${d.type === 'String' ? jlit(env[d.name]) : lit(d.type, env[d.name])};`;
    const code = codeView(decl.map(declLine));
    left.appendChild(code.el);
    const out = canThrow ? consoleView() : null;
    if (out) left.appendChild(out.el);
    const pic = make('div', 'play-pic play-judge-pic');
    right.appendChild(pic);
    const rows = {};
    decl.forEach((d) => {
      const v = env[d.name];
      if (d.type === 'String' && v !== null) {
        rows[d.name] = textRow({ name: d.name, text: v, hue: d.hue });
        pic.appendChild(rows[d.name].el);
      } else {
        const cell = varCell(d.name, undefined, v === null ? 'null' : lit(d.type, v));
        cell.el.classList.add('play-var-inline');
        if (v === null) cell.cell.classList.add('play-null-cell');
        pic.appendChild(cell.el);
        rows[d.name] = cell;
      }
    });
    const note = make('p', 'play-test');
    pic.appendChild(note);
    const qBox = make('div', 'play-questions');
    ctx.stage.appendChild(qBox);
    let q = 0;

    function optionsFor(spec, result) {
      const npe = isThrown(result) || asks.some((x) => isThrown(evalCall(x, env)));
      const throwsOpt = { key: 'throws', text: 'throws `NullPointerException`' };
      const kind = answerKind(spec);
      let opts;
      if (kind === 'boolean') opts = [{ key: true, text: 'true', mono: true }, { key: false, text: 'false', mono: true }];
      else if (kind === 'sign') {
        opts = [{ key: 'negative', text: 'negative' }, { key: 'zero', text: 'zero' }, { key: 'positive', text: 'positive' }];
      } else {
        const list = [{ kind: 'right', value: result }, ...decoys(spec, env, result)];
        const asText = (v) => (typeof v === 'string' ? jlit(v) : String(v));
        opts = list.map((d) => ({ key: asText(d.value), kind: d.kind, text: asText(d.value), mono: true, cls: 'play-lit' }));
        opts = typeof result === 'number' ? opts.sort((x, y) => Number(x.key) - Number(y.key)) : shuffle(opts);
      }
      if (npe) opts.push(throwsOpt);
      return opts;
    }

    function answerOf(spec, result) {
      if (isThrown(result)) return 'throws';
      const kind = answerKind(spec);
      if (kind === 'sign') return signWord(result);
      if (kind === 'value') return typeof result === 'string' ? jlit(result) : String(result);
      return result;
    }

    function varsFor(spec, result) {
      const { on, args, src } = callParts(spec, env);
      const sv = on ? on.value : null;
      const av = args[0] ? args[0].value : null;
      const v = { expr: src, a: on ? on.src : '', b: args[0] ? args[0].src : '' };
      if (typeof sv === 'string') {
        v.s = jlit(sv);
        v.length = sv.length;
      }
      if (typeof sv === 'string' && typeof av === 'string') {
        const k = firstDiff(sv, av);
        Object.assign(v, { k, ca: charLit(sv[k] || ''), cb: charLit(av[k] || ''), na: sv.charCodeAt(k), nb: av.charCodeAt(k),
          la: sv.length, lb: av.length, diff: compareTo(sv, av), sv: jlit(sv), av: jlit(av) });
      }
      if (!isThrown(result)) v.result = typeof result === 'string' ? jlit(result) : String(result);
      else v.message = exceptionLine(result);
      return v;
    }

    function rowOf(term) { return typeof term === 'string' && rows[term] && rows[term].boxes ? rows[term] : null; }

    function reveal(spec, result) {
      note.textContent = '';
      note.classList.remove('play-test-err');
      pic.querySelectorAll('.play-match, .play-nomatch').forEach((b) => b.classList.remove('play-match', 'play-nomatch'));
      pic.querySelectorAll('.play-corner-mark, .play-result').forEach((m) => m.remove());
      pic.querySelectorAll('.play-here, .play-dropped, .play-hit').forEach((c) => c.classList.remove('play-here', 'play-dropped', 'play-hit'));
      const v = varsFor(spec, result);
      if (isThrown(result)) {
        const cell = rows[spec.on];
        if (cell && cell.cell) {
          cell.cell.classList.add('play-boom-null');
          shake(cell.cell);
        }
        if (out) out.println(exceptionLine(result), 'play-out-err');
        return;
      }
      const ra = rowOf(spec.on);
      const rb = rowOf((spec.args || [])[0]);
      if (spec.call === 'equals' || spec.call === 'equalsIgnoreCase') {
        if (ra && rb) {
          const len = Math.max(ra.values.length, rb.values.length);
          for (let k = 0; k < len; k += 1) {
            ctx.later(() => {
              const x = ra.values[k];
              const y = rb.values[k];
              const ok = x !== undefined && y !== undefined && (x === y || (spec.call === 'equalsIgnoreCase' && asciiUpper(x) === asciiUpper(y)));
              if (x !== undefined) cornerMark(ra.boxes[k], ok);
              if (y !== undefined) cornerMark(rb.boxes[k], ok);
            }, k * MS.stagger);
          }
        } else {
          const nul = Object.keys(rows).find((nm) => env[nm] === null);
          if (nul && rows[nul].cell) cornerMark(rows[nul].cell, false);
          rich(note, result ? '' : 'A literal is never `null`, so `equals` can always run: given `null`, it answers `false`.');
        }
      } else if (spec.call === 'compareTo' && ra && rb) {
        const k = v.k;
        for (let j = 0; j < k; j += 1) {
          ctx.later(() => { cornerMark(ra.boxes[j], true); cornerMark(rb.boxes[j], true); }, j * MS.stagger);
        }
        ctx.later(() => {
          if (k < ra.values.length && k < rb.values.length) {
            ra.cells[k].classList.add('play-here');
            rb.cells[k].classList.add('play-here');
            rich(note, `First difference at index ${k}: \`${v.ca}\` is ${v.na} and \`${v.cb}\` is ${v.nb}, so the answer is \`${v.na} - ${v.nb}\` = \`${result}\`.`);
          } else {
            (ra.values.length > k ? ra : rb).cells.slice(k).forEach((c) => c.classList.add('play-here'));
            rich(note, result === 0 ? 'Every character matches and the lengths match: `0`.'
              : `No character differs before one String runs out, so the lengths decide: \`${v.la} - ${v.lb}\` = \`${result}\`.`);
          }
        }, k * MS.stagger + 120);
      } else if (spec.call === 'isEmpty' || spec.call === 'isBlank') {
        if (ra) {
          if (!ra.values.length) {
            const none = ra.track.querySelector('.play-no-chars');
            if (none) none.classList.add('play-on');
          }
          ra.values.forEach((c, j) => ctx.later(() => cornerMark(ra.boxes[j],
            spec.call === 'isBlank' ? isWhite(c) : false), j * MS.stagger));
          rich(note, spec.call === 'isEmpty' ? `\`length()\` is ${ra.values.length}: ${ra.values.length ? 'not empty' : 'empty'}.`
            : (result ? 'Every character is whitespace (or there are none): blank.' : 'At least one character is not whitespace: not blank.'));
        }
      } else if (spec.call === 'split') {
        const parts = splitJ(ra.text, (spec.args[0] || {}).lit);
        const wrap = make('div', 'play-result');
        const arr = arrayRow({ name: 'parts', elem: 'String', values: parts, hue: 'purple' });
        wrap.appendChild(arr.el);
        pic.appendChild(wrap);
        arr.boxes.forEach((box, j) => pop(box, j * 80));
        if (typeof spec.then === 'number') arr.cells[spec.then].classList.add('play-hit');
        ra.values.forEach((c, j) => { if (c === spec.args[0].lit) ra.cells[j].classList.add('play-here'); });
      } else if (typeof result === 'string') {
        const res = resultRow(pic, result);
        if (spec.call === 'trim' && ra) {
          const start = ra.values.findIndex((c) => c > ' ');
          const lead = start < 0 ? ra.values.length : start;
          const tail = ra.values.length - 1 - [...ra.values].reverse().findIndex((c) => c > ' ');
          ra.cells.forEach((c, j) => c.classList.toggle('play-dropped', j < lead || j > tail));
        } else if ((spec.call === 'replace' || spec.call === 'toUpperCase') && ra) {
          res.values.forEach((c, j) => { if (c !== ra.values[j]) res.cells[j].classList.add('play-hit'); });
        } else if (spec.call === 'String.format' || spec.call === 'String.join') {
          let at = 0;
          const pieces = spec.call === 'String.format'
            ? formatPieces(callParts(spec, env).args[0].value, callParts(spec, env).args.slice(1).map((x) => x.value))
            : callParts(spec, env).args.slice(1).flatMap((x, j) => (j ? [{ text: callParts(spec, env).args[0].value }, { text: x.value, arg: j }]
              : [{ text: x.value, arg: j }]));
          pieces.forEach((p) => {
            for (let j = 0; j < p.text.length; j += 1) {
              if (res.cells[at + j]) res.cells[at + j].classList.add(p.arg === undefined ? 'play-seg-fixed' : `play-seg-${p.arg % 4}`);
            }
            at += p.text.length;
          });
        }
      }
    }

    function nextQuestion() {
      if (q >= asks.length) {
        ctx.solved(round.right, {});
        return;
      }
      const spec = asks[q];
      const result = evalCall(spec, env);
      const { src } = callParts(spec, env);
      const v = varsFor(spec, result);
      code.set([...decl.map(declLine), src]);
      code.on(decl.length, true);
      const opts = optionsFor(spec, result);
      const answer = answerOf(spec, result);
      askOne(ctx, qBox, { text: `\`${src}\``, label: src, opts, answer, whyOf: (opt) => {
        let keys = isThrown(result) ? [`${spec.call}.npe`, 'npe'] : (opt.key === 'throws' ? ['throws']
          : [`${spec.call}.${opt.kind || String(opt.key)}`, spec.call]);
        if (answerKind(spec) === 'sign' && !isThrown(result)) { // what decides: a differing pair, the lengths, or nothing
          const sit = result === 0 ? 'same' : (v.k >= Math.min(v.la, v.lb) ? 'prefix' : 'differ');
          keys = [`compareTo.${sit}`, 'compareTo'];
        }
        return whyAny(ctx, keys, { ...v, chosen: opt.text });
      } }, () => {
        code.tick(decl.length);
        reveal(spec, result);
        q += 1;
        const say = round.rightEach && round.rightEach[spec.call];
        if (q < asks.length) {
          if (say) ctx.good(say, v);
          else ctx.quiet();
          ctx.later(nextQuestion, MS.beat * 3);
        } else ctx.later(nextQuestion, MS.beat * 2);
      });
      const first = qBox.querySelector('.play-question:last-child button');
      if (q > 0 && first) first.focus({ preventScroll: true });
    }

    nextQuestion();
  };

  // ---- 13. concat: be the + ---------------------------------------------------------------------------

  // An expression of operands joined by +, as nested lists: [1, 2, "3"] is 1 + 2 + "3", and a list inside
  // is a group in brackets. Java works left to right, a bracketed group first when it reaches it.
  function plusTree(items, group) {
    let node = null;
    items.forEach((it) => {
      const leaf = Array.isArray(it) ? plusTree(it, true) : { value: it };
      node = node ? { left: node, right: leaf } : leaf;
    });
    if (group) node.group = true;
    return node;
  }
  const plusSrc = (items) => items.map((it) => (Array.isArray(it) ? `(${plusSrc(it)})` : (typeof it === 'string' ? jlit(it) : String(it)))).join(' + ');
  const plusOf = (l, r) => (typeof l === 'string' || typeof r === 'string' ? `${l}${r}` : l + r);
  const typeName = (v) => (typeof v === 'string' ? 'String' : 'int');
  const valueSrc = (v) => (typeof v === 'string' ? jlit(v) : String(v));

  TYPES.concat = (ctx) => {
    const { round } = ctx;
    const items = clone(pick(round.exprs));
    ctx.expose({ type: 'concat', expr: items });
    const tree = plusTree(items, false);
    const steps = [];
    (function post(node) {
      if (!node.left) return;
      post(node.left);
      post(node.right);
      steps.push(node);
    }(tree));
    ctx.task(round.prompt || 'You are the `+`. Java works from left to right: at each `+`, add or join?', {});
    const brd = board(ctx, 'play-split');
    const left = make('div', 'play-col');
    const right = make('div', 'play-col');
    brd.append(left, right);
    const code = codeView([`System.out.println(${plusSrc(items)});`]);
    const out = consoleView();
    left.append(code.el, out.el);
    const pic = make('div', 'play-pic play-concat-pic');
    const expr = make('div', 'play-expr');
    pic.appendChild(expr);
    right.appendChild(pic);

    function chip(v) {
      const el = make('span', `play-chip-v play-chip-${typeName(v) === 'String' ? 'str' : 'int'}`);
      el.append(make('span', 'play-chip-text', valueSrc(v)), make('span', 'play-chip-type', typeName(v)));
      return el;
    }

    (function draw(node) { // the expression's tokens, left to right
      if (!node.left) {
        node.chip = chip(node.value);
        expr.appendChild(node.chip);
        return;
      }
      if (node.group) {
        node.open = make('span', 'play-paren', '(');
        expr.appendChild(node.open);
      }
      draw(node.left);
      node.plus = make('span', 'play-plus', '+');
      expr.appendChild(node.plus);
      draw(node.right);
      if (node.group) {
        node.close = make('span', 'play-paren', ')');
        expr.appendChild(node.close);
      }
    }(tree));

    const group = controls(ctx, 'Add or join?', 'play-decide');
    const addBtn = btn('Add the numbers', { icon: 'plus', cls: 'play-add', onClick: () => decide('add') });
    const joinBtn = btn('Join as text', { icon: 'join', cls: 'play-join', onClick: () => decide('join') });
    group.append(addBtn, joinBtn);
    let s = 0;
    let busy = false;

    function current() {
      const node = steps[s];
      [addBtn, joinBtn].forEach((b) => b.setAttribute('aria-disabled', 'false'));
      expr.querySelectorAll('.play-active').forEach((x) => x.classList.remove('play-active'));
      [node.left.chip, node.plus, node.right.chip].forEach((x) => x.classList.add('play-active'));
      const v = { l: valueSrc(node.left.value), r: valueSrc(node.right.value), lt: typeName(node.left.value), rt: typeName(node.right.value) };
      ctx.task(s === 0 ? (round.prompt || 'You are the `+`. Java works left to right: `{l} + {r}` first. Add or join?')
        : 'Next: `{l} + {r}`. Add or join?', v);
      return v;
    }

    async function decide(choice) {
      if (busy || s >= steps.length) return;
      const node = steps[s];
      const l = node.left.value;
      const r = node.right.value;
      const join = typeof l === 'string' || typeof r === 'string';
      const v = { l: valueSrc(l), r: valueSrc(r), lt: typeName(l), rt: typeName(r), res: valueSrc(plusOf(l, r)),
        str: valueSrc(typeof l === 'string' ? l : r), num: valueSrc(typeof l === 'string' ? r : l) };
      if ((choice === 'join') !== join) {
        [node.left.chip, node.right.chip].forEach((x) => shake(x));
        ctx.bad(ctx.why(choice, v));
        return;
      }
      busy = true;
      [addBtn, joinBtn].forEach((b) => b.setAttribute('aria-disabled', 'true'));
      ctx.good(join ? '`{l} + {r}`: one side is a `String`, so `+` joins them into `{res}`.'
        : '`{l} + {r}`: both sides are `int`s, so `+` adds them: `{res}`.', v);
      const value = plusOf(l, r);
      const merged = chip(value);
      const parts = [node.left.chip, node.plus, node.right.chip];
      if (node.group) {
        parts.unshift(node.open);
        parts.push(node.close);
      }
      if (!still()) {
        const mid = node.plus.getBoundingClientRect();
        await Promise.all(parts.map((x) => {
          const b = x.getBoundingClientRect();
          const dx = mid.left + mid.width / 2 - (b.left + b.width / 2);
          return animate(x, [{ transform: 'none', opacity: 1 }, { transform: `translateX(${dx}px) scale(.7)`, opacity: 0 }],
            { duration: 380, easing: GLIDE, fill: 'forwards' });
        }));
      }
      if (!ctx.alive()) return;
      parts[0].before(merged);
      parts.forEach((x) => x.remove());
      pop(merged);
      delete node.left;
      delete node.right;
      node.value = value;
      node.chip = merged;
      s += 1;
      busy = false;
      if (s < steps.length) {
        ctx.later(current, MS.beat);
        return;
      }
      [addBtn, joinBtn].forEach((b) => { b.disabled = true; });
      merged.classList.add('play-final');
      code.tick(0);
      out.println(String(value));
      ctx.solved(round.right, { result: valueSrc(value), shown: String(value), type: typeName(value) });
    }

    current();
  };

  // ---- 14. pool: String objects, the pool, and arrows ------------------------------------------------------

  TYPES.pool = (ctx) => {
    const { round, data } = ctx;
    const word = pick(round.words || data.words);
    const suffix = round.suffixes ? pick(round.suffixes) : '';
    const kind = round.kind;
    ctx.expose({ type: 'pool', kind, word, suffix });
    const upperW = asciiUpper(word);
    const brd = board(ctx, kind === 'factory' || kind === 'alias' ? 'play-split' : 'play-split play-solo');
    const left = make('div', 'play-col');
    const right = make('div', 'play-col');
    brd.append(left, right);
    const L = (w) => jlit(w);
    const lines = {
      wire: [`String a = ${L(word)};`, `String b = ${L(word)};`, `String c = new String(${L(word)});`],
      judge: [`String a = ${L(word)};`, `String b = ${L(word)};`, `String c = new String(${L(word)});`],
      factory: [`String s = ${L(word)};`, 's.toUpperCase();', 'System.out.println(s);'],
      alias: [`String a = ${L(word)};`, 'String b = a;', `a = a + ${L(suffix)};`, 'System.out.println(b);'],
    }[kind];
    const code = codeView(lines);
    left.appendChild(code.el);
    const out = kind === 'factory' || kind === 'alias' ? consoleView() : null;
    if (out) left.appendChild(out.el);
    const pic = make('div', 'play-pic play-pool-pic');
    right.appendChild(pic);
    const varsCol = make('div', 'play-vars');
    const objsCol = make('div', 'play-objs');
    const poolBox = make('div', 'play-pool');
    poolBox.appendChild(make('span', 'play-pool-name', 'string pool'));
    const heap = make('div', 'play-heap');
    objsCol.append(poolBox, heap);
    pic.append(varsCol, objsCol);
    const wires = new Wires(pic, ctx);
    const names = kind === 'factory' ? ['s'] : (kind === 'alias' ? ['a', 'b'] : ['a', 'b', 'c']);
    const hues = { a: 'teal', b: 'purple', c: 'pink', s: 'teal' };
    const cells = {};
    names.forEach((nm) => {
      cells[nm] = varCell(nm);
      cells[nm].show('');
      varsCol.appendChild(cells[nm].el);
    });
    const arrows = {};

    function object(text, where, tagText) {
      const el = make('div', 'play-sobj');
      el.appendChild(make('span', 'play-sobj-text', jlit(text)));
      if (tagText) {
        const tag = make('span', 'play-sobj-tag');
        rich(tag, tagText);
        el.appendChild(tag);
      }
      (where === 'pool' ? poolBox : heap).appendChild(el);
      pop(el);
      wires.track(MS.pop);
      return el;
    }

    function point(nm, target, animated) {
      const dot = cells[nm].point(hues[nm]);
      if (arrows[nm]) wires.remove(arrows[nm]);
      arrows[nm] = wires.add(dot, target, hues[nm], { animate: animated });
      wires.track(MS.draw);
      return arrows[nm];
    }

    function bracket(x, y, same) { // a dashed bracket joining two variables, with its verdict
      const base = pic.getBoundingClientRect();
      const r1 = cells[x].cell.getBoundingClientRect();
      const r2 = cells[y].cell.getBoundingClientRect();
      const lx = Math.min(r1.left, r2.left) - base.left - 18;
      const y1 = r1.top + r1.height / 2 - base.top;
      const y2 = r2.top + r2.height / 2 - base.top;
      const line = make('span', `play-bracket ${same ? 'play-same' : 'play-differ'}`);
      Object.assign(line.style, { left: `${lx}px`, top: `${y1}px`, height: `${y2 - y1}px`, width: '18px' });
      const badge = make('span', `play-verdict ${same ? 'play-same' : 'play-differ'}`);
      badge.appendChild(icon(same ? 'check' : 'cross'));
      Object.assign(badge.style, { left: `${lx}px`, top: `${(y1 + y2) / 2}px` });
      overlay.append(line, badge);
      pop(badge);
    }
    const overlay = make('div', 'play-overlay');
    pic.appendChild(overlay);
    const qBox = make('div', 'play-questions');
    ctx.stage.appendChild(qBox);
    const vars = { word: jlit(word), upper: jlit(upperW), suffix: jlit(suffix), joined: jlit(word + suffix) };
    const tf = [{ key: true, text: 'true', mono: true }, { key: false, text: 'false', mono: true }];
    const printOpts = (texts) => texts.map((t) => ({ key: t, text: t, mono: true, label: `prints ${t}` }));
    const queue = [];
    const ask = (spec, done) => queue.push({ spec, done });

    function run() {
      const item = queue.shift();
      if (!item) {
        ctx.solved(round.right, vars);
        return;
      }
      if (item.spec.before) item.spec.before();
      askOne(ctx, qBox, item.spec, () => {
        item.done();
        if (queue.length) ctx.later(run, MS.beat * 2.6);
        else ctx.later(run, MS.beat * 2);
      });
      const first = qBox.querySelector('.play-question:last-child button');
      if (qBox.children.length > 1 && first) first.focus({ preventScroll: true });
    }

    let pooled;
    if (kind === 'wire' || kind === 'judge') {
      pooled = object(word, 'pool');
      point('a', pooled, false);
      code.tick(0);
      const where = [{ key: 'pool', text: `the pooled ${jlit(word)}, the one \`a\` points at` }, { key: 'new', text: `a new ${jlit(word)} object` }];
      if (kind === 'wire') {
        ctx.task(round.prompt || 'Run the code: where does each new variable point?', vars);
        ask({ text: `\`String b = ${jlit(word)};\`: where does \`b\` point?`, label: 'Where does b point?', opts: where, answer: 'pool',
          whyOf: () => ctx.why('b', vars) }, () => {
          code.tick(1);
          point('b', pooled, true);
          ctx.good('The literal is in the pool already, so `b` gets an arrow to that very object.', vars);
        });
        ask({ text: `\`String c = new String(${jlit(word)});\`: where does \`c\` point?`, label: 'Where does c point?', opts: where,
          answer: 'new', whyOf: () => ctx.why('c', vars) }, () => {
          code.tick(2);
          const fresh = object(word, 'heap', 'made by `new`');
          point('c', fresh, true);
          ctx.good('`new` always builds a fresh object, even when the pool already holds the same text.', vars);
        });
      } else {
        point('b', pooled, false);
        const fresh = object(word, 'heap', 'made by `new`');
        point('c', fresh, false);
        code.tick(1);
        code.tick(2);
        ctx.task(round.prompt || 'Judge each one: `true` or `false`?', vars);
        const same = (x, y) => () => {
          wires.hot(arrows[x], true);
          wires.hot(arrows[y], true);
          bracket(x, y, x !== 'c' && y !== 'c');
        };
        ask({ text: '`a == b`', label: 'a == b', opts: tf, answer: true, whyOf: () => ctx.why('a==b', vars) }, () => {
          same('a', 'b')();
          ctx.good('Both arrows end at the one pooled object: `a == b` is `true`.', vars);
        });
        ask({ text: '`a == c`', label: 'a == c', opts: tf, answer: false, whyOf: () => ctx.why('a==c', vars),
          before: () => { overlay.textContent = ''; wires.list.forEach((w) => wires.hot(w, false)); } }, () => {
          same('a', 'c')();
          ctx.good('Same text, two objects: `==` compares the arrows, so it is `false`.', vars);
        });
        ask({ text: '`a.equals(c)`', label: 'a.equals(c)', opts: tf, answer: true, whyOf: () => ctx.why('equals', vars),
          before: () => { overlay.textContent = ''; wires.list.forEach((w) => wires.hot(w, false)); } }, () => {
          pic.querySelectorAll('.play-sobj').forEach((o) => o.classList.add('play-hit'));
          ctx.good('`equals` reads the characters, and they match: `true`.', vars);
        });
      }
    } else if (kind === 'factory') {
      pooled = object(word, 'pool');
      point('s', pooled, false);
      code.tick(0);
      ctx.task(round.prompt || 'Strings never change. What does this print?', vars);
      ask({ text: 'What does `System.out.println(s)` print?', label: 'What does it print?', opts: shuffle(printOpts([word, upperW])),
        answer: word, whyOf: () => ctx.why('uncaught', vars) }, () => {
        code.tick(1);
        const made = object(upperW, 'heap', 'returned to nobody');
        made.classList.add('play-dead');
        out.println(word);
        code.tick(2);
        ctx.good('`toUpperCase()` built a new String and returned it, but nothing caught it: `s` never moved.', vars);
      });
      ask({ text: 'Now line 2 is `s = s.toUpperCase();`. What prints?', label: 'What prints now?', opts: shuffle(printOpts([word, upperW])),
        answer: upperW, whyOf: () => ctx.why('caught', vars),
        before: () => {
          code.set([lines[0], 's = s.toUpperCase();', lines[2]]);
          code.on(1, true);
          code.tick(0);
          heap.textContent = '';
          ctx.task('Catch the arrow: line 2 now assigns the result back to `s`.', vars);
        } }, () => {
        code.on(1, false);
        code.tick(1);
        const made = object(upperW, 'heap', 'caught by `s`');
        point('s', made, true);
        pooled.classList.add('play-dead');
        out.println(upperW);
        code.tick(2);
      });
    } else { // alias
      pooled = object(word, 'pool');
      point('a', pooled, false);
      point('b', pooled, false);
      code.tick(0);
      code.tick(1);
      ctx.task(round.prompt || '`b = a` copies the arrow. Then `a` changes. What about `b`?', vars);
      ask({ text: 'What does `System.out.println(b)` print?', label: 'What does it print?',
        opts: shuffle(printOpts([word, word + suffix])), answer: word, whyOf: () => ctx.why('alias', vars) }, () => {
        code.tick(2);
        const made = object(word + suffix, 'heap', 'made by `+`');
        point('a', made, true);
        out.println(word);
        code.tick(3);
        ctx.good('`+` built a new String and only `a`\'s arrow moved to it. `b` still points at the original, which cannot change.', vars);
      });
      ask({ text: 'And `a == b`?', label: 'a == b', opts: tf, answer: false, whyOf: () => ctx.why('a==b', vars) }, () => {
        bracket('a', 'b', false);
      });
    }
    run();
  };

  // ---- 15. builder: one StringBuilder, edited in place --------------------------------------------------

  const builderSrc = (call) => `sb.${call[0]}(${call.slice(1).map((x) => (typeof x === 'string' ? jlit(x) : String(x))).join(', ')});`;

  // What a call leaves in the buffer. Each character keeps its id, so the picture can glide it to its new box.
  function applyBuilder(items, call, mint) {
    const [op, x, y] = call;
    const fresh = (s) => Array.from(String(s)).map((ch) => ({ id: mint(), ch }));
    if (op === 'append') return [...items, ...fresh(x)];
    if (op === 'insert') return [...items.slice(0, x), ...fresh(y), ...items.slice(x)];
    if (op === 'delete') return [...items.slice(0, x), ...items.slice(Math.min(y, items.length))];
    if (op === 'reverse') return items.slice().reverse();
    if (op === 'setLength') return items.slice(0, x);
    throw new Error(`unknown builder call ${op}`);
  }
  const builderText = (s, call) => {
    let k = 0;
    return applyBuilder(Array.from(s).map((ch) => ({ id: (k += 1), ch })), call, () => (k += 1)).map((it) => it.ch).join('');
  };

  // The tempting wrong buffers after a call, each named for its mistake.
  function builderDecoys(s, call) {
    const [op, x, y] = call;
    const out = [];
    const right = builderText(s, call);
    const add = (kind, v) => { if (v !== right && !out.some((d) => d.value === v)) out.push({ kind, value: v }); };
    if (op === 'append') { add('front', x + s); add('same', s); }
    if (op === 'insert') { add('after', s.slice(0, x + 1) + y + s.slice(x + 1)); add('end', s + y); }
    if (op === 'delete') { add('inclusive', s.slice(0, x) + s.slice(y + 1)); add('shifted', s.slice(0, x + 1) + s.slice(y + 1)); }
    if (op === 'reverse') { add('same', s); }
    if (op === 'setLength') { add('one', s.slice(0, x - 1)); add('tail', s.slice(s.length - x)); }
    return out;
  }

  // Calls that do something close to a call, but not the same thing.
  function nearCalls(s, call) {
    const [op, x, y] = call;
    const right = builderText(s, call);
    const list = [];
    const add = (kind, c) => {
      const ok = (c[0] !== 'insert' || (c[1] >= 0 && c[1] <= s.length)) && (c[0] !== 'delete' || (c[1] >= 0 && c[1] < c[2] && c[2] <= s.length))
        && (c[0] !== 'setLength' || (c[1] >= 0 && c[1] <= s.length));
      if (ok && builderText(s, c) !== right && !list.some((d) => builderSrc(d.call) === builderSrc(c))) list.push({ kind, call: c });
    };
    if (op === 'insert') { add('after', ['insert', x + 1, y]); add('before', ['insert', x - 1, y]); add('append', ['append', y]); }
    if (op === 'delete') { add('inclusive', ['delete', x, y + 1]); add('short', ['delete', x, y - 1]); add('shifted', ['delete', x + 1, y + 1]); }
    if (op === 'append') { add('front', ['insert', 0, x]); }
    if (op === 'setLength') { add('more', ['setLength', x + 1]); add('less', ['setLength', x - 1]); }
    return list.slice(0, 2);
  }

  // A buffer of characters that edits itself in place: kept characters glide to their new boxes.
  function bufferRow(items) {
    const el = make('div', 'play-array play-string play-buffer play-hue-purple');
    const track = make('div', 'play-cells');
    el.appendChild(track);
    const cells = new Map();
    const view = { el, track, items: [] };
    const cellFor = (it) => {
      if (!cells.has(it.id)) {
        const cell = make('div', 'play-cell');
        const box = make('div', 'play-box');
        paint(box, 'text', it.ch);
        const idx = make('span', 'play-idx');
        idx.appendChild(make('span'));
        cell.append(box, idx);
        cells.set(it.id, cell);
      }
      return cells.get(it.id);
    };
    view.set = async (next, opts) => {
      const o = opts || {};
      const before = new Map();
      cells.forEach((cell, id) => before.set(id, cell.getBoundingClientRect().left));
      const keep = new Set(next.map((it) => it.id));
      const gone = [...cells.keys()].filter((id) => !keep.has(id));
      if (!o.instant && !still() && gone.length) {
        await Promise.all(gone.map((id) => animate(cells.get(id), [{ opacity: 1, transform: 'none' },
          { opacity: 0, transform: 'translateY(-20px) scale(.75)' }], { duration: 320, easing: 'ease-in', fill: 'forwards' })));
      }
      gone.forEach((id) => {
        cells.get(id).remove();
        cells.delete(id);
      });
      next.forEach((it, i) => {
        const cell = cellFor(it);
        cell.querySelector('.play-idx > span').textContent = String(i);
        track.appendChild(cell); // moves a kept cell: every cell ends up in its new order
      });
      view.items = next.slice();
      el.style.setProperty('--play-n', Math.max(next.length, 1));
      if (o.instant || still()) return;
      next.forEach((it, i) => {
        const cell = cells.get(it.id);
        if (!before.has(it.id)) {
          cell.classList.add('play-new-char');
          pop(cell, 80 + i * 25);
          return;
        }
        cell.classList.remove('play-new-char');
        const dx = before.get(it.id) - cell.getBoundingClientRect().left;
        if (Math.abs(dx) < 0.5) return;
        const lift = o.arc ? (i % 2 ? 16 : -16) : -6;
        animate(cell, [{ transform: `translateX(${dx}px)` }, { transform: `translate(${dx / 2}px, ${lift}px)`, offset: 0.5 },
          { transform: 'none' }], { duration: MS.glide, easing: GLIDE });
      });
      await wait(MS.glide + 80);
    };
    view.set(items, { instant: true });
    return view;
  }

  function miniChars(text) {
    const mini = make('span', 'play-mini play-mini-chars');
    Array.from(text).forEach((ch) => mini.appendChild(make('span', `play-mini-box${has(SHOW_CHAR, ch) ? ' play-space' : ''}`,
      has(SHOW_CHAR, ch) ? SHOW_CHAR[ch] : ch)));
    if (!text.length) mini.appendChild(make('span', 'play-mini-empty', '(empty)'));
    return mini;
  }

  TYPES.builder = (ctx) => {
    const { round } = ctx;
    const start = pick(round.starts);
    const calls = (round.calls || [round.call]).map((c) => c.map((arg) => (Array.isArray(arg) ? pick(arg) : arg)));
    const target = round.kind === 'target';
    ctx.expose({ type: 'builder', kind: target ? 'target' : 'predict', start, calls });
    let mintN = 0;
    const mint = () => (mintN += 1);
    let items = Array.from(start).map((ch) => ({ id: mint(), ch }));
    const brd = board(ctx, 'play-split');
    const left = make('div', 'play-col');
    const right = make('div', 'play-col');
    brd.append(left, right);
    const head = `StringBuilder sb = new StringBuilder(${jlit(start)});`;
    const lines = [head, ...(target ? ['sb.?;'] : calls.map(builderSrc)), 'System.out.println(sb);'];
    const code = codeView(target ? [head, [{ text: 'sb.' }, { text: '?', part: 'blank' }, { text: ';' }], 'System.out.println(sb);'] : lines);
    code.tick(0);
    const out = consoleView();
    left.append(code.el, out.el);
    const pic = make('div', 'play-pic play-builder-pic');
    right.appendChild(pic);
    const v = varCell('sb', 'purple');
    const obj = make('div', 'play-sb');
    obj.appendChild(make('span', 'play-obj-head', 'StringBuilder'));
    const buffer = bufferRow(items);
    const body = make('div', 'play-sb-body');
    body.appendChild(buffer.el);
    obj.appendChild(body);
    const tag = make('span', 'play-tag play-tag-same play-sb-tag', 'one object, edited in place');
    tag.hidden = true;
    pic.append(v.el, obj);
    if (target) {
      const want = make('div', 'play-want play-want-chars');
      want.append(make('span', 'play-want-head', 'target'), miniChars(builderText(start, calls[0])));
      pic.appendChild(want);
    }
    pic.appendChild(tag);
    const wires = new Wires(pic, ctx);
    wires.add(v.dot, obj, 'purple');
    const ctl = controls(ctx, target ? 'Which call?' : 'What sb holds', 'play-chips play-options');
    let c = 0;
    const text = () => items.map((it) => it.ch).join('');

    async function apply(call) {
      const before = text();
      items = applyBuilder(items, call, mint);
      await buffer.set(items, { arc: call[0] === 'reverse' });
      wires.track(200);
      if (!ctx.alive()) return;
      tag.hidden = false;
      return before;
    }

    function step() {
      ctl.textContent = '';
      if (c >= calls.length) {
        code.on(lines.length - 2, false);
        code.tick(lines.length - 1);
        out.println(text());
        ctx.solved(round.right, { result: jlit(text()), start: jlit(start) });
        return;
      }
      const call = calls[c];
      const s = text();
      const vars = { call: builderSrc(call), s: jlit(s), result: jlit(builderText(s, call)), x: call[1], y: call[2] };
      code.on(c, false);
      code.on(c + 1, true);
      ctx.task(c === 0 ? (round.prompt || 'Predict the buffer after each line: `{call}`') : 'Next line: `{call}`', vars);
      const list = [{ kind: 'right', value: builderText(s, call) }, ...builderDecoys(s, call)];
      const opts = shuffle(list).map((d) => ({ key: d.kind, text: '', node: miniChars(d.value), label: `sb holds ${d.value || '(empty)'}` }));
      choices(ctx, ctl, opts, 'right', async () => {
        await apply(call);
        if (!ctx.alive()) return;
        code.tick(c + 1);
        ctx.good(round.rightEach && round.rightEach[call[0]] ? round.rightEach[call[0]] : '`{call}` edits the buffer itself: no new object, nothing to catch.', vars);
        c += 1;
        ctx.later(step, MS.beat * 1.6);
      }, (opt) => whyAny(ctx, [`${call[0]}.${opt.key}`, call[0]], vars));
    }

    function chooseCall() {
      const call = calls[0];
      const s = text();
      const vars = { call: builderSrc(call), s: jlit(s), result: jlit(builderText(s, call)) };
      ctx.task(round.prompt || 'Which call turns `sb` into the target?', vars);
      const list = [{ kind: 'right', call }, ...nearCalls(s, call)];
      const opts = shuffle(list).map((d) => ({ key: d.kind, text: builderSrc(d.call), mono: true }));
      choices(ctx, ctl, opts, 'right', async () => {
        code.set([head, builderSrc(call), 'System.out.println(sb);']);
        code.on(1, true);
        await apply(call);
        if (!ctx.alive()) return;
        code.on(1, false);
        code.tick(0);
        code.tick(1);
        code.tick(2);
        pic.querySelector('.play-want').classList.add('play-want-done');
        out.println(text());
        ctx.solved(round.right, vars);
      }, (opt) => {
        const wrong = list.find((d) => d.kind === opt.key);
        return whyAny(ctx, [`${call[0]}.${opt.key}`, call[0]], { ...vars, chosen: builderSrc(wrong.call),
          got: jlit(builderText(s, wrong.call)) });
      });
    }

    if (target) chooseCall();
    else step();
  };

  // ---- 16. bug: spot the bug ------------------------------------------------------------------------------

  TYPES.bug = (ctx) => {
    const { round } = ctx;
    const sn = clone(pick(round.snippets));
    ctx.expose({ type: 'bug', code: sn.code, bug: sn.bug });
    const want = sn.fixedOut;
    const vars = { want: want.join(' / '), bugLine: sn.bug + 1 };
    ctx.task(round.prompt || 'It should print what the green box shows, but it doesn\'t. Click the line with the bug.', vars);
    const brd = board(ctx, 'play-split play-board-bug');
    const left = make('div', 'play-col');
    const right = make('div', 'play-col');
    brd.append(left, right);
    const codeEl = make('div', 'play-code play-code-bug');
    codeEl.setAttribute('role', 'group');
    codeEl.setAttribute('aria-label', 'The program: click a line');
    const lineBtns = sn.code.map((line, i) => {
      const b = make('button', 'play-line play-line-btn');
      b.type = 'button';
      const indent = line.length - line.trimStart().length;
      b.style.setProperty('--play-indent', indent);
      const num = make('span', 'play-line-no', String(i + 1));
      num.setAttribute('aria-hidden', 'true');
      b.appendChild(num);
      const txt = make('span', 'play-line-text');
      fillCode(txt, line.trimStart());
      b.appendChild(txt);
      b.setAttribute('aria-label', `line ${i + 1}: ${line.trim()}`);
      b.addEventListener('click', safe(() => onLine(i)));
      codeEl.appendChild(b);
      return b;
    });
    left.appendChild(codeEl);
    const out = consoleView();
    const runOut = (lines) => lines.forEach((l) => (typeof l === 'string' ? out.println(l, 'play-out-plain')
      : out.println(exceptionLine(thrown(l.throws, l.message)), 'play-out-err')));
    runOut(sn.out);
    const wantBox = make('div', 'play-want');
    wantBox.append(make('span', 'play-want-head', 'it should print'), consoleOption(want.join('\n')));
    left.append(out.el);
    const pic = make('div', 'play-bug-aside');
    pic.appendChild(wantBox);
    right.appendChild(pic);
    out.el.classList.add('play-console-bug');
    const ctl = controls(ctx, 'What is wrong with that line?', 'play-chips play-options play-explain');
    ctl.hidden = true;
    let found = false;

    function onLine(i) {
      if (found || lineBtns[i].getAttribute('aria-disabled') === 'true') return;
      if (i !== sn.bug) {
        shake(lineBtns[i]);
        const note = sn.notes && has(sn.notes, String(i)) ? sn.notes[String(i)] : null;
        ctx.bad(note || ctx.why('line', { ...vars, n: i + 1, code: sn.code[i].trim() }));
        return;
      }
      found = true;
      lineBtns.forEach((b) => b.setAttribute('aria-disabled', 'true'));
      const b = lineBtns[sn.bug];
      b.classList.add('play-line-bug');
      const mark = make('span', 'play-bug-mark');
      mark.appendChild(icon('bug'));
      b.appendChild(mark);
      pop(mark);
      ctx.good('Line {bugLine} is the one. Now say why.', vars);
      ctx.task('Why is line {bugLine} wrong?', vars);
      ctl.hidden = false;
      const opts = shuffle(round.explain.map((o) => ({ key: o.key, text: o.text })));
      choices(ctx, ctl, opts, round.answer, () => fix(), (opt) => ctx.why(opt.key, vars));
    }

    async function fix() {
      const b = lineBtns[sn.bug];
      const txt = b.querySelector('.play-line-text');
      if (!still()) await animate(txt, [{ opacity: 1 }, { opacity: 0, transform: 'translateX(-8px)' }], { duration: 260, fill: 'forwards' });
      if (!ctx.alive()) return;
      txt.getAnimations().forEach((a) => a.cancel()); // the fade-out's last frame must not outlive it
      txt.textContent = '';
      fillCode(txt, sn.fix.trimStart());
      b.classList.remove('play-line-bug');
      b.classList.add('play-line-fixed');
      b.setAttribute('aria-label', `line ${sn.bug + 1}: ${sn.fix.trim()}`);
      animate(txt, [{ opacity: 0, transform: 'translateX(8px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
      const tick = make('span', 'play-line-tick');
      tick.appendChild(icon('check'));
      const old = b.querySelector('.play-bug-mark');
      if (old) old.replaceWith(tick);
      else b.appendChild(tick);
      await wait(380);
      if (!ctx.alive()) return;
      out.el.querySelector('.play-console-out').textContent = '';
      want.forEach((l) => out.println(l));
      wantBox.classList.add('play-want-done');
      ctx.solved(round.right, { ...vars, fix: sn.fix.trim() });
    }
  };

  // ---- finding and loading the placeholders ----------------------------------------------------

  function check(data) {
    if (!data || typeof data !== 'object') throw new Error('not a puzzle');
    if (!data.id || !data.title || !Array.isArray(data.rounds) || !data.rounds.length) throw new Error('puzzle is incomplete');
    data.rounds.forEach((r) => {
      const type = r.type || data.type;
      if (!TYPES[type]) throw new Error(`unknown puzzle type ${type}`);
    });
  }

  function fail(root, err) {
    console.warn('lab puzzle could not be loaded:', err);
    root.textContent = '';
    root.classList.add('play-card', 'play-failed');
    root.setAttribute('data-play-state', 'failed');
    root.appendChild(make('p', 'play-fail-msg', 'This puzzle could not be loaded. The rest of the guide still works.'));
  }

  function load(root) {
    if (root.getAttribute('data-play-state')) return;
    root.setAttribute('data-play-state', 'loading');
    const id = root.getAttribute('data-play') || '';
    const src = root.getAttribute('data-src') || `puzzles/${encodeURIComponent(id)}.json`;
    Promise.resolve()
      .then(() => fetch(src, { credentials: 'same-origin' }))
      .then((response) => {
        if (!response.ok) throw new Error(`${src}: HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        check(data);
        root.puzzle = new Puzzle(root, data);
        root.setAttribute('data-play-state', 'ready');
      })
      .catch((err) => {
        try {
          fail(root, err);
        } catch (ignored) {
          // nothing more can be done for this placeholder
        }
      });
  }

  const scan = safe(() => {
    document.querySelectorAll('.lab-play').forEach((root) => load(root));
  });

  window.LabPlay = { scan, types: Object.keys(TYPES) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan);
  else scan();
})();
