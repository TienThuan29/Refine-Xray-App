'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Upload, Button } from 'antd';
import { UploadOutlined, InboxOutlined, MessageOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from "sonner";
import useChatSessionManager from '../../hooks/useChatSessionManager';

const { Dragger } = Upload;

interface ChatSessionModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: { chatSession: any; title: string; files: File[] }) => void;
  folderData: { id: string; title: string; description?: string };
  patientData: { fullname: string; gender: string };
  onRefreshFolders?: () => void;
}

const ChatSessionModal: React.FC<ChatSessionModalProps> = ({ 
  visible, 
  onClose, 
  onComplete, 
  folderData, 
  patientData,
  onRefreshFolders
}) => {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<File[]>([]);
  const [formValues, setFormValues] = useState({ title: '' });
  const { createChatSession, isCreating, error, clearError } = useChatSessionManager();

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.png,.jpg,.jpeg,.dcm,.dicom',
    beforeUpload: (file: File) => {
      const isValidType = ['image/png', 'image/jpeg', 'image/jpg', 'application/dicom'].includes(file.type);
      if (!isValidType) {
        toast.error(t('newChat.invalidFileType'));
        return false;
      }
      
      const isValidSize = file.size / 1024 / 1024 < 10; // 10MB limit
      if (!isValidSize) {
        toast.error(t('newChat.fileSizeExceeded'));
        return false;
      }

      setFileList([file]);
      return false; // Prevent auto upload
    },
    onRemove: () => {
      setFileList([]);
    },
    showUploadList: false,
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      clearError(); // Clear any previous errors
      
      if (fileList.length === 0) {
        toast.error(t('newChat.fileRequired'));
        return;
      }

      const chatSession = await createChatSession({
        title: values.title,
        xrayImage: fileList[0],
        folderId: folderData.id
      });

      if (chatSession) {
        onComplete({
          chatSession: chatSession,
          title: values.title,
          files: fileList
        });

        // Refresh folders to show the new chat session
        if (onRefreshFolders) {
          onRefreshFolders();
        }

        toast.success(t('newChat.chatSessionCreateSuccess'));
        handleClose();
      } else {
        toast.error(t('newChat.chatSessionCreateError') || 'Failed to create chat session');
      }
    } catch (error: any) {
      console.error('Validation failed:', error);
      if (error) {
        toast.error('Failed to create chat session');
      }
    }
  };

  const handleClose = () => {
    form.resetFields();
    setFileList([]);
    setFormValues({ title: '' });
    onClose();
  };

  const handleValuesChange = (changedValues: any, allValues: any) => {
    setFormValues(allValues);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <MessageOutlined />
          <span className="text-lg font-semibold">{t('newChat.createChatSession')}</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          {t('newChat.cancel')}
        </Button>,
        <Button
          key="create"
          type="primary"
          loading={isCreating}
          onClick={handleSubmit}
          disabled={!formValues.title?.trim() || fileList.length === 0 || isCreating}
        >
          {t('newChat.create')}
        </Button>,
      ]}
    >
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-1">
          <strong>{t('newChat.folder')}:</strong> {folderData.title}
        </div>
        {folderData.description && (
          <div className="text-sm text-gray-600 mb-1">
            <strong>{t('newChat.description')}:</strong> {folderData.description}
          </div>
        )}
        <div className="text-sm text-gray-600">
          <strong>{t('newChat.patient')}:</strong> {patientData.fullname} ({patientData.gender})
        </div>
      </div>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onValuesChange={handleValuesChange}
      >
        {/* Title input */}
        <Form.Item
          name="title"
          label={t('newChat.chatSessionTitle')}
          rules={[
            { required: true, message: t('newChat.titleRequired') },
            { min: 3, message: t('newChat.titleMinLength') },
            { max: 50, message: t('newChat.titleMaxLength') }
          ]}
        >
          <Input 
            placeholder={t('newChat.chatSessionTitlePlaceholder')}
            size="middle"
          />
        </Form.Item>

        <Form.Item
          label={t('newChat.uploadFiles')}
          help={t('newChat.uploadHelp')}
        >
          <Dragger {...uploadProps} style={{ padding: '20px' }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: '16px', marginBottom: '8px' }}>
              {t('newChat.dragText')}
            </p>
            <p className="ant-upload-hint" style={{ color: '#666' }}>
              {t('newChat.supportedFormats')}
            </p>
            <Button 
              icon={<UploadOutlined />} 
              style={{ marginTop: '16px' }}
            >
              {t('newChat.selectFiles')}
            </Button>
          </Dragger>
        </Form.Item>

        {fileList.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ marginBottom: '8px', color: '#333' }}>
              {t('newChat.selectedFile')}
            </h4>
            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
              {fileList.map((file, index) => (
                <div 
                  key={index}
                  style={{ 
                    padding: '8px 12px', 
                    background: '#f5f5f5', 
                    borderRadius: '4px',
                    marginBottom: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{file.name}</span>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default ChatSessionModal;
