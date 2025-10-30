'use client';

import React from 'react';
import { Avatar, Button, Dropdown, Spin } from 'antd';
import { UserOutlined, DownOutlined, SettingOutlined } from '@ant-design/icons';
import { CiLogin } from "react-icons/ci";
import { MenuProps } from 'antd';

interface UserProfileProps {
  user: { fullname: string; email: string } | null;
  isLoggedIn: () => boolean;
  logout: () => void;
  router: { push: (path: string) => void };
  isLoggingOut: boolean;
}

const getUserMenuItems = (onLogout: () => void, isLoggingOut: boolean = false): MenuProps['items'] => [
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
    label: isLoggingOut ? 'Logging out...' : 'Logout',
    icon: isLoggingOut ? <Spin size="small" /> : undefined,
    onClick: isLoggingOut ? undefined : onLogout,
    disabled: isLoggingOut,
  },
];

const UserProfile: React.FC<UserProfileProps> = ({ user, isLoggedIn, logout, router, isLoggingOut }) => {
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
          <Dropdown
            menu={{ items: getUserMenuItems(logout, isLoggingOut) }}
            trigger={['click']}
            disabled={isLoggingOut}
          >
            <Button
              type="text"
              icon={<DownOutlined />}
              size="small"
              className="text-gray-500"
              disabled={isLoggingOut}
            />
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
  );
};

export default UserProfile;
