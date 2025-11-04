using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace AdminService.Utils
{
    public class DynamoWarmupHostedService : IHostedService
    {
        private readonly IAmazonDynamoDB _dynamoDb;
        private readonly ILogger<DynamoWarmupHostedService> _logger;
        private readonly string[] _tableNames;

        public DynamoWarmupHostedService(
            IAmazonDynamoDB dynamoDb,
            IConfiguration configuration,
            ILogger<DynamoWarmupHostedService> logger)
        {
            _dynamoDb = dynamoDb;
            _logger = logger;
            _tableNames = new[]
            {
                configuration["DynamoDB:ReportTemplateTable"] ?? "prm392-report-templates"
            };
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

            foreach (var tableName in _tableNames)
            {
                try
                {
                    _logger.LogInformation("Warming up DynamoDB by describing table: {Table}", tableName);
                    await _dynamoDb.DescribeTableAsync(new DescribeTableRequest { TableName = tableName }, linkedCts.Token);
                    _logger.LogInformation("DynamoDB warm-up completed for table: {Table}", tableName);
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


