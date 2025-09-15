import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../configs/config';
import logger from '@/libs/logger';

class S3Repository {
    private s3Client: S3Client;
    private bucketName: string;

    constructor() {
        this.bucketName = config.S3_BUCKET_NAME;
        this.s3Client = new S3Client({
            region: config.AWS_REGION,
            credentials: {
                accessKeyId: config.AWS_ACCESS_KEY_ID,
                secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
            },
        });
    }


    public async uploadFile(file: Buffer, fileName: string, contentType: string): Promise<string> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileName,
                Body: file,
                ContentType: contentType,
            });

            await this.s3Client.send(command);
            return `https://${this.bucketName}.s3.${config.AWS_REGION}.amazonaws.com/${fileName}`;
        } 
        catch (error) {
            logger.error('Error uploading file:', error);
            throw error;
        }
    }


    public async uploadFileWithMetadata(
        file: Buffer, 
        fileName: string, 
        contentType: string,
        metadata?: Record<string, string>
    ): Promise<string> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileName,
                Body: file,
                ContentType: contentType,
                Metadata: metadata,
            });

            await this.s3Client.send(command);
            
            return `https://${this.bucketName}.s3.${config.AWS_REGION}.amazonaws.com/${fileName}`;
        } 
        catch (error) {
            logger.error('Error uploading file with metadata:', error);
            throw error;
        }
    }


    public async deleteFile(fileName: string): Promise<boolean> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: fileName,
            });

            await this.s3Client.send(command);
            return true;
        } 
        catch (error) {
            logger.error('Error deleting file:', error);
            return false;
        }
    }


    public async generateSignedUrl(fileName: string, expiresIn: number = 3600): Promise<string> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: fileName,
            });

            const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
            return signedUrl;
        } 
        catch (error) {
            logger.error('Error generating signed URL:', error);
            throw error;
        }
    }


    public async generatePresignedUploadUrl(fileName: string, contentType: string, expiresIn: number = 3600): Promise<string> {
        try {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileName,
                ContentType: contentType,
            });

            const presignedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
            return presignedUrl;
        } 
        catch (error) {
            logger.error('Error generating presigned upload URL:', error);
            throw error;
        }
    }


    public async fileExists(fileName: string): Promise<boolean> {
        try {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: fileName,
            });

            await this.s3Client.send(command);
            return true;
        } 
        catch (error) {
            logger.error('Error checking if file exists:', error);
            return false;
        }
    }

}

export const s3RepositoryInstance = new S3Repository();