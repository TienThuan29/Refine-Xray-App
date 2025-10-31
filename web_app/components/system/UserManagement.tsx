'use client';

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
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
import { useUserService, CreateUserData, UpdateUserData } from '@/hooks/useUserService';
import { useAuth } from '@/contexts/AuthContext';
import { useRoleValidator, validateUserRole } from '@/hooks/useRoleValidator';
import dayjs from 'dayjs';

const { Option } = Select;

interface UserManagementProps {
  // Props can be extended later if needed
  className?: string;
}

const UserManagement: React.FC<UserManagementProps> = () => {
  const { authTokens } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
  const [userToToggle, setUserToToggle] = useState<UserProfile | null>(null);
  const { isPatient, isDoctor, isAdmin } = useRoleValidator(useAuth().user);
  const { getAllUsers, createUser, updateUser, deleteUser, updateUserStatus } = useUserService();

  // Removed mock data - now using real API calls

  useEffect(() => {
    if (authTokens) {
      loadUsers();
    }
  }, [authTokens, getAllUsers]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersData = await getAllUsers(authTokens);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
      if (error instanceof Error && error.message === 'Authentication required') {
        toast.error('Session expired. Please login again.');
      } else {
        toast.error('Error loading user list');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    // Check if user has permission to add users
    if (!isAdmin) {
      toast.error('You do not have permission to add users');
      return;
    }
    
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (user: UserProfile) => {
    // Check if user has permission to edit users
    if (!isAdmin) {
      toast.error('You do not have permission to edit users');
      return;
    }
    
    setEditingUser(user);
    
    form.setFieldsValue({
      ...user,
      dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (user: UserProfile) => {
    // Check if user has permission to delete users
    if (!isAdmin) {
      toast.error('You do not have permission to delete users');
      return;
    }
    
    try {
      await deleteUser(user.email, authTokens);
      setUsers(users.filter(u => u.email !== user.email));
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error deleting user');
    }
  };

  const handleToggleStatusClick = (user: UserProfile) => {
    // Check if user has permission to toggle user status
    if (!isAdmin) {
      toast.error('You do not have permission to change user status');
      return;
    }
    
    setUserToToggle(user);
    setIsStatusModalVisible(true);
  };

  const handleToggleStatusConfirm = async () => {
    if (!userToToggle) return;
    
    try {
      const updatedUser = await updateUserStatus(userToToggle.email, { isEnable: !userToToggle.isEnable }, authTokens);
      setUsers(users.map(u => 
        u.email === userToToggle.email ? updatedUser : u
      ));
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error('Error updating status');
    } finally {
      setIsStatusModalVisible(false);
      setUserToToggle(null);
    }
  };

  const handleToggleStatusCancel = () => {
    setIsStatusModalVisible(false);
    setUserToToggle(null);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        // Update user
        const updateData: UpdateUserData = {
          fullname: values.fullname,
          email: values.email,
          phone: values.phone,
          dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : undefined,
          password: values.password,
        };
        
        
        const updatedUser = await updateUser(editingUser.email, updateData, authTokens);
        setUsers(users.map(user => 
          user.email === editingUser.email ? updatedUser : user
        ));
        toast.success('User updated successfully');
      } else {
        // Add new user
        const createData: CreateUserData = {
          fullname: values.fullname,
          email: values.email,
          password: values.password,
          phone: values.phone,
          dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : undefined,
          role: 'user', // Default role for new users
        };
        
        const newUser = await createUser(createData, authTokens);
        setUsers([...users, newUser]);
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
    // Simple role color mapping without async validation
    if (role === 'SYSTEM' || role.includes('system')) return 'purple';
    if (role === 'ADMIN' || role.includes('admin')) return 'red';
    if (role === 'DOCTOR' || role.includes('doctor')) return 'blue';
    
    return 'default'; // Fallback color
  };

  const getRoleText = (role: string) => {
    // Simple role text mapping without async validation
    if (role === 'SYSTEM' || role.includes('system')) return 'System';
    if (role === 'ADMIN' || role.includes('admin')) return 'Administrator';
    if (role === 'DOCTOR' || role.includes('doctor')) return 'Doctor';
    
    return 'User'; // Fallback to User if not found
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullname.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase()) ||
      user.phone?.includes(searchText);
    
    const matchesRole = roleFilter === 'all' || (() => {
      const role = user.role;
      
      if (roleFilter === 'ADMIN') return role === 'ADMIN' || role.includes('admin');
      if (roleFilter === 'DOCTOR') return role === 'DOCTOR' || role.includes('doctor');
      if (roleFilter === 'SYSTEM') return role === 'SYSTEM' || role.includes('system');
      if (roleFilter === 'user') return role === 'user' || (!role.includes('admin') && !role.includes('doctor') && !role.includes('system'));
      
      return false;
    })();
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
      render: (isEnable: boolean) => (
        <Tag color={isEnable ? 'green' : 'red'}>
          {isEnable ? 'Active' : 'Inactive'}
        </Tag>
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
      width: 180,
      render: (_, record) => (
        <Space>
          {isAdmin && (
            <Tooltip title="Edit">
              <Button
                type="primary"
                icon={<EditOutlined />}
                size="small"
                onClick={() => handleEdit(record)}
              />
            </Tooltip>
          )}
          {isAdmin && (
            <Tooltip title={record.isEnable ? "Deactivate User" : "Activate User"}>
              <Button
                type={record.isEnable ? "default" : "primary"}
                danger={record.isEnable}
                size="small"
                onClick={() => handleToggleStatusClick(record)}
              >
                {record.isEnable ? "Deactivate" : "Activate"}
              </Button>
            </Tooltip>
          )}
          {isAdmin && (
            <Popconfirm
              title="Confirm Delete"
              description="Are you sure you want to delete this user?"
              onConfirm={() => handleDelete(record)}
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
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card title="User Management" style={{ marginBottom: 16 }}>
        {/* Display current user role info */}
        <div style={{ marginBottom: 16, padding: '8px 12px', backgroundColor: '#f0f2f5', borderRadius: '6px' }}>
          <span style={{ fontWeight: 'bold' }}>Your Role: </span>
          {isAdmin && <Tag color="red">Admin</Tag>}
          {isDoctor && <Tag color="blue">Doctor</Tag>}
          {!isAdmin && !isDoctor && <Tag color="default">User</Tag>}
        </div>
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
              <Option value="ADMIN">Admin</Option>
              <Option value="DOCTOR">Doctor</Option>
              <Option value="SYSTEM">System</Option>
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
              {isAdmin && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  Add User
                </Button>
              )}
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
        maskClosable={false}
        width={600}
        okText="Save"
        cancelText="Cancel"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{}}
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

        </Form>
      </Modal>

      {/* Status Toggle Confirmation Modal */}
      <Modal
        title="Confirm Status Change"
        open={isStatusModalVisible}
        onOk={handleToggleStatusConfirm}
        onCancel={handleToggleStatusCancel}
        okText="Confirm"
        cancelText="Cancel"
        okButtonProps={{
          danger: userToToggle?.isEnable ? false : true,
          type: userToToggle?.isEnable ? 'default' : 'primary'
        }}
      >
        <p>
          Are you sure you want to {userToToggle?.isEnable ? 'deactivate' : 'activate'} user{' '}
          <strong>{userToToggle?.fullname}</strong> ({userToToggle?.email})?
        </p>
        {userToToggle?.isEnable && (
          <p style={{ color: '#ff4d4f', marginTop: 8 }}>
            Deactivating this user will prevent them from logging into the system.
          </p>
        )}
        {!userToToggle?.isEnable && (
          <p style={{ color: '#52c41a', marginTop: 8 }}>
            Activating this user will allow them to log into the system.
          </p>
        )}
      </Modal>
    </div>
  );
};

export default UserManagement;
