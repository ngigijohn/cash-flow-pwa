// DOM Elements
let totalBalance = document.querySelector('.total-balance');
let dayDate = document.querySelector('.day-name');
let daysTotal = document.querySelector('.days-total');
let table = document.querySelector('tbody');

// State management
let currentViewDate = new Date();
currentViewDate.setHours(0, 0, 0, 0);
let currentEditingId = null;

// Initialize app
document.body.onload = function () {
  initializeStorage();
  displayData();
}

/**
 * Initialize localStorage with proper data structure
 * Supports multi-day tracking and prevents data corruption
 */
function initializeStorage() {
  if (localStorage.getItem('cashFlowData') === null) {
    console.log('Creating new storage...');
    const initialData = {
      "totalBalance": 0,
      "transactions": {},
      "budgets": {
        "dailyLimit": 0,
        "Food": 0,
        "Transport": 0,
        "Entertainment": 0,
        "Shopping": 0,
        "Utilities": 0,
        "Health": 0,
        "Other": 0
      },
      "createdAt": new Date().toISOString()
    };
    localStorage.setItem('cashFlowData', JSON.stringify(initialData));
  } else {
    // Migrate existing data if needed
    const data = readMemory();
    if (!data.budgets) {
      data.budgets = {
        "dailyLimit": 0,
        "Food": 0,
        "Transport": 0,
        "Entertainment": 0,
        "Shopping": 0,
        "Utilities": 0,
        "Health": 0,
        "Other": 0
      };
      updateMemory(data);
    }
  }
}

/**
 * Read all data from localStorage
 */
function readMemory() {
  return JSON.parse(localStorage.getItem('cashFlowData'));
}

/**
 * Save data to localStorage
 */
function updateMemory(data) {
  localStorage.setItem('cashFlowData', JSON.stringify(data));
}

/**
 * Get or create transactions array for a specific date
 */
function getDateKey(date) {
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

/**
 * Get transactions for a specific date
 */
function getTransactionsForDate(date) {
  const data = readMemory();
  const dateKey = getDateKey(date);
  if (!data.transactions[dateKey]) {
    data.transactions[dateKey] = [];
  }
  return data.transactions[dateKey];
}

/**
 * Add a new transaction
 */
function addTransaction(amount, description, category) {
  const data = readMemory();
  const dateKey = getDateKey(currentViewDate);
  
  if (!data.transactions[dateKey]) {
    data.transactions[dateKey] = [];
  }
  
  const transaction = {
    "id": Date.now().toString(),
    "amount": parseFloat(amount),
    "category": category || "Other",
    "time": new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    "description": description,
    "createdAt": new Date().toISOString()
  };
  
  data.transactions[dateKey].push(transaction);
  updateMemory(data);
  displayData();
}

/**
 * Delete a transaction
 */
function deleteTransaction(id) {
  const data = readMemory();
  const dateKey = getDateKey(currentViewDate);
  
  if (data.transactions[dateKey]) {
    data.transactions[dateKey] = data.transactions[dateKey].filter(t => t.id !== id);
    updateMemory(data);
    displayData();
  }
}

/**
 * Open edit modal for a transaction
 */
function openEditModal(id) {
  const data = readMemory();
  const dateKey = getDateKey(currentViewDate);
  const transaction = data.transactions[dateKey].find(t => t.id === id);
  
  if (transaction) {
    currentEditingId = id;
    document.getElementById('edit-amount').value = transaction.amount;
    document.getElementById('edit-category').value = transaction.category;
    document.getElementById('edit-description').value = transaction.description;
    document.getElementById('editModal').classList.remove('d-none');
  }
}

/**
 * Close edit modal
 */
function closeEditModal() {
  document.getElementById('editModal').classList.add('d-none');
  currentEditingId = null;
}

/**
 * Update a transaction
 */
function updateTransaction(id, amount, category, description) {
  const data = readMemory();
  const dateKey = getDateKey(currentViewDate);
  
  if (data.transactions[dateKey]) {
    const transaction = data.transactions[dateKey].find(t => t.id === id);
    if (transaction) {
      transaction.amount = parseFloat(amount);
      transaction.category = category;
      transaction.description = description;
      updateMemory(data);
      displayData();
      closeEditModal();
    }
  }
}

/**
 * Calculate spending by category
 */
function calculateSpendingByCategory(transactions) {
  const summary = {
    "Food": 0,
    "Transport": 0,
    "Entertainment": 0,
    "Shopping": 0,
    "Utilities": 0,
    "Health": 0,
    "Other": 0
  };
  
  transactions.forEach(t => {
    if (summary.hasOwnProperty(t.category)) {
      summary[t.category] += t.amount;
    }
  });
  
  return summary;
}

/**
 * Calculate day spending without modifying balance
 */
function calculateDaySpending(transactions) {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Get budget warnings
 */
function getBudgetWarnings(transactions, budgets) {
  const warnings = [];
  const daySpending = calculateDaySpending(transactions);
  
  // Check daily limit
  if (budgets.dailyLimit > 0 && daySpending > budgets.dailyLimit) {
    const over = (daySpending - budgets.dailyLimit).toFixed(2);
    warnings.push(`⚠️ Over daily budget by $${over}`);
  }
  
  // Check category budgets
  const categorySpending = calculateSpendingByCategory(transactions);
  for (const [category, amount] of Object.entries(categorySpending)) {
    const budget = budgets[category];
    if (budget > 0 && amount > budget) {
      const over = (amount - budget).toFixed(2);
      warnings.push(`⚠️ ${category} over budget by $${over}`);
    }
  }
  
  return warnings;
}

/**
 * Display category summary
 */
function displayCategorySummary(transactions) {
  const summary = calculateSpendingByCategory(transactions);
  const summaryDiv = document.getElementById('categorySummary');
  
  let html = '';
  for (const [category, amount] of Object.entries(summary)) {
    if (amount > 0) {
      const color = getCategoryColor(category);
      const percentage = calculateDaySpending(transactions) > 0 
        ? ((amount / calculateDaySpending(transactions)) * 100).toFixed(1)
        : 0;
      
      html += `
        <div class="summary-card" style="border-left: 4px solid ${color}">
          <div class="summary-category">${category}</div>
          <div class="summary-amount">$${amount.toFixed(2)}</div>
          <div class="summary-percentage">${percentage}% of total</div>
        </div>
      `;
    }
  }
  
  if (html === '') {
    html = '<p style="grid-column: 1/-1; text-align: center; color: #999;">No spending data for this day</p>';
  }
  
  summaryDiv.innerHTML = html;
}

/**
 * Get color for category
 */
function getCategoryColor(category) {
  const colors = {
    "Food": "#FF6B6B",
    "Transport": "#4ECDC4",
    "Entertainment": "#95E1D3",
    "Shopping": "#FFE66D",
    "Utilities": "#A8E6CF",
    "Health": "#FFD3B6",
    "Other": "#CCCCCC"
  };
  return colors[category] || colors["Other"];
}

/**
 * Display transactions for current view date
 */
function displayData() {
  const data = readMemory();
  const dateKey = getDateKey(currentViewDate);
  const transactions = data.transactions[dateKey] || [];
  
  const daySpending = calculateDaySpending(transactions);
  
  // Update headers
  let daysTotal = `Today's total: $${daySpending.toFixed(2)}`;
  
  // Add daily budget info if set
  if (data.budgets.dailyLimit > 0) {
    daysTotal += ` / $${data.budgets.dailyLimit}`;
  }
  
  totalBalance.innerHTML = `Total balance: $${data.totalBalance.toFixed(2)}`;
  document.querySelector('.days-total').innerHTML = daysTotal;
  dayDate.innerHTML = currentViewDate.toDateString();

  // Update table
  if (transactions.length < 1) {
    table.innerHTML = `<tr><td class="no-transaction" colspan="7">No transactions for this day</td></tr>`;
  } else {
    table.innerHTML = "";
    transactions.forEach((transaction, index) => {
      const categoryColor = getCategoryColor(transaction.category);
      table.innerHTML += `<tr id="${transaction.id}">
        <td>${index + 1}.</td>
        <td>$${transaction.amount.toFixed(2)}</td>
        <td><span class="category-badge" style="background-color: ${categoryColor}; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 0.85rem;">${transaction.category}</span></td>
        <td>${transaction.time}</td>
        <td>${transaction.description}</td>
        <td>
          <button class="edit-btn" data-id="${transaction.id}">✎</button>
          <button class="delete-btn" data-id="${transaction.id}">✕</button>
        </td>
      </tr>`;
    });
  }
  
  // Display category summary
  displayCategorySummary(transactions);
  
  // Display budget warnings
  displayBudgetWarnings(transactions);
}

/**
 * Handle form submission for new transactions
 */
document.addEventListener('submit', (e) => {
  e.preventDefault();
  const inputAmount = document.getElementById('input-amount');
  const inputDescription = document.getElementById('input-description');
  const inputCategory = document.getElementById('input-category');
  
  if (inputAmount.value > 0) {
    addTransaction(inputAmount.value, inputDescription.value, inputCategory.value);
    inputAmount.value = "";
    inputDescription.value = "";
    inputCategory.value = "Other";
  } else {
    alert('Amount must be greater than 0');
  }
});

/**
 * Handle transaction deletion
 */
table.addEventListener('click', e => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.dataset.id;
    if (confirm('Delete this transaction?')) {
      deleteTransaction(id);
    }
  } else if (e.target.classList.contains('edit-btn')) {
    const id = e.target.dataset.id;
    openEditModal(id);
  }
});

/**
 * Handle balance updates via click
 */
totalBalance.addEventListener('click', () => {
  updateBalanceDialog();
});

/**
 * Handle date navigation
 */
document.getElementById('prev-day-btn').addEventListener('click', () => {
  currentViewDate.setDate(currentViewDate.getDate() - 1);
  displayData();
});

document.getElementById('next-day-btn').addEventListener('click', () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Don't allow going beyond today
  const nextDate = new Date(currentViewDate);
  nextDate.setDate(nextDate.getDate() + 1);
  
  if (nextDate <= today) {
    currentViewDate = nextDate;
    displayData();
  } else {
    alert("You cannot view future dates");
  }
});

/**
 * Update total balance via dialog
 */
function updateBalanceDialog(message = "Add to your current balance") {
  const input = prompt(message, "0");
  
  if (input === null) return; // User cancelled
  
  const amount = parseFloat(input);
  
  if (isNaN(amount)) {
    alert("Please enter a valid number");
    return;
  }
  
  if (amount < 0 || amount > 999999) {
    alert("Please enter values between 0 and 999,999");
    return;
  }
  
  if (confirm(`Add $${amount.toFixed(2)} to your balance?`)) {
    const data = readMemory();
    data.totalBalance += amount;
    updateMemory(data);
    displayData();
  }
}

/**
 * Modal event handlers
 */
const modal = document.getElementById('editModal');
const closeBtn = document.querySelector('.close');
const editForm = document.getElementById('editForm');
const cancelBtn = document.querySelector('.btn-cancel');

// Close modal when X is clicked
closeBtn.addEventListener('click', closeEditModal);

// Close modal when Cancel is clicked
cancelBtn.addEventListener('click', closeEditModal);

// Close modal when clicking outside of it
window.addEventListener('click', (event) => {
  if (event.target === modal) {
    closeEditModal();
  }
});

// Handle edit form submission
editForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const amount = document.getElementById('edit-amount').value;
  const category = document.getElementById('edit-category').value;
  const description = document.getElementById('edit-description').value;
  
  if (amount > 0) {
    updateTransaction(currentEditingId, amount, category, description);
  } else {
    alert('Amount must be greater than 0');
  }
});

/**
 * Display budget warnings
 */
function displayBudgetWarnings(transactions) {
  const data = readMemory();
  const warnings = getBudgetWarnings(transactions, data.budgets);
  const daysTotal = document.querySelector('.days-total');
  
  if (warnings.length > 0) {
    const warningHtml = warnings.map(w => `<div style="color: #d60404; font-weight: 600; margin-top: 0.5rem;">${w}</div>`).join('');
    daysTotal.innerHTML += warningHtml;
  }
}

/**
 * Budget Settings Modal Handlers
 */
const budgetModal = document.getElementById('budgetModal');
const budgetBtn = document.getElementById('settingsBtn');
const budgetClose = document.querySelector('#budgetClose');
const budgetForm = document.getElementById('budgetForm');
const budgetCancelBtn = document.querySelector('.btn-cancel-budget');

// Open budget modal
budgetBtn.addEventListener('click', () => {
  const data = readMemory();
  document.getElementById('daily-budget').value = data.budgets.dailyLimit || '';
  document.getElementById('category-budget-food').value = data.budgets.Food || '';
  document.getElementById('category-budget-transport').value = data.budgets.Transport || '';
  document.getElementById('category-budget-entertainment').value = data.budgets.Entertainment || '';
  budgetModal.classList.remove('d-none');
});

// Close budget modal
budgetClose.addEventListener('click', () => {
  budgetModal.classList.add('d-none');
});

budgetCancelBtn.addEventListener('click', () => {
  budgetModal.classList.add('d-none');
});

// Close modal when clicking outside
window.addEventListener('click', (event) => {
  if (event.target === budgetModal) {
    budgetModal.classList.add('d-none');
  }
});

// Handle budget form submission
budgetForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = readMemory();
  
  data.budgets.dailyLimit = parseFloat(document.getElementById('daily-budget').value) || 0;
  data.budgets.Food = parseFloat(document.getElementById('category-budget-food').value) || 0;
  data.budgets.Transport = parseFloat(document.getElementById('category-budget-transport').value) || 0;
  data.budgets.Entertainment = parseFloat(document.getElementById('category-budget-entertainment').value) || 0;
  
  updateMemory(data);
  budgetModal.style.display = 'none';
  displayData();
  alert('Budget settings saved!');
});