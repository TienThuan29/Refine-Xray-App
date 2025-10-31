using DoctorService.Models;
using DoctorService.Web.Requests;
using DoctorService.Web.Responses;
using DoctorService.Repositories.ChatSession;
using DoctorService.Repositories.S3;
using DoctorService.Services.CliniAI;
using DoctorService.Services.GradCam;
using DoctorService.Libs;

namespace DoctorService.Services.ChatSession
{
    public class ChatSessionService : IChatSessionService
    {
        private readonly IChatSessionRepository _chatSessionRepository;
        private readonly ICliniAiService _cliniAiService;
        private readonly IGradCamImageService _gradCamImageService;
        private readonly IS3Repository _s3Repository;
        private readonly ILogger<ChatSessionService> _logger;


        public ChatSessionService(
            IChatSessionRepository chatSessionRepository,
            ICliniAiService cliniAiService,
            IGradCamImageService gradCamImageService,
            IS3Repository s3Repository,
            ILogger<ChatSessionService> logger,
            IConfiguration configuration)
        {
            _chatSessionRepository = chatSessionRepository;
            _cliniAiService = cliniAiService;
            _gradCamImageService = gradCamImageService;
            _s3Repository = s3Repository;
            _logger = logger;
            _ = configuration; // Suppress unused parameter warning
        }

        public async Task<ApiResponse<ChatSessionResponse>> AnalyzeAndCreateChatSessionAsync(
            ChatSessionRequest request
        ){
            Console.WriteLine("Analyzing and creating chat session ....");
            try
            {
                if (string.IsNullOrEmpty(request.Title))
                {
                    return new ApiResponse<ChatSessionResponse>
                    {
                        Success = false,
                        Message = "Title is required",
                        Error = "Title cannot be null or empty"
                    };
                }

                if (request.Image.Length == 0)
                {
                    return new ApiResponse<ChatSessionResponse>
                    {
                        Success = false,
                        Message = "Image is required",
                        Error = "X-ray image cannot be null or empty"
                    };
                }

                // Generate unique ID for the chat session
                var chatSessionId = Guid.NewGuid().ToString();
                // Convert IFormFile to byte array for CliniAI service
                byte[] imageBytes;
                using (var memoryStream = new MemoryStream())
                {
                    await request.Image.CopyToAsync(memoryStream);
                    imageBytes = memoryStream.ToArray();
                }

                // Call CliniAI service to analyze the X-ray image
                var cliniAiResponse = await _cliniAiService.GetAnalyzeResultAsync(imageBytes);
                if (cliniAiResponse == null)
                {
                    return new ApiResponse<ChatSessionResponse>
                    {
                        Success = false,
                        Message = "Failed to analyze image",
                        Error = "CliniAI service returned null response"
                    };
                }
                var xrayImageUrl = await UploadXrayImageToS3Async(imageBytes, chatSessionId);

                var result = await ConvertCliniAiResponseToResultAsync(cliniAiResponse, chatSessionId);
                var chatSession = new DoctorService.Models.ChatSession
                {
                    Id = chatSessionId,
                    SessionId = chatSessionId, // Use the same ID as sessionId for N8N
                    Title = request.Title,
                    FolderId = request.FolderId,
                    XrayImageUrl = xrayImageUrl,
                    Result = result
                };

                _logger.LogInformation("Creating chat session with Result size: {ResultSize} bytes, FolderId: {FolderId}", 
                    result != null ? System.Text.Json.JsonSerializer.Serialize(result).Length : 0, 
                    request.FolderId);

                DoctorService.Models.ChatSession? savedChatSession;
                try
                {
                    savedChatSession = await _chatSessionRepository.CreateChatSessionAsync(chatSession);
                    
                    if (savedChatSession == null)
                    {
                        _logger.LogError("Failed to save chat session to DynamoDB. CreateChatSessionAsync returned null. ChatSessionId: {ChatSessionId}", chatSessionId);
                        return new ApiResponse<ChatSessionResponse>
                        {
                            Success = false,
                            Message = "Failed to create chat session",
                            Error = "Database operation returned null. Check logs for details."
                        };
                    }
                    
                    _logger.LogInformation("Chat session saved successfully. ChatSessionId: {ChatSessionId}, HasResult: {HasResult}, HasFolderId: {HasFolderId}", 
                        savedChatSession.Id, savedChatSession.Result != null, !string.IsNullOrEmpty(savedChatSession.FolderId));
                }
                catch (Exception dbEx)
                {
                    _logger.LogError(dbEx, "Exception while saving chat session to DynamoDB. ChatSessionId: {ChatSessionId}", chatSessionId);
                    return new ApiResponse<ChatSessionResponse>
                    {
                        Success = false,
                        Message = "Failed to create chat session",
                        Error = $"Database operation failed: {dbEx.Message}. Check logs for details."
                    };
                }

                // Update folder with chat session ID (placeholder - implement folder service)
                await UpdateFolderWithChatSessionAsync(request.FolderId, savedChatSession.Id);

                var response = MapToChatSessionResponse(savedChatSession);
                return new ApiResponse<ChatSessionResponse>
                {
                    Success = true,
                    Message = "Chat session created successfully",
                    DataResponse = response
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing and creating chat session");
                return new ApiResponse<ChatSessionResponse>
                {
                    Success = false,
                    Message = "Internal server error",
                    Error = ex.Message,
                    Stack = ex.StackTrace
                };
            }
        }

        public async Task<ApiResponse<ChatSessionResponse>> GetChatSessionByIdAsync(string chatSessionId)
        {
            try
            {
                if (string.IsNullOrEmpty(chatSessionId))
                {
                    return new ApiResponse<ChatSessionResponse>
                    {
                        Success = false,
                        Message = "Chat session ID is required",
                        Error = "Chat session ID cannot be null or empty"
                    };
                }

                var chatSession = await _chatSessionRepository.GetByIdAsync(chatSessionId);
                if (chatSession == null)
                {
                    return new ApiResponse<ChatSessionResponse>
                    {
                        Success = false,
                        Message = "Chat session not found",
                        Error = $"No chat session found with ID: {chatSessionId}"
                    };
                }

                var response = MapToChatSessionResponse(chatSession);
                return new ApiResponse<ChatSessionResponse>
                {
                    Success = true,
                    Message = "Chat session retrieved successfully",
                    DataResponse = response
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chat session by id: {ChatSessionId}", chatSessionId);
                return new ApiResponse<ChatSessionResponse>
                {
                    Success = false,
                    Message = "Internal server error",
                    Error = ex.Message,
                    Stack = ex.StackTrace
                };
            }
        }

        public async Task<ApiResponse<ChatbotResponse>> SendChatMessageAsync(ChatbotRequest request)
        {
            try
            {
                // Validate required fields
                if (string.IsNullOrEmpty(request.ChatSessionId))
                {
                    return new ApiResponse<ChatbotResponse>
                    {
                        Success = false,
                        Message = "Chat session ID is required",
                        Error = "Chat session ID cannot be null or empty"
                    };
                }

                if (string.IsNullOrEmpty(request.Message))
                {
                    return new ApiResponse<ChatbotResponse>
                    {
                        Success = false,
                        Message = "Message is required",
                        Error = "Message cannot be null or empty"
                    };
                }

                // Get the chat session
                var chatSession = await _chatSessionRepository.GetByIdAsync(request.ChatSessionId);
                if (chatSession == null)
                {
                    return new ApiResponse<ChatbotResponse>
                    {
                        Success = false,
                        Message = "Chat session not found",
                        Error = $"No chat session found with ID: {request.ChatSessionId}"
                    };
                }

                // Handle missing sessionId for existing chat sessions
                if (string.IsNullOrEmpty(chatSession.SessionId))
                {
                    _logger.LogInformation("Chat session missing sessionId, using chat session ID as fallback");
                    chatSession.SessionId = chatSession.Id;

                    // Update the chat session in the database with the sessionId
                    await _chatSessionRepository.UpdateChatSessionAsync(chatSession.Id, chatSession);
                }

                // Determine if this is the first chat or continuation
                var isFirstChat = chatSession.ChatItems == null || !chatSession.ChatItems.Any();
                var action = request.Action ?? (isFirstChat ? "start_chat" : "continue_chat");

                _logger.LogInformation("Processing chatbot request: {ChatSessionId}, Action: {Action}, IsFirstChat: {IsFirstChat}",
                    request.ChatSessionId, action, isFirstChat);

                // Call N8N API
                var n8NResponse = await CallN8NApiAsync(chatSession, request.Message, action);

                // Create chat items for user message and bot response
                var userChatItem = new ChatItem
                {
                    Content = request.Message,
                    IsBot = false,
                    CreatedDate = DateTime.UtcNow
                };

                var botChatItem = new ChatItem
                {
                    Content = n8NResponse.FullAnswer,
                    IsBot = true,
                    CreatedDate = DateTime.UtcNow,
                    MetaData = new ChatItemMetaData
                    {
                        PubmedQueryUrl = n8NResponse.PubmedQueryUrl,
                        PubmedFetchUrl = !string.IsNullOrEmpty(n8NResponse.PubmedFetchUrl) 
                            ? new List<string> { n8NResponse.PubmedFetchUrl } 
                            : null
                    }
                };

                // Update chat session with new chat items
                var updatedChatItems = new List<ChatItem>();
                if (chatSession.ChatItems != null)
                {
                    updatedChatItems.AddRange(chatSession.ChatItems);
                }
                updatedChatItems.Add(userChatItem);
                updatedChatItems.Add(botChatItem);

                var updatedChatSession = new DoctorService.Models.ChatSession
                {
                    ChatItems = updatedChatItems,
                    UpdatedDate = DateTime.UtcNow
                };

                await _chatSessionRepository.UpdateChatSessionAsync(chatSession.Id, updatedChatSession);

                var response = new ChatbotResponse
                {
                    ChatSessionId = chatSession.Id,
                    UserChatItem = userChatItem,
                    BotChatItem = botChatItem,
                    BotResponse = n8NResponse,
                    Timestamp = DateTime.UtcNow
                };

                return new ApiResponse<ChatbotResponse>
                {
                    Success = true,
                    Message = "Chat message processed successfully",
                    DataResponse = response
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing chatbot request: {ChatSessionId}", request.ChatSessionId);
                return new ApiResponse<ChatbotResponse>
                {
                    Success = false,
                    Message = "Internal server error",
                    Error = ex.Message,
                    Stack = ex.StackTrace
                };
            }
        }

        public async Task<ApiResponse<List<ChatSessionResponse>>> GetChatSessionsByFolderIdAsync(string folderId)
        {
            try
            {
                if (string.IsNullOrEmpty(folderId))
                {
                    return new ApiResponse<List<ChatSessionResponse>>
                    {
                        Success = false,
                        Message = "Folder ID is required",
                        Error = "Folder ID cannot be null or empty"
                    };
                }

                var chatSessions = await _chatSessionRepository.GetByFolderIdAsync(folderId);
                var response = chatSessions.Select(MapToChatSessionResponse).ToList();
                
                return new ApiResponse<List<ChatSessionResponse>>
                {
                    Success = true,
                    Message = "Chat sessions retrieved successfully",
                    DataResponse = response
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chat sessions by folder id: {FolderId}", folderId);
                return new ApiResponse<List<ChatSessionResponse>>
                {
                    Success = false,
                    Message = "Internal server error",
                    Error = ex.Message,
                    Stack = ex.StackTrace
                };
            }
        }

        public async Task<ApiResponse<bool>> DeleteChatSessionAsync(string chatSessionId)
        {
            try
            {
                if (string.IsNullOrEmpty(chatSessionId))
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Chat session ID is required",
                        Error = "Chat session ID cannot be null or empty"
                    };
                }

                var result = await _chatSessionRepository.DeleteChatSessionAsync(chatSessionId);
                if (!result)
                {
                    return new ApiResponse<bool>
                    {
                        Success = false,
                        Message = "Failed to delete chat session",
                        Error = $"Chat session with ID {chatSessionId} was not found or could not be deleted"
                    };
                }

                return new ApiResponse<bool>
                {
                    Success = true,
                    Message = "Chat session deleted successfully",
                    DataResponse = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting chat session: {ChatSessionId}", chatSessionId);
                return new ApiResponse<bool>
                {
                    Success = false,
                    Message = "Internal server error",
                    Error = ex.Message,
                    Stack = ex.StackTrace
                };
            }
        }

        public async Task<GradcamAnalyses> TestGradCamProcessingAsync(GradcamAnalyses gradcamAnalyses, string chatSessionId)
        {
            try
            {
                _logger.LogInformation("Testing GradCam processing for session: {ChatSessionId}", chatSessionId);
                return await _gradCamImageService.ProcessAndUploadGradCamImagesAsync(gradcamAnalyses, chatSessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in test GradCam processing for session: {ChatSessionId}", chatSessionId);
                throw;
            }
        }

        private async Task<string> UploadXrayImageToS3Async(byte[] imageBytes, string chatSessionId)
        {
            try
            {
                _logger.LogInformation("Uploading X-ray image to S3 for chat session: {ChatSessionId}, Image size: {Size} bytes", chatSessionId, imageBytes.Length);
                
                // Generate file path for the X-ray image
                var fileName = $"xray/{chatSessionId}/xray_image.png";
                
                // Upload to S3
                var s3Url = await _s3Repository.UploadFileAsync(imageBytes, fileName, "image/png");
                
                if (string.IsNullOrEmpty(s3Url))
                {
                    _logger.LogError("S3 upload returned empty URL for chat session: {ChatSessionId}", chatSessionId);
                    throw new InvalidOperationException("Failed to upload X-ray image to S3: Empty URL returned");
                }
                
                _logger.LogInformation("X-ray image uploaded successfully to S3: {Url}", s3Url);
                return s3Url;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading X-ray image to S3 for chat session: {ChatSessionId}", chatSessionId);
                throw;
            }
        }

        private async Task<Result> ConvertCliniAiResponseToResultAsync(CliniAiResponse cliniAiResponse, string chatSessionId)
        {
            try
            {
                _logger.LogInformation("Converting CliniAI response to Result for chat session: {ChatSessionId}", chatSessionId);
                
                // Check if GradcamAnalyses is null
                if (cliniAiResponse.GradcamAnalyses == null)
                {
                    _logger.LogError("GradcamAnalyses is null in CliniAI response!");
                    throw new InvalidOperationException("GradcamAnalyses is null in CliniAI response");
                }
                
                // Log the original GradCam data
                var dynamicKeysCount = cliniAiResponse.GradcamAnalyses.DynamicKeys?.Count ?? 0;
                _logger.LogInformation("Original GradCam data - Dynamic keys count: {Count}", dynamicKeysCount);
                
                if (cliniAiResponse.GradcamAnalyses.DynamicKeys != null && cliniAiResponse.GradcamAnalyses.DynamicKeys.Any())
                {
                    foreach (var kvp in cliniAiResponse.GradcamAnalyses.DynamicKeys)
                    {
                        var valueStr = kvp.Value.GetString() ?? string.Empty;
                        _logger.LogInformation("GradCam key: {Key}, value length: {Length}", kvp.Key, valueStr.Length);
                    }
                }
                else
                {
                    _logger.LogWarning("GradcamAnalyses.DynamicKeys is null or empty! The gradcam_analyses object might not have been deserialized correctly.");
                }

                // Process and upload GradCam images to S3
                var processedGradcamAnalyses = await _gradCamImageService.ProcessAndUploadGradCamImagesAsync(
                    cliniAiResponse.GradcamAnalyses, 
                    chatSessionId);

                _logger.LogInformation("Processed GradCam analyses completed for session: {ChatSessionId}", chatSessionId);

                var result = new Result
                {
                    PredictedDiseases = cliniAiResponse.PredictedDiseases,
                    Top5Diseases = cliniAiResponse.Top5Diseases,
                    GradcamAnalyses = processedGradcamAnalyses,
                    AttentionMap = "", // This can be processed separately if needed
                    IndividualAnalyses = cliniAiResponse.IndividualAnalyses,
                    ConciseConclusion = cliniAiResponse.ConciseConclusion,
                    ComprehensiveAnalysis = cliniAiResponse.ComprehensiveAnalysis
                };

                _logger.LogInformation("Final Result created with GradCam URLs - Top1Pneumothorax: {Url1}, Top2Atelectasis: {Url2}, Top3Edema: {Url3}, Top4Pneumonia: {Url4}, Top5PleuralThickening: {Url5}", 
                    result.GradcamAnalyses.Top1Pneumothorax,
                    result.GradcamAnalyses.Top2Atelectasis,
                    result.GradcamAnalyses.Top3Edema,
                    result.GradcamAnalyses.Top4Pneumonia,
                    result.GradcamAnalyses.Top5PleuralThickening);

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error converting CliniAI response to Result for chat session: {ChatSessionId}", chatSessionId);
                throw;
            }
        }

        private Task UpdateFolderWithChatSessionAsync(string folderId, string chatSessionId)
        {
            try
            {
                // Placeholder for folder update
                // This should be implemented to update the folder with the new chat session ID
                _logger.LogInformation("Updating folder {FolderId} with chat session {ChatSessionId}", folderId, chatSessionId);
                return Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating folder with chat session");
                throw;
            }
        }

        private Task<N8NOutputData> CallN8NApiAsync(DoctorService.Models.ChatSession chatSession, string _, string action)
        {
            try
            {
                // Placeholder for N8N API call
                // This should be implemented to call the actual N8N API
                _logger.LogInformation("Calling N8N API for chat session: {ChatSessionId}, Action: {Action}", chatSession.Id, action);

                // For now, return a mock response
                return Task.FromResult(new N8NOutputData
                {
                    SummarizeAnswer = "Based on the X-ray analysis, there are signs of pneumonia.",
                    FullAnswer = "Based on the X-ray analysis, there are clear signs of pneumonia with consolidation in the lower lobe. The patient should be treated with appropriate antibiotics and monitored closely.",
                    PubmedQueryUrl = "https://pubmed.ncbi.nlm.nih.gov/?term=pneumonia+xray",
                    PubmedFetchUrl = "https://pubmed.ncbi.nlm.nih.gov/12345678/"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling N8N API");
                throw;
            }
        }

        private ChatSessionResponse MapToChatSessionResponse(DoctorService.Models.ChatSession chatSession)
        {
            return new ChatSessionResponse
            {
                Id = chatSession.Id,
                SessionId = chatSession.SessionId,
                Title = chatSession.Title,
                Result = chatSession.Result,
                XrayImageUrl = chatSession.XrayImageUrl,
                ChatItems = chatSession.ChatItems,
                Reports = chatSession.Reports,
                IsDeleted = chatSession.IsDeleted,
                CreatedDate = chatSession.CreatedDate,
                UpdatedDate = chatSession.UpdatedDate
            };
        }
    }
}
