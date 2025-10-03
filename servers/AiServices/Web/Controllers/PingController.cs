using Microsoft.AspNetCore.Mvc;

namespace AiServices.Web.Controllers
{
    [ApiController]
    [Route("api/v1/ping")]
    public class PingController : ControllerBase
    {
        [HttpGet]
        public IActionResult Ping()
        {
            return Ok(
                new { 
                        message = "OK",
                        timestamp = DateTime.UtcNow
                    }
                );
        }
    }
}