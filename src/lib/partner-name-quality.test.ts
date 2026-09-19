import { describe, expect, it } from "vitest";
import {
  buildPartnerNeedsReviewFilter,
  looksLikeEmailName,
  partnerNeedsReview,
  partnerReviewLabel,
  partnerReviewReasons,
  startsWithAttention,
} from "./partner-name-quality";

describe("partner-name-quality", () => {
  describe("looksLikeEmailName", () => {
    it("détecte un nom qui est une adresse e-mail", () => {
      expect(looksLikeEmailName("contact@esf.fr")).toBe(true);
      expect(looksLikeEmailName("  directeur@hotel.com  ")).toBe(true);
    });

    it("ignore les noms sans @ ou @ mal placé", () => {
      expect(looksLikeEmailName("ESF Val d'Isère")).toBe(false);
      expect(looksLikeEmailName("@domaine.fr")).toBe(false);
      expect(looksLikeEmailName("nom@")).toBe(false);
      expect(looksLikeEmailName("")).toBe(false);
    });
  });

  describe("startsWithAttention", () => {
    it("détecte les préfixes à l'attention (accents et apostrophes)", () => {
      expect(startsWithAttention("À l'attention de M. Dupont")).toBe(true);
      expect(startsWithAttention("à l'attention")).toBe(true);
      expect(startsWithAttention("A l'attention")).toBe(true);
      expect(startsWithAttention("à  l'attention")).toBe(true);
      expect(startsWithAttention("à l'attention")).toBe(true);
    });

    it("ignore les autres noms", () => {
      expect(startsWithAttention("ESF Tignes")).toBe(false);
      expect(startsWithAttention("Monsieur à l'attention")).toBe(false);
    });
  });

  describe("partnerNeedsReview / partnerReviewReasons", () => {
    it("combine les signaux", () => {
      expect(partnerNeedsReview("contact@esf.fr")).toBe(true);
      expect(partnerReviewReasons("contact@esf.fr")).toEqual(["email_as_name"]);

      expect(partnerNeedsReview("À l'attention de…")).toBe(true);
      expect(partnerReviewReasons("À l'attention de…")).toEqual(["attention_prefix"]);

      expect(partnerNeedsReview("ESF Les Arcs")).toBe(false);
      expect(partnerReviewReasons("ESF Les Arcs")).toEqual([]);
    });
  });

  describe("partnerReviewLabel", () => {
    it("retourne des libellés courts en français", () => {
      expect(partnerReviewLabel(["email_as_name"])).toBe("Nom = e-mail");
      expect(partnerReviewLabel(["attention_prefix"])).toBe("À l'attention");
      expect(partnerReviewLabel(["email_as_name", "attention_prefix"])).toBe(
        "Nom = e-mail · À l'attention",
      );
      expect(partnerReviewLabel([])).toBe("");
    });
  });

  describe("buildPartnerNeedsReviewFilter", () => {
    it("échappe l'apostrophe pour PostgREST", () => {
      const filter = buildPartnerNeedsReviewFilter();
      expect(filter).toContain("name.ilike.%@%");
      expect(filter).toContain('name.ilike."%À l\'attention%"');
      expect(filter).toContain('name.ilike."%A l\'attention%"');
      expect(filter.split(",")).toHaveLength(3);
    });
  });
});
