import { useState, useEffect } from 'react';
import { generateSQL, generateInsights } from '../lib/gemini';
import { executeSecureQuery, supabase, getTableSchema } from '../lib/supabase';

export default function NaturalLanguageQuery() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sql, setSql] = useState('');
  const [insights, setInsights] = useState('');
  const [tableSchema, setTableSchema] = useState(null);

  // 获取当前用户的数据表结构
  useEffect(() => {
    async function fetchTableSchema() {
      try {
        // 使用新的getTableSchema函数
        const tables = await getTableSchema();
        setTableSchema(tables);
      } catch (err) {
        console.error('获取表结构失败:', err);
        setError('无法加载数据表结构，请稍后再试');
      }
    }
    
    fetchTableSchema();
  }, []);

  const handleQuery = async () => {
    if (!query.trim() || !tableSchema) return;
    
    setLoading(true);
    setError(null);
    setResults([]);
    setSql('');
    setInsights('');
    
    try {
      // 1. 使用Gemini生成SQL
      const generatedSQL = await generateSQL(query, tableSchema);
      setSql(generatedSQL);
      
      // 2. 执行生成的SQL
      const queryResults = await executeSecureQuery(generatedSQL);
      setResults(queryResults || []);
      
      // 3. 生成洞察
      if (queryResults && queryResults.length > 0) {
        const generatedInsights = await generateInsights(queryResults);
        setInsights(generatedInsights);
      }
    } catch (err) {
      console.error('查询失败:', err);
      setError(err.message || '查询执行失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="natural-language-query">
      <div className="query-header">
        <h2>数据分析助手</h2>
        <p>用自然语言提问，AI为您分析数据</p>
      </div>

      <div className="query-input-container">
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="例如：显示过去30天内销售额最高的5个产品"
          className="query-input"
          disabled={loading}
        />
        <button 
          onClick={handleQuery} 
          disabled={loading || !query.trim()}
          className="query-button"
        >
          {loading ? '分析中...' : '分析'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {sql && (
        <div className="generated-sql">
          <h3>生成的SQL查询</h3>
          <pre>{sql}</pre>
        </div>
      )}

      {results.length > 0 && (
        <div className="query-results">
          <h3>查询结果</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {Object.keys(results[0]).map(key => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((value, cellIndex) => (
                      <td key={cellIndex}>{
                        // 处理不同类型的值
                        value === null ? 'NULL' :
                        typeof value === 'object' ? JSON.stringify(value) :
                        String(value)
                      }</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {insights && (
        <div className="data-insights">
          <h3>数据洞察</h3>
          <div className="insights-content">
            {insights.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 