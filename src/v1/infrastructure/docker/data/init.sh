#!/bin/bash

# Check if POSTGRES_DATABASE_NAME is set
if [ -z "$POSTGRES_DATABASE_NAME" ]; then
    echo "Error: POSTGRES_DATABASE_NAME is not set"
    exit 1
fi

# Path to SQL script
SQL_FILE="./tmp/sqlCreation.sql"

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo "Error: SQL file $SQL_FILE does not exist."
    exit 1
fi

# Create a database
psql -U postgres -c "CREATE DATABASE ${POSTGRES_DATABASE_NAME};" || { echo "Failed to create database"; exit 1; }

# Grant privileges to the user
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DATABASE_NAME} TO postgres;" || { echo "Failed to grant privileges"; exit 1; }

# Import initial data from sqlCreation.sql
psql -U postgres -d "$POSTGRES_DATABASE_NAME" -f "$SQL_FILE" || { echo "Failed to import data"; exit 1; }

# Set custom configurations (placeholder for additional configurations)
# echo "Setting custom configurations..."

echo "Database initialization complete!!"