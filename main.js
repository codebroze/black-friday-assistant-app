const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

let mainWindow;
let genAI;
let model;

// Initialize Gemini AI
try {
  if (process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Use gemini-1.5-pro which supports Google Search grounding
    model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      tools: [{
        googleSearch: {}
      }]
    });
    console.log('Gemini API with Google Search initialized successfully');
  } else {
    console.warn('GEMINI_API_KEY not found in .env file. Using mock data.');
  }
} catch (error) {
  console.error('Error initializing Gemini API:', error.message);
  console.warn('Falling back to mock data.');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.argv.includes('--enable-logging')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for fetching deals
ipcMain.handle('search-deals', async (event, { query, category }) => {
  try {
    // Use Gemini API if available, otherwise fall back to mock data
    if (model) {
      return await searchDealsWithGemini(query, category);
    } else {
      console.log('Using mock data (Gemini API not configured)');
      return generateMockDeals(query, category);
    }
  } catch (error) {
    console.error('Error searching deals:', error);
    // Fall back to mock data on error
    return generateMockDeals(query, category);
  }
});

// Search for deals using Gemini API with Google Search
async function searchDealsWithGemini(query, category) {
  const searchQuery = query && query.trim() ? query : 'popular products';
  const categoryFilter = category && category !== 'all' ? category : 'various categories';

  // Construct a web search query for real Black Friday deals
  const prompt = `Search the web for current Black Friday deals for "${searchQuery}" in "${categoryFilter}".

Find real deals from major retailers like Amazon, Best Buy, Walmart, Target, Newegg, etc.

Based on your web search results, create a comprehensive JSON array of deals with the following structure:
{
  "id": "unique-id",
  "title": "Exact product name from the deal",
  "description": "Brief description of the deal (1-2 sentences)",
  "category": "Electronics|Home & Kitchen|Fashion|Toys & Games|Sports|Books",
  "originalPrice": "original price as string",
  "salePrice": "sale price as string",
  "savings": "amount saved as string",
  "discountPercent": discount percentage as number,
  "rating": "product rating as string (if available, otherwise estimate 4.0-4.5)",
  "reviews": number of reviews (if available, otherwise estimate 100-1000),
  "stock": estimated stock level as number (50-100),
  "seller": "retailer name from search results",
  "shippingCost": "FREE or shipping cost",
  "imageUrl": "use placeholder: https://via.placeholder.com/300x300/0066cc/ffffff?text=ProductName"
}

Important:
- Use REAL deals from your web search results
- Extract actual prices, discounts, and product names from search results
- Include the actual retailer/seller from the deals you find
- ${category !== 'all' ? `Focus on "${category}" category deals` : 'Include a variety of categories'}
- If you find 10-20 real deals, that's perfect. Return what you find.
- Ensure savings = originalPrice - salePrice
- Return ONLY a valid JSON array, no other text or markdown`;

  try {
    console.log(`Searching web for: ${searchQuery} in ${categoryFilter}`);

    // Generate content with Google Search grounding enabled
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
      }
    });

    const response = await result.response;
    const text = response.text();

    console.log('Received response from Gemini with web search');

    // Extract JSON from the response (handle markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Try to find JSON array in the response
    const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    const deals = JSON.parse(jsonText);

    console.log(`Found ${deals.length} deals from web search`);

    // Validate and normalize the deals data
    return deals.map((deal, index) => ({
      id: deal.id || `deal-${Date.now()}-${index}`,
      title: deal.title || 'Product',
      description: deal.description || 'Great Black Friday deal!',
      category: deal.category || categoryFilter,
      originalPrice: String(deal.originalPrice || '99.99').replace('$', ''),
      salePrice: String(deal.salePrice || '49.99').replace('$', ''),
      savings: String(deal.savings || '50.00').replace('$', ''),
      discountPercent: Number(deal.discountPercent) || 50,
      rating: String(deal.rating || '4.5'),
      reviews: Number(deal.reviews) || 500,
      stock: Number(deal.stock) || 50,
      seller: deal.seller || 'Amazon',
      shippingCost: deal.shippingCost || 'FREE',
      imageUrl: deal.imageUrl || `https://via.placeholder.com/300x300/0066cc/ffffff?text=Product`
    }));
  } catch (error) {
    console.error('Error searching deals with Gemini:', error);
    console.error('Error details:', error.message);
    throw error;
  }
}

function generateMockDeals(query, category) {
  const categories = ['Electronics', 'Home & Kitchen', 'Fashion', 'Toys & Games', 'Sports', 'Books'];
  const brands = ['Samsung', 'Sony', 'Apple', 'LG', 'Dell', 'HP', 'Nike', 'Adidas', 'Cuisinart', 'KitchenAid'];
  const deals = [];

  const numDeals = Math.floor(Math.random() * 20) + 15;

  for (let i = 0; i < numDeals; i++) {
    const originalPrice = Math.floor(Math.random() * 900) + 100;
    const discountPercent = Math.floor(Math.random() * 60) + 20;
    const salePrice = originalPrice - (originalPrice * discountPercent / 100);
    const savings = originalPrice - salePrice;

    const dealCategory = category && category !== 'all' ? category : categories[Math.floor(Math.random() * categories.length)];
    const brand = brands[Math.floor(Math.random() * brands.length)];

    const productNames = {
      'Electronics': ['4K Smart TV', 'Wireless Headphones', 'Laptop', 'Tablet', 'Smart Watch', 'Camera', 'Gaming Console'],
      'Home & Kitchen': ['Coffee Maker', 'Blender', 'Air Fryer', 'Vacuum Cleaner', 'Stand Mixer', 'Toaster Oven'],
      'Fashion': ['Winter Jacket', 'Running Shoes', 'Handbag', 'Sunglasses', 'Watch', 'Sneakers'],
      'Toys & Games': ['Board Game', 'Action Figure', 'LEGO Set', 'Puzzle', 'Doll House', 'Remote Control Car'],
      'Sports': ['Yoga Mat', 'Dumbbells', 'Treadmill', 'Bike', 'Fitness Tracker', 'Tennis Racket'],
      'Books': ['Bestseller Novel', 'Cookbook', 'Biography', 'Self-Help Book', 'Science Fiction']
    };

    const productList = productNames[dealCategory] || productNames['Electronics'];
    const productName = productList[Math.floor(Math.random() * productList.length)];

    const deal = {
      id: `deal-${Date.now()}-${i}`,
      title: `${brand} ${productName}`,
      description: `Amazing Black Friday deal on ${brand} ${productName}. Limited time offer!`,
      category: dealCategory,
      originalPrice: originalPrice.toFixed(2),
      salePrice: salePrice.toFixed(2),
      savings: savings.toFixed(2),
      discountPercent: discountPercent,
      rating: (Math.random() * 2 + 3).toFixed(1),
      reviews: Math.floor(Math.random() * 5000) + 100,
      stock: Math.floor(Math.random() * 100) + 10,
      seller: ['Amazon', 'Best Buy', 'Walmart', 'Target', 'Newegg'][Math.floor(Math.random() * 5)],
      shippingCost: Math.random() > 0.6 ? 'FREE' : '$' + (Math.random() * 20 + 5).toFixed(2),
      imageUrl: `https://via.placeholder.com/300x300/0066cc/ffffff?text=${encodeURIComponent(productName)}`
    };

    deals.push(deal);
  }

  // Filter by search query if provided
  if (query && query.trim()) {
    const lowerQuery = query.toLowerCase();
    return deals.filter(deal =>
      deal.title.toLowerCase().includes(lowerQuery) ||
      deal.description.toLowerCase().includes(lowerQuery) ||
      deal.category.toLowerCase().includes(lowerQuery)
    );
  }

  return deals;
}
