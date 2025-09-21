import { ResponseUtil } from "@/libs/response";
import { PatientService } from "@/services/patient.service";
import { PatientProfileRequest } from "@/types/req/patient.type";
import { Request, Response } from "express";
import logger from "@/libs/logger";

export class PatientApi {

    private patientService: PatientService;

    constructor() {
        this.patientService = new PatientService();
        this.createPatientProfile = this.createPatientProfile.bind(this);
    }

    public async createPatientProfile(request: Request, response: Response): Promise<void> {
        try {
            const patientProfile = request.body as PatientProfileRequest;
            const createdPatientProfile = await this.patientService.createPatientProfile(patientProfile);
            ResponseUtil.success(response, createdPatientProfile, 'Patient profile created successfully');
        }
        catch (error) {
            logger.error('Error creating patient profile:', error);
            ResponseUtil.error(response, 'Internal Server Error', 500, error as string);
        }
    }
}