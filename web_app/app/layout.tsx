import type { Metadata } from "next";
import "./globals.css";
import '@ant-design/v5-patch-for-react-19';
import { Inter, JetBrains_Mono } from 'next/font/google'
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "@/contexts/AuthContext";
import SessionExpiredWrapper from "@/components/combination/session-expired-wrapper";

const sans = Inter({
  subsets: ['latin'],
  weight: ['300','400','500','600','700'],
  display: 'swap',
  variable: '--font-sans',
  fallback: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400','500','600'],
  display: 'swap',
  variable: '--font-mono',
  fallback: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
})

export const metadata: Metadata = {
  title: "Clini AI Medical",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
      <Toaster position="top-right" />
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: '#0069d1',
              },
            }}
          >
            <UserProvider>
              {children}
              <SessionExpiredWrapper />
            </UserProvider>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
