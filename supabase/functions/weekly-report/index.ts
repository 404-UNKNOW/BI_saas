import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('id, email')
      .neq('plan_level', 'free');

    if (usersError) throw usersError;

    const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const reports = [];

    for (const user of users) {
      const { data: salesData, error: salesError } = await supabaseClient
        .rpc('execute_safe_sql', { 
          sql_text: `
            SELECT 
              product_name, 
              SUM(amount) as total_amount,
              COUNT(*) as transactions,
              AVG(amount) as avg_amount
            FROM 
              sales
            WHERE 
              date >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY 
              product_name
            ORDER BY 
              total_amount DESC
          `,
          user_id: user.id 
        });

      if (salesError) throw salesError;

      const { data: comparisonData, error: comparisonError } = await supabaseClient
        .rpc('execute_safe_sql', { 
          sql_text: `
            SELECT 
              SUM(amount) as prev_week_amount
            FROM 
              sales
            WHERE 
              date >= CURRENT_DATE - INTERVAL '14 days' AND
              date < CURRENT_DATE - INTERVAL '7 days'
          `,
          user_id: user.id 
        });

      if (comparisonError) throw comparisonError;

      const promptTemplate = `
        作为数据分析专家，请根据以下销售数据生成一份周度报告摘要：
        
        本周销售数据：
        ${JSON.stringify(salesData, null, 2)}
        
        上周销售总额：${comparisonData[0]?.prev_week_amount || 0}
        
        请提供以下内容：
        1. 本周销售概览
        2. 表现最好的产品分析
        3. 与上周的环比分析
        4. 建议的行动计划
        
        请使用专业、简洁的语言，不超过300字。
      `;

      const result = await model.generateContent(promptTemplate);
      const reportText = result.response.text();

      const { data: report, error: reportError } = await supabaseClient
        .from('reports')
        .insert({
          user_id: user.id,
          content: reportText,
          type: 'weekly',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (reportError) throw reportError;

      reports.push({
        user_id: user.id,
        email: user.email,
        report_id: report.id
      });
    }

    return new Response(
      JSON.stringify({ success: true, reports }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});