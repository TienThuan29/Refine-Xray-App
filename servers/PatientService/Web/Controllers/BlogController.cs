using Microsoft.AspNetCore.Mvc;
using PatientService.Libs;
using PatientService.Models;
using PatientService.Services.Blog;
using PatientService.Web.Requests;
using PatientService.Web.Responses;

namespace PatientService.Web.Controllers
{
    [ApiController]
    [Route("api/v1/blogs")]
    public class BlogController : ControllerBase
    {
        private readonly IBlogService _blogService;

        public BlogController(IBlogService blogService)
        {
            _blogService = blogService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var blogs = await _blogService.FindAllAsync();
                var responses = blogs.Select(MapToResponse).ToList();
                return ResponseUtil.Success(responses);
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error fetching blogs", error: ex.Message, stack: ex.StackTrace);
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            try
            {
                var blog = await _blogService.FindByIdAsync(id);
                if (blog == null)
                {
                    return ResponseUtil.Error<BlogResponse>("Blog not found", 404);
                }

                return ResponseUtil.Success(MapToResponse(blog));
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error fetching blog", error: ex.Message, stack: ex.StackTrace);
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BlogRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ResponseUtil.Validation("Validation failed", ModelState);
            }

            try
            {
                var blog = MapToModel(request);
                var created = await _blogService.CreateBlogAsync(blog);
                if (created == null)
                {
                    return ResponseUtil.Error<BlogResponse>("Failed to create blog");
                }

                return ResponseUtil.Success(MapToResponse(created), "Blog created", 201);
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error creating blog", error: ex.Message, stack: ex.StackTrace);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] BlogRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ResponseUtil.Validation("Validation failed", ModelState);
            }

            try
            {
                var blog = MapToModel(request, id);
                var updated = await _blogService.UpdateBlogAsync(blog);
                if (updated == null)
                {
                    return ResponseUtil.Error<BlogResponse>("Blog not found", 404);
                }

                return ResponseUtil.Success(MapToResponse(updated), "Blog updated");
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error updating blog", error: ex.Message, stack: ex.StackTrace);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                var deleted = await _blogService.DeleteBlogAsync(id);
                if (!deleted)
                {
                    return ResponseUtil.Error<BlogResponse>("Blog not found", 404);
                }

                return ResponseUtil.Success(new { }, "Blog deleted");
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error deleting blog", error: ex.Message, stack: ex.StackTrace);
            }
        }

        private static BlogResponse MapToResponse(Blog blog)
        {
            return new BlogResponse
            {
                Id = blog.Id,
                CreateBy = blog.CreateBy,
                Title = blog.Title,
                ImageUrls = blog.ImageUrls ?? new List<string>(),
                Subtitle = blog.Subtitle,
                Content = blog.Content,
                IsDeleted = blog.IsDeleted,
                CreatedDate = blog.CreatedDate,
                UpdatedDate = blog.UpdatedDate
            };
        }

        private static Blog MapToModel(BlogRequest request, string? id = null)
        {
            var blog = new Blog
            {
                CreateBy = request.CreateBy,
                Title = request.Title,
                ImageUrls = request.ImageUrls ?? new List<string>(),
                Subtitle = request.Subtitle,
                Content = request.Content
            };

            if (!string.IsNullOrEmpty(id))
            {
                blog.Id = id;
            }

            return blog;
        }
    }
}

