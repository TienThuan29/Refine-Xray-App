'use client';

import React from 'react';
import { Card, Row, Col, Statistic, Typography } from 'antd';
import { UserOutlined, FileTextOutlined, BarChartOutlined, SettingOutlined } from '@ant-design/icons';

const { Title } = Typography;

const SystemDashboard: React.FC = () => {
    return (
        <div style={{ padding: '24px' }}>
            <Title level={2} style={{ marginBottom: '24px' }}>System Dashboard</Title>
            
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Total Users"
                            value={1128}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Reports Generated"
                            value={93}
                            prefix={<FileTextOutlined />}
                            valueStyle={{ color: '#1890ff' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="System Health"
                            value={98.5}
                            suffix="%"
                            prefix={<BarChartOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Active Sessions"
                            value={24}
                            prefix={<SettingOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                <Col span={24}>
                    <Card title="Recent Activity">
                        <p>Welcome to the system dashboard. Here you can monitor system performance, manage users, and view analytics.</p>
                        <p>Select a menu item from the sidebar to get started with specific system functions.</p>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default SystemDashboard;
