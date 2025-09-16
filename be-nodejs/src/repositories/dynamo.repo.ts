import {dynamoDB, dynamoDbInstance } from "@/configs/database";
import logger from "@/libs/logger";
import { 
    PutCommand, 
    GetCommand, 
    UpdateCommand, 
    DeleteCommand, 
    ScanCommand } 
from '@aws-sdk/lib-dynamodb';
import { DescribeTableCommand } from '@aws-sdk/client-dynamodb';

export class DynamoRepository {

    private tableName: string; 

    constructor(tableName: string) {
        this.tableName = dynamoDbInstance.getTableName(tableName);
        logger.info(`DynamoRepository initialized for table: ${this.tableName}`);
    }

    public getTableName(): string {
        return this.tableName;
    }

    public async tableExists(): Promise<boolean> {
        try {
            const command = new DescribeTableCommand({
                TableName: this.tableName,
            });
            await dynamoDbInstance.getDynamoDBClient().send(command);
            return true;
        } catch (error: any) {
            if (error.name === 'ResourceNotFoundException') {
                return false;
            }
            throw error;
        }
    }


    public async putItem(item: Record<string, any>): Promise<boolean> {
        try{
            const exists = await this.tableExists();
            if (!exists) {
                logger.error(`Table '${this.tableName}' does not exist`);
                throw new Error(`Table '${this.tableName}' does not exist. Please create the table first.`);
            }

            const command = new PutCommand({
                TableName: this.tableName,
                Item: item,
            });
            await dynamoDB.send(command);
            logger.info(`Successfully put item in table: ${this.tableName}`);
            return true;
        }
        catch(error: any) {
            logger.error("Error putting item:", error);
            if (error.message && error.message.includes('does not exist')) {
                throw error; 
            }

            throw new Error(`Failed to put item in table '${this.tableName}': ${error.message || error.name || 'Unknown error'}`);
        }
    }



    public async getItem(key: Record<string, any>): Promise<Record<string, any> | null> {
        if (!(await this.isExistKey(key))) {
            return null;
        }
        const command = new GetCommand({
            TableName: this.tableName,
            Key: key,
        });
        const result = await dynamoDB.send(command);
        // console.log(`Result: ${result}`);
        return result.Item || null;
    }


    public async isExistKey(key: Record<string, any>): Promise<boolean> {
        try {
            const command = new GetCommand({
                TableName: this.tableName,
                Key: key,
            });
            const result = await dynamoDB.send(command);
            return !!result.Item;
        } catch (error: any) {
            logger.error("Error checking if key exists:", error);
            return false;
        }
    }


    public async updateItem(key: Record<string, any>, updates: Record<string, any>): Promise<boolean> {
        try {
            const command = new UpdateCommand({
                TableName: this.tableName,
                Key: key,
                UpdateExpression: `SET ${Object.keys(updates).map(k => `#${k} = :${k}`).join(', ')}`,
                ExpressionAttributeNames: Object.keys(updates).reduce((acc, k) => ({ ...acc, [`#${k}`]: k }), {}),
                ExpressionAttributeValues: Object.keys(updates).reduce((acc, k) => ({ ...acc, [`:${k}`]: updates[k] }), {}),
            });
            await dynamoDB.send(command);
            return true;
        }
        catch(error) {
            logger.error("Error updating item:", error);
            return false;
        }
    }


    public async deleteItem(key: Record<string, any>): Promise<boolean> {
        try {
            const command = new DeleteCommand({
                TableName: this.tableName,
                Key: key,
            });
            await dynamoDB.send(command);
            return true;
        }
        catch(error) {
            logger.error("Error deleting item:", error);
            return false;
        }
    }


    public async scanItems(): Promise<Record<string, any>[]> {
        const command = new ScanCommand({
            TableName: this.tableName,
        });
        const result = await dynamoDB.send(command);
        return result.Items || [];
    }

}