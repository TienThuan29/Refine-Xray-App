'use client';

import React, { useState } from 'react';
import FolderModal from './folder-modal';
import PatientModal from './patient-modal';
import { PatientProfileRequest } from '../../types/patient';

interface NewChatModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateChat: (data: { title: string; description?: string; files: File[]; patientProfile: PatientProfileRequest }) => void;
}


const NewChatModal: React.FC<NewChatModalProps> = ({ visible, onClose, onCreateChat }) => {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [folderData, setFolderData] = useState<{ title: string; description?: string } | null>(null);

  const handleFolderCreated = (data: { title: string; description?: string }) => {
    setFolderData(data);
    setShowFolderModal(false);
    setShowPatientModal(true);
  };

  const handlePatientComplete = (data: { files: File[]; patientProfile: PatientProfileRequest }) => {
    if (folderData) {
      onCreateChat({
        title: folderData.title,
        description: folderData.description,
        files: data.files,
        patientProfile: data.patientProfile
      });
    }
    handleClose();
  };

  const handleClose = () => {
    setShowFolderModal(false);
    setShowPatientModal(false);
    setFolderData(null);
    onClose();
  };

  // Show folder modal when main modal opens
  React.useEffect(() => {
    if (visible) {
      setShowFolderModal(true);
    }
  }, [visible]);

  return (
    <>
      <FolderModal
        visible={showFolderModal}
        onClose={handleClose}
        onFolderCreated={handleFolderCreated}
      />
      <PatientModal
        visible={showPatientModal}
        onClose={handleClose}
        onComplete={(data) => handlePatientComplete({
          files: [],
          patientProfile: data.patientProfile
        })}
        folderData={folderData || { title: '', description: '', id: '' }}
      />
    </>
  );
};

export default NewChatModal;
