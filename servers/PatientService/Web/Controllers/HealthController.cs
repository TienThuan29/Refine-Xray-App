using Microsoft.AspNetCore.Mvc;

namespace PatientService.Web.Controllers
{
    [ApiController]
    [Route("health")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Health()
        {
            return Ok(new { message = "PatientService is running", timestamp = DateTime.UtcNow });
        }
    }
}

