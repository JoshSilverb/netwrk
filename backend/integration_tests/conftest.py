import boto3
import psycopg2
import pytest
from pathlib import Path
from moto import mock_aws

@pytest.fixture(scope='function')
def reset_db():
    # Connect to the database
    conn = psycopg2.connect(
        dbname="netwrkdb",
        user="postgres",
        password="postgres",  # assuming no security, as you said
        host="db",            # use service name defined in docker-compose
        port="5432"
    )
    conn.autocommit = True
    cursor = conn.cursor()

    # Optional: Drop all tables (useful if schema.sql does not drop first)
    cursor.execute("""DROP SCHEMA public CASCADE; CREATE SCHEMA public;""")

    # Run schema.sql
    schema_sql_path = Path(__file__).resolve().parent.parent / \
                                        "sql" / "init" / "schema.sql"
    with open(schema_sql_path, "r") as f:
        schema_sql = f.read()
        cursor.execute(schema_sql)

    cursor.close()
    conn.close()

    # Yield control back to test
    yield


# Fixture to mock AWS Secrets Manager
@pytest.fixture
def mock_secrets():
    # Start mocking the Secrets Manager
    with mock_aws():
        client = boto3.client('secretsmanager', region_name="us-east-2")
        
        # Create mock secrets
        client.create_secret(
            Name="netwrkdb-pwd-1",
            SecretString='{"username": "postgres", "password": "postgres", "host": "netwrkdb", "port": 5432}'
        )
        client.create_secret(
            Name="google-api-key-1",
            SecretString='{"api-key": "google-api-key"}'
        )
        client.create_secret(
            Name="openai-api-key",
            SecretString='{"api-key": "openai-api-key"}'
        )

        # Yield the client so tests can use it if necessary
        yield client
