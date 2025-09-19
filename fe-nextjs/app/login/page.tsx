'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Divider, Dropdown } from 'antd';
import { GoogleOutlined, FacebookOutlined, GlobalOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const LoginPage: React.FC = () => {

  const { login } = useAuth();
  const [form] = Form.useForm();
  const { language, setLanguage, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const onFinish = async (values: any) => {
    // console.log('Received values of form: ', values);
    try {
      setIsLoading(true);
      await login(values.email, values.password);
    } catch (ex) {
      console.error(ex);
      toast.error("Some error occurred! Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const languageItems = [
    {
      key: 'en',
      label: 'English',
      onClick: () => setLanguage('en'),
    },
    {
      key: 'vi',
      label: 'Tiếng Việt',
      onClick: () => setLanguage('vi'),
    },
  ];

  return (
    <div className="min-h-screen flex relative">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <Dropdown
          menu={{ items: languageItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Button
            type="text"
            icon={<GlobalOutlined />}
            className="text-white hover:text-blue-200 hover:bg-white/10 border-white/20"
          >
            {language === 'en' ? 'EN' : 'VI'}
          </Button>
        </Dropdown>
      </div>

      {/* Left Section - Brand */}
      <div className="flex-1 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>

        {/* Medical X-Ray AI Banner Content */}
        <div className="relative z-10 text-center text-white px-8 max-w-lg">
          {/* Medical Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            Refine X-Ray
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-blue-100 mb-6 leading-relaxed">
            AI-Powered Medical Imaging Analysis
          </p>

          {/* Features */}
          <div className="space-y-3 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-blue-100">Advanced Chest X-Ray Analysis</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-blue-100">AI-Driven Medical Insights</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-blue-100">Precision Diagnostics</span>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-10 left-10 w-20 h-20 border border-white/20 rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-16 h-16 border border-white/20 rounded-full"></div>
          <div className="absolute top-1/2 right-20 w-8 h-8 bg-white/10 rounded-full"></div>
        </div>

        {/* Background Medical Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 50 L350 50 L350 250 L50 250 Z" stroke="white" strokeWidth="1" fill="none" />
            <path d="M100 100 L300 100 L300 200 L100 200 Z" stroke="white" strokeWidth="1" fill="none" />
            <circle cx="200" cy="150" r="30" stroke="white" strokeWidth="1" fill="none" />
            <path d="M170 150 L230 150 M200 120 L200 180" stroke="white" strokeWidth="1" />
          </svg>
        </div>
      </div>

      {/* Right Section - Login Form */}
      <div className="flex-1 bg-white flex items-center justify-center px-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('login.title')}</h2>
            <p className="text-gray-600">
              {t('login.subtitle')}{' '}
              <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                {t('login.signUp')}
              </Link>
            </p>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="default"
              size="large"
              className="w-full h-12 flex items-center justify-center border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-800"
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              }
            >
              {t('login.googleSignIn')}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <Divider className="text-gray-400">{t('login.or')}</Divider>
          </div>

          {/* Login Form */}
          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
            className="space-y-4"
          >
            <Form.Item
              name="email"
              label={t('login.email')}
              rules={[
                { required: true, message: t('login.emailRequired') },
                { type: 'email', message: t('login.emailInvalid') }
              ]}
            >
              <Input placeholder={t('login.emailPlaceholder')} />
            </Form.Item>

            <Form.Item
              name="password"
              label={t('login.password')}
              rules={[{ required: true, message: t('login.passwordRequired') }]}
            >
              <Input.Password placeholder={t('login.passwordPlaceholder')} />
            </Form.Item>

            <div className="flex items-center justify-between mb-4">
              <Form.Item name="remember" valuePropName="checked" className="mb-0">
                <Checkbox>{t('login.rememberMe')}</Checkbox>
              </Form.Item>
              <Link href="/forgot-password" className="text-blue-600 hover:text-blue-800 text-sm">
                {t('login.forgotPassword')}
              </Link>
            </div>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                disabled={isLoading}
                className="w-full h-12 bg-black hover:bg-gray-800 border-none text-lg font-medium"
              >
                {t('login.loginButton')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
