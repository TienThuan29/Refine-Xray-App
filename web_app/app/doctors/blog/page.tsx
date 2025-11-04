"use client";

import React, { useState, useEffect } from 'react';
import { Layout, Button, Typography, Spin, Empty, Dropdown } from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileTextOutlined,
  LoadingOutlined,
  MoreOutlined,
  LinkOutlined,
  DownOutlined
} from '@ant-design/icons';
import { MenuProps } from 'antd';
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

const headerMenuItems: MenuProps['items'] = [
  {
    key: 'v1',
    label: 'Clini AI',
    icon: <DownOutlined />,
  },
];

export default function BlogPage() {
  const router = useRouter();
  const { user, isLoggedIn, logout, isLoggingOut } = useAuth();
  const [blogModalVisible, setBlogModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);

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
    updateBlog,
    deleteBlog,
    listBlogs,
    refreshBlogs
  } = useBlogManager();

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    await listBlogs();
  };

  const handleCreateBlog = async (blogData: any) => {
    try {
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
    } catch (error) {
      toast.error('Error creating blog');
    }
  };

  const handleUpdateBlog = async (blogData: any) => {
    if (!editingBlog) return;

    try {
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
    } catch (error) {
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
    } catch (error) {
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

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  // Sort blogs by newest first
  const sortedBlogs = [...blogs].sort((a, b) => {
    const dateA = new Date(a.created_date).getTime();
    const dateB = new Date(b.created_date).getTime();
    return dateB - dateA;
  });

  const latestBlog = sortedBlogs.length > 0 ? sortedBlogs[0] : null;
  const olderBlogs = sortedBlogs.slice(1);

  // Helper function to render blog card
  const renderBlogCard = (blog: Blog, isLarge: boolean = false) => {
    const menuItems: MenuProps['items'] = [
      {
        key: 'edit',
        label: 'Edit',
        icon: <EditOutlined />,
        onClick: () => handleOpenEditModal(blog),
      },
      {
        key: 'delete',
        label: 'Delete',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => handleOpenDeleteModal(blog),
      },
    ];

    const primaryImage = blog.image_urls?.[0] || '';
    const hoverImage = blog.image_urls?.[1] || blog.image_urls?.[0] || '';
    const hasHoverImage = blog.image_urls && blog.image_urls.length > 1;

    if (isLarge) {
      // Large featured blog card
      return (
        <div key={blog.id} className="bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700 relative group overflow-hidden">
          <div className="flex flex-col md:flex-row">
            <div className="relative w-full md:w-1/2 overflow-hidden">
              {primaryImage ? (
                <div className="relative h-80 md:h-96">
                  <img 
                    className="w-full h-full object-cover transition-all duration-500" 
                    src={primaryImage} 
                    alt={blog.title}
                  />
                  {hasHoverImage && (
                    <img 
                      className="w-full h-full object-cover absolute top-0 left-0 transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-110" 
                      src={hoverImage} 
                      alt={blog.title}
                    />
                  )}
                </div>
              ) : (
                <div className="w-full h-80 md:h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <FileTextOutlined className="text-6xl text-gray-400" />
                </div>
              )}
              {isDoctor && (
                <div className="absolute top-4 right-4">
                  <Dropdown
                    menu={{ items: menuItems }}
                    trigger={['click']}
                    placement="bottomRight"
                  >
                    <Button
                      type="text"
                      icon={<MoreOutlined />}
                      className="text-white bg-black/30 hover:bg-black/50 border-0"
                    />
                  </Dropdown>
                </div>
              )}
            </div>

            <div className="p-8 md:p-12 w-full md:w-1/2 flex flex-col justify-between">
              <div>
                <h2 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-white line-clamp-2">
                  {blog.title}
                </h2>
                {blog.subtitle && (
                  <p className="mb-6 text-xl text-gray-600 dark:text-gray-400 line-clamp-2">
                    {blog.subtitle}
                  </p>
                )}
                <p className="mb-4 font-normal text-gray-700 dark:text-gray-400 line-clamp-5 text-lg">
                  {truncateContent(blog.content, 300)}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4 text-base text-gray-500 dark:text-gray-400">
                    <span>{formatDate(blog.created_date)}</span>
                    {blog.updated_date && 
                     new Date(blog.updated_date).getTime() !== new Date(blog.created_date).getTime() && (
                      <span>Updated {formatDate(blog.updated_date)}</span>
                    )}
                  </div>
                  <span className="text-base text-gray-500 dark:text-gray-400">
                    {blog.create_by}
                  </span>
                </div>
                <button 
                  onClick={() => router.push(PageUrl.Doctor.BLOG_DETAIL(blog.id))}
                  className="inline-flex items-center px-6 py-3 text-lg font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                  Read more
                  <svg className="rtl:rotate-180 w-5 h-5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Regular small blog card
    return (
      <div key={blog.id} className="max-w-sm bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700 relative group flex flex-col h-full">
        <div className="relative overflow-hidden rounded-t-lg">
          <a href="#">
            {primaryImage ? (
              <div className="relative">
                <img 
                  className="rounded-t-lg w-full h-48 object-cover transition-all duration-500" 
                  src={primaryImage} 
                  alt={blog.title}
                />
                {hasHoverImage && (
                  <img 
                    className="rounded-t-lg w-full h-48 object-cover absolute top-0 left-0 transition-all duration-500 opacity-0 group-hover:opacity-100 group-hover:scale-110" 
                    src={hoverImage} 
                    alt={blog.title}
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-t-lg">
                <FileTextOutlined className="text-4xl text-gray-400" />
              </div>
            )}
          </a>
          {isDoctor && (
            <div className="absolute top-2 right-2">
              <Dropdown
                menu={{ items: menuItems }}
                trigger={['click']}
                placement="bottomRight"
              >
                <Button
                  type="text"
                  icon={<MoreOutlined />}
                  className="text-white bg-black/30 hover:bg-black/50 border-0"
                />
              </Dropdown>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-grow">
          <div className="flex-grow">
            <a href="#">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white line-clamp-2">
                {blog.title}
              </h5>
            </a>
            <p className="mb-3 font-normal text-gray-700 dark:text-gray-400 line-clamp-3">
              {blog.subtitle || truncateContent(blog.content, 150)}
            </p>
          </div>
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{formatDate(blog.created_date)}</span>
                {blog.updated_date && 
                 new Date(blog.updated_date).getTime() !== new Date(blog.created_date).getTime() && (
                  <span>Updated {formatDate(blog.updated_date)}</span>
                )}
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {blog.create_by}
              </span>
            </div>
            <button 
              onClick={() => router.push(PageUrl.Doctor.BLOG_DETAIL(blog.id))}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            >
              Read more
              <svg className="rtl:rotate-180 w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Text type="secondary" className="text-sm">
                        {blogs.length} {blogs.length === 1 ? 'blog' : 'blogs'}
                      </Text>
                    </div>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      size="large"
                      className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600 font-medium"
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

                {/* Blog List */}
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
                  ) : (
                    <div className="space-y-6">
                      {/* Latest Blog - Large Featured Card */}
                      {latestBlog && (
                        <div className="mb-8">
                          {renderBlogCard(latestBlog, true)}
                        </div>
                      )}
                      
                      {/* Older Blogs - Grid Layout */}
                      {olderBlogs.length > 0 && (
                        <div className="flex flex-col items-center">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Posts</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
                            {olderBlogs.map((blog) => renderBlogCard(blog, false))}
                          </div>
                        </div>
                      )}
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
