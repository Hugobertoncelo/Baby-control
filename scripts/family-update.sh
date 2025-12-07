PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
cd "$PROJECT_DIR" || exit 1

echo "Starting family data update for multi-family support..."

echo "Executing family migration script..."
node "$PROJECT_DIR/scripts/family-migration.js"
RESULT=$?

if [ $RESULT -eq 0 ]; then
  echo "Family data update completed successfully!"
else
  echo "Error: Family data update failed!"
  exit 1
fi

exit 0
