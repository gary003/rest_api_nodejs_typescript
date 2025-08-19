## Tempo startup configuration

echo "-- Execution of the project startup configuration script --"

chmod 755 ./src/v1/infrastructure/observability/trace_data_volume

if [[ ! -d "./src/v1/infrastructure/observability/trace_data_volume/wal/blocks" ]]; then
    echo "tempo:config : Creation of './src/v1/infrastructure/observability/trace_data_volume/wal/blocks' folder"
    mkdir -p "./src/v1/infrastructure/observability/trace_data_volume/wal/blocks"
fi

if [[ ! -d "./src/v1/infrastructure/observability/trace_data_volume/blocks" ]]; then
    echo "tempo:config : Creation of './src/v1/infrastructure/observability/trace_data_volume/blocks' folder"
    mkdir -p "./src/v1/infrastructure/observability/trace_data_volume/blocks"
fi

chmod 777 ./src/v1/infrastructure/observability/trace_data_volume/wal
chmod 777 ./src/v1/infrastructure/observability/trace_data_volume/blocks

echo "-- End of startup configuration script --"
