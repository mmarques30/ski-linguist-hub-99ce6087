#!/usr/bin/env python3
"""Génère Word modifiable + tableau niveaux + brouillon mail Fabienne (DSF Mandica). Aucun envoi."""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

OUT = Path("/opt/cursor/artifacts/mollard-oct-2026/dsf-mandica")
DSF_HEADER = Path("/workspace/public/evaluation-pdf/dsf-papier-entete-A4.png")
DOTX = Path(
    "/home/ubuntu/.cursor/projects/workspace/uploads/Re_sultat_d_e_val_DSF_forms_f700.dotx"
)

SCORES = {
    "Compréhension": (3.5, "B2+"),
    "Expression": (3.5, "B2+"),
    "Structures de la langue": (3.5, "B2+"),
    "Expression technique et spécifique": (3.5, "B2+"),
    "Conversation générale": (3.5, "B2+"),
    "Appréciation générale": (3.5, "B2+"),
}

APPRECIATION = """Vous vous exprimez d'une façon assez claire et autonome.

Vous avez plutôt bien compris le texte audio et moi-même. Vous avez de bonnes bases en grammaire et vous êtes capable de vous exprimer dans tous les temps.

En ce qui concerne la partie spécifique à votre métier, vous vous exprimez avec enthousiasme et précision.

En conclusion vous avez un niveau opérationnel qui vous permet de communiquer correctement avec la clientèle anglophone. Continuez néanmoins à développer l'apprentissage de vos connaissances, vous gagnerez en aisance et en fluidité."""


def set_run_font(run, size=11, bold=False, color=None):
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    run.font.size = Pt(size)
    run.bold = bold
    if color:
        run.font.color.rgb = color


def build_word() -> Path:
    doc = Document()
    section = doc.sections[0]
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.left_margin = Cm(1.8)
    section.right_margin = Cm(1.8)
    section.top_margin = Cm(1.2)
    section.bottom_margin = Cm(1.5)

    if DSF_HEADER.exists():
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run()
        run.add_picture(str(DSF_HEADER), width=Cm(17.4))

    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = title.add_run("EVALUATION EN LANGUE VIVANTE 2025 / 2026")
    set_run_font(r, 14, bold=True, color=RGBColor(0x8B, 0x00, 0x5A))

    meta = [
        ("Nom – Prénom", "Steven Mandica"),
        ("Entreprise", "Téléphérique du Salève"),
        ("Langue évaluée", "Anglais"),
        ("Date de l'évaluation", "08/10/2026"),
        ("Nom de l'évaluateur/formateur", "C. Mollard"),
        ("Avez-vous déjà été évalué(e) ?", "NON"),
    ]
    for label, value in meta:
        p = doc.add_paragraph()
        r1 = p.add_run(f"{label} : ")
        set_run_font(r1, 11, bold=True)
        r2 = p.add_run(value)
        set_run_font(r2, 11)

    doc.add_paragraph()
    h = doc.add_paragraph()
    r = h.add_run("Compétences évaluées")
    set_run_font(r, 12, bold=True, color=RGBColor(0x8B, 0x00, 0x5A))

    table = doc.add_table(rows=1, cols=2)
    table.style = "Table Grid"
    hdr = table.rows[0].cells
    hdr[0].text = "Compétence évaluée"
    hdr[1].text = "Niveau"
    for cell in hdr:
        for p in cell.paragraphs:
            for run in p.runs:
                set_run_font(run, 10, bold=True)

    for skill, (score, cecrl) in SCORES.items():
        row = table.add_row().cells
        row[0].text = skill
        row[1].text = f"{str(score).replace('.', ',')} - {cecrl}"
        for cell in row:
            for p in cell.paragraphs:
                for run in p.runs:
                    set_run_font(run, 10)

    doc.add_paragraph()
    bareme = doc.add_paragraph()
    r = bareme.add_run("Barème européen")
    set_run_font(r, 11, bold=True, color=RGBColor(0x8B, 0x00, 0x5A))

    bareme_rows = [
        ("A1", "Niveau d'entrée 0", "Faux débutant / Quelques notions / Éveil"),
        ("A2", "Niveau 1", "Élémentaire / Pré-intermédiaire / Survie"),
        ("B1", "Niveau 2", "Intermédiaire / Autonomie"),
        ("B2", "Niveau 3", "Post intermédiaire / Opérationnel"),
        ("C1", "Niveau 4", "Perfectionnement / Fluidité / Aisance"),
        ("C2", "Niveau 5", "Maîtrise"),
    ]
    bt = doc.add_table(rows=1, cols=3)
    bt.style = "Table Grid"
    for i, t in enumerate(["CECRL", "Niveau", "Libellés"]):
        bt.rows[0].cells[i].text = t
        for p in bt.rows[0].cells[i].paragraphs:
            for run in p.runs:
                set_run_font(run, 9, bold=True)
    for a, b, c in bareme_rows:
        cells = bt.add_row().cells
        cells[0].text, cells[1].text, cells[2].text = a, b, c
        for cell in cells:
            for p in cell.paragraphs:
                for run in p.runs:
                    set_run_font(run, 9)

    doc.add_paragraph()
    ah = doc.add_paragraph()
    r = ah.add_run("Appréciation")
    set_run_font(r, 12, bold=True, color=RGBColor(0x8B, 0x00, 0x5A))
    for para in APPRECIATION.strip().split("\n\n"):
        p = doc.add_paragraph()
        run = p.add_run(para)
        set_run_font(run, 10)

    note = doc.add_paragraph()
    r = note.add_run(
        "Document modifiable — modèle DSF forms. Dotx de référence joint au pack."
    )
    set_run_font(r, 8, color=RGBColor(0x66, 0x66, 0x66))

    out = OUT / "evaluation-Steven-Mandica-anglais-DSF.docx"
    doc.save(out)
    # Also keep a copy of the blank template for Paula
    if DOTX.exists():
        shutil.copy2(DOTX, OUT / "modele-Resultat-eval-DSF-forms.dotx")
    return out


def build_levels_table() -> Path:
    """Tableau session (1 candidat) — compétences + niveau final."""
    doc = Document()
    section = doc.sections[0]
    section.page_width = Cm(29.7)
    section.page_height = Cm(21.0)
    section.left_margin = Cm(1.5)
    section.right_margin = Cm(1.5)
    section.top_margin = Cm(1.5)
    section.bottom_margin = Cm(1.5)

    title = doc.add_paragraph()
    r = title.add_run(
        "Tableau des niveaux — session DSF 08/10/2026 — Téléphérique du Salève"
    )
    set_run_font(r, 13, bold=True, color=RGBColor(0x8B, 0x00, 0x5A))

    sub = doc.add_paragraph()
    r = sub.add_run("Contrat de prestation n° 26 338 · Évaluatrice : Carole Mollard")
    set_run_font(r, 10, color=RGBColor(0x55, 0x55, 0x55))

    headers = [
        "Nom",
        "Entreprise",
        "Langue",
        "Compréhension",
        "Expression",
        "Structures",
        "Technique",
        "Conversation",
        "Niveau final",
        "CECRL",
    ]
    values = [
        "Steven Mandica",
        "Téléphérique du Salève",
        "Anglais",
        "3,5",
        "3,5",
        "3,5",
        "3,5",
        "3,5",
        "3 — Opérationnel",
        "B2+",
    ]
    table = doc.add_table(rows=2, cols=len(headers))
    table.style = "Table Grid"
    for i, h in enumerate(headers):
        table.rows[0].cells[i].text = h
        for p in table.rows[0].cells[i].paragraphs:
            for run in p.runs:
                set_run_font(run, 9, bold=True)
    for i, v in enumerate(values):
        table.rows[1].cells[i].text = v
        for p in table.rows[1].cells[i].paragraphs:
            for run in p.runs:
                set_run_font(run, 9)

    # CSV twin
    csv_path = OUT / "tableau-niveaux-DSF-Saleve-08-10-2026.csv"
    csv_path.write_text(
        ";".join(headers) + "\n" + ";".join(values) + "\n", encoding="utf-8"
    )

    out = OUT / "tableau-niveaux-DSF-Saleve-08-10-2026.docx"
    doc.save(out)
    return out


def build_email_draft() -> Path:
    body = """Bonjour Fabienne,

voici le résultat du test d'anglais de Steven Mandica (Téléphérique du Salève), passé le 08/10/2026 — niveau B2+ (opérationnel).

Je joins :
- le résultat en PDF ;
- le même document en Word (modifiable) ;
- le tableau des niveaux de la session ;
- la facture n° 26-27.14335 (42 € HT / 50,40 € TTC) à régler — échéance 30/11/2026 ;
- pour mémoire, le contrat de prestation n° 26 338.

Coordonnées bancaires FLI sur la facture (réf. à indiquer : 26-27.14335 / Contrat 26 338).

N'hésite pas si tu as besoin d'un ajustement sur le document Word.

À bientôt,
Paula
FLI — France Langues International
25 avenue de la Gare — 73800 Montmélian
Tél. : 04 79 28 21 09
info@fli.fr
"""
    draft = {
        "send": False,
        "awaiting_paula_validation": True,
        "to": "f.rozier@domaines-skiables.fr",
        "recipient_name": "Fabienne Rozier",
        "tutoiement": True,
        "cc": [],
        "bcc": "info@fli.fr",
        "subject": "Résultat test anglais Steven Mandica (TPH Salève) + facture 26-27.14335",
        "attachments": [
            "evaluation-Steven-Mandica-anglais-DSF.pdf",
            "evaluation-Steven-Mandica-anglais-DSF.docx",
            "tableau-niveaux-DSF-Saleve-08-10-2026.docx",
            "Facture-26-27.14335-DSF-Mandica.pdf",
            "Contrat-26-338-TPH-Saleve.pdf",
        ],
        "invoice_number": "26-27.14335",
        "invoice_status": "draft",
        "amount_ht": 42,
        "amount_ttc": 50.4,
        "body_text": body.strip(),
    }
    # fix silly true line
    draft["tutoiement"] = True
    (OUT / "email-draft-fabienne.json").write_text(
        json.dumps(draft, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    md = f"""# Brouillon mail — Fabienne Rozier (DSF) — **À VALIDER — PAS ENVOYÉ**

- **À :** `f.rozier@domaines-skiables.fr`
- **Bcc :** `info@fli.fr`
- **Ton :** tutoiement
- **Objet :** {draft['subject']}
- **Facture :** 26-27.14335 — 42 € HT / 50,40 € TTC — statut `draft` — échéance 30/11/2026

## Pièces jointes prévues
1. `evaluation-Steven-Mandica-anglais-DSF.pdf` (habillage DSF)
2. `evaluation-Steven-Mandica-anglais-DSF.docx` (Word modifiable)
3. `tableau-niveaux-DSF-Saleve-08-10-2026.docx` (+ CSV)
4. `Facture-26-27.14335-DSF-Mandica.pdf` (à régler)
5. `Contrat-26-338-TPH-Saleve.pdf`

## Corps

{body.strip()}
"""
    path = OUT / "email-draft-fabienne.md"
    path.write_text(md, encoding="utf-8")
    return path


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    word = build_word()
    table = build_levels_table()
    draft = build_email_draft()
    print("WORD", word)
    print("TABLE", table)
    print("DRAFT", draft)


if __name__ == "__main__":
    main()
