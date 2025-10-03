'use client';

import React from 'react';
import { 
  Layout, 
  Menu, 
  Avatar, 
  Divider,
} from 'antd';
import {
  TeamOutlined,
  SettingOutlined,
  DashboardOutlined,
  FileTextOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  SecurityScanOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

const { Sider } = Layout;

interface SystemSidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
  selectedKey?: string;
  onMenuSelect?: (key: string) => void;
}

const SystemSidebar: React.FC<SystemSidebarProps> = ({ 
  collapsed = false, 
  onCollapse, 
  selectedKey = 'dashboard',
  onMenuSelect 
}) => {
  const router = useRouter();
  const { user, logout } = useAuth();

  const systemMenuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'users',
      icon: <TeamOutlined />,
      label: 'User Management',
    },
    {
      key: 'reports',
      icon: <FileTextOutlined />,
      label: 'Reports',
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
    },
    {
      key: 'audit-logs',
      icon: <AuditOutlined />,
      label: 'Audit Logs',
    },
    {
      key: 'system-settings',
      icon: <SettingOutlined />,
      label: 'System Settings',
    },
    {
      key: 'database',
      icon: <DatabaseOutlined />,
      label: 'Database Management',
    },
    {
      key: 'security',
      icon: <SecurityScanOutlined />,
      label: 'Security',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (onMenuSelect) {
      onMenuSelect(key);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <Sider
      width={280}
      collapsed={collapsed}
      onCollapse={onCollapse}
      className="bg-white border-r border-gray-200 h-screen overflow-hidden"
    >
      <div className="p-4 h-full flex flex-col">

        <div className="mb-1">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            {!collapsed && (
              <span className="font-semibold text-lg text-gray-900">System Panel</span>
            )}
          </div>
        </div>

        <Divider/>

        {/* System Menu Section */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <Menu
            mode="vertical"
            selectedKeys={[selectedKey]}
            className="bg-transparent border-none"
            items={systemMenuItems.map(item => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
              className: `
                h-10 leading-10 
                mb-0.5 rounded-md 
                ${selectedKey === item.key ? 'font-medium' : 'text-gray-600'} 
                text-lg 
                hover-main-color
                pl-3
              `,
              style: {
                ...(selectedKey === item.key ? { 
                  color: 'var(--main-color)', 
                  backgroundColor: 'rgba(0, 105, 209, 0.1)' 
                } : {}),
                paddingLeft: '12px'
              },
            }))}
            onClick={handleMenuClick}
          />
        </div>

        {/* User Account Section */}
        <div className="mt-auto pt-4 px-2 pb-2 border-t border-gray-200">
          <button 
            className="flex items-center p-2 rounded-md bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors w-full text-left"
            onClick={handleLogout}
          >
            <Avatar 
              size={32} 
              className="bg-green-500 mr-3"
            >
              {user?.fullname?.charAt(0) || 'A'}
            </Avatar>
            {!collapsed && (
              <div>
                <div className="ml-2 text-sm font-bold text-gray-800">
                  {user?.fullname || 'System User'}
                </div>
                <div className="ml-2 text-xs text-gray-500">
                  {user?.email || 'system@example.com'}
                </div>
              </div>
            )}
          </button>
        </div>
      </div>
    </Sider>
  );
};

export default SystemSidebar;
