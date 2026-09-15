import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTestPhrases, type TestPhrase } from "@/hooks/useTestPhrases";
import { compareLevels, CATEGORY_LABELS } from "@/lib/evaluation-utils";
import {
  FILE_LANGUAGE_FLAGS,
  PHRASE_BANK_ALL,
  fileCategoryLabel,
  fileLanguageForBooking,
  fileLanguageLabel,
  filterPhraseBank,
  phraseBankCategories,
  phraseBankLanguages,
} from "@/lib/test-phrases-bank";
import { hasTutoiement } from "@/lib/vouvoiement";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Plus, Search, X } from "lucide-react";

interface PhraseSelectorProps {
  /** Bloc du compte-rendu (introduction, comprehension, technique, conclusion). */
  category: string;
  /** Langue du test, au format de l'application (anglais, portugais…). */
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
  const { data: allPhrases, isLoading } = useTestPhrases({ active: true });

  const [languageFilter, setLanguageFilter] = useState(() => fileLanguageForBooking(language));
  const [categoryFilter, setCategoryFilter] = useState<string>(PHRASE_BANK_ALL);
  const [search, setSearch] = useState("");

  /** La banque ignore les étiquettes du fichier et ne garde que profession / niveau. */
  const available = useMemo(() => {
    if (!allPhrases) return [];
    return allPhrases.filter((phrase) => {
      if (phrase.profession && phrase.profession !== profession) return false;
      if (phrase.level_min && compareLevels(level, phrase.level_min) < 0) return false;
      if (phrase.level_max && compareLevels(level, phrase.level_max) > 0) return false;
      return true;
    });
  }, [allPhrases, profession, level]);

  const languageOptions = useMemo(() => phraseBankLanguages(available), [available]);
  const categoryOptions = useMemo(() => phraseBankCategories(available), [available]);

  const results = useMemo(
    () =>
      filterPhraseBank(available, {
        language: languageFilter,
        category: categoryFilter,
        search,
      }) as TestPhrase[],
    [available, languageFilter, categoryFilter, search],
  );

  const selectedPhrases = useMemo(
    () => selectedIds.map((id) => available.find((p) => p.id === id)).filter(Boolean) as TestPhrase[],
    [selectedIds, available],
  );

  /** Insère dans le bloc courant, quelle que soit la catégorie de la phrase. */
  const insertPhrase = (phraseId: string) => {
    if (selectedIds.includes(phraseId)) return;
    onSelectionChange([...selectedIds, phraseId]);
  };

  const removePhrase = (phraseId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== phraseId));
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

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        {CATEGORY_LABELS[category] || category}
        <Badge variant="outline" className="ml-auto">
          {selectedIds.length} phrase{selectedIds.length > 1 ? "s" : ""} dans ce bloc
        </Badge>
      </h3>

      {selectedPhrases.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Phrases du bloc</h4>
          <div className="space-y-1">
            {selectedPhrases.map((phrase) => (
              <div
                key={phrase.id}
                className="flex items-start gap-2 rounded-md bg-muted/50 px-2 py-1.5"
              >
                <span className="flex-1 text-sm leading-relaxed">
                  {phrase.text_fr}
                  {hasTutoiement(phrase.text_fr) && (
                    <Badge variant="destructive" className="ml-2 text-[10px]">
                      tutoiement
                    </Badge>
                  )}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  aria-label={`Retirer ${phrase.code ?? "la phrase"} du bloc`}
                  onClick={() => removePhrase(phrase.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1.4fr]">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Langue</Label>
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger aria-label="Filtrer la banque par langue">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PHRASE_BANK_ALL}>Toutes les étiquettes</SelectItem>
                {languageOptions.map((code) => (
                  <SelectItem key={code} value={code}>
                    {FILE_LANGUAGE_FLAGS[code] ?? ""} {fileLanguageLabel(code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Catégorie</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger aria-label="Filtrer la banque par catégorie">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PHRASE_BANK_ALL}>Toutes les catégories</SelectItem>
                {categoryOptions.map((code) => (
                  <SelectItem key={code} value={code}>
                    {fileCategoryLabel(code)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Recherche</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Texte, code ou point de langue"
                className="pl-8"
              />
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {results.length} phrase{results.length > 1 ? "s" : ""} disponible
          {results.length > 1 ? "s" : ""}. Les phrases « Toutes langues » remontent avec
          chaque langue.
        </p>

        {results.length === 0 ? (
          <p className="text-sm italic text-muted-foreground">
            Aucune phrase pour ce croisement langue / catégorie.
          </p>
        ) : (
          <div className="max-h-72 space-y-1 overflow-y-auto pr-2">
            {results.map((phrase) => {
              const inBloc = selectedIds.includes(phrase.id);
              return (
                <div
                  key={phrase.id}
                  className="flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed">{phrase.text_fr}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {phrase.code && (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {phrase.code}
                        </span>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {FILE_LANGUAGE_FLAGS[phrase.language] ?? ""}{" "}
                        {fileLanguageLabel(phrase.language)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {fileCategoryLabel(phrase.category)}
                      </Badge>
                      {phrase.error_type && (
                        <Badge variant="secondary" className="text-[10px]">
                          {phrase.error_type}
                        </Badge>
                      )}
                      {phrase.context && (
                        <span className="text-[10px] text-muted-foreground">
                          {phrase.context}
                        </span>
                      )}
                      {phrase.is_correction && (
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-[10px] text-orange-800 hover:bg-orange-100"
                        >
                          Correction
                        </Badge>
                      )}
                      {hasTutoiement(phrase.text_fr) && (
                        <Badge variant="destructive" className="text-[10px]">
                          tutoiement
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={inBloc ? "secondary" : "outline"}
                    size="sm"
                    className="shrink-0"
                    disabled={inBloc}
                    onClick={() => insertPhrase(phrase.id)}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    {inBloc ? "Insérée" : "Insérer"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
