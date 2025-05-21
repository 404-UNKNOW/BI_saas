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

export async function getTableSchema() {
  const tableNames = ['sales', 'dashboards', 'comments'];
  const tables = {};

  try {
    // 使用安全的SQL查询获取表结构
    const user = await getCurrentUser();
    if (!user) throw new Error('需要登录才能获取表结构');
    
    for (const tableName of tableNames) {
      const sql = `
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = '${tableName}'
      `;
      
      const { data, error } = await supabase.rpc('execute_safe_sql', { 
        sql_text: sql,
        user_id: user.id 
      });
      
      if (error) throw error;
      
      if (data) {
        tables[tableName] = data.map(column => ({
          column_name: column.column_name,
          data_type: column.data_type
        }));
      }
    }
    
    return tables;
  } catch (error) {
    console.error('获取表结构失败:', error);
    throw error;
  }
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