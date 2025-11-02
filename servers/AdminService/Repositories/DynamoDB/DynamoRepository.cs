using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace AdminService.Repositories
{
    public class DynamoRepository : IDynamoRepository
    {
        protected readonly IAmazonDynamoDB _dynamoDBClient;
        protected readonly ILogger<DynamoRepository> _logger;
        protected readonly string _tableName;

        public DynamoRepository(
            IAmazonDynamoDB dynamoDBClient,
            IConfiguration configuration,
            ILogger<DynamoRepository> logger
        )
        {
            _dynamoDBClient = dynamoDBClient;
            _logger = logger;
            _tableName = configuration["DynamoDB:TableName"] ?? "DefaultTable";
        }

        public async Task<PutItemResponse> PutItemAsync(Dictionary<string, AttributeValue> item, string tableName)
        {
            try
            {
                var request = new PutItemRequest
                {
                    TableName = tableName,
                    Item = item
                };
                var response = await _dynamoDBClient.PutItemAsync(request);
                _logger.LogInformation($"Successfully put item to table {tableName}");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error putting item to table {tableName}");
                throw;
            }
        }

        public async Task<GetItemResponse> GetItemAsync(Dictionary<string, AttributeValue> key, string tableName)
        {
            try
            {
                var request = new GetItemRequest
                {
                    TableName = tableName,
                    Key = key
                };
                var response = await _dynamoDBClient.GetItemAsync(request);
                _logger.LogInformation($"Successfully retrieved item from table {tableName}");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting item from table {tableName}");
                throw;
            }
        }

        public async Task<UpdateItemResponse> UpdateItemAsync(Dictionary<string, AttributeValue> key, Dictionary<string, AttributeValueUpdate> updates, string tableName)
        {
            try
            {
                var request = new UpdateItemRequest
                {
                    TableName = tableName,
                    Key = key,
                    AttributeUpdates = updates
                };
                var response = await _dynamoDBClient.UpdateItemAsync(request);
                _logger.LogInformation($"Successfully updated item in table {tableName}");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating item in table {tableName}");
                throw;
            }
        }

        public async Task<DeleteItemResponse> DeleteItemAsync(Dictionary<string, AttributeValue> key, string tableName)
        {
            try
            {
                var request = new DeleteItemRequest
                {
                    TableName = tableName,
                    Key = key
                };
                var response = await _dynamoDBClient.DeleteItemAsync(request);
                _logger.LogInformation($"Successfully deleted item from table {tableName}");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting item from table {tableName}");
                throw;
            }
        }

        public async Task<ScanResponse> ScanAsync(string tableName, string? filterExpression = null)
        {
            try
            {
                var request = new ScanRequest
                {
                    TableName = tableName
                };
                if (!string.IsNullOrEmpty(filterExpression))
                {
                    request.FilterExpression = filterExpression;
                }
                var response = await _dynamoDBClient.ScanAsync(request);
                _logger.LogInformation($"Successfully scanned table {tableName}");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error scanning table {tableName}");
                throw;
            }
        }

        public async Task<QueryResponse> QueryAsync(string tableName, Dictionary<string, Condition> keyConditions)
        {
            try
            {
                var request = new QueryRequest
                {
                    TableName = tableName,
                    KeyConditions = keyConditions
                };
                var response = await _dynamoDBClient.QueryAsync(request);
                _logger.LogInformation($"Successfully queried table {tableName}");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error querying table {tableName}");
                throw;
            }
        }

        public async Task<CreateTableResponse> CreateTableAsync(string tableName, List<AttributeDefinition> attributes, List<KeySchemaElement> keySchema)
        {
            try
            {
                var request = new CreateTableRequest
                {
                    TableName = tableName,
                    AttributeDefinitions = attributes,
                    KeySchema = keySchema,
                    BillingMode = BillingMode.PAY_PER_REQUEST
                };
                var response = await _dynamoDBClient.CreateTableAsync(request);
                _logger.LogInformation($"Successfully created table {tableName}");
                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating table {tableName}");
                throw;
            }
        }

        public async Task<bool> TableExistsAsync(string tableName)
        {
            try
            {
                var request = new DescribeTableRequest
                {
                    TableName = tableName
                };
                await _dynamoDBClient.DescribeTableAsync(request);
                return true;
            }
            catch (ResourceNotFoundException)
            {
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking if table {tableName} exists");
                throw;
            }
        }
    }
}