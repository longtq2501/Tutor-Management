#!/bin/bash

# Configuration
BACKUP_DIR="/opt/tutor-management/backups"
DB_NAME=${MYSQL_DATABASE:-tutor_management_db}
DB_USER="root"
DB_PASS=${MYSQL_ROOT_PASSWORD}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting backup of $DB_NAME to $BACKUP_FILE..."

# Perform the backup
docker exec mysql_db_prod mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup successful: $BACKUP_FILE"
    
    # Optional: Prune old backups (keep last 7 days)
    find "$BACKUP_DIR" -type f -name "*.sql" -mtime +7 -delete
    
    # TODO: Implement Cloudinary/S3 upload here if required
    # cloudinary_upload "$BACKUP_FILE"
else
    echo "Backup failed!"
    exit 1
fi
