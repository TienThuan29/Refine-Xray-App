import { config } from "@/configs/config";
import { DynamoRepository } from "./dynamo.repo";
import { User } from "@/models/user.model";
import { v4 as uuidv4 } from 'uuid';
import { hashString } from "@/libs/hashing";
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDB } from '@/configs/database';

export class UserRepository extends DynamoRepository {

    constructor() {
        super(config.USER_TABLE);
    }


    public async create(user: User): Promise<User | null> {
        user.id = uuidv4();
        user.password = hashString(user.password);
        user.isEnable = true;
        user.createdDate = new Date();
        
        // Convert Date objects to ISO strings for DynamoDB
        // console.log('Before converting to ISO strings: ', user);
        const userForDynamo = {
            ...user,
            createdDate: user.createdDate?.toISOString(),
            updatedDate: user.updatedDate?.toISOString(),
            lastLoginDate: user.lastLoginDate?.toISOString(),
            dateOfBirth: user.dateOfBirth ? (user.dateOfBirth instanceof Date ? user.dateOfBirth.toISOString() : user.dateOfBirth) : undefined
        };
        // console.log(`After converting to ISO strings: ${JSON.stringify(userForDynamo, null, 2)}`);
        
        const savingResult = await this.putItem(userForDynamo);
        if (!savingResult) {
            // console.log(`Failed to save user for Dynamo: ${userForDynamo}`);
            return null;
        }
        // console.log(`Saved user for Dynamo: ${userForDynamo}`);
        return await this.findById(user.id);
    }
    

    public async findById(userId: string): Promise<User | null> {
        const user = await this.getItem({ id: userId });
        if (!user) {
            return null;
        }
        
        // Convert ISO strings back to Date objects
        const userWithDates = {
            ...user,
            createdDate: user.createdDate ? new Date(user.createdDate) : undefined,
            updatedDate: user.updatedDate ? new Date(user.updatedDate) : undefined,
            lastLoginDate: user.lastLoginDate ? new Date(user.lastLoginDate) : undefined,
            dateOfBirth: user.dateOfBirth ? (user.dateOfBirth instanceof Date ? user.dateOfBirth : new Date(user.dateOfBirth)) : undefined
        };
        
        return userWithDates as User;
    }


    public async findByEmail(email: string): Promise<User | null> {
        console.log(`Finding user by email: ${email}`);
        
        // Use scan to find user by email since email is not the primary key
        const command = new ScanCommand({
            TableName: this.getTableName(),
            FilterExpression: 'email = :email',
            ExpressionAttributeValues: {
                ':email': email
            }
        });
        
        const result = await dynamoDB.send(command);
        const users = result.Items || [];
        
        if (users.length === 0) {
            console.log(`User not found for email: ${email}`);
            return null;
        }
        
        const user = users[0];
        console.log(`User found: ${user}`);
        
        // Convert ISO strings back to Date objects
        const userWithDates = {
            ...user,
            createdDate: user.createdDate ? new Date(user.createdDate) : undefined,
            updatedDate: user.updatedDate ? new Date(user.updatedDate) : undefined,
            lastLoginDate: user.lastLoginDate ? new Date(user.lastLoginDate) : undefined,
            dateOfBirth: user.dateOfBirth ? (user.dateOfBirth instanceof Date ? user.dateOfBirth : new Date(user.dateOfBirth)) : undefined
        };
        
        return userWithDates as User;
    }
}
