PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
PARENT_DIR=$(dirname "$PROJECT_DIR")
PROJECT_NAME=$(basename "$PROJECT_DIR")
BACKUP_DIR="${PARENT_DIR}/${PROJECT_NAME}_backup_$(date +%Y%m%d_%H%M%S)"
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

echo "Stopping service before backup..."
"$SCRIPT_DIR/service.sh" stop
if [ $? -ne 0 ]; then
    echo "Error: Failed to stop service!"
    exit 1
fi

echo "Creating backup in $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"

rsync -av --exclude='.next' --exclude='node_modules' --exclude="*_backup_*" "$PROJECT_DIR/" "$BACKUP_DIR/"
BACKUP_STATUS=$?

echo "Starting service after backup..."
"$SCRIPT_DIR/service.sh" start

if [ $BACKUP_STATUS -eq 0 ]; then
    echo "Backup completed successfully!"
    echo "Backup location: $BACKUP_DIR"
else
    echo "Error: Backup failed!"
    exit 1
fi
