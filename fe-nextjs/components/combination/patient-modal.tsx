'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Upload, Button, Select, Row, Col } from 'antd';
import { UploadOutlined, InboxOutlined, UserOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from "sonner";
import { useVietnamAddress } from '../../hooks/useVietnamAddress';
import { PatientProfileRequest } from '../../types/patient';
const { Dragger } = Upload;

interface PatientModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: { title: string; files: File[]; patientProfile: PatientProfileRequest }) => void;
  folderData: { title: string; description?: string };
}

const PatientModal: React.FC<PatientModalProps> = ({ visible, onClose, onComplete, folderData }) => {
  const { t, language } = useLanguage();
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState({ 
    title: '',
    fullname: '', 
    gender: '', 
    province: '', 
    commune: '' 
  });
  const { provinces, communesOfProvince, loadingProvinces, loadingCommunes, getProvinces, getCommunesOfProvince } = useVietnamAddress();

  useEffect(() => {
    if (visible) {
      getProvinces();
    }
  }, [visible, getProvinces]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const patientProfile: PatientProfileRequest = {
        fullname: values.fullname,
        gender: values.gender,
        phone: values.phone,
        houseNumber: values.houseNumber,
        commune: values.commune && Array.isArray(communesOfProvince) ? communesOfProvince.find(c => c.code === values.commune) : undefined,
        province: values.province && Array.isArray(provinces) ? provinces.find(p => p.code === values.province) : undefined,
        nation: values.nation || (language === 'vi' ? 'Việt Nam' : 'Vietnam')
      };
      
      onComplete({
        title: values.title,
        files: fileList,
        patientProfile
      });
      
      toast.success(t('newChat.createSuccess'));
      handleClose();
    } catch (error) {
      console.error('Validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    setFileList([]);
    setFormValues({ title: '', fullname: '', gender: '', province: '', commune: '' });
    onClose();
  };

  const handleValuesChange = (changedValues: any, allValues: any) => {
    setFormValues(allValues);
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    fileList: fileList.map((file, index) => ({
      uid: index.toString(),
      name: file.name,
      status: 'done' as UploadFile['status'],
    })),
    beforeUpload: (file: File) => {
      // Validate file type
      const isValidType = file.type.startsWith('image/') || 
                         file.type === 'application/pdf' ||
                         file.type.startsWith('text/');
      
      if (!isValidType) {
        toast.error(t('newChat.invalidFileType'));
        return false;
      }

      // Validate file size (max 10MB)
      const isValidSize = file.size / 1024 / 1024 < 10;
      if (!isValidSize) {
        toast.error(t('newChat.fileTooLarge'));
        return false;
      }

      setFileList([file]);
      return false; 
    },
    onRemove: (file: UploadFile) => {
      setFileList([]);
    },
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <UserOutlined />
          <span className="text-lg font-semibold">{t('newChat.patientInfo')}</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      width={800}
      footer={[
        <Button key="back" onClick={handleClose}>
          {t('newChat.back')}
        </Button>,
        <Button 
          key="create" 
          type="primary" 
          loading={loading}
          onClick={handleSubmit}
          disabled={
            !formValues.title?.trim() ||
            !formValues.fullname?.trim() ||
            !formValues.gender ||
            !formValues.province ||
            !formValues.commune
          }
        >
          {t('newChat.create')}
        </Button>,
      ]}
    >
      {/* Folder Info Display */}
      <div style={{ marginBottom: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>
          {t('newChat.folderInfo')}
        </h4>
        <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>{folderData.title}</p>
        {folderData.description && (
          <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>{folderData.description}</p>
        )}
      </div>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onValuesChange={handleValuesChange}
      >
        {/* Patient Profile Section */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '16px', color: '#333', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
            {t('patient.title')}
          </h4>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fullname"
                label={t('patient.fullname')}
                rules={[
                  { required: true, message: t('patient.fullnameRequired') },
                  { min: 2, message: t('patient.fullnameMinLength') },
                  { max: 100, message: t('patient.fullnameMaxLength') }
                ]}
              >
                <Input placeholder={t('patient.fullnamePlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label={t('patient.gender')}
                rules={[{ required: true, message: t('patient.genderRequired') }]}
              >
                <Select placeholder={t('patient.genderPlaceholder')}>
                  <Select.Option value="male">{t('patient.genderMale')}</Select.Option>
                  <Select.Option value="female">{t('patient.genderFemale')}</Select.Option>
                  <Select.Option value="other">{t('patient.genderOther')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label={t('patient.phone')}
                rules={[
                  { pattern: /^[0-9+\-\s()]+$/, message: t('patient.phoneInvalid') },
                  { max: 15, message: t('patient.phoneMaxLength') }
                ]}
              >
                <Input placeholder={t('patient.phonePlaceholder')} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="houseNumber"
                label={t('patient.houseNumber')}
              >
                <Input placeholder={t('patient.houseNumberPlaceholder')} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="province"
                label={t('patient.province')}
                rules={[{ required: true, message: t('patient.provinceRequired') }]}
              >
                <Select 
                  placeholder={t('patient.provincePlaceholder')}
                  onChange={(value) => {
                    form.setFieldsValue({ commune: undefined });
                    getCommunesOfProvince(value);
                  }}
                  loading={loadingProvinces}
                >
                  {Array.isArray(provinces) && provinces.map(province => (
                    <Select.Option key={province.code} value={province.code}>
                      {province.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="commune"
                label={t('patient.commune')}
                rules={[{ required: true, message: t('patient.communeRequired') }]}
              >
                <Select 
                  placeholder={t('patient.communePlaceholder')}
                  disabled={!form.getFieldValue('province')}
                  loading={loadingCommunes}
                >
                  {Array.isArray(communesOfProvince) && communesOfProvince.map(commune => (
                    <Select.Option key={commune.code} value={commune.code}>
                      {commune.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="nation"
                label={t('patient.nation')}
              >
                <Input placeholder={t('patient.nationPlaceholder')} defaultValue={language === 'vi' ? 'Việt Nam' : 'Vietnam'} />
              </Form.Item>
            </Col>
          </Row>
        </div>

        {/* Title input */}
        <Form.Item
          name="title"
          label={t('newChat.chatSessionTitle')}
          rules={[
            { required: true, message: t('newChat.titleRequired') },
            { min: 3, message: t('newChat.titleMinLength') },
            { max: 50, message: t('newChat.titleMaxLength') }
          ]}
        >
          <Input 
            placeholder={t('newChat.chatSessionTitlePlaceholder')}
            size="middle"
          />
        </Form.Item>

        <Form.Item
          label={t('newChat.uploadFiles')}
          help={t('newChat.uploadHelp')}
        >
          <Dragger {...uploadProps} style={{ padding: '20px' }}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: '16px', marginBottom: '8px' }}>
              {t('newChat.dragText')}
            </p>
            <p className="ant-upload-hint" style={{ color: '#666' }}>
              {t('newChat.supportedFormats')}
            </p>
            <Button 
              icon={<UploadOutlined />} 
              style={{ marginTop: '16px' }}
            >
              {t('newChat.selectFiles')}
            </Button>
          </Dragger>
        </Form.Item>

        {fileList.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ marginBottom: '8px', color: '#333' }}>
              {t('newChat.selectedFile')}
            </h4>
            <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
              {fileList.map((file, index) => (
                <div 
                  key={index}
                  style={{ 
                    padding: '8px 12px', 
                    background: '#f5f5f5', 
                    borderRadius: '4px',
                    marginBottom: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span style={{ fontSize: '14px' }}>{file.name}</span>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default PatientModal;
