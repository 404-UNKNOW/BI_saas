import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * 将自然语言转换为SQL查询
 * @param {string} prompt 用户的自然语言问题
 * @param {object} tableSchema 表结构信息
 * @returns {string} 生成的SQL查询
 */
export async function generateSQL(prompt, tableSchema) {
  if (!apiKey) {
    throw new Error('未配置Gemini API密钥');
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  
  const promptTemplate = `
    你是一个PostgreSQL专家。根据以下表结构：
    ${JSON.stringify(tableSchema, null, 2)}
    
    将以下自然语言转换为PostgreSQL查询：
    "${prompt}"
    
    只返回SQL查询，不要解释。SQL查询必须遵循以下规则：
    1. 只使用SELECT语句，不允许任何写操作
    2. 确保查询性能高效，避免笛卡尔积
    3. 必要时使用适当的过滤条件
  `;

  try {
    const result = await model.generateContent(promptTemplate);
    const sqlQuery = result.response.text().trim();
    
    // 验证只包含SELECT语句
    if (!sqlQuery.toUpperCase().startsWith('SELECT')) {
      throw new Error('生成的查询不是有效的SELECT语句');
    }
    
    return sqlQuery;
  } catch (error) {
    console.error('Gemini API错误:', error);
    throw new Error('无法生成SQL查询');
  }
}

/**
 * 生成数据分析洞察
 * @param {Array} data 数据结果集
 * @returns {string} 数据洞察文本
 */
export async function generateInsights(data) {
  if (!apiKey) {
    throw new Error('未配置Gemini API密钥');
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  
  const promptTemplate = `
    作为一位数据分析专家，请分析以下数据集并提供关键洞察：
    ${JSON.stringify(data, null, 2)}
    
    请提供3-5条关键洞察，重点关注：
    1. 趋势和模式
    2. 异常值和异常点
    3. 潜在的商业价值
    
    简明扼要地列出洞察，不需要额外说明。
  `;

  try {
    const result = await model.generateContent(promptTemplate);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API错误:', error);
    throw new Error('无法生成数据洞察');
  }
} 