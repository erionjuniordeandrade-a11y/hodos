# -*- coding: utf-8 -*-
"""Builds docs/resident-kit/modelo-aula-residente.docx — the pt-BR, zero-terminal
DOCX template a resident fills in Word to author a Hodos lesson draft.

Usage:
    python3 scripts/resident-kit/make_template.py [output_path]

Default output_path: docs/resident-kit/modelo-aula-residente.docx (relative to the repo root).
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from resident_kit_docx import build_template  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT = REPO_ROOT / "docs" / "resident-kit" / "modelo-aula-residente.docx"


def main(argv: list) -> int:
    out_path = Path(argv[1]).resolve() if len(argv) > 1 else DEFAULT_OUTPUT
    out_path.parent.mkdir(parents=True, exist_ok=True)
    doc = build_template()
    doc.save(str(out_path))
    print(f"Wrote template to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
