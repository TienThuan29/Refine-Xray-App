'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Upload, Button } from 'antd';
import { UploadOutlined, InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from "sonner"
const { Dragger } = Upload;
import {
    EditOutlined
  } from '@ant-design/icons';

interface NewChatModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateChat: (data: { title: string; files: File[] }) => void;
}


const NewChatModal: React.FC<NewChatModalProps> = ({ 
  visible, 
  onClose, 
  onCreateChat 
}) => {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onCreateChat({
        title: values.title,
        files: fileList
      });
      
      toast.success(t('newChat.createSuccess'));
      handleClose();
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setFileList([]);
    onClose();
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    fileList: fileList.map((file, index) => ({
      uid: index.toString(),
      name: file.name,
      status: 'done' as UploadFile['status'],
    })),
    beforeUpload: (file: File) => {
      // Validate file type
      const isValidType = file.type.startsWith('image/') || 
                         file.type === 'application/pdf' ||
                         file.type.startsWith('text/');
      
      if (!isValidType) {
        toast.error(t('newChat.invalidFileType'));
        return false;
      }

      // Validate file size (max 10MB)
      const isValidSize = file.size / 1024 / 1024 < 10;
      if (!isValidSize) {
        toast.error(t('newChat.fileTooLarge'));
        return false;
      }

      setFileList([file]);
      return false; 
    },
    onRemove: (file: UploadFile) => {
      setFileList([]);
    },
  };

  return (
    <Modal
    //   title={t('newChat.title')}
        title={
            <div className="flex items-center gap-2">
                        <EditOutlined />
                        <span className="text-lg font-semibold">{t('newChat.title')}</span>
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
          loading={loading}
          onClick={handleSubmit}
          disabled={!form.getFieldValue('title')?.trim()}
        >
          {t('newChat.create')}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
      >
        <Form.Item
          name="title"
          label={t('newChat.folderTitle')}
          rules={[
            { required: true, message: t('newChat.titleRequired') },
            { min: 3, message: t('newChat.titleMinLength') },
            { max: 50, message: t('newChat.titleMaxLength') }
          ]}
        >
          <Input 
            placeholder={t('newChat.titlePlaceholder')}
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

export default NewChatModal;
