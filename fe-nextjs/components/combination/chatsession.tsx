'use client';

import React, { useState } from 'react';
import { Input, Button, Card, Avatar, Typography, Space, Image, Modal, List, Tag } from 'antd';
import { SearchOutlined, UserOutlined, RobotOutlined, CalendarOutlined, FileImageOutlined } from '@ant-design/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChatSession, ChatItem } from '../../types/folder';
import { mockItems } from '../../mocks/folderData';

const { Search } = Input;
const { Text, Title } = Typography;

interface ChatSessionProps {
  selectedSession?: ChatSession | null;
  onItemClick?: (item: ChatSession) => void;
}

const ChatSessionComponent: React.FC<ChatSessionProps> = ({ selectedSession, onItemClick }) => {
  
  const { t } = useLanguage();
  const [searchText, setSearchText] = useState('');
  const [selectedItem, setSelectedItem] = useState<ChatSession | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleItemClick = (item: ChatSession) => {
    setSelectedItem(item);
    setIsModalVisible(true);
    onItemClick?.(item);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedItem(null);
  };

  const filteredItems = mockItems.filter(item =>
    item.title.toLowerCase().includes(searchText.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // If a specific session is selected, show its chat items directly
  if (selectedSession) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <List
            dataSource={selectedSession.chatItems}
            split={false}
            renderItem={(chatItem: ChatItem) => (
              <List.Item className="!px-0 !py-4 !border-none">
                <div className={`w-full ${chatItem.isBot ? 'flex justify-start' : 'flex justify-end'}`}>
                  <div className={`max-w-xs lg:max-w-md ${chatItem.isBot ? 'mr-auto' : 'ml-auto'}`}>
                    <div className={`flex items-start space-x-2 ${chatItem.isBot ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
                      <Avatar 
                        size={32} 
                        icon={chatItem.isBot ? <RobotOutlined /> : <UserOutlined />}
                        className={chatItem.isBot ? 'bg-green-100 text-green-600' : 'text-white'}
                        style={{ backgroundColor: chatItem.isBot ? undefined : 'var(--main-color)' }}
                      />
                      
                      <div className={`flex-1 ${chatItem.isBot ? 'text-left' : 'text-right'}`}>
                        <div 
                          className={`inline-block p-3 rounded-lg ${
                            chatItem.isBot 
                              ? 'bg-gray-100 text-gray-800 ml-2' 
                              : 'text-white mr-2'
                          }`}
                          style={{ backgroundColor: chatItem.isBot ? undefined : 'var(--main-color)' }}
                        >
                          <div className={chatItem.isBot ? 'text-gray-800' : 'text-white'}>
                            {chatItem.content}
                          </div>
                        </div>
                        
                        {/* Image URLs */}
                        {chatItem.imageUrls && chatItem.imageUrls.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {chatItem.imageUrls.map((imageUrl, index) => (
                              <div key={index} className="relative">
                                <Image
                                  src={imageUrl}
                                  alt={`Chat image ${index + 1}`}
                                  className="rounded-lg max-w-full h-auto"
                                  style={{ maxHeight: '200px' }}
                                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className={`text-xs text-gray-500 mt-1 ${chatItem.isBot ? 'text-left' : 'text-right'}`}>
                          {formatDate(chatItem.createdDate || '')}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        </div>
      </div>
    );
  }

  // Default list view when no specific session is selected
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <Title level={4} className="mb-4 text-gray-800">
          {t('chatSession.title')}
        </Title>
        <Search
          placeholder={t('chatSession.searchPlaceholder')}
          allowClear
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined className="text-gray-400" />}
          className="w-full"
        />
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <Space direction="vertical" size="middle" className="w-full">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              hoverable
              className="cursor-pointer transition-all duration-200 hover:shadow-md"
              onClick={() => handleItemClick(item)}
              bodyStyle={{ padding: '16px' }}
            >
              <div className="flex items-start space-x-3">
                <Avatar 
                  size={48} 
                  icon={<UserOutlined />} 
                  className="text-white"
                  style={{ backgroundColor: 'var(--main-color)' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <Title level={5} className="mb-0 text-gray-800 truncate">
                      {item.title}
                    </Title>
                    <Text type="secondary" className="text-xs">
                      {formatDate(item.createdDate || '')}
                    </Text>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      <CalendarOutlined className="mr-1" />
                      {item.chatItems.length} {t('chatSession.messages')}
                    </span>
                    <Text type="secondary" className="text-xs">
                      {formatDate(item.updatedDate || '')}
                    </Text>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </Space>
      </div>

      {/* Chat Item Detail Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <UserOutlined style={{ color: 'var(--main-color)' }} />
            <span>{selectedItem?.title}</span>
          </div>
        }
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={800}
        className="chat-detail-modal"
      >
        {selectedItem && (
          <div className="max-h-96 overflow-y-auto">
            <List
              dataSource={selectedItem.chatItems}
              renderItem={(chatItem: ChatItem) => (
                <List.Item className="!px-0">
                  <div className={`w-full ${chatItem.isBot ? 'flex justify-start' : 'flex justify-end'}`}>
                    <div className={`max-w-xs lg:max-w-md ${chatItem.isBot ? 'mr-auto' : 'ml-auto'}`}>
                      <div className={`flex items-start space-x-2 ${chatItem.isBot ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
                        <Avatar 
                          size={32} 
                          icon={chatItem.isBot ? <RobotOutlined /> : <UserOutlined />}
                          className={chatItem.isBot ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}
                        />
                        <div className={`flex-1 ${chatItem.isBot ? 'text-left' : 'text-right'}`}>
                          <div className={`inline-block p-3 rounded-lg ${
                            chatItem.isBot 
                              ? 'bg-gray-100 text-gray-800' 
                              : 'bg-blue-500 text-white'
                          }`}>
                            <div className={chatItem.isBot ? 'text-gray-800' : 'text-white'}>
                              {chatItem.content}
                            </div>
                          </div>
                          
                          {/* Image URLs */}
                          {chatItem.imageUrls && chatItem.imageUrls.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {chatItem.imageUrls.map((imageUrl, index) => (
                                <div key={index} className="relative">
                                  <Image
                                    src={imageUrl}
                                    alt={`Chat image ${index + 1}`}
                                    className="rounded-lg max-w-full h-auto"
                                    style={{ maxHeight: '200px' }}
                                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className={`text-xs text-gray-500 mt-1 ${chatItem.isBot ? 'text-left' : 'text-right'}`}>
                            {formatDate(chatItem.createdDate || '')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ChatSessionComponent;