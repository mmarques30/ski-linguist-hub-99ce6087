import { Link } from "react-router-dom";
import { Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFormateurView } from "@/contexts/FormateurViewContext";

/** Bandeau ambre — mode Assister formateur (lecture). */
export function FormateurAssistBanner() {
  const { isAssistMode, instructorName, instructorId } = useFormateurView();
  if (!isAssistMode) return null;

  return (
    <div className="bg-amber-100 border border-amber-300 text-amber-950 rounded-lg px-4 py-2.5 mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-2 font-medium">
        <Eye className="h-4 w-4 shrink-0" />
        <span>
          Mode Assister — vous voyez l&apos;espace de{" "}
          {instructorName || "ce formateur"}
        </span>
      </div>
      <Button variant="outline" size="sm" className="h-8 bg-white" asChild>
        <Link to={instructorId ? `/formateurs/${instructorId}` : "/formateurs"}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Quitter
        </Link>
      </Button>
    </div>
  );
}
