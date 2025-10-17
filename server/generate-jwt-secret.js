#!/usr/bin/env node

// Script to generate a secure JWT secret
import { randomBytes } from 'crypto';

function generateJWTSecret(length = 64) {
  return randomBytes(length).toString('hex');
}

const jwtSecret = generateJWTSecret();
console.log('Generated JWT Secret:');
console.log(jwtSecret);
console.log('\nTo use this secret:');
console.log('1. Copy the above secret');
console.log('2. Paste it in your .env files as JWT_SECRET=your_generated_secret_here');
console.log('3. Keep it secure and never share it publicly');