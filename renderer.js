// State management
let currentDeals = [];
let currentView = 'grid';
let currentCategory = 'all';
let currentSort = 'discount';

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const categorySelect = document.getElementById('categorySelect');
const sortSelect = document.getElementById('sortSelect');
const gridViewBtn = document.getElementById('gridViewBtn');
const tableViewBtn = document.getElementById('tableViewBtn');
const gridView = document.getElementById('gridView');
const tableView = document.getElementById('tableView');
const emptyState = document.getElementById('emptyState');
const dealsGrid = document.getElementById('dealsGrid');
const dealsTableBody = document.getElementById('dealsTableBody');
const resultsCount = document.getElementById('resultsCount');
const loadingIndicator = document.getElementById('loadingIndicator');
const browseDealsBtn = document.getElementById('browseDealsBtn');

// Settings modal elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const cancelSettings = document.getElementById('cancelSettings');
const saveSettings = document.getElementById('saveSettings');
const aiProviderSelect = document.getElementById('aiProviderSelect');
const geminiApiKey = document.getElementById('geminiApiKey');
const openaiApiKey = document.getElementById('openaiApiKey');
const anthropicApiKey = document.getElementById('anthropicApiKey');
const openrouterApiKey = document.getElementById('openrouterApiKey');
const apiKeyWarning = document.getElementById('apiKeyWarning');

// Event listeners
searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleSearch();
  }
});

categorySelect.addEventListener('change', (e) => {
  currentCategory = e.target.value;
  handleSearch();
});

sortSelect.addEventListener('change', (e) => {
  currentSort = e.target.value;
  sortAndDisplayDeals();
});

gridViewBtn.addEventListener('click', () => switchView('grid'));
tableViewBtn.addEventListener('click', () => switchView('table'));

browseDealsBtn.addEventListener('click', () => {
  searchInput.value = '';
  currentCategory = 'all';
  categorySelect.value = 'all';
  handleSearch();
});

// Settings modal event listeners
settingsBtn.addEventListener('click', openSettingsModal);
closeSettings.addEventListener('click', closeSettingsModal);
cancelSettings.addEventListener('click', closeSettingsModal);
saveSettings.addEventListener('click', saveSettingsHandler);

// Close modal when clicking outside
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    closeSettingsModal();
  }
});

// Validate API key when provider changes
aiProviderSelect.addEventListener('change', validateApiKey);

// Settings modal functions
async function openSettingsModal() {
  try {
    // Load current settings
    const settings = await window.electronAPI.getSettings();

    // Populate the form
    aiProviderSelect.value = settings.aiProvider || 'gemini';
    geminiApiKey.value = settings.apiKeys.gemini || '';
    openaiApiKey.value = settings.apiKeys.openai || '';
    anthropicApiKey.value = settings.apiKeys.anthropic || '';
    openrouterApiKey.value = settings.apiKeys.openrouter || '';

    // Validate current provider
    await validateApiKey();

    // Show modal
    settingsModal.classList.add('active');
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

function closeSettingsModal() {
  settingsModal.classList.remove('active');
  apiKeyWarning.classList.add('hidden');
}

async function saveSettingsHandler() {
  const selectedProvider = aiProviderSelect.value;

  // Get the API keys from the form
  const settings = {
    aiProvider: selectedProvider,
    apiKeys: {}
  };

  // Only save non-empty API keys
  const geminiKey = geminiApiKey.value.trim();
  const openaiKey = openaiApiKey.value.trim();
  const anthropicKey = anthropicApiKey.value.trim();
  const openrouterKey = openrouterApiKey.value.trim();

  if (geminiKey) settings.apiKeys.gemini = geminiKey;
  if (openaiKey) settings.apiKeys.openai = openaiKey;
  if (anthropicKey) settings.apiKeys.anthropic = anthropicKey;
  if (openrouterKey) settings.apiKeys.openrouter = openrouterKey;

  // Validate that the selected provider has an API key
  const hasRequiredKey =
    (selectedProvider === 'gemini' && geminiKey) ||
    (selectedProvider === 'openai' && openaiKey) ||
    (selectedProvider === 'anthropic' && anthropicKey) ||
    (selectedProvider === 'openrouter' && openrouterKey);

  if (!hasRequiredKey) {
    apiKeyWarning.classList.remove('hidden');
    apiKeyWarning.textContent = `⚠️ Please enter an API key for ${getProviderName(selectedProvider)}.`;
    return;
  }

  try {
    // Save settings
    const result = await window.electronAPI.saveSettings(settings);

    if (result.success) {
      // Close modal
      closeSettingsModal();

      // Show success message
      resultsCount.textContent = `Settings saved! Using ${getProviderName(selectedProvider)}`;

      // Clear current deals to force a new search
      currentDeals = [];
      showEmptyState();
    } else {
      apiKeyWarning.classList.remove('hidden');
      apiKeyWarning.textContent = `⚠️ Error saving settings: ${result.error}`;
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    apiKeyWarning.classList.remove('hidden');
    apiKeyWarning.textContent = '⚠️ Error saving settings. Please try again.';
  }
}

async function validateApiKey() {
  const selectedProvider = aiProviderSelect.value;
  const providerInputs = {
    gemini: geminiApiKey,
    openai: openaiApiKey,
    anthropic: anthropicApiKey,
    openrouter: openrouterApiKey
  };

  const currentInput = providerInputs[selectedProvider];
  const hasKey = currentInput.value.trim() !== '';

  if (!hasKey) {
    // Check if API key exists in store
    const result = await window.electronAPI.checkApiKey(selectedProvider);
    if (!result.hasKey) {
      apiKeyWarning.classList.remove('hidden');
      apiKeyWarning.textContent = `⚠️ No API key configured for ${getProviderName(selectedProvider)}. Please enter one below.`;
    } else {
      apiKeyWarning.classList.add('hidden');
    }
  } else {
    apiKeyWarning.classList.add('hidden');
  }
}

function getProviderName(provider) {
  const names = {
    gemini: 'Google Gemini',
    openai: 'OpenAI',
    anthropic: 'Anthropic Claude',
    openrouter: 'OpenRouter'
  };
  return names[provider] || provider;
}

// Search functionality
async function handleSearch() {
  const query = searchInput.value.trim();

  // Show loading state
  loadingIndicator.classList.remove('hidden');
  resultsCount.textContent = 'Searching...';

  try {
    // Call the main process to get deals
    const deals = await window.electronAPI.searchDeals(query, currentCategory);
    currentDeals = deals;

    // Hide loading state
    loadingIndicator.classList.add('hidden');

    // Display results
    if (deals.length === 0) {
      showEmptyState();
      resultsCount.textContent = 'No deals found';
    } else {
      sortAndDisplayDeals();
    }
  } catch (error) {
    console.error('Error searching deals:', error);
    loadingIndicator.classList.add('hidden');
    resultsCount.textContent = 'Error searching for deals';
  }
}

// Sort and display deals
function sortAndDisplayDeals() {
  const sortedDeals = sortDeals([...currentDeals], currentSort);
  displayDeals(sortedDeals);
}

// Sort deals based on selected criteria
function sortDeals(deals, sortBy) {
  switch (sortBy) {
    case 'discount':
      return deals.sort((a, b) => b.discountPercent - a.discountPercent);
    case 'price-low':
      return deals.sort((a, b) => parseFloat(a.salePrice) - parseFloat(b.salePrice));
    case 'price-high':
      return deals.sort((a, b) => parseFloat(b.salePrice) - parseFloat(a.salePrice));
    case 'rating':
      return deals.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
    case 'savings':
      return deals.sort((a, b) => parseFloat(b.savings) - parseFloat(a.savings));
    default:
      return deals;
  }
}

// Display deals in current view
function displayDeals(deals) {
  // Hide empty state
  emptyState.classList.remove('active');

  // Update results count
  const categoryText = currentCategory === 'all' ? '' : ` in ${currentCategory}`;
  resultsCount.textContent = `Found ${deals.length} deal${deals.length !== 1 ? 's' : ''}${categoryText}`;

  // Display in appropriate view
  if (currentView === 'grid') {
    displayGridView(deals);
  } else {
    displayTableView(deals);
  }
}

// Display deals in grid view
function displayGridView(deals) {
  dealsGrid.innerHTML = '';

  deals.forEach(deal => {
    const card = createDealCard(deal);
    dealsGrid.appendChild(card);
  });
}

// Create a deal card for grid view
function createDealCard(deal) {
  const card = document.createElement('div');
  card.className = 'deal-card';

  const stockClass = deal.stock < 30 ? 'stock-low' : 'stock-ok';

  card.innerHTML = `
    <img src="${deal.imageUrl}" alt="${deal.title}" class="deal-image">
    <div class="deal-content">
      <div class="deal-header">
        <div class="deal-title">${deal.title}</div>
        <span class="discount-badge">${deal.discountPercent}% OFF</span>
      </div>
      <span class="deal-category">${deal.category}</span>
      <p class="deal-description">${deal.description}</p>
      <div class="deal-pricing">
        <span class="sale-price">$${deal.salePrice}</span>
        <span class="original-price">$${deal.originalPrice}</span>
      </div>
      <div class="savings">Save $${deal.savings}</div>
      <div class="deal-meta">
        <div class="meta-item">
          <span class="meta-label">Rating:</span>
          <span class="rating">⭐ ${deal.rating}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Reviews:</span>
          <span>${deal.reviews.toLocaleString()}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Seller:</span>
          <span>${deal.seller}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Shipping:</span>
          <span class="${deal.shippingCost === 'FREE' ? 'shipping-free' : ''}">${deal.shippingCost}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Stock:</span>
          <span class="${stockClass}">${deal.stock} left</span>
        </div>
      </div>
      <a href="${deal.productUrl}" target="_blank" rel="noopener noreferrer" class="view-deal-btn">
        View Deal →
      </a>
    </div>
  `;

  return card;
}

// Display deals in table view
function displayTableView(deals) {
  dealsTableBody.innerHTML = '';

  deals.forEach(deal => {
    const row = createTableRow(deal);
    dealsTableBody.appendChild(row);
  });
}

// Create a table row for table view
function createTableRow(deal) {
  const row = document.createElement('tr');

  const stockClass = deal.stock < 30 ? 'stock-low' : 'stock-ok';

  row.innerHTML = `
    <td>
      <div class="product-cell">
        <img src="${deal.imageUrl}" alt="${deal.title}" class="product-thumbnail">
        <div class="product-info">
          <div class="product-name">${deal.title}</div>
          <div class="product-rating">⭐ ${deal.rating} (${deal.reviews.toLocaleString()})</div>
        </div>
      </div>
    </td>
    <td><span class="category-tag">${deal.category}</span></td>
    <td class="price-cell">$${deal.originalPrice}</td>
    <td class="sale-price-cell">$${deal.salePrice}</td>
    <td class="savings-cell">$${deal.savings}</td>
    <td><span class="discount-cell">${deal.discountPercent}%</span></td>
    <td class="rating-cell">⭐ ${deal.rating}</td>
    <td>${deal.seller}</td>
    <td class="${deal.shippingCost === 'FREE' ? 'shipping-free' : ''}">${deal.shippingCost}</td>
    <td class="stock-cell ${stockClass}">${deal.stock}</td>
    <td>
      <a href="${deal.productUrl}" target="_blank" rel="noopener noreferrer" class="table-view-deal-btn">
        View Deal
      </a>
    </td>
  `;

  return row;
}

// Switch between grid and table views
function switchView(view) {
  currentView = view;

  if (view === 'grid') {
    gridView.classList.add('active');
    tableView.classList.remove('active');
    gridViewBtn.classList.add('active');
    tableViewBtn.classList.remove('active');

    if (currentDeals.length > 0) {
      displayGridView(currentDeals);
    }
  } else {
    tableView.classList.add('active');
    gridView.classList.remove('active');
    tableViewBtn.classList.add('active');
    gridViewBtn.classList.remove('active');

    if (currentDeals.length > 0) {
      displayTableView(currentDeals);
    }
  }
}

// Show empty state
function showEmptyState() {
  gridView.classList.remove('active');
  tableView.classList.remove('active');
  emptyState.classList.add('active');
}

// Initialize the app
function init() {
  // Show empty state initially
  showEmptyState();
}

// Run initialization
init();
