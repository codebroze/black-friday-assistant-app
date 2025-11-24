const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

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
  // In a production app, this would call a real API
  // For now, we'll return mock data
  return generateMockDeals(query, category);
});

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
