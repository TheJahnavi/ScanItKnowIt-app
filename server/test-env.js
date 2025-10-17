#!/usr/bin/env node

// Test script to verify environment variables are properly loaded
console.log('Environment Variables Test:');
console.log('==========================');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? '[SET]' : '[NOT SET]');
console.log('REDDIT_CLIENT_ID:', process.env.REDDIT_CLIENT_ID ? '[SET]' : '[NOT SET]');
console.log('REDDIT_CLIENT_SECRET:', process.env.REDDIT_CLIENT_SECRET ? '[SET]' : '[NOT SET]');
console.log('REDDIT_USER_AGENT:', process.env.REDDIT_USER_AGENT || '[NOT SET]');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '[SET]' : '[NOT SET]');
console.log('PORT:', process.env.PORT || '[NOT SET]');

// Check if required variables are set
const requiredVars = ['OPENROUTER_API_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('\n⚠️  WARNING: The following required environment variables are not set:');
  missingVars.forEach(varName => console.log(`  - ${varName}`));
  console.log('\nPlease set these variables before running the application.');
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set.');
}

console.log('\nOptional variables:');
console.log('  Reddit Integration:', process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET ? 'ENABLED' : 'DISABLED');
console.log('  Custom JWT Secret:', process.env.JWT_SECRET ? 'YES' : 'Using default (less secure)');