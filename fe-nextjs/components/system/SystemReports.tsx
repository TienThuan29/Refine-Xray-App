'use client';

import React from 'react';
import { Card, Typography, Table, Button, Space, DatePicker, Select } from 'antd';
import { FileTextOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const SystemReports: React.FC = () => {
    const mockReports = [
        {
            key: '1',
            id: 'RPT-001',
            title: 'Monthly User Activity Report',
            type: 'User Analytics',
            createdDate: '2024-01-15',
            status: 'Completed',
            author: 'System User'
        },
        {
            key: '2',
            id: 'RPT-002',
            title: 'System Performance Report',
            type: 'System',
            createdDate: '2024-01-14',
            status: 'In Progress',
            author: 'System Admin'
        },
        {
            key: '3',
            id: 'RPT-003',
            title: 'Security Audit Report',
            type: 'Security',
            createdDate: '2024-01-13',
            status: 'Completed',
            author: 'Security Team'
        }
    ];

    const columns = [
        {
            title: 'Report ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Type',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: 'Created Date',
            dataIndex: 'createdDate',
            key: 'createdDate',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <span style={{ 
                    color: status === 'Completed' ? '#52c41a' : '#faad14',
                    fontWeight: 'bold'
                }}>
                    {status}
                </span>
            ),
        },
        {
            title: 'Author',
            dataIndex: 'author',
            key: 'author',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: () => (
                <Space>
                    <Button icon={<EyeOutlined />} size="small">View</Button>
                    <Button icon={<DownloadOutlined />} size="small">Download</Button>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2} style={{ marginBottom: '24px' }}>System Reports</Title>
            
            <Card style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <RangePicker placeholder={['Start Date', 'End Date']} />
                    <Select placeholder="Report Type" style={{ width: 200 }}>
                        <Option value="all">All Types</Option>
                        <Option value="user">User Analytics</Option>
                        <Option value="system">System</Option>
                        <Option value="security">Security</Option>
                    </Select>
                    <Button type="primary" icon={<FileTextOutlined />}>
                        Generate Report
                    </Button>
                </div>
            </Card>

            <Card>
                <Table 
                    columns={columns} 
                    dataSource={mockReports}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

export default SystemReports;
