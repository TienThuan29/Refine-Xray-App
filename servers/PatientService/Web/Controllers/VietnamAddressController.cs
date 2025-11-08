using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace PatientService.Web.Controllers
{
    [ApiController]
    [Route("api/v1/vietnam-address")]
    public class VietnamAddressController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private const string BaseUrl = "https://production.cas.so/address-kit/2025-07-01";

        public VietnamAddressController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        [HttpGet("provinces")]
        public async Task<IActionResult> GetProvinces()
        {
            try
            {
                var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromSeconds(30);

                var response = await httpClient.GetAsync($"{BaseUrl}/provinces");
                
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, new 
                    { 
                        success = false, 
                        message = "Failed to fetch provinces from external API",
                        statusCode = response.StatusCode 
                    });
                }

                var content = await response.Content.ReadAsStringAsync();
                var jsonData = JsonSerializer.Deserialize<JsonElement>(content);

                return Ok(jsonData);
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(503, new 
                { 
                    success = false, 
                    message = "Error connecting to external API",
                    error = ex.Message 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Internal server error",
                    error = ex.Message 
                });
            }
        }

        [HttpGet("provinces/{provinceId}/communes")]
        public async Task<IActionResult> GetCommunes(string provinceId)
        {
            if (string.IsNullOrWhiteSpace(provinceId))
            {
                return BadRequest(new { success = false, message = "Province ID is required" });
            }

            try
            {
                var httpClient = _httpClientFactory.CreateClient();
                httpClient.Timeout = TimeSpan.FromSeconds(30);

                var response = await httpClient.GetAsync($"{BaseUrl}/provinces/{provinceId}/communes");
                
                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, new 
                    { 
                        success = false, 
                        message = "Failed to fetch communes from external API",
                        statusCode = response.StatusCode 
                    });
                }

                var content = await response.Content.ReadAsStringAsync();
                var jsonData = JsonSerializer.Deserialize<JsonElement>(content);

                return Ok(jsonData);
            }
            catch (HttpRequestException ex)
            {
                return StatusCode(503, new 
                { 
                    success = false, 
                    message = "Error connecting to external API",
                    error = ex.Message 
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new 
                { 
                    success = false, 
                    message = "Internal server error",
                    error = ex.Message 
                });
            }
        }
    }
}

