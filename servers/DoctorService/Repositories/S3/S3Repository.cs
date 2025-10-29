using Amazon.S3;
using Amazon.S3.Model;

namespace DoctorService.Repositories.S3
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

        public async Task<string> UploadFileWithMetadataAsync(byte[] file, string fileName, string contentType, Dictionary<string, string>? metadata = null)
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

                if (metadata != null && metadata.Any())
                {
                    foreach (var kvp in metadata)
                    {
                        request.Metadata.Add(kvp.Key, kvp.Value);
                    }
                }

                var response = await _s3Client.PutObjectAsync(request);
                
                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    var fileUrl = $"https://{_bucketName}.s3.{_region}.amazonaws.com/{fileName}";
                    _logger.LogInformation("File with metadata uploaded successfully: {FileName}", fileName);
                    return fileUrl;
                }
                else
                {
                    throw new InvalidOperationException($"Failed to upload file with metadata. HTTP Status: {response.HttpStatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file with metadata: {FileName}", fileName);
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

        public async Task<string> GenerateSignedUrlAsync(string fileName, int expiresInSeconds = 3600)
        {
            try
            {
                var request = new GetPreSignedUrlRequest
                {
                    BucketName = _bucketName,
                    Key = fileName,
                    Verb = HttpVerb.GET,
                    Expires = DateTime.UtcNow.AddSeconds(expiresInSeconds)
                };

                var signedUrl = await _s3Client.GetPreSignedURLAsync(request);
                _logger.LogInformation("Signed URL generated for file: {FileName}", fileName);
                return signedUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating signed URL for file: {FileName}", fileName);
                throw;
            }
        }

        public async Task<string> GeneratePresignedUploadUrlAsync(string fileName, string contentType, int expiresInSeconds = 3600)
        {
            try
            {
                var request = new GetPreSignedUrlRequest
                {
                    BucketName = _bucketName,
                    Key = fileName,
                    Verb = HttpVerb.PUT,
                    Expires = DateTime.UtcNow.AddSeconds(expiresInSeconds)
                };

                request.Headers["Content-Type"] = contentType;

                var presignedUrl = await _s3Client.GetPreSignedURLAsync(request);
                _logger.LogInformation("Presigned upload URL generated for file: {FileName}", fileName);
                return presignedUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating presigned upload URL for file: {FileName}", fileName);
                throw;
            }
        }

        public async Task<bool> FileExistsAsync(string fileName)
        {
            try
            {
                var request = new GetObjectMetadataRequest
                {
                    BucketName = _bucketName,
                    Key = fileName
                };

                await _s3Client.GetObjectMetadataAsync(request);
                _logger.LogInformation("File exists: {FileName}", fileName);
                return true;
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                _logger.LogInformation("File does not exist: {FileName}", fileName);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if file exists: {FileName}", fileName);
                return false;
            }
        }
    }
}

