'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Upload,
  Space,
  Popconfirm,
  Card,
  Tag,
  Tooltip,
  Input,
  Switch,
  message,
  Typography,
  Divider,
} from 'antd';
import { toast } from 'sonner';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  ReloadOutlined,
  UploadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';
import useReportTemplateManagement, { ReportTemplate, UpdateReportTemplateRequest } from '@/hooks/useReportTemplateManagement';

const { Dragger } = Upload;
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

const ReportTemplates: React.FC = () => {
  const {
    reportTemplates,
    loading,
    error,
    isCreating,
    isUpdating,
    getAllReportTemplates,
    createReportTemplate,
    updateReportTemplate,
    clearError,
    refreshReportTemplates,
  } = useReportTemplateManagement();

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [editFileList, setEditFileList] = useState<UploadFile[]>([]);

  const loadTemplates = useCallback(async () => {
    await getAllReportTemplates();
  }, [getAllReportTemplates]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleCreate = () => {
    setIsCreateModalVisible(true);
    createForm.resetFields();
    setFileList([]);
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields();
      
      if (!fileList.length || !fileList[0].originFileObj) {
        message.error('Please upload a file');
        return;
      }

      const result = await createReportTemplate({
        file: fileList[0].originFileObj,
        name: values.name,
      });

      if (result) {
        toast.success('Report template created successfully');
        setIsCreateModalVisible(false);
        createForm.resetFields();
        setFileList([]);
        await refreshReportTemplates();
      } else {
        toast.error('Failed to create report template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Failed to create report template');
    }
  };

  const handleView = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setIsViewModalVisible(true);
  };

  const handleEdit = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    editForm.setFieldsValue({
      name: template.name,
      template: template.template,
      fileLink: template.fileLink,
      isDeleted: !template.isDeleted,
    });
    setEditFileList([]);
    setIsEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      if (!selectedTemplate) return;

      const updateData: UpdateReportTemplateRequest = {};
      
      // Only include fields that have been changed or are not empty
      if (values.name !== undefined && values.name !== null && values.name.trim() !== '') {
        updateData.name = values.name.trim();
      }
      if (values.template !== undefined && values.template !== null && values.template.trim() !== '') {
        updateData.template = values.template.trim();
      }
      if (values.fileLink !== undefined && values.fileLink !== null && values.fileLink.trim() !== '') {
        updateData.fileLink = values.fileLink.trim();
      }
      
      // Always include isDeleted status (invert: Switch checked (Active) = !isDeleted)
      if (values.isDeleted !== undefined) {
        updateData.isDeleted = !values.isDeleted;
      } else {
        // If not provided, keep existing value
        updateData.isDeleted = selectedTemplate.isDeleted;
      }
      
      // Include file if a new one is uploaded
      if (editFileList.length > 0 && editFileList[0].originFileObj) {
        updateData.file = editFileList[0].originFileObj;
      }

      // Ensure at least one field is being updated
      const hasChanges = updateData.name !== undefined || 
                        updateData.template !== undefined || 
                        updateData.fileLink !== undefined || 
                        updateData.file !== undefined ||
                        (updateData.isDeleted !== undefined && updateData.isDeleted !== selectedTemplate.isDeleted);

      if (!hasChanges) {
        toast.warning('No changes to update');
        return;
      }

      const result = await updateReportTemplate(selectedTemplate.id, updateData);

      if (result) {
        toast.success('Report template updated successfully');
        setIsEditModalVisible(false);
        editForm.resetFields();
        setEditFileList([]);
        setSelectedTemplate(null);
        await refreshReportTemplates();
      } else {
        toast.error('Failed to update report template');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error updating template:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update report template';
      toast.error(errorMessage);
    }
  };

  const handleToggleStatus = async (template: ReportTemplate) => {
    const newStatus = !template.isDeleted;
    const result = await updateReportTemplate(template.id, {
      isDeleted: newStatus,
    });

    if (result) {
      toast.success(`Template ${newStatus ? 'deactivated' : 'activated'} successfully`);
      await refreshReportTemplates();
    } else {
      toast.error('Failed to update template status');
    }
  };

  const handleDownload = (fileLink: string) => {
    window.open(fileLink, '_blank');
  };

  const beforeUpload = (file: File) => {
    const isValidType = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                        file.type === 'application/pdf';
    if (!isValidType) {
      message.error('You can only upload DOCX or PDF files!');
      return Upload.LIST_IGNORE;
    }
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('File must be smaller than 10MB!');
      return Upload.LIST_IGNORE;
    }
    return false; // Prevent auto upload
  };

  const columns: ColumnsType<ReportTemplate> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text.substring(0, 8)}...</span>
        </Tooltip>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text || '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Template Preview',
      dataIndex: 'template',
      key: 'template',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span>{text ? (text.length > 50 ? `${text.substring(0, 50)}...` : text) : '-'}</span>
        </Tooltip>
      ),
    },
    {
      title: 'File Link',
      dataIndex: 'fileLink',
      key: 'fileLink',
      ellipsis: true,
      render: (link: string) => (
        link ? (
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => handleDownload(link)}
            size="small"
          >
            View File
          </Button>
        ) : '-'
      ),
    },
    // {
    //   title: 'Created By',
    //   dataIndex: 'createBy',
    //   key: 'createBy',
    //   width: 150,
    // },
    {
      title: 'Created Date',
      dataIndex: 'createdDate',
      key: 'createdDate',
      width: 180,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: 'Updated Date',
      dataIndex: 'updatedDate',
      key: 'updatedDate',
      width: 180,
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: 'Status',
      dataIndex: 'isDeleted',
      key: 'isDeleted',
      width: 100,
      render: (isDeleted: boolean) => (
        <Tag color={isDeleted ? 'red' : 'green'} icon={isDeleted ? <CloseCircleOutlined /> : <CheckCircleOutlined />}>
          {isDeleted ? 'Inactive' : 'Active'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_: unknown, record: ReportTemplate) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title={record.isDeleted ? 'Activate this template?' : 'Deactivate this template?'}
            description={`Are you sure you want to ${record.isDeleted ? 'activate' : 'deactivate'} this template?`}
            onConfirm={() => handleToggleStatus(record)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title={record.isDeleted ? 'Activate' : 'Deactivate'}>
              <Button
                type="text"
                danger={!record.isDeleted}
                icon={record.isDeleted ? <CheckCircleOutlined /> : <DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div className="mb-4 flex justify-between items-center">
        <Title level={4} style={{ margin: 0 }}>
          Report Templates Management
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadTemplates}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Create Template
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={reportTemplates}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} templates`,
        }}
      />

      {/* Create Modal */}
      <Modal
        title="Create Report Template"
        open={isCreateModalVisible}
        onCancel={() => {
          setIsCreateModalVisible(false);
          createForm.resetFields();
          setFileList([]);
        }}
        onOk={handleCreateSubmit}
        confirmLoading={isCreating}
        width={600}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="name"
            label="Template Name"
            rules={[{ required: false, message: 'Please enter a template name' }]}
          >
            <Input placeholder="Enter template name (optional, defaults to file name)" />
          </Form.Item>
          <Form.Item
            name="file"
            label="Upload Template File"
            rules={[{ required: true, message: 'Please upload a template file' }]}
          >
            <Dragger
              fileList={fileList}
              beforeUpload={beforeUpload}
              onChange={({ fileList: newFileList }) => {
                // Ensure only one file is kept
                if (newFileList.length > 1) {
                  setFileList([newFileList[newFileList.length - 1]]);
                } else {
                  setFileList(newFileList);
                }
              }}
              maxCount={1}
              multiple={false}
              accept=".docx,.pdf"
              style={{ padding: '20px' }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: '16px', marginBottom: '8px' }}>
                Click or drag file to this area to upload
              </p>
              <p className="ant-upload-hint" style={{ color: '#666' }}>
                Support for DOCX, PDF files (Max 10MB)
              </p>
            </Dragger>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title="Template Details"
        open={isViewModalVisible}
        onCancel={() => {
          setIsViewModalVisible(false);
          setSelectedTemplate(null);
        }}
        footer={[
          <Button key="close" onClick={() => setIsViewModalVisible(false)}>
            Close
          </Button>,
          selectedTemplate?.fileLink && (
            <Button
              key="download"
              type="primary"
              icon={<FileTextOutlined />}
              onClick={() => handleDownload(selectedTemplate.fileLink)}
            >
              Download File
            </Button>
          ),
        ]}
        width={800}
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div>
              <strong>ID:</strong> {selectedTemplate.id}
            </div>
            <div>
              <strong>Name:</strong> {selectedTemplate.name || '-'}
            </div>
            {/* <div>
              <strong>Created By:</strong> {selectedTemplate.createBy}
            </div> */}
            <div>
              <strong>Created Date:</strong>{' '}
              {selectedTemplate.createdDate
                ? dayjs(selectedTemplate.createdDate).format('YYYY-MM-DD HH:mm:ss')
                : '-'}
            </div>
            <div>
              <strong>Updated Date:</strong>{' '}
              {selectedTemplate.updatedDate
                ? dayjs(selectedTemplate.updatedDate).format('YYYY-MM-DD HH:mm:ss')
                : '-'}
            </div>
            <div>
              <strong>Status:</strong>{' '}
              <Tag color={selectedTemplate.isDeleted ? 'red' : 'green'}>
                {selectedTemplate.isDeleted ? 'Inactive' : 'Active'}
              </Tag>
            </div>
            <Divider />
            <div>
              <strong>Template Content (Markdown):</strong>
              <div className="mt-2 p-4 bg-gray-50 rounded border max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm">
                  {selectedTemplate.template || '-'}
                </pre>
              </div>
            </div>
            {selectedTemplate.fileLink && (
              <div>
                <strong>File Link:</strong>{' '}
                <a href={selectedTemplate.fileLink} target="_blank" rel="noopener noreferrer">
                  {selectedTemplate.fileLink}
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Report Template"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          editForm.resetFields();
          setEditFileList([]);
          setSelectedTemplate(null);
        }}
        onOk={handleEditSubmit}
        confirmLoading={isUpdating}
        width={600}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="name"
            label="Template Name"
          >
            <Input placeholder="Enter template name" />
          </Form.Item>
          <Form.Item
            name="isDeleted"
            label="Status"
            valuePropName="checked"
            initialValue={!selectedTemplate?.isDeleted}
          >
            <Switch
              checkedChildren="Active"
              unCheckedChildren="Inactive"
            />
          </Form.Item>
          <Form.Item
            name="template"
            label="Template (Markdown)"
          >
            <TextArea
              rows={10}
              placeholder="Enter markdown template content"
            />
          </Form.Item>
          <Form.Item
            name="fileLink"
            label="File Link"
          >
            <Input placeholder="Enter file link URL" />
          </Form.Item>
          <Form.Item
            label="Upload New File (Optional)"
          >
            <Upload
              fileList={editFileList}
              beforeUpload={beforeUpload}
              onChange={({ fileList: newFileList }) => setEditFileList(newFileList)}
              maxCount={1}
              accept=".docx,.pdf"
            >
              <Button icon={<UploadOutlined />}>Select File (DOCX/PDF)</Button>
            </Upload>
            <div className="mt-2 text-sm text-gray-500">
              Upload a new file to replace the existing one
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ReportTemplates;
