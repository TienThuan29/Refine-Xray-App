'use client';

import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import SystemSidebar from '@/components/system/SystemSidebar';
import UserManagement from '@/components/system/UserManagement';
import SystemDashboard from '@/components/system/SystemDashboard';
import SystemReports from '@/components/system/SystemReports';
import SystemAnalytics from '@/components/system/SystemAnalytics';

const { Content } = Layout;

export default function SystemPage() {
    const [collapsed, setCollapsed] = useState(false);
    const [selectedKey, setSelectedKey] = useState('dashboard');
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const section = searchParams.get('section');
        if (section) {
            setSelectedKey(section);
        }
    }, [searchParams]);

    const handleMenuSelect = (key: string) => {
        setSelectedKey(key);
        // Update URL with query parameter
        router.push(`/system?section=${key}`);
    };

    const renderContent = () => {
        switch (selectedKey) {
            case 'dashboard':
                return <SystemDashboard />;
            case 'users':
                return <UserManagement />;
            case 'reports':
                return <SystemReports />;
            case 'analytics':
                return <SystemAnalytics />;
            case 'audit-logs':
                return (
                    <div style={{ padding: '24px' }}>
                        <h1>Audit Logs</h1>
                        <p>Audit logs will be implemented here.</p>
                    </div>
                );
            case 'system-settings':
                return (
                    <div style={{ padding: '24px' }}>
                        <h1>System Settings</h1>
                        <p>System settings will be implemented here.</p>
                    </div>
                );
            case 'database':
                return (
                    <div style={{ padding: '24px' }}>
                        <h1>Database Management</h1>
                        <p>Database management will be implemented here.</p>
                    </div>
                );
            case 'security':
                return (
                    <div style={{ padding: '24px' }}>
                        <h1>Security</h1>
                        <p>Security settings will be implemented here.</p>
                    </div>
                );
            default:
                return <SystemDashboard />;
        }
    };

    return (
        <Layout className="h-screen bg-gray-50">
            <SystemSidebar 
                collapsed={collapsed}
                onCollapse={setCollapsed}
                selectedKey={selectedKey}
                onMenuSelect={handleMenuSelect}
            />
            <Layout className="h-screen">
                <Content className="overflow-y-auto">
                    {renderContent()}
                </Content>
            </Layout>
        </Layout>
    );
}