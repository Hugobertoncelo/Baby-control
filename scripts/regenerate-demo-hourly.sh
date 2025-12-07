PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

LOG_FILE="$PROJECT_DIR/logs/demo-regeneration.log"

mkdir -p "$(dirname "$LOG_FILE")"

log_with_timestamp() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_with_timestamp "Starting automated demo family regeneration..."

if ! command -v node &> /dev/null; then
    log_with_timestamp "ERROR: Node.js is not installed!"
    exit 1
fi

if [ ! -f "$PROJECT_DIR/package.json" ]; then
    log_with_timestamp "ERROR: Could not find package.json in $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1

log_with_timestamp "Running demo generation script..."
node "$SCRIPT_DIR/generate-demo-data.js" >> "$LOG_FILE" 2>&1
RESULT=$?

if [ $RESULT -eq 0 ]; then
    log_with_timestamp "SUCCESS: Demo family regeneration completed successfully"
else
    log_with_timestamp "ERROR: Demo family regeneration failed with exit code $RESULT"
    exit 1
fi

find "$(dirname "$LOG_FILE")" -name "demo-regeneration.log.*" -mtime +7 -delete 2>/dev/null || true

log_with_timestamp "Automated demo regeneration finished"
exit 0