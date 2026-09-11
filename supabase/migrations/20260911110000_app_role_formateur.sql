-- C.1 — valeur enum formateur.
-- PostgreSQL interdit d'utiliser une nouvelle valeur d'enum dans la même
-- transaction que ADD VALUE : les helpers et politiques sont dans
-- 20260911111000_role_formateur_rls.sql.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'formateur';
