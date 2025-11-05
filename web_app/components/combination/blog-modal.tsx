'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Upload } from 'antd';
import { FileTextOutlined, InboxOutlined } from '@ant-design/icons';
import { Blog, CreateBlogRequest } from '@/types/blog';

interface BlogModalProps {
    visible: boolean;
    onClose: () => void;
    onComplete: (blogData: { title: string; subtitle?: string; content: string; image_urls?: string[] }) => void;
    editingBlog?: Blog | null;
    isCreating: boolean;
    isUpdating: boolean;
}

const BlogModal: React.FC<BlogModalProps> = ({
    visible,
    onClose,
    onComplete,
    editingBlog,
    isCreating,
    isUpdating
}) => {
    const [form] = Form.useForm();
    const [formValues, setFormValues] = useState<Partial<CreateBlogRequest>>({});
    const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        if (visible) {
            if (editingBlog) {
                form.setFieldsValue({
                    title: editingBlog.title,
                    subtitle: editingBlog.subtitle || '',
                    content: editingBlog.content,
                    image_urls: editingBlog.image_urls?.join('\n') || ''
                });
                setFormValues({
                    title: editingBlog.title,
                    subtitle: editingBlog.subtitle,
                    content: editingBlog.content,
                    image_urls: editingBlog.image_urls
                });
                setUploadedUrls(editingBlog.image_urls || []);
            } else {
                form.resetFields();
                setFormValues({});
                setUploadedUrls([]);
                setSelectedFile(null);
            }
        }
    }, [visible, editingBlog, form]);

    const handleClose = () => {
        form.resetFields();
        setFormValues({});
        onClose();
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            // Process image_urls - prefer uploadedUrls state if present; fallback to textarea value
            const textareaUrls = values.image_urls 
                ? values.image_urls.split('\n').filter((url: string) => url.trim() !== '')
                : [];
            const imageUrlsArray = (uploadedUrls && uploadedUrls.length > 0) ? uploadedUrls : textareaUrls;

            const blogData = {
                title: values.title,
                subtitle: values.subtitle || undefined,
                content: values.content,
                image_urls: imageUrlsArray.length > 0 ? imageUrlsArray : undefined,
                imageFile: selectedFile || undefined
            };

            // onComplete will handle create/update with proper data structure
            onComplete(blogData as any);
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const handleValuesChange = (_: any, allValues: any) => {
        setFormValues(allValues);
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <FileTextOutlined />
                    <span className="text-lg font-semibold">
                        {editingBlog ? 'Edit Blog' : 'Create New Blog'}
                    </span>
                </div>
            }
            open={visible}
            onCancel={handleClose}
            maskClosable={false}
            width={700}
            footer={[
                <Button key="cancel" onClick={handleClose}>
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={isCreating || isUpdating}
                    onClick={handleSubmit}
                    disabled={
                        !formValues.title?.trim() ||
                        !formValues.content?.trim() ||
                        isCreating ||
                        isUpdating
                    }
                >
                    {editingBlog ? 'Update' : 'Create'}
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
                    label="Blog Title"
                    rules={[
                        { required: true, message: 'Title is required' },
                        { min: 3, message: 'Title must be at least 3 characters' },
                        { max: 200, message: 'Title must not exceed 200 characters' }
                    ]}
                >
                    <Input
                        placeholder="Enter blog title"
                        size="middle"
                    />
                </Form.Item>

                <Form.Item
                    name="subtitle"
                    label="Subtitle"
                    rules={[
                        { max: 300, message: 'Subtitle must not exceed 300 characters' }
                    ]}
                >
                    <Input
                        placeholder="Enter blog subtitle"
                        size="middle"
                    />
                </Form.Item>

                <Form.Item
                    name="content"
                    label="Content"
                    rules={[
                        { required: true, message: 'Content is required' },
                        { min: 10, message: 'Content must be at least 10 characters' }
                    ]}
                >
                    <Input.TextArea
                        placeholder="Enter blog content"
                        rows={8}
                        showCount
                    />
                </Form.Item>

                <Form.Item
                    label="Image (Upload an image )"
                    tooltip="Drag and drop images or click to select"
                >
                    <Upload.Dragger
                        multiple
                        accept="image/*"
                        listType="picture"
                        beforeUpload={() => false}
                        onChange={({ fileList }) => {
                            // Build URLs from fileList (use existing url or create object URL)
                            const urls: string[] = [];
                            let firstFile: File | null = null;
                            fileList.forEach((f, idx) => {
                                const url = (f.url as string) || (f.originFileObj ? URL.createObjectURL(f.originFileObj as File) : '');
                                if (url) urls.push(url);
                                if (idx === 0 && f.originFileObj) {
                                    firstFile = f.originFileObj as File;
                                }
                            });
                            setUploadedUrls(urls);
                            setSelectedFile(firstFile);
                            // Keep hidden field synced for submit fallback
                            form.setFieldsValue({ image_urls: urls.join('\n') });
                        }}
                        onRemove={(file) => {
                            if (file.originFileObj) {
                                const tmp = URL.createObjectURL(file.originFileObj as File);
                                URL.revokeObjectURL(tmp);
                            }
                            return true;
                        }}
                    >
                        <p className="ant-upload-drag-icon">
                            <InboxOutlined />
                        </p>
                        <p className="ant-upload-text">Click or drag image files to this area to upload</p>
                        <p className="ant-upload-hint">Support for multiple images. Only image files are accepted.</p>
                    </Upload.Dragger>
                </Form.Item>

                {/* Hidden field to preserve compatibility with existing submit logic */}
                <Form.Item name="image_urls" hidden>
                    <Input type="hidden" />
                </Form.Item>
                
            </Form>
        </Modal>
    );
};

export default BlogModal;

