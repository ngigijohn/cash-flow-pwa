/**
 * View Navigation System
 * Handles switching between Daily, Monthly, Categories, and Settings views
 */

let currentViewMonth = new Date();

/**
 * Switch to a specific view
 */
function switchView(viewName) {
  // Hide all views
  const views = document.querySelectorAll('.view-section');
  views.forEach(view => view.classList.remove('active'));
  
  // Remove active class from all buttons
  const buttons = document.querySelectorAll('.view-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  // Show selected view
  const selectedView = document.getElementById(`${viewName}-view`);
  if (selectedView) {
    selectedView.classList.add('active');
  }
  
  // Add active class to clicked button
  const activeBtn = document.querySelector(`[data-view="${viewName}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Load view-specific data
  if (viewName === 'monthly') {
    displayMonthlyView();
  } else if (viewName === 'categories') {
    displayCategoriesView();
  } else if (viewName === 'settings') {
    displaySettingsView();
  }
}

/**
 * Display Monthly Report View
 */
function displayMonthlyView() {
  const year = currentViewMonth.getFullYear();
  const month = currentViewMonth.getMonth();
  
  // Update month display
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  document.getElementById('current-month').textContent = 
    `${monthNames[month]} ${year}`;
  
  // Get all transactions for the month
  const data = JSON.parse(localStorage.getItem('cashFlowData'));
  const monthTransactions = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (data.transactions[dateKey]) {
      monthTransactions.push(...data.transactions[dateKey]);
    }
  }
  
  // Calculate monthly stats
  const totalSpent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
  const avgDaily = daysInMonth > 0 ? (totalSpent / daysInMonth) : 0;
  
  document.getElementById('monthly-total').textContent = `$${totalSpent.toFixed(2)}`;
  document.getElementById('monthly-average').textContent = `$${avgDaily.toFixed(2)}`;
  document.getElementById('monthly-count').textContent = monthTransactions.length;
  
  // Display daily breakdown
  displayMonthlyBreakdown(monthTransactions, daysInMonth);
}

/**
 * Display monthly breakdown by day
 */
function displayMonthlyBreakdown(transactions, daysInMonth) {
  const breakdown = {};
  
  transactions.forEach(t => {
    const day = new Date(t.createdAt).getDate();
    if (!breakdown[day]) breakdown[day] = 0;
    breakdown[day] += t.amount;
  });
  
  let html = '<div class="daily-breakdown">';
  for (let day = 1; day <= daysInMonth; day++) {
    const amount = breakdown[day] || 0;
    const color = amount === 0 ? '#e0e0e0' : '#fd9800';
    const height = amount === 0 ? '20px' : Math.min(amount * 2, 150) + 'px';
    
    html += `
      <div class="breakdown-bar" title="Day ${day}: $${amount.toFixed(2)}">
        <div class="bar" style="height: ${height}; background-color: ${color};"></div>
        <label>${day}</label>
      </div>
    `;
  }
  html += '</div>';
  
  document.getElementById('monthly-chart').innerHTML = html;
}

/**
 * Display Categories Overview
 */
function displayCategoriesView() {
  const data = JSON.parse(localStorage.getItem('cashFlowData'));
  
  // Calculate spending by category across all time
  const categorySpending = {
    'Food': 0,
    'Transport': 0,
    'Entertainment': 0,
    'Shopping': 0,
    'Utilities': 0,
    'Health': 0,
    'Other': 0
  };
  
  const categoryCount = { ...categorySpending };
  
  Object.values(data.transactions).forEach(dayTransactions => {
    dayTransactions.forEach(t => {
      if (categorySpending.hasOwnProperty(t.category)) {
        categorySpending[t.category] += t.amount;
        categoryCount[t.category]++;
      }
    });
  });
  
  const totalSpent = Object.values(categorySpending).reduce((a, b) => a + b, 0);
  
  const categoryColors = {
    'Food': '#FF6B6B',
    'Transport': '#4ECDC4',
    'Entertainment': '#95E1D3',
    'Shopping': '#FFE66D',
    'Utilities': '#A8E6CF',
    'Health': '#FFD3B6',
    'Other': '#CCCCCC'
  };
  
  let html = '';
  for (const [category, amount] of Object.entries(categorySpending)) {
    if (amount > 0 || categoryCount[category] > 0) {
      const percentage = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : 0;
      html += `
        <div class="category-item" style="border-left-color: ${categoryColors[category]}">
          <h4>${category}</h4>
          <div class="category-stats">
            <div class="category-stat">
              <label>Total Spent</label>
              <div class="category-stat-value">$${amount.toFixed(2)}</div>
            </div>
            <div class="category-stat">
              <label>Percentage</label>
              <div class="category-stat-value">${percentage}%</div>
            </div>
            <div class="category-stat">
              <label>Transactions</label>
              <div class="category-stat-value">${categoryCount[category]}</div>
            </div>
          </div>
        </div>
      `;
    }
  }
  
  document.getElementById('categories-breakdown').innerHTML = html;
}

/**
 * Display Settings View
 */
function displaySettingsView() {
  const data = JSON.parse(localStorage.getItem('cashFlowData'));
  
  // Calculate overall statistics
  let totalAllTime = 0;
  let totalTransactions = 0;
  let earliestDate = null;
  
  Object.entries(data.transactions).forEach(([dateKey, transactions]) => {
    transactions.forEach(t => {
      totalAllTime += t.amount;
      totalTransactions++;
    });
    if (transactions.length > 0 && !earliestDate) {
      earliestDate = new Date(dateKey);
    }
  });
  
  const daysSinceStart = earliestDate ? 
    Math.floor((new Date() - earliestDate) / (1000 * 60 * 60 * 24)) + 1 : 0;
  const avgPerDay = daysSinceStart > 0 ? (totalAllTime / daysSinceStart) : 0;
  
  let statsHtml = `
    <div class="overall-stat">
      <label>Total Spent</label>
      <div class="overall-stat-value">$${totalAllTime.toFixed(2)}</div>
    </div>
    <div class="overall-stat">
      <label>All Transactions</label>
      <div class="overall-stat-value">${totalTransactions}</div>
    </div>
    <div class="overall-stat">
      <label>Avg per Day</label>
      <div class="overall-stat-value">$${avgPerDay.toFixed(2)}</div>
    </div>
    <div class="overall-stat">
      <label>Days Tracked</label>
      <div class="overall-stat-value">${daysSinceStart}</div>
    </div>
    <div class="overall-stat">
      <label>Current Balance</label>
      <div class="overall-stat-value" style="color: ${data.totalBalance >= 0 ? '#0c5011' : '#d60404'}">
        $${data.totalBalance.toFixed(2)}
      </div>
    </div>
    <div class="overall-stat">
      <label>Daily Budget</label>
      <div class="overall-stat-value">
        ${data.budgets.dailyLimit > 0 ? '$' + data.budgets.dailyLimit.toFixed(2) : 'Not set'}
      </div>
    </div>
  `;
  
  document.getElementById('overall-stats').innerHTML = statsHtml;
}

/**
 * Initialize view navigation
 */
function initializeViews() {
  // View navigation buttons
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const viewName = e.target.dataset.view;
      switchView(viewName);
    });
  });
  
  // Monthly navigation
  if (document.getElementById('prev-month')) {
    document.getElementById('prev-month').addEventListener('click', () => {
      currentViewMonth.setMonth(currentViewMonth.getMonth() - 1);
      displayMonthlyView();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
      currentViewMonth.setMonth(currentViewMonth.getMonth() + 1);
      displayMonthlyView();
    });
  }
  
  // Settings buttons
  if (document.getElementById('open-budget-settings')) {
    document.getElementById('open-budget-settings').addEventListener('click', () => {
      document.getElementById('budgetModal').style.display = 'block';
    });
  }
  
  if (document.getElementById('export-data')) {
    document.getElementById('export-data').addEventListener('click', exportData);
  }
  
  if (document.getElementById('clear-data')) {
    document.getElementById('clear-data').addEventListener('click', clearAllData);
  }
}

/**
 * Export data as JSON
 */
function exportData() {
  const data = JSON.parse(localStorage.getItem('cashFlowData'));
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cash-flow-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
}

/**
 * Clear all data with confirmation
 */
function clearAllData() {
  if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
    localStorage.removeItem('cashFlowData');
    alert('All data has been cleared!');
    location.reload();
  }
}

// Initialize views when page loads
document.addEventListener('DOMContentLoaded', initializeViews);
