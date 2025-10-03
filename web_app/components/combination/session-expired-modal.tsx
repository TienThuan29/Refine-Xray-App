'use client';

import React from 'react';
import { Modal, Button, Typography, Space } from 'antd';
import { ExclamationCircleOutlined, LoginOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

interface SessionExpiredModalProps {
  visible: boolean;
  onConfirm: () => void;
}

const SessionExpiredModal: React.FC<SessionExpiredModalProps> = ({
  visible,
  onConfirm
}) => {
  const router = useRouter();

  const handleLoginRedirect = () => {
    onConfirm();
    router.push('/login');
  };

  return (
    <Modal
      title={null}
      open={visible}
      closable={false}
      maskClosable={false}
      footer={null}
      centered
      width={400}
      className="session-expired-modal"
    >
      <div className="text-center py-6">
        {/* Icon */}
        <div className="mb-6">
          <ExclamationCircleOutlined 
            className="text-6xl text-orange-500"
          />
        </div>

        {/* Title */}
        <Title level={3} className="mb-4 text-gray-900">
          Session Expired
        </Title>

        {/* Message */}
        <Text className="text-gray-600 text-base leading-relaxed block mb-8">
          Your login session has expired for security reasons. 
          Please sign in again to continue using the application.
        </Text>

        {/* Action Button */}
        <Space>
          <Button
            type="primary"
            icon={<LoginOutlined />}
            size="large"
            className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600 px-8 h-12 font-medium"
            onClick={handleLoginRedirect}
          >
            Sign In Again
          </Button>
        </Space>
      </div>
    </Modal>
  );
};

export default SessionExpiredModal;
