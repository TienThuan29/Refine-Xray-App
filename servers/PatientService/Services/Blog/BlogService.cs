using PatientService.Repositories.Blog;
using Microsoft.Extensions.Logging;
using PatientService.Models;

namespace PatientService.Services.Blog
{
    public class BlogService : IBlogService
    {
        private readonly IBlogRepository _blogRepository;
        private readonly ILogger<BlogService> _logger;

        public BlogService(
            IBlogRepository blogRepository,
            ILogger<BlogService> logger)
        {
            _blogRepository = blogRepository;
            _logger = logger;
        }

        public async Task<Models.Blog?> CreateBlogAsync(Models.Blog blog)
        {
            try
            {
                var savedBlog = await _blogRepository.CreateBlogAsync(blog);
                if (savedBlog == null)
                {
                    _logger.LogError("Failed to create blog");
                    return null;
                }
                _logger.LogInformation("Successfully created blog {BlogId}", savedBlog.Id);
                return savedBlog;
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
                return await _blogRepository.FindByIdAsync(blogId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding blog with ID: {BlogId}", blogId);
                throw;
            }
        }

        public async Task<List<Models.Blog>> FindAllAsync()
        {
            try
            {
                return await _blogRepository.FindAllAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving blogs");
                throw;
            }
        }

        public async Task<Models.Blog?> UpdateBlogAsync(Models.Blog blog)
        {
            try
            {
                var updated = await _blogRepository.UpdateBlogAsync(blog);
                if (updated == null)
                {
                    _logger.LogWarning("Attempted to update blog {BlogId} but it was not found", blog.Id);
                }
                else
                {
                    _logger.LogInformation("Updated blog {BlogId}", blog.Id);
                }

                return updated;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating blog {BlogId}", blog.Id);
                throw;
            }
        }

        public async Task<bool> DeleteBlogAsync(string blogId)
        {
            try
            {
                var deleted = await _blogRepository.DeleteBlogAsync(blogId);
                if (deleted)
                {
                    _logger.LogInformation("Deleted blog {BlogId}", blogId);
                }
                else
                {
                    _logger.LogWarning("Attempted to delete blog {BlogId} but it was not found", blogId);
                }

                return deleted;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting blog {BlogId}", blogId);
                throw;
            }
        }
    }
}

