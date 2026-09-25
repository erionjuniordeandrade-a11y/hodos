# -*- coding: utf-8 -*-
"""Round-trip test for the resident lesson kit (Teach-back program unit 1D).

make_filled_example (below) fills a copy of the real template with motor-cst's
first 5 steps (pulled live from viewer/lessons/resident-anatomy.js via Node, so
this test tracks the real lesson content instead of a frozen snapshot), then
docx_to_lesson.py converts it and we assert the title, all 5 step titles and
every cited source id survive into the draft JS. A negative-control DOCX with
one step's Título blanked out must fail validation with a Portuguese message
naming that step.

Run: python3 -m pytest -q scripts/resident-kit/
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest
from docx import Document

sys.path.insert(0, str(Path(__file__).resolve().parent))
from resident_kit_docx import build_template, write_fields, validate, read_fields  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
CONVERTER = Path(__file__).resolve().parent / "docx_to_lesson.py"


def _motor_cst_first_five_steps() -> dict:
    """Pull motor-cst's title/summary/goals/opening-question and first 5 steps
    (title, text, raw PMID/DOI per source id) straight from the live JS modules."""
    script = """
import {LESSONS,SOURCES} from './viewer/lesson_content.js';
import {TEACHING_GUIDES} from './viewer/lesson_briefings.js';
const lesson = LESSONS.find(l => l.id === 'motor-cst');
const guide = TEACHING_GUIDES['motor-cst'];
function rawCitation(id) {
  const url = SOURCES[id].url;
  const pmid = url.match(/pubmed\\.ncbi\\.nlm\\.nih\\.gov\\/(\\d+)/);
  if (pmid) return pmid[1];
  const doi = url.match(/doi\\.org\\/(.+)$/);
  if (doi) return doi[1];
  return url;
}
const steps = lesson.steps.slice(0, 5).map(s => ({
  title: s.title,
  text: s.text,
  sources: [...new Set(s.sources.map(rawCitation))],
}));
console.log(JSON.stringify({
  title: lesson.title,
  summary: lesson.summary,
  goals: lesson.goals,
  question: guide.question,
  steps,
}));
"""
    result = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=REPO_ROOT, capture_output=True, text=True, timeout=30,
    )
    assert result.returncode == 0, f"node extraction failed: {result.stderr}"
    return json.loads(result.stdout)


@pytest.fixture(scope="module")
def motor_data():
    return _motor_cst_first_five_steps()


def _fill_data(motor_data: dict) -> dict:
    all_sources = []
    data = {
        "title": motor_data["title"],
        "author": "Ana Beatriz Fonseca",
        "date": "2026-09-25",
        "opening_question": motor_data["question"],
        "summary": motor_data["summary"],
        "goal_1": motor_data["goals"][0],
        "goal_2": motor_data["goals"][1],
        "goal_3": motor_data["goals"][2],
        "final_question": "O que muda quando a lesão está no braço posterior versus no braço anterior?",
        "final_answer": "A referência medial muda de tálamo para a cabeça do caudado, mantendo o núcleo lentiforme lateral.",
    }
    for i, step in enumerate(motor_data["steps"], start=1):
        data[f"step{i}_title"] = step["title"]
        data[f"step{i}_text"] = step["text"]
        data[f"step{i}_scene"] = f"Mostrar a cena do passo {i}: destacar as estruturas citadas no texto."
        data[f"step{i}_sources"] = step["sources"]
        all_sources.extend(step["sources"])
    data["references"] = [f"Fonte {s} — referência completa a preencher pelo revisor." for s in all_sources]
    return data


def test_round_trip_motor_cst_first_five_steps(tmp_path, motor_data):
    data = _fill_data(motor_data)

    doc = build_template()
    write_fields(doc, data)
    filled_path = tmp_path / "filled.docx"
    doc.save(str(filled_path))

    # Sanity: read_fields on our own filled doc must recover the same values we wrote
    # (this is the read half of the round trip; validate() below is the second half).
    reread = read_fields(Document(str(filled_path)))
    assert reread["title"] == data["title"]
    assert validate(reread) == []

    out_path = tmp_path / "draft-lesson.js"
    result = subprocess.run(
        [sys.executable, str(CONVERTER), str(filled_path), str(out_path)],
        capture_output=True, text=True, timeout=30,
    )
    assert result.returncode == 0, f"converter failed: {result.stderr}"
    assert out_path.exists()
    js_text = out_path.read_text(encoding="utf-8")

    assert data["title"] in js_text
    for step in motor_data["steps"]:
        assert step["title"] in js_text, f"missing step title: {step['title']}"
    all_ids = {sid for step in motor_data["steps"] for sid in step["sources"]}
    assert all_ids, "sanity: motor-cst's first 5 steps should cite at least one source"
    for source_id in all_ids:
        assert source_id in js_text, f"missing source id: {source_id}"
    assert "reviewStatus: 'draft'" in js_text
    assert "Ana Beatriz Fonseca" in js_text  # credit survives (see report: no rendered UI field exists yet)


def test_negative_control_missing_step_title_fails_validation_in_portuguese(tmp_path, motor_data):
    data = _fill_data(motor_data)
    data["step3_title"] = ""  # blank out one required field in an otherwise-complete step

    doc = build_template()
    write_fields(doc, data)
    filled_path = tmp_path / "filled-missing-step.docx"
    doc.save(str(filled_path))

    reread = read_fields(Document(str(filled_path)))
    errors = validate(reread)
    assert any("Passo 3" in e and "incompleto" in e for e in errors), errors

    out_path = tmp_path / "draft-lesson.js"
    result = subprocess.run(
        [sys.executable, str(CONVERTER), str(filled_path), str(out_path)],
        capture_output=True, text=True, timeout=30,
    )
    assert result.returncode == 1
    assert not out_path.exists()
    assert "Passo 3" in result.stderr
    assert "incompleto" in result.stderr
    # Message must be Portuguese, not English — a quick smoke check.
    assert "before" not in result.stderr.lower()


def _convert(tmp_path, doc, name="hostile"):
    filled = tmp_path / f"{name}.docx"
    doc.save(str(filled))
    out = tmp_path / f"{name}.js"
    result = subprocess.run(
        [sys.executable, str(CONVERTER), str(filled), str(out)],
        capture_output=True, text=True, timeout=30,
    )
    return result, out


def test_line_breaks_in_comment_fields_cannot_escape_the_comment(tmp_path, motor_data):
    data = _fill_data(motor_data)
    data["author"] = "Ana Beatriz\nexport const pwned = 1;"
    data["date"] = "2026-09-25\nglobalThis.x = 2;"
    doc = build_template()
    write_fields(doc, data)
    result, out = _convert(tmp_path, doc)
    assert result.returncode == 0, result.stderr
    js_text = out.read_text(encoding="utf-8")
    for line in js_text.splitlines():
        assert not line.lstrip().startswith(("export const pwned", "globalThis.x")), line
    # the draft is an ES module: import it to prove it still parses
    check = subprocess.run(
        ["node", "--input-type=module", "-e",
         f"import {{readFileSync}} from 'fs'; "
         f"await import('data:text/javascript,'+encodeURIComponent(readFileSync({json.dumps(str(out))},'utf8')))"],
        capture_output=True, text=True, timeout=30,
    )
    assert check.returncode == 0, check.stderr
    assert "pwned" not in check.stdout


def test_extra_passo_row_is_reported_not_silently_dropped(tmp_path, motor_data):
    doc = build_template()
    write_fields(doc, _fill_data(motor_data))
    extra = doc.add_table(rows=1, cols=2)
    extra.cell(0, 0).text = "Passo 6 – Título"
    extra.cell(0, 1).text = "Um sexto passo que o residente acrescentou"
    result, out = _convert(tmp_path, doc)
    assert result.returncode == 1
    assert not out.exists()
    assert "Passo 6" in result.stderr


def test_duplicated_field_row_is_reported(tmp_path, motor_data):
    doc = build_template()
    write_fields(doc, _fill_data(motor_data))
    dup = doc.add_table(rows=1, cols=2)
    dup.cell(0, 0).text = "Passo 2 – Título"
    dup.cell(0, 1).text = "Outro título"
    result, out = _convert(tmp_path, doc)
    assert result.returncode == 1
    assert "Passo 2" in result.stderr and "mais de uma vez" in result.stderr


@pytest.mark.parametrize("line", ["10.1093/brain/awt163.", "10.1093/brain/awt163,", "doi:10.1093/brain/awt163;"])
def test_doi_with_trailing_punctuation_is_rejected(tmp_path, motor_data, line):
    data = _fill_data(motor_data)
    data["step1_sources"] = [line]
    doc = build_template()
    write_fields(doc, data)
    result, out = _convert(tmp_path, doc)
    assert result.returncode == 1
    assert "Passo 1" in result.stderr
