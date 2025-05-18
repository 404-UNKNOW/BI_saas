import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Dashboard from '../../components/Dashboard';
import { supabase } from '../../lib/supabase';

export default function EmbeddedDashboard() {
  const router = useRouter();
  const { id } = router.query;
  const [dashboardInfo, setDashboardInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadDashboard() {
      if (!id) return;

      try {
        setLoading(true);
        
        // 获取仪表盘信息用于显示标题等
        const { data, error } = await supabase
          .from('dashboards')
          .select('name, config')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        if (!data) throw new Error('找不到仪表盘');
        
        setDashboardInfo(data);
      } catch (err) {
        console.error('加载仪表盘失败:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [id]);

  if (loading) return <div className="loading">加载中...</div>;
  if (error) return <div className="error">错误: {error}</div>;

  return (
    <div className="embedded-dashboard">
      <Head>
        <title>{dashboardInfo?.name || '仪表盘'} | BI SaaS</title>
        <meta name="robots" content="noindex" />
      </Head>
      
      <div className="embed-header">
        <h1>{dashboardInfo?.name || '仪表盘'}</h1>
        <div className="powered-by">
          Powered by <span className="brand">BI SaaS</span>
        </div>
      </div>
      
      <div className="embed-container">
        {id && <Dashboard dashboardId={id} />}
      </div>
      
      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
            Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        .embedded-dashboard {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0;
        }
        
        .embed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #eaeaea;
        }
        
        .embed-header h1 {
          margin: 0;
          font-size: 1.5rem;
        }
        
        .powered-by {
          font-size: 0.8rem;
          color: #666;
        }
        
        .brand {
          font-weight: bold;
          color: #0070f3;
        }
        
        .embed-container {
          padding: 1rem;
        }
        
        .loading, .error {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 1.2rem;
        }
        
        .error {
          color: #e00;
        }
      `}</style>
    </div>
  );
} 