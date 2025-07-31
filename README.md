# 🏥 IremboCare+ - Complete Health Assistant for Rwanda

A comprehensive healthcare application designed specifically for Rwanda, providing access to health services, medication information, first-aid guidance, and AI-powered medical consultation.

## 🌟 Features

### 🏥 Health Services
- **District-based Hospital Finder** - Find healthcare facilities in your district
- **Telemedicine Requests** - Request virtual consultations from healthcare professionals
- **Service Details** - View hospital types, specialties, and contact information
- **Real-time Search** - Instant results with district filtering

### 💊 Medication Information
- **Disease-based Search** - Find medications for common conditions
- **Detailed Information** - Brand names, generic names, and dosage instructions
- **Safety Guidelines** - Proper usage and consultation recommendations

### 🩺 First-Aid & Emergency
- **Emergency Button** - Quick access to emergency contacts
- **First-Aid Tips** - Step-by-step instructions for common emergencies
- **Severity Indicators** - Understand the urgency of different conditions
- **Emergency Contacts** - Direct access to emergency services

### 🤖 AI Medical Assistant
- **AI Doctor Chat** - Ask medical questions and get AI-powered responses
- **Specialization Support** - Choose from various medical specialties
- **Professional Guidance** - Get preliminary medical advice
- **Multi-language Support** - Available in English and other languages

### 🔐 User Management
- **User Registration** - Create personalized accounts
- **Profile Management** - Store personal health information
- **Health Records** - Track consultations, medications, and symptoms
- **Secure Authentication** - Protected user data and sessions

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
   git clone <repository-url>
   cd health-app
   ```

2. **Install dependencies**
   ```bash
npm install
   ```

3. **Start the development server**
   ```bash
npm start
   ```

4. **Access the application**
   Open your browser and navigate to: `http://localhost:8080`

## 📁 Project Structure

```
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
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=8080
RAPIDAPI_KEY=your_rapidapi_key_here
NODE_ENV=development
```

### API Configuration
The application uses the following APIs:
- **RapidAPI AI Doctor** - For AI medical consultation
- **Custom Health Services API** - For hospital and clinic data
- **Medication Database** - For drug information

## 🏗️ API Endpoints

### Health Services
- `GET /api/health-services?location=<district>` - Get healthcare facilities by district

### Medication
- `GET /api/medication?disease=<disease_name>&limit=<number>` - Search medications by disease

### First-Aid
- `GET /api/first-aid?condition=<condition>&limit=<number>` - Get first-aid tips

### AI Doctor
- `POST /api/ai-doctor` - AI medical consultation

### User Management
- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `POST /api/logout` - User logout
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile

### Telemedicine
- `POST /api/telemedicine-request` - Submit telemedicine consultation request

## 🐳 Docker Deployment

### Build the Docker image
```bash
docker build -t irembocare .
```

### Run the container
```bash
docker run -p 8080:8080 irembocare
```

## 🚀 Production Deployment

### Using the deployment script
```bash
chmod +x deploy.sh
./deploy.sh
```

### Manual deployment
1. Install dependencies: `npm install --production`
2. Set environment variables
3. Start the server: `node src/app.js`
4. Use a process manager like PM2: `pm2 start src/app.js`

## 🧪 Testing

### Run tests
```bash
npm test
```

### API testing
Use tools like Postman or curl to test API endpoints:

```bash
# Test health services
curl "http://localhost:8080/api/health-services?location=Bugesera"

# Test medication search
curl "http://localhost:8080/api/medication?disease=malaria"

# Test first-aid tips
curl "http://localhost:8080/api/first-aid?condition=Burns"
```

## 🔒 Security Features

- **Input Validation** - All user inputs are validated
- **Error Handling** - Comprehensive error handling and logging
- **Rate Limiting** - API rate limiting to prevent abuse
- **Secure Headers** - Security headers for web protection
- **Data Encryption** - Sensitive data encryption

## 📊 Monitoring & Logging

- **Server Logs** - Comprehensive logging of all requests
- **Error Tracking** - Detailed error logging and monitoring
- **Performance Metrics** - Response time and usage statistics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🏥 Healthcare Disclaimer

**Important**: This application provides general health information and should not replace professional medical advice. Always consult with qualified healthcare professionals for medical decisions.

## 🔄 Version History

- **v1.0.0** - Initial release with basic health services
- **v1.1.0** - Added AI doctor and telemedicine features
- **v1.2.0** - Enhanced UI/UX and mobile responsiveness
- **v1.3.0** - Added user management and health records

---

**Built with ❤️ for the people of Rwanda**