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
  };

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
      node.appendChild(make('span', kind, word));
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
  function paint(box, elem, v) {
    box.querySelectorAll(':scope > .play-val, :scope > .play-num').forEach((n) => n.remove());
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
    const label = (i) => `${o.name}[${i}], holding ${spoken(o.elem, row.values[i])}`;
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
      const b = btn(opt.text, { label: opt.label, cls: `play-choice${opt.mono ? ' play-mono' : ''}`, onClick: () => {
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

  // The fewest swaps that sort distinct values: n minus the number of cycles.
  function minSwaps(values) {
    const sorted = values.slice().sort((a, b) => a - b);
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
    const sorted = values.slice().sort((a, b) => a - b);
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
