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

        const userForDynamo = {
            ...user,
            createdDate: this.convertDateToISOString(user.createdDate),
            updatedDate: this.convertDateToISOString(user.updatedDate),
            lastLoginDate: this.convertDateToISOString(user.lastLoginDate),
            dateOfBirth: this.convertDateToISOString(user.dateOfBirth)
        };
        
        const savingResult = await this.putItem(userForDynamo);
        if (!savingResult) {
            return null;
        }
        return await this.findById(user.id);
    }
    

    public async findById(userId: string): Promise<User | null> {
        let user = await this.getItem({ id: userId });
        if (!user) {
            return null;
        }
        
        user = {
            ...user,
            createdDate: this.convertISOStringToDate(user.createdDate),
            updatedDate: this.convertISOStringToDate(user.updatedDate),
            lastLoginDate: this.convertISOStringToDate(user.lastLoginDate),
            dateOfBirth: this.convertISOStringToDate(user.dateOfBirth)
        };
        
        return user as User;
    }


    public async findByEmail(email: string): Promise<User | null> {

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
            return null;
        }
        
        let user = users[0];
        user = {
            ...user,
            createdDate: this.convertISOStringToDate(user.createdDate),
            updatedDate: this.convertISOStringToDate(user.updatedDate),
            lastLoginDate: this.convertISOStringToDate(user.lastLoginDate),
            dateOfBirth: this.convertISOStringToDate(user.dateOfBirth)
        };
        
        return user as User;
    }
}
