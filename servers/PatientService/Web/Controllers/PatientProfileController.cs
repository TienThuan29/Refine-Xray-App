using Microsoft.AspNetCore.Mvc;
using PatientService.Libs;
using PatientService.Models;
using PatientService.Services.PatientProfile;
using PatientService.Web.Requests;
using PatientService.Web.Responses;
using System.Text.Json;

namespace PatientService.Web.Controllers
{
    [ApiController]
    [Route("api/v1/patient-profiles")]
    public class PatientProfileController : ControllerBase
    {
        private readonly IPatientProfileService _patientProfileService;

        public PatientProfileController(IPatientProfileService patientProfileService)
        {
            _patientProfileService = patientProfileService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var patients = await _patientProfileService.FindAllAsync();
                var responses = patients.Select(MapToResponse).ToList();
                return ResponseUtil.Success(responses);
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error fetching patient profiles", error: ex.Message, stack: ex.StackTrace);
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            try
            {
                var patient = await _patientProfileService.FindByIdAsync(id);
                if (patient == null)
                {
                    return ResponseUtil.Error<PatientProfileResponse>("Patient profile not found", 404);
                }

                return ResponseUtil.Success(MapToResponse(patient));
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error fetching patient profile", error: ex.Message, stack: ex.StackTrace);
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromQuery] string folderId, [FromBody] PatientProfileRequest request)
        {
            if (string.IsNullOrWhiteSpace(folderId))
            {
                return ResponseUtil.Validation("folderId is required");
            }

            if (!ModelState.IsValid)
            {
                return ResponseUtil.Validation("Validation failed", ModelState);
            }

            try
            {
                var patientProfile = MapToModel(request);
                var created = await _patientProfileService.CreatePatientProfileAsync(folderId, patientProfile);
                if (created == null)
                {
                    return ResponseUtil.Error<PatientProfileResponse>("Failed to create patient profile");
                }

                return ResponseUtil.Success(MapToResponse(created), "Patient profile created", 201);
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error creating patient profile", error: ex.Message, stack: ex.StackTrace);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] PatientProfileRequest request)
        {
            if (!ModelState.IsValid)
            {
                return ResponseUtil.Validation("Validation failed", ModelState);
            }

            try
            {
                var patientProfile = MapToModel(request, id);
                var updated = await _patientProfileService.UpdatePatientProfileAsync(patientProfile);
                if (updated == null)
                {
                    return ResponseUtil.Error<PatientProfileResponse>("Patient profile not found", 404);
                }

                return ResponseUtil.Success(MapToResponse(updated), "Patient profile updated");
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error updating patient profile", error: ex.Message, stack: ex.StackTrace);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                var deleted = await _patientProfileService.DeletePatientProfileAsync(id);
                if (!deleted)
                {
                    return ResponseUtil.Error<PatientProfileResponse>("Patient profile not found", 404);
                }

                return ResponseUtil.Success(new { }, "Patient profile deleted");
            }
            catch (Exception ex)
            {
                return ResponseUtil.Error<object>("Error deleting patient profile", error: ex.Message, stack: ex.StackTrace);
            }
        }

        private static PatientProfileResponse MapToResponse(PatientProfile patientProfile)
        {
            return new PatientProfileResponse
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
        }

        private static PatientProfile MapToModel(PatientProfileRequest request, string? id = null)
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

            if (!string.IsNullOrEmpty(id))
            {
                patientProfile.Id = id;
            }

            return patientProfile;
        }
    }
}
