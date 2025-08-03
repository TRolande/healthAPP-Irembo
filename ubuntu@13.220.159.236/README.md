# 🏥 IremboCare+ - Complete Health Assistant for Rwanda

A comprehensive healthcare application designed specifically for Rwanda, providing access to health services, medication information, first-aid guidance, AI-powered medical consultation, weather-based health recommendations, and real-time health news.

---

## 🌟 Enhanced Features

### 🏥 Health Services
- **District-based Hospital Finder** - Find healthcare facilities in your district  
- **Advanced Search & Filtering** - Search by specialty, services, telemedicine availability  
- **Telemedicine Requests** - Request virtual consultations from healthcare professionals  
- **Service Details** - View hospital types, specialties, and contact information  
- **Real-time Search** - Instant results with district filtering and sorting options  

### 💊 Enhanced Medication Information
- **Disease-based Search** - Find medications for common conditions  
- **Symptom-based Search** - Search medications by multiple symptoms  
- **Advanced Filtering** - Filter by brand/generic, effectiveness, side effects  
- **Detailed Information** - Brand names, generic names, dosage instructions, and effectiveness ratings  
- **Safety Guidelines** - Proper usage and consultation recommendations  

### 🌤️ Weather-Based Health Recommendations (NEW)
- **Real-time Weather Data** - Current weather conditions for all Rwanda districts  
- **Health Alerts** - Weather-based health warnings and recommendations  
- **Seasonal Health Tips** - Malaria prevention during rainy season, heat warnings  
- **Location-specific Advice** - Tailored recommendations for your district  

### 📰 Health News & Updates (NEW)
- **Rwanda Health News** - Latest health news specific to Rwanda  
- **Categorized News** - News by health categories (Malaria, COVID-19, Maternal Health, etc.)  
- **Trending Topics** - Most discussed health topics  
- **Reliable Sources** - Curated news from trusted health organizations  

### 🩺 First-Aid & Emergency
- **Emergency Button** - Quick access to emergency contacts  
- **First-Aid Tips** - Step-by-step instructions for common emergencies  
- **Severity Indicators** - Understand the urgency of different conditions  
- **Emergency Contacts** - Direct access to emergency services  
- **Critical Symptoms Checker** - Assess if immediate medical attention is needed  

### 🤖 AI Medical Assistant
- **AI Doctor Chat** - Ask medical questions and get AI-powered responses  
- **Specialization Support** - Choose from various medical specialties  
- **Professional Guidance** - Get preliminary medical advice  
- **Multi-language Support** - Available in English and other languages  
- **Enhanced Error Handling** - Robust fallback responses when API is unavailable  

### 🔐 User Management
- **User Registration** - Create personalized accounts  
- **Profile Management** - Store personal health information  
- **Health Records** - Track consultations, medications, and symptoms  
- **Secure Authentication** - Protected user data and sessions  
- **Health Dashboard** - Personalized health insights and recommendations  

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)  
- npm or yarn package manager  

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd health-app
Install dependencies

bash
Copy
Edit
npm install
Start the development server

bash
Copy
Edit
npm start
Access the application
Open your browser and navigate to: http://localhost:8080

📁 Project Structure
csharp
Copy
Edit
health-app/
├── src/
│   ├── app.js                 # Main server application
│   ├── api/                   # API route handlers
│   │   ├── firstAidTips.js    # First-aid API endpoints
│   │   ├── healthServices.js  # Health services API
│   │   └── medicationInfo.js  # Medication API
│   ├── components/            # React components (if using)
│   ├── pages/                 # HTML pages
│   │   ├── working-index.html # Main application interface
│   │   ├── about.html         # About page
│   │   └── contact.html       # Contact page
│   ├── public/                # Static assets
│   │   ├── index.html         # Main application
│   │   ├── styles.css         # Main stylesheet
│   │   ├── main.js            # Main JavaScript
│   │   └── purehtml/          # Pure HTML version
│   └── styles/                # Additional stylesheets
├── package.json               # Project dependencies
├── Dockerfile                 # Docker configuration
├── deploy.sh                  # Deployment script
└── README.md                  # Project documentation
🔧 Configuration
Environment Variables
Create a .env file in the root directory:

env
Copy
Edit
PORT=8080
RAPIDAPI_KEY=your_rapidapi_key_here
NODE_ENV=development
API Configuration
The application uses the following APIs:

RapidAPI AI Doctor - For AI medical consultation

Custom Health Services API - For hospital and clinic data

Medication Database - For drug information

🏗️ Enhanced API Endpoints
Health Services
GET /api/health-services?location=<district>

GET /api/health-services/search

Params: location, specialty, services, telemedicine, type, sort

Medication
GET /api/medication?disease=<disease_name>&limit=<number>

GET /api/medication/search

Params: disease, symptoms, type, limit, sort

Weather Health (NEW)
GET /api/weather-health-tips?location=<district>

Health News (NEW)
GET /api/health-news

GET /api/health-news/category/<category>

GET /api/health-news/trending

First-Aid
GET /api/first-aid?condition=<condition>&limit=<number>

AI Doctor
POST /api/ai-doctor

User Management
POST /api/register

POST /api/login

POST /api/logout

GET /api/profile

PUT /api/profile

GET /api/health-records

POST /api/health-records

Telemedicine
POST /api/telemedicine-request

System Health
GET /health

GET /ready

GET /metrics

🐳 Docker Deployment & Production
1️⃣ Local Deployment with Docker
bash
Copy
Edit
git clone <repository-url>
cd healthAPP-Irembo

# Copy and configure environment
cp .env.example .env

# Build & run container
docker-compose up -d

# Verify health
curl http://localhost:8080/health
2️⃣ Production Deployment on Web01, Web02, and Lb01
Full deployment uses Docker + Nginx load balancing.

Step 1: Transfer Environment File
bash
Copy
Edit
# Web01
scp -i /path/to/private_key.pem .env.example ubuntu@YOUR_WEB01_IP:~/my_project/

# Web02
scp -i /path/to/private_key.pem .env.example ubuntu@YOUR_WEB02_IP:~/my_project/
Step 2: Deploy Docker Containers on Web Servers
bash
Copy
Edit
ssh ubuntu@YOUR_SERVER_IP
mkdir -p ~/my_project && cd ~/my_project

docker login
docker pull rolande826/irembo-healthcare:v1

docker run --name ROLANDE --env-file .env.example \
  -p 8080:8080 -d rolande826/irembo-healthcare:v1

docker ps
Step 3: Configure Nginx Reverse Proxy
nginx
Copy
Edit
server {
    listen 80;
    server_name YOUR_SERVER_IP_OR_DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
bash
Copy
Edit
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
sudo unlink /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
Step 4: Configure Load Balancer on Lb01
nginx
Copy
Edit
upstream backend_servers {
    server YOUR_WEB01_IP:80 max_fails=3 fail_timeout=10s;
    server YOUR_WEB02_IP:80 max_fails=3 fail_timeout=10s;
}

server {
    listen 80;
    server_name YOUR_LB01_IP;

    location / {
        proxy_pass http://backend_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
Enable site and reload Nginx:

bash
Copy
Edit
sudo ln -s /etc/nginx/sites-available/loadbalancer /etc/nginx/sites-enabled/
sudo unlink /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
Access via Load Balancer:
http://YOUR_LB01_IP

Optional Settings
Least Connections: Add least_conn; in upstream

IP Hash: Add ip_hash; for sticky sessions

Verification
bash
Copy
Edit
curl http://YOUR_LB01_IP/health
tail -f /var/log/nginx/access.log
🔒 Security
Input validation & sanitization

API rate limiting & retries

Non-root Docker containers

Health monitoring: /health, /ready, /metrics

🤝 Contributing
Fork the repository

Create a branch: git checkout -b feature-name

Commit: git commit -am 'Add feature'

Push: git push origin feature-name

Submit a pull request

📝 License
Licensed under the MIT License – see the LICENSE file.

Built with ❤️ for the people of Rwanda

This application demonstrates the power of combining multiple external APIs to create meaningful, practical solutions for real-world healthcare challenges.

yaml
Copy
Edit

---

This file is **GitHub-ready**, formatted for readability, and includes:  
✅ Clean sectioned layout  
✅ Detailed deployment from your first README  
✅ Icons & structure from your second format  
