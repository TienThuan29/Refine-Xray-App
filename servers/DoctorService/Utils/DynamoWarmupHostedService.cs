using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace DoctorService.Utils
{
    public class DynamoWarmupHostedService : IHostedService
    {
        private readonly IAmazonDynamoDB _dynamoDb;
        private readonly ILogger<DynamoWarmupHostedService> _logger;
        private readonly IConfiguration _configuration;

        public DynamoWarmupHostedService(
            IAmazonDynamoDB dynamoDb,
            IConfiguration configuration,
            ILogger<DynamoWarmupHostedService> logger)
        {
            _dynamoDb = dynamoDb;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

            // Get tables that belong to this service (DoctorService)
            var tablesToWarmUp = new List<string>
            {
                _configuration["DynamoDB:FolderTable"] ?? "prm392-folders",
                _configuration["DynamoDB:ChatSessionTable"] ?? "prm392-chatsessions"
            };

            // Optionally warm up ReportTable if it exists in this service
            var reportTable = _configuration["DynamoDB:ReportTable"];
            if (!string.IsNullOrEmpty(reportTable))
            {
                tablesToWarmUp.Add(reportTable);
            }

            foreach (var tableName in tablesToWarmUp)
            {
                try
                {
                    _logger.LogInformation("Warming up DynamoDB table: {Table}", tableName);
                    await _dynamoDb.DescribeTableAsync(new DescribeTableRequest { TableName = tableName }, linkedCts.Token);
                    _logger.LogInformation("DynamoDB table warm-up completed: {Table}", tableName);
                }
                catch (ResourceNotFoundException)
                {
                    _logger.LogWarning("DynamoDB table not found (may be in another service): {Table}", tableName);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogWarning("DynamoDB warm-up timed out for table: {Table}; continuing startup", tableName);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "DynamoDB warm-up failed for table: {Table}; will retry on first real call", tableName);
                }
            }
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}


