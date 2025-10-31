
## Chạy từng services

# Terminal 1
`dotnet run --project .\ApiGateway\ApiGateway.csproj`

# Terminal 1
`dotnet run --project .\MasterServices\MasterServices.csproj`
# mở: http://localhost:8081/health, http://localhost:8081/swagger

# Terminal 2
`dotnet run --project .\AiServices\AiServices.csproj`
# mở: http://localhost:8082/health, http://localhost:8082/swagger

# Open Swagger
`http://localhost:8080/swagger`