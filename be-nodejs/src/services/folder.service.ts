import { FolderRequest } from "@/types/req/folder.type";
import { FolderRepository } from "../repositories/folder.repo";
import { Folder } from "@/models/folder.model";
import { PatientService } from "./patient.service";

export class FolderService {


    private folderRepository: FolderRepository;
    private patientService: PatientService;

    constructor() {
        this.patientService = new PatientService();
        this.folderRepository = new FolderRepository();
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
    

    public async findById(folderId: string): Promise<Folder | null> {
        return this.folderRepository.findById(folderId);
    }

    
}