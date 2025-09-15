'use client';

import React, { useState } from 'react';
import { Modal, Form, Select, Switch, Button, Space, Typography, Divider, Card, Row, Col } from 'antd';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    GlobalOutlined,
    BellOutlined,
    SaveOutlined,
    CloseOutlined
} from '@ant-design/icons';
import { toast } from "sonner"
import { GoGear } from "react-icons/go";

const { Title, Text } = Typography;
const { Option } = Select;

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
    const { language, setLanguage, t } = useLanguage();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        try {
            setLoading(true);
            const values = await form.validateFields();
            // Update language if changed
            if (values.language !== language) {
                setLanguage(values.language);
            }
            // console.log('Settings saved:', values);
            await new Promise(resolve => setTimeout(resolve, 500));
            toast.success(t('settings.saveSuccess'));
            onClose();
        }
        catch (error) {
            // console.error('Failed to save settings:', error);
            toast.error(t('settings.saveError'));
        }
        finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onClose();
    };

    return (
        <Modal
            title={
                <div className="flex items-center gap-2">
                    <GoGear />
                    <span className="text-lg font-semibold">{t('settings.title')}</span>
                </div>
            }
            open={visible}
            onCancel={handleCancel}
            width={600}
            footer={[
                <Button
                    key="cancel"
                    onClick={handleCancel}
                    icon={<CloseOutlined />}
                    size="middle"
                    className="mr-2"
                >
                    {t('settings.cancel')}
                </Button>,
                <Button
                    key="save"
                    type="primary"
                    loading={loading}
                    onClick={handleSave}
                    icon={<SaveOutlined />}
                    size="middle"
                >
                    {t('settings.save')}
                </Button>,
            ]}
            destroyOnHidden
            className="[&_.ant-modal-body]:p-6 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-gray-200 [&_.ant-modal-header]:px-6 [&_.ant-modal-header]:py-4 [&_.ant-modal-footer]:border-t [&_.ant-modal-footer]:border-gray-200 [&_.ant-modal-footer]:px-6 [&_.ant-modal-footer]:py-4"
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    language: language,
                    notifications: true,
                }}
            >
                <Row gutter={[24, 24]}>
                    {/* Language Settings */}
                    <Col span={24}>
                        <Card
                            size="small"
                            className="border border-gray-300 rounded-xl shadow-sm"
                            bodyStyle={{ padding: '20px' }}
                        >
                            <div className="flex items-center mb-4">
                                <GlobalOutlined className="text-lg text-blue-500 mr-2" />
                                <Title level={5} className="m-0 text-gray-800">
                                    {t('settings.language')}
                                </Title>
                            </div>
                            <Form.Item
                                name="language"
                                rules={[{ required: true, message: 'Please select a language' }]}
                                className="mb-0"
                            >
                                <Select
                                    placeholder={t('settings.language')}
                                    className="w-full"
                                    size="large"
                                    suffixIcon={<GlobalOutlined />}
                                >
                                    <Option value="en">🇺🇸 {t('settings.language.en')}</Option>
                                    <Option value="vi">🇻🇳 {t('settings.language.vi')}</Option>
                                </Select>
                            </Form.Item>
                        </Card>
                    </Col>

                    {/* Notification Settings */}
                    <Col span={24}>
                        <Card
                            size="small"
                            className="border border-gray-300 rounded-xl shadow-sm"
                            bodyStyle={{ padding: '20px' }}
                        >
                            <div className="flex items-center mb-4">
                                <BellOutlined className="text-lg text-green-500 mr-2" />
                                <Title level={5} className="m-0 text-gray-800">
                                    {t('settings.notifications')}
                                </Title>
                            </div>
                            <Form.Item name="notifications" valuePropName="checked" className="mb-0">
                                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2">
                                        <Text className="text-sm font-medium">
                                            {t('settings.notifications.enabled')}
                                        </Text>
                                        <Text type="secondary" className="text-xs">
                                            (Coming soon)
                                        </Text>
                                    </div>
                                    <Switch defaultChecked={false} disabled/>
                                </div>
                            </Form.Item>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

export default SettingsModal;
