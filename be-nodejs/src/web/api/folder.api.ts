import logger from "@/libs/logger";
import { ResponseUtil } from "@/libs/response";
import { AuthService } from "@/services/auth.service";
import { FolderService } from "@/services/folder.service";
import { FolderRequest } from "@/types/req/folder.type";
import { Request, Response } from "express";
export class FolderApi {

    private authService: AuthService;
    private folderService: FolderService;


    constructor() {
        this.authService = new AuthService();
        this.folderService = new FolderService();
        this.createFolder = this.createFolder.bind(this);
        this.updatePatientProfileId = this.updatePatientProfileId.bind(this);
        this.findFolderById = this.findFolderById.bind(this);
    }


    public async createFolder(request: Request, response: Response): Promise<void> {
        const user = await this.authService.getUserByToken(request.headers.authorization?.substring(7) ?? '');
        try {
            const folderRequest = request.body;
            const createdFolder = await this.folderService.createFolder(folderRequest, user!.id);
            ResponseUtil.success(response, createdFolder, 'Folder created successfully');
        }
        catch(error) {
            logger.error('Error creating folder:', error);
            ResponseUtil.error(response, 'Internal Server Error', 500, error as string);
        }
    }


    public async updatePatientProfileId(request: Request, response: Response): Promise<void> {
        const user = await this.authService.getUserByToken(request.headers.authorization ?? '');
        try {
            const folderId = request.params.folderId;
            const patientProfileId = request.body.patientProfileId;
            const updatedFolder = await this.folderService.updatePatientProfileId(folderId, patientProfileId);
            ResponseUtil.success(response, updatedFolder, 'Patient profile updated successfully');
        }
        catch(error) {
            logger.error('Error updating patient profile:', error);
            if (error instanceof Error && error.message.includes('Patient profile not found')) {
                ResponseUtil.error(response, error.message, 404, error.message);
            } else {
                ResponseUtil.error(response, 'Internal Server Error', 500, error as string);
            }
        }
    }

    public async findFolderById(request: Request, response: Response): Promise<void> {
        try {
            // Get path variable folderId
            const folderId = request.params.folderId;
            const folder = await this.folderService.findById(folderId);
            ResponseUtil.success(response, folder, 'Folder found successfully');
        }
        catch(error) {
            logger.error('Error finding folder by id:', error);
            ResponseUtil.error(response, 'Internal Server Error', 500, error as string);
        }
    }
}