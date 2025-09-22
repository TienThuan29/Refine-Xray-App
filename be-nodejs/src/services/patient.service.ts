import { PatientProfile } from "@/models/patient.model";
import { FolderRepository } from "@/repositories/folder.repo";
import { PatientRepository } from "@/repositories/patient.repo";
import { PatientProfileRequest } from "@/types/req/patient.type";

export class PatientService {

    private patientRepository: PatientRepository;
    private folderRepository: FolderRepository;

    constructor() {
        this.patientRepository = new PatientRepository();
        this.folderRepository = new FolderRepository();
    }

    
    public async createPatientProfile(
        folderId: string,
        patientProfileRequest: PatientProfileRequest
    ): Promise<PatientProfile | null> {

        const patientProfile = {
            ...patientProfileRequest,
        } as PatientProfile;
        
        const savedPatientProfile = await this.patientRepository.createPatientProfile(patientProfile);
        if (!savedPatientProfile) {
            return null;
        }

        await this.folderRepository.updatePatientProfileId(folderId, savedPatientProfile.id);
        return savedPatientProfile;
    }

    public async findById(patientProfileId: string): Promise<PatientProfile | null> {
        return this.patientRepository.findById(patientProfileId);
    }

}

