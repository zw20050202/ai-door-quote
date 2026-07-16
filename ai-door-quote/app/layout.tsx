import type { Metadata } from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI门窗报价助手',
  description: '让每个门窗老板都能在5分钟内完成专业报价',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ConfigProvider locale={zhCN}>{children}</ConfigProvider>
      </body>
    </html>
  );
}
