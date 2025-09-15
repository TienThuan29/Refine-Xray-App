import { s3RepositoryInstance } from "@/repositories/s3.repo";

export class S3Service {

    private s3Repository = s3RepositoryInstance;

    public async uploadFile(file: Buffer, fileName: string, contentType: string): Promise<string> {
        return this.s3Repository.uploadFile(file, fileName, contentType);
    }

    public async uploadFileWithMetadata(file: Buffer, fileName: string, contentType: string, metadata: Record<string, string>): Promise<string> {
        return this.s3Repository.uploadFileWithMetadata(file, fileName, contentType, metadata);
    }
    
    public async deleteFile(fileName: string): Promise<boolean> {
        return this.s3Repository.deleteFile(fileName);
    }

    public async generateSignedUrl(fileName: string): Promise<string> {
        return this.s3Repository.generateSignedUrl(fileName);
    }
    
    public async generatePresignedUploadUrl(fileName: string, contentType: string): Promise<string> {
        return this.s3Repository.generatePresignedUploadUrl(fileName, contentType);
    }

    public async fileExists(fileName: string): Promise<boolean> {
        return this.s3Repository.fileExists(fileName);
    }
    
}