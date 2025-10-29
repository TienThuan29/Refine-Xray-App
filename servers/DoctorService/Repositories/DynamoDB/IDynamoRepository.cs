using Amazon.DynamoDBv2.Model;

namespace DoctorService.Repositories;

public interface IDynamoRepository
{
    Task<PutItemResponse> PutItemAsync(Dictionary<string, AttributeValue> item, string tableName);
    Task<GetItemResponse> GetItemAsync(Dictionary<string, AttributeValue> key, string tableName);
    Task<UpdateItemResponse> UpdateItemAsync(Dictionary<string, AttributeValue> key, Dictionary<string, AttributeValueUpdate> updates, string tableName);
    Task<DeleteItemResponse> DeleteItemAsync(Dictionary<string, AttributeValue> key, string tableName);
    Task<ScanResponse> ScanAsync(string tableName, string? filterExpression = null);
    Task<QueryResponse> QueryAsync(string tableName, Dictionary<string, Condition> keyConditions);
    Task<CreateTableResponse> CreateTableAsync(string tableName, List<AttributeDefinition> attributes, List<KeySchemaElement> keySchema);
    Task<bool> TableExistsAsync(string tableName);
}

