import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { supabase, executeSecureQuery, subscribeToTable } from '../lib/supabase';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function Dashboard({ dashboardId }) {
  const [config, setConfig] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 加载仪表盘配置
  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        
        // 获取仪表盘配置
        const { data: dashboardConfig } = await supabase
          .from('dashboards')
          .select('*')
          .eq('id', dashboardId)
          .single();
        
        if (!dashboardConfig) throw new Error('找不到仪表盘');
        setConfig(dashboardConfig);
        
        // 执行预置查询
        if (dashboardConfig.config?.query) {
          const result = await executeSecureQuery(dashboardConfig.config.query);
          setData(result || []);
        }
      } catch (err) {
        console.error('加载仪表盘失败:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (dashboardId) {
      loadDashboard();
    }
  }, [dashboardId]);
  
  // 订阅实时更新
  useEffect(() => {
    if (!config?.config?.tables?.length) return;
    
    const channels = config.config.tables.map(table => 
      subscribeToTable(table, async () => {
        // 当表数据变化时，重新加载数据
        if (config.config?.query) {
          try {
            const result = await executeSecureQuery(config.config.query);
            setData(result || []);
          } catch (err) {
            console.error('实时更新数据失败:', err);
          }
        }
      })
    );
    
    // 清理订阅
    return () => {
      channels.forEach(channel => {
        if (channel?.unsubscribe) channel.unsubscribe();
      });
    };
  }, [config]);
  
  if (loading) return <div className="loading">加载仪表盘中...</div>;
  if (error) return <div className="error">错误: {error}</div>;
  if (!config) return <div className="empty">未找到仪表盘配置</div>;

  // 渲染仪表盘
  const renderCharts = () => {
    if (!data || data.length === 0) {
      return <div className="no-data">暂无数据</div>;
    }
    
    const chartType = config.config?.chartType || 'bar';
    const xKey = config.config?.xField || Object.keys(data[0])[0];
    const yKey = config.config?.yField || Object.keys(data[0])[1];
    
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={yKey} fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={yKey} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                labelLine={false}
                nameKey={xKey}
                dataKey={yKey}
                cx="50%"
                cy="50%"
                outerRadius={150}
                fill="#8884d8"
                label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return <div>不支持的图表类型: {chartType}</div>;
    }
  };
  
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>{config.name || '未命名仪表盘'}</h2>
        <div className="dashboard-actions">
          <button onClick={() => window.print()}>导出PDF</button>
        </div>
      </div>
      
      <div className="dashboard-content">
        <div className="chart-container">
          {renderCharts()}
        </div>
        
        {config.config?.description && (
          <div className="dashboard-description">
            <h3>说明</h3>
            <p>{config.config.description}</p>
          </div>
        )}
      </div>
    </div>
  );
} 