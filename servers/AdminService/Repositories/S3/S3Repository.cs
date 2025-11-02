using Amazon.S3;
using Amazon.S3.Model;

namespace AdminService.Repositories.S3
{
    public class S3Repository : IS3Repository
    {
        private readonly IAmazonS3 _s3Client;
        private readonly string _bucketName;
        private readonly string _region;
        private readonly ILogger<S3Repository> _logger;

        public S3Repository(
            IAmazonS3 s3Client,
            IConfiguration configuration,
            ILogger<S3Repository> logger)
        {
            _s3Client = s3Client;
            _bucketName = configuration["S3:BucketName"] ?? throw new InvalidOperationException("S3:BucketName is not configured");
            _region = configuration["AWS:Region"] ?? "us-east-1";
            _logger = logger;
        }

        public async Task<string> UploadFileAsync(byte[] file, string fileName, string contentType)
        {
            try
            {
                var request = new PutObjectRequest
                {
                    BucketName = _bucketName,
                    Key = fileName,
                    InputStream = new MemoryStream(file),
                    ContentType = contentType
                };

                var response = await _s3Client.PutObjectAsync(request);
                
                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    var fileUrl = $"https://{_bucketName}.s3.{_region}.amazonaws.com/{fileName}";
                    _logger.LogInformation("File uploaded successfully: {FileName}", fileName);
                    return fileUrl;
                }
                else
                {
                    throw new InvalidOperationException($"Failed to upload file. HTTP Status: {response.HttpStatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file: {FileName}", fileName);
                throw;
            }
        }

        public async Task<bool> DeleteFileAsync(string fileName)
        {
            try
            {
                var request = new DeleteObjectRequest
                {
                    BucketName = _bucketName,
                    Key = fileName
                };

                var response = await _s3Client.DeleteObjectAsync(request);
                
                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK || response.HttpStatusCode == System.Net.HttpStatusCode.NoContent)
                {
                    _logger.LogInformation("File deleted successfully: {FileName}", fileName);
                    return true;
                }
                else
                {
                    _logger.LogWarning("Failed to delete file. HTTP Status: {HttpStatusCode}, FileName: {FileName}", response.HttpStatusCode, fileName);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file: {FileName}", fileName);
                return false;
            }
        }
    }
}

