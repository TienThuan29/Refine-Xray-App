using Microsoft.AspNetCore.Mvc;
using DoctorService.Services.Folder;
using DoctorService.Web.Requests;
using DoctorService.Web.Responses;
using DoctorService.Libs;
using DoctorService.Models;

namespace DoctorService.Web.Controllers
{
    [ApiController]
    [Route("api/v1/folders")]
    public class FolderController : ControllerBase
    {
        private readonly IFolderService _folderService;
        private readonly ILogger<FolderController> _logger;

        public FolderController(IFolderService folderService, ILogger<FolderController> logger)
        {
            _folderService = folderService;
            _logger = logger;
        }

        [HttpPost]
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

        [HttpGet("{folderId}")]
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

        [HttpPut("patient-profile/{folderId}")]
        public async Task<ActionResult<ApiResponse<Folder>>> UpdatePatientProfileId(
            [FromRoute] string folderId, 
            [FromBody] UpdatePatientProfileIdRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.PatientProfileId))
                {
                    return ResponseUtil.Error<Models.Folder>("PatientProfileId is required", 400);
                }

                var updatedFolder = await _folderService.UpdatePatientProfileIdAsync(folderId, request.PatientProfileId);
                if (updatedFolder == null)
                {
                    return ResponseUtil.Error<Models.Folder>("Folder not found", 404);
                }

                return ResponseUtil.Success(updatedFolder, "Patient profile ID updated successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating patient profile ID for folder {FolderId}", folderId);
                return ResponseUtil.Error<Models.Folder>("Internal Server Error", 500);
            }
        }

       
        [HttpGet("created-by")]
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

        [HttpPut("{folderId}")]
        public async Task<ActionResult<ApiResponse<Folder>>> UpdateFolder([FromRoute] string folderId, [FromBody] UpdateFolderRequest request)
        {
            try
            {
                var updated = await _folderService.UpdateFolderAsync(folderId, request);
                if (updated == null)
                {
                    return ResponseUtil.Error<Folder>("Folder not found or update failed", 404);
                }
                return ResponseUtil.Success(updated, "Folder updated successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating folder");
                return ResponseUtil.Error<Folder>("Internal Server Error", 500);
            }
        }

        [HttpDelete("{folderId}")]
        public async Task<ActionResult<ApiResponse<object>>> DeleteFolder([FromRoute] string folderId)
        {
            try
            {
                var deleted = await _folderService.DeleteFolderAsync(folderId);
                if (!deleted)
                {
                    return ResponseUtil.Error<object>("Folder not found or deletion failed", 404);
                }
                return ResponseUtil.Success((object)new { deleted = true }, "Folder deleted successfully", 200);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting folder");
                return ResponseUtil.Error<object>("Internal Server Error", 500);
            }
        }
    }

    
}

