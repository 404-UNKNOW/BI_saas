import '../styles/globals.css';
import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="嵌入式商业智能平台，使用自然语言分析数据" />
        <title>BI SaaS - 智能数据分析平台</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp; 