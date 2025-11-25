const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();
const Store = require('electron-store');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

const store = new Store();

let mainWindow;
let currentProvider = 'gemini';
let aiClients = {
  gemini: null,
  openai: null,
  anthropic: null,
  openrouter: null
};

// Initialize AI clients based on stored settings
function initializeAIClients() {
  // Load settings from store
  currentProvider = store.get('aiProvider', 'gemini');

  const geminiKey = store.get('apiKeys.gemini') || process.env.GEMINI_API_KEY;
  const openaiKey = store.get('apiKeys.openai') || process.env.OPENAI_API_KEY;
  const anthropicKey = store.get('apiKeys.anthropic') || process.env.ANTHROPIC_API_KEY;
  const openrouterKey = store.get('apiKeys.openrouter') || process.env.OPENROUTER_API_KEY;

  // Initialize Gemini
  try {
    if (geminiKey) {
      const genAI = new GoogleGenerativeAI(geminiKey);
      aiClients.gemini = genAI.getGenerativeModel({
        model: 'gemini-3-pro-preview',
        tools: [{
          googleSearch: {}
        }]
      });
      console.log('Gemini API initialized successfully');
    } else {
      console.warn('GEMINI_API_KEY not configured');
    }
  } catch (error) {
    console.error('Error initializing Gemini API:', error.message);
  }

  // Initialize OpenAI
  try {
    if (openaiKey) {
      aiClients.openai = new OpenAI({
        apiKey: openaiKey
      });
      console.log('OpenAI API initialized successfully');
    } else {
      console.warn('OPENAI_API_KEY not configured');
    }
  } catch (error) {
    console.error('Error initializing OpenAI API:', error.message);
  }

  // Initialize Anthropic
  try {
    if (anthropicKey) {
      aiClients.anthropic = new Anthropic({
        apiKey: anthropicKey
      });
      console.log('Anthropic API initialized successfully');
    } else {
      console.warn('ANTHROPIC_API_KEY not configured');
    }
  } catch (error) {
    console.error('Error initializing Anthropic API:', error.message);
  }

  // Initialize OpenRouter
  try {
    if (openrouterKey) {
      aiClients.openrouter = new OpenAI({
        apiKey: openrouterKey,
        baseURL: 'https://openrouter.ai/api/v1'
      });
      console.log('OpenRouter API initialized successfully');
    } else {
      console.warn('OPENROUTER_API_KEY not configured');
    }
  } catch (error) {
    console.error('Error initializing OpenRouter API:', error.message);
  }
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
  initializeAIClients();
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

// IPC handlers for settings
ipcMain.handle('get-settings', async () => {
  return {
    aiProvider: store.get('aiProvider', 'gemini'),
    apiKeys: {
      gemini: store.get('apiKeys.gemini', ''),
      openai: store.get('apiKeys.openai', ''),
      anthropic: store.get('apiKeys.anthropic', ''),
      openrouter: store.get('apiKeys.openrouter', '')
    }
  };
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    // Save settings to store
    if (settings.aiProvider) {
      store.set('aiProvider', settings.aiProvider);
      currentProvider = settings.aiProvider;
    }

    if (settings.apiKeys) {
      if (settings.apiKeys.gemini) {
        store.set('apiKeys.gemini', settings.apiKeys.gemini);
      }
      if (settings.apiKeys.openai) {
        store.set('apiKeys.openai', settings.apiKeys.openai);
      }
      if (settings.apiKeys.anthropic) {
        store.set('apiKeys.anthropic', settings.apiKeys.anthropic);
      }
      if (settings.apiKeys.openrouter) {
        store.set('apiKeys.openrouter', settings.apiKeys.openrouter);
      }
    }

    // Reinitialize AI clients with new settings
    initializeAIClients();

    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-api-key', async (event, provider) => {
  const apiKey = store.get(`apiKeys.${provider}`) || process.env[`${provider.toUpperCase()}_API_KEY`];
  return { hasKey: !!apiKey };
});

// IPC handlers for fetching deals
ipcMain.handle('search-deals', async (event, { query, category }) => {
  try {
    const client = aiClients[currentProvider];

    if (!client) {
      console.log(`${currentProvider} API not configured, using mock data`);
      return generateMockDeals(query, category);
    }

    // Use appropriate API based on current provider
    if (currentProvider === 'gemini') {
      return await searchDealsWithGemini(query, category, client);
    } else if (currentProvider === 'openai') {
      return await searchDealsWithOpenAI(query, category, client);
    } else if (currentProvider === 'anthropic') {
      return await searchDealsWithAnthropic(query, category, client);
    } else if (currentProvider === 'openrouter') {
      return await searchDealsWithOpenRouter(query, category, client);
    } else {
      return generateMockDeals(query, category);
    }
  } catch (error) {
    console.error('Error searching deals:', error);
    // Fall back to mock data on error
    return generateMockDeals(query, category);
  }
});

// Search for deals using Gemini API with Google Search
async function searchDealsWithGemini(query, category, model) {
  const searchQuery = query && query.trim() ? query : 'popular products';
  const categoryFilter = category && category !== 'all' ? category : 'various categories';

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
  "productUrl": "direct URL to the product page from search results",
  "imageUrl": "actual product image URL from search results (if available, otherwise use: https://via.placeholder.com/300x300/0066cc/ffffff?text=ProductName)"
}

Important:
- Use REAL deals from your web search results
- Extract actual prices, discounts, product names, and URLs from search results
- Include the actual product URL so users can navigate to the deal
- Include actual product image URLs when available from search results
- Include the actual retailer/seller from the deals you find
- ${category !== 'all' ? `Focus on "${category}" category deals` : 'Include a variety of categories'}
- If you find 10-20 real deals, that's perfect. Return what you find.
- Ensure savings = originalPrice - salePrice
- Return ONLY a valid JSON array, no other text or markdown`;

  try {
    console.log(`Searching web for: ${searchQuery} in ${categoryFilter} using Gemini`);

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

    return parseDealsResponse(text, categoryFilter);
  } catch (error) {
    console.error('Error searching deals with Gemini:', error);
    throw error;
  }
}

// Search for deals using OpenAI API
async function searchDealsWithOpenAI(query, category, client) {
  const searchQuery = query && query.trim() ? query : 'popular products';
  const categoryFilter = category && category !== 'all' ? category : 'various categories';

  const prompt = `Find current Black Friday deals for "${searchQuery}" in "${categoryFilter}".

Create a comprehensive JSON array of 10-20 Black Friday deals with the following structure:
{
  "id": "unique-id",
  "title": "Product name",
  "description": "Brief description of the deal (1-2 sentences)",
  "category": "Electronics|Home & Kitchen|Fashion|Toys & Games|Sports|Books",
  "originalPrice": "original price as string",
  "salePrice": "sale price as string",
  "savings": "amount saved as string",
  "discountPercent": discount percentage as number,
  "rating": "product rating as string (4.0-5.0)",
  "reviews": number of reviews (100-5000),
  "stock": estimated stock level as number (10-100),
  "seller": "retailer name (Amazon, Best Buy, Walmart, Target, etc.)",
  "shippingCost": "FREE or shipping cost",
  "productUrl": "#deal-url",
  "imageUrl": "https://via.placeholder.com/300x300/0066cc/ffffff?text=ProductName"
}

Important:
- ${category !== 'all' ? `Focus on "${category}" category deals` : 'Include a variety of categories'}
- Make the deals realistic with appropriate pricing
- Ensure savings = originalPrice - salePrice
- Return ONLY a valid JSON array, no other text or markdown`;

  try {
    console.log(`Searching for deals: ${searchQuery} in ${categoryFilter} using OpenAI`);

    const completion = await client.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that finds and formats Black Friday deals. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0].message.content;
    return parseDealsResponse(text, categoryFilter);
  } catch (error) {
    console.error('Error searching deals with OpenAI:', error);
    throw error;
  }
}

// Search for deals using Anthropic API
async function searchDealsWithAnthropic(query, category, client) {
  const searchQuery = query && query.trim() ? query : 'popular products';
  const categoryFilter = category && category !== 'all' ? category : 'various categories';

  const prompt = `Find current Black Friday deals for "${searchQuery}" in "${categoryFilter}".

Create a comprehensive JSON array of 10-20 Black Friday deals with the following structure:
{
  "id": "unique-id",
  "title": "Product name",
  "description": "Brief description of the deal (1-2 sentences)",
  "category": "Electronics|Home & Kitchen|Fashion|Toys & Games|Sports|Books",
  "originalPrice": "original price as string",
  "salePrice": "sale price as string",
  "savings": "amount saved as string",
  "discountPercent": discount percentage as number,
  "rating": "product rating as string (4.0-5.0)",
  "reviews": number of reviews (100-5000),
  "stock": estimated stock level as number (10-100),
  "seller": "retailer name (Amazon, Best Buy, Walmart, Target, etc.)",
  "shippingCost": "FREE or shipping cost",
  "productUrl": "#deal-url",
  "imageUrl": "https://via.placeholder.com/300x300/0066cc/ffffff?text=ProductName"
}

Important:
- ${category !== 'all' ? `Focus on "${category}" category deals` : 'Include a variety of categories'}
- Make the deals realistic with appropriate pricing
- Ensure savings = originalPrice - salePrice
- Return ONLY a valid JSON array, no other text or markdown`;

  try {
    console.log(`Searching for deals: ${searchQuery} in ${categoryFilter} using Anthropic`);

    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
    });

    const text = message.content[0].text;
    return parseDealsResponse(text, categoryFilter);
  } catch (error) {
    console.error('Error searching deals with Anthropic:', error);
    throw error;
  }
}

// Search for deals using OpenRouter API
async function searchDealsWithOpenRouter(query, category, client) {
  const searchQuery = query && query.trim() ? query : 'popular products';
  const categoryFilter = category && category !== 'all' ? category : 'various categories';

  const prompt = `Find current Black Friday deals for "${searchQuery}" in "${categoryFilter}".

Create a comprehensive JSON array of 10-20 Black Friday deals with the following structure:
{
  "id": "unique-id",
  "title": "Product name",
  "description": "Brief description of the deal (1-2 sentences)",
  "category": "Electronics|Home & Kitchen|Fashion|Toys & Games|Sports|Books",
  "originalPrice": "original price as string",
  "salePrice": "sale price as string",
  "savings": "amount saved as string",
  "discountPercent": discount percentage as number,
  "rating": "product rating as string (4.0-5.0)",
  "reviews": number of reviews (100-5000),
  "stock": estimated stock level as number (10-100),
  "seller": "retailer name (Amazon, Best Buy, Walmart, Target, etc.)",
  "shippingCost": "FREE or shipping cost",
  "productUrl": "#deal-url",
  "imageUrl": "https://via.placeholder.com/300x300/0066cc/ffffff?text=ProductName"
}

Important:
- ${category !== 'all' ? `Focus on "${category}" category deals` : 'Include a variety of categories'}
- Make the deals realistic with appropriate pricing
- Ensure savings = originalPrice - salePrice
- Return ONLY a valid JSON array, no other text or markdown`;

  try {
    console.log(`Searching for deals: ${searchQuery} in ${categoryFilter} using OpenRouter`);

    const completion = await client.chat.completions.create({
      model: "openai/gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that finds and formats Black Friday deals. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0].message.content;
    return parseDealsResponse(text, categoryFilter);
  } catch (error) {
    console.error('Error searching deals with OpenRouter:', error);
    throw error;
  }
}

// Parse deals response from AI
function parseDealsResponse(text, categoryFilter) {
  console.log('Received response from AI');

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

  console.log(`Found ${deals.length} deals`);

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
    productUrl: deal.productUrl || '#',
    imageUrl: deal.imageUrl || `https://via.placeholder.com/300x300/0066cc/ffffff?text=Product`
  }));
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
      productUrl: `#mock-deal-${i}`,
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
