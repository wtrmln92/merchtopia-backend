#!/bin/bash

# PostgreSQL Docker Setup Script for Merchtopia Backend

set -e

# Configuration (can be overridden via environment variables)
CONTAINER_NAME="${POSTGRES_CONTAINER_NAME:-merchtopia-postgres}"
POSTGRES_USER="${POSTGRES_USER:-merchtopia}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-merchtopia}"
POSTGRES_DB="${POSTGRES_DB:-merchtopia}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_VERSION="${POSTGRES_VERSION:-16}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    print_info "Docker is installed and running."
}

# Check if container already exists
check_existing_container() {
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            print_warn "Container '${CONTAINER_NAME}' is already running."
            echo -e "  Connection string: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
            exit 0
        else
            print_info "Container '${CONTAINER_NAME}' exists but is stopped. Starting it..."
            docker start "${CONTAINER_NAME}"
            print_info "Container started successfully."
            echo -e "  Connection string: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
            exit 0
        fi
    fi
}

# Create and start the PostgreSQL container
create_container() {
    print_info "Creating PostgreSQL container..."

    docker run -d \
        --name "${CONTAINER_NAME}" \
        -e POSTGRES_USER="${POSTGRES_USER}" \
        -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
        -e POSTGRES_DB="${POSTGRES_DB}" \
        -p "${POSTGRES_PORT}:5432" \
        -v "${CONTAINER_NAME}-data:/var/lib/postgresql/data" \
        --restart unless-stopped \
        "postgres:${POSTGRES_VERSION}-alpine"

    print_info "Waiting for PostgreSQL to be ready..."

    # Wait for PostgreSQL to be ready
    for i in {1..30}; do
        if docker exec "${CONTAINER_NAME}" pg_isready -U "${POSTGRES_USER}" &> /dev/null; then
            print_info "PostgreSQL is ready!"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "PostgreSQL failed to start within 30 seconds."
            exit 1
        fi
        sleep 1
    done
}

# Print connection information
print_connection_info() {
    echo ""
    echo "=========================================="
    echo -e "${GREEN}PostgreSQL container is ready!${NC}"
    echo "=========================================="
    echo ""
    echo "Connection details:"
    echo "  Host:     localhost"
    echo "  Port:     ${POSTGRES_PORT}"
    echo "  Database: ${POSTGRES_DB}"
    echo "  User:     ${POSTGRES_USER}"
    echo "  Password: ${POSTGRES_PASSWORD}"
    echo ""
    echo "Connection string:"
    echo "  postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}"
    echo ""
    echo "Useful commands:"
    echo "  Stop:     docker stop ${CONTAINER_NAME}"
    echo "  Start:    docker start ${CONTAINER_NAME}"
    echo "  Remove:   docker rm -f ${CONTAINER_NAME}"
    echo "  Logs:     docker logs ${CONTAINER_NAME}"
    echo "  Shell:    docker exec -it ${CONTAINER_NAME} psql -U ${POSTGRES_USER} -d ${POSTGRES_DB}"
    echo ""
}

# Main
main() {
    echo ""
    echo "Merchtopia PostgreSQL Setup"
    echo "==========================="
    echo ""

    check_docker
    check_existing_container
    create_container
    print_connection_info
}

main "$@"
