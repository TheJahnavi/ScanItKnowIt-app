export function sanitizeLogData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  // Deep clone to avoid mutating original data
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // Define sensitive fields to redact
  const sensitiveFields = [
    'password',
    'token',
    'authorization',
    'auth',
    'secret',
    'key',
    'apiKey',
    'privateKey',
    'access_token',
    'refresh_token'
  ];
  
  // Recursive sanitization function
  function sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      // Check if field is sensitive
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        obj[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitizeObject(value);
      } else if (typeof value === 'string') {
        // Check if string value contains sensitive patterns
        if (value.length > 20 && (value.startsWith('ey') || value.includes('Bearer '))) {
          obj[key] = '[REDACTED]';
        }
      }
    }
    
    return obj;
  }
  
  return sanitizeObject(sanitized);
}