# Integrate Gemini API with Google Search Grounding for Real Deal Discovery

## Summary

This PR integrates the Gemini API with Google Search grounding to enable real-time web searching for Black Friday deals. The app now searches the web for actual deals from major retailers instead of generating synthetic data.

## Changes

### Core Integration
- **Upgraded to Gemini 3 Pro Preview** - Switched from `gemini-pro` to `gemini-3-pro-preview` model for enhanced capabilities
- **Enabled Google Search Grounding** - Added `tools: [{ googleSearch: {} }]` configuration to allow web searching
- **Real-Time Deal Discovery** - Modified `searchDealsWithGemini()` to search the web for actual Black Friday deals from retailers

### Implementation Details
- Updated model initialization in `main.js` to use Gemini 3 Pro Preview with Google Search tools
- Rewrote search prompts to instruct the AI to search the web for real deals
- Enhanced JSON parsing to handle various response formats from the AI
- Added price normalization by removing dollar signs for consistent formatting
- Improved error logging and debugging capabilities
- Added comprehensive console logging for troubleshooting

### Documentation
- Updated `README.md` with detailed explanation of Google Search grounding
- Added "How It Works" section documenting the 6-step process
- Documented the web search integration architecture
- Updated feature descriptions to reflect real web search capabilities

## Technical Highlights

**Model Configuration:**
```javascript
model = genAI.getGenerativeModel({
  model: 'gemini-3-pro-preview',
  tools: [{
    googleSearch: {}
  }]
});
```

**Search Flow:**
1. User enters search query
2. App sends query to Gemini 3 Pro Preview with Google Search grounding
3. AI searches the web for real Black Friday deals
4. AI processes search results and extracts deal information
5. Returns structured JSON with real product names, prices, retailers
6. UI displays deals in grid or table format

## Benefits

✅ **Real Deal Data** - Searches actual retailer websites for current deals
✅ **Up-to-Date Pricing** - Returns real-time pricing and discount information
✅ **No Additional APIs** - Google Search grounding is built into Gemini API
✅ **Structured Output** - AI processes web results into clean JSON format
✅ **Fallback Support** - Gracefully falls back to mock data if API unavailable

## Testing

The implementation has been validated for:
- Correct model initialization with Google Search tools
- Proper prompt construction for web searching
- JSON parsing and error handling
- Price normalization and data validation
- Console logging for debugging

## Files Changed

- `main.js` - Core implementation of Gemini API with Google Search grounding
- `README.md` - Documentation updates for web search integration

## Commits

- `bb739a3` - Enable Gemini API web search with Google Search grounding
- `5a5f9fb` - Update to Gemini 3 Pro Preview model

## Migration Notes

Users will need a valid `GEMINI_API_KEY` in their `.env` file to use the web search functionality. The app will automatically fall back to mock data if the API key is not configured.

---

**Related Issues:** N/A
**Type:** Feature Enhancement
**Breaking Changes:** None
