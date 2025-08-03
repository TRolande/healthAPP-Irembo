console.log('Testing application startup...');

try {
  // Try to require the main dependencies
  console.log('Loading Express...');
  const express = require('express');
  console.log('Express loaded successfully');
  
  console.log('Loading other dependencies...');
  const path = require('path');
  const axios = require('axios');
  const crypto = require('crypto');
  console.log('All dependencies loaded successfully');
  
  console.log('Creating Express app...');
  const app = express();
  console.log('Express app created successfully');
  
  console.log('Application test completed successfully!');
  console.log('You can now run: node src/app.js');
  
} catch (error) {
  console.error('Error during startup:', error.message);
  console.log('You need to install dependencies first. Try: npm install');
} 