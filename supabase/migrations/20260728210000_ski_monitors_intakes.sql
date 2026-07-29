-- Moniteurs de ski: base de contacts + dates de formation fermées avec les ESF

CREATE TABLE public.ski_monitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  ski_school_id uuid REFERENCES public.ski_schools(id) ON DELETE SET NULL,
  home_station text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ski_monitors_email_unique UNIQUE (email)
);

COMMENT ON TABLE public.ski_monitors IS 'Base de contacts moniteurs de ski pour outreach formation';
COMMENT ON COLUMN public.ski_monitors.home_station IS 'Station / ville habituelle du moniteur';
COMMENT ON COLUMN public.ski_monitors.partner_id IS 'École de ski d''origine (partenaire ESF)';

CREATE INDEX idx_ski_monitors_partner ON public.ski_monitors(partner_id);
CREATE INDEX idx_ski_monitors_status ON public.ski_monitors(status);
CREATE INDEX idx_ski_monitors_station ON public.ski_monitors(home_station);

CREATE TRIGGER set_ski_monitors_updated_at
  BEFORE UPDATE ON public.ski_monitors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.ski_monitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_ski_monitors_select" ON public.ski_monitors FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_ski_monitors_insert" ON public.ski_monitors FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_ski_monitors_update" ON public.ski_monitors FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_ski_monitors_delete" ON public.ski_monitors FOR DELETE TO authenticated USING (is_admin());

-- Dates de formation fermées avec une école partenaire
CREATE TABLE public.course_intakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid REFERENCES public.seasons(id) ON DELETE SET NULL,
  hosting_partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  end_date date NOT NULL,
  language text NOT NULL,
  location text NOT NULL,
  modality text DEFAULT 'presentiel',
  target_audience text NOT NULL DEFAULT 'moniteur_ski' CHECK (target_audience IN ('moniteur_ski', 'autre')),
  open_to_other_schools boolean NOT NULL DEFAULT false,
  max_places integer,
  status text NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'confirme', 'ouvert', 'complet', 'annule')),
  outreach_sent_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT course_intakes_dates_check CHECK (end_date >= start_date)
);

COMMENT ON TABLE public.course_intakes IS 'Dates et lieux de formation fermés avec une ESF';
COMMENT ON COLUMN public.course_intakes.open_to_other_schools IS 'Si true, informer tous les moniteurs actifs; sinon uniquement ceux de l''école hôte';

CREATE INDEX idx_course_intakes_dates ON public.course_intakes(start_date, end_date);
CREATE INDEX idx_course_intakes_partner ON public.course_intakes(hosting_partner_id);
CREATE INDEX idx_course_intakes_status ON public.course_intakes(status);

CREATE TRIGGER set_course_intakes_updated_at
  BEFORE UPDATE ON public.course_intakes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.course_intakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_course_intakes_select" ON public.course_intakes FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_course_intakes_insert" ON public.course_intakes FOR INSERT TO authenticated WITH CHECK (is_staff());
CREATE POLICY "rls_course_intakes_update" ON public.course_intakes FOR UPDATE TO authenticated USING (is_staff());
CREATE POLICY "rls_course_intakes_delete" ON public.course_intakes FOR DELETE TO authenticated USING (is_admin());

-- Lien optionnel inscription → date de formation
ALTER TABLE public.inscriptions
  ADD COLUMN IF NOT EXISTS intake_id uuid REFERENCES public.course_intakes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inscriptions_intake ON public.inscriptions(intake_id);

-- Journal d''envoi par moniteur
CREATE TABLE public.intake_outreach_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intake_id uuid NOT NULL REFERENCES public.course_intakes(id) ON DELETE CASCADE,
  ski_monitor_id uuid REFERENCES public.ski_monitors(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  recipient_name text,
  status text NOT NULL DEFAULT 'envoye',
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_intake_outreach_intake ON public.intake_outreach_log(intake_id);

ALTER TABLE public.intake_outreach_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rls_intake_outreach_select" ON public.intake_outreach_log FOR SELECT TO authenticated USING (is_staff());
CREATE POLICY "rls_intake_outreach_insert" ON public.intake_outreach_log FOR INSERT TO authenticated WITH CHECK (is_staff());

-- Canal commercial moniteur_ski
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_expansion_channel_check;
-- expansion_channel is text without check in original migration, just document via comment

-- Template email outreach moniteurs
INSERT INTO public.email_templates (slug, subject_fr, subject_en, subject_pt, body_fr, body_en, body_pt, variables)
VALUES (
  'intake_monitor_outreach',
  'Formation {{language}} — {{location}} du {{start_date}} au {{end_date}}',
  '{{language}} training — {{location}} from {{start_date}} to {{end_date}}',
  'Formação {{language}} — {{location}} de {{start_date}} a {{end_date}}',
  '<h2>Bonjour {{monitor_name}},</h2>
<p>Une nouvelle session de formation linguistique pour <strong>moniteurs de ski</strong> est ouverte :</p>
<ul>
  <li><strong>Langue :</strong> {{language}}</li>
  <li><strong>Lieu :</strong> {{location}}</li>
  <li><strong>Dates :</strong> du {{start_date}} au {{end_date}}</li>
  <li><strong>École hôte :</strong> {{host_school}}</li>
  <li><strong>Places :</strong> {{places_info}}</li>
</ul>
<p>{{open_scope_message}}</p>
<p><a href="{{registration_url}}">S''inscrire en ligne →</a></p>
<p>Cordialement,<br/>L''équipe France Langues International</p>',
  '<h2>Hello {{monitor_name}},</h2>
<p>A new language training session for <strong>ski instructors</strong> is now open:</p>
<ul>
  <li><strong>Language:</strong> {{language}}</li>
  <li><strong>Location:</strong> {{location}}</li>
  <li><strong>Dates:</strong> {{start_date}} to {{end_date}}</li>
  <li><strong>Host school:</strong> {{host_school}}</li>
  <li><strong>Places:</strong> {{places_info}}</li>
</ul>
<p>{{open_scope_message}}</p>
<p><a href="{{registration_url}}">Register online →</a></p>
<p>Best regards,<br/>France Langues International</p>',
  '<h2>Olá {{monitor_name}},</h2>
<p>Uma nova sessão de formação linguística para <strong>monitores de esqui</strong> está aberta:</p>
<ul>
  <li><strong>Idioma:</strong> {{language}}</li>
  <li><strong>Local:</strong> {{location}}</li>
  <li><strong>Datas:</strong> de {{start_date}} a {{end_date}}</li>
  <li><strong>Escola anfitriã:</strong> {{host_school}}</li>
  <li><strong>Vagas:</strong> {{places_info}}</li>
</ul>
<p>{{open_scope_message}}</p>
<p><a href="{{registration_url}}">Inscrever-se online →</a></p>
<p>Atenciosamente,<br/>France Langues International</p>',
  '["monitor_name","language","location","start_date","end_date","host_school","places_info","open_scope_message","registration_url"]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
