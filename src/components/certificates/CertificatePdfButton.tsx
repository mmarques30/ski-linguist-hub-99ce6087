import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CERTIFICATE_BUCKET,
  CERTIFICATE_SIGNED_URL_TTL_SECONDS,
  isLegacyPublicUrl,
} from "@/lib/certificateStorage";

async function getCertificateDownloadUrl(
  pathOrUrl: string
): Promise<string | null> {
  if (isLegacyPublicUrl(pathOrUrl)) return pathOrUrl;

  const { data, error } = await supabase.storage
    .from(CERTIFICATE_BUCKET)
    .createSignedUrl(pathOrUrl, CERTIFICATE_SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("Certificate signed URL failed:", error);
    return null;
  }
  return data?.signedUrl ?? null;
}

interface CertificatePdfButtonProps {
  /** Chemin dans le bucket privé, ou URL publique historique. */
  pathOrUrl: string;
  label?: string;
}

export function CertificatePdfButton({
  pathOrUrl,
  label = "Télécharger",
}: CertificatePdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const url = await getCertificateDownloadUrl(pathOrUrl);
    setLoading(false);

    if (!url) {
      toast.error("Document indisponible");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
      <Download className="h-3.5 w-3.5 mr-1" />
      {loading ? "…" : label}
    </Button>
  );
}
