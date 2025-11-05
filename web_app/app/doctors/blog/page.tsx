"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Button, Typography, Spin, Empty, Table, Space, Tag, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  LoadingOutlined,
  EyeOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaRegQuestionCircle } from "react-icons/fa";
import { CiLogin } from "react-icons/ci";
import useBlogManager from '@/hooks/useBlogManager';
import BlogModal from '@/components/combination/blog-modal';
import DeleteConfirmModal from '@/components/combination/delete-confirm-modal';
import { Blog, CreateBlogRequest, UpdateBlogRequest } from '@/types/blog';
import { toast } from 'sonner';
import { formatDate } from '@/lib/date';
import { PageUrl } from '@/configs/page.url';
import { Constant } from '@/configs/constant';

const { Content } = Layout;
const { Title, Text } = Typography;

// Component for image cell with error handling
const ImageCell: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !imageUrl) {
    return (
      <div className="w-20 h-15 bg-gray-100 rounded flex items-center justify-center" style={{ width: '80px', height: '60px' }}>
        <FileTextOutlined className="text-gray-400" />
      </div>
    );
  }

  return (
    <div className="w-20 h-15 bg-gray-100 rounded overflow-hidden flex items-center justify-center" style={{ width: '80px', height: '60px' }}>
      <img
        src={imageUrl}
        alt="Blog thumbnail"
        className="w-full h-full object-cover"
        style={{ width: '80px', height: '60px', objectFit: 'cover' }}
        onError={() => setHasError(true)}
      />
    </div>
  );
};

const { Search } = Input;

export default function BlogPage() {
  const router = useRouter();
  const { user, isLoggedIn, logout, isLoggingOut } = useAuth();
  const [blogModalVisible, setBlogModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Check if user is DOCTOR
  const isDoctor = user?.role === Constant.ROLES.DOCTOR;

  const {
    blogs,
    loading,
    error,
    isCreating,
    isUpdating,
    isDeleting,
    createBlog,
    createBlogWithForm,
    updateBlog,
    updateBlogWithForm,
    deleteBlog,
    listBlogs,
    refreshBlogs
  } = useBlogManager();

  const loadBlogs = useCallback(async () => {
    await listBlogs();
  }, [listBlogs]);

  useEffect(() => {
    loadBlogs();
  }, [loadBlogs]);

  const handleCreateBlog = async (blogData: any) => {
    try {
      // If imageFile exists, send FormData to form endpoint
      if (blogData.imageFile) {
        const formData = new FormData();
        formData.append('create_by', user?.id || '');
        formData.append('title', blogData.title);
        if (blogData.subtitle) {
          formData.append('subtitle', blogData.subtitle);
        }
        formData.append('content', blogData.content);
        formData.append('image', blogData.imageFile);

        const newBlog = await createBlogWithForm(formData);
        if (newBlog) {
          toast.success('Blog created successfully');
          setBlogModalVisible(false);
          await refreshBlogs();
        } else {
          toast.error('Failed to create blog');
        }
      } else {
        // Use JSON endpoint if no file
        const createData: CreateBlogRequest = {
          create_by: user?.id || '',
          title: blogData.title,
          subtitle: blogData.subtitle,
          content: blogData.content,
          image_urls: blogData.image_urls
        };

        const newBlog = await createBlog(createData);
        if (newBlog) {
          toast.success('Blog created successfully');
          setBlogModalVisible(false);
          await refreshBlogs();
        } else {
          toast.error('Failed to create blog');
        }
      }
    } catch {
      toast.error('Error creating blog');
    }
  };

  const handleUpdateBlog = async (blogData: any) => {
    if (!editingBlog) return;

    try {
      // If imageFile exists, send FormData to form endpoint
      if (blogData.imageFile) {
        const formData = new FormData();
        formData.append('create_by', editingBlog.create_by);
        formData.append('title', blogData.title);
        if (blogData.subtitle) {
          formData.append('subtitle', blogData.subtitle);
        }
        formData.append('content', blogData.content);
        // Preserve existing image URLs if any
        if (blogData.image_urls && Array.isArray(blogData.image_urls)) {
          blogData.image_urls.forEach((url: string) => {
            formData.append('image_urls', url);
          });
        }
        formData.append('image', blogData.imageFile);

        const updatedBlog = await updateBlogWithForm(editingBlog.id, formData);
        if (updatedBlog) {
          toast.success('Blog updated successfully');
          setBlogModalVisible(false);
          setEditingBlog(null);
          await refreshBlogs();
        } else {
          toast.error('Failed to update blog');
        }
      } else {
        // Use JSON endpoint if no file
        const updateData: UpdateBlogRequest = {
          create_by: editingBlog.create_by,
          title: blogData.title,
          subtitle: blogData.subtitle,
          content: blogData.content,
          image_urls: blogData.image_urls
        };

        const updatedBlog = await updateBlog(editingBlog.id, updateData);
        if (updatedBlog) {
          toast.success('Blog updated successfully');
          setBlogModalVisible(false);
          setEditingBlog(null);
          await refreshBlogs();
        } else {
          toast.error('Failed to update blog');
        }
      }
    } catch {
      toast.error('Error updating blog');
    }
  };

  const handleDeleteBlog = async () => {
    if (!blogToDelete) return;

    try {
      const success = await deleteBlog(blogToDelete.id);
      if (success) {
        toast.success('Blog deleted successfully');
        setDeleteConfirmVisible(false);
        setBlogToDelete(null);
        await refreshBlogs();
      } else {
        toast.error('Failed to delete blog');
      }
    } catch {
      toast.error('Error deleting blog');
    }
  };

  const handleOpenEditModal = (blog: Blog) => {
    setEditingBlog(blog);
    setBlogModalVisible(true);
  };

  const handleOpenDeleteModal = (blog: Blog) => {
    setBlogToDelete(blog);
    setDeleteConfirmVisible(true);
  };

  const handleCloseModal = () => {
    setBlogModalVisible(false);
    setEditingBlog(null);
  };

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Filter blogs based on search query
  const filteredBlogs = blogs.filter((blog) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      blog.title.toLowerCase().includes(query) ||
      blog.subtitle?.toLowerCase().includes(query) ||
      blog.content.toLowerCase().includes(query) ||
      blog.create_by.toLowerCase().includes(query)
    );
  });

  // Table columns definition
  const columns: ColumnsType<Blog> = [
    {
      title: 'Image',
      dataIndex: 'image_urls',
      key: 'image',
      width: 100,
      render: (imageUrls: string[] | undefined) => {
        if (imageUrls && imageUrls.length > 0 && imageUrls[0]) {
          const imageUrl = imageUrls[0];
          return (
            <ImageCell imageUrl={imageUrl} />
          );
        }
        return (
          <div className="w-20 h-15 bg-gray-100 rounded flex items-center justify-center" style={{ width: '80px', height: '60px' }}>
            <FileTextOutlined className="text-gray-400" />
          </div>
        );
      },
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      render: (text: string, record: Blog) => (
        <div>
          <div className="font-semibold text-gray-900 mb-1">{text}</div>
          {record.subtitle && (
            <div className="text-sm text-gray-500 line-clamp-1">{record.subtitle}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      render: (text: string) => (
        <div className="text-gray-600 line-clamp-2">{truncateContent(text, 150)}</div>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'created_date',
      key: 'created_date',
      width: 150,
      render: (date: string) => (
        <div className="text-sm">
          <Tag color="blue">{formatDate(date)}</Tag>
        </div>
      ),
      sorter: (a: Blog, b: Blog) => {
        const dateA = new Date(a.created_date).getTime();
        const dateB = new Date(b.created_date).getTime();
        return dateA - dateB;
      },
    },
    {
      title: 'Updated Date',
      dataIndex: 'updated_date',
      key: 'updated_date',
      width: 150,
      render: (date: string | undefined, record: Blog) => {
        if (!date || new Date(date).getTime() === new Date(record.created_date).getTime()) {
          return <Text type="secondary" className="text-sm">-</Text>;
        }
        return (
          <div className="text-sm">
            <Tag color="green">{formatDate(date)}</Tag>
          </div>
        );
      },
      sorter: (a: Blog, b: Blog) => {
        const dateA = a.updated_date ? new Date(a.updated_date).getTime() : 0;
        const dateB = b.updated_date ? new Date(b.updated_date).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_: any, record: Blog) => (
        <Space size="small">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => router.push(PageUrl.Doctor.BLOG_DETAIL(record.id))}
            className="bg-blue-500 hover:bg-blue-600 border-blue-500 hover:border-blue-600"
          >
            View
          </Button>
          {isDoctor && (
            <>
              <Button
                type="default"
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleOpenEditModal(record)}
              >
                Edit
              </Button>
              <Button
                type="primary"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => handleOpenDeleteModal(record)}
              >
                Delete
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="h-screen bg-white">
      <Layout className="h-full">
        {/* Main Content */}
        <Layout>
          <Content className="bg-white">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => router.push(PageUrl.Doctor.HOME_PAGE)}
                    className="text-gray-500 hover:text-gray-700"
                  />
                  <div className="h-6 w-px bg-gray-300" />
                  <Title level={4} className="!mb-0 flex items-center gap-2">
                    <FileTextOutlined className="text-orange-500" />
                    Blog Management
                  </Title>
                </div>

                <div className="flex items-center space-x-3">
                  <Button type="text" icon={<FaRegQuestionCircle />} className="text-gray-500" />
                  <Button type="text" icon={<LinkOutlined />} className="text-gray-500" />
                  {isLoggedIn() && user ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Welcome, {user.fullname}</span>
                      <Button
                        type="text"
                        className="text-gray-500 hover:text-gray-700"
                        onClick={logout}
                        loading={isLoggingOut}
                        disabled={isLoggingOut}
                      >
                        {isLoggingOut ? 'Logging out...' : 'Logout'}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="primary"
                      icon={<CiLogin />}
                      className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600"
                      onClick={() => router.push(PageUrl.LOGIN_PAGE)}
                    >
                      Login
                    </Button>
                  )}
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-4 flex-1">
                      <Text type="secondary" className="text-sm whitespace-nowrap">
                        {filteredBlogs.length} {filteredBlogs.length === 1 ? 'blog' : 'blogs'}
                        {searchQuery && blogs.length !== filteredBlogs.length && (
                          <span className="text-gray-400"> of {blogs.length}</span>
                        )}
                      </Text>
                      <Search
                        placeholder="Search blogs by title, subtitle, content"
                        allowClear
                        enterButton
                        size="large"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onSearch={(value) => setSearchQuery(value)}
                        className="max-w-md"
                      />
                    </div>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      size="large"
                      className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600 font-medium whitespace-nowrap"
                      onClick={() => {
                        setEditingBlog(null);
                        setBlogModalVisible(true);
                      }}
                      disabled={!isDoctor}
                    >
                      New Blog
                    </Button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <Text type="danger">{error}</Text>
                  </div>
                )}

                {/* Blog Table */}
                <div className="p-4">
                  {loading ? (
                    <div className="flex justify-center items-center py-20">
                      <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                    </div>
                  ) : blogs.length === 0 ? (
                    <div className="py-20">
                      <Empty
                        description={
                          <div className="space-y-2">
                            <Text className="text-gray-500 text-base">No blogs found</Text>
                            <Text type="secondary" className="text-sm block">
                              Create your first blog post to get started
                            </Text>
                          </div>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      >
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          size="large"
                          className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600 mt-4"
                          onClick={() => {
                            setEditingBlog(null);
                            setBlogModalVisible(true);
                          }}
                          disabled={!isDoctor}
                        >
                          Create Your First Blog
                        </Button>
                      </Empty>
                    </div>
                  ) : filteredBlogs.length === 0 ? (
                    <div className="py-20">
                      <Empty
                        description={
                          <div className="space-y-2">
                            <Text className="text-gray-500 text-base">No blogs match your search</Text>
                            <Text type="secondary" className="text-sm block">
                              Try adjusting your search query
                            </Text>
                          </div>
                        }
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      >
                        <Button
                          type="default"
                          onClick={() => setSearchQuery('')}
                        >
                          Clear Search
                        </Button>
                      </Empty>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg shadow-sm">
                      <Table
                        columns={columns}
                        dataSource={filteredBlogs}
                        rowKey="id"
                        loading={loading}
                        pagination={{
                          pageSize: 10,
                          showSizeChanger: true,
                          showTotal: (total) => `Total ${total} blogs${searchQuery ? ` (filtered)` : ''}`,
                          pageSizeOptions: ['10', '20', '50', '100'],
                        }}
                        scroll={{ x: 1200 }}
                        className="blog-table"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Content>
        </Layout>
      </Layout>

      {/* Create/Edit Blog Modal */}
      <BlogModal
        visible={blogModalVisible}
        onClose={handleCloseModal}
        onComplete={editingBlog ? handleUpdateBlog : handleCreateBlog}
        editingBlog={editingBlog}
        isCreating={isCreating}
        isUpdating={isUpdating}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        visible={deleteConfirmVisible}
        editingType="folder"
        selectedItem={blogToDelete ? { title: blogToDelete.title } : null}
        isDeleting={isDeleting}
        isDeletingChatSession={false}
        onCancel={() => {
          setDeleteConfirmVisible(false);
          setBlogToDelete(null);
        }}
        onConfirm={handleDeleteBlog}
      />
    </div>
  );
}
