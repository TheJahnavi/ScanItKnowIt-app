// Simple test script to test the API endpoints
import fetch from 'node-fetch';

async function testHealthEndpoint() {
  try {
    const response = await fetch('http://localhost:3002/api/health');
    const data = await response.json();
    console.log('Health check response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing health endpoint:', error);
  }
}

testHealthEndpoint();