using Microsoft.AspNetCore.Mvc;

namespace AdminService.Web.Controllers
{
    [ApiController]
    [Route("api/health")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Health()
        {
            return Ok(new { message = "AdminService is running", timestamp = DateTime.UtcNow });
        }
    }
}

