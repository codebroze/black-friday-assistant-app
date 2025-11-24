# 🛍️ Black Friday Deals Finder

An Electron desktop application for searching and browsing Black Friday deals with beautiful grid and table views.

## Features

- 🤖 **AI-Powered Web Search** - Uses Google Gemini AI with Google Search grounding to find real Black Friday deals from the web
- 🔍 **Smart Search Functionality** - Search for deals by product name, brand, or category with results from actual retailers
- 📂 **Category Filtering** - Filter deals by categories (Electronics, Home & Kitchen, Fashion, Toys & Games, Sports, Books)
- 🎨 **Multiple View Modes** - Toggle between grid and table views
- 📊 **Comprehensive Deal Information**:
  - Original and sale prices
  - Discount percentage
  - Total savings
  - Product ratings and reviews
  - Seller information
  - Shipping costs
  - Stock availability
- 🔄 **Sorting Options** - Sort by discount, price, rating, or savings
- 💅 **Modern UI** - Beautiful gradient design with smooth animations

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd black-friday-assistant-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up Gemini API:
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   - Add your API key to the `.env` file:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

   **Note:** The app will work without the API key by falling back to mock data, but the Gemini API with Google Search grounding provides real Black Friday deals from actual retailers on the web.

## Usage

Run the application:
```bash
npm start
```

For development with DevTools enabled:
```bash
npm run dev
```

## How to Use

1. **Browse All Deals**: Click the "Browse All Deals" button to see all available deals
2. **Search**: Enter keywords in the search bar and press Enter or click Search
3. **Filter by Category**: Use the category dropdown to filter deals
4. **Sort Results**: Use the sort dropdown to reorder deals
5. **Switch Views**: Toggle between grid and table views using the view buttons

## Project Structure

```
black-friday-assistant-app/
├── main.js           # Electron main process
├── preload.js        # Preload script for secure IPC
├── renderer.js       # Renderer process (UI logic)
├── index.html        # Main HTML structure
├── styles.css        # Application styling
├── package.json      # Project dependencies
└── README.md         # Documentation
```

## Technologies Used

- **Electron** - Cross-platform desktop application framework
- **HTML/CSS/JavaScript** - Frontend technologies
- **Node.js** - Backend runtime
- **Google Gemini AI** - AI-powered deal generation and search
- **dotenv** - Environment variable management

## Development

The app uses Electron's security best practices:
- Context isolation enabled
- Node integration disabled
- Preload script for secure IPC communication

### Gemini AI Integration with Web Search

The app uses Google's Gemini AI with **Google Search grounding** to find real Black Friday deals from the web. Key features:

- **Real-Time Web Search**: Gemini searches the web for actual Black Friday deals from major retailers
- **Grounded Results**: Uses Google Search to find current deals, prices, and discounts
- **AI Processing**: Gemini processes search results and returns structured JSON data
- **Category Intelligence**: Deals are filtered and tailored to specific product categories
- **Fallback Support**: Automatically falls back to mock data if the API key is not configured or if there's an error

#### How It Works:
1. User enters a search query (e.g., "laptop deals")
2. The app sends the query to Gemini 1.5 Pro with Google Search grounding enabled
3. Gemini searches the web for real Black Friday deals
4. AI processes the search results and extracts deal information
5. Returns structured JSON with real product names, prices, retailers, and discounts
6. UI displays the deals in grid or table format

### Environment Variables

The app uses `.env` file for configuration:
- `GEMINI_API_KEY`: Your Google Gemini API key (required for AI-powered search)
- The `.env` file is excluded from git via `.gitignore` to protect your API key
- Use `.env.example` as a template for required variables

### Web Search Integration

The app now uses **Gemini 1.5 Pro with Google Search grounding** to search the web for real deals:

- **Google Search Grounding**: Enabled in the model configuration with `tools: [{ googleSearch: {} }]`
- **Real Deal Discovery**: Searches actual retailer websites for current Black Friday deals
- **Structured Output**: AI processes web results and returns JSON formatted deal data
- **No Additional APIs Needed**: Google Search grounding is built into the Gemini API

For additional enhancements, you can still integrate direct retailer APIs:
1. Add API credentials to `.env` file
2. Combine Gemini's web search results with direct API data
3. Consider using APIs like Amazon Product Advertising API, eBay API, or other affiliate programs

## Future Enhancements

- Integration with real shopping retailer APIs (Amazon, eBay, etc.)
- Favorites/wishlist functionality
- Price history tracking and price drop alerts
- Email notifications for new deals matching criteria
- Export deals to CSV/PDF
- Dark mode support
- Deal comparison tool
- Browser extension for tracking prices across websites
- Mobile companion app

## License

MIT License - see LICENSE file for details
