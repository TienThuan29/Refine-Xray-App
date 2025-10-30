'use client';

import React from 'react';
import { Modal, Button, Input } from 'antd';

interface RenameModalProps {
  visible: boolean;
  editingType: 'folder' | 'chatSession';
  selectedItem: { title: string; description?: string } | null;
  isRenaming: boolean;
  isRenamingChatSession: boolean;
  onCancel: () => void;
  onSubmit: (newTitle: string, newDescription?: string) => void;
}

const RenameModal: React.FC<RenameModalProps> = ({
  visible,
  editingType,
  selectedItem,
  isRenaming,
  isRenamingChatSession,
  onCancel,
  onSubmit
}) => {
  const handleSubmit = () => {
    const newTitle = (document.getElementById('rename-item-title') as HTMLInputElement)?.value || selectedItem?.title || '';
    const newDescription = editingType === 'folder' ? 
      (document.getElementById('rename-item-description') as HTMLInputElement)?.value || selectedItem?.description :
      undefined;
    onSubmit(newTitle, newDescription);
  };

  return (
    <Modal
      title={editingType === 'folder' ? 'Rename Folder' : 'Rename Chat Session'}
      open={visible}
      onCancel={onCancel}
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          loading={editingType === 'folder' ? isRenaming : isRenamingChatSession} 
          onClick={handleSubmit}
        >
          Rename
        </Button>
      ]}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {editingType === 'folder' ? 'Folder Name' : 'Chat Session Title'}
          </label>
          <Input
            id="rename-item-title"
            defaultValue={selectedItem?.title || ''}
            placeholder={editingType === 'folder' ? 'Enter folder name' : 'Enter chat session title'}
          />
        </div>
        {editingType === 'folder' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
            <Input.TextArea
              id="rename-item-description"
              defaultValue={selectedItem?.description || ''}
              placeholder="Enter folder description"
              rows={3}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RenameModal;
