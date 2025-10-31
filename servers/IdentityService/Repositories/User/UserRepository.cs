using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using IdentityService.Models;
using IdentityService.Utils;
using System.Globalization;
using System.Net;

namespace IdentityService.Repositories.User 
{
    public class UserRepository : DynamoRepository, IUserRepository
    {
        private readonly string _userTableName;
        private readonly IConfiguration _configuration;

        public UserRepository(
            IAmazonDynamoDB dynamoDbClient, 
            IConfiguration configuration, 
            ILogger<UserRepository> logger
        ) : base(dynamoDbClient, configuration, logger)
        {
            _configuration = configuration;
            _userTableName = configuration["DynamoDB:UserTable"] ?? "";
            
            // Log repository initialization with AWS region and table name
            var awsRegion = configuration["AWS:Region"] ?? "Not configured";
            logger.LogInformation("UserRepository initialized - Region: {Region}, Table: {Table}", awsRegion, _userTableName);
        }

        public async Task<Models.User?> CreateAsync(Models.User user)
        {
            try
            {
                user.Id = Guid.NewGuid().ToString();
                user.Password = HashingUtil.HashString(user.Password, _configuration);
                user.IsEnable = true;
                user.CreatedDate = DateTime.UtcNow;
                user.UpdatedDate = DateTime.UtcNow;
                // map and save user
                var dynamoItem = DynamoMapper.UserToDynamoItem(user);
                var response = await PutItemAsync(dynamoItem, _userTableName);
                
                if (response.HttpStatusCode == HttpStatusCode.OK)
                {
                    return await FindByIdAsync(user.Id);
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user");
                throw;
            }
        }

        public async Task<Models.User?> FindByIdAsync(string userId)
        {
            try
            {
                var key = DynamoMapper.CreateKey(userId);
                var response = await GetItemAsync(key, _userTableName);
                
                if (response.Item.Count == 0)
                {
                    return null;
                }
                
                return DynamoMapper.DynamoItemToUser(response.Item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding user by ID: {UserId}", userId);
                throw;
            }
        }

        public async Task<Models.User?> FindByEmailAsync(string email)
        {
            try
            {
                // Log DynamoDB operation details
                var region = _configuration["AWS:Region"] ?? "Unknown";
                var regionEndpoint = _dynamoDBClient.Config.RegionEndpoint?.SystemName ?? "Unknown";
                _logger.LogInformation("Finding user by email - Region: {Region} ({RegionEndpoint}), Table: {Table}, Email: {Email}", 
                    region, regionEndpoint, _userTableName, email);
                
                var scanRequest = new ScanRequest
                {
                    TableName = _userTableName,
                    FilterExpression = "email = :email",
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":email"] = new AttributeValue { S = email }
                    }
                };

                var response = await _dynamoDBClient.ScanAsync(scanRequest);
                
                if (response.Items.Count == 0)
                {
                    return null;
                }
                
                return DynamoMapper.DynamoItemToUser(response.Items[0]);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding user by email: {Email}", email);
                throw;
            }
        }

        public async Task<List<Models.User>> FindAllAsync()
        {
            try
            {
                var scanRequest = new ScanRequest
                {
                    TableName = _userTableName
                };

                var response = await _dynamoDBClient.ScanAsync(scanRequest);
                
                return response.Items.Select(item => DynamoMapper.DynamoItemToUser(item)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding all users");
                throw;
            }
        }

        public async Task<Models.User?> UpdateAsync(string userId, Models.User updateData)
        {
            try
            {
                var existingUser = await FindByIdAsync(userId);
                if (existingUser == null)
                {
                    return null;
                }

                // Update fields
                existingUser.Email = updateData.Email;
                existingUser.Fullname = updateData.Fullname;
                existingUser.Phone = updateData.Phone;
                existingUser.DateOfBirth = updateData.DateOfBirth;
                existingUser.Role = updateData.Role;
                existingUser.IsEnable = updateData.IsEnable;
                existingUser.LastLoginDate = updateData.LastLoginDate;
                existingUser.UpdatedDate = DateTime.UtcNow;

                // Hash password if it's being updated
                if (!string.IsNullOrEmpty(updateData.Password))
                {
                    existingUser.Password = HashingUtil.HashString(updateData.Password, _configuration);
                }

                // Convert to DynamoDB item and save
                var dynamoItem = DynamoMapper.UserToDynamoItem(existingUser);
                var response = await PutItemAsync(dynamoItem, _userTableName);
                
                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    return await FindByIdAsync(userId);
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user: {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> DeleteAsync(string userId)
        {
            try
            {
                var existingUser = await FindByIdAsync(userId);
                if (existingUser == null)
                {
                    return false;
                }

                var key = DynamoMapper.CreateKey(userId);
                var response = await DeleteItemAsync(key, _userTableName);
                
                return response.HttpStatusCode == System.Net.HttpStatusCode.OK;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting user: {UserId}", userId);
                throw;
            }
        }

        public async Task<Models.User?> UpdateStatusAsync(string userId, bool isEnable)
        {
            try
            {
                var existingUser = await FindByIdAsync(userId);
                if (existingUser == null)
                {
                    return null;
                }

                existingUser.IsEnable = isEnable;
                existingUser.UpdatedDate = DateTime.UtcNow;

                var dynamoItem = DynamoMapper.UserToDynamoItem(existingUser);
                var response = await PutItemAsync(dynamoItem, _userTableName);
                
                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    return await FindByIdAsync(userId);
                }
                
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user status: {UserId}", userId);
                throw;
            }
        }
    }
}

