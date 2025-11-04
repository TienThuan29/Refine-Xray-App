namespace AdminService.Repositories.S3
{
    public interface IS3Repository
    {
        Task<string> UploadFileAsync(byte[] file, string fileName, string contentType);
        Task<bool> DeleteFileAsync(string fileName);
    }
}

