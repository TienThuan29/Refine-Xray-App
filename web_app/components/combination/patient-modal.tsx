'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Select, Row, Col } from 'antd';
import { UserOutlined } from '@ant-design/icons';
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
        nation: values.nation || 'Vietnam'
      };
      
      const createdPatientProfile = await createPatientProfile(patientProfileData, folderData.id);
      
      if (createdPatientProfile) {
        // console.log('Patient profile created successfully:', createdPatientProfile);
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
        
        toast.success('Patient profile created successfully');
        // Don't call handleClose() here - let the parent handle the transition
      } else {
        toast.error('Failed to create patient profile');
      }
    } catch (error: unknown) {
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

  const handleValuesChange = (_changedValues: Record<string, string>, allValues: { fullname: string; gender: string; province: string; commune: string }) => {
    setFormValues(allValues);
  };


  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <UserOutlined />
          <span className="text-lg font-semibold">Patient Information</span>
        </div>
      }
      open={visible}
      onCancel={handleClose}
      maskClosable={false}
      width={800}
      footer={[
        <Button key="back" onClick={handleClose}>
          Back
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
          Next
        </Button>,
      ]}
    >
      {/* Folder Info Display */}
      <div style={{ marginBottom: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>
          Folder Information
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
            Patient Profile
          </h4>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="fullname"
                label="Full Name"
                rules={[
                  { required: true, message: 'Full name is required' },
                  { min: 2, message: 'Full name must be at least 2 characters' },
                  { max: 100, message: 'Full name cannot exceed 100 characters' }
                ]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gender"
                label="Gender"
                rules={[{ required: true, message: 'Gender is required' }]}
              >
                <Select placeholder="Select gender">
                  <Select.Option value="male">Male</Select.Option>
                  <Select.Option value="female">Female</Select.Option>
                  <Select.Option value="other">Other</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="Phone"
                rules={[
                  { pattern: /^[0-9+\-\s()]+$/, message: 'Invalid phone number' },
                  { max: 15, message: 'Phone number cannot exceed 15 characters' }
                ]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="houseNumber"
                label="House Number"
              >
                <Input placeholder="Enter house number" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="province"
                label="Province"
                rules={[{ required: true, message: 'Province is required' }]}
              >
                <Select 
                  placeholder="Select province"
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
                label="Commune"
                rules={[{ required: true, message: 'Commune is required' }]}
              >
                <Select 
                  placeholder="Select commune"
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
                label="Nation"
              >
                <Input disabled={true} placeholder="Nation" defaultValue="Vietnam" />
              </Form.Item>
            </Col>
          </Row>
        </div>

      </Form>
    </Modal>
  );
};

export default PatientModal;
