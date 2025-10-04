import { config } from "@/configs/config";
import { DynamoRepository } from "./dynamo.repo";
import { User } from "@/models/user.model";
import { v4 as uuidv4 } from 'uuid';
import { hmacSha256 } from "@/libs/hashing";
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDB } from '@/configs/database';

export class UserRepository extends DynamoRepository {

    constructor() {
        super(config.USER_TABLE);
    }


    public async create(user: User): Promise<User | null> {
        user.id = uuidv4();
        user.password = await hmacSha256(user.password);
        // Role will be set to default 'user' and not hashed
        user.isEnable = true;
        user.createdDate = new Date();

        // Convert string dates to Date objects if needed
        if (user.dateOfBirth && typeof user.dateOfBirth === 'string') {
            user.dateOfBirth = new Date(user.dateOfBirth);
        }

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

    public async findAll(): Promise<User[]> {
        const command = new ScanCommand({
            TableName: this.getTableName()
        });
        
        const result = await dynamoDB.send(command);
        const users = result.Items || [];
        
        return users.map(user => ({
            ...user,
            createdDate: this.convertISOStringToDate(user.createdDate),
            updatedDate: this.convertISOStringToDate(user.updatedDate),
            lastLoginDate: this.convertISOStringToDate(user.lastLoginDate),
            dateOfBirth: this.convertISOStringToDate(user.dateOfBirth)
        })) as User[];
    }

    public async update(userId: string, updateData: Partial<User>): Promise<User | null> {
        const existingUser = await this.findById(userId);
        if (!existingUser) {
            return null;
        }

        // Convert string dates to Date objects if needed
        const processedUpdateData = { ...updateData };
        if (updateData.dateOfBirth && typeof updateData.dateOfBirth === 'string') {
            processedUpdateData.dateOfBirth = new Date(updateData.dateOfBirth);
        }

        const updatedUser = {
            ...existingUser,
            ...processedUpdateData,
            updatedDate: new Date()
        };

        // Hash password if it's being updated
        if (updateData.password) {
            updatedUser.password = await hmacSha256(updateData.password);
        }

        const userForDynamo = {
            ...updatedUser,
            createdDate: this.convertDateToISOString(updatedUser.createdDate),
            updatedDate: this.convertDateToISOString(updatedUser.updatedDate),
            lastLoginDate: this.convertDateToISOString(updatedUser.lastLoginDate),
            dateOfBirth: this.convertDateToISOString(updatedUser.dateOfBirth)
        };

        const updateResult = await this.putItem(userForDynamo);
        if (!updateResult) {
            return null;
        }

        return await this.findById(userId);
    }

    public async delete(userId: string): Promise<boolean> {
        const existingUser = await this.findById(userId);
        if (!existingUser) {
            return false;
        }

        return await this.deleteItem({ id: userId });
    }

    public async updateStatus(userId: string, isEnable: boolean): Promise<User | null> {
        return await this.update(userId, { isEnable });
    }
}
