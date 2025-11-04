'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, List, Spin, Empty } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import useReportTemplateManagement, { ReportTemplate } from '@/hooks/useReportTemplateManagement';

interface ReportTemplateSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (template: ReportTemplate) => void;
}

const ReportTemplateSelectionModal: React.FC<ReportTemplateSelectionModalProps> = ({
  visible,
  onClose,
  onSelect
}) => {
  const {
    reportTemplates,
    getAllReportTemplates,
    isFetching,
    loading
  } = useReportTemplateManagement();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      getAllReportTemplates();
    }
  }, [visible, getAllReportTemplates]);

  useEffect(() => {
    if (!visible) {
      setSelectedTemplateId(null);
    }
  }, [visible]);

  const handleSelect = () => {
    if (selectedTemplateId) {
      const template = reportTemplates.find(t => t.id === selectedTemplateId && !t.isDeleted);
      if (template) {
        onSelect(template);
        onClose();
      }
    }
  };

  const activeTemplates = reportTemplates.filter(t => !t.isDeleted);

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-orange-500" />
          <span className="text-lg font-semibold">Select Report Template</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      maskClosable={false}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="select"
          type="primary"
          className="bg-orange-500 hover:bg-orange-600"
          onClick={handleSelect}
          disabled={!selectedTemplateId}
        >
          Select Template
        </Button>
      ]}
    >
      {isFetching || loading ? (
        <div className="flex justify-center items-center py-8">
          <Spin size="large" />
        </div>
      ) : activeTemplates.length === 0 ? (
        <Empty
          description="No report templates available"
          className="py-8"
        />
      ) : (
        <List
          dataSource={activeTemplates}
          renderItem={(template: ReportTemplate) => (
            <List.Item
              className={`cursor-pointer transition-colors rounded-lg px-4 py-3 ${
                selectedTemplateId === template.id
                  ? 'bg-orange-50 border border-orange-200'
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
              onClick={() => setSelectedTemplateId(template.id)}
            >
              <div className="flex items-center w-full">
                <FileTextOutlined
                  className={`mr-3 text-lg ${
                    selectedTemplateId === template.id
                      ? 'text-orange-500'
                      : 'text-gray-400'
                  }`}
                />
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {template.name || template.fileLink || 'Untitled Template'}
                </div>
                  {template.createdDate && (
                    <div className="text-sm text-gray-500 mt-1">
                      Created: {new Date(template.createdDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {selectedTemplateId === template.id && (
                  <div className="w-2 h-2 rounded-full bg-orange-500 ml-2" />
                )}
              </div>
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
};

export default ReportTemplateSelectionModal;

