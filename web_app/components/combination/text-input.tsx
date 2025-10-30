'use client';

import React, { useState } from 'react';
import { Input, Button, Typography } from 'antd';
import { IoSend } from "react-icons/io5";
import { IoMdRefresh } from "react-icons/io";

const { Text } = Typography;

interface TextInputProps {
  onSendMessage: (message: string) => void;
  isSending?: boolean;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
}

const TextInput: React.FC<TextInputProps> = ({
  onSendMessage,
  isSending = false,
  placeholder = "Ask Clini AI any medical question...",
  helperText = "Ask questions about medical topics, request recommendations, or get medical insights.",
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (inputValue.trim() && !isSending && !disabled) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="space-y-3">
        <div className="flex space-x-2">
          <Input
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleSendMessage}
            disabled={isSending || disabled}
            className="flex-1 border-gray-200 focus:border-orange-400 focus:shadow-lg transition-all duration-200 hover:border-orange-300 text-base"
            style={{
              height: '48px',
              boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSending || disabled}
            className="ml-2 px-6 bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600 font-medium text-white min-w-[50px] flex items-center justify-center"
            style={{ height: '48px' }}
          >
            {isSending ? (
              <IoMdRefresh className="text-lg animate-spin" />
            ) : (
              <IoSend className="text-lg" />
            )}
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center">
          {helperText}
        </div>
      </div>
    </div>
  );
};

export default TextInput;
