'use client';

import React, { useState } from 'react';
import { 
  Layout, 
  Menu, 
  Avatar, 
  Divider,
} from 'antd';
import {
  EditOutlined,
  SearchOutlined,
  MoreOutlined,
} from '@ant-design/icons';
const { Sider } = Layout;
import { FaRegFolderOpen, FaFolderPlus } from "react-icons/fa6";
import { MenuItem } from '../../types/folder';
import { mockFolders } from '../../mocks/folderData';
import { GoGear } from "react-icons/go";
import { useLanguage } from '../../contexts/LanguageContext';
import SettingsModal from './setting';
import NewChatModal from './newchat';
import { FaEllipsisH } from "react-icons/fa";


interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  onItemSelect?: (item: any) => void;
}


const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onCollapse, onItemSelect }) => {
  const { t } = useLanguage();
  const [selectedKey, setSelectedKey] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [newChatVisible, setNewChatVisible] = useState(false);

  const generalActions = [
    {
      key: 'new-chat',
      icon: <EditOutlined />,
      label: t('sidebar.newChat'),
    },
    {
      key: 'search',
      icon: <SearchOutlined />,
      label: t('sidebar.searchChats'),
    },
    {
      key: 'settings',
      icon: <GoGear />,
      label: t('sidebar.setting'),
    }
  ];

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } 
    else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const buildMenuItems = (): MenuItem[] => {
    const items: MenuItem[] = [
      // {
      //   key: 'new-project',
      //   icon: <FaFolderPlus />,
      //   label: t('sidebar.newProject'),
      //   isNew: true,
      // }
    ];

    mockFolders.forEach(folder => {
      const isExpanded = expandedFolders.has(folder.id);
      // Add folder
      items.push({
        key: folder.id,
        icon: <FaRegFolderOpen />,
        label: `${folder.title}`,
        isFolder: true,
        isExpanded,
        itemCount: folder.chatSessions.length,
      });

      // Add items if folder is expanded
      if (isExpanded) {
        folder.chatSessions.forEach(item => {
          items.push({
            key: item.id,
            label: item.title,
            isSubItem: true,
            parentFolder: folder.id,
          });
        });
      }
    });

    items.push({
      key: 'see-more',
      icon: <FaEllipsisH />,
      label: t('sidebar.seeMore'),
      isNew: false,
    });

    return items;
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === 'settings') {
      setSettingsVisible(true);
      return;
    }
    
    if (key === 'new-chat') {
      setNewChatVisible(true);
      return;
    }
    
    const folder = mockFolders.find(f => f.id === key);
    if (folder) {
      toggleFolder(key);
    } 
    else {
      setSelectedKey(key);
      // Find the chat session item and pass it to parent
      const chatSession = mockFolders
        .flatMap(f => f.chatSessions)
        .find(session => session.id === key);
      
      if (chatSession && onItemSelect) {
        onItemSelect(chatSession);
      }
    }
  };

  const handleCreateChat = (data: { title: string; files: File[] }) => {
    console.log('Creating new chat:', data);
    // Here you would typically make an API call to create the new chat
    // For now, we'll just log the data
    setNewChatVisible(false);
  };

  return (
    <>
      <Sider
        width={280}
        collapsed={collapsed}
        onCollapse={onCollapse}
        className="bg-white border-r border-gray-200 h-screen overflow-hidden"
      >
        <div className="p-4 h-full flex flex-col">

          <div className="mb-1">
              <div className="text-center text-gray-800 font-bold text-lg">
                {t('app.title')}
              </div>
          </div>

          <Divider/>

          {/* General Actions */}
          <div className="">
            <Menu
              mode="vertical"
              selectedKeys={[]}
              className="bg-transparent border-none"
            items={generalActions.map(item => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
              className: "h-10 leading-10 mb-1 rounded-md text-gray-600 text-sm hover-main-color",
            }))}
              onClick={handleMenuClick}
            />
          </div>

          <Divider/>

          {/* Projects Section */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <Menu
              mode="vertical"
              selectedKeys={[selectedKey]}
              className="bg-transparent border-none"
              items={buildMenuItems().map(item => ({
                key: item.key,
                icon: item.icon,
                label: item.label,
              className: `
                ${item.isSubItem ? 'h-8 leading-8' : 'h-10 leading-10'} 
                mb-0.5 rounded-md 
                ${selectedKey === item.key ? 'font-medium' : 'text-gray-600'} 
                ${item.isSubItem ? 'text-sm' : 'text-lg'} 
                hover-main-color
                ${item.isSubItem ? 'pl-16' : 'pl-3'}
                ${item.isFolder ? 'font-medium' : ''}
                ${item.isNew ? 'hover:text-blue-600' : ''}
              `,
              style: {
                ...(selectedKey === item.key ? { 
                  color: 'var(--main-color)', 
                  backgroundColor: 'rgba(0, 105, 209, 0.1)' 
                } : item.isNew ? { color: 'var(--main-color)' } : {}),
                ...(item.isSubItem ? { paddingLeft: '32px' } : { paddingLeft: '12px' })
              },
              }))}
              onClick={handleMenuClick}
            />
          </div>

        {/* User Account Section */}
        <div className="mt-auto pt-4 px-2 pb-2 border-t border-gray-200">
          <div className="flex items-center p-2 rounded-md bg-gray-50">
            <Avatar 
              size={32} 
              className="bg-green-500 mr-3"
            >
              A
            </Avatar>
            {!collapsed && (
              <div>
                <div className=" ml-2 text-sm font-bold text-gray-800">
                  {t('user.name')}
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </Sider>
      
      <SettingsModal 
        visible={settingsVisible} 
        onClose={() => setSettingsVisible(false)} 
      />
      
      <NewChatModal 
        visible={newChatVisible} 
        onClose={() => setNewChatVisible(false)}
        onCreateChat={handleCreateChat}
      />
    </>
  );
};

export default Sidebar;
