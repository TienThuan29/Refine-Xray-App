'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { FolderOutlined } from '@ant-design/icons';
import { toast } from "sonner";
import useFolderManager from '../../hooks/useFolderManager';
import { Type } from '../../types/folder';

interface FolderModalProps {
  visible: boolean;
  onClose: () => void;
  onFolderCreated: (data: { id: string; title: string; description?: string; type?: Type }) => void;
  folderType?: Type;
}

const FolderModal: React.FC<FolderModalProps> = ({ visible, onClose, onFolderCreated, folderType = Type.ANALYZE }) => {

  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({ title: '', description: '' });
  const { createFolder, isCreating, clearError } = useFolderManager();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      clearError();

      console.log('Creating folder with data:', {
        title: values.title,
        description: values.description
      });

      const newFolder = await createFolder({
        title: values.title,
        description: values.description,
        type: folderType
      });

      console.log('newFolder result:', newFolder);

      if (newFolder) {
        onFolderCreated({
          id: newFolder.id,
          title: values.title,
          description: values.description,
          type: folderType
        });

        toast.success('Folder created successfully');
      } 
      else {
        toast.error('Failed to create folder');
      }
    } catch (error: unknown) {
      console.error('Validation failed:', error);
      if (error) {
        toast.error('Failed to create folder');
      }
    }
  };

  const handleClose = () => {
    form.resetFields();
    setFormValues({ title: '', description: '' });
    onClose();
  };

  const handleValuesChange = (_changedValues: Record<string, string>, allValues: { title: string; description: string }) => {
    setFormValues(allValues);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FolderOutlined />
          <span className="text-lg font-semibold">Create Folder</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      maskClosable={false}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Cancel
        </Button>,
        <Button
          key="create"
          type="primary"
          loading={isCreating}
          onClick={handleSubmit}
          disabled={
            !formValues.title?.trim() || isCreating
          }
        >
          Next
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
          label="Folder title"
          rules={[
            { required: true, message: 'Title is required' },
            // { min: 3, message: t('newChat.titleMinLength') },
            // { max: 50, message: t('newChat.titleMaxLength') }
          ]}
        >
          <Input
            placeholder="Title"
            size="middle"
          />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[
            { max: 200, message: 'Max 200 characters' }
          ]}
        >
          <Input.TextArea
            placeholder="Description"
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
