/**
 * Nexus core logic
 * Handles UI updates, state management, and mock API interactions
 */

const state = {
    wallet: null,
    gasPrice: 24,
    watchlist: [
        { name: "Vitalik.eth", address: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045", type: "Influencer" },
        { name: "Giant Whale", address: "0x45245bc59219eeaaf6cd3f382e078a461ff9de7b", type: "Whale" },
        { name: "Smart Money", address: "0x123...456", type: "Alpha" }
    ],
    feed: [
        { type: 'whale', msg: 'Large move detected: 500 ETH to Coinbase', time: '2m ago', color: 'cyan' },
        { type: 'alpha', msg: 'Top 100 Wallets accumulating $LINK', time: '5m ago', color: 'magenta' },
        { type: 'gas', msg: 'Gas price dropped below 20 Gwei', time: '12m ago', color: 'success' }
    ]
};

// Initialize the app
function init() {
    renderWatchlist();
    renderFeed();
    updateGas();
    
    // Setup event listeners
    document.getElementById('search-btn').addEventListener('click', handleSearch);
    document.getElementById('wallet-search').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Animate gas price every few seconds
    setInterval(updateGas, 5000);
}

function handleSearch() {
    const address = document.getElementById('wallet-search').value.trim();
    if (!address) return;
    
    // Simulated loading state
    const container = document.getElementById('portfolio-container');
    container.innerHTML = '<div class="loading-spinner"></div>';
    
    setTimeout(() => {
        simulateWalletData(address);
    }, 1500);
}

function simulateWalletData(address) {
    // Random data for "WOW" effect
    const total = (Math.random() * 500000 + 10000).toFixed(2);
    const change = (Math.random() * 15 - 5).toFixed(1);
    
    document.getElementById('total-value').innerText = `$${Number(total).toLocaleString()}`;
    const changeEl = document.getElementById('total-change');
    changeEl.innerText = `${change > 0 ? '+' : ''}${change}%`;
    changeEl.className = `value-large ${change >= 0 ? 'positive' : 'negative'}`;

    renderTokens();
}

function renderWatchlist() {
    const list = document.getElementById('watchlist');
    list.innerHTML = state.watchlist.map(item => `
        <div class="watchlist-item glass-pill" style="margin-bottom: 10px; cursor: pointer;">
            <div style="font-weight: 600;">${item.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">${item.type}</div>
        </div>
    `).join('');
}

function renderFeed() {
    const container = document.getElementById('feed-container');
    container.innerHTML = state.feed.map(item => `
        <div class="feed-item" style="padding: 12px; border-bottom: 1px solid var(--glass-border);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span class="glow-${item.color}" style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase;">${item.type}</span>
                <span style="font-size: 0.7rem; color: var(--text-secondary);">${item.time}</span>
            </div>
            <div style="font-size: 0.85rem;">${item.msg}</div>
        </div>
    `).join('');
}

function renderTokens() {
    const container = document.getElementById('portfolio-container');
    const tokens = [
        { name: 'Ethereum', symbol: 'ETH', price: '$2,450', balance: '12.4', value: '$30,380', icon: '💎' },
        { name: 'Chainlink', symbol: 'LINK', price: '$18.2', balance: '450', value: '$8,190', icon: '🔗' },
        { name: 'Uniswap', symbol: 'UNI', price: '$12.4', balance: '200', value: '$2,480', icon: '🦄' }
    ];

    container.innerHTML = tokens.map(t => `
        <div class="token-row" style="display: flex; align-items: center; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 12px; margin-bottom: 8px;">
            <div style="font-size: 1.5rem; margin-right: 15px;">${t.icon}</div>
            <div style="flex-grow: 1;">
                <div style="font-weight: 600;">${t.name}</div>
                <div style="font-size: 0.75rem; color: var(--text-secondary);">${t.balance} ${t.symbol}</div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 600;">${t.value}</div>
                <div style="font-size: 0.75rem; color: var(--accent-success);">${t.price}</div>
            </div>
        </div>
    `).join('');
}

function updateGas() {
    const gasEl = document.getElementById('gas-value');
    const newVal = Math.floor(Math.random() * 10 + 20);
    gasEl.innerText = `${newVal} Gwei`;
}

// Start app
document.addEventListener('DOMContentLoaded', init);
