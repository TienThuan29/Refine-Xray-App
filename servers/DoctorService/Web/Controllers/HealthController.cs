using Microsoft.AspNetCore.Mvc;

namespace DoctorService.Web.Controllers
{
    [ApiController]
    [Route("api/health")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Health()
        {
            return Ok(
                new { 
                        message = "DoctorService is running",
                        timestamp = DateTime.UtcNow
                    }
                );
        }
    }
}

