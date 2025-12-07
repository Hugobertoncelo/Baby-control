SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Starting deployment process..."

echo "Step 1: Creating backup..."
"$SCRIPT_DIR/backup.sh"
if [ $? -ne 0 ]; then
    echo "Error: Backup failed! Deployment aborted."
    exit 1
fi

echo "Step 2: Stopping service..."
"$SCRIPT_DIR/service.sh" stop
if [ $? -ne 0 ]; then
    echo "Error: Failed to stop service! Deployment aborted."
    exit 1
fi

echo "Step 3: Deleting .next folder..."
if [ -d "$PROJECT_DIR/.next" ]; then
    rm -rf "$PROJECT_DIR/.next"
    echo ".next folder deleted successfully."
else
    echo ".next folder not found, continuing deployment."
fi

echo "Step 4: Updating environment configuration..."
"$SCRIPT_DIR/env-update.sh"
if [ $? -ne 0 ]; then
    echo "Error: Environment update failed! Deployment aborted."
    "$SCRIPT_DIR/service.sh" start  
    exit 1
fi

echo "Step 5: Updating application..."
"$SCRIPT_DIR/update.sh"
if [ $? -ne 0 ]; then
    echo "Error: Update failed! Deployment aborted."
    "$SCRIPT_DIR/service.sh" start  
    exit 1
fi

echo "Deployment completed successfully!"
echo "Use '$SCRIPT_DIR/service.sh status' to check service status."
