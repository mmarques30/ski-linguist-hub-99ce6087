#!/usr/bin/env python3
"""Rapport DSF — niveaux, progression et appréciation Michèle Looten.

Formation Anglais appliqué spécifique pisteurs — Les 2 Alpes — 11-13 nov. 2026.
Données issues des bilans de sortie saisis le 14/11/2026.

  python3 scripts/prepare-dsf-pisteurs-2alpes-nov2026-report.py
"""
from __future__ import annotations

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

OUT = Path("/opt/cursor/artifacts/dsf-pisteurs-2alpes-nov2026")

STUDENTS = [
    # nom, entrée gén., entrée tech., sortie gén., sortie tech., progression
    ("BARJAT Amaury", "B2", "B1", "B2", "B2", "Oui"),
    ("BOUTIN Edouard", "B2", "B1", "B2+", "B2+", "Oui"),
    ("BUCHERON Maxim", "B2", "B1", "B2+", "B2+", "Oui"),
    ("CORNU Nathan", "B1", "A2+", "B1+", "B1+", "Oui"),
    ("DUCHEMIN Meriadeg", "B1", "A2+", "B2", "B2", "Oui"),
    ("DUCLAUT Joris", "B2", "B1", "B2+", "B2+", "Oui"),
    ("DUPLESSIS Ludovic", "B2+", "B2", "C1", "C1", "Oui"),
    ("HUGUET Elie", "A2", "A1+", "B1+", "B1+", "Oui"),
    ("MASSART Maxime", "A2", "A1+", "A2", "A2", "Oui"),
    ("MONTMASSON Laura", "B2+", "B2+", "C1", "C1", "Oui"),
    ("PINTO Nicolas", "B2", "B1", "C1", "C1", "Oui"),
    ("ROUX Nino", "A2", "A1+", "B1", "B1", "Oui"),
]

APPRECIATION = (
    "Le groupe était très motivé et a bien progressé, que ce soit dans les "
    "activités questions - réponses, dans les jeux de rôle ou dans les "
    "applications grammaticales plus précises. L'ambiance, la cohésion de "
    "groupe et sa dynamique étaient particulièrement remarquables et "
    "impressionnantes, à tel point que je pensais que certains se "
    "connaissaient déjà. Ce qui n'était pas le cas, à ma grande surprise."
)

HETEROGENEITE = (
    "En fait ce groupe est très hétérogène puisqu'il va de C1 à A2."
)

LOGISTIQUE = "Tous les moyens étaient réunis pour que tout se passe fort bien."

ATTENTES_ENTREE = (
    "Attentes : connaissances du vocabulaire pisteurs. "
    "Compétences : maîtrise orale des secours. "
    "Thèmes : secours, météo, renseignements pistes et station. "
    "Moyens : excellents. "
    "Niveau d'entrée du groupe très hétérogène (A2 à B2+)."
)


def set_run_font(run, size=11, bold=False, color=None):
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    run.font.size = Pt(size)
    run.bold = bold
    if color:
        run.font.color.rgb = color


def add_heading_para(doc, text, size=14):
    p = doc.add_paragraph()
    r = p.add_run(text)
    set_run_font(r, size, bold=True, color=RGBColor(0x8B, 0x00, 0x5A))
    return p


def add_body(doc, text, size=11, bold=False):
    p = doc.add_paragraph()
    r = p.add_run(text)
    set_run_font(r, size, bold=bold)
    p.paragraph_format.space_after = Pt(8)
    return p


def build_report() -> Path:
    OUT.mkdir(parents=True, exist_ok=True)
    doc = Document()
    section = doc.sections[0]
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.left_margin = Cm(1.8)
    section.right_margin = Cm(1.8)
    section.top_margin = Cm(1.5)
    section.bottom_margin = Cm(1.5)

    add_heading_para(
        doc,
        "Rapport de fin de formation — DSF Formation",
        16,
    )
    add_body(
        doc,
        "Anglais appliqué spécifique Pisteurs secouristes · Les 2 Alpes · 11–13 novembre 2026",
        12,
        bold=True,
    )
    add_body(
        doc,
        "Contrat de prestation n° 26 290 · Groupe PS1-2ALPES · 12 stagiaires · 21 heures · Formatrice : Michèle Looten",
        10,
    )
    add_body(
        doc,
        "Lieu : Le Chalet des Glaciers — 1 Route du Petit Plan",
        10,
    )

    add_heading_para(doc, "1. Appréciation de la formatrice", 13)
    add_body(doc, APPRECIATION)
    add_body(doc, f"Hétérogénéité : {HETEROGENEITE}")
    add_body(doc, f"Logistique : {LOGISTIQUE}")
    add_body(doc, f"Contexte d'entrée : {ATTENTES_ENTREE}", 10)

    add_heading_para(doc, "2. Niveaux et progression individuelle", 13)
    add_body(
        doc,
        "Niveaux CECRL — entrée (bilan formatrice) → sortie. "
        "Progression constatée pour chaque stagiaire ; objectifs atteints : oui.",
        10,
    )

    headers = [
        "Stagiaire",
        "Entrée gén.",
        "Entrée tech.",
        "Sortie gén.",
        "Sortie tech.",
        "Progression",
    ]
    table = doc.add_table(rows=1 + len(STUDENTS), cols=len(headers))
    table.style = "Table Grid"
    for i, h in enumerate(headers):
        cell = table.rows[0].cells[i]
        cell.text = h
        for p in cell.paragraphs:
            for run in p.runs:
                set_run_font(run, 9, bold=True)
    for row_i, row in enumerate(STUDENTS, start=1):
        for col_i, value in enumerate(row):
            cell = table.rows[row_i].cells[col_i]
            cell.text = value
            for p in cell.paragraphs:
                for run in p.runs:
                    set_run_font(run, 9)

    doc.add_paragraph()
    add_heading_para(doc, "3. Synthèse des niveaux de sortie", 13)
    counts: dict[str, int] = {}
    for _, _, _, sortie, _, _ in STUDENTS:
        counts[sortie] = counts.get(sortie, 0) + 1
    order = ["A2", "B1", "B1+", "B2", "B2+", "C1"]
    lines = [f"· {lvl} : {counts[lvl]} stagiaire(s)" for lvl in order if lvl in counts]
    add_body(doc, "\n".join(lines))
    add_body(
        doc,
        "Niveau général du groupe en sortie (appréciation formatrice) : B2.",
        10,
        bold=True,
    )

    add_heading_para(doc, "4. Progression — remarques", 13)
    add_body(
        doc,
        "Tous les stagiaires ont progressé (case progression = Oui ; objectif atteint = oui), "
        "y compris Maxime MASSART qui consolide son A2 (général et technique). "
        "Les plus fortes progressions : Elie HUGUET (A2 → B1+), Nino ROUX (A2 → B1), "
        "Meriadeg DUCHEMIN (B1 → B2), Nicolas PINTO (B2 → C1).",
    )

    footer = doc.add_paragraph()
    footer.alignment = WD_ALIGN_PARAGRAPH.LEFT
    r = footer.add_run(
        "Document établi à partir du bilan de sortie Michèle Looten (saisi le 14/11/2026) — FLI."
    )
    set_run_font(r, 9, color=RGBColor(0x66, 0x66, 0x66))

    out = OUT / "Rapport-niveaux-appreciation-DSF-Pisteurs-2Alpes-nov2026.docx"
    doc.save(out)
    return out


if __name__ == "__main__":
    path = build_report()
    print(path)
