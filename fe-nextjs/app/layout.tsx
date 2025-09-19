import type { Metadata } from "next";
import "./globals.css";
import '@ant-design/v5-patch-for-react-19';
import { Inter, JetBrains_Mono } from 'next/font/google'
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider } from 'antd';
import { LanguageProvider } from '../contexts/LanguageContext';
import { Toaster } from "@/components/ui/sonner";
import { UserProvider } from "@/contexts/AuthContext";
import SessionExpiredWrapper from "@/components/combination/session-expired-wrapper";

const sans = Inter({
  subsets: ['latin'],
  weight: ['300','400','500','600','700'],
  display: 'swap',
  variable: '--font-sans',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400','500','600'],
  display: 'swap',
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: "X-ray Diagnose",
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
            <LanguageProvider>
              <UserProvider>
                {children}
                <SessionExpiredWrapper />
              </UserProvider>
            </LanguageProvider>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
