import { sanitizeLogData } from './sanitize.js';

// Test cases for the sanitizeLogData function
console.log('Testing sanitizeLogData function...\n');

// Test 1: Basic object with sensitive fields
const test1 = {
  username: 'john_doe',
  password: 'secret123',
  email: 'john@example.com'
};

console.log('Test 1 - Basic object with password:');
console.log('Input:', test1);
console.log('Output:', sanitizeLogData(test1));
console.log('Password redacted:', sanitizeLogData(test1).password === '[REDACTED]' ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 2: Nested objects with sensitive fields
const test2 = {
  user: {
    name: 'jane_doe',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    profile: {
      apiKey: 'sk-1234567890abcdef',
      details: {
        secret: 'top_secret'
      }
    }
  },
  data: 'normal_data'
};

console.log('Test 2 - Nested objects with sensitive fields:');
console.log('Input:', JSON.stringify(test2, null, 2));
console.log('Output:', JSON.stringify(sanitizeLogData(test2), null, 2));
console.log('All sensitive fields redacted:', 
  sanitizeLogData(test2).user.token === '[REDACTED]' && 
  sanitizeLogData(test2).user.profile.apiKey === '[REDACTED]' && 
  sanitizeLogData(test2).user.profile.details.secret === '[REDACTED]' ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 3: String with JWT token
const test3 = {
  message: 'User login attempt',
  authHeader: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
  normalField: 'normal_value'
};

console.log('Test 3 - String with JWT token:');
console.log('Input:', test3);
console.log('Output:', sanitizeLogData(test3));
console.log('JWT token redacted:', sanitizeLogData(test3).authHeader === '[REDACTED]' ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 4: Non-object input
const test4 = 'just a string';
console.log('Test 4 - Non-object input:');
console.log('Input:', test4);
console.log('Output:', sanitizeLogData(test4));
console.log('String unchanged:', sanitizeLogData(test4) === test4 ? '✅ PASS' : '❌ FAIL');
console.log('');

// Test 5: Null input
const test5 = null;
console.log('Test 5 - Null input:');
console.log('Input:', test5);
console.log('Output:', sanitizeLogData(test5));
console.log('Null unchanged:', sanitizeLogData(test5) === test5 ? '✅ PASS' : '❌ FAIL');
console.log('');

console.log('All tests completed!');