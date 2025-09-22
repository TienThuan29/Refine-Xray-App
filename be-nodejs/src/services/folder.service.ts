import { FolderRequest } from "@/types/req/folder.type";
import { FolderRepository } from "../repositories/folder.repo";
import { Folder } from "@/models/folder.model";
import { PatientService } from "./patient.service";
import { ChatSessionInfo, FolderResponse } from "@/types/res/folder.res";
import { ChatSessionRepository } from "@/repositories/chatsession.repo";

export class FolderService {


    private folderRepository: FolderRepository;
    private patientService: PatientService;
    private chatSessionRepository: ChatSessionRepository;

    constructor() {
        this.patientService = new PatientService();
        this.folderRepository = new FolderRepository();
        this.chatSessionRepository = new ChatSessionRepository();
    }

    
    public async createFolder(folderRequest: FolderRequest, createdBy: string): Promise<Folder | null> {
        const folder = {
            ...folderRequest,
            createdBy,
        } as Folder;
        return this.folderRepository.createFolder(folder);
    }


    public async updatePatientProfileId(folderId: string, patientProfileId: string): Promise<Folder | null> {
        const patientProfile = await this.patientService.findById(patientProfileId);
        if (!patientProfile) {
            throw new Error('Patient profile not found with id: ' + patientProfileId);
        }
        return this.folderRepository.updatePatientProfileId(folderId, patientProfileId);
    }


    public async getFolderOfUser(userId: string): Promise<FolderResponse[] | null> {
        const folders = await this.folderRepository.findFoldersByCreatedBy(userId) as Folder[];
        if (!folders) {
            return null;
        }
        // map folder to folder response
        const folderResponses: FolderResponse[] = folders.map(folder => ({
            id: folder.id,
            title: folder.title,
            description: folder.description,
            chatSessionIds: folder.chatSessionIds,
            patientProfileId: folder.patientProfileId,
            createdBy: folder.createdBy,
            isDeleted: folder.isDeleted,
            createdDate: folder.createdDate,
            updatedDate: folder.updatedDate,
            chatSessionsInfo: [],
        }));

        for (const folderResponse of folderResponses) {
            for (const chatSessionId of folderResponse.chatSessionIds || []) {
                const chatSession = await this.chatSessionRepository.findById(chatSessionId);
                if (chatSession) {
                    folderResponse.chatSessionsInfo?.push({
                        id: chatSession.id,
                        title: chatSession.title,
                        isDeleted: chatSession.isDeleted,
                        createdDate: chatSession.createdDate,
                        updatedDate: chatSession.updatedDate,
                    });
                }
            }
        }
        return folderResponses;
    }
    

    public async findById(folderId: string): Promise<Folder | null> {
        return this.folderRepository.findById(folderId);
    }

    
}