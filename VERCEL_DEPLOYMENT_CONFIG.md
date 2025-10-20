# Vercel Deployment Configuration

## Serverless Function Timeout Configuration

To prevent timeout issues with long-running AI processing operations, we've configured the Vercel serverless function timeout to the maximum allowed value.

### Configuration Details

```json
{
  "functions": {
    "server/api/index.ts": {
      "maxDuration": 60
    }
  }
}
```

### Why This Is Necessary

The ScanItKnowIt application performs multiple sequential external API calls during product analysis:

1. OCR processing of uploaded images
2. Product identification using OpenRouter/GPT
3. Ingredient analysis using OpenRouter/GPT
4. Nutrition analysis using OpenRouter/GPT
5. Reddit review search and analysis (optional)

These operations can take significant time, especially when:
- External APIs are slow to respond
- Retry mechanisms are triggered
- Circuit breakers are activated
- Multiple AI analyses are performed sequentially

### Vercel Timeout Limits

- **Hobby Plan**: Maximum 10 seconds (default)
- **Pro Plan**: Maximum 60 seconds
- **Enterprise Plan**: Up to 900 seconds

By setting `maxDuration` to 60 seconds, we ensure compatibility with both Hobby and Pro plans while providing sufficient time for complex analyses.

### Verification

The configuration has been:
- ✅ Added to vercel.json
- ✅ Validated as proper JSON
- ✅ Set to maximum recommended value (60 seconds)
- ✅ Targeting the correct serverless function entry point

This configuration will prevent "FUNCTION_INVOCATION_TIMEOUT" errors during deployment to Vercel.