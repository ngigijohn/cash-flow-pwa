let date = new Date();
let totalBalance = document.querySelector('.total-balance');
let dayDate = document.querySelector('.day-name');
let daysTotal = document.querySelector('.days-total');
let table = document.querySelector('tbody');

let existingMemory = false;


document.body.onload = function () {
  createMemory();
  if (existingMemory) {
    displayData();
  }
}

function createMemory() {
  if (localStorage.getItem('memoryString') !== null) {
    existingMemory = true;
  } else {
    //create
    console.log('data not found: creating new memory....');
    localStorage.setItem('memoryString', JSON.stringify({
      "totalBalance": "0",
      "weeklySpending": {
        "weekId": 1,
        "day": [{
          "dayDate": date.toDateString(),
          "moneySpent": []
        }]
      }
    }));
  }

}
createMemory();

function updateMemory(newTransaction) {
  if (existingMemory == true) {
    localStorage.setItem('memoryString', JSON.stringify(newTransaction).toString());
  }
}

function readMemory() {
  transaction = JSON.parse(localStorage.getItem('memoryString'));
  return transaction;
}

function deleteTransaction(id) {
  let transaction = readMemory();
  console.log('deleting', id);
  transaction.weeklySpending.day[transaction.weeklySpending.day.length - 1].moneySpent = transaction.weeklySpending.day[transaction.weeklySpending.day.length - 1].moneySpent.filter(item => item.id !== id);
  updateMemory(transaction);
  displayData();
}

function getInput() {
  let transaction = readMemory();
  let inputAmount = document.getElementById('input-amount');
  let inputDescription = document.getElementById('input-description');
  if (inputAmount.value > 0) {
    transaction.weeklySpending.day[transaction.weeklySpending.day.length - 1].moneySpent.push({
      "id": `${transaction.weeklySpending.day[transaction.weeklySpending.day.length - 1].moneySpent.length}`,
      "amount": `${inputAmount.value}`,
      "time": `${date.getHours()}:${date.getMinutes()}`,
      "description": `${inputDescription.value}`
    });
    inputAmount.value = "";
    inputDescription.value = "";
    updateMemory(transaction);
    displayData();
  } else {
    alert('price cannot be an empty value')
  }
}

function displayData() {
  let transaction = readMemory()
  thisDay = transaction.weeklySpending.day[transaction.weeklySpending.day.length - 1];
  let daySpendings = 0;
  for (let i = 0; i < thisDay.moneySpent.length; i++) {
    daySpendings += parseInt(thisDay.moneySpent[i].amount);
  }
  transaction.totalBalance -= daySpendings;
  totalBalance.innerHTML = `Total balance: ${transaction.totalBalance}`;
  daysTotal.innerHTML = `Todays total: ${daySpendings}`;
  dayDate.innerHTML = `${thisDay.dayDate}`;

  if (thisDay.moneySpent.length < 1) {
    table.innerHTML = `<tr><td class = "no-transaction" colspan="5"> You dont have any transactions! </td></tr>`;
  } else {
    table.innerHTML = "";
    thisDay.moneySpent.forEach(element => {
      table.innerHTML += `<tr id="${element.id}">
      <td>${element.id}.</td>
      <td>${element.amount}</td>
      <td>${element.time}</td>
      <td>${element.description}</td>
      <td data-id="${element.id}" class="delete"><button id="${element.id}">x</button></td>
      </tr>`;
    });
  }
}

document.addEventListener('submit', (e) => {
  e.preventDefault();
  getInput();

});

table.addEventListener('click', e => {
  if (e.target.id !== "") {
    deleteTransaction(e.target.id);
  }
})

function getTotalBalance() {
  let transaction = readMemory();
  transaction.totalBalance += parseInt(prompt("Add to current balance"));
  updateMemory(transaction);
  displayData();
}
totalBalance.addEventListener('click', () => {
  getTotalBalance();
})