import { config } from "@/configs/config";
import { PatientProfile } from "@/models/patient.model";
import { DynamoRepository } from "./dynamo.repo";
import { v4 as uuidv4 } from 'uuid';


export class PatientRepository extends DynamoRepository {

    constructor() {
        super(config.PATIENT_PROFILE_TABLE);
    }


    public async createPatientProfile(patientProfile: PatientProfile): Promise<PatientProfile | null> {
        patientProfile.id = uuidv4();
        const savingResult = await this.putItem(patientProfile);
        if (!savingResult) {
            return null;
        }
        return await this.findById(patientProfile.id);
    }


    public async findById(patientProfileId: string): Promise<PatientProfile | null> {
        const patientProfile = await this.getItem({ id: patientProfileId });
        if (!patientProfile) {
            return null;
        }
        return patientProfile as PatientProfile;
    }

    
}

