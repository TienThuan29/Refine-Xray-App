{
  "Logging": { "LogLevel": { "Default": "Information", "Microsoft.AspNetCore": "Warning" } },
  "AllowedHosts": "*",
  "ReverseProxy": {
    "Routes": {
      "account_route": {
        "ClusterId": "account_cluster",
        "Match": { "Path": "/account-service/{**catch-all}" },
        "Transforms": [
          { "PathPattern": "/{catch-all}" }
          // rewrite /account-service/x -> /x
        ]
      },
      "orchid_route": {
        "ClusterId": "orchid_cluster",
        "Match": { "Path": "/orchid-service/{**catch-all}" },
        "Transforms": [
          { "PathPattern": "/{catch-all}" }
        ]
      }
    },
    "Clusters": {
      "account_cluster": {
        "Destinations": {
          "d1": { "Address": "http://localhost:8081/" }
        }
      },
      "orchid_cluster": {
        "Destinations": {
          "d1": { "Address": "http://localhost:8082/" }
        }
      }
    }
  }
}

