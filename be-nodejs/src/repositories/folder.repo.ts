import { config } from "../configs/config";
import { DynamoRepository } from "./dynamo.repo";
import { v4 as uuidv4 } from 'uuid';
import { Folder } from "../models/folder.model";


export class FolderRepository extends DynamoRepository {

    constructor() {
        super(config.FOLDER_TABLE);
    }

    public async createFolder(folder: Folder): Promise<Folder | null> {
        folder.id = uuidv4();
        folder.patientProfileId = null;
        folder.createdDate = new Date();
        folder.updatedDate = new Date();
        folder.isDeleted = false;
        const savingResult = await this.putItem({
            ...folder,
            createdDate: this.convertDateToISOString(folder.createdDate),
            updatedDate: this.convertDateToISOString(folder.updatedDate)
        });
        if (!savingResult) {
            return null;
        }
        return await this.findById(folder.id);
    }   


    public async updatePatientProfileId(folderId: string, patientProfileId: string): Promise<Folder | null> {
        const folder = await this.findById(folderId);
        if (!folder) {
            return null;
        }

        folder.patientProfileId = patientProfileId;
        folder.updatedDate = new Date();
        const savingResult = await this.updateItem(
            { id: folderId }, 
            { patientProfileId: patientProfileId, updatedDate: this.convertDateToISOString(folder.updatedDate) });
        if (!savingResult) {
            return null;
        }
        return await this.findById(folderId);
    }

    
    public async findById(folderId: string): Promise<Folder | null> {
        let folder = await this.getItem({ id: folderId });
        if (!folder) {
            return null;
        }
        folder = {
            ...folder,
            createdDate: this.convertISOStringToDate(folder.createdDate),
            updatedDate: this.convertISOStringToDate(folder.updatedDate)
        };
        return folder as Folder;
    }
    
}