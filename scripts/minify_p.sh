DIR_NAME=$(basename "$PWD")
CURRENT_DATE=$(date +%Y%m%d_%H%M%S)

OUTPUT_FILE="logs/project_dump_${DIR_NAME}_${CURRENT_DATE}.txt"

echo "" > "$OUTPUT_FILE"

find . -type f \
! -path "*/node_modules/*" \
! -path "*/logs/*" \
! -path "*/coverage/*" \
! -path "*/db_volume/*" \
! -path "*/grafana_data_volume/*" \
! -path "*/promtail/*" \
! -path "*/trace_data_volume/*" \
! -path "*/.git/*" \
! -path "*/github/*" \
! -name "package.json" \
! -name "package-lock.json" | \
while read -r file; do
    echo "------- file: $file -------" >> "$OUTPUT_FILE"
    cat "$file" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
done