using Microsoft.AspNetCore.Mvc;
using MasterServices.Services.Folder;
using MasterServices.Web.Requests;
using MasterServices.Web.Responses;
using MasterServices.Libs;
using MasterServices.Models;
using Microsoft.AspNetCore.Authorization;
using System.ComponentModel.DataAnnotations;

namespace MasterServices.Web.Controllers
{
    [ApiController]
    [Route("api/v1/folder")]
    [Authorize]
    public class FolderController : ControllerBase
    {
        private readonly IFolderService _folderService;
        private readonly ILogger<FolderController> _logger;

        public FolderController(IFolderService folderService, ILogger<FolderController> logger)
        {
            _folderService = folderService;
            _logger = logger;
        }

        [HttpPost("create-folder")]
        [Authorize(Roles = "DOCTOR")]
        public async Task<ActionResult<ApiResponse<Models.Folder>>> CreateFolder([FromBody] FolderRequest folderRequest)
        {
            try
            {
                // Get user from context, set by JwtValidationMiddleware
                var user = HttpContext.Items["User"] as User;
                if (user == null)
                {
                    return ResponseUtil.Error<Models.Folder>("User not authenticated", 401);
                }
                var createdFolder = await _folderService.CreateFolderAsync(folderRequest, user.Id);
                if (createdFolder == null)
                {
                    return ResponseUtil.Error<Models.Folder>("Failed to create folder", 500);
                }
                return ResponseUtil.Success(createdFolder, "Folder created successfully", 201);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating folder");
                return ResponseUtil.Error<Models.Folder>("Internal Server Error", 500);
            }
        }

        [HttpPut("update-patient-profile-id/{folderId}")]
        [Authorize(Roles = "DOCTOR")]
        public async Task<ActionResult<ApiResponse<Models.Folder>>> UpdatePatientProfileId(
            [FromRoute] string folderId, 
            [FromBody] UpdatePatientProfileIdRequest request)
        {
            try
            {
                var updatedFolder = await _folderService.UpdatePatientProfileIdAsync(folderId, request.PatientProfileId);
                if (updatedFolder == null)
                {
                    return ResponseUtil.Error<Models.Folder>("Folder not found or patient profile not found", 404);
                }

                return ResponseUtil.Success(updatedFolder, "Patient profile updated successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating patient profile");
                return ResponseUtil.Error<Models.Folder>("Internal Server Error", 500);
            }
        }

        [HttpGet("get/{folderId}")]
        [Authorize(Roles = "DOCTOR")]
        public async Task<ActionResult<ApiResponse<Models.Folder>>> FindFolderById([FromRoute] string folderId)
        {
            try
            {
                var folder = await _folderService.FindByIdAsync(folderId);
                if (folder == null)
                {
                    return ResponseUtil.Error<Models.Folder>("Folder not found", 404);
                }

                return ResponseUtil.Success(folder, "Folder found successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error finding folder by id");
                return ResponseUtil.Error<Models.Folder>("Internal Server Error", 500);
            }
        }

        [HttpGet("get-all-created-by")]
        [Authorize(Roles = "DOCTOR")]
        public async Task<ActionResult<ApiResponse<List<FolderResponse>>>> GetFolderOfUser()
        {
            try
            {
                // Get user from context (set by JwtValidationMiddleware)
                var user = HttpContext.Items["User"] as User;
                if (user == null)
                {
                    return ResponseUtil.Error<List<FolderResponse>>("User not authenticated", 401);
                }

                var folders = await _folderService.GetFolderOfUserAsync(user.Id);
                if (folders == null)
                {
                    return ResponseUtil.Error<List<FolderResponse>>("Failed to retrieve folders", 500);
                }

                return ResponseUtil.Success(folders, "Folders found successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting folder of user");
                return ResponseUtil.Error<List<FolderResponse>>("Internal Server Error", 500);
            }
        }
    }

    // Request DTO for updating patient profile ID
    public class UpdatePatientProfileIdRequest
    {
        [Required]
        public string PatientProfileId { get; set; } = string.Empty;
    }
}
