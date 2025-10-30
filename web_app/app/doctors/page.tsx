"use client";

import React, { useState, useEffect } from 'react';
import { Layout, Button, Dropdown, Card, Typography, Badge, Spin } from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  MessageOutlined,
  FileTextOutlined,
  SettingOutlined,
  LinkOutlined,
  DownOutlined,
  FolderOutlined,
  FolderOpenOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { MenuProps } from 'antd';
import { formatDate } from '@/lib/date';
import { useAuth } from '@/contexts/AuthContext';
import { CiLogin } from "react-icons/ci";
import FolderModal from '@/components/combination/folder-modal';
import PatientModal from '@/components/combination/patient-modal';
import ChatSessionModal from '@/components/combination/chat-session-modal';
import SettingsModal from '@/components/combination/setting';
import SessionExpiredWrapper from '@/components/combination/session-expired-wrapper';
import { useRouter } from 'next/navigation';
import useFolderManager from '@/hooks/useFolderManager';
import useFolderChatSessions from '@/hooks/useFolderChatSessions';
import useChatSessionManager from '@/hooks/useChatSessionManager';
import useChatbot from '@/hooks/useChatbot';
import useTextChat from '@/hooks/useTextChat';
import usePatientProfileManager from '@/hooks/usePatientProfileManager';
import TextChatbox from '@/components/combination/text-chatbox';
import StartSection from '@/components/combination/start-section';
import UserProfile from '@/components/combination/user-profile';
import RenameModal from '@/components/combination/rename-modal';
import DeleteConfirmModal from '@/components/combination/delete-confirm-modal';
import { Type } from '@/types/folder';
import { ChatItem, Report } from '@/types/chatsession';
import { FaRegQuestionCircle } from "react-icons/fa";
import Footer from '@/components/single/footer';
import { PageUrl } from '@/configs/page.url';
import { toast } from 'sonner';
const { Sider, Content } = Layout;
const { Title, Text } = Typography;

const headerMenuItems: MenuProps['items'] = [
  {
    key: 'v1',
    label: 'Clini AI',
    icon: <DownOutlined />,
  },
];

export default function Page() {
  const router = useRouter();
  const { user, isLoggedIn, logout, isLoggingOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [chatInputValue, setChatInputValue] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedKey, setSelectedKey] = useState('new-chat');
  const [showAllDiseases, setShowAllDiseases] = useState(false);

  // Pipeline modal states
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [patientModalVisible, setPatientModalVisible] = useState(false);
  const [chatSessionModalVisible, setChatSessionModalVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [selectedFolderForEdit, setSelectedFolderForEdit] = useState<{ id: string; title: string; description?: string } | null>(null);
  const [editingType, setEditingType] = useState<'folder' | 'chatSession'>('folder');
  const [isLoadingPatient, setIsLoadingPatient] = useState(false);

  // Pipeline data
  const [folderData, setFolderData] = useState<{ id: string; title: string; description?: string; type?: Type } | null>(null);
  const [patientData, setPatientData] = useState<{ fullname: string; gender: string } | null>(null);

  // Hooks for data management
  const {
    folders,
    getFoldersOfUser,
    isFetchingUserFolders,
    error: folderError,
    renameFolder,
    deleteFolder,
    isRenaming,
    isDeleting
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
    isFetching: isFetchingChatSession,
    renameChatSession,
    deleteChatSession,
    isRenaming: isRenamingChatSession,
    isDeleting: isDeletingChatSession,
    setCurrentChatSession
  } = useChatSessionManager();

  const {
    sendMessage: sendChatMessage,
    isSending: isSendingMessage,
    error: chatbotError,
    clearError: clearChatbotError
  } = useChatbot();

  const {
    chatItems: textChatItems,
    isSending: isSendingTextMessage,
    error: textChatError,
    sendMessage: sendTextMessage,
    clearError: clearTextChatError
  } = useTextChat(async (sessionId) => {
    // Refresh folders to show the new folde in sidebar
    await getFoldersOfUser();
    
    // Set the selected key to navigate to the new session
    setSelectedKey(sessionId);
    
    // Load the chat session data
    try {
      await getChatSession(sessionId);
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  });
  
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

    if (key === 'new-chat') {
      // Show the main content area for new chat
      setSelectedKey('new-chat');
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
        setSelectedKey(key);
        // Fetch the full chat session data
        try {
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

  const handleSendChatMessage = async (message?: string) => {
    const messageToSend = message || chatInputValue;
    if (messageToSend.trim() && currentChatSession) {
      try {
        const response = await sendChatMessage(currentChatSession.id, {
          message: messageToSend,
          action: currentChatSession.chatItems && currentChatSession.chatItems.length > 0 ? 'continue_chat' : 'start_chat'
        });

        if (response) {
          setChatInputValue('');
          const updatedChatItems = [
            ...(currentChatSession.chatItems || []),
            response.userChatItem,
            response.botChatItem
          ];
          const updatedChatSession = {
            ...currentChatSession,
            chatItems: updatedChatItems,
            updatedDate: new Date().toISOString()
          };
          setCurrentChatSession(updatedChatSession);
        }
      } catch (error) {
        console.error('Error sending chat message:', error);
      }
    }
  };

  const {
    getPatientProfile,
    isFetching: isFetchingPatient
  } = usePatientProfileManager();

  const handleFolderCreated = (data: { id: string; title: string; description?: string; type?: Type }) => {
    setFolderData(data);
    setFolderModalVisible(false);
    setPatientModalVisible(true);
    getFoldersOfUser();
  };

  const handlePatientCreated = (data: { patientProfile: { fullname: string; gender: string } }) => {
    setPatientData({
      fullname: data.patientProfile.fullname,
      gender: data.patientProfile.gender
    });
    setPatientModalVisible(false);
    setChatSessionModalVisible(true);
  };

  const handleChatSessionCreated = (data: { chatSession: { id: string; title: string; xrayImageUrl?: string; isDeleted?: boolean; createdDate?: string; updatedDate?: string; chatItems?: ChatItem[]; reports?: Report[] }; title: string; files: File[] }) => {
    if (folderData && data.chatSession) {
      const newChatSession = {
        id: data.chatSession.id,
        title: data.chatSession.title,
        xrayImageUrl: data.chatSession.xrayImageUrl,
        isDeleted: data.chatSession.isDeleted || false,
        createdDate: data.chatSession.createdDate,
        updatedDate: data.chatSession.updatedDate,
        chatItems: (data.chatSession.chatItems || []) as ChatItem[],
        reports: (data.chatSession.reports || []) as Report[]
      };
      addChatSessionToFolder(folderData.id, newChatSession);
    }
    setChatSessionModalVisible(false);
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

  const handleFolderRename = (folder: { id: string; title: string; description?: string }) => {
    setSelectedFolderForEdit(folder);
    setEditingType('folder');
    setRenameModalVisible(true);
  };

  const handleFolderDelete = (folder: { id: string; title: string; description?: string }) => {
    setSelectedFolderForEdit(folder);
    setEditingType('folder');
    setDeleteConfirmVisible(true);
  };

  const handleRenameSubmit = async (newTitle: string, newDescription?: string) => {
    if (editingType === 'folder') {
      if (selectedFolderForEdit?.id) {
        const success = await renameFolder(selectedFolderForEdit.id, {
          title: newTitle,
          description: newDescription
        });
      }
    } else {
      if (selectedFolderForEdit?.id) {
        const success = await renameChatSession(selectedFolderForEdit.id, {
          title: newTitle
        });
        getFoldersOfUser();
      }
    }
    setRenameModalVisible(false);
    setSelectedFolderForEdit(null);
  };

  const handleDeleteConfirm = async () => {
    if (editingType === 'folder') {
      if (selectedFolderForEdit?.id) {
        const success = await deleteFolder(selectedFolderForEdit.id);
      }
    } else {
      if (selectedFolderForEdit?.id) {
        const success = await deleteChatSession(selectedFolderForEdit.id);
        getFoldersOfUser();
      }
    }
    setDeleteConfirmVisible(false);
    setSelectedFolderForEdit(null);
  };

  const handleRenameCancel = () => {
    setRenameModalVisible(false);
    setSelectedFolderForEdit(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmVisible(false);
    setSelectedFolderForEdit(null);
  };

  const handleChatSessionRename = (session: { id: string; title: string }) => {
    setSelectedFolderForEdit(session);
    setEditingType('chatSession');
    setRenameModalVisible(true);
  };

  const handleChatSessionDelete = (session: { id: string; title: string }) => {
    setSelectedFolderForEdit(session);
    setEditingType('chatSession');
    setDeleteConfirmVisible(true);
  };

  const handleNewAnalysis = async (folder: { id: string; title: string; description?: string; type?: Type; patientProfileId?: string | null }) => {
    setPatientModalVisible(false);
    setChatSessionModalVisible(false);
    if (!folder.patientProfileId) {
      toast.warning('No patient profile found. Please create a patient profile first.');
      setFolderData({ id: folder.id, title: folder.title, description: folder.description, type: folder.type });
      setPatientData(null);
      setPatientModalVisible(true);
      return;
    }
    setIsLoadingPatient(true);
    try {
      const patientProfile = await getPatientProfile(folder.patientProfileId);
      if (patientProfile) {
        const newFolderData = { id: folder.id, title: folder.title, description: folder.description, type: folder.type };
        const newPatientData = { fullname: patientProfile.fullname, gender: patientProfile.gender };
        setFolderData(newFolderData);
        setPatientData(newPatientData);
        setIsLoadingPatient(false);
        toast.success('Patient information loaded successfully!');
        setTimeout(() => setChatSessionModalVisible(true), 50);
      } else {
        setIsLoadingPatient(false);
        toast.error('Failed to load patient information');
        setFolderData({ id: folder.id, title: folder.title, description: folder.description, type: folder.type });
        setPatientData(null);
        setPatientModalVisible(true);
      }
    } catch (error) {
      setIsLoadingPatient(false);
      toast.error('Error loading patient information');
      setFolderData({ id: folder.id, title: folder.title, description: folder.description, type: folder.type });
      setPatientData(null);
      setPatientModalVisible(true);
    }
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
                <div
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${selectedKey === 'new-chat'
                    ? 'bg-orange-50 border border-orange-200'
                    : ''
                    }`}
                  onClick={() => handleMenuClick({ key: 'new-chat' })}
                >
                  <MessageOutlined className="text-gray-500" />
                  <span className={`text-sm font-medium ${selectedKey === 'new-chat' ? 'text-orange-800' : 'text-gray-700'}`}>
                    New chat
                  </span>
                </div>

                <div className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50">
                  <FileTextOutlined className="text-gray-500" />
                  <span className="text-gray-700">
                    Report templates{' '}
                    <span className="text-gray-400 text-xs">(Coming Soon)</span>
                  </span>
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
                  const backendChatSessions = folder.chatSessionsInfo || [];
                  const localChatSessions = folderChatSessions[folder.id] || [];
                  const allChatSessions = [...backendChatSessions, ...localChatSessions];
                  const uniqueChatSessions = allChatSessions.filter((session, index, self) =>
                    index === self.findIndex(s => s.id === session.id)
                  );

                  const totalChatSessions = uniqueChatSessions.length;

                  return (
                    <div key={folder.id} className="mb-4">
                      {/* Folder Header */}
                      <div
                        className={`group flex items-center space-x-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${selectedKey === folder.id
                          ? 'bg-orange-50 border border-orange-200'
                          : ''
                          }`}
                        onClick={() => handleMenuClick({ key: folder.id })}
                      >
                        <div className={`transition-transform duration-200 ${expandedFolders.has(folder.id) ? 'rotate-90' : ''}`}>
                          <ArrowLeftOutlined className="text-xs text-gray-500" />
                        </div>
                        {expandedFolders.has(folder.id) ? (
                          folder.type === Type.TEXT ? (
                            <MessageOutlined className="text-blue-500" />
                          ) : (
                            <FolderOpenOutlined className="text-orange-500" />
                          )
                        ) : (
                          folder.type === Type.TEXT ? (
                            <MessageOutlined className="text-gray-500" />
                          ) : (
                            <FolderOutlined className="text-gray-500" />
                          )
                        )}
                        <Text className={`text-sm font-medium flex-1 ${selectedKey === folder.id ? 'text-orange-800' : 'text-gray-700'
                          }`}>
                          {folder.title}
                        </Text>
                        <div className="flex items-center space-x-1">
                          {totalChatSessions > 0 && (
                            <Badge count={totalChatSessions} size="small" className="bg-gray-300 text-gray-700" />
                          )}
                          <Dropdown
                            menu={{
                              items: [
                                ...(folder.type === Type.ANALYZE ? [{
                                  key: 'new-analysis',
                                  label: 'New analysis',
                                  icon: <PlusOutlined />,
                                  onClick: () => {
                                    handleNewAnalysis(folder);
                                  }
                                }] : []),
                                {
                                  key: 'rename',
                                  label: 'Rename',
                                  icon: <EditOutlined />,
                                  onClick: (e) => {
                                    e.domEvent.stopPropagation();
                                    handleFolderRename(folder);
                                  }
                                },
                                {
                                  key: 'delete',
                                  label: 'Delete',
                                  icon: <DeleteOutlined />,
                                  danger: true,
                                  onClick: (e) => {
                                    e.domEvent.stopPropagation();
                                    handleFolderDelete(folder);
                                  }
                                }
                              ]
                            }}
                            trigger={['click']}
                            placement="bottomRight"
                          >
                            <Button
                              type="text"
                              size="small"
                              icon={<MoreOutlined />}
                              className="duration-200 hover:bg-gray-100"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Dropdown>
                        </div>
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
                              className={`group flex items-start space-x-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedKey === session.id
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
                              <div className="flex items-center mt-1">
                                <Dropdown
                                  menu={{
                                    items: [
                                      {
                                        key: 'rename',
                                        label: 'Rename',
                                        icon: <EditOutlined />,
                                        onClick: (e) => {
                                          e.domEvent.stopPropagation();
                                          handleChatSessionRename(session);
                                        }
                                      },
                                      {
                                        key: 'delete',
                                        label: 'Delete',
                                        icon: <DeleteOutlined />,
                                        danger: true,
                                        onClick: (e) => {
                                          e.domEvent.stopPropagation();
                                          handleChatSessionDelete(session);
                                        }
                                      }
                                    ]
                                  }}
                                  trigger={['click']}
                                  placement="bottomRight"
                                >
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<MoreOutlined />}
                                    className=""
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </Dropdown>
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
              isLoggingOut={isLoggingOut}
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
                        className="text-gray-500 hover:text-gray-700"
                        onClick={logout}
                        loading={isLoggingOut}
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? 'Logging out...' : 'Logout'}
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

              {/* Main Content Area - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                {selectedKey ? (
                  selectedKey === 'new-chat' ? (
                    <StartSection 
                      onSendMessage={async (message) => {
                        try {
                          await sendTextMessage(message);
                        } catch (error) {
                          console.error('Error sending text message:', error);
                        }
                      }}
                      isSending={isSendingTextMessage}
                    />
                  ) : folders.find(f => f.id === selectedKey) ? (
                    (() => {
                      const selectedFolder = folders.find(f => f.id === selectedKey);
                      
                      if (selectedFolder?.type === Type.TEXT) {
                        return (
                          <div className="h-full flex flex-col">
                            <div className="h-full flex flex-col">
                              <TextChatbox
                                chatItems={textChatItems}
                                isSending={isSendingTextMessage}
                                error={textChatError}
                                onSendMessage={sendTextMessage}
                                onClearError={clearTextChatError}
                                fullHeight={true}
                                showInput={false}
                              />
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex flex-col items-center justify-center p-8 h-full">
                            <div className="text-center"></div>
                          </div>
                        );
                      }
                    })()
                  ) : (
                    <div className="p-6">
                      {isFetchingChatSession ? (
                        <div className="flex justify-center items-center h-full">
                          <Spin size="large" />
                        </div>
                      ) : currentChatSession ? (
                        <div className="mx-auto">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            {currentChatSession.xrayImageUrl && (
                              <div className="mt-2">
                                <img
                                  src={currentChatSession.xrayImageUrl}
                                  alt="X-ray Image"
                                  className="max-w-full h-auto rounded-lg shadow-sm"
                                  style={{ maxHeight: '300px' }}
                                />
                              </div>
                            )}
                          </div>

                          {(() => {
                            const parentFolder = folders.find(folder => 
                              folder.chatSessionIds?.includes(currentChatSession.id) ||
                              folder.chatSessionsInfo?.some(session => session.id === currentChatSession.id)
                            );
                            const isTextChat = parentFolder?.type === Type.TEXT || 
                                              parentFolder?.title?.toLowerCase().includes('text chat') ||
                                              currentChatSession.title?.toLowerCase().includes('text chat');
                            if (isTextChat) {
                              return (
                                <div className="">
                                  <div className="mx-auto">
                                    <TextChatbox
                                      chatItems={(currentChatSession.chatItems || []).map((item: { id?: string; content: string; isBot?: boolean; createdDate?: string; metaData?: { pubmedQueryUrl?: string; pubmedFetchUrl?: string[] } }, index: number) => ({
                                        id: item.id || `item-${index}`,
                                        content: item.content,
                                        isBot: item.isBot ?? false,
                                        timestamp: item.createdDate ? new Date(item.createdDate) : new Date(),
                                        metaData: item.metaData
                                      }))}
                                      isSending={isSendingMessage}
                                      error={chatbotError}
                                      onSendMessage={(message) => handleSendChatMessage(message)}
                                      onClearError={clearChatbotError}
                                      fullHeight={true}
                                    />
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                  <div className="sticky top-6">
                                    <Title level={4} className="text-gray-900 mb-4 flex items-center">
                                      <FileTextOutlined className="mr-2 text-orange-500" />
                                      Analysis Results
                                    </Title>

                                    {currentChatSession.result && (
                                      <div className="space-y-4">
                                        {currentChatSession.result.gradcam_analyses && (
                                          <Card title="GradCAM Analysis" size="small">
                                            <div className="grid grid-cols-2 gap-2">
                                              {Object.entries(currentChatSession.result.gradcam_analyses).map(([key, url]) => (
                                                <div key={key} className="text-center">
                                                  <img
                                                    src={url}
                                                    alt={key}
                                                    className="w-full h-24 object-cover rounded shadow-sm"
                                                  />
                                                  <Text className="text-xs text-gray-600 mt-1 block">
                                                    {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                  </Text>
                                                </div>
                                              ))}
                                            </div>
                                          </Card>
                                        )}

                                        {currentChatSession.result.predicted_diseases && (
                                          <Card title="Disease Predictions" size="small">
                                            <div className="space-y-2">
                                              {(showAllDiseases
                                                ? currentChatSession.result.predicted_diseases
                                                : currentChatSession.result.predicted_diseases.slice(0, 5)
                                              ).map((disease, index) => (
                                                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                                                  <span className="font-medium">{disease.disease}</span>
                                                  <span className="text-orange-600 font-bold">
                                                    {(disease.confidence * 100).toFixed(1)}%
                                                  </span>
                                                </div>
                                              ))}
                                              {currentChatSession.result.predicted_diseases.length > 5 && (
                                                <div className="flex justify-center mt-2">
                                                  <Button
                                                    type="link"
                                                    size="small"
                                                    onClick={() => setShowAllDiseases(!showAllDiseases)}
                                                    className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                                                  >
                                                    {showAllDiseases ? 'Show Less' : `Show More (${currentChatSession.result.predicted_diseases.length - 5} more)`}
                                                  </Button>
                                                </div>
                                              )}
                                            </div>
                                          </Card>
                                        )}

                                        {currentChatSession.result.concise_conclusion && (
                                          <Card title="Concise Conclusion" size="small">
                                            <Text className="text-gray-700 text-sm">
                                              {currentChatSession.result.concise_conclusion}
                                            </Text>
                                          </Card>
                                        )}

                                        {currentChatSession.result.comprehensive_analysis && (
                                          <Card title="Comprehensive Analysis" size="small">
                                            <Text className="text-gray-700 whitespace-pre-wrap text-sm">
                                              {currentChatSession.result.comprehensive_analysis}
                                            </Text>
                                          </Card>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-6">
                                  <Title level={4} className="text-gray-900 mb-4 flex items-center">
                                    <MessageOutlined className="mr-2 text-orange-500" />
                                    Chat with Clini AI
                                  </Title>

                                  {(() => {
                                    const transformedItems = (currentChatSession.chatItems || []).map((item: { id?: string; content: string; isBot?: boolean; createdDate?: string; metaData?: { pubmedQueryUrl?: string; pubmedFetchUrl?: string[] } }, index: number) => ({
                                      id: item.id || `item-${index}`,
                                      content: item.content,
                                      isBot: item.isBot ?? false,
                                      timestamp: item.createdDate ? new Date(item.createdDate) : new Date(),
                                      metaData: item.metaData
                                    }));
                                    return (
                                      <TextChatbox
                                        chatItems={transformedItems}
                                        isSending={isSendingMessage}
                                        error={chatbotError}
                                        onSendMessage={(message) => handleSendChatMessage(message)}
                                        onClearError={clearChatbotError}
                                        placeholder="Ask about the X-ray analysis..."
                                        helperText="Ask questions about the analysis, request recommendations, or get medical insights."
                                        fullHeight={true}
                                      />
                                    );
                                  })()}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
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
                    <div className="text-center">
                      <MessageOutlined className="text-6xl text-gray-400 mb-4" />
                      <Title level={3} className="text-gray-500 mb-2">
                        Welcome to Clini AI
                      </Title>
                      <Text className="text-gray-400">
                        Select &quot;New chat&quot; from the sidebar to get started
                      </Text>
                    </div>
                  </div>
                )}
              </div>

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

      {folderData && patientModalVisible && (
        <PatientModal
          visible={patientModalVisible}
          onClose={handlePipelineCancel}
          onComplete={handlePatientCreated}
          folderData={folderData}
        />
      )}

      {folderData && patientData && chatSessionModalVisible && (
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

      {/* Rename Modal */}
      <RenameModal
        visible={renameModalVisible}
        editingType={editingType}
        selectedItem={selectedFolderForEdit}
        isRenaming={isRenaming}
        isRenamingChatSession={isRenamingChatSession}
        onCancel={handleRenameCancel}
        onSubmit={handleRenameSubmit}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={deleteConfirmVisible}
        editingType={editingType}
        selectedItem={selectedFolderForEdit}
        isDeleting={isDeleting}
        isDeletingChatSession={isDeletingChatSession}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />

      <SessionExpiredWrapper />

      {isLoadingPatient && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <Spin size="large" />
        </div>
      )}
    </div>
  );
}

