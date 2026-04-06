

# Standardiser la numérotation des factures : FLI-YYYY-NNNN

## Problème
Deux systèmes concurrents génèrent des numéros de facture :
- Le trigger DB `before_invoice_insert` produit `YYYY.NNNNN` (ex: `2026.14244`)
- Le hook client `useCreateInvoice` produit aussi `YYYY.NNNNN` mais avec sa propre logique de séquence
- Certaines factures existantes utilisent `FLI-2025-004`

## Plan

### 1. Migration SQL
- Remplacer la fonction `before_invoice_insert` par une nouvelle logique :
  - Format : `FLI-{ANNEE}-{SEQ_4_CHIFFRES}` (ex: `FLI-2026-0001`)
  - L'année est extraite de `invoice_date`
  - Le séquentiel est calculé par : MAX des factures existantes au format `FLI-YYYY-%` pour cette année + 1
  - Si aucune facture FLI-YYYY n'existe, commence à 0001
- Le trigger ne modifie `invoice_number` QUE si celui-ci est NULL (les factures existantes ne sont pas touchées)
- Ajouter une contrainte `UNIQUE` sur `invoice_number` (les NULLs existants ne posent pas de problème car UNIQUE autorise plusieurs NULLs en PostgreSQL)

### 2. Modifier `src/hooks/useInvoices.ts`
- Supprimer toute la logique client de génération de numéro (appels à `get_fiscal_year`, calcul de `sequence_number`, formatage du numéro)
- L'insert envoie simplement les données sans `invoice_number`, `fiscal_year`, ni `sequence_number` — le trigger DB s'en charge
- Conserver le calcul de `amount_ttc` côté client

### 3. Modifier `src/components/invoices/InvoiceCreateDialog.tsx`
- Aucun changement nécessaire (le dialog passe déjà les données au hook)

## Détail technique du trigger

```sql
CREATE OR REPLACE FUNCTION public.before_invoice_insert()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE
  yr TEXT;
  max_seq INTEGER;
BEGIN
  IF NEW.invoice_number IS NULL THEN
    yr := TO_CHAR(NEW.invoice_date, 'YYYY');
    NEW.fiscal_year := yr;

    SELECT COALESCE(MAX(
      CAST(SUBSTRING(invoice_number FROM 10 FOR 4) AS INTEGER)
    ), 0)
    INTO max_seq
    FROM public.invoices
    WHERE invoice_number LIKE 'FLI-' || yr || '-%';

    NEW.sequence_number := max_seq + 1;
    NEW.invoice_number := 'FLI-' || yr || '-' || LPAD(NEW.sequence_number::TEXT, 4, '0');
  END IF;

  -- TVA selon type
  NEW.tva_rate := CASE NEW.invoice_type
    WHEN 'formation' THEN 0 ELSE 20
  END;

  NEW.due_date := COALESCE(NEW.due_date, NEW.invoice_date + INTERVAL '30 days');

  RETURN NEW;
END;
$$;

ALTER TABLE public.invoices ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);
```

## Résumé
- 1 migration (remplacer trigger + ajouter contrainte UNIQUE)
- 1 fichier modifié (`useInvoices.ts` — simplifier `useCreateInvoice`)
- 0 facture existante modifiée

