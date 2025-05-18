-- 注意: 在实际使用前需要替换用户ID
-- 这里使用一个示例ID，实际使用时应替换为真实的用户ID
DO $$
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000000'; -- 替换为实际用户ID
BEGIN

-- 插入示例销售数据
INSERT INTO public.sales (product_name, amount, date, user_id)
VALUES
  ('笔记本电脑', 5999.99, CURRENT_DATE - INTERVAL '1 day', test_user_id),
  ('智能手机', 3999.99, CURRENT_DATE - INTERVAL '2 days', test_user_id),
  ('无线耳机', 999.99, CURRENT_DATE - INTERVAL '3 days', test_user_id),
  ('平板电脑', 2999.99, CURRENT_DATE - INTERVAL '4 days', test_user_id),
  ('智能手表', 1599.99, CURRENT_DATE - INTERVAL '5 days', test_user_id),
  ('笔记本电脑', 6599.99, CURRENT_DATE - INTERVAL '6 days', test_user_id),
  ('智能手机', 4299.99, CURRENT_DATE - INTERVAL '7 days', test_user_id),
  ('无线耳机', 899.99, CURRENT_DATE - INTERVAL '8 days', test_user_id),
  ('平板电脑', 3299.99, CURRENT_DATE - INTERVAL '9 days', test_user_id),
  ('智能手表', 1299.99, CURRENT_DATE - INTERVAL '10 days', test_user_id),
  ('笔记本电脑', 7999.99, CURRENT_DATE - INTERVAL '11 days', test_user_id),
  ('智能手机', 5999.99, CURRENT_DATE - INTERVAL '12 days', test_user_id),
  ('无线耳机', 1299.99, CURRENT_DATE - INTERVAL '13 days', test_user_id),
  ('平板电脑', 3599.99, CURRENT_DATE - INTERVAL '14 days', test_user_id),
  ('智能手表', 1799.99, CURRENT_DATE - INTERVAL '15 days', test_user_id),
  ('笔记本电脑', 4999.99, CURRENT_DATE - INTERVAL '16 days', test_user_id),
  ('智能手机', 3599.99, CURRENT_DATE - INTERVAL '17 days', test_user_id),
  ('无线耳机', 799.99, CURRENT_DATE - INTERVAL '18 days', test_user_id),
  ('平板电脑', 2799.99, CURRENT_DATE - INTERVAL '19 days', test_user_id),
  ('智能手表', 1399.99, CURRENT_DATE - INTERVAL '20 days', test_user_id),
  ('笔记本电脑', 6299.99, CURRENT_DATE - INTERVAL '21 days', test_user_id),
  ('智能手机', 4099.99, CURRENT_DATE - INTERVAL '22 days', test_user_id),
  ('无线耳机', 1099.99, CURRENT_DATE - INTERVAL '23 days', test_user_id),
  ('平板电脑', 3199.99, CURRENT_DATE - INTERVAL '24 days', test_user_id),
  ('智能手表', 1699.99, CURRENT_DATE - INTERVAL '25 days', test_user_id),
  ('笔记本电脑', 5499.99, CURRENT_DATE - INTERVAL '26 days', test_user_id),
  ('智能手机', 3799.99, CURRENT_DATE - INTERVAL '27 days', test_user_id),
  ('无线耳机', 899.99, CURRENT_DATE - INTERVAL '28 days', test_user_id),
  ('平板电脑', 2899.99, CURRENT_DATE - INTERVAL '29 days', test_user_id),
  ('智能手表', 1499.99, CURRENT_DATE - INTERVAL '30 days', test_user_id);

-- 创建示例仪表盘
INSERT INTO public.dashboards (name, config, user_id)
VALUES
  ('销售概览', 
   '{
      "chartType": "bar",
      "xField": "product_name",
      "yField": "total_amount",
      "query": "SELECT product_name, SUM(amount) as total_amount FROM sales GROUP BY product_name ORDER BY total_amount DESC",
      "tables": ["sales"],
      "description": "按产品类型显示总销售额"
    }',
    test_user_id
  ),
  ('销售趋势', 
   '{
      "chartType": "line",
      "xField": "date",
      "yField": "daily_amount",
      "query": "SELECT date, SUM(amount) as daily_amount FROM sales GROUP BY date ORDER BY date",
      "tables": ["sales"],
      "description": "显示每日销售额趋势"
    }',
    test_user_id
  ),
  ('产品占比', 
   '{
      "chartType": "pie",
      "xField": "product_name",
      "yField": "total_amount",
      "query": "SELECT product_name, SUM(amount) as total_amount FROM sales GROUP BY product_name",
      "tables": ["sales"],
      "description": "各产品销售额占比"
    }',
    test_user_id
  );

END $$; 