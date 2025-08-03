# IremboCare+ API Documentation

Complete API reference for the IremboCare+ healthcare application.

## Base URL
```
http://localhost:8080
```

## Authentication

Most endpoints are public, but user-specific endpoints require authentication:

```http
Authorization: Bearer <session_token>
```

## Response Format

All API responses follow this structure:

```json
{
  "success": true|false,
  "data": <response_data>,
  "message": "Optional message",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "count": <number_of_items> // for list responses
}
```

## Error Handling

Error responses include:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "suggestion": "Helpful suggestion for resolution",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Health Services API

### Get Health Services by District

```http
GET /api/health-services?location={district}
```

**Parameters:**
- `location` (required): Rwanda district name

**Example:**
```bash
curl "http://localhost:8080/api/health-services?location=Bugesera"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "display_name": "Nyamata District Hospital (Public)",
      "name": "Nyamata District Hospital",
      "type": "Public",
      "id": "nyamata-district-hospital"
    }
  ],
  "location": "Bugesera",
  "count": 5
}
```

### Enhanced Health Services Search

```http
GET /api/health-services/search?location={district}&specialty={specialty}&services={services}&telemedicine={boolean}&type={type}&sort={sort}
```

**Parameters:**
- `location` (required): Rwanda district name
- `specialty` (optional): Medical specialty (e.g., "cardiology", "emergency")
- `services` (optional): Service type (e.g., "emergency", "maternity")
- `telemedicine` (optional): "true" or "false"
- `type` (optional): "Public" or "Private"
- `sort` (optional): "name" or "type"

**Example:**
```bash
curl "http://localhost:8080/api/health-services/search?location=Bugesera&telemedicine=true&sort=name"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "display_name": "Nyamata District Hospital (Public)",
      "name": "Nyamata District Hospital",
      "type": "Public",
      "phone": "+250788123456",
      "email": "nyamata.hospital@moh.gov.rw",
      "telemedicine": true,
      "specialties": ["General Medicine", "Emergency Care", "Maternity"],
      "id": "nyamata-district-hospital"
    }
  ],
  "location": "Bugesera",
  "filters": {
    "telemedicine": "true",
    "sort": "name"
  },
  "count": 3
}
```

## Medication API

### Basic Medication Search

```http
GET /api/medication?disease={disease}&limit={limit}
```

**Parameters:**
- `disease` (optional): Disease name (e.g., "malaria", "fever", "headache")
- `limit` (optional): Number of results (default: 10, max: 50)

**Example:**
```bash
curl "http://localhost:8080/api/medication?disease=malaria&limit=5"
```

### Enhanced Medication Search

```http
GET /api/medication/search?disease={disease}&symptoms={symptoms}&type={type}&limit={limit}&sort={sort}
```

**Parameters:**
- `disease` (optional): Disease name
- `symptoms` (optional): Comma-separated symptoms (e.g., "headache,fever")
- `type` (optional): "brand", "generic", or "all" (default: "all")
- `limit` (optional): Number of results (default: 10, max: 50)
- `sort` (optional): "relevance", "effectiveness", or "name"

**Example:**
```bash
curl "http://localhost:8080/api/medication/search?symptoms=headache,fever&type=brand&sort=effectiveness"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "openfda": {
        "brand_name": ["Panadol"],
        "generic_name": ["Paracetamol"]
      },
      "dosage": "Adult: 500mg-1g every 4-6 hours",
      "type": "brand",
      "effectiveness": 85,
      "sideEffects": ["Rare allergic reactions"]
    }
  ],
  "query": {
    "symptoms": "headache,fever",
    "type": "brand",
    "sort": "effectiveness"
  },
  "count": 2,
  "disclaimer": "This is demo data. Always consult a healthcare professional for proper medication advice."
}
```

## Weather Health API

### Get Weather-Based Health Tips

```http
GET /api/weather-health-tips?location={district}
```

**Parameters:**
- `location` (optional): Rwanda district name (default: "Kigali")

**Example:**
```bash
curl "http://localhost:8080/api/weather-health-tips?location=Kigali"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "weather": {
      "location": "Kigali",
      "temperature": 22,
      "feelsLike": 24,
      "humidity": 65,
      "condition": "Partly Cloudy",
      "description": "partly cloudy",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    "healthRecommendations": [
      {
        "type": "high_humidity",
        "priority": "medium",
        "title": "High Humidity Alert",
        "message": "High humidity can worsen respiratory conditions and increase infection risk.",
        "actions": [
          "Ensure good ventilation in living spaces",
          "Be aware of increased mosquito activity",
          "Monitor for signs of respiratory discomfort"
        ]
      }
    ]
  },
  "location": "Kigali",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Health News API

### Get Health News

```http
GET /api/health-news?country={country}&category={category}&pageSize={pageSize}&language={language}
```

**Parameters:**
- `country` (optional): Country code (default: "rw")
- `category` (optional): News category (default: "health")
- `pageSize` (optional): Number of articles (default: 10, max: 50)
- `language` (optional): Language code (default: "en")

**Example:**
```bash
curl "http://localhost:8080/api/health-news?pageSize=5"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "mock-001",
      "title": "Rwanda Launches New Malaria Prevention Campaign",
      "description": "The Ministry of Health announces a comprehensive malaria prevention program...",
      "url": "https://example.com/malaria-campaign",
      "source": "Rwanda Health Ministry",
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "relevanceScore": 25,
      "healthCategory": "Malaria & Vector Control"
    }
  ],
  "count": 5,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Health News by Category

```http
GET /api/health-news/category/{category}?pageSize={pageSize}&language={language}
```

**Parameters:**
- `category` (required): Health category (e.g., "malaria", "covid", "maternal")
- `pageSize` (optional): Number of articles (default: 10)
- `language` (optional): Language code (default: "en")

**Example:**
```bash
curl "http://localhost:8080/api/health-news/category/malaria"
```

### Get Trending Health Topics

```http
GET /api/health-news/trending
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "category": "Malaria & Vector Control",
      "count": 15
    },
    {
      "category": "COVID-19",
      "count": 12
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## First-Aid API

### Get First-Aid Tips

```http
GET /api/first-aid?condition={condition}&limit={limit}
```

**Parameters:**
- `condition` (optional): Medical condition (e.g., "Burns", "Bleeding", "Choking")
- `limit` (optional): Number of tips (default: 20, max: 50)

**Example:**
```bash
curl "http://localhost:8080/api/first-aid?condition=Burns&limit=5"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "condition": "Burns",
      "tip": "Cool the burn under running water for 10 minutes.",
      "severity": "mild",
      "steps": [
        "Remove from heat source",
        "Cool with water",
        "Cover with clean cloth",
        "Seek medical help if severe"
      ]
    }
  ],
  "query": {
    "condition": "Burns",
    "limit": 5
  },
  "count": 1,
  "disclaimer": "These are basic first-aid guidelines. Always seek professional medical help in emergencies."
}
```

## AI Doctor API

### AI Medical Consultation

```http
POST /api/ai-doctor
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "I have a headache and fever",
  "specialization": "general",
  "language": "en"
}
```

**Parameters:**
- `message` (required): Medical question or symptoms (max 1000 characters)
- `specialization` (optional): Medical specialty
- `language` (optional): Response language

**Example:**
```bash
curl -X POST "http://localhost:8080/api/ai-doctor" \
  -H "Content-Type: application/json" \
  -d '{"message": "I have a headache and fever", "specialization": "general"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "I understand you're experiencing headache and fever. While I can provide general information...",
    "confidence": 0.85,
    "recommendations": [
      "Seek immediate medical attention",
      "Get tested for malaria",
      "Follow prescribed treatment"
    ]
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## User Management API

### User Registration

```http
POST /api/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "male",
  "phone": "+250788123456",
  "district": "Gasabo"
}
```

**Required Fields:**
- `email`, `password`, `firstName`, `lastName`

### User Login

```http
POST /api/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "session_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "district": "Gasabo"
  }
}
```

### Get User Profile

```http
GET /api/profile
Authorization: Bearer <session_token>
```

### Update User Profile

```http
PUT /api/profile
Authorization: Bearer <session_token>
Content-Type: application/json
```

### User Logout

```http
POST /api/logout
Authorization: Bearer <session_token>
```

## Health Records API

### Get Health Records

```http
GET /api/health-records
Authorization: Bearer <session_token>
```

### Add Health Record

```http
POST /api/health-records
Authorization: Bearer <session_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "type": "consultations",
  "data": {
    "date": "2024-01-01",
    "symptoms": "Headache, fever",
    "diagnosis": "Common cold",
    "treatment": "Rest and fluids"
  }
}
```

**Valid Types:**
- `consultations`, `medications`, `symptoms`, `allergies`, `emergencyContacts`, `medicalHistory`

## Telemedicine API

### Submit Telemedicine Request

```http
POST /api/telemedicine-request
Content-Type: application/json
```

**Request Body:**
```json
{
  "patientName": "John Doe",
  "district": "Bugesera",
  "symptoms": "Headache and fever",
  "hospitalName": "Nyamata District Hospital",
  "contactMethod": "phone",
  "urgency": "normal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Telemedicine consultation request submitted successfully",
  "data": {
    "id": "TMC-1234567890-abc123",
    "patientName": "John Doe",
    "status": "pending",
    "estimatedResponseTime": "1-2 hours",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## System Health API

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "IremboCare+",
  "version": "1.3.0",
  "uptime": 3600,
  "memory": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640
  },
  "environment": "production"
}
```

### Readiness Probe

```http
GET /ready
```

### Basic Metrics

```http
GET /metrics
```

## Rate Limiting

- **Default Limit**: 100 requests per 15 minutes per IP
- **Rate Limit Headers**: Included in responses
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

## Error Codes

| Code | Description |
|------|-------------|
| 200  | Success |
| 400  | Bad Request - Invalid parameters |
| 401  | Unauthorized - Authentication required |
| 403  | Forbidden - Access denied |
| 404  | Not Found - Resource not found |
| 408  | Request Timeout |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error |
| 503  | Service Unavailable - External API error |

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const client = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 10000
});

// Get health services
const healthServices = await client.get('/api/health-services', {
  params: { location: 'Bugesera' }
});

// Search medications
const medications = await client.get('/api/medication/search', {
  params: { 
    symptoms: 'headache,fever',
    sort: 'effectiveness'
  }
});

// Get weather health tips
const weatherTips = await client.get('/api/weather-health-tips', {
  params: { location: 'Kigali' }
});
```

### Python

```python
import requests

base_url = 'http://localhost:8080'

# Get health services
response = requests.get(f'{base_url}/api/health-services', 
                       params={'location': 'Bugesera'})
health_services = response.json()

# Search medications
response = requests.get(f'{base_url}/api/medication/search',
                       params={
                           'symptoms': 'headache,fever',
                           'sort': 'effectiveness'
                       })
medications = response.json()
```

### cURL Examples

```bash
# Health services with filtering
curl -G "http://localhost:8080/api/health-services/search" \
  -d "location=Bugesera" \
  -d "telemedicine=true" \
  -d "sort=name"

# Weather health tips
curl "http://localhost:8080/api/weather-health-tips?location=Kigali"

# Health news by category
curl "http://localhost:8080/api/health-news/category/malaria"

# AI doctor consultation
curl -X POST "http://localhost:8080/api/ai-doctor" \
  -H "Content-Type: application/json" \
  -d '{"message": "I have symptoms of malaria", "specialization": "general"}'
```

## Support

For API support:
- Email: api-support@irembocare.rw
- Documentation: This file
- Issues: GitHub repository issues

---

**API Version**: 1.4.0  
**Last Updated**: January 2024  
**Built with ❤️ for the people of Rwanda**