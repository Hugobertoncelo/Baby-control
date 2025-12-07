PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")

if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo "Error: .env file not found!"
    exit 1
fi

SERVICE_NAME=$(grep "SERVICE_NAME" "$PROJECT_DIR/.env" | cut -d '"' -f 2)
if [ -z "$SERVICE_NAME" ]; then
    echo "Error: SERVICE_NAME not found in .env file!"
    exit 1
fi

start_service() {
    echo "Starting $SERVICE_NAME service..."
    sudo systemctl start "$SERVICE_NAME"
    echo "Service started successfully!"
}

stop_service() {
    echo "Stopping $SERVICE_NAME service..."
    sudo systemctl stop "$SERVICE_NAME"
    echo "Service stopped successfully!"
}

status_service() {
    echo "Checking $SERVICE_NAME service status..."
    sudo systemctl status "$SERVICE_NAME"
}

case "$1" in
    start)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        stop_service
        start_service
        ;;
    status)
        status_service
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac

exit 0
