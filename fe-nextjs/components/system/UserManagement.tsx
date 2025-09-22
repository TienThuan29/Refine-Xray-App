'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  DatePicker,
  Space,
  Popconfirm,
  Card,
  Row,
  Col,
  Tag,
  Tooltip,
} from 'antd';
import { toast } from 'sonner';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UserProfile } from '@/types/user';
import dayjs from 'dayjs';

const { Option } = Select;

interface UserManagementProps {
  // Props có thể được mở rộng sau này
}

const UserManagement: React.FC<UserManagementProps> = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Mock data - thay thế bằng API call thực tế
  const mockUsers: UserProfile[] = [
    {
      email: 'admin@example.com',
      fullname: 'John Admin',
      phone: '0123456789',
      dateOfBirth: new Date('1990-01-01'),
      role: 'admin',
      isEnable: true,
      lastLoginDate: new Date('2024-01-15'),
      createdDate: new Date('2023-01-01'),
      updatedDate: new Date('2024-01-15'),
    },
    {
      email: 'doctor@example.com',
      fullname: 'Dr. Sarah Johnson',
      phone: '0987654321',
      dateOfBirth: new Date('1985-05-15'),
      role: 'doctor',
      isEnable: true,
      lastLoginDate: new Date('2024-01-14'),
      createdDate: new Date('2023-02-01'),
      updatedDate: new Date('2024-01-14'),
    },
    {
      email: 'technician@example.com',
      fullname: 'Mike Technician',
      phone: '0369258147',
      dateOfBirth: new Date('1992-08-20'),
      role: 'technician',
      isEnable: false,
      lastLoginDate: new Date('2024-01-10'),
      createdDate: new Date('2023-03-01'),
      updatedDate: new Date('2024-01-10'),
    },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // TODO: Thay thế bằng API call thực tế
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setUsers(mockUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error loading user list');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (email: string) => {
    try {
      // TODO: Thay thế bằng API call thực tế
      setUsers(users.filter(user => user.email !== email));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error deleting user');
    }
  };

  const handleToggleStatus = async (email: string) => {
    try {
      // TODO: Thay thế bằng API call thực tế
      setUsers(users.map(user => 
        user.email === email 
          ? { ...user, isEnable: !user.isEnable }
          : user
      ));
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Error updating status');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const userData: UserProfile = {
        ...values,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toDate() : undefined,
        role: values.role || 'user',
        isEnable: values.isEnable !== undefined ? values.isEnable : true,
        createdDate: editingUser ? editingUser.createdDate : new Date(),
        updatedDate: new Date(),
      };

      if (editingUser) {
        // Update user
        setUsers(users.map(user => 
          user.email === editingUser.email ? userData : user
        ));
        toast.success('User updated successfully');
      } else {
        // Add new user
        setUsers([...users, userData]);
        toast.success('User added successfully');
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Please check the information again');
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      admin: 'red',
      doctor: 'blue',
      technician: 'green',
      user: 'default',
    };
    return colors[role] || 'default';
  };

  const getRoleText = (role: string) => {
    const texts: { [key: string]: string } = {
      admin: 'Administrator',
      doctor: 'Doctor',
      technician: 'Technician',
      user: 'User',
    };
    return texts[role] || role;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullname.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      (user.phone && user.phone.includes(searchText));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isEnable) ||
      (statusFilter === 'inactive' && !user.isEnable);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const columns: ColumnsType<UserProfile> = [
    {
      title: 'Personal Information',
      key: 'personalInfo',
      width: 250,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
            <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {record.fullname}
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            <MailOutlined style={{ marginRight: 4 }} />
            {record.email}
          </div>
          {record.phone && (
            <div style={{ color: '#666', fontSize: '12px' }}>
              <PhoneOutlined style={{ marginRight: 4 }} />
              {record.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: string) => (
        <Tag color={getRoleColor(role)}>
          {getRoleText(role)}
        </Tag>
      ),
    },
    {
      title: 'Date of Birth',
      dataIndex: 'dateOfBirth',
      key: 'dateOfBirth',
      width: 120,
      render: (date: Date) => (
        <div>
          <CalendarOutlined style={{ marginRight: 4, color: '#1890ff' }} />
          {date ? dayjs(date).format('DD/MM/YYYY') : '-'}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isEnable',
      key: 'isEnable',
      width: 100,
      render: (isEnable: boolean, record) => (
        <Switch
          checked={isEnable}
          onChange={() => handleToggleStatus(record.email)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLoginDate',
      key: 'lastLoginDate',
      width: 150,
      render: (date: Date) => (
        <div>
          {date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-'}
        </div>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdDate',
      key: 'createdDate',
      width: 120,
      render: (date: Date) => (
        <div>
          {date ? dayjs(date).format('DD/MM/YYYY') : '-'}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Confirm Delete"
            description="Are you sure you want to delete this user?"
            onConfirm={() => handleDelete(record.email)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Tooltip title="Delete">
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="User Management" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search by name, email, phone number"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Role"
              value={roleFilter}
              onChange={setRoleFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Roles</Option>
              <Option value="admin">Administrator</Option>
              <Option value="doctor">Doctor</Option>
              <Option value="technician">Technician</Option>
              <Option value="user">User</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Add User
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadUsers}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="email"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={editingUser ? 'Edit User' : 'Add New User'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
        okText="Save"
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ isEnable: true }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Full Name"
                name="fullname"
                rules={[
                  { required: true, message: 'Please enter full name' },
                  { min: 2, message: 'Full name must be at least 2 characters' },
                ]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Invalid email format' },
                ]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[
                  { pattern: /^\d{10,11}$/, message: 'Invalid phone number format' },
                ]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Date of Birth"
                name="dateOfBirth"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="Select date of birth"
                  format="DD/MM/YYYY"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Role"
                name="role"
                rules={[{ required: true, message: 'Please select a role' }]}
              >
                <Select placeholder="Select role">
                  <Option value="admin">Administrator</Option>
                  <Option value="doctor">Doctor</Option>
                  <Option value="technician">Technician</Option>
                  <Option value="user">User</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Status"
                name="isEnable"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="Active"
                  unCheckedChildren="Inactive"
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
