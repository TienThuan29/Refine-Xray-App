using DoctorService.Models;
using DoctorService.Services.PatientProfile;
using DoctorService.Web.Requests;
using DoctorService.Web.Responses;
using DoctorService.Libs;
using Microsoft.AspNetCore.Mvc;

namespace DoctorService.Web.Controllers
{
    [ApiController]
    [Route("api/v1/patient")]
    public class PatientProfileController : ControllerBase
    {
        private readonly IPatientProfileService _patientProfileService;
        private readonly ILogger<PatientProfileController> _logger;

        public PatientProfileController(
            IPatientProfileService patientProfileService,
            ILogger<PatientProfileController> logger)
        {
            _patientProfileService = patientProfileService;
            _logger = logger;
        }

        [HttpPost("create-profile/{folderId}")]
        public async Task<ActionResult<ApiResponse<PatientProfileResponse>>> CreatePatientProfile(
            string folderId,
            [FromBody] PatientProfileRequest request)
        {
            try
            {
                var patientProfile = new PatientProfile
                {
                    Fullname = request.Fullname,
                    Gender = request.Gender,
                    Phone = request.Phone,
                    HouseNumber = request.HouseNumber,
                    Commune = request.Commune,
                    Province = request.Province,
                    Nation = request.Nation
                };

                var createdPatientProfile = await _patientProfileService.CreatePatientProfileAsync(folderId, patientProfile);
                
                if (createdPatientProfile == null)
                {
                    return ResponseUtil.Error<PatientProfileResponse>("Failed to create patient profile", 400);
                }

                var response = new PatientProfileResponse
                {
                    Id = createdPatientProfile.Id,
                    Fullname = createdPatientProfile.Fullname,
                    Gender = createdPatientProfile.Gender,
                    Phone = createdPatientProfile.Phone,
                    HouseNumber = createdPatientProfile.HouseNumber,
                    Commune = createdPatientProfile.Commune,
                    Province = createdPatientProfile.Province,
                    Nation = createdPatientProfile.Nation
                };

                return ResponseUtil.Success(response, "Patient profile created successfully", 201);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating patient profile for folder {folderId}");
                return ResponseUtil.Error<PatientProfileResponse>("Internal server error", 500, ex.Message, ex.StackTrace);
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<PatientProfileResponse>>> GetPatientProfile(string id)
        {
            try
            {
                var patientProfile = await _patientProfileService.FindByIdAsync(id);
                
                if (patientProfile == null)
                {
                    return ResponseUtil.Error<PatientProfileResponse>("Patient profile not found", 404);
                }

                var response = new PatientProfileResponse
                {
                    Id = patientProfile.Id,
                    Fullname = patientProfile.Fullname,
                    Gender = patientProfile.Gender,
                    Phone = patientProfile.Phone,
                    HouseNumber = patientProfile.HouseNumber,
                    Commune = patientProfile.Commune,
                    Province = patientProfile.Province,
                    Nation = patientProfile.Nation
                };

                return ResponseUtil.Success(response, "Patient profile retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting patient profile with ID: {id}");
                return ResponseUtil.Error<PatientProfileResponse>("Internal server error", 500, ex.Message, ex.StackTrace);
            }
        }
    }
}

