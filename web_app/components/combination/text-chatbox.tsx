'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Typography, Card } from 'antd';
import { IoSend } from "react-icons/io5";
import { IoMdRefresh } from "react-icons/io";
import { MessageOutlined } from '@ant-design/icons';
import MarkdownRenderer from '@/components/ui/markdown-renderer';

const { Text } = Typography;

interface TextChatItem {
  id: string;
  content: string;
  isBot: boolean;
  timestamp?: Date;
  metaData?: {
    pubmedQueryUrl?: string;
    pubmedFetchUrl?: string[];
  };
}

interface TextChatboxProps {
  chatItems: TextChatItem[];
  isSending: boolean;
  error: string | null;
  onSendMessage: (message: string) => void;
  onClearError: () => void;
  placeholder?: string;
  helperText?: string;
  fullHeight?: boolean;
  showInput?: boolean;
}

const TextChatbox: React.FC<TextChatboxProps> = ({
  chatItems,
  isSending,
  error,
  onSendMessage,
  onClearError,
  placeholder = "Ask Clini AI any medical question...",
  helperText = "Ask questions about medical topics, request recommendations, or get medical insights.",
  fullHeight = false,
  showInput = true
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatItems]);

  const handleSendMessage = () => {
    if (inputValue.trim() && !isSending) {
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
    <div className={`flex flex-col w-full relative ${fullHeight ? 'h-[calc(100vh-200px)]' : 'h-[400px]'}`}>
      {/* Chat Messages - Scrollable area */}
      <div className={`flex-1 overflow-y-auto p-4 bg-gray-50 rounded-lg ${showInput ? 'pb-20' : ''}`}>
        {chatItems && chatItems.length > 0 ? (
          chatItems.map((item, index) => (
            <div
              key={index}
              className={`flex ${item.isBot ? 'justify-start' : 'justify-end'} mb-4`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  item.isBot
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-orange-50 border border-orange-200'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                      item.isBot ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'
                    }`}
                  >
                    {item.isBot ? 'AI' : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.isBot ? (
                      <MarkdownRenderer content={item.content} className="text-sm" />
                    ) : (
                      <Text className="text-gray-700 text-sm whitespace-pre-wrap break-words">
                        {item.content}
                      </Text>
                    )}
                    {item.metaData?.pubmedQueryUrl && (
                      <div className="mt-2">
                        <a
                          href={item.metaData.pubmedQueryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs"
                        >
                          PubMed Reference
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <></>
          // <div className="text-center py-8 text-gray-500">
          //   <MessageOutlined className="text-2xl mb-2" />
          //   <Text className="text-sm">No chat messages yet. Start a conversation below!</Text>
          // </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input - Conditionally shown */}
      {showInput && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10">
          <div className="space-y-3">
            {error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded">
                <Text className="text-red-600 text-xs">{error}</Text>
                <Button
                  type="link"
                  size="small"
                  onClick={onClearError}
                  className="text-red-600 p-0 h-auto text-xs"
                >
                  Dismiss
                </Button>
              </div>
            )}

            <div className="flex space-x-2">
              <Input
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onPressEnter={handleSendMessage}
                disabled={isSending}
                className="flex-1 h-10 border-gray-200 focus:border-orange-400 focus:shadow-lg transition-all duration-200 hover:border-orange-300"
                size="small"
                style={{
                  boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
                }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="h-10 px-4 send-button-enhanced font-medium text-white min-w-[30px] ml-3 flex items-center justify-center"
                size="large"
              >
                {isSending ? (
                  <IoMdRefresh className="text-lg animate-spin" />
                ) : (
                  <IoSend className="text-lg" />
                )}
              </Button>
            </div>

            <div className="text-xs text-gray-500">
              {helperText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextChatbox;
