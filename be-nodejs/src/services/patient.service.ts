import { PatientProfile } from "@/models/patient.model";
import { PatientRepository } from "@/repositories/patient.repo";
import { PatientProfileRequest } from "@/types/req/patient.type";

export class PatientService {

    private patientRepository: PatientRepository;

    constructor() {
        this.patientRepository = new PatientRepository();
    }

    
    public async createPatientProfile(patientProfileRequest: PatientProfileRequest): Promise<PatientProfile | null> {
        const patientProfile = {
            ...patientProfileRequest,
        } as PatientProfile;
        return this.patientRepository.createPatientProfile(patientProfile);
    }

    public async findById(patientProfileId: string): Promise<PatientProfile | null> {
        return this.patientRepository.findById(patientProfileId);
    }

}

