'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { Blog, CreateBlogRequest, UpdateBlogRequest } from '@/types/blog';

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
            } else {
                form.resetFields();
                setFormValues({});
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
            
            // Process image_urls - convert from textarea (newline-separated) to array
            const imageUrlsArray = values.image_urls 
                ? values.image_urls.split('\n').filter((url: string) => url.trim() !== '')
                : [];

            const blogData = {
                title: values.title,
                subtitle: values.subtitle || undefined,
                content: values.content,
                image_urls: imageUrlsArray.length > 0 ? imageUrlsArray : undefined
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
                    label="Subtitle (Optional)"
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
                    name="image_urls"
                    label="Image URLs (Optional)"
                    help="Enter one URL per line"
                >
                    <Input.TextArea
                        placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                        rows={4}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default BlogModal;

