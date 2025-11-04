
## Chạy từng services

# Terminal 1
`dotnet run --project .\ApiGateway\ApiGateway.csproj`

# Terminal 2
`dotnet run --project .\AiServices\AiServices.csproj`
# mở: http://localhost:8082/health, http://localhost:8082/swagger

# Terminal 3
`dotnet run --project .\PatientService\PatientService.csproj`

# Terminal 4
`dotnet run --project .\IdentityService\IdentityService.csproj`

# Terminal 5
`dotnet run --project .\DoctorService\DoctorService.csproj`

# Open Swagger
`http://localhost:8080/swagger`