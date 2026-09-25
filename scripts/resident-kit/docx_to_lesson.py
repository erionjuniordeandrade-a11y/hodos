# -*- coding: utf-8 -*-
"""Converts a filled resident lesson-kit DOCX (see make_template.py) into a draft
JS module text in the lesson() shape (viewer/lesson_content.js / viewer/lessons/*.js),
with reviewStatus:'draft'.

This script does NOT register the lesson anywhere: it only writes the module text to
the output path given on the command line. Wiring a reviewed lesson into
viewer/lesson_content.js (adding an import, extending LESSONS, adding a
TEACHING_GUIDES entry, and building a real `scene` per SCENE GRAMMAR v2) is a
separate, human-reviewed step — the "Cena" the resident wrote is only ever emitted
here as a TODO comment; this script never invents scene grammar.

lesson() (viewer/lessons/resident-anatomy.js) has no rendered credit/author field
today (checked: no `credit`/`author`/`contributor` field is read by any viewer/*.js
UI module). The resident's full name is therefore written both as a clearly marked
top-of-file comment and as a `credit` field on the draft object, so it survives
review; wiring it into the actual UI is an open question for the owner (reported by
the agent that built this tool, not fixed here).

Usage:
    python3 scripts/resident-kit/docx_to_lesson.py <input.docx> <output.js>

Exit code 0 on success (output.js written). Exit code 1 if validation fails: every
error is a Portuguese sentence printed to stderr, and no output file is written.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from docx import Document

sys.path.insert(0, str(Path(__file__).resolve().parent))
from resident_kit_docx import N_STEPS, read_fields, validate  # noqa: E402

N_TAKEAWAYS_NOTE = (
    "Modelo pt-BR coleta uma Pergunta de abertura, um Resumo e uma Pergunta final / "
    "Resposta por aula (nao uma pergunta por passo); nao ha 3 'takeaways' distintos "
    "como em viewer/lesson_briefings.js. O revisor decide como mapear isso para "
    "TEACHING_GUIDES."
)


def slugify(title: str) -> str:
    ascii_title = (
        title.lower()
        .replace("ã", "a").replace("á", "a").replace("â", "a").replace("à", "a")
        .replace("é", "e").replace("ê", "e")
        .replace("í", "i")
        .replace("õ", "o").replace("ó", "o").replace("ô", "o")
        .replace("ú", "u").replace("ü", "u")
        .replace("ç", "c")
    )
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_title).strip("-")
    return slug or "rascunho-sem-titulo"


def js_string(value: str) -> str:
    return json.dumps(value or "", ensure_ascii=False)


def js_array(values) -> str:
    return "[" + ", ".join(js_string(v) for v in values) + "]"


def comment_safe(text: str) -> str:
    """One line for a // comment: every JS line terminator becomes a space."""
    return " ".join((text or "").split())


def lines_of(text: str) -> list:
    return [line.strip() for line in (text or "").splitlines() if line.strip()]


def render_lesson_js(fields: dict, source_docx_name: str) -> str:
    slug = slugify(fields["title"])
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    author = comment_safe(fields["author"])

    steps_js = []
    for n in range(1, N_STEPS + 1):
        title = fields[f"step{n}_title"].strip()
        text = fields[f"step{n}_text"].strip()
        scene = fields[f"step{n}_scene"].strip()
        sources = lines_of(fields[f"step{n}_sources"])
        scene_comment_lines = "\n".join(
            f"      //   {line}" for line in (scene.splitlines() or [""])
        )
        steps_js.append(
            "    {\n"
            f"      title: {js_string(title)},\n"
            f"      text: {js_string(text)},\n"
            "      // TODO(owner) SCENE: do not invent scene grammar (see SCENE GRAMMAR v2 in\n"
            "      // viewer/lesson_content.js). The resident described what to show as:\n"
            f"{scene_comment_lines}\n"
            "      // Author a real `scene` object from this description before wiring the lesson in.\n"
            f"      sourcesRaw: {js_array(sources)}, // TODO(owner): resolve each PMID/DOI into a\n"
            "      // SOURCES entry (id, title, url, evidenceClass, scope) before this can pass\n"
            "      // validateLessons() in viewer/lesson_content.js.\n"
            "      notes: '', // TODO(owner): the resident kit does not collect step notes.\n"
            "    }"
        )

    goals_js = js_array([fields["goal_1"], fields["goal_2"], fields["goal_3"]])
    references_js = js_array(lines_of(fields["references"]))
    steps_js_joined = ",\n".join(steps_js)

    return f"""// AUTO-GENERATED DRAFT — resident-authored lesson kit
// (Teach-back program unit 1D, docs/plans/2026-09-25-teach-back-program.md §3)
//
// Source DOCX: {comment_safe(source_docx_name)}
// Converted:   {generated_at}
//
// CREDIT: {author} (date on submission: {comment_safe(fields['date'])})
// lesson() in viewer/lessons/resident-anatomy.js has NO rendered credit/author field
// today — checked, none of viewer/*.js reads one. The name above is carried in the
// `credit` field below only as a placeholder the owner can wire up or relocate; it is
// not yet displayed anywhere in the app. Reported to the owner, not fixed here.
//
// NOT REGISTERED: this module is not imported by viewer/lesson_content.js and is not
// reachable from the running site. An editor must review every TODO below, resolve
// sourcesRaw into real SOURCES entries, author a real `scene` per step, and only then
// wire this lesson in deliberately (own import, own LESSONS entry, own TEACHING_GUIDES
// entry). {N_TAKEAWAYS_NOTE}

export const DRAFT_LESSON = {{
  id: {js_string(slug)},
  title: {js_string(fields['title'])},
  minutes: null, // TODO(owner): the resident kit does not collect minutes; estimate and set.
  summary: {js_string(fields['summary'])},
  goals: {goals_js},
  reviewStatus: 'draft',
  audience: 'Neurosurgical residents',
  credit: {js_string(author)},
  openingQuestion: {js_string(fields['opening_question'])}, // maps to TEACHING_GUIDES[id].question shape
  finalQuestion: {js_string(fields['final_question'])}, // TODO(owner): no existing lesson() field for a closing Q/A
  finalAnswer: {js_string(fields['final_answer'])},
  referencesRaw: {references_js}, // TODO(owner): resolve into SOURCES entries before wiring
  steps: [
{steps_js_joined}
  ],
}};
"""


def main(argv: list) -> int:
    if len(argv) != 3:
        print("Usage: python3 docx_to_lesson.py <input.docx> <output.js>", file=sys.stderr)
        return 2
    input_path, output_path = Path(argv[1]), Path(argv[2])
    if not input_path.exists():
        print(f"Arquivo não encontrado: {input_path}", file=sys.stderr)
        return 2

    doc = Document(str(input_path))
    fields = read_fields(doc)
    errors = validate(fields)
    if errors:
        print("O documento não passou na validação. Corrija e reenvie:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    js_text = render_lesson_js(fields, input_path.name)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(js_text, encoding="utf-8")
    print(f"Wrote draft lesson module to {output_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
