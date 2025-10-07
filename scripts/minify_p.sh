echo "" > project_mini.log

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
    echo "------- file: $file -------" >> project_mini.log
    cat "$file" >> project_mini.log
    echo "" >> project_mini.log
done