using Microsoft.AspNetCore.Mvc;
using PatientService.Libs;
using PatientService.Models;
using PatientService.Services.Blog;
using PatientService.Services.Identity;
using PatientService.Web.Requests;
using PatientService.Web.Responses;
using PatientService.Repositories.S3;

namespace PatientService.Web.Controllers
{
    [ApiController]
    [Route("api/v1/blogs")]
    public class BlogController : ControllerBase
    {
        private readonly IBlogService _blogService;
        private readonly IS3Repository _s3Repository;
        private readonly IIdentityService _identityService;

        public BlogController(IBlogService blogService, IS3Repository s3Repository, IIdentityService identityService)
        {
            _blogService = blogService;
            _s3Repository = s3Repository;
            _identityService = identityService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var blogs = await _blogService.FindAllAsync();
                var responses = new List<BlogResponse>();
                
                foreach (var blog in blogs)
                {
                    var response = await MapToResponseAsync(blog);
                    responses.Add(response);
                }
                
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

                var response = await MapToResponseAsync(blog);
                return ResponseUtil.Success(response);
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error fetching blog", error: ex.Message, stack: ex.StackTrace);
            }
        }

        [HttpPost]
        [Consumes("application/json")]
        public async Task<IActionResult> CreateJson([FromBody] BlogRequest request)
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

                var response = await MapToResponseAsync(created);
                return ResponseUtil.Success(response, "Blog created", 201);
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error creating blog", error: ex.Message, stack: ex.StackTrace);
            }
        }

        [HttpPost("form")] // alternative endpoint for form uploads
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateForm([FromForm] IFormCollection form)
        {
            try
            {
                // Extract form fields
                var create_by = form["create_by"].ToString();
                var title = form["title"].ToString();
                var subtitle = form["subtitle"].ToString();
                var content = form["content"].ToString();
                var image = form.Files["image"];

                // Validate required fields
                if (string.IsNullOrEmpty(create_by) || string.IsNullOrEmpty(title) || string.IsNullOrEmpty(content))
                {
                    return ResponseUtil.Error<BlogResponse>("Validation failed: create_by, title, and content are required", 400);
                }

                var request = new BlogRequest
                {
                    CreateBy = create_by,
                    Title = title,
                    Subtitle = string.IsNullOrEmpty(subtitle) ? null : subtitle,
                    Content = content,
                    ImageUrls = new List<string>()
                };

                // Upload image if provided
                if (image != null && image.Length > 0)
                {
                    using var ms = new MemoryStream();
                    await image.CopyToAsync(ms);
                    var bytes = ms.ToArray();
                    var fileName = $"blogs/{Guid.NewGuid()}_{image.FileName}";
                    var url = await _s3Repository.UploadFileAsync(bytes, fileName, image.ContentType);
                    request.ImageUrls.Add(url);
                }

                var blog = MapToModel(request);
                var created = await _blogService.CreateBlogAsync(blog);
                if (created == null)
                {
                    return ResponseUtil.Error<BlogResponse>("Failed to create blog");
                }

                var response = await MapToResponseAsync(created);
                return ResponseUtil.Success(response, "Blog created", 201);
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error creating blog", error: ex.Message, stack: ex.StackTrace);
            }
        }

        [HttpPut("{id}")]
        [Consumes("application/json")]
        public async Task<IActionResult> UpdateJson(string id, [FromBody] BlogRequest request)
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

                var response = await MapToResponseAsync(updated);
                return ResponseUtil.Success(response, "Blog updated");
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error updating blog", error: ex.Message, stack: ex.StackTrace);
            }
        }

        [HttpPut("{id}/form")] // alternative endpoint for form uploads
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateForm(string id, [FromForm] IFormCollection form)
        {
            try
            {
                // Extract form fields
                var create_by = form["create_by"].ToString();
                var title = form["title"].ToString();
                var subtitle = form["subtitle"].ToString();
                var content = form["content"].ToString();
                var image = form.Files["image"];

                // Validate required fields
                if (string.IsNullOrEmpty(create_by) || string.IsNullOrEmpty(title) || string.IsNullOrEmpty(content))
                {
                    return ResponseUtil.Error<BlogResponse>("Validation failed: create_by, title, and content are required", 400);
                }

                var request = new BlogRequest
                {
                    CreateBy = create_by,
                    Title = title,
                    Subtitle = string.IsNullOrEmpty(subtitle) ? null : subtitle,
                    Content = content,
                    ImageUrls = new List<string>()
                };

                // Upload image if provided
                if (image != null && image.Length > 0)
                {
                    using var ms = new MemoryStream();
                    await image.CopyToAsync(ms);
                    var bytes = ms.ToArray();
                    var fileName = $"blogs/{Guid.NewGuid()}_{image.FileName}";
                    var url = await _s3Repository.UploadFileAsync(bytes, fileName, image.ContentType);
                    request.ImageUrls.Add(url);
                }

                var blog = MapToModel(request, id);
                var updated = await _blogService.UpdateBlogAsync(blog);
                if (updated == null)
                {
                    return ResponseUtil.Error<BlogResponse>("Blog not found", 404);
                }

                var response = await MapToResponseAsync(updated);
                return ResponseUtil.Success(response, "Blog updated");
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

        private async Task<BlogResponse> MapToResponseAsync(Blog blog)
        {
            var fullname = await _identityService.GetUserFullnameAsync(blog.CreateBy);
            
            return new BlogResponse
            {
                Id = blog.Id,
                CreateBy = blog.CreateBy,
                CreateByFullname = fullname,
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

