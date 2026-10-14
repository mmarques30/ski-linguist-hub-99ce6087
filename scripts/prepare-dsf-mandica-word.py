#!/usr/bin/env python3
"""Pack DSF Mandica : Word = .dotx rempli (mise en page identique) + tableau niveaux + brouillon."""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

OUT = Path("/opt/cursor/artifacts/mollard-oct-2026/dsf-mandica")
DOTX = Path(
    "/home/ubuntu/.cursor/projects/workspace/uploads/Re_sultat_d_e_val_DSF_forms_f700.dotx"
)


def set_run_font(run, size=11, bold=False, color=None):
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    run.font.size = Pt(size)
    run.bold = bold
    if color:
        run.font.color.rgb = color


def fill_from_dotx() -> Path:
    spec = importlib.util.spec_from_file_location(
        "fill_dsf", "/workspace/scripts/fill-dsf-eval-dotx.py"
    )
    fill = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(fill)
    out_docx = OUT / "evaluation-Steven-Mandica-anglais-DSF.docx"
    out_pdf = OUT / "evaluation-Steven-Mandica-anglais-DSF.pdf"
    fill.build_pack(DOTX, out_docx, out_pdf, fill.mandica_data())
    # keep blank template reference
    import shutil

    shutil.copy2(DOTX, OUT / "modele-Resultat-eval-DSF-forms.dotx")
    return out_docx


def build_levels_table() -> Path:
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

C'est le premier résultat que je t'envoie depuis notre nouveau système de gestion. Les e-mails partent aussi de façon automatique : comme on est en phase de test, il peut y avoir quelques coquilles. N'hésite pas à revenir vers moi s'il y a des modifications à apporter.

Je joins :
- le résultat en PDF (mise en page modèle DSF) ;
- le même document en Word modifiable ;
- le tableau des niveaux de la session ;
- la facture n° 26-27.14335 (42 € HT / 50,40 € TTC) à régler — échéance 30/11/2026 ;
- pour mémoire, le contrat de prestation n° 26 338.

Coordonnées bancaires FLI sur la facture (réf. à indiquer : 26-27.14335 / Contrat 26 338).

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
        "layout": "dotx DSF forms rempli → docx + pdf LibreOffice",
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
    (OUT / "email-draft-fabienne.json").write_text(
        json.dumps(draft, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    md = f"""# Brouillon mail — Fabienne Rozier (DSF) — **À VALIDER — PAS ENVOYÉ**

- **À :** `f.rozier@domaines-skiables.fr`
- **Bcc :** `info@fli.fr`
- **Ton :** tutoiement
- **Objet :** {draft['subject']}
- **Mise en page résultat :** modèle `.dotx` DSF rempli (identique)
- **Facture :** 26-27.14335 — 42 € HT / 50,40 € TTC — statut `draft`

## Pièces jointes prévues
1. `evaluation-Steven-Mandica-anglais-DSF.pdf`
2. `evaluation-Steven-Mandica-anglais-DSF.docx` (Word modifiable = .dotx rempli)
3. `tableau-niveaux-DSF-Saleve-08-10-2026.docx`
4. `Facture-26-27.14335-DSF-Mandica.pdf`
5. `Contrat-26-338-TPH-Saleve.pdf`

## Corps

{body.strip()}
"""
    path = OUT / "email-draft-fabienne.md"
    path.write_text(md, encoding="utf-8")
    return path


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    word = fill_from_dotx()
    table = build_levels_table()
    draft = build_email_draft()
    print("WORD/PDF", word)
    print("TABLE", table)
    print("DRAFT", draft)


if __name__ == "__main__":
    main()
