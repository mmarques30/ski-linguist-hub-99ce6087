import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useTestPhrases, type TestPhrase } from "@/hooks/useTestPhrases";
import { compareLevels, CATEGORY_LABELS } from "@/lib/evaluation-utils";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare } from "lucide-react";

interface PhraseSelectorProps {
  category: string;
  language: string;
  profession: string | null;
  level: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  commentsValue: string;
  onCommentsChange: (value: string) => void;
}

export function PhraseSelector({
  category,
  language,
  profession,
  level,
  selectedIds,
  onSelectionChange,
  commentsValue,
  onCommentsChange,
}: PhraseSelectorProps) {
  const { data: allPhrases, isLoading } = useTestPhrases({
    category,
    active: true,
  });

  // Filter phrases based on language, profession, and level
  const filteredPhrases = useMemo(() => {
    if (!allPhrases) return [];

    return allPhrases.filter((phrase) => {
      // Language filter: match 'all' or specific language
      if (phrase.language !== 'all' && phrase.language !== language) {
        return false;
      }

      // Profession filter: match null (all) or specific profession
      if (phrase.profession && phrase.profession !== profession) {
        return false;
      }

      // Level filter
      if (phrase.level_min && compareLevels(level, phrase.level_min) < 0) {
        return false;
      }
      if (phrase.level_max && compareLevels(level, phrase.level_max) > 0) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // Sort: positive first, then by order_index
      if (a.is_positive !== b.is_positive) {
        return a.is_positive ? -1 : 1;
      }
      return a.order_index - b.order_index;
    });
  }, [allPhrases, language, profession, level]);

  const positivePhrases = filteredPhrases.filter(p => p.is_positive);
  const negativePhrases = filteredPhrases.filter(p => !p.is_positive);

  const togglePhrase = (phraseId: string) => {
    if (selectedIds.includes(phraseId)) {
      onSelectionChange(selectedIds.filter(id => id !== phraseId));
    } else {
      onSelectionChange([...selectedIds, phraseId]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const renderPhraseList = (phrases: TestPhrase[], title: string, isPositive: boolean) => {
    if (phrases.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">
          {title}
        </h4>
        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
          {phrases.map((phrase) => (
            <div
              key={phrase.id}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={phrase.id}
                checked={selectedIds.includes(phrase.id)}
                onCheckedChange={() => togglePhrase(phrase.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={phrase.id}
                  className="text-sm cursor-pointer leading-relaxed"
                >
                  {phrase.text_fr}
                </label>
                {phrase.code && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({phrase.code})
                  </span>
                )}
              </div>
              <Badge 
                variant={isPositive ? "default" : "secondary"}
                className={isPositive 
                  ? "bg-green-100 text-green-800 hover:bg-green-100" 
                  : "bg-orange-100 text-orange-800 hover:bg-orange-100"
                }
              >
                {isPositive ? "Positif" : "Lacune"}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        {CATEGORY_LABELS[category] || category}
        <Badge variant="outline" className="ml-auto">
          {filteredPhrases.length} phrases
        </Badge>
      </h3>

      {filteredPhrases.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Aucune phrase disponible pour ce niveau et cette langue.
        </p>
      ) : (
        <div className="space-y-4">
          {renderPhraseList(positivePhrases, "Points positifs", true)}
          {renderPhraseList(negativePhrases, "Lacunes / Points à améliorer", false)}
        </div>
      )}

      <div className="pt-4 border-t">
        <Label className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-4 w-4" />
          Commentaires {CATEGORY_LABELS[category]?.toLowerCase() || category} (optionnel)
        </Label>
        <Textarea
          value={commentsValue}
          onChange={(e) => onCommentsChange(e.target.value)}
          placeholder="Ajoutez vos commentaires personnalisés..."
          rows={3}
        />
      </div>
    </div>
  );
}
