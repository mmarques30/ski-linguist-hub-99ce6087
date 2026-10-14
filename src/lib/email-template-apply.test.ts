import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyEmailTemplate,
  escapeEmailTemplateValue,
  escapeHtml,
} from "./email-template-apply";

function source(relatif: string): string {
  return readFileSync(join(process.cwd(), relatif), "utf8");
}

describe("applyEmailTemplate", () => {
  it("substitue les variables {{…}}", () => {
    expect(
      applyEmailTemplate("Bonjour {{student_name}} — {{language}}", {
        student_name: "Camille",
        language: "Anglais",
      })
    ).toBe("Bonjour Camille — Anglais");
  });

  it("refuse un envoi si une variable reste", () => {
    expect(() =>
      applyEmailTemplate("Code {{inscription_code}} / {{missing}}", {
        inscription_code: "FLI-260001",
      })
    ).toThrow(/Variables manquantes.*\{\{missing\}\}/);
  });

  it('échappe "<script>" en &lt;script&gt;', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;"
    );
    expect(
      applyEmailTemplate("Bonjour {{student_name}}", {
        student_name: '<script>alert(1)</script>',
      })
    ).toBe("Bonjour &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(escapeEmailTemplateValue("student_name", "<b>x</b>")).toBe(
      "&lt;b&gt;x&lt;/b&gt;"
    );
  });

  it("laisse passer le HTML de confiance (groups_html / funding_next_steps)", () => {
    expect(
      applyEmailTemplate("Bloc {{groups_html}}", {
        groups_html: "<table><tr><td>ok</td></tr></table>",
      })
    ).toBe("Bloc <table><tr><td>ok</td></tr></table>");
    expect(
      applyEmailTemplate("Suite {{funding_next_steps}}", {
        funding_next_steps: "<p>Étape suivante</p>",
      })
    ).toBe("Suite <p>Étape suivante</p>");
  });

  it("garde la copie Deno d'accord avec le module front", () => {
    const front = source("src/lib/email-template-apply.ts");
    const deno = source("supabase/functions/_shared/fli-email.ts");
    const extraire = (texte: string, nom: string) => {
      const debut = texte.indexOf(`export function ${nom}`);
      expect(debut).toBeGreaterThan(-1);
      const fin = texte.indexOf("\nexport ", debut + 1);
      return texte.slice(debut, fin === -1 ? undefined : fin);
    };
    expect(extraire(deno, "escapeHtml")).toBe(extraire(front, "escapeHtml"));
    expect(extraire(deno, "isTrustedEmailHtmlKey")).toBe(
      extraire(front, "isTrustedEmailHtmlKey")
    );
    expect(extraire(deno, "escapeEmailTemplateValue")).toBe(
      extraire(front, "escapeEmailTemplateValue")
    );
    expect(extraire(deno, "applyEmailTemplate")).toBe(
      extraire(front, "applyEmailTemplate")
    );
  });
});
