'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Upload, Button, Alert, Spin } from 'antd';
import { UploadOutlined, InboxOutlined, MessageOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { toast } from "sonner";
import useChatSessionManager from '../../hooks/useChatSessionManager';
import useXrayDetection from '../../hooks/useXrayDetection';

const { Dragger } = Upload;

interface ChatSessionModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: { chatSession: { id: string; title: string }; title: string; files: File[] }) => void;
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
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<File[]>([]);
  const [formValues, setFormValues] = useState({ title: '' });
  const [isValidXray, setIsValidXray] = useState<boolean>(false);
  const { createChatSession, isCreating, error, clearError } = useChatSessionManager();
  const { detectXray, isDetecting, result, clearResult } = useXrayDetection();

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.png,.jpg,.jpeg,.dcm,.dicom',
    beforeUpload: async (file: File) => {
      const isValidType = ['image/png', 'image/jpeg', 'image/jpg', 'application/dicom'].includes(file.type);
      if (!isValidType) {
        toast.error('Invalid file type. Please upload PNG, JPG, JPEG, or DICOM files.');
        return false;
      }
      
      const isValidSize = file.size / 1024 / 1024 < 10; // 10MB limit
      if (!isValidSize) {
        toast.error('File size exceeds 10MB limit.');
        return false;
      }

      setFileList([file]);
      setIsValidXray(false);
      
      // Validate if the image is an X-ray
      toast.info('Validating X-ray image...');
      const detectionResult = await detectXray(file);
      
      if (detectionResult) {
        if (detectionResult.is_xray) {
          setIsValidXray(true);
          toast.success(`Valid X-ray image detected (${(detectionResult.xray_probability * 100).toFixed(1)}% confidence)`);
        } else {
          setIsValidXray(false);
          setFileList([]); // Remove the file from the list
          clearResult();
          toast.error('This image does not appear to be an X-ray. Please upload a valid X-ray image.');
        }
      } else {
        setIsValidXray(false);
        setFileList([]); // Remove the file from the list
        clearResult();
        toast.error('Failed to validate image. Please try again.');
      }
      
      return false; // Prevent auto upload
    },
    onRemove: () => {
      setFileList([]);
      setIsValidXray(false);
      clearResult();
    },
    showUploadList: false,
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      clearError(); // Clear any previous errors
      
      if (fileList.length === 0) {
        toast.error('Please select a file to upload.');
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

        toast.success('Chat session created successfully!');
        handleClose();
      } else {
        toast.error('Failed to create chat session');
      }
    } catch (error: unknown) {
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
    setIsValidXray(false);
    clearResult();
    onClose();
  };

  const handleValuesChange = (_changedValues: Record<string, string>, allValues: { title: string }) => {
    setFormValues(allValues);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <MessageOutlined />
          <span className="text-lg font-semibold">Create Chat Session</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      maskClosable={false}
      width={600}
      footer={[
        <Button key="cancel" onClick={handleClose} disabled={isCreating || isDetecting}>
          Cancel
        </Button>,
        <Button
          key="create"
          type="primary"
          loading={isCreating}
          onClick={handleSubmit}
          disabled={!formValues.title?.trim() || fileList.length === 0 || !isValidXray || isCreating || isDetecting}
        >
          Create
        </Button>,
      ]}
    >
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600 mb-1">
          <strong>Folder:</strong> {folderData.title}
        </div>
        {folderData.description && (
          <div className="text-sm text-gray-600 mb-1">
            <strong>Description:</strong> {folderData.description}
          </div>
        )}
        <div className="text-sm text-gray-600">
          <strong>Patient:</strong> {patientData.fullname} ({patientData.gender})
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
          label="Chat Session Title"
          rules={[
            { required: true, message: 'Title is required' },
            { min: 3, message: 'Title must be at least 3 characters' },
            { max: 50, message: 'Title must not exceed 50 characters' }
          ]}
        >
          <Input 
            placeholder="Enter chat session title"
            size="middle"
          />
        </Form.Item>

        <Form.Item
          label="Upload Files"
          help="Upload X-ray images (PNG, JPG, JPEG, DICOM) - Max 10MB"
        >
          <Dragger {...uploadProps} style={{ padding: '20px' }} disabled={isDetecting}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: '16px', marginBottom: '8px' }}>
              Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint" style={{ color: '#666' }}>
              Support for PNG, JPG, JPEG, DICOM files
            </p>
            <Button 
              icon={<UploadOutlined />} 
              style={{ marginTop: '16px' }}
              disabled={isDetecting}
            >
              Select Files
            </Button>
          </Dragger>
        </Form.Item>

        {/* Validation Status */}
        {isDetecting && (
          <Alert
            message="Validating X-ray Image"
            description={
              <div className="flex items-center gap-2">
                <Spin size="small" />
                <span>Please wait while we validate your image...</span>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {result && !isDetecting && fileList.length > 0 && result.is_xray && (
          <Alert
            message="Valid X-ray Image Detected"
            description={`Confidence: ${(result.xray_probability * 100).toFixed(1)}% • Level: ${result.confidence_level.toUpperCase()}`}
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            style={{ marginBottom: '16px' }}
          />
        )}

        {fileList.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ marginBottom: '8px', color: '#333' }}>
              Selected File
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
