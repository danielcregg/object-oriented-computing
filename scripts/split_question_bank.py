#!/usr/bin/env python3
"""Split the full Moodle question-bank export into per-MCQ-week files.

Moodle XML sets the active category with <question type="category"> markers;
every following question belongs to that category until the next marker.
Each output file keeps its subtree's markers, so it re-imports cleanly.

Usage (from repo root): python scripts/split_question_bank.py
"""
import xml.etree.ElementTree as ET

SRC = "module/question-bank/full-export-2025-26.xml"
TARGETS = {
    "MCQ1": "weeks/week-05-mcq1/questions.xml",
    "MCQ2": "weeks/week-09-mcq2/questions.xml",
    "MCQ3": "weeks/week-13-mcq3/questions.xml",
}


def bucket_for(category_path):
    for key in TARGETS:
        prefix = f"$course$/top/{key}"
        if category_path == prefix or category_path.startswith(prefix + "/"):
            return key
    return None


def main():
    root = ET.parse(SRC).getroot()
    buckets = {key: [] for key in TARGETS}
    current = None
    for q in root.findall("question"):
        if q.get("type") == "category":
            current = bucket_for(q.find("category/text").text or "")
        if current:
            buckets[current].append(q)
    for key, path in TARGETS.items():
        quiz = ET.Element("quiz")
        quiz.extend(buckets[key])
        ET.indent(quiz)
        ET.ElementTree(quiz).write(path, encoding="UTF-8", xml_declaration=True)
        n_cat = sum(1 for e in buckets[key] if e.get("type") == "category")
        print(f"{key}: {len(buckets[key]) - n_cat} questions, "
              f"{n_cat} categories -> {path}")


if __name__ == "__main__":
    main()
