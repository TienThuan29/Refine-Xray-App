'use client';

import React from 'react';
import { Typography } from 'antd';
import SuggestedActions from './suggested-actions';
import TextInput from './text-input';

const { Title } = Typography;

interface StartSectionProps {
  onSendMessage?: (message: string) => void;
  isSending?: boolean;
}

const StartSection: React.FC<StartSectionProps> = ({ 
  onSendMessage, 
  isSending = false 
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <div className="w-12 h-12 bg-white rounded-lg"></div>
        </div>
        <Title level={2} className="text-center text-gray-900 mb-8">
          Let&apos;s start a analysis with Clini AI
        </Title>
      </div>

      {/* Text Input */}
      {onSendMessage && (
        <div className="mb-8 w-full px-4">
          <TextInput
            onSendMessage={onSendMessage}
            isSending={isSending}
          />
        </div>
      )}

      {/* Suggested Actions */}
      <SuggestedActions />
    </div>
  );
};

export default StartSection;
