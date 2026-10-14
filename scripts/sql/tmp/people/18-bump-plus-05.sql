-- Mollard oct 2026 : +0,5 pt (Paula 14/10/2026) ; Maelys → sur_20 Alpe d'Huez
UPDATE public.test_evaluations SET
  score_comprehension = 1.5,
  score_expression = 1.5,
  score_structure = 1.5,
  score_technique = 1.5,
  score_conversation = 1.5,
  score_general = 1.5,
  cecrl_label = 'A2+',
  scoring_system = 'sur_5',
WHERE id = '0c8f12f2-fd55-4e50-b712-1ad62a5ed178';
UPDATE public.test_evaluations SET
  score_comprehension = 4.0,
  score_expression = 1.5,
  score_structure = 1.5,
  score_technique = 1.5,
  score_conversation = 2.0,
  score_general = 2.5,
  cecrl_label = 'B1+',
  scoring_system = 'sur_5',
WHERE id = '287717b6-dbf7-4dae-a149-1e599b78ecd4';
UPDATE public.test_evaluations SET
  score_comprehension = 1.5,
  score_expression = 2.0,
  score_structure = 1.5,
  score_technique = 2.5,
  score_conversation = 2.0,
  score_general = 2.0,
  cecrl_label = 'B1',
  scoring_system = 'sur_5',
WHERE id = '277afb29-633d-4d3f-848c-41b797223768';
UPDATE public.test_evaluations SET
  score_comprehension = 10.5,
  score_expression = 10.5,
  score_structure = 10.5,
  score_technique = 10.0,
  score_conversation = 11.5,
  score_general = 10.5,
  cecrl_label = 'B2',
  scoring_system = 'sur_20',
  note_methodologique = $maelys$Barème Alpe d'Huez /20 (notes Mollard +0,5) : 10,5 · 10,5 · 10,5 · 10 · 11,5 · 10,5. Originaux : 10 · 10 · 10 · 9,5 · 11 · 10.$maelys$,
WHERE id = '60e75a80-e569-4f89-a5a2-d89049813289';
UPDATE public.test_evaluations SET
  score_comprehension = 3.5,
  score_expression = 3.5,
  score_structure = 3.5,
  score_technique = 3.5,
  score_conversation = 3.5,
  score_general = 3.5,
  cecrl_label = 'B2+',
  scoring_system = 'sur_5',
WHERE id = '4f215b5b-0015-4747-a3fa-de90445870d9';
UPDATE public.test_evaluations SET
  score_comprehension = 4.0,
  score_expression = 4.0,
  score_structure = 4.0,
  score_technique = 4.0,
  score_conversation = 4.5,
  score_general = 4.0,
  cecrl_label = 'C1',
  scoring_system = 'sur_5',
WHERE id = 'c60e0f81-5572-4809-85e9-184e6ec7a121';
UPDATE public.test_evaluations SET
  score_comprehension = 1.5,
  score_expression = 1.5,
  score_structure = 1.5,
  score_technique = 2.0,
  score_conversation = 1.5,
  score_general = 2.0,
  cecrl_label = 'B1',
  scoring_system = 'sur_5',
WHERE id = '14370a9b-9f66-4c7a-a818-3c7ba77fad85';
UPDATE public.test_evaluations SET
  score_comprehension = 1.5,
  score_expression = 2.0,
  score_structure = 2.0,
  score_technique = 2.0,
  score_conversation = 2.0,
  score_general = 2.0,
  cecrl_label = 'B1',
  scoring_system = 'sur_5',
WHERE id = 'e6b8ba5f-5008-41ff-9d02-f31c0a990cf8';
UPDATE public.test_evaluations SET
  score_comprehension = 3.5,
  score_expression = 2.5,
  score_structure = 2.5,
  score_technique = 2.5,
  score_conversation = 2.5,
  score_general = 2.5,
  cecrl_label = 'B1+',
  scoring_system = 'sur_5',
WHERE id = 'd4e018de-4571-4309-9498-b753385c6cc7';
UPDATE public.test_evaluations SET
  score_comprehension = 4.0,
  score_expression = 2.5,
  score_structure = 2.0,
  score_technique = 2.5,
  score_conversation = 2.0,
  score_general = 3.0,
  cecrl_label = 'B2',
  scoring_system = 'sur_5',
WHERE id = '9c8c4ede-6d2b-4894-a334-354accd9daa2';
UPDATE public.test_evaluations SET
  score_comprehension = 3.5,
  score_expression = 2.0,
  score_structure = 2.0,
  score_technique = 2.0,
  score_conversation = 2.0,
  score_general = 2.0,
  cecrl_label = 'B1',
  scoring_system = 'sur_5',
WHERE id = 'f0ad3680-bff5-4dbc-9c04-4514688a4215';
UPDATE public.test_evaluations SET
  score_comprehension = 3.5,
  score_expression = 2.5,
  score_structure = 1.5,
  score_technique = 3.0,
  score_conversation = 2.5,
  score_general = 3.0,
  cecrl_label = 'B2',
  scoring_system = 'sur_5',
WHERE id = '09126139-ae70-4f64-ad73-add9362b0bfc';
UPDATE public.test_evaluations SET
  score_comprehension = 3.5,
  score_expression = 2.5,
  score_structure = 3.0,
  score_technique = 2.0,
  score_conversation = 3.0,
  score_general = 3.0,
  cecrl_label = 'B2',
  scoring_system = 'sur_5',
WHERE id = 'b80999ea-cdf4-4fe5-ba69-fa65850b15ee';
UPDATE public.test_evaluations SET
  score_comprehension = 3.0,
  score_expression = 3.0,
  score_structure = 3.0,
  score_technique = 3.0,
  score_conversation = 3.0,
  score_general = 3.0,
  cecrl_label = 'B2',
  scoring_system = 'sur_5',
WHERE id = 'c807ba3c-0e7c-4469-b966-ea14a1de5ba2';
UPDATE public.test_evaluations SET
  score_comprehension = 3.5,
  score_expression = 3.0,
  score_structure = 3.0,
  score_technique = 2.5,
  score_conversation = 2.5,
  score_general = 3.0,
  cecrl_label = 'B2',
  scoring_system = 'sur_5',
WHERE id = '824c7d4c-8d16-471c-947c-52bfdff0eaff';
UPDATE public.test_evaluations SET
  score_comprehension = 2.0,
  score_expression = 2.0,
  score_structure = 2.0,
  score_technique = 1.5,
  score_conversation = 1.5,
  score_general = 1.5,
  cecrl_label = 'A2+',
  scoring_system = 'sur_5',
WHERE id = '36eceb4c-f81a-4211-9b3d-1997ff88123a';
UPDATE public.test_evaluations SET
  score_comprehension = 4.0,
  score_expression = 2.0,
  score_structure = 2.0,
  score_technique = 2.0,
  score_conversation = 2.0,
  score_general = 2.0,
  cecrl_label = 'B1',
  scoring_system = 'sur_5',
WHERE id = 'deed3466-ef12-4918-bff1-57750b655c05';
