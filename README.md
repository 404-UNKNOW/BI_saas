# BI SaaS - 嵌入式商业智能平台

基于Supabase和Google Gemini的嵌入式BI SaaS平台，使用自然语言分析数据。

## 功能特点

- **自然语言查询**：使用Google Gemini将自然语言转换为SQL查询
- **智能数据分析**：自动生成数据洞察和分析报告
- **实时数据同步**：数据变化实时反映在仪表盘上
- **多租户隔离**：严格的行级安全策略确保数据隔离
- **嵌入式集成**：可轻松嵌入到第三方应用中
- **自动化报告**：为高级用户自动生成周报

## 技术栈

- **前端**：React, Next.js
- **后端**：Supabase (PostgreSQL)
- **AI**：Google Gemini
- **图表**：Recharts
- **实时通信**：Supabase Realtime

## 快速开始

### 前提条件

- Node.js 14+
- Supabase 账号
- Google AI API 密钥

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/yourusername/bi-saas.git
cd bi-saas
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
创建 `.env.local` 文件并添加以下内容：
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
```

4. 初始化Supabase
```bash
npx supabase init
```

5. 应用数据库迁移
```bash
npx supabase db push
```

6. 启动开发服务器
```bash
npm run dev
```

## 部署

### Supabase设置

1. 在Supabase控制台中创建新项目
2. 应用迁移脚本 `supabase/migrations/20230501000000_initial_schema.sql`
3. 部署Edge Functions：
```bash
npx supabase functions deploy weekly-report
```

### 前端部署

可以部署到Vercel或其他支持Next.js的平台：

```bash
npm run build
npm run start
```

## 使用指南

### 自然语言查询

1. 登录系统
2. 在"自然语言查询"标签页输入您的问题
3. 系统会将问题转换为SQL并执行查询
4. 查看结果和自动生成的数据洞察

### 仪表盘管理

1. 切换到"仪表盘"标签页
2. 选择现有仪表盘或创建新仪表盘
3. 查看实时更新的数据图表

### 嵌入仪表盘

使用以下URL格式嵌入仪表盘到第三方应用：
```
https://your-domain.com/embed/{dashboard-id}
```

## 许可证

ISC 