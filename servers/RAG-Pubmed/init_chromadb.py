#!/usr/bin/env python3
"""
Script to initialize ChromaDB tenant and database
This should be run before starting the main API server
"""
import os
import sys
import time
import requests
from dotenv import load_dotenv

load_dotenv()

def init_chromadb():
    chroma_host = os.getenv("CHROMA_HOST", "localhost")
    chroma_port = int(os.getenv("CHROMA_PORT", "7000"))
    
    base_url = f"http://{chroma_host}:{chroma_port}"
    
    print(f"Initializing ChromaDB at {base_url}...")
    
    # Wait for ChromaDB to be ready
    max_wait = 30
    wait_interval = 2
    for i in range(max_wait // wait_interval):
        try:
            response = requests.get(f"{base_url}/api/v2/version", timeout=5)
            if response.status_code == 200:
                print(f"ChromaDB server is ready (version: {response.text.strip()})")
                break
        except Exception as e:
            if i < (max_wait // wait_interval - 1):
                print(f"Waiting for ChromaDB... ({i * wait_interval}s)")
                time.sleep(wait_interval)
            else:
                print(f"ChromaDB not ready after {max_wait}s: {e}")
                return False
    
    # Try to create tenant
    tenant_created = False
    for api_version in ["v1", "v2"]:
        try:
            tenant_url = f"{base_url}/api/{api_version}/tenants/default_tenant"
            response = requests.put(tenant_url, json={}, timeout=10)
            if response.status_code in [200, 201, 409]:
                print(f"Tenant 'default_tenant' exists or created (API {api_version})")
                tenant_created = True
                break
        except Exception as e:
            print(f"Failed to create tenant via {api_version} API: {e}")
            continue
    
    if not tenant_created:
        print("Warning: Could not create tenant via HTTP API")
    
    # Try to create database
    database_created = False
    for api_version in ["v1", "v2"]:
        try:
            db_url = f"{base_url}/api/{api_version}/databases/default_database"
            db_payload = {"tenant": "default_tenant"}
            response = requests.put(db_url, json=db_payload, timeout=10)
            if response.status_code in [200, 201, 409]:
                print(f"Database 'default_database' exists or created (API {api_version})")
                database_created = True
                break
        except Exception as e:
            print(f"Failed to create database via {api_version} API: {e}")
            continue
    
    if not database_created:
        print("Warning: Could not create database via HTTP API")
        print("The main application will attempt to create tenant/database on connection")
        # Don't fail - let the main app handle it with retries
        return True
    
    print("ChromaDB initialization completed successfully!")
    return True

if __name__ == "__main__":
    # Always return success - initialization is best-effort
    # The main application will handle tenant/database creation with retries
    init_chromadb()
    sys.exit(0)

