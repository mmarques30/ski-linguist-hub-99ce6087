-- Autorise le type AVENANT sur document_sendings.
-- Déjà appliqué en production le 16 octobre 2026 pour joindre l'avenant
-- Bonnasserre (chinois) au dossier. La contrainte est recréée de façon
-- idempotente pour rester alignée avec les types déjà en base
-- (packs FIF-PL, AGEFICE, fin de formation).

ALTER TABLE public.document_sendings
  DROP CONSTRAINT IF EXISTS document_sendings_document_type_check;

ALTER TABLE public.document_sendings
  ADD CONSTRAINT document_sendings_document_type_check
  CHECK (document_type = ANY (ARRAY[
    'CONVENTION'::text,
    'PROGRAMME'::text,
    'LIVRET'::text,
    'REGLEMENT'::text,
    'CONVOCATION'::text,
    'ATTESTATION_PRESENCE'::text,
    'CERTIFICAT'::text,
    'FACTURE'::text,
    'AGEFICE_DEMANDE'::text,
    'AGEFICE_PIECES'::text,
    'AGEFICE_ASSIDUITE'::text,
    'AVENANT'::text
  ]));
