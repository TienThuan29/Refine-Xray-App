'use client';

import React, { useState } from 'react';
import { Layout, Button, Input, Avatar, Dropdown, Menu, Card, Space, Typography, Badge, Divider } from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  SearchOutlined,
  MessageOutlined,
  BookOutlined,
  FileTextOutlined,
  SettingOutlined,
  MoreOutlined,
  LinkOutlined,
  BulbOutlined,
  PictureOutlined,
  StarOutlined,
  UserOutlined,
  DownOutlined,
  QuestionCircleOutlined,
  GlobalOutlined,
  StarFilled,
  FolderOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import { MenuProps } from 'antd';
import { mockFolders } from '../mocks/folderData';
import { Folder, ChatSession, ChatItem } from '../types/folder';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { CiLogin } from "react-icons/ci";
import NewChatModal from '../components/combination/newchat';
import SettingsModal from '../components/combination/setting';
import SessionExpiredWrapper from '../components/combination/session-expired-wrapper';
import { useRouter } from 'next/navigation';
const { Sider, Content } = Layout;
const { Title, Text } = Typography;
import { FaRegQuestionCircle } from "react-icons/fa";
import Footer from '@/components/single/footer';



const suggestedActions = [
  {
    title: "Diagnose X-ray Image",
    description: "Diagnose X-ray image with Medical Clini AI",
    icon: <FileTextOutlined className="text-xl" />,
    color: "bg-blue-50 border-blue-200 hover:bg-blue-100"
  },
  {
    title: "Recommend from PubMed's Knowledge",
    description: "Recommend from PubMed's Knowledge",
    icon: <StarOutlined className="text-xl" />,
    color: "bg-purple-50 border-purple-200 hover:bg-purple-100"
  },
  {
    title: "Support Report Template",
    description: "Support Report Template",
    icon: <BulbOutlined className="text-xl" />,
    color: "bg-green-50 border-green-200 hover:bg-green-100"
  }
];


const getUserMenuItems = (onLogout: () => void): MenuProps['items'] => [
  {
    key: 'profile',
    icon: <UserOutlined />,
    label: 'Profile',
  },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: 'Settings',
  },
  {
    type: 'divider',
  },
  {
    key: 'logout',
    label: 'Logout',
    onClick: onLogout,
  },
];

const headerMenuItems: MenuProps['items'] = [
  {
    key: 'v1',
    label: 'Clini AI',
    icon: <DownOutlined />,
  },
];


export default function Page() {

  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedChatSession, setSelectedChatSession] = useState<ChatSession | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedKey, setSelectedKey] = useState('');
  const [newChatVisible, setNewChatVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const { t } = useLanguage();


  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'settings') {
      setSettingsVisible(true);
      return;
    }
    
    if (key === 'logout') {
      logout();
      return;
    }
    
    const folder = mockFolders.find(f => f.id === key);
    if (folder) {
      // Toggle folder expansion
      toggleFolder(key);
    } else {
      // Handle chat session selection
      setSelectedKey(key);
      const chatSession = mockFolders
        .flatMap(f => f.chatSessions)
        .find(session => session.id === key);
      
      if (chatSession) {
        setSelectedChatSession(chatSession);
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  };

  const groupChatSessionsByDate = () => {
    const allSessions = mockFolders.flatMap(folder => 
      folder.chatSessions.map(session => ({
        ...session,
        folderTitle: folder.title
      }))
    );

    const grouped = allSessions.reduce((acc, session) => {
      const dateGroup = formatDate(session.updatedDate || session.createdDate || '');
      if (!acc[dateGroup]) {
        acc[dateGroup] = [];
      }
      acc[dateGroup].push(session);
      return acc;
    }, {} as Record<string, Array<ChatSession & { folderTitle: string }>>);

    return grouped;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      // Handle sending message
      console.log('Sending message:', inputValue);
      setInputValue('');
    }
  };

  const handleCreateChat = (data: { title: string; files: File[] }) => {
    console.log('Creating new chat:', data);
    // Here you would typically make an API call to create the new chat
    // For now, we'll just log the data
    setNewChatVisible(false);
  };

  

  return (
    <div className="h-screen bg-white chat-interface">
      <Layout className="h-full">
        {/* Sidebar */}
        <Sider
          width={320}
          collapsed={collapsed}
          onCollapse={setCollapsed}
          className="bg-white border-r border-gray-200 shadow-sm"
          theme="light"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-sm"></div>
                  </div>
                  <span className="font-semibold text-lg text-gray-900">Clini AI Medical System</span>
                </div>
                <Button 
                  type="text" 
                  icon={<ArrowLeftOutlined />} 
                  className="text-gray-500 hover:text-gray-700"
                />
              </div>
              
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                className="w-full bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600 font-medium"
                size="large"
                onClick={() => setNewChatVisible(true)}
              >
                New Profile ⌘N
              </Button>
            </div>

            {/* Navigation */}
            <div className="px-4 py-2">
              <div className="space-y-1">
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <SearchOutlined className="text-gray-500" />
                  <span className="text-gray-700">Search profiles</span>
                </div>
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <BookOutlined className="text-gray-500" />
                  <span className="text-gray-700">Knowledge Base</span>
                </div>
                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <FileTextOutlined className="text-gray-500" />
                  <span className="text-gray-700">Report templates</span>
                </div>
              </div>
            </div>
            


            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {mockFolders.map((folder) => (
                <div key={folder.id} className="mb-4">
                  {/* Folder Header */}
                  <div 
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleMenuClick({ key: folder.id })}
                  >
                    <div className={`transition-transform duration-200 ${expandedFolders.has(folder.id) ? 'rotate-90' : ''}`}>
                      <ArrowLeftOutlined className="text-xs text-gray-500" />
                    </div>
                    {expandedFolders.has(folder.id) ? (
                      <FolderOpenOutlined className="text-orange-500" />
                    ) : (
                      <FolderOutlined className="text-gray-500" />
                    )}
                    <Text className="text-sm font-medium text-gray-700 flex-1">
                      {folder.title}
                    </Text>
                    <Badge count={folder.chatSessions.length} size="small" className="bg-gray-300 text-gray-700" />
                  </div>
                  
                  {/* Chat Sessions */}
                  {expandedFolders.has(folder.id) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {folder.chatSessions.map((session) => (
                        <div 
                          key={session.id} 
                          className={`flex items-start space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                            selectedKey === session.id 
                              ? 'bg-orange-50 border border-orange-200' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleMenuClick({ key: session.id })}
                        >
                          <MessageOutlined className="text-xs text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <Text className={`text-sm line-clamp-2 ${
                              selectedKey === session.id ? 'text-orange-800 font-medium' : 'text-gray-700'
                            }`}>
                              {session.title}
                            </Text>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(session.updatedDate || session.createdDate || '')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Settings */}
            <div className="px-4 py-2 border-t border-gray-100">
              <div 
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => handleMenuClick({ key: 'settings' })}
              >
                <SettingOutlined className="text-gray-500" />
                <Text className="text-gray-700">Settings</Text>
              </div>
            </div>

            {/* User Profile */}
            <div className="px-4 py-3 border-t border-gray-100">
              {isLoggedIn() && user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar 
                      icon={<UserOutlined />} 
                      size="small" 
                      className="bg-orange-100 text-orange-600"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.fullname}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                  <Dropdown menu={{ items: getUserMenuItems(logout) }} trigger={['click']}>
                    <Button type="text" icon={<DownOutlined />} size="small" className="text-gray-500" />
                  </Dropdown>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar 
                      icon={<UserOutlined />} 
                      size="small" 
                      className="bg-gray-100 text-gray-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Guest User</div>
                      <div className="text-xs text-gray-400">Not signed in</div>
                    </div>
                  </div>
                  <Button 
                    type="primary" 
                    icon={<CiLogin />} 
                    size="small"
                    className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600"
                    onClick={() => router.push('/login')}
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </div>

          </div>
        </Sider>

        {/* Main Content */}
        <Layout>
          <Content className="bg-white">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center space-x-2">
                  <Dropdown menu={{ items: headerMenuItems }} trigger={['click']}>
                    <Button type="text" className="text-lg font-medium text-gray-900">
                      Clini AI <DownOutlined />
                    </Button>
                  </Dropdown>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Button type="text" icon={<FaRegQuestionCircle />} className="text-gray-500" />
                  <Button type="text" icon={<LinkOutlined />} className="text-gray-500" />
                  {isLoggedIn() && user ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Welcome, {user.fullname}</span>
                      <Button 
                        type="text" 
                        className="text-gray-500 hover:text-gray-700 "
                        onClick={logout}
                      >
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      type="primary" 
                      icon={<CiLogin />} 
                      className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600"
                      onClick={() => {
                        router.push('/login');
                      }}
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </div>

              {/* Upgrade Banner */}
                {/* <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
                  <div className="flex items-center space-x-2">
                    <StarFilled className="text-orange-500" />
                    <Text className="text-orange-800 font-medium">Upgrade free plan to full access</Text>
                  </div>
                </div> */}

              {/* Main Chat Area */}
              {selectedChatSession ? (
                <div className="flex-1 flex flex-col">
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    <div className="space-y-4">
                      {selectedChatSession.chatItems.map((chatItem: ChatItem) => (
                        <div key={chatItem.id} className={`w-full ${chatItem.isBot ? 'flex justify-start' : 'flex justify-end'}`}>
                          <div className={`max-w-xs lg:max-w-md ${chatItem.isBot ? 'mr-auto' : 'ml-auto'}`}>
                            <div className={`flex items-start space-x-2 ${chatItem.isBot ? 'flex-row' : 'flex-row-reverse space-x-reverse'}`}>
                              <Avatar 
                                size={32} 
                                icon={chatItem.isBot ? <MessageOutlined /> : <UserOutlined />}
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
                                        <img
                                          src={imageUrl}
                                          alt={`Chat image ${index + 1}`}
                                          className="rounded-lg max-w-full h-auto"
                                          style={{ maxHeight: '200px' }}
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
                      ))}
                    </div>
                  </div>

                  {/* Input Area */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="relative">

                      {/* <Input
                        placeholder="Ask me anything..."
                        value={inputValue}
                        onChange={handleInputChange}
                        onPressEnter={handleSendMessage}
                        className="h-12 pl-6 pr-32 rounded-xl border-gray-200 focus:border-orange-400 focus:shadow-lg chat-input"
                        size="large"
                      /> */}
                      
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                        <Button 
                          type="primary" 
                          icon={<StarFilled />}
                          className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600 rounded-lg"
                          size="small"
                        >
                          Send
                        </Button>
                        <Button type="text" icon={<PictureOutlined />} className="text-gray-500 hover:text-gray-700" size="small" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  {/* Logo */}
                  <div className="mb-8">
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <div className="w-12 h-12 bg-white rounded-lg"></div>
                    </div>
                    <Title level={2} className="text-center text-gray-900 mb-8">
                      Let's start a analysis with Clini AI
                    </Title>
                  </div>

                  {/* Input Area */}
                  <div className="w-full max-w-3xl mb-8">
                    <div className="relative">
                      <Input
                        placeholder="Ask Clini AI..."
                        value={inputValue}
                        onChange={handleInputChange}
                        onPressEnter={handleSendMessage}
                        className="h-14 text-lg pl-6 pr-32 rounded-2xl border-gray-200 focus:border-orange-400 focus:shadow-lg chat-input"
                        size="large"
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                        <Button 
                          type="primary" 
                          icon={<StarFilled />}
                          className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600 rounded-xl"
                        >
                          Search base knowledge
                        </Button>
                      </div>
                    </div>
                  </div>


                  {/* Suggested Actions */}
                  <div className="w-full max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {suggestedActions.map((action, index) => (
                        <Card
                          key={index}
                          hoverable
                          className={`border-2 ${action.color} transition-all duration-200`}
                          styles={{ body: { padding: '20px' } }}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className="text-3xl mb-3 text-gray-600">
                              {action.icon}
                            </div>
                            <Title level={4} className="mb-2 text-gray-900">
                              {action.title}
                            </Title>
                            <Text className="text-gray-600 text-sm">
                              {action.description}
                            </Text>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <Footer/>


            </div>
          </Content>
        </Layout>
      </Layout>
      
      <NewChatModal 
        visible={newChatVisible} 
        onClose={() => setNewChatVisible(false)}
        onCreateChat={handleCreateChat}
      />
      
      <SettingsModal 
        visible={settingsVisible} 
        onClose={() => setSettingsVisible(false)}
      />
      
      <SessionExpiredWrapper />
    </div>
  );
}
