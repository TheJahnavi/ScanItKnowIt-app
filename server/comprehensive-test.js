// Comprehensive test script to test the API endpoints
import fetch from 'node-fetch';

async function testEndpoints() {
  try {
    console.log('Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3002/api/health');
    const healthData = await healthResponse.json();
    console.log('Health check response:', JSON.stringify(healthData, null, 2));
    
    // Test registration endpoint with a unique username
    const uniqueUsername = `testuser_${Date.now()}`;
    console.log(`\nTesting registration endpoint with username: ${uniqueUsername}...`);
    const registerResponse = await fetch('http://localhost:3002/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: uniqueUsername,
        password: 'testpassword'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('Registration response:', JSON.stringify(registerData, null, 2));
    
    // Test login endpoint
    console.log(`\nTesting login endpoint with username: ${uniqueUsername}...`);
    const loginResponse = await fetch('http://localhost:3002/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: uniqueUsername,
        password: 'testpassword'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', JSON.stringify(loginData, null, 2));
    
    // If we have a token, we can test authenticated endpoints
    if (loginData.token) {
      console.log('\nTesting user analyses endpoint...');
      const analysesResponse = await fetch('http://localhost:3002/api/user/analyses', {
        headers: {
          'Authorization': `Bearer ${loginData.token}`
        }
      });
      
      const analysesData = await analysesResponse.json();
      console.log('User analyses response:', JSON.stringify(analysesData, null, 2));
      
      // Test analyze-product endpoint with a simple base64 encoded image
      console.log('\nTesting analyze-product endpoint...');
      // Create a simple base64 encoded image (1x1 pixel PNG)
      const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
      
      const analyzeResponse = await fetch('http://localhost:3002/api/analyze-product', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: base64Image
        })
      });
      
      const analyzeData = await analyzeResponse.json();
      console.log('Analyze product response:', JSON.stringify(analyzeData, null, 2));
    }
  } catch (error) {
    console.error('Error testing endpoints:', error);
  }
}

testEndpoints();