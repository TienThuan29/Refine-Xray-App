import { config } from "@/configs/config";
import { DynamoRepository } from "./dynamo.repo";
import { ReportTemplate } from "@/models/report.model";
import { v4 as uuidv4 } from 'uuid';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDB } from '@/configs/database';

export class ReportTemplateRepository extends DynamoRepository {

    constructor() {
        super(config.REPORT_TEMPLATE_TABLE);
    }

    public async create(reportTemplate: ReportTemplate): Promise<ReportTemplate | null> {
        reportTemplate.id = uuidv4();
        reportTemplate.isDeleted = false;
        reportTemplate.createdDate = new Date();

        const reportTemplateForDynamo = {
            ...reportTemplate,
            createdDate: this.convertDateToISOString(reportTemplate.createdDate),
            updatedDate: this.convertDateToISOString(reportTemplate.updatedDate)
        };
        
        const savingResult = await this.putItem(reportTemplateForDynamo);
        if (!savingResult) {
            return null;
        }
        return await this.findById(reportTemplate.id);
    }

    public async findById(templateId: string): Promise<ReportTemplate | null> {
        let reportTemplate = await this.getItem({ id: templateId });
        if (!reportTemplate) {
            return null;
        }
        
        reportTemplate = {
            ...reportTemplate,
            createdDate: this.convertISOStringToDate(reportTemplate.createdDate),
            updatedDate: this.convertISOStringToDate(reportTemplate.updatedDate)
        };
        
        return reportTemplate as ReportTemplate;
    }

    public async findByCreator(createBy: string): Promise<ReportTemplate[]> {
        const command = new ScanCommand({
            TableName: this.getTableName(),
            FilterExpression: 'createBy = :createBy AND isDeleted = :isDeleted',
            ExpressionAttributeValues: {
                ':createBy': createBy,
                ':isDeleted': false
            }
        });
        
        const result = await dynamoDB.send(command);
        const reportTemplates = result.Items || [];
        
        return reportTemplates.map(template => ({
            ...template,
            createdDate: this.convertISOStringToDate(template.createdDate),
            updatedDate: this.convertISOStringToDate(template.updatedDate)
        })) as ReportTemplate[];
    }

    public async findAll(): Promise<ReportTemplate[]> {
        const command = new ScanCommand({
            TableName: this.getTableName(),
            FilterExpression: 'isDeleted = :isDeleted',
            ExpressionAttributeValues: {
                ':isDeleted': false
            }
        });
        
        const result = await dynamoDB.send(command);
        const reportTemplates = result.Items || [];
        
        return reportTemplates.map(template => ({
            ...template,
            createdDate: this.convertISOStringToDate(template.createdDate),
            updatedDate: this.convertISOStringToDate(template.updatedDate)
        })) as ReportTemplate[];
    }

    public async update(templateId: string, updateData: Partial<ReportTemplate>): Promise<ReportTemplate | null> {
        updateData.updatedDate = new Date();
        
        const updateDataForDynamo = {
            ...updateData,
            updatedDate: this.convertDateToISOString(updateData.updatedDate)
        };
        
        const updateResult = await this.updateItem({ id: templateId }, updateDataForDynamo);
        if (!updateResult) {
            return null;
        }
        return await this.findById(templateId);
    }

    public async softDelete(templateId: string): Promise<boolean> {
        const updateData = {
            isDeleted: true,
            updatedDate: new Date()
        };
        
        const updateDataForDynamo = {
            ...updateData,
            updatedDate: this.convertDateToISOString(updateData.updatedDate)
        };
        
        return await this.updateItem({ id: templateId }, updateDataForDynamo);
    }

    public async hardDelete(templateId: string): Promise<boolean> {
        return await this.deleteItem({ id: templateId });
    }
}