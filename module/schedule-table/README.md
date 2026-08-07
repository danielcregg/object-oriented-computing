# Module Schedule Table (builder template)

`module-schedule.json` is an export from the
[module-schedule-table-builder](https://github.com/danielcregg/module-schedule-table-builder)
app — a browser-based editor that renders a Moodle-ready schedule table
(week / dates / topic / lecture / lab / assessment / notes, with icon links).

Status: **template with placeholder topics/URLs** (sem1 layout: weeks 1–6,
X = reading week, 7–13; start date to be set per delivery). The plan is to
fill it with this repo's real content — lecture links (`weeks/*/lecture/`),
lab invitations (`weeks/*/lab/lab.md`), MCQ weeks — load it in the builder,
and paste the generated table into the Moodle course page (replacing the
Google-Sheets iframe currently embedded via
`module/moodle-assets/course-banner.html`).

Reading-week anchor: the X row always lands on the Irish October
bank-holiday week — 6 teaching weeks before it, 6 after.
