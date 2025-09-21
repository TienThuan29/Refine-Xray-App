'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Select, Row, Col } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from "sonner";
import { useVietnamAddress } from '../../hooks/useVietnamAddress';
import { PatientProfileRequest } from '../../types/patient';
import usePatientProfileManager from '../../hooks/usePatientProfileManager';

interface PatientModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (data: { patientProfile: PatientProfileRequest }) => void;
  folderData: { id: string; title: string; description?: string };
}

const PatientModal: React.FC<PatientModalProps> = ({ visible, onClose, onComplete, folderData }) => {
  const { t, language } = useLanguage();
  const [form] = Form.useForm();
  const [formValues, setFormValues] = useState({ 
    fullname: '', 
    gender: '', 
    province: '', 
    commune: '' 
  });
  const { provinces, communesOfProvince, loadingProvinces, loadingCommunes, getProvinces, getCommunesOfProvince } = useVietnamAddress();
  const { createPatientProfile, isCreating, error, clearError } = usePatientProfileManager();

  useEffect(() => {
    if (visible) {
      getProvinces();
    }
  }, [visible, getProvinces]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      clearError(); // Clear any previous errors
      
      const patientProfileData = {
        fullname: values.fullname,
        gender: values.gender,
        phone: values.phone,
        houseNumber: values.houseNumber,
        commune: values.commune && Array.isArray(communesOfProvince) ? communesOfProvince.find(c => c.code === values.commune) : undefined,
        province: values.province && Array.isArray(provinces) ? provinces.find(p => p.code === values.province) : undefined,
        nation: values.nation || (language === 'vi' ? 'Việt Nam' : 'Vietnam')
      };
      
      const createdPatientProfile = await createPatientProfile(patientProfileData, folderData.id);
      
      if (createdPatientProfile) {
        console.log('Patient profile created successfully:', createdPatientProfile);
        const patientProfile: PatientProfileRequest = {
          fullname: createdPatientProfile.fullname,
          gender: createdPatientProfile.gender,
          phone: createdPatientProfile.phone,
          houseNumber: createdPatientProfile.houseNumber,
          commune: createdPatientProfile.commune,
          province: createdPatientProfile.province,
          nation: createdPatientProfile.nation
        };
        
        console.log('Calling onComplete with patient profile:', patientProfile);
        onComplete({
          patientProfile
        });
        
        toast.success(t('newChat.createSuccess'));
        // Don't call handleClose() here - let the parent handle the transition
      } else {
        toast.error(t('newChat.createError') || 'Failed to create patient profile');
      }
    } catch (error: any) {
      console.error('Validation failed:', error);
      if (error) {
        toast.error('Failed to create patient profile');
      }
    }
  };

  const handleClose = () => {
    form.resetFields();
    setFormValues({ fullname: '', gender: '', province: '', commune: '' });
    onClose();
  };

  const handleValuesChange = (changedValues: any, allValues: any) => {
    setFormValues(allValues);
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
          key="next" 
          type="primary" 
          loading={isCreating}
          onClick={handleSubmit}
          disabled={
            !formValues.fullname?.trim() ||
            !formValues.gender ||
            !formValues.province ||
            !formValues.commune ||
            isCreating
          }
        >
          {t('newChat.next')}
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

      </Form>
    </Modal>
  );
};

export default PatientModal;
