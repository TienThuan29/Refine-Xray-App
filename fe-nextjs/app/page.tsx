'use client';

import React, { useState } from 'react';
import { Layout, Typography, Empty } from 'antd';
import Sidebar from '../components/combination/sidebar';
import ChatSessionComponent from '../components/combination/chatsession';
import { useLanguage } from '../contexts/LanguageContext';
import { ChatSession } from '../types/folder';
const { Content } = Layout;
const { Title } = Typography;

export default function Home() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedChatSession, setSelectedChatSession] = useState<ChatSession | null>(null);
  const { t } = useLanguage();
  
  return (
    <Layout className="h-screen bg-gray-50">

      <Sidebar 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        onItemSelect={setSelectedChatSession}
      />

      <Layout className="h-screen">
        <Content className="h-full bg-white overflow-hidden">
          {selectedChatSession ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-white flex-shrink-0">
                <Title level={3} className="mb-0 text-gray-800">
                  {selectedChatSession.title}
                </Title>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatSessionComponent 
                  selectedSession={selectedChatSession}
                  onItemClick={(item) => {
                    console.log('Selected chat session:', item);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <Empty
                description={
                  <span className="text-gray-500 text-lg">
                    {t('welcome.description')}
                  </span>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          )}
        </Content>
      </Layout>
      
    </Layout>
  );
}
