# Health Check Documentation

This document provides detailed information about the enhanced health check endpoint implementation in the ScanItKnowIt application.

## Overview

The enhanced health check endpoint at `/api/health` provides comprehensive monitoring of the application's critical dependencies, ensuring that all systems are operational before serving requests.

## Endpoint Details

### URL
```
GET /api/health
```

### Response Format
```json
{
  "status": "healthy|unhealthy",
  "timestamp": "ISO 8601 timestamp",
  "uptime": "seconds since application start",
  "checks": {
    "server": {
      "status": "ok|error",
      "timestamp": "ISO 8601 timestamp"
    },
    "database": {
      "status": "ok|error|skipped",
      "timestamp": "ISO 8601 timestamp",
      "error": "error message (if status is error)"
    },
    "openai": {
      "status": "ok|error|skipped",
      "timestamp": "ISO 8601 timestamp",
      "error": "error message (if status is error)"
    },
    "reddit": {
      "status": "ok|error|skipped",
      "timestamp": "ISO 8601 timestamp",
      "error": "error message (if status is error)",
      "reason": "reason for skipping (if status is skipped)"
    }
  }
}
```

### HTTP Status Codes
- `200 OK`: All systems are healthy
- `503 Service Unavailable`: One or more systems are unhealthy

## Health Checks Performed

### 1. Server Health
- **Purpose**: Verifies that the Express server is running
- **Check**: Basic endpoint accessibility
- **Failure Impact**: Application is completely down

### 2. Database Connectivity
- **Purpose**: Verifies database connectivity and basic operations
- **Check**: Attempts to retrieve a user record (non-existent test user)
- **Failure Impact**: User authentication and data persistence will fail
- **Configuration**: Uses the configured database (SQLite, PostgreSQL, or MySQL)

### 3. OpenAI/OpenRouter API
- **Purpose**: Verifies connectivity to the AI service
- **Check**: Lists available models using the OpenAI client
- **Failure Impact**: All AI-powered features (product analysis, chat) will fail
- **Configuration**: Uses `OPENROUTER_API_KEY` environment variable

### 4. Reddit API
- **Purpose**: Verifies connectivity to Reddit for product reviews
- **Check**: Makes a simple API call to the Reddit authentication endpoint
- **Failure Impact**: Reddit review functionality will be unavailable
- **Configuration**: Only performed if `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` are configured

## Implementation Details

### Error Handling
The health check endpoint is designed to be resilient:
- Individual check failures don't cause the entire endpoint to fail
- Each check has its own timeout and error handling
- The overall status reflects the health of all critical systems

### Performance Considerations
- Health checks are lightweight and don't perform expensive operations
- Database check uses a minimal query that doesn't affect performance
- External API checks use simple endpoints that respond quickly
- Results are not cached to ensure real-time status

### Security
- Health check endpoint doesn't expose sensitive information
- Error messages are generic and don't reveal internal details
- No authentication required for health checks (common practice for monitoring)

## Monitoring Integration

### Prometheus/Grafana
The health check endpoint can be integrated with monitoring systems:
```bash
# Example Prometheus configuration
- job_name: 'scanitknowit-health'
  static_configs:
    - targets: ['localhost:3001']
  metrics_path: '/api/health'
  scrape_interval: 30s
```

### Docker/Kubernetes
Health checks can be used as liveness and readiness probes:
```yaml
# Kubernetes deployment example
livenessProbe:
  httpGet:
    path: /api/health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 3001
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Testing the Health Check

### Manual Testing
```bash
# Using curl
curl -v http://localhost:3001/api/health

# Using wget
wget -qO- http://localhost:3001/api/health
```

### Automated Testing
```javascript
// Example test script
const fetch = require('node-fetch');

async function checkHealth() {
  try {
    const response = await fetch('http://localhost:3001/api/health');
    const health = await response.json();
    
    console.log('Health Status:', health.status);
    console.log('Checks:');
    Object.entries(health.checks).forEach(([name, check]) => {
      console.log(`  ${name}: ${check.status}`);
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Health check failed:', error.message);
    return false;
  }
}

checkHealth().then(isHealthy => {
  console.log('Application is', isHealthy ? 'healthy' : 'unhealthy');
});
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
**Symptoms**: 
```json
{
  "status": "unhealthy",
  "checks": {
    "database": {
      "status": "error",
      "error": "connect ECONNREFUSED 127.0.0.1:5432"
    }
  }
}
```

**Solutions**:
- Verify database server is running
- Check database connection string in environment variables
- Ensure network connectivity to database server
- Verify database credentials

#### 2. OpenAI API Unreachable
**Symptoms**:
```json
{
  "status": "unhealthy",
  "checks": {
    "openai": {
      "status": "error",
      "error": "Request failed with status code 401"
    }
  }
}
```

**Solutions**:
- Verify `OPENROUTER_API_KEY` environment variable
- Check API key validity
- Ensure network connectivity to OpenRouter
- Verify API endpoint availability

#### 3. Reddit API Issues
**Symptoms**:
```json
{
  "status": "unhealthy",
  "checks": {
    "reddit": {
      "status": "error",
      "error": "Request failed with status code 401"
    }
  }
}
```

**Solutions**:
- Verify Reddit API credentials
- Check Reddit API endpoint availability
- Ensure proper user agent configuration

## Best Practices

### 1. Regular Monitoring
- Set up automated monitoring to check health endpoint regularly
- Configure alerts for health check failures
- Monitor response times for performance degradation

### 2. Graceful Degradation
- Design the application to handle partial failures gracefully
- Provide informative error messages to users when dependencies fail
- Implement fallback mechanisms where possible

### 3. Logging
- Log health check results for debugging and analysis
- Include detailed error information in logs
- Monitor health check logs for patterns and trends

### 4. Security
- Don't expose sensitive information through health checks
- Implement rate limiting on health check endpoints if needed
- Consider internal-only access for detailed health information

## Future Enhancements

### 1. Detailed Metrics
- Add response times for each dependency
- Include system resource usage (CPU, memory, disk)
- Add queue depths and processing times

### 2. Custom Checks
- Add application-specific health checks
- Include cache connectivity checks
- Add file system health checks

### 3. Improved Error Reporting
- Add more detailed error categorization
- Include recovery suggestions in error responses
- Add historical health data

## Conclusion

The enhanced health check endpoint provides comprehensive monitoring of the ScanItKnowIt application's critical dependencies. It ensures that the application is fully operational before serving requests and provides valuable information for monitoring and troubleshooting.

The implementation follows industry best practices:
- Clear and consistent response format
- Comprehensive dependency checking
- Proper error handling and reporting
- Integration with monitoring systems
- Security considerations

With this enhanced health check, operators can have confidence in the application's operational status and quickly identify and resolve issues when they occur.