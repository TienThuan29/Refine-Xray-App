"use client";

import React, { useState, useEffect } from 'react';
import { Layout, Button, Typography, Spin, Empty } from 'antd';
import {
  ArrowLeftOutlined,
  FileTextOutlined,
  LoadingOutlined,
  LinkOutlined,
  FacebookOutlined,
  TwitterOutlined,
  LinkedinOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { FaRegQuestionCircle, FaPinterest } from "react-icons/fa";
import { CiLogin } from "react-icons/ci";
import useBlogManager from '@/hooks/useBlogManager';
import { Blog } from '@/types/blog';
import { formatDate } from '@/lib/date';
import { PageUrl } from '@/configs/page.url';
import { toast } from 'sonner';

const { Content } = Layout;
const { Title, Text } = Typography;

export default function BlogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isLoggedIn, logout, isLoggingOut } = useAuth();
  const [blog, setBlog] = useState<Blog | null>(null);

  const {
    currentBlog,
    loading,
    error,
    isFetching,
    getBlog
  } = useBlogManager();

  const blogId = params?.id as string;

  const loadBlog = React.useCallback(async () => {
    if (blogId) {
      const fetchedBlog = await getBlog(blogId);
      if (!fetchedBlog) {
        toast.error('Blog not found');
      }
    }
  }, [blogId, getBlog]);

  useEffect(() => {
    if (blogId) {
      loadBlog();
    }
  }, [blogId, loadBlog]);

  useEffect(() => {
    if (currentBlog) {
      setBlog(currentBlog);
    }
  }, [currentBlog]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const title = blog?.title || '';
    const text = blog?.subtitle || '';

    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'pinterest':
        shareUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`;
        break;
      default:
        return;
    }
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const primaryImage = blog?.image_urls?.[0] || '';
  const readingTime = blog?.content ? Math.ceil(blog.content.split(' ').length / 200) : 0;

  return (
    <div className="min-h-screen bg-white">
      <Layout className="min-h-screen">
        <Content className="bg-white">
          <div className="flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shadow-sm">
              <div className="flex items-center space-x-4">
                <Button
                  type="text"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => router.push(PageUrl.Doctor.BLOG_PAGE)}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                />
                <div className="h-6 w-px bg-gray-300" />
                <Title level={4} className="!mb-0 flex items-center gap-2">
                  <FileTextOutlined className="text-orange-500" />
                  Blog Detail
                </Title>
              </div>

              <div className="flex items-center space-x-3">
                <Button type="text" icon={<FaRegQuestionCircle />} className="text-gray-500 hover:bg-gray-100" />
                <Button type="text" icon={<LinkOutlined />} className="text-gray-500 hover:bg-gray-100" />
                {isLoggedIn() && user ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600 font-medium">Welcome, {user.fullname}</span>
                    <Button
                      type="text"
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
                    className="bg-orange-500 hover:bg-orange-600 border-orange-500 hover:border-orange-600 shadow-sm"
                    onClick={() => router.push(PageUrl.LOGIN_PAGE)}
                  >
                    Login
                  </Button>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              {loading || isFetching ? (
                <div className="flex justify-center items-center py-20">
                  <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                </div>
              ) : error ? (
                <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <Text type="danger">{error}</Text>
                </div>
              ) : !blog ? (
                <div className="py-20">
                  <Empty
                    description={
                      <div className="space-y-2">
                        <Text className="text-gray-500 text-base">Blog not found</Text>
                      </div>
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              ) : (
                <>
                  {/* Header Image - Positioned absolutely at top */}
                  <div className="w-full h-[500px] relative overflow-hidden">
                    {primaryImage ? (
                      <img 
                        src={primaryImage} 
                        alt={blog.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center">
                        <div className="text-center">
                          <FileTextOutlined className="text-9xl text-white opacity-50" />
                          <p className="text-2xl font-bold text-gray-600 mt-4 opacity-70">Blog Article</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Blog Content */}
                  <div className="relative bg-gray-50">
                    <div className="max-w-5xl mx-auto px-4 py-12">
                      <div className="flex gap-12">
                        {/* Main Content */}
                        <div className="flex-1">
                          {/* Title */}
                          <Title level={1} className="!mb-8 text-center !text-5xl font-bold tracking-tight !text-gray-900">
                            {blog.title}
                          </Title>

                          {/* Author Info */}
                          <div className="flex items-center justify-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                              <span className="text-white font-bold text-lg">
                                {blog.create_by?.[0]?.toUpperCase() || 'A'}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <Text className="font-semibold text-gray-900">{blog.create_by}</Text>
                              <Text type="secondary" className="text-sm">
                                {formatDate(blog.created_date)} • {readingTime} min. read
                              </Text>
                            </div>
                          </div>

                          {/* Separator */}
                          <div className="border-t border-gray-200 mb-10"></div>

                          {/* Subtitle */}
                          {blog.subtitle && (
                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-10 rounded-r-lg">
                              <Text className="text-xl text-gray-800 font-medium leading-relaxed block">
                                {blog.subtitle}
                              </Text>
                            </div>
                          )}

                          {/* Content */}
                          <div className="bg-white rounded-xl shadow-sm p-10 border border-gray-100">
                            <div className="prose prose-lg max-w-none">
                              <div className="whitespace-pre-wrap text-gray-700 leading-8 text-lg">
                                {blog.content}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Share Sidebar */}
                        <div className="hidden lg:block sticky top-8 h-fit">
                          <div className="flex flex-row items-start">
                            <div className="flex items-center justify-center px-2">
                              <Text className="text-xs font-bold text-gray-500 uppercase tracking-wider transform -rotate-90 whitespace-nowrap origin-center">
                                Share this
                              </Text>
                            </div>
                            <div className="flex flex-col gap-4">
                              <button
                                onClick={() => handleShare('facebook')}
                                className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-all transform hover:scale-110 shadow-md hover:shadow-lg"
                                aria-label="Share on Facebook"
                              >
                                <FacebookOutlined className="text-lg" />
                              </button>
                              <button
                                onClick={() => handleShare('twitter')}
                                className="w-12 h-12 rounded-full bg-sky-400 hover:bg-sky-500 flex items-center justify-center text-white transition-all transform hover:scale-110 shadow-md hover:shadow-lg"
                                aria-label="Share on Twitter"
                              >
                                <TwitterOutlined className="text-lg" />
                              </button>
                              <button
                                onClick={() => handleShare('linkedin')}
                                className="w-12 h-12 rounded-full bg-blue-700 hover:bg-blue-800 flex items-center justify-center text-white transition-all transform hover:scale-110 shadow-md hover:shadow-lg"
                                aria-label="Share on LinkedIn"
                              >
                                <LinkedinOutlined className="text-lg" />
                              </button>
                              <button
                                onClick={() => handleShare('pinterest')}
                                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-all transform hover:scale-110 shadow-md hover:shadow-lg"
                                aria-label="Share on Pinterest"
                              >
                                <FaPinterest className="text-lg" />
                              </button>
                              <button
                                onClick={handleCopyLink}
                                className="w-12 h-12 rounded-full bg-gray-600 hover:bg-gray-700 flex items-center justify-center text-white transition-all transform hover:scale-110 shadow-md hover:shadow-lg"
                                aria-label="Copy link"
                              >
                                <CopyOutlined className="text-lg" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </Content>
      </Layout>
    </div>
  );
}

