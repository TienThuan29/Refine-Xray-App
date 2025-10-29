using DoctorService.Models;
using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using System.Text.Json;

namespace DoctorService.Repositories.ChatSession
{
    public class ChatSessionRepository : IChatSessionRepository
    {
        private readonly IAmazonDynamoDB _dynamoDb;
        private readonly string _tableName;
        private readonly ILogger<ChatSessionRepository> _logger;

        public ChatSessionRepository(IAmazonDynamoDB dynamoDb, IConfiguration configuration, ILogger<ChatSessionRepository> logger)
        {
            _dynamoDb = dynamoDb;
            _tableName = configuration["DynamoDB:ChatSessionTable"] ?? "ChatSessions";
            _logger = logger;
        }

        public async Task<DoctorService.Models.ChatSession?> CreateChatSessionAsync(DoctorService.Models.ChatSession chatSession)
        {
            try
            {
                chatSession.CreatedDate = DateTime.UtcNow;
                chatSession.UpdatedDate = DateTime.UtcNow;
                chatSession.IsDeleted = false;

                var item = new Dictionary<string, AttributeValue>
                {
                    ["id"] = new AttributeValue { S = chatSession.Id },
                    ["sessionId"] = new AttributeValue { S = chatSession.SessionId },
                    ["title"] = new AttributeValue { S = chatSession.Title },
                    ["isDeleted"] = new AttributeValue { BOOL = chatSession.IsDeleted },
                    ["createdDate"] = new AttributeValue { S = chatSession.CreatedDate.Value.ToString("O") },
                    ["updatedDate"] = new AttributeValue { S = chatSession.UpdatedDate.Value.ToString("O") }
                };

                if (!string.IsNullOrEmpty(chatSession.XrayImageUrl))
                {
                    item["xrayImageUrl"] = new AttributeValue { S = chatSession.XrayImageUrl };
                }

                if (chatSession.Result != null)
                {
                    item["result"] = new AttributeValue { S = JsonSerializer.Serialize(chatSession.Result) };
                }

                if (chatSession.ChatItems?.Any() == true)
                {
                    item["chatItems"] = new AttributeValue { S = JsonSerializer.Serialize(chatSession.ChatItems) };
                }

                if (chatSession.Reports?.Any() == true)
                {
                    item["reports"] = new AttributeValue { S = JsonSerializer.Serialize(chatSession.Reports) };
                }

                var request = new PutItemRequest
                {
                    TableName = _tableName,
                    Item = item
                };

                await _dynamoDb.PutItemAsync(request);
                _logger.LogInformation("Chat session created successfully: {ChatSessionId}", chatSession.Id);

                return await GetByIdAsync(chatSession.Id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating chat session: {ChatSessionId}", chatSession.Id);
                return null;
            }
        }

        public async Task<DoctorService.Models.ChatSession?> GetByIdAsync(string chatSessionId)
        {
            try
            {
                var request = new GetItemRequest
                {
                    TableName = _tableName,
                    Key = new Dictionary<string, AttributeValue>
                    {
                        ["id"] = new AttributeValue { S = chatSessionId }
                    }
                };

                var response = await _dynamoDb.GetItemAsync(request);

                if (!response.Item.Any())
                {
                    return null;
                }

                return MapToChatSession(response.Item);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chat session by id: {ChatSessionId}", chatSessionId);
                return null;
            }
        }

        public async Task<DoctorService.Models.ChatSession?> UpdateChatSessionAsync(string chatSessionId, DoctorService.Models.ChatSession updates)
        {
            try
            {
                updates.UpdatedDate = DateTime.UtcNow;

                var updateExpressions = new List<string>();
                var expressionAttributeNames = new Dictionary<string, string>();
                var expressionAttributeValues = new Dictionary<string, AttributeValue>();

                // Add updatedDate
                updateExpressions.Add("#updatedDate = :updatedDate");
                expressionAttributeNames["#updatedDate"] = "updatedDate";
                expressionAttributeValues[":updatedDate"] = new AttributeValue { S = updates.UpdatedDate.Value.ToString("O") };

                // Add other fields if they have values
                if (!string.IsNullOrEmpty(updates.SessionId))
                {
                    updateExpressions.Add("#sessionId = :sessionId");
                    expressionAttributeNames["#sessionId"] = "sessionId";
                    expressionAttributeValues[":sessionId"] = new AttributeValue { S = updates.SessionId };
                }

                if (!string.IsNullOrEmpty(updates.Title))
                {
                    updateExpressions.Add("#title = :title");
                    expressionAttributeNames["#title"] = "title";
                    expressionAttributeValues[":title"] = new AttributeValue { S = updates.Title };
                }

                if (!string.IsNullOrEmpty(updates.XrayImageUrl))
                {
                    updateExpressions.Add("#xrayImageUrl = :xrayImageUrl");
                    expressionAttributeNames["#xrayImageUrl"] = "xrayImageUrl";
                    expressionAttributeValues[":xrayImageUrl"] = new AttributeValue { S = updates.XrayImageUrl };
                }

                if (updates.Result != null)
                {
                    updateExpressions.Add("#result = :result");
                    expressionAttributeNames["#result"] = "result";
                    expressionAttributeValues[":result"] = new AttributeValue { S = JsonSerializer.Serialize(updates.Result) };
                }

                if (updates.ChatItems != null)
                {
                    updateExpressions.Add("#chatItems = :chatItems");
                    expressionAttributeNames["#chatItems"] = "chatItems";
                    expressionAttributeValues[":chatItems"] = new AttributeValue { S = JsonSerializer.Serialize(updates.ChatItems) };
                }

                if (updates.Reports != null)
                {
                    updateExpressions.Add("#reports = :reports");
                    expressionAttributeNames["#reports"] = "reports";
                    expressionAttributeValues[":reports"] = new AttributeValue { S = JsonSerializer.Serialize(updates.Reports) };
                }

                if (!updateExpressions.Any())
                {
                    return await GetByIdAsync(chatSessionId);
                }

                var request = new UpdateItemRequest
                {
                    TableName = _tableName,
                    Key = new Dictionary<string, AttributeValue>
                    {
                        ["id"] = new AttributeValue { S = chatSessionId }
                    },
                    UpdateExpression = "SET " + string.Join(", ", updateExpressions),
                    ExpressionAttributeNames = expressionAttributeNames,
                    ExpressionAttributeValues = expressionAttributeValues
                };

                await _dynamoDb.UpdateItemAsync(request);
                _logger.LogInformation("Chat session updated successfully: {ChatSessionId}", chatSessionId);

                return await GetByIdAsync(chatSessionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating chat session: {ChatSessionId}", chatSessionId);
                return null;
            }
        }

        public async Task<bool> DeleteChatSessionAsync(string chatSessionId)
        {
            try
            {
                var request = new UpdateItemRequest
                {
                    TableName = _tableName,
                    Key = new Dictionary<string, AttributeValue>
                    {
                        ["id"] = new AttributeValue { S = chatSessionId }
                    },
                    UpdateExpression = "SET #isDeleted = :isDeleted, #updatedDate = :updatedDate",
                    ExpressionAttributeNames = new Dictionary<string, string>
                    {
                        ["#isDeleted"] = "isDeleted",
                        ["#updatedDate"] = "updatedDate"
                    },
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":isDeleted"] = new AttributeValue { BOOL = true },
                        [":updatedDate"] = new AttributeValue { S = DateTime.UtcNow.ToString("O") }
                    }
                };

                await _dynamoDb.UpdateItemAsync(request);
                _logger.LogInformation("Chat session deleted successfully: {ChatSessionId}", chatSessionId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting chat session: {ChatSessionId}", chatSessionId);
                return false;
            }
        }

        public async Task<List<DoctorService.Models.ChatSession>> GetByFolderIdAsync(string folderId)
        {
            try
            {
                var request = new ScanRequest
                {
                    TableName = _tableName,
                    FilterExpression = "folderId = :folderId AND #isDeleted = :isDeleted",
                    ExpressionAttributeNames = new Dictionary<string, string>
                    {
                        ["#isDeleted"] = "isDeleted"
                    },
                    ExpressionAttributeValues = new Dictionary<string, AttributeValue>
                    {
                        [":folderId"] = new AttributeValue { S = folderId },
                        [":isDeleted"] = new AttributeValue { BOOL = false }
                    }
                };

                var response = await _dynamoDb.ScanAsync(request);
                var chatSessions = new List<DoctorService.Models.ChatSession>();

                foreach (var item in response.Items)
                {
                    var chatSession = MapToChatSession(item);
                    if (chatSession != null)
                    {
                        chatSessions.Add(chatSession);
                    }
                }

                return chatSessions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chat sessions by folder id: {FolderId}", folderId);
                return new List<DoctorService.Models.ChatSession>();
            }
        }

        private DoctorService.Models.ChatSession? MapToChatSession(Dictionary<string, AttributeValue> item)
        {
            try
            {
                var chatSession = new DoctorService.Models.ChatSession
                {
                    Id = item.GetValueOrDefault("id")?.S ?? string.Empty,
                    SessionId = item.GetValueOrDefault("sessionId")?.S ?? string.Empty,
                    Title = item.GetValueOrDefault("title")?.S ?? string.Empty,
                    XrayImageUrl = item.GetValueOrDefault("xrayImageUrl")?.S,
                    IsDeleted = item.GetValueOrDefault("isDeleted")?.BOOL ?? false
                };

                if (DateTime.TryParse(item.GetValueOrDefault("createdDate")?.S, out var createdDate))
                {
                    chatSession.CreatedDate = createdDate;
                }

                if (DateTime.TryParse(item.GetValueOrDefault("updatedDate")?.S, out var updatedDate))
                {
                    chatSession.UpdatedDate = updatedDate;
                }

                if (!string.IsNullOrEmpty(item.GetValueOrDefault("result")?.S))
                {
                    chatSession.Result = JsonSerializer.Deserialize<Result>(item["result"].S);
                }

                if (!string.IsNullOrEmpty(item.GetValueOrDefault("chatItems")?.S))
                {
                    chatSession.ChatItems = JsonSerializer.Deserialize<List<ChatItem>>(item["chatItems"].S);
                }

                if (!string.IsNullOrEmpty(item.GetValueOrDefault("reports")?.S))
                {
                    chatSession.Reports = JsonSerializer.Deserialize<List<Report>>(item["reports"].S);
                }

                return chatSession;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error mapping DynamoDB item to ChatSession");
                return null;
            }
        }
    }
}

