#!/usr/bin/env python3
"""
Remplit le .dotx DSF (MERGEFIELD) → .docx + PDF LibreOffice.
Mise en page = modèle exact (papier à en-tête + formulaire).
"""
from __future__ import annotations

import argparse
import re
import shutil
import subprocess
import tempfile
import zipfile
from pathlib import Path
from xml.sax.saxutils import escape

DEFAULT_DOTX = Path(
    "/home/ubuntu/.cursor/projects/workspace/uploads/Re_sultat_d_e_val_DSF_forms_f700.dotx"
)

W_T_OPEN = '<w:t xml:space="preserve">'


def xml_text(value: str) -> str:
    return escape(value, {"'": "&apos;", '"': "&quot;"})


def replace_all_fldsimple(xml: str, field_name: str, value: str) -> str:
    pattern = re.compile(
        rf'(<w:fldSimple w:instr="\s*MERGEFIELD\s+{re.escape(field_name)}\s*"[^>]*>)'
        rf'(.*?)'
        rf'(</w:fldSimple>)',
        re.S | re.I,
    )

    def repl(m: re.Match) -> str:
        inner = m.group(2)
        texts = list(re.finditer(r"(<w:t[^>]*>)(.*?)(</w:t>)", inner, re.S))
        if not texts:
            return (
                f"{m.group(1)}<w:r>{W_T_OPEN}{xml_text(value)}</w:t></w:r>{m.group(3)}"
            )
        parts: list[str] = []
        last = 0
        first = True
        for t in texts:
            parts.append(inner[last : t.start()])
            if first:
                parts.append(f"{W_T_OPEN}{xml_text(value)}</w:t>")
                first = False
            else:
                parts.append(f"{t.group(1)}{t.group(3)}")
            last = t.end()
        parts.append(inner[last:])
        return m.group(1) + "".join(parts) + m.group(3)

    return pattern.sub(repl, xml)


def iter_complex_fields(xml: str):
    """
    Yield (name, result_start, result_end, needs_separate_insert).
    result_* are absolute indices of the result run(s) region to replace.
    Structure Word : begin run | instr run(s) | separate run | result run(s) | end run
    """
    begin_re = re.compile(r'<w:fldChar w:fldCharType="begin"/>')
    for bm in begin_re.finditer(xml):
        begin = bm.start()
        # enclose begin in its <w:r>…</w:r> — search end from begin
        end_m = re.search(r'<w:fldChar w:fldCharType="end"/>', xml[bm.end() :])
        if not end_m:
            continue
        end_char_start = bm.end() + end_m.start()
        end_abs = bm.end() + end_m.end()
        chunk = xml[begin:end_abs]
        instr = "".join(
            re.findall(r"<w:instrText[^>]*>([^<]*)</w:instrText>", chunk)
        ).strip()
        if not instr.upper().startswith("MERGEFIELD"):
            continue
        name = re.sub(r"^MERGEFIELD\s+", "", instr, flags=re.I).strip()
        # separate is typically </w:fldChar></w:r> then result runs then <w:r>…end
        sep_m = re.search(
            r'<w:fldChar w:fldCharType="separate"/>\s*</w:r>', chunk
        )
        # Ne pas matcher <w:rFonts / <w:rPr — uniquement les runs <w:r …>
        end_run_m = None
        for m in re.finditer(r"<w:r(?:\s|>)", xml[begin:end_char_start]):
            end_run_m = m
        end_run = begin + end_run_m.start() if end_run_m else end_char_start

        if sep_m:
            result_start = begin + sep_m.end()
            yield name, result_start, end_run, False
        else:
            # empty field: begin|instr|end — insert separate+result before end run
            yield name, end_run, end_run, True


def set_complex_field_value(xml: str, field_name: str, value: str) -> str:
    fields = [f for f in iter_complex_fields(xml) if f[0] == field_name]
    if not fields:
        return xml
    result_xml = f"<w:r>{W_T_OPEN}{xml_text(value)}</w:t></w:r>"
    for name, rs, re_, needs_sep in reversed(fields):
        if needs_sep:
            insert = (
                '<w:r><w:rPr><w:noProof/></w:rPr>'
                '<w:fldChar w:fldCharType="separate"/></w:r>'
                + result_xml
            )
            xml = xml[:rs] + insert + xml[re_:]
        else:
            xml = xml[:rs] + result_xml + xml[re_:]
    return xml


def set_title_year(xml: str, year: str) -> str:
    """Title is split: '… VIVANTE 20' + '2' + '5'."""
    y = str(year)
    if len(y) != 4:
        return xml
    marker = "VALUATION EN LANGUE VIVANTE 20</w:t>"
    i = xml.find(marker)
    if i < 0:
        return xml
    tail = xml[i + len(marker) :]
    digits = y[2:]
    replaced = 0

    def repl_digit(m: re.Match) -> str:
        nonlocal replaced
        if replaced >= 2:
            return m.group(0)
        out = f"{m.group(1)}{digits[replaced]}{m.group(3)}"
        replaced += 1
        return out

    new_tail = re.sub(r"(<w:t>)(\d)(</w:t>)", repl_digit, tail, count=2)
    return xml[: i + len(marker)] + new_tail


def fill_document_xml(xml: str, data: dict[str, str]) -> str:
    xml = set_title_year(xml, data.get("title_year", "2026"))
    for name in ("Prénom__NOM__du_candidat", "Introduction"):
        if name in data:
            xml = replace_all_fldsimple(xml, name, data[name])
    for name, value in data.items():
        if name in (
            "Prénom__NOM__du_candidat",
            "Introduction",
            "title_year",
            "footer_version",
        ):
            continue
        xml = set_complex_field_value(xml, name, value)
    return xml


def fill_footer_xml(xml: str, version_label: str) -> str:
    """Remplace « Version 1 du 28/04/2021 » (pied de page modèle)."""
    return xml.replace("Version 1 du 28/04/2021", version_label)


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
        filled = fill_document_xml(doc_xml.read_text(encoding="utf-8"), data)
        doc_xml.write_text(filled, encoding="utf-8")
        footer = tmp_path / "word" / "footer1.xml"
        if footer.exists() and data.get("footer_version"):
            footer.write_text(
                fill_footer_xml(
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


def mandica_data() -> dict[str, str]:
    return {
        "title_year": "2026",
        "footer_version": "Version du 13/10/2026",
        "Prénom__NOM__du_candidat": "Steven Mandica",
        "École_de_ski": "Téléphérique du Salève",
        "Langue_évaluée": "Anglais",
        "Date_de_lévaluation": "08/10/2026",
        "Évaluateurrice": "C. Mollard",
        "Compréhension": "3,5 - B2+",
        "Expression": "3,5 - B2+",
        "Structures_de_la_langue": "3,5 - B2+",
        "Expression_Technique_et_spécifique": "3,5 - B2+",
        "Conversation_Générale": "3,5 - B2+",
        "Appréciation_générale_moyenne": "3,5 - B2+",
        "Introduction": "Vous vous exprimez d'une façon assez claire et autonome.",
        "Autres_commentaires_introduction": "Vous avez plutôt bien compris le texte audio et moi-même.",
        "Grammaire": "Vous avez de bonnes bases en grammaire et vous êtes capable de vous exprimer dans tous les temps.",
        "Points_de_grammaire_à_travailler": "",
        "Expression_Technique": "",
        "Partie_Technique": "En ce qui concerne la partie spécifique à votre métier, vous vous exprimez avec enthousiasme et précision.",
        "Autres_commentaires": "",
        "Exemples": "",
        "Appréciation": "",
        "Autres_commentaires1": "",
        "Conclusion": "En conclusion vous avez un niveau opérationnel qui vous permet de communiquer correctement avec la clientèle anglophone. Continuez néanmoins à développer l'apprentissage de vos connaissances, vous gagnerez en aisance et en fluidité.",
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dotx", type=Path, default=DEFAULT_DOTX)
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("/opt/cursor/artifacts/mollard-oct-2026/dsf-mandica"),
    )
    args = parser.parse_args()
    out_docx = args.out_dir / "evaluation-Steven-Mandica-anglais-DSF.docx"
    out_pdf = args.out_dir / "evaluation-Steven-Mandica-anglais-DSF.pdf"
    build_pack(args.dotx, out_docx, out_pdf, mandica_data())
    print("DOCX", out_docx, out_docx.stat().st_size)
    print("PDF", out_pdf, out_pdf.stat().st_size)


if __name__ == "__main__":
    main()
