export type FileRequest = {
    file: Buffer;
    fileName: string;
    contentType?: string;
    metadata?: Record<string, string>;
}