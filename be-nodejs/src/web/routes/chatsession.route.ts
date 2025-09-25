
import { authenticate, authorize } from '@/web/middlewares/auth.middleware';
import { uploadXrayImage } from '@/web/middlewares/upload.middleware';
import { Router } from 'express';
import { Role } from '@/models/user.model';
import { ChatSessionApi } from '../api/chatsession.api';

const router = Router();

const chatsessionApi = new ChatSessionApi();

router.post(
    '/analyze-and-create-chatsession', 
    authenticate, 
    authorize([Role.DOCTOR]), 
    uploadXrayImage,
    chatsessionApi.createChatSession
);

router.get(
    '/get/:chatSessionId',
    authenticate,
    authorize([Role.DOCTOR]),
    chatsessionApi.getChatSessionById
);

router.post(
    '/:chatSessionId/chat',
    authenticate,
    authorize([Role.DOCTOR]),
    chatsessionApi.sendChatMessage
);

export default router;