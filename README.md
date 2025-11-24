# 🛍️ Black Friday Deals Finder

An Electron desktop application for searching and browsing Black Friday deals with beautiful grid and table views.

## Features

- 🔍 **Search Functionality** - Search for deals by product name, brand, or category
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

## Development

The app uses Electron's security best practices:
- Context isolation enabled
- Node integration disabled
- Preload script for secure IPC communication

### Mock Data

Currently, the app generates mock deal data. In a production environment, you would:
1. Replace the `generateMockDeals()` function in `main.js`
2. Integrate with a real deals API (e.g., Amazon Product API, eBay API)
3. Add authentication if required by the API

## Future Enhancements

- Integration with real shopping APIs
- Favorites/wishlist functionality
- Price history tracking
- Email notifications for price drops
- Export deals to CSV/PDF
- Dark mode support

## License

MIT License - see LICENSE file for details
