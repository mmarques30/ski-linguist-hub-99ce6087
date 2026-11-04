#!/usr/bin/env python3
"""
Remplit le .dotx Prosneige (MERGEFIELD) → .docx + PDF LibreOffice.
Mise en page = modèle exact « Évaluation PROSNEIGE 2025.dotx » (≠ ESF).
"""
from __future__ import annotations

import argparse
import importlib.util
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DOTX = REPO_ROOT / "docs/evaluation-resultats/Evaluation_PROSNEIGE_2025.dotx"

_DSF = REPO_ROOT / "scripts/fill-dsf-eval-dotx.py"
_spec = importlib.util.spec_from_file_location("fill_dsf_eval_dotx", _DSF)
assert _spec and _spec.loader
_dsf = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_dsf)


def set_title_year_prosneige(header_xml: str, year: str) -> str:
    """Titre header2 : runs « 2 » + « 02 » + « 5 » (année 2025)."""
    y = str(year)
    if len(y) != 4:
        return header_xml
    marker = "EVALUATION EN LANGUE VIVANTE "
    if marker not in header_xml:
        return header_xml
    # Remplace le bloc année (3 runs) par 1er chiffre + 2 milieu + dernier.
    old = (
        f"<w:t>{y[0]}</w:t></w:r>"
        # ne pas dépendre de l'année source exacte — chercher pattern générique
    )
    # Pattern actuel connu du modèle 2025 : 2 / 02 / 5
    import re

    pat = re.compile(
        r"(<w:t>)2(</w:t></w:r><w:r[^>]*>.*?<w:t>)02(</w:t></w:r><w:r[^>]*>.*?<w:t>)\d(</w:t>)",
        re.S,
    )
    repl = rf"\g<1>{y[0]}\g<2>{y[1:3]}\g<3>{y[3]}\g<4>"
    new_xml, n = pat.subn(repl, header_xml, count=1)
    if n:
        return new_xml
    # Fallback : année déjà 2026 ou autre découpage — remplacer runs numériques du titre.
    return header_xml.replace(">2025<", f">{y}<").replace(">5</w:t>", f">{y[3]}</w:t>", 1)


def set_fait_le(document_xml: str, date_label: str) -> str:
    """Remplace la date fixe du modèle (« 21 octobre 2025 »)."""
    return document_xml.replace("21 octobre 2025", date_label)


def fill_footer_version(footer_xml: str, version_label: str) -> str:
    return footer_xml.replace("Version 2 du 8 septembre 2021", version_label)


def fill_document_xml(xml: str, data: dict[str, str]) -> str:
    xml = set_fait_le(xml, data.get("fait_le", "21 octobre 2025"))
    for name, value in data.items():
        if name in ("title_year", "footer_version", "fait_le"):
            continue
        xml = _dsf.set_complex_field_value(xml, name, value)
    return xml


def build_pack(
    dotx: Path,
    out_docx: Path,
    out_pdf: Path | None,
    data: dict[str, str],
) -> None:
    with tempfile.TemporaryDirectory() as tmp:
        tmp_path = Path(tmp)
        with zipfile.ZipFile(dotx, "r") as zf:
            zf.extractall(tmp_path)

        doc_xml = tmp_path / "word" / "document.xml"
        doc_xml.write_text(
            fill_document_xml(doc_xml.read_text(encoding="utf-8"), data),
            encoding="utf-8",
        )

        header2 = tmp_path / "word" / "header2.xml"
        if header2.exists() and data.get("title_year"):
            header2.write_text(
                set_title_year_prosneige(
                    header2.read_text(encoding="utf-8"), data["title_year"]
                ),
                encoding="utf-8",
            )

        footer = tmp_path / "word" / "footer1.xml"
        if footer.exists() and data.get("footer_version"):
            footer.write_text(
                fill_footer_version(
                    footer.read_text(encoding="utf-8"), data["footer_version"]
                ),
                encoding="utf-8",
            )

        out_docx.parent.mkdir(parents=True, exist_ok=True)
        if out_docx.exists():
            out_docx.unlink()
        with zipfile.ZipFile(out_docx, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for path in sorted(tmp_path.rglob("*")):
                if path.is_file():
                    zf.write(path, path.relative_to(tmp_path).as_posix())

    if out_pdf is not None:
        out_pdf.parent.mkdir(parents=True, exist_ok=True)
        if out_pdf.exists():
            out_pdf.unlink()
        proc = subprocess.run(
            [
                "soffice",
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                str(out_pdf.parent),
                str(out_docx),
            ],
            capture_output=True,
            text=True,
        )
        produced = out_pdf.parent / (out_docx.stem + ".pdf")
        if proc.returncode != 0 or not produced.exists():
            raise RuntimeError(
                f"LibreOffice PDF failed ({proc.returncode}): {proc.stderr or proc.stdout}"
            )
        if produced.resolve() != out_pdf.resolve():
            shutil.move(str(produced), str(out_pdf))


def pierre_boes_data() -> dict[str, str]:
    """Scores = ordre C.5 : comp / expr / struct / tech / conv / générale.
    Notes retenues = saisie Mollard + 0,5 (Paula 03/11/2026).
    """
    return {
        "title_year": "2026",
        "footer_version": "Version du 03/11/2026",
        "fait_le": "29 octobre 2026",
        "Prénom__NOM__du_candidat": "Pierre BOES",
        "École_de_ski": "Prosneige",
        "Langue_évaluée": "Anglais",
        "Date_de_lévaluation": "29/10/2026",
        "Évaluateurrice": "C. Mollard",
        "Expression": "3,5 - B2+",
        "Conversation_Générale": "3,5 - B2+",
        "Structures_de_la_langue": "3 - B2",
        "Compréhension": "3 - B2",
        "Expression_Technique_et_spécifique": "3,5 - B2+",
        "Appréciation_générale_moyenne": "3,5 - B2+",
        "Introduction": (
            "Vous vous exprimez d'une façon assez claire et autonome. "
            "Vous pouvez gérer une situation, donner des explications techniques "
            "et soutenir une conversation avec un client."
        ),
        "Autres_commentaires_introduction": "",
        "Compréhension2": "Vous avez plutôt bien compris le texte audio et moi-même.",
        "Expression2": "",
        "Grammaire": (
            "Les structures grammaticales simples et complexes sont bien maîtrisées "
            "malgré quelques rares erreurs d'inattention qui ne gênent pas la communication."
        ),
        "Métier": "",
        "Expression_Technique": "",
        "Partie_Technique": (
            "Vous avez su utiliser un vocabulaire technique plutôt approprié lors de "
            "l'explication du mouvement technique et avez pris le temps d'en préciser "
            "les différentes étapes. Vocabulaire : obligatoire = mandatory."
        ),
        "Exemples__Moniteurs": "",
        "Autres_commentaires": "",
        "Exemples": "",
        "Appréciation": "",
        "Points_de_grammaire_à_travailler": "",
        "Conclusion": (
            "En conclusion vous avez un niveau opérationnel (B2+) qui vous permet de "
            "communiquer correctement avec la clientèle anglophone."
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dotx", type=Path, default=DEFAULT_DOTX)
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("/opt/cursor/artifacts/mollard-oct-batch3/prosneige-pierre-boes"),
    )
    parser.add_argument("--no-pdf", action="store_true")
    args = parser.parse_args()
    out_docx = args.out_dir / "evaluation-Pierre-Boes-anglais-Prosneige.docx"
    out_pdf = None if args.no_pdf else args.out_dir / "evaluation-Pierre-Boes-anglais-Prosneige.pdf"
    build_pack(args.dotx, out_docx, out_pdf, pierre_boes_data())
    print("DOCX", out_docx, out_docx.stat().st_size)
    if out_pdf:
        print("PDF", out_pdf, out_pdf.stat().st_size)


if __name__ == "__main__":
    main()
