'use client';

import React from 'react';
import { Modal, Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

interface DeleteConfirmModalProps {
  visible: boolean;
  editingType: 'folder' | 'chatSession';
  selectedItem: { title: string } | null;
  isDeleting: boolean;
  isDeletingChatSession: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  visible,
  editingType,
  selectedItem,
  isDeleting,
  isDeletingChatSession,
  onCancel,
  onConfirm
}) => {
  return (
    <Modal
      title={editingType === 'folder' ? 'Delete Folder' : 'Delete Chat Session'}
      open={visible}
      onCancel={onCancel}
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="delete" 
          type="primary" 
          danger 
          loading={editingType === 'folder' ? isDeleting : isDeletingChatSession} 
          onClick={onConfirm}
        >
          Delete
        </Button>
      ]}
    >
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <DeleteOutlined className="text-red-500 text-2xl" />
          <div>
            <p className="text-gray-900 font-medium">
              Are you sure you want to delete this {editingType === 'folder' ? 'folder' : 'chat session'}?
            </p>
            <p className="text-gray-600 text-sm mt-1">
              {editingType === 'folder' ? 'Folder' : 'Chat Session'}: <span className="font-medium">{selectedItem?.title}</span>
            </p>
            <p className="text-red-600 text-sm mt-2">
              This action cannot be undone.
              {editingType === 'folder' ? ' All chat sessions in this folder will also be deleted.' : ''}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal;
