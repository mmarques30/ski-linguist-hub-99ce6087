/** Erreurs PostgREST / Supabase : ce ne sont pas des `Error`. */

export type DescribedError = {
  message: string;
  code: string | null;
};

const GENERIC_INVOKE = /non-2xx status code/i;

function asRecord(error: unknown): Record<string, unknown> | null {
  if (error && typeof error === "object") return error as Record<string, unknown>;
  return null;
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export function describeCaughtError(error: unknown): DescribedError {
  const rec = asRecord(error);
  const code = firstString(rec?.code) ?? null;
  const invokeMessage = firstString(rec?.message);
  const skipGeneric = invokeMessage && GENERIC_INVOKE.test(invokeMessage) ? null : invokeMessage;
  const raw = firstString(rec?.error, skipGeneric, rec?.details, rec?.hint);
  if (code === "23505") {
    const blob = `${raw ?? ""} ${firstString(rec?.details) ?? ""}`.toLowerCase();
    if (blob.includes("students") && blob.includes("email")) {
      return { message: "Un stagiaire avec cet e-mail existe déjà.", code };
    }
    if (blob.includes("inscription") || blob.includes("code")) {
      return {
        message: "Ce code d'inscription existe déjà. Réessayez.",
        code,
      };
    }
    return { message: "Cette valeur existe déjà.", code };
  }
  if (raw) return { message: raw, code };
  if (error instanceof Error && error.message.trim() && !GENERIC_INVOKE.test(error.message)) {
    return { message: error.message.trim(), code };
  }
  return { message: "Erreur interne", code: null };
}

/** Corps JSON d'une Edge Function (success: false) prioritaire sur le message générique invoke. */
export function messageFromFunctionsInvoke(error: unknown, data: unknown): string {
  const fromBody = describeCaughtError(data);
  if (fromBody.message !== "Erreur interne") return fromBody.message;
  const fromError = describeCaughtError(error);
  if (fromError.message !== "Erreur interne") return fromError.message;
  return "Erreur lors de la soumission de l'inscription";
}
