# 🚀 Windows CMD Deployment Guide for IremboCare+

## Prerequisites
- Docker Desktop installed and running on Windows
- Docker Hub account created
- Command Prompt (CMD) open in your project directory

## Step 1: Set Up Environment (Windows CMD)
```cmd
REM Copy environment template
copy .env.example .env

REM Edit .env file with notepad (add your API keys)
notepad .env
```

**Add these to your .env file:**
```
NODE_ENV=production
PORT=8080
RAPIDAPI_KEY=your_rapidapi_key_here
WEATHER_API_KEY=your_openweather_key_here
NEWS_API_KEY=your_news_api_key_here
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
```

## Step 2: Build Docker Image (Windows CMD)
```cmd
REM Replace 'yourusername' with your actual Docker Hub username
docker build -t yourusername/irembocare:v1 .

REM Check if image was built successfully
docker images | findstr irembocare
```

## Step 3: Test Locally (Windows CMD)
```cmd
REM Run container locally to test
docker run -d -p 8080:8080 --env-file .env --name irembocare-test yourusername/irembocare:v1

REM Test if it's working (use curl or browser)
curl http://localhost:8080/health

REM Or open in browser: http://localhost:8080

REM Stop and remove test container
docker stop irembocare-test
docker rm irembocare-test
```

## Step 4: Push to Docker Hub (Windows CMD)
```cmd
REM Login to Docker Hub
docker login

REM Push your image
docker push yourusername/irembocare:v1

REM Tag as latest and push
docker tag yourusername/irembocare:v1 yourusername/irembocare:latest
docker push yourusername/irembocare:latest

REM Verify your image is on Docker Hub
echo Your image is now available at: https://hub.docker.com/r/yourusername/irembocare
```

## Step 5: Deploy on Lab Infrastructure

### For Web01 (SSH from Windows CMD):
```cmd
REM SSH into Web01
ssh user@web-01

REM Once connected to Web01, run these commands:
docker pull yourusername/irembocare:v1

REM Create environment file on Web01
cat > .env << EOF
NODE_ENV=production
PORT=8080
RAPIDAPI_KEY=your_rapidapi_key_here
WEATHER_API_KEY=your_weather_key_here
NEWS_API_KEY=your_news_key_here
EOF

REM Run container on Web01
docker run -d --name irembocare-web01 --restart unless-stopped -p 8080:8080 --env-file .env yourusername/irembocare:v1

REM Test Web01
curl http://localhost:8080/health

REM Exit Web01
exit
```

### For Web02 (SSH from Windows CMD):
```cmd
REM SSH into Web02
ssh user@web-02

REM Repeat same commands as Web01
docker pull yourusername/irembocare:v1

cat > .env << EOF
NODE_ENV=production
PORT=8080
RAPIDAPI_KEY=your_rapidapi_key_here
WEATHER_API_KEY=your_weather_key_here
NEWS_API_KEY=your_news_key_here
EOF

docker run -d --name irembocare-web02 --restart unless-stopped -p 8080:8080 --env-file .env yourusername/irembocare:v1

curl http://localhost:8080/health

exit
```

### For Lb01 - Load Balancer (SSH from Windows CMD):
```cmd
REM SSH into Lb01
ssh user@lb-01

REM Create HAProxy configuration
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

REM Reload HAProxy
docker exec -it lb-01 sh -c 'haproxy -sf $(pidof haproxy) -f /etc/haproxy/haproxy.cfg'

exit
```

## Step 6: Test Load Balancing (Windows CMD)
```cmd
REM Test multiple requests to see round-robin (replace with your LB IP)
for /L %i in (1,1,10) do (
    curl -s http://your-lb-ip/health
    timeout /t 1 /nobreak >nul
)
```

## Alternative: Using PowerShell (if you prefer)
```powershell
# PowerShell commands (run in PowerShell instead of CMD)
Copy-Item .env.example .env
notepad .env

docker build -t yourusername/irembocare:v1 .
docker login
docker push yourusername/irembocare:v1

# Test load balancing with PowerShell
1..10 | ForEach-Object { 
    Invoke-RestMethod http://your-lb-ip/health
    Start-Sleep 1
}
```

## Windows-Specific Notes:
- Use `findstr` instead of `grep` for searching
- Use `timeout /t 1` instead of `sleep 1` for delays
- Use `notepad` to edit files
- Use `copy` instead of `cp` for copying files
- Docker Desktop must be running for Docker commands to work

## Verification Commands (Windows CMD):
```cmd
REM Check running containers
docker ps

REM Check Docker images
docker images

REM Test your deployed application
curl http://your-lb-ip/health
curl http://your-lb-ip/api/health-services?location=Bugesera
curl http://your-lb-ip/api/weather-health-tips?location=Kigali
curl http://your-lb-ip/api/health-news
```

## Troubleshooting (Windows CMD):
```cmd
REM View container logs
docker logs irembocare-test

REM Check if Docker is running
docker version

REM Check network connectivity
ping web-01
ping web-02
ping lb-01
```

Your enhanced IremboCare+ application is ready for Windows CMD deployment! 🚀