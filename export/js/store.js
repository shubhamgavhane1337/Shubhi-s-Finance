/**
 * store.js - Data Storage & State Management
 * Handles reading/writing to localStorage and maintaining app state
 */

const STORAGE_KEY = 'shubhis_finance_data';

const defaultState = {
    accounts: [], // { id, name, balance }
    subAccounts: [], // { id, accountId, name, balance }
    departments: [], // { id, subAccountId, name, balance }
    transactions: [], // { id, date, amount, type, accountId, subAccountId, departmentId, category, description }
    budgets: [], // { id, weekStarting, amount, accountId, subAccountId, departmentId }
    investments: [], // { id, date, name, amount, currentValuation }
    moneyLent: [], // { id, date, name, amount, description, status: 'lent'|'repaid' }
    accountInfo: [] // { id, name, amount, description }
};

class Store {
    constructor() {
        this.data = { ...defaultState }; // Initial state
        this.listeners = [];
        this.initPromise = this.loadData(); // Will asynchronously load data
    }

    async loadData() {
        // Try to fetch from the local API first
        try {
            const response = await fetch('http://localhost:3000/api/data');
            if (response.ok) {
                const apiData = await response.json();
                if (apiData) {
                    console.log("Loaded data from local API server.");
                    this.data = apiData;
                    this.recalculateBalances(); // Force a fresh calculation based on the new sync logic
                    this.notifyListeners();
                    return apiData; // Return the fetched data
                }
            }
        } catch (err) {
            console.log("Local API not running or unreachable, falling back to localStorage.");
        }

        // Fallback to localStorage
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                this.data = JSON.parse(stored);
                this.recalculateBalances(); // Force a fresh calculation
                this.notifyListeners();
                return this.data;
            } catch (e) {
                console.error("Failed to parse storage, using defaults", e);
                this.data = { ...defaultState };
                this.notifyListeners();
                return this.data;
            }
        }
        
        this.data = { ...defaultState };
        this.notifyListeners();
        return this.data;
    }

    saveData() {
        // Always save to localStorage as a primary backup
        const dataStr = JSON.stringify(this.data);
        localStorage.setItem(STORAGE_KEY, dataStr);
        this.notifyListeners();

        // Attempt to sync to the local API
        fetch('http://localhost:3000/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: dataStr
        }).catch(err => console.log("Local API not running, saved to localStorage only."));
    }

    // Custom Pub/Sub for UI updates
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notifyListeners() {
        this.listeners.forEach(listener => listener(this.data));
    }

    // --- Helpers ---
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // --- Accounts ---
    addAccount(name, initialBalance = 0) {
        const newAccount = { id: this.generateId(), name, initialBalance, balance: initialBalance };
        this.data.accounts.push(newAccount);
        this.saveData();
        return newAccount;
    }

    addSubAccount(accountId, name, initialBalance = 0) {
        const newSub = { id: this.generateId(), accountId, name, initialBalance, balance: initialBalance };
        this.data.subAccounts.push(newSub);
        this.saveData();
        return newSub;
    }

    addDepartment(subAccountId, name, initialBalance = 0) {
        const newDept = { id: this.generateId(), subAccountId, name, initialBalance, balance: initialBalance };
        this.data.departments.push(newDept);
        this.saveData();
        return newDept;
    }

    editAccount(id, name, currentBalance) {
        const acc = this.data.accounts.find(a => a.id === id);
        if (acc) {
            if (name !== undefined) acc.name = name;
            if (currentBalance !== undefined) {
                const bal = parseFloat(currentBalance);
                if (!isNaN(bal)) {
                    // Adjust initial balance precisely so that recalcs equal the requested current balance
                    const difference = bal - acc.balance;
                    acc.initialBalance = (acc.initialBalance || 0) + difference;
                }
            }
            this.recalculateBalances();
            this.saveData();
        }
    }

    deleteAccount(id) {
        this.data.accounts = this.data.accounts.filter(a => a.id !== id);
        this.data.subAccounts = this.data.subAccounts.filter(s => s.accountId !== id);
        const subIds = this.data.subAccounts.map(s => s.id);
        this.data.departments = this.data.departments.filter(d => subIds.includes(d.subAccountId));
        this.saveData();
    }

    editSubAccount(id, name, currentBalance) {
        const sub = this.data.subAccounts.find(s => s.id === id);
        if (sub) {
            if (name !== undefined) sub.name = name;
            if (currentBalance !== undefined) {
                const bal = parseFloat(currentBalance);
                if (!isNaN(bal)) {
                    // Adjust initial balance precisely so that recalcs equal the requested current balance
                    const difference = bal - sub.balance;
                    sub.initialBalance = (sub.initialBalance || 0) + difference;
                }
            }
            this.recalculateBalances();
            this.saveData();
        }
    }

    deleteSubAccount(id) {
        this.data.subAccounts = this.data.subAccounts.filter(s => s.id !== id);
        this.data.departments = this.data.departments.filter(d => d.subAccountId !== id);
        this.saveData();
    }

    moveSubAccount(id, direction) {
        const index = this.data.subAccounts.findIndex(s => s.id === id);
        if (index === -1) return;

        // Group by account to only swap within the same parent account
        const accId = this.data.subAccounts[index].accountId;
        
        // Find adjacent item within same account
        let targetIndex = -1;
        if (direction === -1) { // Move Up/Left
            for (let i = index - 1; i >= 0; i--) {
                if (this.data.subAccounts[i].accountId === accId) {
                    targetIndex = i;
                    break;
                }
            }
        } else { // Move Down/Right
            for (let i = index + 1; i < this.data.subAccounts.length; i++) {
                if (this.data.subAccounts[i].accountId === accId) {
                    targetIndex = i;
                    break;
                }
            }
        }

        if (targetIndex !== -1) {
            // Swap
            const temp = this.data.subAccounts[index];
            this.data.subAccounts[index] = this.data.subAccounts[targetIndex];
            this.data.subAccounts[targetIndex] = temp;
            this.saveData();
        }
    }

    editDepartment(id, name, currentBalance) {
        const dept = this.data.departments.find(d => d.id === id);
        if (dept) {
            if (name !== undefined) dept.name = name;
            if (currentBalance !== undefined) {
                const bal = parseFloat(currentBalance);
                if (!isNaN(bal)) {
                    // Adjust initial balance precisely so that recalcs equal the requested current balance
                    const difference = bal - dept.balance;
                    dept.initialBalance = (dept.initialBalance || 0) + difference;
                }
            }
            this.recalculateBalances();
            this.saveData();
        }
    }

    deleteDepartment(id) {
        this.data.departments = this.data.departments.filter(d => d.id !== id);
        this.saveData();
    }

    // Getters for hierarchy
    getAccounts() { return this.data.accounts; }
    getSubAccounts(accountId) { return this.data.subAccounts.filter(s => s.accountId === accountId); }
    getDepartments(subAccountId) { return this.data.departments.filter(d => d.subAccountId === subAccountId); }

    // --- Transactions ---
    addTransaction(transaction) {
        const newTx = {
            id: this.generateId(),
            ...transaction
        };
        this.data.transactions.push(newTx);

        // Update Balances based on hierarchy
        this.recalculateBalances();

        this.saveData();
        return newTx;
    }

    deleteTransaction(id) {
        this.data.transactions = this.data.transactions.filter(t => t.id !== id);
        this.recalculateBalances();
        this.saveData();
    }

    editTransaction(id, updates) {
        const txIndex = this.data.transactions.findIndex(t => t.id === id);
        if (txIndex !== -1) {
            this.data.transactions[txIndex] = { ...this.data.transactions[txIndex], ...updates };
            this.recalculateBalances();
            this.saveData();
            return this.data.transactions[txIndex];
        }
        return null;
    }

    // Important: Recalculate all balances from scratch based on transactions
    recalculateBalances() {
        // Reset balances for departments and subaccounts
        this.data.departments.forEach(d => d.balance = d.initialBalance || 0);
        this.data.subAccounts.forEach(sa => sa.balance = sa.initialBalance || 0);

        this.data.transactions.forEach(tx => {
            const amount = tx.type === 'expense' ? -Math.abs(tx.amount) : Math.abs(tx.amount);

            // Department level
            if (tx.departmentId) {
                const dept = this.data.departments.find(d => d.id === tx.departmentId);
                if (dept) dept.balance += amount;
            }

            // SubAccount level (only apply direct transactions here for now)
            if (tx.subAccountId && !tx.departmentId) {
                const sub = this.data.subAccounts.find(s => s.id === tx.subAccountId);
                if (sub) sub.balance += amount;
            }
        });

        // A Sub-Account's balance is strictly the sum of all its Departments
        this.data.subAccounts.forEach(sub => {
            const depts = this.getDepartments(sub.id);
            if (depts.length > 0) {
                // Ignore initialBalance and direct transactions if it has departments
                sub.balance = depts.reduce((sum, dept) => sum + dept.balance, 0);
            }
        });

        // Finally, an Account's balance is strictly the sum of all its Sub-accounts
        this.data.accounts.forEach(acc => {
            const subs = this.getSubAccounts(acc.id);
            if (subs.length > 0) {
                // Ignore any internal 'initialBalance' if it has sub-accounts, 
                // because the sub-accounts hold the real balances now.
                acc.balance = subs.reduce((sum, sub) => sum + sub.balance, 0);
            } else {
                // If it has no sub-accounts, fallback to its initial balance + any direct transactions
                acc.balance = acc.initialBalance || 0;
                this.data.transactions.forEach(tx => {
                    const amount = tx.type === 'expense' ? -Math.abs(tx.amount) : Math.abs(tx.amount);
                    if (tx.accountId === acc.id && !tx.subAccountId) {
                        acc.balance += amount;
                    }
                });
            }
        });
    }

    // --- Budgets ---
    addBudget(budget) {
        const newBudget = { id: this.generateId(), ...budget };
        this.data.budgets.push(newBudget);
        this.saveData();
        return newBudget;
    }

    getBudgets() { return this.data.budgets; }

    // Calculates how much was spent for a specific budget
    getBudgetSpent(budgetId) {
        const budget = this.data.budgets.find(b => b.id === budgetId);
        if (!budget) return 0;

        // Simplified: Assumes budget is for the week it was created.
        // In reality, we need to filter transactions by date range of the budget week.
        const budgetDate = new Date(budget.weekStarting);
        const endDate = new Date(budgetDate);
        endDate.setDate(endDate.getDate() + 7);

        return this.data.transactions
            .filter(tx => tx.type === 'expense')
            // Filter by date
            .filter(tx => {
                const txDate = new Date(tx.date);
                return txDate >= budgetDate && txDate < endDate;
            })
            // Filter by selected hierarchy scope of the budget (multi-source)
            .filter(tx => {
                if (!budget.sources || budget.sources.length === 0) {
                    // Fallback to legacy single-source if present
                    if (budget.departmentId) return tx.departmentId === budget.departmentId;
                    if (budget.subAccountId) return tx.subAccountId === budget.subAccountId;
                    if (budget.accountId) return tx.accountId === budget.accountId;
                    return true; // No scope defined
                }

                // Match against multiple sources array
                return budget.sources.some(src => {
                    if (tx.subAccountId !== src.subAccount) return false;

                    // If no specific departments selected, budget applies to whole sub-account
                    if (!src.departments || src.departments.length === 0) {
                        return true;
                    }

                    // Match any of the selected departments
                    return src.departments.includes(tx.departmentId);
                });
            })
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    }

    // --- Investments ---
    addInvestment(investment) {
        const newInv = { id: this.generateId(), ...investment };
        this.data.investments.push(newInv);
        this.saveData();
        return newInv;
    }

    // --- Money Lent ---
    addMoneyLent(entry) {
        const newEntry = { id: this.generateId(), status: 'lent', ...entry };
        this.data.moneyLent.push(newEntry);
        this.saveData();
        return newEntry;
    }

    markMoneyLentRepaid(id) {
        const entry = this.data.moneyLent.find(e => e.id === id);
        if (entry) {
            entry.status = 'repaid';
            this.saveData();
        }
    }

    // --- Account Info ---
    addAccountInfo(info) {
        const newInfo = { id: this.generateId(), ...info };
        this.data.accountInfo.push(newInfo);
        this.saveData();
        return newInfo;
    }
}

// Export singleton instance
export const store = new Store();
