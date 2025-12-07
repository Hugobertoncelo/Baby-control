PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

echo "========================================"
echo "   Baby Control Demo Family Generator"
echo "========================================"
echo ""
echo "This script will generate a demo family based on existing data:"
echo "- Single family with slug 'demo'"
echo "- One caretaker (Login ID: 01, PIN: 111111)"
echo "- Babies and logs based on existing family data"
echo "- 30 random days from March-June 2025 mapped to last 30 Dias"
echo "- Sleep, feed, and diaper logs from source family"
echo "- Randomly generated bath logs and notes"
echo "- Today's entries cutoff at 1 hour ago"
echo ""
echo "Note: This will replace any existing demo family data"
echo ""

if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed! Please install Node.js before running this script."
    exit 1
fi

if [ ! -f "$PROJECT_DIR/package.json" ]; then
    echo "Error: Could not find package.json. Please run this script from the project root."
    exit 1
fi

echo "Do you want to proceed with demo family generation? (y/N):"
echo "WARNING: This will delete and recreate the demo family data!"
read -r CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "Demo generation cancelled."
    exit 0
fi

cd "$PROJECT_DIR" || exit 1

echo ""
echo "Starting demo family generation..."
echo "This may take a few minutes..."
echo ""

node "$SCRIPT_DIR/generate-demo-data.js"
RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "   Demo family generation completed!"
    echo "========================================"
    echo ""
    echo "You can now:"
    echo "1. Start the application: npm run dev"
    echo "2. Browse to http://localhost:3000/demo"
    echo "3. Use login PIN '111111' to access the demo family"
    echo ""
    echo "Demo family details:"
    echo "- Family slug: demo"
    echo "- Caretaker login: 01"
    echo "- Security PIN: 111111"
    echo ""
else
    echo ""
    echo "Error: Demo family generation failed!"
    exit 1
fi

exit 0