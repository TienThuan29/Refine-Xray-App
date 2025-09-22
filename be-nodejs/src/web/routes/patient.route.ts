import { authenticate, authorize, validateSystemSecret } from '@/web/middlewares/auth.middleware';
import { Router } from 'express';
import { Role } from '@/models/user.model';
import { PatientApi } from '../api/patient.api';

const router = Router();

const patientApi = new PatientApi();

router.post(
    '/create-profile/:folderId', 
    authenticate, 
    authorize([Role.DOCTOR]), 
    patientApi.createPatientProfile
);

export default router;