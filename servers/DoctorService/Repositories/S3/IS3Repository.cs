namespace DoctorService.Repositories.S3
{
    public interface IS3Repository
    {
        Task<string> UploadFileAsync(byte[] file, string fileName, string contentType);
        Task<string> UploadFileWithMetadataAsync(byte[] file, string fileName, string contentType, Dictionary<string, string>? metadata = null);
        Task<bool> DeleteFileAsync(string fileName);
        Task<string> GenerateSignedUrlAsync(string fileName, int expiresInSeconds = 3600);
        Task<string> GeneratePresignedUploadUrlAsync(string fileName, string contentType, int expiresInSeconds = 3600);
        Task<bool> FileExistsAsync(string fileName);
    }
}

