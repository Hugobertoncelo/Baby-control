PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
cd "$PROJECT_DIR" || exit 1

echo "Running email provider test..."

npx tsx "scripts/email-test.ts"
RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo "Email test script finished successfully."
else
    echo "Email test script failed with exit code $RESULT."
    exit 1
fi

exit 0