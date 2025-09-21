'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { FolderOutlined } from '@ant-design/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from "sonner";

interface FolderModalProps {
  visible: boolean;
  onClose: () => void;
  onFolderCreated: (data: { title: string; description?: string }) => void;
}

const FolderModal: React.FC<FolderModalProps> = ({ visible, onClose, onFolderCreated }) => {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({ title: '', description: '' });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onFolderCreated({
        title: values.title,
        description: values.description
      });
      
      toast.success(t('newChat.folderCreateSuccess'));
      // Don't call handleClose() here - let the parent handle the transition
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setFormValues({ title: '', description: '' });
    onClose();
  };

  const handleValuesChange = (changedValues: any, allValues: any) => {
    setFormValues(allValues);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FolderOutlined />
          <span className="text-lg font-semibold">{t('newChat.createFolder')}</span>
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
          disabled={
            !formValues.title?.trim()
          }
        >
          {t('newChat.next')}
        </Button>,
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onValuesChange={handleValuesChange}
      >
        <Form.Item
          name="title"
          label={t('newChat.folderTitle')}
          rules={[
            { required: true, message: t('newChat.titleRequired') },
            // { min: 3, message: t('newChat.titleMinLength') },
            // { max: 50, message: t('newChat.titleMaxLength') }
          ]}
        >
          <Input 
            placeholder={t('newChat.titlePlaceholder')}
            size="middle"
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={t('newChat.description')}
          rules={[
            { max: 200, message: t('newChat.descriptionMaxLength') }
          ]}
        >
          <Input.TextArea 
            placeholder={t('newChat.descriptionPlaceholder')}
            rows={3}
            showCount
            maxLength={200}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FolderModal;
