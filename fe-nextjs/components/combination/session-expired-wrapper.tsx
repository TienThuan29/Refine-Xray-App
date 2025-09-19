'use client';

import { useAuth } from '@/contexts/AuthContext';
import SessionExpiredModal from './session-expired-modal';

const SessionExpiredWrapper = () => {
  const { sessionExpired, handleSessionExpired } = useAuth();

  return (
    <SessionExpiredModal 
      visible={sessionExpired} 
      onConfirm={handleSessionExpired}
    />
  );
};

export default SessionExpiredWrapper;
