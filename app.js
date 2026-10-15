const STORAGE_KEY = 'kakeibo-entries-v1';

const form = document.getElementById('entry-form');
const dateInput = document.getElementById('date');
const typeInput = document.getElementById('type');
const categoryInput = document.getElementById('category');
const amountInput = document.getElementById('amount');
const memoInput = document.getElementById('memo');
const entriesBody = document.getElementById('entries-body');
const incomeTotalEl = document.getElementById('income-total');
const expenseTotalEl = document.getElementById('expense-total');
const balanceTotalEl = document.getElementById('balance-total');

const submitButton = form.querySelector('button[type="submit"]');

let editingId = null;

const today = new Date().toISOString().slice(0, 10);
dateInput.value = today;

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return getSeedEntries();
    }

    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) && parsed.length
      ? parsed
      : getSeedEntries();
  } catch (error) {
    console.error('データの読み込みに失敗しました:', error);
    return getSeedEntries();
  }
}

function getSeedEntries() {
  return [
    {
      id: 1,
      date: today,
      type: 'income',
      category: '給与',
      memo: '月給',
      amount: 280000,
    },
    {
      id: 2,
      date: today,
      type: 'expense',
      category: '食費',
      memo: 'スーパーで買い物',
      amount: 8500,
    },
  ];
}

let entries = loadEntries();

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value);
}

function render() {
  const incomeTotal = entries
    .filter((entry) => entry.type === 'income')
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  const expenseTotal = entries
    .filter((entry) => entry.type === 'expense')
    .reduce((sum, entry) => sum + Number(entry.amount), 0);

  const balanceTotal = incomeTotal - expenseTotal;

  incomeTotalEl.textContent = formatCurrency(incomeTotal);
  expenseTotalEl.textContent = formatCurrency(expenseTotal);
  balanceTotalEl.textContent = formatCurrency(balanceTotal);

  entriesBody.innerHTML = '';

  if (!entries.length) {
    entriesBody.innerHTML =
      '<tr><td colspan="6" class="empty">まだ記録がありません</td></tr>';
    return;
  }

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  sortedEntries.forEach((entry) => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${entry.date}</td>
      <td>
        <span class="type-badge ${entry.type === 'income' ? 'income' : 'expense'}">
          ${entry.type === 'income' ? '収入' : '支出'}
        </span>
      </td>
      <td>${entry.category}</td>
      <td>${entry.memo}</td>
      <td class="amount ${entry.type === 'income' ? 'income' : 'expense'}">
        ${entry.type === 'income' ? '+' : '-'}${formatCurrency(Number(entry.amount))}
      </td>
      <td>
        <button type="button" class="edit-btn" data-id="${entry.id}">修正</button>
        <button type="button" class="delete-btn" data-id="${entry.id}">削除</button>
      </td>
    `;

    entriesBody.appendChild(row);
  });
}

function startEditing(entry) {
  editingId = Number(entry.id);

  dateInput.value = entry.date;
  typeInput.value = entry.type;
  categoryInput.value = entry.category;
  amountInput.value = entry.amount;
  memoInput.value = entry.memo;

  submitButton.textContent = '修正を保存';

  form.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });

  amountInput.focus();
}

function cancelEditing() {
  editingId = null;

  form.reset();

  dateInput.value = today;
  typeInput.value = 'expense';
  categoryInput.value = '食費';

  submitButton.textContent = '登録';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const entryData = {
    date: dateInput.value,
    type: typeInput.value,
    category: categoryInput.value,
    memo: memoInput.value.trim(),
    amount: Number(amountInput.value),
  };

  if (
    !entryData.date ||
    !entryData.memo ||
    !entryData.amount ||
    entryData.amount <= 0
  ) {
    alert('日付・内容・金額を正しく入力してください。');
    return;
  }

  if (editingId !== null) {
    const targetIndex = entries.findIndex(
      (entry) => Number(entry.id) === editingId
    );

    if (targetIndex !== -1) {
      entries[targetIndex] = {
        ...entries[targetIndex],
        ...entryData,
      };
    }

    cancelEditing();
  } else {
    const newEntry = {
      id: Date.now() + Math.random(),
      ...entryData,
    };

    entries.unshift(newEntry);

    form.reset();
    dateInput.value = today;
    typeInput.value = 'expense';
    categoryInput.value = '食費';
  }

  saveEntries();
  render();
  amountInput.focus();
});

entriesBody.addEventListener('click', (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  if (target.matches('.edit-btn')) {
    const idToEdit = Number(target.dataset.id);

    const entryToEdit = entries.find(
      (entry) => Number(entry.id) === idToEdit
    );

    if (entryToEdit) {
      startEditing(entryToEdit);
    }

    return;
  }

  if (target.matches('.delete-btn')) {
    const idToDelete = Number(target.dataset.id);

    entries = entries.filter(
      (entry) => Number(entry.id) !== idToDelete
    );

    saveEntries();
    render();
  }
});

render();
