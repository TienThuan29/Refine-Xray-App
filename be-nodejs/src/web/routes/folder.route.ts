import { authenticate, authorize, validateSystemSecret } from '@/web/middlewares/auth.middleware';
import { Router } from 'express';
import { Role } from '@/models/user.model';
import { FolderApi } from '../api/folder.api';

const router = Router();

const folderApi = new FolderApi();

router.post(
    '/create-folder', 
    authenticate, 
    authorize([Role.DOCTOR]), 
    folderApi.createFolder
);

router.put(
    '/update-patient-profile-id/:folderId', 
    authenticate, 
    authorize([Role.DOCTOR]), 
    folderApi.updatePatientProfileId
);

router.get(
    '/get/:folderId', 
    authenticate, 
    authorize([Role.DOCTOR]), 
    folderApi.findFolderById
);

router.get(
    '/get-all-created-by', 
    authenticate, 
    authorize([Role.DOCTOR]), 
    folderApi.getFolderOfUser
);

export default router;