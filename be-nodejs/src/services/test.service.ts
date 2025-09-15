import logger from "@/libs/logger";
import { TestItem } from "@/models/item.test.model";
import { DynamoRepository } from "@/repositories/dynamo.repo";

export class TestService {

    private tableName: string = 'test-item';
    private dynamoRepo: DynamoRepository;

    constructor() {
        this.dynamoRepo = new DynamoRepository(this.tableName);
    }

    async createTestItem(testItem: TestItem): Promise<TestItem> {
        try {
            logger.info(`Attempting to create test item in table: ${this.tableName}`);
            
            if (!testItem.id || !testItem.name) {
                throw new Error('Test item must have both id and name fields');
            }
            
            // Save object
            await this.dynamoRepo.putItem(testItem);

            logger.info(`Successfully created test item with id: ${testItem.id}`);
            return testItem;
        }
        catch(error: any) {
            logger.error("Error creating test item:", error);

            if (error.name === 'ResourceNotFoundException') {
                throw new Error(`DynamoDB table '${this.tableName}' not found. Please ensure the table exists and your AWS credentials are configured correctly.`);
            } 
            else if (error.name === 'AccessDeniedException') {
                throw new Error('Access denied to DynamoDB. Please check your AWS credentials and permissions.');
            } 
            else if (error.name === 'ValidationException') {
                throw new Error(`Validation error: ${error.message}`);
            } 
            else if (error.message) {
                throw new Error(`Failed to create test item: ${error.message}`);
            } 
            else {
                throw new Error('Failed to create test item due to an unknown error');
            }
        }
    }
    
}