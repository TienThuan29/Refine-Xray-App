using Microsoft.AspNetCore.Mvc;
using DoctorService.Services.Folder;
using DoctorService.Web.Requests;
using DoctorService.Web.Responses;
using DoctorService.Libs;
using DoctorService.Models;
using System.ComponentModel.DataAnnotations;

namespace DoctorService.Web.Controllers
{
    [ApiController]
    [Route("api/v1/folder")]
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
        public async Task<ActionResult<ApiResponse<Folder>>> CreateFolder([FromBody] FolderRequest folderRequest)
        {
            try
            {
                if (string.IsNullOrEmpty(folderRequest.CreatedBy))
                {
                    return ResponseUtil.Error<Folder>("UserId (CreatedBy) is required", 400);
                }
                var createdFolder = await _folderService.CreateFolderAsync(folderRequest, folderRequest.CreatedBy);
                if (createdFolder == null)
                {
                    return ResponseUtil.Error<Folder>("Failed to create folder", 500);
                }
                return ResponseUtil.Success(createdFolder, "Folder created successfully", 201);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating folder");
                return ResponseUtil.Error<Folder>("Internal Server Error", 500);
            }
        }

        [HttpPut("update-patient-profile-id/{folderId}")]
        public async Task<ActionResult<ApiResponse<Folder>>> UpdatePatientProfileId(
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
        public async Task<ActionResult<ApiResponse<List<FolderResponse>>>> GetFolderOfUser([FromQuery] string userId)
        {
            try
            {
                if (string.IsNullOrEmpty(userId))
                {
                    return ResponseUtil.Error<List<FolderResponse>>("UserId is required", 400);
                }

                var folders = await _folderService.GetFolderOfUserAsync(userId);
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

