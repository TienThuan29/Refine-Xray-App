using Amazon.DynamoDBv2;
using Amazon.DynamoDBv2.Model;

namespace IdentityService.Utils
{
    public class DynamoWarmupHostedService : IHostedService
    {
        private readonly IAmazonDynamoDB _dynamoDb;
        private readonly ILogger<DynamoWarmupHostedService> _logger;
        private readonly string _userTableName;

        public DynamoWarmupHostedService(
            IAmazonDynamoDB dynamoDb,
            IConfiguration configuration,
            ILogger<DynamoWarmupHostedService> logger)
        {
            _dynamoDb = dynamoDb;
            _logger = logger;
            _userTableName = configuration["DynamoDB:UserTable"] ?? "prm392-users";
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

            try
            {
                _logger.LogInformation("Warming up DynamoDB connection by describing table: {Table}", _userTableName);
                await _dynamoDb.DescribeTableAsync(new DescribeTableRequest
                {
                    TableName = _userTableName
                }, linkedCts.Token);
                _logger.LogInformation("DynamoDB warm-up completed");
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("DynamoDB warm-up timed out; proceeding without blocking startup");
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "DynamoDB warm-up failed; service will attempt on first real call");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}


