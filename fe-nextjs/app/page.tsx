'use client';

import React, { useState, useEffect } from 'react';
import { Layout, Button, Input, Avatar, Dropdown, Menu, Card, Space, Typography, Badge, Divider, Spin } from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  SearchOutlined,
  MessageOutlined,
  BookOutlined,
  FileTextOutlined,
  SettingOutlined,
  LinkOutlined,
  BulbOutlined,
  StarOutlined,
  UserOutlined,
  DownOutlined,
  StarFilled,
  FolderOutlined,
  FolderOpenOutlined
} from '@ant-design/icons';
import { MenuProps } from 'antd';
import { formatDate } from '../lib/date';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { CiLogin } from "react-icons/ci";
import FolderModal from '../components/combination/folder-modal';
import PatientModal from '../components/combination/patient-modal';
import ChatSessionModal from '../components/combination/chat-session-modal';
import SettingsModal from '../components/combination/setting';
import SessionExpiredWrapper from '../components/combination/session-expired-wrapper';
import { useRouter } from 'next/navigation';
import useFolderManager from '../hooks/useFolderManager';
import useFolderChatSessions from '../hooks/useFolderChatSessions';
import useChatSessionManager from '../hooks/useChatSessionManager';
const { Sider, Content } = Layout;
const { Title, Text } = Typography;
import { FaRegQuestionCircle } from "react-icons/fa";
import Footer from '@/components/single/footer';
import { PageUrl } from '@/configs/page.url';


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
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedKey, setSelectedKey] = useState('');

  // Pipeline modal states
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [patientModalVisible, setPatientModalVisible] = useState(false);
  const [chatSessionModalVisible, setChatSessionModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Pipeline data
  const [folderData, setFolderData] = useState<{ id: string; title: string; description?: string } | null>(null);
  const [patientData, setPatientData] = useState<{ fullname: string; gender: string } | null>(null);
  const { t } = useLanguage();

  // Hooks for data management
  const {
    folders,
    getFoldersOfUser,
    isFetchingUserFolders,
    error: folderError
  } = useFolderManager();

  const {
    folderChatSessions,
    addChatSessionToFolder,
    getChatSessionsForFolder,
    clearAllChatSessions
  } = useFolderChatSessions();

  const {
    currentChatSession,
    getChatSession,
    isFetching: isFetchingChatSession
  } = useChatSessionManager();

  // Fetch folders when user is logged in
  useEffect(() => {
    const fetchFolders = async () => {
      if (isLoggedIn() && user) {
        try {
          // Clear any existing chat sessions to avoid ID conflicts
          clearAllChatSessions();
          await getFoldersOfUser();
        } catch (error) {
          console.error('Error fetching folders:', error);
        }
      }
    };

    fetchFolders();
  }, [isLoggedIn, user, getFoldersOfUser, clearAllChatSessions]);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleMenuClick = async ({ key }: { key: string }) => {
    if (key === 'settings') {
      setSettingsVisible(true);
      return;
    }

    if (key === 'logout') {
      clearAllChatSessions();
      logout();
      return;
    }

    const folder = folders.find(f => f.id === key);
    if (folder) {
      // Toggle folder expansion
      toggleFolder(key);
      setSelectedKey(key);
    } else {
      // Check if it's a chat session - look in all folders for the chat session
      console.log('Looking for chat session with key:', key);
      console.log('Current folderChatSessions:', folderChatSessions);
      console.log('Current folders:', folders);

      let chatSession = null;

      // First check local state
      chatSession = Object.values(folderChatSessions)
        .flat()
        .find(session => session.id === key);

      // If not found in local state, check backend data
      if (!chatSession) {
        for (const folder of folders) {
          const backendChatSessions = folder.chatSessionsInfo || [];
          chatSession = backendChatSessions.find(session => session.id === key);
          if (chatSession) break;
        }
      }

      if (chatSession) {
        // console.log('Chat session clicked:', chatSession);
        setSelectedKey(key);

        // Fetch the full chat session data
        try {
          // console.log('Fetching chat session:', chatSession.id);
          await getChatSession(chatSession.id);
        }
        catch (error) {
          console.error('Error fetching chat session:', error);
        }
      }
      else {
        console.log('No chat session found with key:', key);
      }
    }

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

  // Pipeline handlers
  const handleFolderCreated = (data: { id: string; title: string; description?: string }) => {
    setFolderData(data);
    setFolderModalVisible(false);
    setPatientModalVisible(true);
    // Refresh folders list
    getFoldersOfUser();
  };

  const handlePatientCreated = (data: { patientProfile: any }) => {
    console.log('Patient created successfully:', data);
    setPatientData({
      fullname: data.patientProfile.fullname,
      gender: data.patientProfile.gender
    });
    setPatientModalVisible(false);
    setChatSessionModalVisible(true);
    console.log('Chat session modal should now be visible');
  };

  const handleChatSessionCreated = (data: { chatSession: any; title: string; files: File[] }) => {
    console.log('Creating new chat session:', data);
    console.log('Folder data:', folderData);
    console.log('Patient data:', patientData);
    console.log('Created chat session:', data.chatSession);

    // Use the actual chat session from the API response
    if (folderData && data.chatSession) {
      const newChatSession = {
        id: data.chatSession.id, // Use the real ID from API
        title: data.chatSession.title,
        xrayImageUrl: data.chatSession.xrayImageUrl,
        isDeleted: data.chatSession.isDeleted || false,
        createdDate: data.chatSession.createdDate,
        updatedDate: data.chatSession.updatedDate,
        chatItems: data.chatSession.chatItems || [],
        reports: data.chatSession.reports || []
      };

      console.log('Adding chat session to folder:', newChatSession);
      console.log('Folder ID:', folderData.id);

      // Add the chat session to the folder
      addChatSessionToFolder(folderData.id, newChatSession);

      console.log('Chat session added to local state');
    }

    setChatSessionModalVisible(false);

    // Reset pipeline data
    setFolderData(null);
    setPatientData(null);
  };

  const handlePipelineCancel = () => {
    setFolderModalVisible(false);
    setPatientModalVisible(false);
    setChatSessionModalVisible(false);
    setFolderData(null);
    setPatientData(null);
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
                  <span className="font-semibold text-lg text-gray-900">Clini AI Medical</span>
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
                onClick={() => setFolderModalVisible(true)}
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



            {/* Folders List */}
            <div className="flex-1 overflow-y-auto px-4 py-2">
              {isFetchingUserFolders ? (
                <div className="flex justify-center items-center py-8">
                  <Spin size="large" />
                </div>
              ) : folders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FolderOutlined className="text-4xl mb-2" />
                  <div>No folders found</div>
                </div>
              ) : (
                folders.map((folder) => {
                  // Get chat sessions from both backend (chatSessionsInfo) and local state
                  const backendChatSessions = folder.chatSessionsInfo || [];
                  const localChatSessions = folderChatSessions[folder.id] || [];
                  // Combine both sources, avoiding duplicates
                  const allChatSessions = [...backendChatSessions, ...localChatSessions];
                  const uniqueChatSessions = allChatSessions.filter((session, index, self) =>
                    index === self.findIndex(s => s.id === session.id)
                  );

                  const totalChatSessions = uniqueChatSessions.length;

                  return (
                    <div key={folder.id} className="mb-4">
                      {/* Folder Header */}
                      <div
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${selectedKey === folder.id
                          ? 'bg-orange-50 border border-orange-200'
                          : ''
                          }`}
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
                        <Text className={`text-sm font-medium flex-1 ${selectedKey === folder.id ? 'text-orange-800' : 'text-gray-700'
                          }`}>
                          {folder.title}
                        </Text>
                        {totalChatSessions > 0 && (
                          <Badge count={totalChatSessions} size="small" className="bg-gray-300 text-gray-700" />
                        )}
                      </div>

                      {/* Folder Description */}
                      {expandedFolders.has(folder.id) && folder.description && (
                        <div className="ml-6 mt-1 px-3 py-2 text-xs text-gray-500">
                          {folder.description}
                        </div>
                      )}

                      {/* Chat Sessions */}
                      {expandedFolders.has(folder.id) && uniqueChatSessions.length > 0 && (
                        <div className="ml-6 mt-1 space-y-1">
                          {uniqueChatSessions.map((session) => (
                            <div
                              key={session.id}
                              className={`flex items-start space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedKey === session.id
                                ? 'bg-orange-50 border border-orange-200'
                                : 'hover:bg-gray-50'
                                }`}
                              onClick={() => handleMenuClick({ key: session.id })}
                            >
                              <MessageOutlined className="text-xs text-gray-400 mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <Text className={`text-sm line-clamp-2 ${selectedKey === session.id ? 'text-orange-800 font-medium' : 'text-gray-700'
                                  }`}>
                                  {session.title}
                                </Text>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatDate(
                                    session.updatedDate
                                      ? (typeof session.updatedDate === 'string' ? session.updatedDate : session.updatedDate.toISOString())
                                      : session.createdDate
                                        ? (typeof session.createdDate === 'string' ? session.createdDate : session.createdDate.toISOString())
                                        : ''
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
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
            <UserProfile 
              user={user} 
              isLoggedIn={isLoggedIn} 
              logout={logout} 
              router={router} 
            />

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
                        router.push(PageUrl.LOGIN_PAGE);
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

              {/* Main Content Area */}
              {selectedKey ? (
                // Check if selected item is a folder or chat session
                folders.find(f => f.id === selectedKey) ? (
                  // Display folder content
                  <div className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="text-center">
                      <FolderOpenOutlined className="text-6xl text-orange-500 mb-4" />
                      <Title level={2} className="text-gray-900 mb-2">
                        {folders.find(f => f.id === selectedKey)?.title || 'Selected Folder'}
                      </Title>
                      <Text className="text-gray-600 mb-4">
                        {folders.find(f => f.id === selectedKey)?.description || 'Folder details will be displayed here'}
                      </Text>
                      {folders.find(f => f.id === selectedKey)?.chatSessionIds &&
                        folders.find(f => f.id === selectedKey)!.chatSessionIds!.length > 0 && (
                          <Text className="text-sm text-gray-500">
                            {folders.find(f => f.id === selectedKey)!.chatSessionIds!.length} chat sessions available
                          </Text>
                        )}
                    </div>
                  </div>
                ) : (
                  
                  // Display chat session content
                  <div className="flex-1 flex flex-col p-8">
                    {isFetchingChatSession ? (
                      <div className="flex justify-center items-center h-full">
                        <Spin size="large" />
                      </div>
                    ) : currentChatSession ? (
                      <div className="max-w-4xl mx-auto">
                        {/* Chat Session Header */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Title level={3} className="text-gray-900 mb-0">
                              {currentChatSession.title}
                            </Title>
                            <Text className="text-sm text-gray-500">
                              {formatDate(currentChatSession.createdDate || '')}
                            </Text>
                          </div>
                          {currentChatSession.xrayImageUrl && (
                            <div className="mt-4">
                              <img
                                src={currentChatSession.xrayImageUrl}
                                alt="X-ray Image"
                                className="max-w-full h-auto rounded-lg shadow-sm"
                                style={{ maxHeight: '300px' }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Analysis Results */}
                        {currentChatSession.result && (
                          <div className="space-y-6">

                            {/* GradCAM Analyses */}
                            {currentChatSession.result.gradcam_analyses && (
                              <Card title="GradCAM Analysis" className="mb-4">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {Object.entries(currentChatSession.result.gradcam_analyses).map(([key, url]) => (
                                    <div key={key} className="text-center">
                                      <img
                                        src={url}
                                        alt={key}
                                        className="w-full h-32 object-cover rounded-lg shadow-sm"
                                      />
                                      <Text className="text-xs text-gray-600 mt-1 block">
                                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </Text>
                                    </div>
                                  ))}
                                </div>
                              </Card>
                            )}

                            {/* Disease Predictions */}
                            {currentChatSession.result.predicted_diseases && (
                              <Card title="Disease Predictions" className="mb-4">
                                <div className="space-y-2">
                                  {currentChatSession.result.predicted_diseases.map((disease, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                      <span className="font-medium">{disease.disease}</span>
                                      <span className="text-orange-600 font-bold">
                                        {(disease.confidence * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </Card>
                            )}

                            

                            {/* Concise Conclusion */}
                            {currentChatSession.result.concise_conclusion && (
                              <Card title="Concise Conclusion" className="mb-4">
                                <Text className="text-gray-700">
                                  {currentChatSession.result.concise_conclusion}
                                </Text>
                              </Card>
                            )}

                            {/* Comprehensive Analysis */}
                            {currentChatSession.result.comprehensive_analysis && (
                              <Card title="Comprehensive Analysis" className="mb-4">
                                <Text className="text-gray-700 whitespace-pre-wrap">
                                  {currentChatSession.result.comprehensive_analysis}
                                </Text>
                              </Card>
                            )}

                            
                          </div>
                        )}

                        {/* Chat Items */}
                        {currentChatSession.chatItems && currentChatSession.chatItems.length > 0 && (
                          <Card title="Chat History" className="mt-6">
                            <div className="space-y-4">
                              {currentChatSession.chatItems.map((item, index) => (
                                <div
                                  key={index}
                                  className={`p-3 rounded-lg ${item.isBot ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'
                                    }`}
                                >
                                  <Text className="text-gray-700">{item.content}</Text>
                                  {item.imageUrls && item.imageUrls.length > 0 && (
                                    <div className="mt-2 space-y-2">
                                      {item.imageUrls.map((url, imgIndex) => (
                                        <img
                                          key={imgIndex}
                                          src={url}
                                          alt={`Chat image ${imgIndex + 1}`}
                                          className="max-w-full h-auto rounded"
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <MessageOutlined className="text-6xl text-gray-400 mb-4" />
                        <Title level={3} className="text-gray-500 mb-2">
                          Chat Session Not Found
                        </Title>
                        <Text className="text-gray-400">
                          The selected chat session could not be loaded.
                        </Text>
                      </div>
                    )}
                  </div>
                )
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
                  <SuggestedActions />

                </div>
              )}

              {/* Footer */}
              <Footer />


            </div>
          </Content>
        </Layout>
      </Layout>

      {/* Pipeline Modals */}
      <FolderModal
        visible={folderModalVisible}
        onClose={handlePipelineCancel}
        onFolderCreated={handleFolderCreated}
      />

      {folderData && (
        <PatientModal
          visible={patientModalVisible}
          onClose={handlePipelineCancel}
          onComplete={handlePatientCreated}
          folderData={folderData}
        />
      )}

      {folderData && patientData && (
        <ChatSessionModal
          visible={chatSessionModalVisible}
          onClose={handlePipelineCancel}
          onComplete={handleChatSessionCreated}
          folderData={folderData}
          patientData={patientData}
          onRefreshFolders={getFoldersOfUser}
        />
      )}

      <SettingsModal
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />

      <SessionExpiredWrapper />
    </div>
  );
}


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


function SuggestedActions() {
  return (
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
  )
}


function UserProfile({ user, isLoggedIn, logout, router }: { user: any; isLoggedIn: any; logout: any; router: any }) {
  return (
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
  )

}