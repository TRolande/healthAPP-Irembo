#!/bin/bash

# IremboCare+ Deployment Script
# Version: 1.3.0
# Description: Complete deployment script for IremboCare+ health application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="irembocare-plus"
APP_PORT=8080
NODE_ENV="production"
LOG_FILE="deploy.log"
PID_FILE="app.pid"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}" | tee -a $LOG_FILE
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        warning "Running as root. Consider using a non-root user for security."
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js 14+ first."
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm first."
    fi
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 14 ]; then
        error "Node.js version 14+ is required. Current version: $(node -v)"
    fi
    
    # Check if port is available
    if lsof -Pi :$APP_PORT -sTCP:LISTEN -t >/dev/null ; then
        warning "Port $APP_PORT is already in use. Stopping existing process..."
        stop_app
    fi
    
    log "System requirements check passed."
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci --production
    else
        npm install --production
    fi
    
    if [ $? -eq 0 ]; then
        log "Dependencies installed successfully."
    else
        error "Failed to install dependencies."
    fi
}

# Create environment file
setup_environment() {
    log "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        cat > .env << EOF
# IremboCare+ Environment Configuration
NODE_ENV=$NODE_ENV
PORT=$APP_PORT
RAPIDAPI_KEY=6e955d8d55msh09af75f8213caecp17be4ejsn5a7d5e69d78b

# Security Settings
SESSION_SECRET=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 32)

# Database Settings (if using)
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=irembocare
# DB_USER=irembocare_user
# DB_PASSWORD=secure_password

# Logging
LOG_LEVEL=info
LOG_FILE=app.log

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
EOF
        log "Environment file created."
    else
        log "Environment file already exists."
    fi
}

# Start the application
start_app() {
    log "Starting IremboCare+ application..."
    
    # Set environment variables
    export NODE_ENV=$NODE_ENV
    export PORT=$APP_PORT
    
    # Start the application in background
    nohup node src/app.js > app.log 2>&1 &
    echo $! > $PID_FILE
    
    # Wait for application to start
    sleep 5
    
    # Check if application started successfully
    if [ -f $PID_FILE ] && kill -0 $(cat $PID_FILE) 2>/dev/null; then
        log "Application started successfully with PID: $(cat $PID_FILE)"
    else
        error "Failed to start application. Check app.log for details."
    fi
}

# Stop the application
stop_app() {
    log "Stopping IremboCare+ application..."
    
    if [ -f $PID_FILE ]; then
        PID=$(cat $PID_FILE)
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            rm -f $PID_FILE
            log "Application stopped successfully."
        else
            warning "Application process not found."
            rm -f $PID_FILE
        fi
    else
        warning "PID file not found. Trying to kill process on port $APP_PORT..."
        PIDS=$(lsof -ti:$APP_PORT)
        if [ ! -z "$PIDS" ]; then
            kill $PIDS
            log "Processes on port $APP_PORT stopped."
        fi
    fi
}
    
    # Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to be ready
    sleep 3
    
    # Check if application is responding
    for i in {1..10}; do
        if curl -f -s http://localhost:$APP_PORT/health > /dev/null 2>&1; then
            log "Health check passed. Application is running."
    return 0
        fi
        
        if [ $i -eq 10 ]; then
            error "Health check failed after 10 attempts."
        fi
        
        sleep 2
    done
}

# Test API endpoints
test_api() {
    log "Testing API endpoints..."
    
    # Test health services API
    if curl -s "http://localhost:$APP_PORT/api/health-services?location=Bugesera" | grep -q "success"; then
        log "Health services API test passed."
    else
        warning "Health services API test failed."
    fi
    
    # Test medication API
    if curl -s "http://localhost:$APP_PORT/api/medication?disease=malaria" | grep -q "success"; then
        log "Medication API test passed."
    else
        warning "Medication API test failed."
    fi
    
    # Test first-aid API
    if curl -s "http://localhost:$APP_PORT/api/first-aid?condition=Burns" | grep -q "success"; then
        log "First-aid API test passed."
    else
        warning "First-aid API test failed."
    fi
}

# Setup PM2 (if available)
setup_pm2() {
    if command -v pm2 &> /dev/null; then
        log "Setting up PM2 process manager..."
        
        # Create PM2 ecosystem file
        cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$APP_NAME',
    script: 'src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: '$NODE_ENV',
      PORT: $APP_PORT
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
EOF
        
        # Create logs directory
        mkdir -p logs
        
        # Start with PM2
        pm2 start ecosystem.config.js
        
        if [ $? -eq 0 ]; then
            log "PM2 setup completed successfully."
            log "Use 'pm2 status' to check application status."
            log "Use 'pm2 logs $APP_NAME' to view logs."
        else
            warning "PM2 setup failed. Running without PM2."
        fi
    else
        warning "PM2 not found. Running without process manager."
    fi
}

# Setup systemd service (if running as root)
setup_systemd() {
    if [[ $EUID -eq 0 ]]; then
        log "Setting up systemd service..."
        
        cat > /etc/systemd/system/$APP_NAME.service << EOF
[Unit]
Description=IremboCare+ Health Application
After=network.target

[Service]
Type=simple
User=$SUDO_USER
WorkingDirectory=$(pwd)
Environment=NODE_ENV=$NODE_ENV
Environment=PORT=$APP_PORT
ExecStart=/usr/bin/node src/app.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF
        
        systemctl daemon-reload
        systemctl enable $APP_NAME.service
        
        log "Systemd service created and enabled."
        log "Use 'systemctl start $APP_NAME' to start the service."
        log "Use 'systemctl status $APP_NAME' to check service status."
    fi
}

# Setup nginx reverse proxy (if nginx is available)
setup_nginx() {
    if command -v nginx &> /dev/null; then
        log "Setting up nginx reverse proxy..."
        
        cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name localhost;
    
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:$APP_PORT/health;
        access_log off;
    }
}
EOF
        
        # Enable site
        ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
        
        # Test nginx configuration
        if nginx -t; then
            systemctl reload nginx
            log "Nginx configuration applied successfully."
        else
            warning "Nginx configuration test failed."
        fi
    fi
}

# Backup function
backup() {
    log "Creating backup..."
    
    BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p $BACKUP_DIR
    
    # Backup important files
    cp -r src/ $BACKUP_DIR/
    cp -r public/ $BACKUP_DIR/
    cp package.json $BACKUP_DIR/
    cp .env $BACKUP_DIR/ 2>/dev/null || true
    
    log "Backup created in $BACKUP_DIR"
}

# Rollback function
rollback() {
    if [ -z "$1" ]; then
        error "Please specify backup directory for rollback."
    fi
    
    BACKUP_DIR=$1
    if [ ! -d "$BACKUP_DIR" ]; then
        error "Backup directory $BACKUP_DIR not found."
    fi
    
    log "Rolling back to $BACKUP_DIR..."
    
    stop_app
    
    # Restore files
    cp -r $BACKUP_DIR/src/ ./
    cp -r $BACKUP_DIR/public/ ./
    cp $BACKUP_DIR/package.json ./
    cp $BACKUP_DIR/.env ./
    
    install_dependencies
    start_app
    health_check
    
    log "Rollback completed successfully."
}

# Main deployment function
deploy() {
    log "Starting IremboCare+ deployment..."
    
    check_root
    check_requirements
    backup
    install_dependencies
    setup_environment
    stop_app
    start_app
    health_check
    test_api
    setup_pm2
    
    if [[ $EUID -eq 0 ]]; then
        setup_systemd
        setup_nginx
    fi
    
    log "Deployment completed successfully!"
    log "Application is running at: http://localhost:$APP_PORT"
    log "Health check endpoint: http://localhost:$APP_PORT/health"
    
    if command -v pm2 &> /dev/null; then
        log "PM2 commands:"
        log "  pm2 status          - Check application status"
        log "  pm2 logs $APP_NAME  - View application logs"
        log "  pm2 restart $APP_NAME - Restart application"
    fi
}

# Show usage
usage() {
    echo "IremboCare+ Deployment Script"
echo ""
    echo "Usage: $0 [COMMAND]"
echo ""
    echo "Commands:"
    echo "  deploy              - Full deployment (default)"
    echo "  start               - Start application"
    echo "  stop                - Stop application"
    echo "  restart             - Restart application"
    echo "  status              - Check application status"
    echo "  health              - Perform health check"
    echo "  test                - Test API endpoints"
    echo "  backup              - Create backup"
    echo "  rollback <dir>      - Rollback to backup"
    echo "  logs                - Show application logs"
    echo "  help                - Show this help"
echo ""
    echo "Examples:"
    echo "  $0 deploy           # Full deployment"
    echo "  $0 start            # Start application"
    echo "  $0 rollback backups/20231201_143022  # Rollback to specific backup"
}

# Main script logic
case "${1:-deploy}" in
    deploy)
        deploy
        ;;
    start)
        start_app
        health_check
        ;;
    stop)
        stop_app
        ;;
    restart)
        stop_app
        start_app
        health_check
        ;;
    status)
        if [ -f $PID_FILE ] && kill -0 $(cat $PID_FILE) 2>/dev/null; then
            log "Application is running with PID: $(cat $PID_FILE)"
        else
            log "Application is not running."
        fi
        ;;
    health)
        health_check
        ;;
    test)
        test_api
        ;;
    backup)
        backup
        ;;
    rollback)
        rollback $2
        ;;
    logs)
        if [ -f "app.log" ]; then
            tail -f app.log
        else
            log "No log file found."
        fi
        ;;
    help|--help|-h)
        usage
        ;;
    *)
        error "Unknown command: $1"
        usage
        ;;
esac
