import { useMemo } from "react";
import { SurfaceCard } from "@/components/ui-kit";
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
    <SurfaceCard
      className="lg:sticky lg:top-4"
      title="Prévisualisation du texte généré"
      icon={Eye}
    >
      <ScrollArea className="h-[400px] pr-4">
        {isEmpty ? (
          <p className="text-sm italic text-muted-foreground">
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
    </SurfaceCard>
  );
}
