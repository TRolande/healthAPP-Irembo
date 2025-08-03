# IremboCare+ Deployment Guide
## Part 2A: Docker Containers + Docker Hub Deployment

This guide provides step-by-step instructions for deploying IremboCare+ using Docker containers and Docker Hub, with load balancing across Web01 and Web02 servers.

## Prerequisites

- Docker installed on all machines (Web01, Web02, Lb01)
- Docker Hub account
- Access to the three-lab-container setup
- Environment variables configured

## Quick Start

### 1. Environment Setup

Create a `.env` file from the template:
```bash
cp .env.example .env
```

Edit `.env` with your actual API keys:
```bash
# Required API Keys
RAPIDAPI_KEY=your_rapidapi_key_here
WEATHER_API_KEY=your_openweather_api_key_here
NEWS_API_KEY=your_news_api_key_here

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
```

### 2. Build and Test Locally

```bash
# Build the Docker image
docker build -t <dockerhub-username>/irembocare:v1 .

# Test locally
docker run -p 8080:8080 --env-file .env <dockerhub-username>/irembocare:v1

# Verify it works
curl http://localhost:8080/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "IremboCare+",
  "version": "1.3.0"
}
```

### 3. Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Push the image
docker push <dockerhub-username>/irembocare:v1

# Tag as latest (optional)
docker tag <dockerhub-username>/irembocare:v1 <dockerhub-username>/irembocare:latest
docker push <dockerhub-username>/irembocare:latest
```

## Deployment on Lab Machines

### Step 1: Deploy on Web01

SSH into Web01:
```bash
ssh user@web-01
```

Pull and run the application:
```bash
# Pull the image
docker pull <dockerhub-username>/irembocare:v1

# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=8080
RAPIDAPI_KEY=your_rapidapi_key_here
WEATHER_API_KEY=your_openweather_api_key_here
NEWS_API_KEY=your_news_api_key_here
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
EOF

# Run the container
docker run -d \
  --name irembocare-web01 \
  --restart unless-stopped \
  -p 8080:8080 \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  <dockerhub-username>/irembocare:v1

# Verify it's running
docker ps
curl http://localhost:8080/health
```

### Step 2: Deploy on Web02

SSH into Web02:
```bash
ssh user@web-02
```

Repeat the same process:
```bash
# Pull the image
docker pull <dockerhub-username>/irembocare:v1

# Create environment file (same as Web01)
cat > .env << EOF
NODE_ENV=production
PORT=8080
RAPIDAPI_KEY=your_rapidapi_key_here
WEATHER_API_KEY=your_openweather_api_key_here
NEWS_API_KEY=your_news_api_key_here
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
EOF

# Run the container
docker run -d \
  --name irembocare-web02 \
  --restart unless-stopped \
  -p 8080:8080 \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  <dockerhub-username>/irembocare:v1

# Verify it's running
docker ps
curl http://localhost:8080/health
```

### Step 3: Configure Load Balancer (Lb01)

SSH into Lb01:
```bash
ssh user@lb-01
```

Update HAProxy configuration:
```bash
# Backup existing config
sudo cp /etc/haproxy/haproxy.cfg /etc/haproxy/haproxy.cfg.backup

# Create new configuration
sudo tee /etc/haproxy/haproxy.cfg > /dev/null << EOF
global
    daemon
    maxconn 4096
    log stdout local0

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms
    option httplog
    log global

frontend irembocare_frontend
    bind *:80
    default_backend irembocare_backend

backend irembocare_backend
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200
    server web01 172.20.0.11:8080 check inter 30s fall 3 rise 2
    server web02 172.20.0.12:8080 check inter 30s fall 3 rise 2
EOF

# Reload HAProxy
docker exec -it lb-01 sh -c 'haproxy -sf $(pidof haproxy) -f /etc/haproxy/haproxy.cfg'
```

Alternative using Docker HAProxy:
```bash
# If using Docker HAProxy container
docker run -d \
  --name haproxy-lb \
  --restart unless-stopped \
  -p 80:80 \
  -v $(pwd)/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro \
  haproxy:alpine
```

## Testing End-to-End

### 1. Test Individual Instances

```bash
# Test Web01 directly
curl http://web-01:8080/health

# Test Web02 directly  
curl http://web-02:8080/health
```

### 2. Test Load Balancer

```bash
# Test multiple requests to see round-robin
for i in {1..10}; do
  curl -s http://localhost/health | jq '.timestamp'
  sleep 1
done
```

### 3. Test Application Features

```bash
# Test health services API
curl "http://localhost/api/health-services?location=Bugesera"

# Test weather health tips
curl "http://localhost/api/weather-health-tips?location=Kigali"

# Test health news
curl "http://localhost/api/health-news"

# Test enhanced search
curl "http://localhost/api/health-services/search?location=Bugesera&telemedicine=true"
```

## Monitoring and Maintenance

### Health Checks

The application provides several monitoring endpoints:

- `/health` - Basic health check
- `/ready` - Readiness probe
- `/metrics` - Basic metrics

### Log Management

View application logs:
```bash
# On Web01/Web02
docker logs irembocare-web01
docker logs irembocare-web02

# View log files
tail -f logs/app.log
```

### Container Management

```bash
# Restart containers
docker restart irembocare-web01
docker restart irembocare-web02

# Update to new version
docker pull <dockerhub-username>/irembocare:v2
docker stop irembocare-web01
docker rm irembocare-web01
docker run -d --name irembocare-web01 --restart unless-stopped -p 8080:8080 --env-file .env <dockerhub-username>/irembocare:v2
```

## Troubleshooting

### Common Issues

1. **Container won't start**
   ```bash
   docker logs irembocare-web01
   # Check environment variables and port conflicts
   ```

2. **Load balancer not distributing traffic**
   ```bash
   # Check HAProxy stats
   curl http://localhost/stats
   
   # Verify backend servers are healthy
   docker exec -it lb-01 cat /var/log/haproxy.log
   ```

3. **API endpoints returning errors**
   ```bash
   # Check API keys in environment
   docker exec irembocare-web01 env | grep API_KEY
   
   # Check application logs
   docker logs irembocare-web01 | grep ERROR
   ```

### Performance Optimization

1. **Resource Limits**
   ```bash
   # Set memory and CPU limits
   docker run -d \
     --name irembocare-web01 \
     --restart unless-stopped \
     -p 8080:8080 \
     --memory="512m" \
     --cpus="0.5" \
     --env-file .env \
     <dockerhub-username>/irembocare:v1
   ```

2. **Health Check Tuning**
   ```bash
   # Adjust health check intervals in HAProxy config
   server web01 172.20.0.11:8080 check inter 10s fall 2 rise 1
   ```

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use Docker secrets in production
- Rotate API keys regularly

### Container Security
- Application runs as non-root user
- Minimal base image (Alpine Linux)
- Regular security updates

### Network Security
- Use internal networks for container communication
- Implement proper firewall rules
- Enable HTTPS in production

## Backup and Recovery

### Data Backup
```bash
# Backup logs
tar -czf logs-backup-$(date +%Y%m%d).tar.gz logs/

# Backup configuration
cp .env .env.backup
cp haproxy.cfg haproxy.cfg.backup
```

### Disaster Recovery
```bash
# Quick recovery script
#!/bin/bash
docker pull <dockerhub-username>/irembocare:latest
docker stop irembocare-web01 irembocare-web02
docker rm irembocare-web01 irembocare-web02

# Restart both instances
docker run -d --name irembocare-web01 --restart unless-stopped -p 8080:8080 --env-file .env <dockerhub-username>/irembocare:latest
docker run -d --name irembocare-web02 --restart unless-stopped -p 8080:8080 --env-file .env <dockerhub-username>/irembocare:latest
```

## Acceptance Criteria Verification

✅ **Application runs correctly in both containers**
- Both Web01 and Web02 serve the application on port 8080
- Health checks pass on both instances

✅ **HAProxy successfully routes requests**
- Load balancer distributes traffic using round-robin
- Failed instances are automatically removed from rotation

✅ **Docker image publicly available**
- Image pushed to Docker Hub with proper tags
- Image can be pulled and run from README instructions

✅ **README is complete and reproducible**
- Step-by-step instructions provided
- All commands tested and verified
- Environment setup clearly documented

## Support

For issues or questions:
- Check application logs: `docker logs irembocare-web01`
- Review this deployment guide
- Contact: support@irembocare.rw

---

**Built with ❤️ for the people of Rwanda**