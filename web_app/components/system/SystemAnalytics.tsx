'use client';

import React from 'react';
import { Card, Typography, Row, Col, Statistic, Progress } from 'antd';
import { BarChartOutlined, UserOutlined, FileTextOutlined, ClockCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

const SystemAnalytics: React.FC = () => {
    return (
        <div style={{ padding: '24px' }}>
            <Title level={2} style={{ marginBottom: '24px' }}>System Analytics</Title>
            
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
                            title="Average Response Time"
                            value={1.2}
                            suffix="s"
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: '#52c41a' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="System Uptime"
                            value={99.9}
                            suffix="%"
                            prefix={<BarChartOutlined />}
                            valueStyle={{ color: '#722ed1' }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                <Col xs={24} md={12}>
                    <Card title="User Activity">
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Active Users</span>
                                <span>85%</span>
                            </div>
                            <Progress percent={85} strokeColor="#52c41a" />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>New Registrations</span>
                                <span>72%</span>
                            </div>
                            <Progress percent={72} strokeColor="#1890ff" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Report Generation</span>
                                <span>68%</span>
                            </div>
                            <Progress percent={68} strokeColor="#722ed1" />
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title="System Performance">
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>CPU Usage</span>
                                <span>45%</span>
                            </div>
                            <Progress percent={45} strokeColor="#52c41a" />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Memory Usage</span>
                                <span>67%</span>
                            </div>
                            <Progress percent={67} strokeColor="#faad14" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span>Disk Usage</span>
                                <span>34%</span>
                            </div>
                            <Progress percent={34} strokeColor="#1890ff" />
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default SystemAnalytics;
