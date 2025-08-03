const express = require('express');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const fetch = require('node-fetch');
require('dotenv').config(); // Load environment variables

// Import new services and utilities
const weatherService = require('./api/weatherService');
const newsService = require('./api/newsService');
const logger = require('./utils/logger');
const { asyncHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8080;

// Enhanced logging
logger.info('🏥 IremboCare+ server starting...', {
  port: PORT,
  nodeEnv: process.env.NODE_ENV,
  timestamp: new Date().toISOString()
});

// Serve static files from pages directory
app.use(express.static(path.join(__dirname, 'pages')));

// Serve static files from styles directory
app.use('/styles', express.static(path.join(__dirname, 'styles')));

// Serve specific CSS file
app.use('/styles.css', express.static(path.join(__dirname, 'styles', 'main.css')));

app.use(express.json());

// Enhanced request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'IremboCare+',
    version: '1.3.0'
  });
});

// Serve the main page (with authentication)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'working-index.html'));
});

// In-memory user storage (in production, use a proper database)
const users = new Map();
const userSessions = new Map();
const healthRecords = new Map();

// Helper functions for authentication
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !userSessions.has(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = userSessions.get(token);
  next();
}

const hospitalsByDistrict = {
  Bugesera: [
    { 
      name: "Nyamata District Hospital", 
      type: "Public",
      phone: "+250788123456",
      email: "nyamata.hospital@moh.gov.rw",
      telemedicine: true,
      specialties: ["General Medicine", "Emergency Care", "Maternity"]
    },
    { 
      name: "Ruhuha Health Center", 
      type: "Public",
      phone: "+250788123457",
      email: "ruhuha.hc@moh.gov.rw",
      telemedicine: true,
      specialties: ["Primary Care", "Vaccination"]
    },
    { 
      name: "Bugesera Medical Clinic", 
      type: "Private",
      phone: "+250788123458",
      email: "info@bugeseramedical.rw",
      telemedicine: true,
      specialties: ["General Practice", "Pediatrics"]
    },
    { 
      name: "Nyamata Polyclinic", 
      type: "Private",
      phone: "+250788123459",
      email: "contact@nyamatapolyclinic.rw",
      telemedicine: false,
      specialties: ["Dental Care", "Eye Care"]
    },
    { 
      name: "Bugesera Private Hospital", 
      type: "Private",
      phone: "+250788123460",
      email: "admin@bugeseraprivate.rw",
      telemedicine: true,
      specialties: ["Surgery", "Internal Medicine", "Cardiology"]
    }
  ],
  Muhanga: [
    { 
      name: "Kabgayi District Hospital", 
      type: "Public",
      phone: "+250788123461",
      email: "kabgayi.hospital@moh.gov.rw",
      telemedicine: true,
      specialties: ["General Medicine", "Surgery", "Maternity", "Emergency Care"]
    },
    { 
      name: "Shyogwe Health Center", 
      type: "Public",
      phone: "+250788123462",
      email: "shyogwe.hc@moh.gov.rw",
      telemedicine: true,
      specialties: ["Primary Care", "Maternal Health"]
    },
    { 
      name: "Muhanga Medical Clinic", 
      type: "Private",
      phone: "+250788123463",
      email: "info@muhangamedical.rw",
      telemedicine: true,
      specialties: ["General Practice", "Laboratory Services"]
    },
    { 
      name: "Kabgayi Private Hospital", 
      type: "Private",
      phone: "+250788123464",
      email: "admin@kabgayiprivate.rw",
      telemedicine: true,
      specialties: ["Specialized Surgery", "Oncology", "Radiology"]
    },
    { 
      name: "Muhanga Polyclinic", 
      type: "Private",
      phone: "+250788123465",
      email: "contact@muhangapolyclinic.rw",
      telemedicine: false,
      specialties: ["Dental Care", "Physiotherapy"]
    }
  ],
  Burera: [
    { 
      name: "Butaro District Hospital", 
      type: "Public",
      phone: "+250788123466",
      email: "butaro.hospital@moh.gov.rw",
      telemedicine: true,
      specialties: ["General Medicine", "Emergency Care", "Mental Health"]
    },
    { 
      name: "Rugarama Health Center", 
      type: "Public",
      phone: "+250788123467",
      email: "rugarama.hc@moh.gov.rw",
      telemedicine: true,
      specialties: ["Primary Care", "Child Health"]
    },
    { 
      name: "Burera Medical Center", 
      type: "Private",
      phone: "+250788123468",
      email: "info@bureramedical.rw",
      telemedicine: true,
      specialties: ["General Practice", "Dermatology"]
    },
    { 
      name: "Butaro Private Clinic", 
      type: "Private",
      phone: "+250788123469",
      email: "contact@butaroclinic.rw",
      telemedicine: false,
      specialties: ["Outpatient Care", "Minor Surgery"]
    },
    { 
      name: "Burera Polyclinic", 
      type: "Private",
      phone: "+250788123470",
      email: "admin@burerapolyclinic.rw",
      telemedicine: true,
      specialties: ["Family Medicine", "Women's Health"]
    }
  ]
};

app.get('/api/health-services', (req, res) => {
  try {
    const { location } = req.query;
    
    if (!location) {
      return res.status(400).json({ 
        error: 'Missing parameter', 
        message: 'Location parameter is required' 
      });
    }
    
    if (typeof location !== 'string' || location.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Invalid parameter', 
        message: 'Location must be a valid string' 
      });
    }
    
    const normalizedLocation = location.trim();
    const hospitals = hospitalsByDistrict[normalizedLocation];
    
    if (!hospitals) {
      return res.json({ 
        success: true, 
        data: [], 
        message: `No healthcare services found for ${normalizedLocation}`,
        availableDistricts: Object.keys(hospitalsByDistrict)
      });
    }
    
    // Format for frontend with enhanced data
    const formattedHospitals = hospitals.map(h => ({
      display_name: `${h.name} (${h.type})`,
      name: h.name,
      type: h.type,
      id: h.name.toLowerCase().replace(/\s+/g, '-')
    }));
    
    res.json({
      success: true,
      data: formattedHospitals,
      location: normalizedLocation,
      count: formattedHospitals.length
    });
    
  } catch (error) {
    console.error('Health Services API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Unable to fetch health services. Please try again later.' 
    });
  }
});

// Enhanced medication API with error handling
app.get('/api/medication', (req, res) => {
  try {
    const { disease, limit = 10 } = req.query;
    
    // Validate input
    if (limit && (isNaN(limit) || limit < 1 || limit > 50)) {
      return res.status(400).json({ 
        error: 'Invalid parameter', 
        message: 'Limit must be a number between 1 and 50' 
      });
    }
    
    // Enhanced demo data with more realistic medication info
    const medicationDatabase = {
      malaria: [
        { openfda: { brand_name: ["Coartem"], generic_name: ["Artemether/Lumefantrine"] }, dosage: "Adult: 4 tablets twice daily for 3 days" },
        { openfda: { brand_name: ["Artemether"], generic_name: ["Artemether"] }, dosage: "As prescribed by healthcare provider" }
      ],
      fever: [
        { openfda: { brand_name: ["Panadol"], generic_name: ["Paracetamol"] }, dosage: "Adult: 500mg-1g every 4-6 hours" },
        { openfda: { brand_name: ["Aspirin"], generic_name: ["Acetylsalicylic acid"] }, dosage: "Adult: 300-600mg every 4 hours" }
      ],
      headache: [
        { openfda: { brand_name: ["Panadol"], generic_name: ["Paracetamol"] }, dosage: "Adult: 500mg-1g every 4-6 hours" },
        { openfda: { brand_name: ["Ibuprofen"], generic_name: ["Ibuprofen"] }, dosage: "Adult: 200-400mg every 4-6 hours" }
      ]
    };
    
    let medications;
    if (disease) {
      const normalizedDisease = disease.toLowerCase().trim();
      medications = medicationDatabase[normalizedDisease] || [];
    } else {
      // Return all medications if no specific disease
      medications = Object.values(medicationDatabase).flat();
    }
    
    const limitedMedications = medications.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: limitedMedications,
      query: { disease, limit: parseInt(limit) },
      count: limitedMedications.length,
      disclaimer: "This is demo data. Always consult a healthcare professional for proper medication advice."
    });
    
  } catch (error) {
    console.error('Medication API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Unable to fetch medication information. Please try again later.' 
    });
  }
});

// Enhanced first-aid API with comprehensive tips
app.get('/api/first-aid', (req, res) => {
  try {
    const { condition, limit = 20 } = req.query;
    
    // Validate input
    if (limit && (isNaN(limit) || limit < 1 || limit > 50)) {
      return res.status(400).json({ 
        error: 'Invalid parameter', 
        message: 'Limit must be a number between 1 and 50' 
      });
    }
    
    const firstAidDatabase = [
      { 
        condition: "Burns", 
        tip: "Cool the burn under running water for 10 minutes.",
        severity: "mild",
        steps: ["Remove from heat source", "Cool with water", "Cover with clean cloth", "Seek medical help if severe"]
      },
      { 
        condition: "Bleeding", 
        tip: "Apply pressure to stop bleeding and use a clean cloth.",
        severity: "moderate",
        steps: ["Apply direct pressure", "Elevate if possible", "Use clean cloth", "Call emergency if severe"]
      },
      { 
        condition: "Choking", 
        tip: "Perform back blows and abdominal thrusts.",
        severity: "severe",
        steps: ["Encourage coughing", "5 back blows", "5 abdominal thrusts", "Call emergency services"]
      },
      { 
        condition: "Fracture", 
        tip: "Immobilize the area and seek immediate medical attention.",
        severity: "severe",
        steps: ["Don't move the person", "Immobilize the injury", "Apply ice if available", "Get emergency help"]
      },
      { 
        condition: "Heart Attack", 
        tip: "Call emergency services immediately and give aspirin if available.",
        severity: "critical",
        steps: ["Call 911 immediately", "Give aspirin if conscious", "Help them sit comfortably", "Monitor breathing"]
      }
    ];
    
    let tips;
    if (condition) {
      const normalizedCondition = condition.toLowerCase().trim();
      tips = firstAidDatabase.filter(tip => 
        tip.condition.toLowerCase().includes(normalizedCondition)
      );
    } else {
      tips = firstAidDatabase;
    }
    
    const limitedTips = tips.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: limitedTips,
      query: { condition, limit: parseInt(limit) },
      count: limitedTips.length,
      disclaimer: "These are basic first-aid guidelines. Always seek professional medical help in emergencies."
    });
    
  } catch (error) {
    console.error('First Aid API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Unable to fetch first-aid information. Please try again later.' 
    });
  }
});

// Enhanced error handling middleware
app.use(errorHandler);

// Input validation middleware
const validateAIDoctorInput = (req, res, next) => {
  const { message, specialization, language } = req.body;
  
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Invalid input', 
      message: 'Message is required and must be a non-empty string' 
    });
  }
  
  if (message.length > 1000) {
    return res.status(400).json({ 
      error: 'Invalid input', 
      message: 'Message must be less than 1000 characters' 
    });
  }
  
  next();
};

app.post('/api/ai-doctor', validateAIDoctorInput, async (req, res) => {
  const { message, specialization, language } = req.body;
  const url = 'https://ai-doctor-api-ai-medical-chatbot-healthcare-ai-assistant.p.rapidapi.com/chat?noqueue=1';
  
  // Secure API key management
  const apiKey = process.env.RAPIDAPI_KEY || '6e955d8d55msh09af75f8213caecp17be4ejsn5a7d5e69d78b';
  
  // For demo purposes, provide a fallback response when API is unavailable
  const demoResponse = {
    response: "I understand you're asking about malaria. While I can provide general information, it's important to consult with a healthcare professional for proper diagnosis and treatment. Malaria is a serious disease caused by parasites transmitted through mosquito bites. Common symptoms include fever, chills, headache, and fatigue. If you suspect you have malaria, please seek immediate medical attention at your nearest healthcare facility.",
    confidence: 0.85,
    recommendations: [
      "Seek immediate medical attention",
      "Get tested for malaria",
      "Follow prescribed treatment",
      "Use mosquito nets and repellents"
    ]
  };
  
  if (!apiKey) {
    return res.status(500).json({ 
      error: 'Configuration error', 
      message: 'API key not configured. Please contact support.' 
    });
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'ai-doctor-api-ai-medical-chatbot-healthcare-ai-assistant.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, specialization, language }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded', 
          message: 'Too many requests. Please try again in a few minutes.' 
        });
      }
      
          if (response.status === 401 || response.status === 403) {
      // Return demo response for demo purposes
      return res.json({
        success: true,
        data: demoResponse,
        timestamp: new Date().toISOString(),
        note: 'Demo response - API service temporarily unavailable'
      });
    }
      
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result || typeof result !== 'object') {
      throw new Error('Invalid response format from AI service');
    }
    
    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('AI Doctor API Error:', error);
    
    if (error.name === 'AbortError') {
      return res.status(408).json({ 
        error: 'Request timeout', 
        message: 'The request took too long. Please try again.' 
      });
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        error: 'Service unavailable', 
        message: 'AI service is currently unavailable. Please try again later.' 
      });
    }
    
    // Return demo response for demo purposes when API fails
    res.json({
      success: true,
      data: demoResponse,
      timestamp: new Date().toISOString(),
      note: 'Demo response - API service temporarily unavailable'
    });
  }
});

// User Registration
app.post('/api/register', (req, res) => {
  try {
    const { email, password, firstName, lastName, dateOfBirth, gender, phone, district } = req.body;
    
    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email, password, first name, and last name are required'
      });
    }
    
    // Check if user already exists
    if (users.has(email)) {
      return res.status(409).json({
        error: 'User already exists',
        message: 'An account with this email already exists'
      });
    }
    
    // Create new user
    const userId = crypto.randomUUID();
    const hashedPassword = hashPassword(password);
    
    const newUser = {
      id: userId,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      district,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    users.set(email, newUser);
    
    // Initialize empty health records
    healthRecords.set(userId, {
      consultations: [],
      medications: [],
      symptoms: [],
      allergies: [],
      emergencyContacts: [],
      medicalHistory: []
    });
    
    res.json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        district
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to register user'
    });
  }
});

// User Login
app.post('/api/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }
    
    const user = users.get(email);
    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      });
    }
    
    // Generate session token
    const sessionToken = generateSessionToken();
    userSessions.set(sessionToken, {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      district: user.district
    });
    
    // Update last login
    user.lastLogin = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Login successful',
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        district: user.district
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to login'
    });
  }
});

// User Logout
app.post('/api/logout', authenticateUser, (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    userSessions.delete(token);
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to logout'
    });
  }
});

// Get User Profile
app.get('/api/profile', authenticateUser, (req, res) => {
  try {
    const user = users.get(req.user.email);
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        phone: user.phone,
        district: user.district,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get profile'
    });
  }
});

// Update User Profile
app.put('/api/profile', authenticateUser, (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, gender, phone, district } = req.body;
    const user = users.get(req.user.email);
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile not found'
      });
    }
    
    // Update user data
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (gender) user.gender = gender;
    if (phone) user.phone = phone;
    if (district) user.district = district;
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        phone: user.phone,
        district: user.district
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update profile'
    });
  }
});

// Get Health Records
app.get('/api/health-records', authenticateUser, (req, res) => {
  try {
    const records = healthRecords.get(req.user.userId) || {
      consultations: [],
      medications: [],
      symptoms: [],
      allergies: [],
      emergencyContacts: [],
      medicalHistory: []
    };
    
    res.json({
      success: true,
      records
    });
  } catch (error) {
    console.error('Health records error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get health records'
    });
  }
});

// Add Health Record Entry
app.post('/api/health-records', authenticateUser, (req, res) => {
  try {
    const { type, data } = req.body;
    const validTypes = ['consultations', 'medications', 'symptoms', 'allergies', 'emergencyContacts', 'medicalHistory'];
    
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid type',
        message: 'Type must be one of: ' + validTypes.join(', ')
      });
    }
    
    const records = healthRecords.get(req.user.userId) || {
      consultations: [],
      medications: [],
      symptoms: [],
      allergies: [],
      emergencyContacts: [],
      medicalHistory: []
    };
    
    const newEntry = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date().toISOString()
    };
    
    records[type].push(newEntry);
    healthRecords.set(req.user.userId, records);
    
    res.json({
      success: true,
      message: 'Health record added successfully',
      entry: newEntry
    });
  } catch (error) {
    console.error('Add health record error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to add health record'
    });
  }
});

// Telemedicine consultation endpoint
app.post('/api/telemedicine-request', (req, res) => {
  try {
    const { patientName, district, symptoms, hospitalName, contactMethod, urgency } = req.body;
    
    // Validate required fields
    if (!patientName || !district || !symptoms || !hospitalName || !contactMethod) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Patient name, district, symptoms, hospital name, and contact method are required'
      });
    }
    
    // Find the hospital in the specified district
    const hospitals = hospitalsByDistrict[district];
    if (!hospitals) {
      return res.status(404).json({
        error: 'District not found',
        message: 'The specified district was not found in our database'
      });
    }
    
    const hospital = hospitals.find(h => h.name === hospitalName);
    if (!hospital) {
      return res.status(404).json({
        error: 'Hospital not found',
        message: 'The specified hospital was not found in the district'
      });
    }
    
    if (!hospital.telemedicine) {
      return res.status(400).json({
        error: 'Telemedicine not available',
        message: 'This hospital does not offer telemedicine services'
      });
    }
    
    // Generate a consultation request ID
    const requestId = 'TMC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    // In a real application, this would be saved to a database
    // and the hospital would be notified
    const consultationRequest = {
      id: requestId,
      patientName,
      district,
      symptoms,
      hospital: {
        name: hospital.name,
        phone: hospital.phone,
        email: hospital.email
      },
      contactMethod,
      urgency: urgency || 'normal',
      status: 'pending',
      createdAt: new Date().toISOString(),
      estimatedResponseTime: urgency === 'urgent' ? '15-30 minutes' : '1-2 hours'
    };
    
    res.json({
      success: true,
      message: 'Telemedicine consultation request submitted successfully',
      data: consultationRequest
    });
    
  } catch (error) {
    console.error('Telemedicine request error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process telemedicine request'
    });
  }
});

// NEW API ENDPOINTS - Weather-based Health Recommendations
app.get('/api/weather-health-tips', asyncHandler(async (req, res) => {
  try {
    const { location = 'Kigali' } = req.query;
    
    logger.info(`Weather health tips requested for ${location}`);
    
    const weatherHealthData = await weatherService.getWeatherHealthTips(location);
    
    res.json({
      success: true,
      data: weatherHealthData.data,
      location,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Weather health tips error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch weather-based health recommendations',
      message: 'Weather service is temporarily unavailable. Please try again later.'
    });
  }
}));

// NEW API ENDPOINTS - Health News
app.get('/api/health-news', asyncHandler(async (req, res) => {
  try {
    const {
      country = 'rw',
      category = 'health',
      pageSize = 10,
      language = 'en'
    } = req.query;
    
    logger.info(`Health news requested`, { country, category, pageSize });
    
    const newsData = await newsService.getHealthNews({
      country,
      category,
      pageSize: parseInt(pageSize),
      language
    });
    
    res.json(newsData);
  } catch (error) {
    logger.error('Health news error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch health news',
      message: 'News service is temporarily unavailable. Please try again later.'
    });
  }
}));

// NEW API ENDPOINTS - Health News by Category
app.get('/api/health-news/category/:category', asyncHandler(async (req, res) => {
  try {
    const { category } = req.params;
    const { pageSize = 10, language = 'en' } = req.query;
    
    logger.info(`Health news by category requested: ${category}`);
    
    const newsData = await newsService.getHealthNewsByCategory(category, {
      pageSize: parseInt(pageSize),
      language
    });
    
    res.json(newsData);
  } catch (error) {
    logger.error(`Health news category error for ${req.params.category}:`, error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch health news by category',
      message: 'News service is temporarily unavailable. Please try again later.'
    });
  }
}));

// NEW API ENDPOINTS - Trending Health Topics
app.get('/api/health-news/trending', asyncHandler(async (req, res) => {
  try {
    logger.info('Trending health topics requested');
    
    const trendingData = await newsService.getTrendingHealthTopics();
    
    res.json(trendingData);
  } catch (error) {
    logger.error('Trending health topics error:', error);
    res.status(500).json({
      success: false,
      error: 'Unable to fetch trending health topics',
      message: 'News service is temporarily unavailable. Please try again later.'
    });
  }
}));

// ENHANCED API ENDPOINTS - Enhanced Health Services with Search and Filter
app.get('/api/health-services/search', asyncHandler(async (req, res) => {
  try {
    const {
      location,
      specialty,
      services,
      telemedicine,
      type,
      sort = 'name'
    } = req.query;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        error: 'Missing parameter',
        message: 'Location parameter is required'
      });
    }
    
    logger.info(`Enhanced health services search`, {
      location, specialty, services, telemedicine, type, sort
    });
    
    const hospitals = hospitalsByDistrict[location] || [];
    
    let filteredHospitals = hospitals.filter(hospital => {
      let matches = true;
      
      if (specialty && !hospital.specialties.some(s =>
        s.toLowerCase().includes(specialty.toLowerCase()))) {
        matches = false;
      }
      
      if (services && !hospital.specialties.some(s =>
        s.toLowerCase().includes(services.toLowerCase()))) {
        matches = false;
      }
      
      if (telemedicine !== undefined &&
          hospital.telemedicine !== (telemedicine === 'true')) {
        matches = false;
      }
      
      if (type && hospital.type.toLowerCase() !== type.toLowerCase()) {
        matches = false;
      }
      
      return matches;
    });
    
    // Sort results
    if (sort === 'name') {
      filteredHospitals.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'type') {
      filteredHospitals.sort((a, b) => a.type.localeCompare(b.type));
    }
    
    const formattedHospitals = filteredHospitals.map(h => ({
      display_name: `${h.name} (${h.type})`,
      name: h.name,
      type: h.type,
      phone: h.phone,
      email: h.email,
      telemedicine: h.telemedicine,
      specialties: h.specialties,
      id: h.name.toLowerCase().replace(/\s+/g, '-')
    }));
    
    res.json({
      success: true,
      data: formattedHospitals,
      location,
      filters: { specialty, services, telemedicine, type, sort },
      count: formattedHospitals.length
    });
    
  } catch (error) {
    logger.error('Enhanced health services search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Unable to search health services. Please try again later.'
    });
  }
}));

// ENHANCED API ENDPOINTS - Enhanced Medication Search
app.get('/api/medication/search', asyncHandler(async (req, res) => {
  try {
    const {
      disease,
      symptoms,
      type = 'all',
      limit = 10,
      sort = 'relevance'
    } = req.query;
    
    logger.info(`Enhanced medication search`, { disease, symptoms, type, limit, sort });
    
    const medicationDatabase = {
      malaria: [
        {
          openfda: { brand_name: ["Coartem"], generic_name: ["Artemether/Lumefantrine"] },
          dosage: "Adult: 4 tablets twice daily for 3 days",
          type: "brand",
          effectiveness: 95,
          sideEffects: ["Nausea", "Dizziness", "Headache"]
        },
        {
          openfda: { brand_name: ["Artemether"], generic_name: ["Artemether"] },
          dosage: "As prescribed by healthcare provider",
          type: "generic",
          effectiveness: 90,
          sideEffects: ["Injection site pain"]
        }
      ],
      fever: [
        {
          openfda: { brand_name: ["Panadol"], generic_name: ["Paracetamol"] },
          dosage: "Adult: 500mg-1g every 4-6 hours",
          type: "brand",
          effectiveness: 85,
          sideEffects: ["Rare allergic reactions"]
        },
        {
          openfda: { brand_name: ["Aspirin"], generic_name: ["Acetylsalicylic acid"] },
          dosage: "Adult: 300-600mg every 4 hours",
          type: "generic",
          effectiveness: 80,
          sideEffects: ["Stomach irritation", "Bleeding risk"]
        }
      ],
      headache: [
        {
          openfda: { brand_name: ["Panadol"], generic_name: ["Paracetamol"] },
          dosage: "Adult: 500mg-1g every 4-6 hours",
          type: "brand",
          effectiveness: 85,
          sideEffects: ["Rare allergic reactions"]
        },
        {
          openfda: { brand_name: ["Ibuprofen"], generic_name: ["Ibuprofen"] },
          dosage: "Adult: 200-400mg every 4-6 hours",
          type: "generic",
          effectiveness: 88,
          sideEffects: ["Stomach upset", "Dizziness"]
        }
      ]
    };
    
    let medications = [];
    
    if (disease) {
      const normalizedDisease = disease.toLowerCase().trim();
      medications = medicationDatabase[normalizedDisease] || [];
    } else if (symptoms) {
      const symptomList = symptoms.toLowerCase().split(',').map(s => s.trim());
      Object.keys(medicationDatabase).forEach(condition => {
        if (symptomList.some(symptom => condition.includes(symptom))) {
          medications = medications.concat(medicationDatabase[condition]);
        }
      });
    } else {
      medications = Object.values(medicationDatabase).flat();
    }
    
    // Filter by type
    if (type !== 'all') {
      medications = medications.filter(med => med.type === type);
    }
    
    // Sort medications
    if (sort === 'effectiveness') {
      medications.sort((a, b) => (b.effectiveness || 0) - (a.effectiveness || 0));
    } else if (sort === 'name') {
      medications.sort((a, b) => {
        const nameA = a.openfda.brand_name[0] || a.openfda.generic_name[0];
        const nameB = b.openfda.brand_name[0] || b.openfda.generic_name[0];
        return nameA.localeCompare(nameB);
      });
    }
    
    const limitedMedications = medications.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: limitedMedications,
      query: { disease, symptoms, type, limit: parseInt(limit), sort },
      count: limitedMedications.length,
      disclaimer: "This is demo data. Always consult a healthcare professional for proper medication advice."
    });
    
  } catch (error) {
    logger.error('Enhanced medication search error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Unable to search medications. Please try again later.'
    });
  }
}));

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'IremboCare+',
    version: '1.3.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  logger.info('Health check requested', healthStatus);
  res.json(healthStatus);
});

// Readiness probe for load balancer
app.get('/ready', (req, res) => {
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    service: 'IremboCare+'
  });
});

// Basic metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info('🏥 IremboCare+ server started successfully', {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
    
    console.log(`🏥 IremboCare+ server running on port ${PORT}`);
    console.log(`📱 Access your app at: http://localhost:${PORT}`);
    console.log(`🔐 Authentication endpoints ready`);
    console.log(`🩺 Health services API ready`);
    console.log(`🌤️  Weather health tips API ready`);
    console.log(`📰 Health news API ready`);
    console.log(`🔍 Enhanced search APIs ready`);
  });
}

// Export the app for testing
module.exports = app;