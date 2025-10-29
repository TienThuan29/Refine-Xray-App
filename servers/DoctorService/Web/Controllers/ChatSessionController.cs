using Microsoft.AspNetCore.Mvc;
using DoctorService.Web.Requests;
using DoctorService.Web.Responses;
using DoctorService.Services.ChatSession;
using DoctorService.Services.CliniAI;
using DoctorService.Libs;
using DoctorService.Models;
using Microsoft.Extensions.DependencyInjection;

namespace DoctorService.Web.Controllers
{
    [ApiController]
    [Route("api/v1/chatsessions")]
    public class ChatSessionController : ControllerBase
    {
        private readonly IChatSessionService _chatSessionService;
        private readonly ILogger<ChatSessionController> _logger;

        public ChatSessionController(
            IChatSessionService chatSessionService,
            ILogger<ChatSessionController> logger)
        {
            _chatSessionService = chatSessionService;
            _logger = logger;
        }


        [HttpGet("test-cliniai")]
        public async Task<ActionResult<ApiResponse<bool>>> TestCliniAI()
        {
            try
            {
                var cliniAiService = HttpContext.RequestServices.GetRequiredService<ICliniAiService>();
                var isAvailable = await cliniAiService.IsServiceAvailableAsync();
                
                if (isAvailable)
                {
                    return ResponseUtil.Success(true, "CliniAI service is available");
                }
                else
                {
                    return ResponseUtil.Error<bool>("CliniAI service is not available", 503);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing CliniAI service");
                return ResponseUtil.Error<bool>("Internal Server Error", 500);
            }
        }

        [HttpPost("analyze-and-create-chatsession")]
        public async Task<ActionResult<ApiResponse<ChatSessionResponse>>> AnalyzeAndCreateChatSession([FromForm] ChatSessionRequest request)
        {
            try
            {
                _logger.LogInformation("Creating chat session, Title: {Title}", request.Title);

                var serviceResponse = await _chatSessionService.AnalyzeAndCreateChatSessionAsync(request);
                
                if (serviceResponse.Success)
                {
                    return ResponseUtil.Success(serviceResponse.DataResponse, serviceResponse.Message);
                }
                else
                {
                    return ResponseUtil.Error<ChatSessionResponse>(serviceResponse.Message, 400, serviceResponse.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating chat session");
                return ResponseUtil.Error<ChatSessionResponse>("Internal Server Error", 500);
            }
        }

        /// <summary>
        /// Get chat session by ID
        /// </summary>
        /// <param name="chatSessionId">Chat session ID</param>
        /// <returns>Chat session details</returns>
        [HttpGet("get/{chatSessionId}")]
        public async Task<ActionResult<ApiResponse<ChatSessionResponse>>> GetChatSessionById(string chatSessionId)
        {
            try
            {
                _logger.LogInformation("Getting chat session: {ChatSessionId}", chatSessionId);

                var serviceResponse = await _chatSessionService.GetChatSessionByIdAsync(chatSessionId);
                
                if (serviceResponse.Success)
                {
                    return ResponseUtil.Success(serviceResponse.DataResponse, serviceResponse.Message);
                }
                else
                {
                    var statusCode = serviceResponse.Message.Contains("not found") ? 404 : 400;
                    return ResponseUtil.Error<ChatSessionResponse>(serviceResponse.Message, statusCode, serviceResponse.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chat session by id: {ChatSessionId}", chatSessionId);
                return ResponseUtil.Error<ChatSessionResponse>("Internal Server Error", 500);
            }
        }

        /// <summary>
        /// Send a chat message to the AI chatbot
        /// </summary>
        /// <param name="chatSessionId">Chat session ID</param>
        /// <param name="request">Chat message request</param>
        /// <returns>Chatbot response</returns>
        [HttpPost("{chatSessionId}/chat")]
        public async Task<ActionResult<ApiResponse<ChatbotResponse>>> SendChatMessage(string chatSessionId, [FromBody] ChatbotRequest request)
        {
            try
            {
                // Set chat session ID from route parameter
                request.ChatSessionId = chatSessionId;

                _logger.LogInformation("Processing chat message for session: {ChatSessionId}", chatSessionId);

                var serviceResponse = await _chatSessionService.SendChatMessageAsync(request);
                
                if (serviceResponse.Success)
                {
                    return ResponseUtil.Success(serviceResponse.DataResponse, serviceResponse.Message);
                }
                else
                {
                    var statusCode = serviceResponse.Message.Contains("not found") ? 404 : 400;
                    return ResponseUtil.Error<ChatbotResponse>(serviceResponse.Message, statusCode, serviceResponse.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing chat message for session: {ChatSessionId}", chatSessionId);
                return ResponseUtil.Error<ChatbotResponse>("Internal Server Error", 500);
            }
        }

        /// <summary>
        /// Get all chat sessions for a folder
        /// </summary>
        /// <param name="folderId">Folder ID</param>
        /// <returns>List of chat sessions</returns>
        [HttpGet("folder/{folderId}")]
        public async Task<ActionResult<ApiResponse<List<ChatSessionResponse>>>> GetChatSessionsByFolderId(string folderId)
        {
            try
            {
                _logger.LogInformation("Getting chat sessions for folder: {FolderId}", folderId);

                var serviceResponse = await _chatSessionService.GetChatSessionsByFolderIdAsync(folderId);
                
                if (serviceResponse.Success)
                {
                    return ResponseUtil.Success(serviceResponse.DataResponse, serviceResponse.Message);
                }
                else
                {
                    return ResponseUtil.Error<List<ChatSessionResponse>>(serviceResponse.Message, 400, serviceResponse.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chat sessions for folder: {FolderId}", folderId);
                return ResponseUtil.Error<List<ChatSessionResponse>>("Internal Server Error", 500);
            }
        }

        /// <summary>
        /// Delete a chat session
        /// </summary>
        /// <param name="chatSessionId">Chat session ID</param>
        /// <returns>Success status</returns>
        [HttpDelete("{chatSessionId}")]
        public async Task<ActionResult<ApiResponse<bool>>> DeleteChatSession(string chatSessionId)
        {
            try
            {
                _logger.LogInformation("Deleting chat session: {ChatSessionId}", chatSessionId);

                var serviceResponse = await _chatSessionService.DeleteChatSessionAsync(chatSessionId);
                
                if (serviceResponse.Success)
                {
                    return ResponseUtil.Success(serviceResponse.DataResponse, serviceResponse.Message);
                }
                else
                {
                    var statusCode = serviceResponse.Message.Contains("not found") ? 404 : 500;
                    return ResponseUtil.Error<bool>(serviceResponse.Message, statusCode, serviceResponse.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting chat session: {ChatSessionId}", chatSessionId);
                return ResponseUtil.Error<bool>("Internal Server Error", 500);
            }
        }

        [HttpPost("test-gradcam")]
        public async Task<IActionResult> TestGradCamProcessing([FromBody] TestGradCamRequest request)
        {
            try
            {
                _logger.LogInformation("Testing GradCam processing with base64 data length: {Length}", request.Base64Image?.Length ?? 0);
                
                var testGradcamAnalyses = new GradcamAnalyses
                {
                    Top1Pneumothorax = request.Base64Image ?? string.Empty,
                    Top2Atelectasis = string.Empty,
                    Top3Edema = string.Empty,
                    Top4Pneumonia = string.Empty,
                    Top5PleuralThickening = string.Empty
                };

                var result = await _chatSessionService.TestGradCamProcessingAsync(testGradcamAnalyses, request.ChatSessionId ?? Guid.NewGuid().ToString());
                
                return Ok(new { success = true, result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error testing GradCam processing");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }
    }

    public class TestGradCamRequest
    {
        public string? Base64Image { get; set; }
        public string? ChatSessionId { get; set; }
    }
}

