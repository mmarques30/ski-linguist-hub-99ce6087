import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CATEGORY_LABELS } from "@/lib/evaluation-utils";
import type { TestPhrase } from "@/hooks/useTestPhrases";
import { Eye } from "lucide-react";

interface SectionData {
  category: string;
  selectedPhrases: TestPhrase[];
  comments: string;
}

interface AppreciationPreviewProps {
  sections: SectionData[];
  generalComments?: string;
}

export function AppreciationPreview({ sections, generalComments }: AppreciationPreviewProps) {
  const generatedText = useMemo(() => {
    const parts: string[] = [];

    sections.forEach((section) => {
      if (section.selectedPhrases.length === 0 && !section.comments.trim()) {
        return;
      }

      const sectionTitle = CATEGORY_LABELS[section.category] || section.category;
      let sectionText = `**${sectionTitle}:** `;

      // Concatenate selected phrases
      const phrasesText = section.selectedPhrases
        .map((p) => p.text_fr)
        .join(" ");

      sectionText += phrasesText;

      // Add comments if present
      if (section.comments.trim()) {
        if (phrasesText) {
          sectionText += " ";
        }
        sectionText += section.comments.trim();
      }

      parts.push(sectionText);
    });

    if (generalComments?.trim()) {
      parts.push(`**Commentaires généraux:** ${generalComments.trim()}`);
    }

    return parts.join("\n\n");
  }, [sections, generalComments]);

  const isEmpty = !generatedText.trim();

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Prévisualisation du texte généré
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {isEmpty ? (
            <p className="text-sm text-muted-foreground italic">
              Sélectionnez des phrases et ajoutez des commentaires pour voir la prévisualisation...
            </p>
          ) : (
            <div className="prose prose-sm max-w-none">
              {generatedText.split("\n\n").map((paragraph, idx) => {
                const [title, ...rest] = paragraph.split(":** ");
                const boldTitle = title.replace(/\*\*/g, "");
                const content = rest.join(":** ");

                return (
                  <div key={idx} className="mb-4">
                    <span className="font-semibold text-foreground">
                      {boldTitle}:
                    </span>{" "}
                    <span className="text-muted-foreground">{content}</span>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
