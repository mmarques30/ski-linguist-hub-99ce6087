import {
  adminCorsHeaders,
  requireServiceRoleOrStaff,
} from '../_shared/admin-auth.ts';

const corsHeaders = adminCorsHeaders;

interface CostTemplate {
  id: string;
  cost_type: string;
  description: string | null;
  montant_mensuel: number;
  actif: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Cron / staff only — refuse anon (finding #7).
  const auth = await requireServiceRoleOrStaff(req);
  if (auth instanceof Response) return auth;

  try {
    const supabase = auth.adminClient;

    // Get current month in YYYY-MM format
    const now = new Date();
    const mois = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    console.log(`Generating monthly charges for: ${mois}`);

    // Fetch active cost templates
    const { data: templates, error: templatesError } = await supabase
      .from('cost_templates')
      .select('*')
      .eq('actif', true);

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      throw templatesError;
    }

    if (!templates || templates.length === 0) {
      console.log('No active templates found');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active templates found',
          generated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${templates.length} active templates`);

    // Generate fixed costs for each template
    const fixedCosts = templates.map((template: CostTemplate) => ({
      mois,
      cost_type: template.cost_type,
      description: template.description,
      montant: template.montant_mensuel,
      recurrent: true,
      paye: false,
    }));

    // Upsert to avoid duplicates (based on mois + cost_type)
    const { data: upsertedCosts, error: upsertError } = await supabase
      .from('fixed_costs')
      .upsert(fixedCosts, { 
        onConflict: 'mois,cost_type',
        ignoreDuplicates: false 
      })
      .select();

    if (upsertError) {
      console.error('Error upserting fixed costs:', upsertError);
      throw upsertError;
    }

    console.log(`Successfully generated ${fixedCosts.length} charges for ${mois}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated charges for ${mois}`,
        generated: fixedCosts.length,
        month: mois,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in generate-monthly-charges:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
