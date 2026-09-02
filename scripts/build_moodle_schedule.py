#!/usr/bin/env python3
"""Generate the Moodle course-page schedule block from module/schedule.json.

Writes OUTPUT_DIR/moodle-schedule-table.html: the same table the lecturer's
module-schedule-table-builder app would generate from the same JSON, ready to
paste into a Moodle "Text and media area" (Tools -> Source code). CI builds it
on every push, so the copy on the site is always current.

The rows are built with DOM calls only -- no HTML inside any string. Moodle's
course page strips every closing tag out of inline script text, which left the
builder's original innerHTML template with each icon's SVG unclosed, swallowing
the rest of the row. Keep it that way.

Usage:
    python scripts/build_moodle_schedule.py [OUTPUT_DIR]     # default: build
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from schedule import SCHEDULE, load  # noqa: E402

LABELS = {"week": "Week", "dates": "Dates (Mon - Sun)", "topic": "Topic", "lecture": "Lecture",
          "lab": "Lab", "assessment": "Assessment", "notes": "Notes"}
DEFAULT_ORDER = ["week", "dates", "topic", "lecture", "lab", "assessment", "notes"]
DEFAULT_WIDTHS = {"week": 58, "dates": 139, "topic": 143, "lecture": 81, "lab": 58,
                  "assessment": 114, "notes": 534}
TH = ('<th scope="col" style="width: {w}; white-space: nowrap; border-color: #cbd5e1; '
      'background-color: #1c1917; color: #ffffff;{c}">{label}</th>')

SCRIPT = r"""
  <script>
    (function() {
      const semesterStartDate = new Date(__Y__, __M__, __D__); // year, monthIndex(0=Jan), day

      const weeks = __WEEKS__;

      // Rows are built with DOM calls only. Moodle strips every closing tag
      // out of inline script text, so markup in strings cannot survive here.
      const SVG = "http://www.w3.org/2000/svg";

      function icon(stroke, shapes) {
        const s = document.createElementNS(SVG, "svg");
        const attrs = { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: stroke,
                        "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" };
        for (const k in attrs) s.setAttribute(k, attrs[k]);
        s.style.verticalAlign = "middle";
        shapes.forEach(function(shape) {
          const e = document.createElementNS(SVG, shape[0]);
          for (const k in shape[1]) e.setAttribute(k, shape[1][k]);
          s.appendChild(e);
        });
        return s;
      }
      const lectureIcon = function() {
        return icon("#d97706", [["rect", {x: 4, y: 2, width: 16, height: 20, rx: 2}],
                                ["line", {x1: 8, y1: 7, x2: 16, y2: 7}],
                                ["line", {x1: 8, y1: 11, x2: 16, y2: 11}],
                                ["line", {x1: 8, y1: 15, x2: 13, y2: 15}]]);
      };
      const labIcon = function() {
        return icon("#0f766e", [["rect", {x: 2, y: 3, width: 20, height: 14, rx: 2}],
                                ["line", {x1: 8, y1: 21, x2: 16, y2: 21}],
                                ["line", {x1: 12, y1: 17, x2: 12, y2: 21}]]);
      };

      function cell(tag, style, content) {
        const c = document.createElement(tag);
        c.setAttribute("style", style);
        if (typeof content === "string") c.textContent = content;
        else if (content) c.appendChild(content);
        return c;
      }
      function link(url, title, makeIcon) {
        const a = document.createElement("a");
        a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.title = title;
        a.appendChild(makeIcon());
        return a;
      }

      const tbody = document.getElementById("scheduleBody");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const M3 = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const fmtD = function(d) { return String(d.getDate()).padStart(2, "0") + " " + M3[d.getMonth()]; };

      weeks.forEach(function(item, index) {
        const weekStart = new Date(semesterStartDate);
        weekStart.setDate(semesterStartDate.getDate() + (index * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const row = document.createElement("tr");
        if (index % 2 === 1) row.style.backgroundColor = "#e2e8f0";
        if (today >= weekStart && today <= weekEnd) {
          row.style.backgroundColor = "#fff3cd";
          row.style.fontWeight = "bold";
          setTimeout(function() { row.scrollIntoView({ behavior: "smooth", block: "center" }); }, 100);
        } else if (item.week === "X") {
          row.style.backgroundColor = "#f0f0f0";
          row.style.fontStyle = "italic";
        }

        const th = cell("th", "border-color: #cbd5e1;", item.week);
        th.setAttribute("scope", "row");
        row.appendChild(th);
        row.appendChild(cell("td", "border-color: #cbd5e1;", fmtD(weekStart) + " - " + fmtD(weekEnd)));
        row.appendChild(cell("td", "border-color: #cbd5e1;", item.topic || ""));
        row.appendChild(cell("td", "border-color: #cbd5e1; text-align: center;",
          item.lectureUrl ? link(item.lectureUrl, "Open Lecture", lectureIcon) : ""));
        row.appendChild(cell("td", "border-color: #cbd5e1; text-align: center;",
          item.labUrl ? link(item.labUrl, "Open Lab", labIcon) : ""));
        row.appendChild(cell("td", "color: #b91c1c; font-weight: 500; border-color: #cbd5e1;", item.assessment || ""));
        row.appendChild(cell("td", "color: #666666; border-color: #cbd5e1;", item.notes || ""));
        tbody.appendChild(row);
      });
    })();
  </script>
"""


def render(raw: dict, start) -> str:
    order = [c for c in raw.get("columnOrder") or DEFAULT_ORDER if c in LABELS]
    widths = {**DEFAULT_WIDTHS, **{k: v for k, v in (raw.get("columnWidths") or {}).items() if k in LABELS}}
    total = sum(widths[c] for c in order)
    labels = {**LABELS, **(raw.get("columnLabels") or {})}
    heads = "\n".join(
        "        " + TH.format(w=f"{widths[c] / total * 100:.2f}%",
                                c=" text-align: center;" if c in ("lecture", "lab") else "",
                                label=labels[c])
        for c in order)
    keep = ("week", "topic", "lectureUrl", "videoUrl", "notebookLmUrl", "labUrl", "assessment", "notes")
    weeks = [{k: w.get(k, "") for k in keep} for w in raw["weeks"]]
    script = (SCRIPT.replace("__Y__", str(start.year)).replace("__M__", str(start.month - 1))
              .replace("__D__", str(start.day)).replace("__WEEKS__", json.dumps(weeks, indent=2)))
    return (f'<div class="schedule-window shadow-sm mb-5 rounded">\n'
            f'  <table id="courseSchedule"\n'
            f'    class="table table-hover table-bordered schedule-table"\n'
            f'    style="width: 100%; background-color: #f1f5f9;">\n'
            f'    <thead>\n      <tr>\n{heads}\n      </tr>\n    </thead>\n'
            f'    <tbody id="scheduleBody"></tbody>\n  </table>\n</div>\n<p>{script}</p>\n')


def main() -> None:
    out_dir = Path(sys.argv[1] if len(sys.argv) > 1 else "build")
    out_dir.mkdir(parents=True, exist_ok=True)
    sched = load()
    dest = out_dir / "moodle-schedule-table.html"
    dest.write_text(render(sched.raw, sched.start), encoding="utf-8", newline="\n")
    print(f"wrote {dest} ({len(sched.rows)} rows from {SCHEDULE})")


if __name__ == "__main__":
    main()
