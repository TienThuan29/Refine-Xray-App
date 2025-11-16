using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PatientService.Models;
using PatientService.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;

namespace PatientService.Repositories.Blog
{
    public class BlogRepository : DynamoRepository, IBlogRepository
    {
        private new readonly string _tableName;
        private readonly ILogger<BlogRepository> _logger;

        public BlogRepository(
            IAmazonDynamoDB dynamoDbClient,
            IConfiguration configuration,
            ILogger<BlogRepository> logger) : base(dynamoDbClient, configuration, logger)
        {
            _tableName = configuration["DynamoDB:BlogTable"] ?? "prm392-blogs";
            _logger = logger;
        }

        public async Task<Models.Blog?> CreateBlogAsync(Models.Blog blog)
        {
            try
            {
                blog.Id = Guid.NewGuid().ToString();
                blog.CreatedDate = DateTime.UtcNow;
                blog.UpdatedDate = DateTime.UtcNow;
                var item = BlogDynamoMapper.BlogToDynamoItem(blog);
                var response = await PutItemAsync(item, _tableName);
                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    return await FindByIdAsync(blog.Id);
                }
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating blog");
                throw;
            }
        }

        public async Task<Models.Blog?> FindByIdAsync(string blogId)
        {
            try
            {
                var key = new Dictionary<string, AttributeValue> { { "id", new AttributeValue { S = blogId } } };
                var response = await GetItemAsync(key, _tableName);
                if (response.Item.Count == 0)
                {
                    return null;
                }
                return BlogDynamoMapper.DynamoItemToBlog(response.Item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding blog");
                throw;
            }
        }

        public async Task<List<Models.Blog>> FindAllAsync()
        {
            try
            {
                var response = await ScanAsync(_tableName);
                if (response.Items == null || response.Items.Count == 0)
                {
                    return new List<Models.Blog>();
                }

                return response.Items
                    .Select(BlogDynamoMapper.DynamoItemToBlog)
                    .Where(b => !b.IsDeleted) // Filter out deleted blogs
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scanning blogs");
                throw;
            }
        }

        public async Task<Models.Blog?> UpdateBlogAsync(Models.Blog blog)
        {
            try
            {
                var existing = await FindByIdAsync(blog.Id);
                if (existing == null)
                {
                    return null;
                }

                // Preserve CreatedDate from existing blog
                blog.CreatedDate = existing.CreatedDate;
                blog.UpdatedDate = DateTime.UtcNow;
                var item = BlogDynamoMapper.BlogToDynamoItem(blog);
                var response = await PutItemAsync(item, _tableName);
                if (response.HttpStatusCode == System.Net.HttpStatusCode.OK)
                {
                    return await FindByIdAsync(blog.Id);
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating blog");
                throw;
            }
        }

        public async Task<bool> DeleteBlogAsync(string blogId)
        {
            try
            {
                var blog = await FindByIdAsync(blogId);
                if (blog == null)
                {
                    return false;
                }

                blog.IsDeleted = true;
                blog.UpdatedDate = DateTime.UtcNow;
                var item = BlogDynamoMapper.BlogToDynamoItem(blog);
                var response = await PutItemAsync(item, _tableName);
                return response.HttpStatusCode == System.Net.HttpStatusCode.OK;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting blog");
                throw;
            }
        }
    }
}

