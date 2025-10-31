'use client';

import React from 'react';
import { Card, Typography } from 'antd';
import { FileTextOutlined, StarOutlined, BulbOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const suggestedActions = [
  {
    title: "Diagnose X-ray Image",
    description: "",
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
    description: "(Coming Soon)",
    icon: <BulbOutlined className="text-xl" />,
    color: "bg-green-50 border-green-200 hover:bg-green-100"
  }
];

const SuggestedActions: React.FC = () => {
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
  );
};

export default SuggestedActions;
