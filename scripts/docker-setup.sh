PROJECT_DIR=$(dirname "$(dirname "$(readlink -f "$0")")")
cd "$PROJECT_DIR" || exit 1

show_usage() {
    echo "Baby Control Docker Management Script"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  build       Build the Docker image"
    echo "  start       Start the Docker containers"
    echo "  stop        Stop the Docker containers"
    echo "  restart     Restart the Docker containers"
    echo "  update      Update the container with latest code and run migrations"
    echo "  backup      Create a backup of the database volume"
    echo "  logs        View container logs"
    echo "  status      Check container status"
    echo "  clean       Remove containers, images, and volumes (caution: data loss)"
    echo "  help        Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  PORT        Port to expose the application (default: 3000)"
    echo ""
    echo "Examples:"
    echo "  $0 build    # Build the Docker image"
    echo "  PORT=8080 $0 start  # Start containers with custom port"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "Error: Docker is not installed or not in PATH"
        echo "Please install Docker and try again"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo "Error: docker-compose is not installed or not in PATH"
        echo "Please install docker-compose and try again"
        exit 1
    fi
}

build_image() {
    echo "Building Baby Control Docker image..."
    docker-compose build
}

start_containers() {
    echo "Starting Baby Control containers..."
    docker-compose up -d
    echo "Containers started. The application should be available at:"
    echo "  http://localhost:${PORT:-3000}"
}

stop_containers() {
    echo "Stopping Baby Control containers..."
    docker-compose down
}

restart_containers() {
    echo "Restarting Baby Control containers..."
    docker-compose restart
}

view_logs() {
    echo "Viewing Baby Control container logs..."
    docker-compose logs -f
}

check_status() {
    echo "Checking Baby Control container status..."
    docker-compose ps
}

backup_database() {
    echo "Creating backup of the database volume..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="${PROJECT_DIR}/backups"
    BACKUP_FILE="${BACKUP_DIR}/baby-control-db-${TIMESTAMP}.tar"
    
    mkdir -p "$BACKUP_DIR"
    
    if docker-compose ps | grep -q "baby-control"; then
        echo "Creating backup from volume..."
        docker run --rm \
            --volumes-from baby-control \
            -v "${BACKUP_DIR}:/backup" \
            alpine \
            tar -cf "/backup/baby-control-db-${TIMESTAMP}.tar" /db
        
        if [ $? -eq 0 ]; then
            echo "Backup completed successfully!"
            echo "Backup location: $BACKUP_FILE"
        else
            echo "Error: Backup failed!"
            return 1
        fi
    else
        echo "Error: Container is not running. Start the container first."
        return 1
    fi
    
    return 0
}

update_container() {
    echo "Updating Baby Control container..."
    
    echo "Pulling latest changes from git..."
    cd "$PROJECT_DIR" || exit 1
    git pull
    if [ $? -ne 0 ]; then
        echo "Error: Git pull failed!"
        return 1
    fi
    
    echo "Creating backup before update..."
    backup_database
    if [ $? -ne 0 ]; then
        echo "Warning: Backup failed, but continuing with update..."
    fi
    
    echo "Rebuilding Docker image..."
    docker-compose build
    if [ $? -ne 0 ]; then
        echo "Error: Docker build failed!"
        return 1
    fi
    
    echo "Stopping container..."
    docker-compose down
    if [ $? -ne 0 ]; then
        echo "Error: Failed to stop container!"
        return 1
    fi
    
    echo "Starting container with new image..."
    docker-compose up -d
    if [ $? -ne 0 ]; then
        echo "Error: Failed to start container!"
        return 1
    fi
    
    echo "Update completed successfully!"
    echo "The application should be available at:"
    echo "  http://localhost:${PORT:-3000}"
    echo "Check logs with: $0 logs"
    
    return 0
}

clean_resources() {
    echo "WARNING: This will remove all Baby Control Docker resources, including data volumes."
    read -p "Are you sure you want to continue? (y/N): " confirm
    
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        echo "Removing Baby Control containers, images, and volumes..."
        docker-compose down -v
        docker rmi baby-control
        echo "Cleanup completed."
    else
        echo "Cleanup cancelled."
    fi
}

check_docker

case "$1" in
    build)
        build_image
        ;;
    start)
        start_containers
        ;;
    stop)
        stop_containers
        ;;
    restart)
        restart_containers
        ;;
    update)
        update_container
        ;;
    backup)
        backup_database
        ;;
    logs)
        view_logs
        ;;
    status)
        check_status
        ;;
    clean)
        clean_resources
        ;;
    help|*)
        show_usage
        ;;
esac

exit 0
