import { config } from "../configs/config";
import { DynamoRepository } from "./dynamo.repo";
import { v4 as uuidv4 } from 'uuid';
import { Folder } from "../models/folder.model";
import { publicDecrypt } from "crypto";
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDB } from '../configs/database';
import logger from '../libs/logger';


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


    public async findFoldersByCreatedBy(createdBy: string): Promise<Folder[] | null> {
        try {
            const command = new ScanCommand({
                TableName: this.getTableName(),
                FilterExpression: 'createdBy = :createdBy AND isDeleted = :isDeleted',
                ExpressionAttributeValues: {
                    ':createdBy': createdBy,
                    ':isDeleted': false
                }
            });
            const result = await dynamoDB.send(command);
            
            if (!result.Items || result.Items.length === 0) {
                return [];
            }

            // Convert the items to Folder objects and handle date conversion
            const folders: Folder[] = result.Items.map(item => ({
                ...item,
                createdDate: this.convertISOStringToDate(item.createdDate),
                updatedDate: this.convertISOStringToDate(item.updatedDate)
            })) as Folder[];

            return folders;
        } catch (error) {
            logger.error("Error finding folders by createdBy:", error);
            return null;
        }
    }


    public async addChatSessionId(folderId: string, chatSessionId: string): Promise<Folder | null> {
        const folder = await this.findById(folderId);
        if (!folder) {
            return null;
        }
        folder.chatSessionIds = [...(folder.chatSessionIds || []), chatSessionId];
        
        folder.updatedDate = new Date();
        const savingResult = await this.updateItem(
            { id: folderId }, 
            { 
                chatSessionIds: folder.chatSessionIds, 
                updatedDate: this.convertDateToISOString(folder.updatedDate) 
            }
        );
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