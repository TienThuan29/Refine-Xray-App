using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MasterServices.Models;
using MasterServices.Utils;
using System.Globalization;

namespace MasterServices.Repositories 
{
    public class UserRepository : DynamoRepository, IUserRepository
    {
        private readonly string _userTableName;
        private readonly IConfiguration _configuration;

        public UserRepository(
            IAmazonDynamoDB dynamoDBClient, 
            IConfiguration configuration, 
            ILogger<UserRepository> logger
        ) : base(dynamoDBClient, configuration, logger)
        {
            _configuration = configuration;
            _userTableName = configuration["DynamoDB:UserTable"] ?? "UserTable";
        }

        public async Task<User?> CreateAsync(User user)
        {
            try
            {
                // Generate GUID for user ID
                user.Id = Guid.NewGuid().ToString();
                
                // Hash the password
                user.Password = HashingUtil.HashString(user.Password, _configuration);
                
                // Set default values
                user.IsEnable = true;
                user.CreatedDate = DateTime.UtcNow;
                user.UpdatedDate = DateTime.UtcNow;

                // Convert to DynamoDB item
                var dynamoItem = DynamoMapper.UserToDynamoItem(user);
                
                // Save to DynamoDB
                var response = await PutItemAsync(dynamoItem, _userTableName);
                
                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
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

        public async Task<User?> FindByIdAsync(string userId)
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

        public async Task<User?> FindByEmailAsync(string email)
        {
            try
            {
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

        public async Task<List<User>> FindAllAsync()
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

        public async Task<User?> UpdateAsync(string userId, User updateData)
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

        public async Task<User?> UpdateStatusAsync(string userId, bool isEnable)
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