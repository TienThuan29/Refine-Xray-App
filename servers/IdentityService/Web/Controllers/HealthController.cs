using Microsoft.AspNetCore.Mvc;

namespace IdentityService.Web.Controllers
{
    [ApiController]
    [Route("health")]
    public class HealthController : ControllerBase
    {
        [HttpGet]
        public IActionResult Health()
        {
            return Ok(new { message = "IdentityService is running", timestamp = DateTime.UtcNow });
        }
    }
}

