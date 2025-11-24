# Add Black Friday Deals Finder with AI-Powered Search

## Summary

This PR introduces a complete Electron desktop application for searching and browsing Black Friday deals, featuring AI-powered search using Google Gemini API, multiple view modes, and comprehensive deal information display.

## Key Features

### 🤖 AI-Powered Intelligence
- **Google Gemini Integration**: Uses Gemini Pro model to generate realistic, contextual Black Friday deals
- **Smart Search**: AI understands user queries and generates relevant product deals
- **Category-Aware**: Intelligently filters and generates deals based on selected categories
- **Graceful Fallback**: Automatically falls back to mock data if API is unavailable

### 🎨 User Interface
- **Dual View Modes**: Toggle between beautiful grid cards and detailed table view
- **Search & Filter**: Full-text search with category filtering
- **Smart Sorting**: Sort by discount percentage, price (high/low), rating, or total savings
- **Responsive Design**: Modern gradient UI with smooth animations and hover effects
- **Empty States**: Clear CTAs and loading indicators for better UX

### 📊 Deal Information
Each deal displays:
- Original and sale prices with prominent discount badges
- Total savings calculation
- Product ratings and review counts
- Seller information (Amazon, Best Buy, Walmart, Target, Newegg)
- Shipping costs (including FREE shipping)
- Stock availability with color-coded alerts
- Product images and compelling descriptions

### 🔐 Security & Best Practices
- **Environment Variables**: API keys stored securely in `.env` file (excluded from git)
- **Electron Security**: Context isolation, disabled node integration, secure IPC
- **Error Handling**: Robust fallbacks and error logging
- **API Key Protection**: `.env.example` template provided, actual keys never committed

## Technical Implementation

### Files Added
- `main.js` - Electron main process with Gemini API integration
- `preload.js` - Secure IPC bridge between main and renderer
- `renderer.js` - UI logic, search, sorting, and view management (300+ lines)
- `index.html` - Application structure with semantic HTML
- `styles.css` - Comprehensive styling for both views (600+ lines)
- `package.json` - Project configuration with dependencies
- `.env.example` - Environment variable template
- `.gitignore` - Excludes node_modules, .env, and build files

### Dependencies
- `electron` ^28.0.0 - Desktop application framework
- `@google/generative-ai` ^0.21.0 - Google Gemini API SDK
- `dotenv` ^16.4.5 - Environment variable management

### Architecture
```
┌─────────────────┐
│   Renderer      │ ← User Interface (HTML/CSS/JS)
│   (index.html)  │
└────────┬────────┘
         │ IPC
┌────────▼────────┐
│   Preload       │ ← Secure Bridge
│  (preload.js)   │
└────────┬────────┘
         │ Context Bridge
┌────────▼────────┐
│   Main Process  │ ← Gemini API Integration
│   (main.js)     │
└────────┬────────┘
         │
┌────────▼────────┐
│  Gemini API     │ ← AI-Powered Deal Generation
└─────────────────┘
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure API Key**
   ```bash
   cp .env.example .env
   # Add your Gemini API key to .env
   ```
   Get API key from: https://makersuite.google.com/app/apikey

3. **Run Application**
   ```bash
   npm start          # Production mode
   npm run dev        # Development mode with DevTools
   ```

## Testing Checklist

- [x] App launches successfully
- [x] Search functionality works with various queries
- [x] Category filtering produces correct results
- [x] Sorting options reorder deals correctly
- [x] Grid view displays cards properly
- [x] Table view shows all columns
- [x] View toggle switches between modes
- [x] AI integration generates realistic deals (when API key configured)
- [x] Fallback to mock data works (when API key not configured)
- [x] Error handling works gracefully
- [x] Environment variables load correctly
- [x] No API keys committed to git

## Screenshots

The app features:
- Modern purple gradient theme
- Responsive card-based grid layout
- Comprehensive table view with all deal details
- Smooth animations and hover effects
- Professional typography and spacing

## Future Enhancements

- Integration with real retailer APIs (Amazon, eBay)
- Favorites/wishlist functionality
- Price history tracking
- Email notifications for price drops
- Export to CSV/PDF
- Dark mode support
- Deal comparison tool

## Documentation

Comprehensive README.md included with:
- Feature overview
- Installation instructions
- API setup guide
- Usage instructions
- Project structure
- Development notes
- Security best practices

## Commits

- `ba0d87a` - Integrate Google Gemini AI for intelligent deal search
- `a3efe03` - Add Black Friday Deals Finder Electron app

---

**Ready for review and testing!** 🚀
