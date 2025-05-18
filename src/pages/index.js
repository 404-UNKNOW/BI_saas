import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabase';
import NaturalLanguageQuery from '../components/NaturalLanguageQuery';
import Dashboard from '../components/Dashboard';

export default function Home() {
  const [session, setSession] = useState(null);
  const [dashboards, setDashboards] = useState([]);
  const [activeDashboard, setActiveDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('query'); // 'query' 或 'dashboards'

  // 监听认证状态变化
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // 获取初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 获取用户的仪表盘
  useEffect(() => {
    if (session) {
      fetchDashboards();
    }
  }, [session]);

  async function fetchDashboards() {
    if (!session) return;
    
    try {
      const { data, error } = await supabase
        .from('dashboards')
        .select('*')
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      setDashboards(data || []);
    } catch (err) {
      console.error('获取仪表盘失败:', err);
    }
  }

  async function handleLogin(provider = 'github') {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
        }
      });
      
      if (error) throw error;
    } catch (err) {
      console.error('登录失败:', err);
      alert('登录失败，请重试');
    }
  }

  async function handleLogout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (err) {
      console.error('退出失败:', err);
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  if (!session) {
    return (
      <div className="login-page">
        <Head>
          <title>BI SaaS - 智能数据分析平台</title>
        </Head>
        
        <div className="login-container">
          <h1>BI SaaS</h1>
          <p>嵌入式商业智能平台，使用自然语言分析数据</p>
          
          <div className="login-buttons">
            <button onClick={() => handleLogin('github')} className="login-button github">
              使用GitHub登录
            </button>
            <button onClick={() => handleLogin('google')} className="login-button google">
              使用Google登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Head>
        <title>BI SaaS - 智能数据分析平台</title>
      </Head>
      
      <header className="app-header">
        <div className="logo">BI SaaS</div>
        <nav className="main-nav">
          <button 
            className={tab === 'query' ? 'active' : ''} 
            onClick={() => setTab('query')}
          >
            自然语言查询
          </button>
          <button 
            className={tab === 'dashboards' ? 'active' : ''} 
            onClick={() => setTab('dashboards')}
          >
            仪表盘
          </button>
        </nav>
        <div className="user-menu">
          <span>{session.user.email}</span>
          <button onClick={handleLogout} className="logout-button">退出</button>
        </div>
      </header>
      
      <main className="app-main">
        {tab === 'query' ? (
          <NaturalLanguageQuery />
        ) : (
          <div className="dashboards-container">
            <div className="dashboards-sidebar">
              <h3>您的仪表盘</h3>
              <ul className="dashboards-list">
                {dashboards.length === 0 ? (
                  <li className="empty-list">暂无仪表盘</li>
                ) : (
                  dashboards.map(dashboard => (
                    <li 
                      key={dashboard.id} 
                      className={activeDashboard === dashboard.id ? 'active' : ''}
                      onClick={() => setActiveDashboard(dashboard.id)}
                    >
                      {dashboard.name}
                    </li>
                  ))
                )}
              </ul>
              <button className="create-dashboard-button">
                创建新仪表盘
              </button>
            </div>
            
            <div className="dashboard-view">
              {activeDashboard ? (
                <Dashboard dashboardId={activeDashboard} />
              ) : (
                <div className="empty-dashboard">
                  <p>请选择或创建仪表盘</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 