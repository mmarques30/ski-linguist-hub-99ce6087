import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CertificatePdfButton } from "@/components/certificates/CertificatePdfButton";
import { DOCUMENTS_BUCKET } from "@/lib/certificateStorage";
import {
  PUBLISH_INSCRIPTION_DOCUMENTS_FN,
  resolveFormationDocumentDownload,
} from "@/lib/formation-document-download";
import { downloadFormationDocumentClient } from "@/lib/formation-document-publish-client";

interface FormationDocumentDownloadButtonProps {
  documentSending: {
    id: string;
    document_type: string;
    pdf_url: string | null;
  };
  label?: string;
  /** Après publication réussie (ex. invalider le cache React Query). */
  onPublished?: (pdfPath: string) => void;
}

function openUrl(url: string) {
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
}

/**
 * Bouton unique staff / portail stagiaire : PDF stocké, sinon statique public,
 * sinon régénération client (puis edge en secours).
 */
export function FormationDocumentDownloadButton({
  documentSending,
  label = "Télécharger",
  onPublished,
}: FormationDocumentDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const source = resolveFormationDocumentDownload(documentSending);

  if (source.kind === "stored") {
    return (
      <CertificatePdfButton
        pathOrUrl={source.pathOrUrl}
        bucket={DOCUMENTS_BUCKET}
        label={label}
      />
    );
  }

  if (source.kind === "static") {
    return (
      <Button variant="outline" size="sm" asChild>
        <a href={source.publicUrl} target="_blank" rel="noreferrer">
          <ExternalLink className="mr-1 h-3.5 w-3.5" />
          {label}
        </a>
      </Button>
    );
  }

  const handlePublish = async () => {
    setLoading(true);
    try {
      try {
        const result = await downloadFormationDocumentClient({
          documentSendingId: source.documentSendingId,
        });
        if (result.path) onPublished?.(result.path);
        return;
      } catch (clientErr) {
        console.warn("publish client fallback → edge:", clientErr);
      }

      const { data, error } = await supabase.functions.invoke(
        PUBLISH_INSCRIPTION_DOCUMENTS_FN,
        { body: { documentSendingId: source.documentSendingId } },
      );
      if (error) {
        console.error("publish-inscription-documents:", error);
        toast.error("Document indisponible");
        return;
      }
      const signedUrl =
        data && typeof data === "object" && "signedUrl" in data
          ? (data as { signedUrl?: string }).signedUrl
          : null;
      const path =
        data && typeof data === "object" && "path" in data
          ? (data as { path?: string }).path
          : null;
      if (typeof signedUrl !== "string" || !signedUrl) {
        const message =
          data && typeof data === "object" && "error" in data
            ? String((data as { error?: unknown }).error || "")
            : "";
        toast.error(message || "Document indisponible");
        return;
      }
      if (typeof path === "string" && path) {
        onPublished?.(path);
      }
      openUrl(signedUrl);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handlePublish}
      disabled={loading}
    >
      <Download className="mr-1 h-3.5 w-3.5" />
      {loading ? "…" : label}
    </Button>
  );
}
