-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS pg_graphql;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS vector;

-- 创建用户表（Supabase Auth 自动管理）
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  plan_level TEXT DEFAULT 'free' -- free/pro/enterprise
);

-- 创建示例数据表
CREATE TABLE IF NOT EXISTS public.sales (
  id SERIAL PRIMARY KEY,
  product_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL
);

-- 创建仪表盘配置表
CREATE TABLE IF NOT EXISTS public.dashboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  config JSONB NOT NULL, -- 存储图表布局、查询条件等
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 创建注释表（用于实时协作）
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID REFERENCES public.dashboards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  content TEXT NOT NULL,
  position JSONB, -- 在仪表盘上的位置
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 创建安全执行SQL的函数
CREATE OR REPLACE FUNCTION public.execute_safe_sql(sql_text TEXT, user_id UUID)
RETURNS JSONB AS $$
DECLARE
  result_json JSONB;
BEGIN
  -- 检查 SQL 是否只包含 SELECT 语句（防止注入）
  IF sql_text ~* '^\\s*SELECT' THEN
    -- 设置RLS上下文
    EXECUTE 'SET LOCAL request.jwt.claims.user_id = ' || quote_literal(user_id);
    -- 执行查询并将结果存储为JSON
    EXECUTE 'WITH query_result AS (' || sql_text || ') SELECT jsonb_agg(to_jsonb(query_result)) FROM query_result' INTO result_json;
    RETURN COALESCE(result_json, '[]'::jsonb);
  ELSE
    RAISE EXCEPTION '只允许 SELECT 查询';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '查询执行错误: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 设置行级安全策略
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 销售数据的安全策略
CREATE POLICY sales_owner_policy ON public.sales 
  FOR ALL
  USING (user_id = auth.uid());

-- 仪表盘的安全策略
CREATE POLICY dashboards_owner_policy ON public.dashboards 
  FOR ALL
  USING (user_id = auth.uid());

-- 注释的安全策略
CREATE POLICY comments_read_policy ON public.comments 
  FOR SELECT
  USING (TRUE); -- 所有人都可以查看注释

CREATE POLICY comments_write_policy ON public.comments 
  FOR INSERT
  WITH CHECK (user_id = auth.uid()); -- 只有自己能创建注释

-- 创建触发器函数来更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为仪表盘表添加更新触发器
CREATE TRIGGER dashboards_updated_at
BEFORE UPDATE ON public.dashboards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- 创建获取表结构的函数
CREATE OR REPLACE FUNCTION public.get_table_schema()
RETURNS TABLE (
  table_name TEXT,
  column_name TEXT,
  data_type TEXT
) AS $$
BEGIN
  -- 只返回属于当前用户的表中的列信息
  RETURN QUERY
  SELECT 
    c.relname::TEXT AS table_name,
    a.attname::TEXT AS column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod)::TEXT AS data_type
  FROM 
    pg_catalog.pg_attribute a
  JOIN 
    pg_catalog.pg_class c ON a.attrelid = c.oid
  JOIN 
    pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  WHERE 
    n.nspname = 'public'
    AND a.attnum > 0 
    AND NOT a.attisdropped
    AND c.relkind = 'r'
    AND (c.relname = 'sales' OR c.relname = 'dashboards' OR c.relname = 'comments')
  ORDER BY 
    c.relname, a.attnum;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 