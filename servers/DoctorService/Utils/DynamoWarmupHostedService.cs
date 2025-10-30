using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace DoctorService.Utils
{
    public class DynamoWarmupHostedService : IHostedService
    {
        private readonly IAmazonDynamoDB _dynamoDb;
        private readonly ILogger<DynamoWarmupHostedService> _logger;
        private readonly string _tableName;

        public DynamoWarmupHostedService(
            IAmazonDynamoDB dynamoDb,
            IConfiguration configuration,
            ILogger<DynamoWarmupHostedService> logger)
        {
            _dynamoDb = dynamoDb;
            _logger = logger;
            _tableName = configuration["DynamoDB:UserTable"] ?? "prm392-users";
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

            try
            {
                _logger.LogInformation("Warming up DynamoDB by describing table: {Table}", _tableName);
                await _dynamoDb.DescribeTableAsync(new DescribeTableRequest { TableName = _tableName }, linkedCts.Token);
                _logger.LogInformation("DynamoDB warm-up completed");
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("DynamoDB warm-up timed out; continuing startup");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DynamoDB warm-up failed; will retry on first real call");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}


