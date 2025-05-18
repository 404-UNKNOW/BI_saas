import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10 // 控制实时更新频率
    }
  }
});

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function executeSecureQuery(sql) {
  const user = await getCurrentUser();
  if (!user) throw new Error('需要登录才能执行查询');
  
  const { data, error } = await supabase.rpc('execute_safe_sql', { 
    sql_text: sql,
    user_id: user.id 
  });
  
  if (error) throw error;
  return data;
}

export async function subscribeToTable(table, callback) {
  return supabase
    .channel(`${table}_changes`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table,
    }, callback)
    .subscribe();
}

export async function getDashboardConfig(dashboardId) {
  const { data, error } = await supabase
    .from('dashboards')
    .select('*')
    .eq('id', dashboardId)
    .single();
  
  if (error) throw error;
  return data;
} 