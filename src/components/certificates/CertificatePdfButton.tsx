import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CERTIFICATE_BUCKET,
  CERTIFICATE_SIGNED_URL_TTL_SECONDS,
  isLegacyPublicUrl,
  resolveDownloadBuckets,
} from "@/lib/certificateStorage";

async function signViaEdge(
  pathOrUrl: string,
  bucket: string
): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke("sign-private-download", {
    body: { bucket, path: pathOrUrl },
  });
  if (error) {
    console.error("sign-private-download failed:", error);
    return null;
  }
  const signedUrl =
    data && typeof data === "object" && "signedUrl" in data
      ? (data as { signedUrl?: string }).signedUrl
      : null;
  return typeof signedUrl === "string" && signedUrl ? signedUrl : null;
}

async function getCertificateDownloadUrl(
  pathOrUrl: string,
  bucket: string
): Promise<string | null> {
  if (isLegacyPublicUrl(pathOrUrl)) return pathOrUrl;

  for (const candidate of resolveDownloadBuckets(bucket)) {
    const { data, error } = await supabase.storage
      .from(candidate)
      .createSignedUrl(pathOrUrl, CERTIFICATE_SIGNED_URL_TTL_SECONDS);

    if (!error && data?.signedUrl) {
      return data.signedUrl;
    }
  }

  // Secours : signature service-role après contrôle d'accès (staff / propriétaire)
  for (const candidate of resolveDownloadBuckets(bucket)) {
    const signed = await signViaEdge(pathOrUrl, candidate);
    if (signed) return signed;
  }

  return null;
}

interface CertificatePdfButtonProps {
  /** Chemin dans le bucket privé, ou URL publique historique. */
  pathOrUrl: string;
  label?: string;
  bucket?: string;
}

export function CertificatePdfButton({
  pathOrUrl,
  label = "Télécharger",
  bucket = CERTIFICATE_BUCKET,
}: CertificatePdfButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const url = await getCertificateDownloadUrl(pathOrUrl, bucket);
    setLoading(false);

    if (!url) {
      toast.error("Document indisponible");
      return;
    }
    // window.open hors geste utilisateur est bloqué par Safari / Chrome :
    // on passe par un lien cliqué, jamais bloqué, avec repli même onglet.
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
  };

  return (
    <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
      <Download className="h-3.5 w-3.5 mr-1" />
      {loading ? "…" : label}
    </Button>
  );
}
