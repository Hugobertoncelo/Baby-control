SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

echo "Generating test data for development environment..."

export FAMILY_COUNT=5
export DAYS_COUNT=60
export CLEAR_DATA=true

bash "$SCRIPT_DIR/generate-test-data.sh"

echo "Automated test data generation completed!" 
