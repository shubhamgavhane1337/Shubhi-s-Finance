/**
 * ui.js - User Interface Management
 * Handles DOM manipulation, view rendering, and event bindings.
 */
import { store } from './store.js';

class UIManager {
    constructor() {
        this.currentView = 'dashboard';
        this.mainContent = document.getElementById('main-content');
        this.modalRoot = document.getElementById('modal-root');
        this.expandedSubAccounts = new Set(); // Remember expanded drawers

        // Subscribe to store updates to re-render the view
        store.subscribe(() => this.renderCurrentView());

        this.initEventListeners();
    }

    initEventListeners() {
        // Bottom Navigation
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = btn.dataset.view;
                if (view === 'transaction-modal') {
                    this.renderTransactionModal();
                } else {
                    this.switchView(view);
                    // Update active state in nav
                    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });
    }

    switchView(viewName) {
        this.currentView = viewName;
        // Simple fade out/in effect
        this.mainContent.classList.remove('loaded');

        setTimeout(() => {
            this.renderCurrentView();
            this.mainContent.classList.add('loaded');
        }, 150); // Matches CSS transition fast
    }

    renderCurrentView() {
        this.mainContent.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'view-section active';

        const data = store.data; // Current state

        switch (this.currentView) {
            case 'dashboard':
                this.renderDashboard(wrapper, data);
                break;
            case 'accounts':
                this.renderAccounts(wrapper, data);
                break;
            case 'history':
                this.renderHistory(wrapper, data);
                break;
            case 'budgets':
                this.renderBudgets(wrapper, data);
                break;
            case 'investments':
                this.renderInvestments(wrapper, data);
                break;
            case 'moneylent':
                this.renderMoneyLent(wrapper, data);
                break;
            case 'settings':
                this.renderSettings(wrapper, data);
                break;
            default:
                wrapper.innerHTML = `<h2>View Not Found</h2>`;
        }

        this.mainContent.appendChild(wrapper);

        // Initial fade-in trigger if not already loaded
        if (!this.mainContent.classList.contains('loaded')) {
            requestAnimationFrame(() => this.mainContent.classList.add('loaded'));
        }
    }

    // --- Formatters ---
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatCurrencyColor(amount) {
        const value = parseFloat(amount) || 0;
        const formatted = this.formatCurrency(Math.abs(value));
        const colorClass = value < 0 ? 'text-danger' : 'text-success';
        const sign = value < 0 ? '-' : '+';
        return `<span class="${colorClass}">${sign}${formatted}</span>`;
    }

    // --- Views ---

    renderSettings(container, data) {
        // Simple UI to hold firebase configuration
        const currentConfig = localStorage.getItem('firebase_config') || '';
        
        container.innerHTML = `
            <div class="mb-6">
                <h2 class="text-3xl font-bold text-gradient-aurora">Cloud Sync Setup</h2>
                <p class="text-muted text-sm mt-1">Configure Firebase to sync your data across devices seamlessly.</p>
            </div>
            
            <div class="glass-panel p-6 mb-6">
                <h3 class="text-xl font-bold mb-4">Firebase Configuration</h3>
                <p class="text-sm text-muted mb-4">Start by creating a free Firebase project and paste the generated JSON Configuration below.</p>
                <textarea id="firebase-config-input" class="w-full bg-surface text-white p-4 rounded-xl border border-light" rows="10" placeholder='{\n  "apiKey": "...",\n  "authDomain": "...",\n  "projectId": "...",\n  ...\n}'>${currentConfig}</textarea>
                <div class="flex gap-4 mt-6">
                    <button id="btn-save-firebase" class="btn btn-primary flex-1">Save & Connect</button>
                    <button id="btn-clear-firebase" class="btn btn-outline text-danger border-danger hover:bg-danger hover:text-white flex-1">Disconnect</button>
                </div>
                <div id="firebase-status" class="mt-4 text-sm font-bold text-center"></div>
            </div>
        `;

        container.querySelector('#btn-save-firebase').addEventListener('click', () => {
             const input = container.querySelector('#firebase-config-input').value;
             try {
                // simple format check
                JSON.parse(input);
                localStorage.setItem('firebase_config', input);
                const status = container.querySelector('#firebase-status');
                status.textContent = 'Configuration saved! Please Reload the page to connect.';
                status.className = 'mt-4 text-sm font-bold text-center text-success';
                setTimeout(() => window.location.reload(), 2000);
             } catch(e) {
                alert('Invalid JSON format. Please paste the exact configuration snippet.');
             }
        });

        container.querySelector('#btn-clear-firebase').addEventListener('click', () => {
             localStorage.removeItem('firebase_config');
             const status = container.querySelector('#firebase-status');
             status.textContent = 'Disconnected. Using Local Storage only.';
             status.className = 'mt-4 text-sm font-bold text-center text-danger';
             store.firebaseApp = null;
             setTimeout(() => window.location.reload(), 1500);
        });
    }

    renderDashboard(container, data) {
        // Calculate totals
        const totalBalance = data.accounts.reduce((sum, acc) => sum + acc.balance, 0);

        container.innerHTML = `
            <div class="mb-6">
                <h1 class="text-3xl font-bold bg-gradient-gemini text-gradient mb-2">Shubhi's Finance</h1>
                <p class="text-muted text-sm">Welcome back, here is your summary.</p>
            </div>

            <div class="card-grid mb-6" style="gap: var(--spacing-4); grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));">
                ${data.accounts.map((acc, index) => {
            const colors = ['primary', 'secondary', 'accent', 'warning'];
            const color = colors[index % colors.length];
            return `
                    <div class="glass-panel p-3 rounded-2xl glow-accent flex flex-col justify-between items-center text-center relative overflow-hidden w-full" style="border-color: var(--clr-${color}); background: linear-gradient(135deg, var(--clr-bg-card), var(--clr-bg-dark)); min-height: 130px;">
                        <div class="absolute top-0 left-0 w-full h-1" style="background-color: var(--clr-${color});"></div>
                        <div class="w-8 h-8 rounded-full bg-black bg-opacity-30 flex items-center justify-center shrink-0 mt-1 mb-1">
                            <span class="material-symbols-rounded text-lg" style="color: var(--clr-${color});">account_balance</span>
                        </div>
                        <div class="flex-1 flex items-center justify-center w-full px-1">
                            <div class="text-[14px] font-bold text-white leading-tight break-words text-center w-full max-w-full overflow-hidden text-ellipsis" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;" title="${acc.name}">${acc.name}</div>
                        </div>
                        <div class="w-full shrink-0 mt-1">
                            <div class="text-[10px] text-muted uppercase tracking-widest font-semibold mb-1">Available Balance</div>
                            <div class="text-[17px] font-bold text-white drop-shadow-md text-center inline-block w-full break-words max-w-full overflow-hidden text-ellipsis whitespace-nowrap" title="${this.formatCurrency(acc.balance)}">${this.formatCurrencyColor(acc.balance)}</div>
                        </div>
                    </div>
                    `;
        }).join('')}
            </div>

            <!-- Weekly Budget Chart Overview -->
            <div class="glass-panel p-5 mt-8 mb-4">
                <h3 class="text-md font-bold mb-4">Weekly Budget Overview</h3>
                <div style="height: 200px; width: 100%;">
                    <canvas id="dashboardChart"></canvas>
                </div>
                <!-- Progress bar for weekly budget limit -->
                <div id="dashboard-budget-progress-container" class="mt-5">
                    <!-- injected dynamically in initDashboardChart -->
                </div>
            </div>
        `;

        // Initialize Chart.js after DOM rendering
        setTimeout(() => this.initDashboardChart(data), 50);
    }

    initDashboardChart(data) {
        const ctx = document.getElementById('dashboardChart');
        if (!ctx) return;

        // Generate current week dates (Mon to Sun)
        const getWeekDates = () => {
            const dates = [];
            const today = new Date();
            const day = today.getDay(); // 0 is Sunday, 1 is Monday
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(today.setDate(diff));
            
            for (let i = 0; i < 7; i++) {
                const nextDay = new Date(monday);
                nextDay.setDate(monday.getDate() + i);
                dates.push(nextDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
            }
            return dates;
        };

        const labels = getWeekDates();
        
        // Find the active budget (assuming the first/only budget for now)
        const activeBudget = data.budgets && data.budgets.length > 0 ? data.budgets[0] : null;
        let maxLimit = 3500; // Default fallback if no budget exists
        let totalSpent = 0;
        let mockData = [0, 0, 0, 0, 0, 0, 0];
        
        if (activeBudget) {
            maxLimit = activeBudget.amount;
            totalSpent = store.getBudgetSpent(activeBudget.id);
            // Distribute spent amount roughly across the days for visual chart (or extract exact days if needed)
            // For now, simple visual mapping based on total spent:
            mockData[0] = totalSpent * 0.1;
            mockData[1] = totalSpent * 0.2;
            mockData[2] = totalSpent * 0.3;
            mockData[3] = totalSpent * 0.15;
            mockData[4] = totalSpent * 0.25;
            mockData[5] = 0;
            mockData[6] = 0;
        }

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Expenses',
                    data: mockData,
                    backgroundColor: 'rgba(234, 67, 53, 0.8)', // Danger color
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });

        // Weekly progress bar calculation based on actual budget
        const percentage = Math.min((totalSpent / maxLimit) * 100, 100);
        
        let progressColor = 'var(--clr-primary)';
        if (percentage > 80) progressColor = 'var(--clr-warning)';
        if (percentage >= 100) progressColor = 'var(--clr-danger)';

        const progressContainer = document.getElementById('dashboard-budget-progress-container');
        if (progressContainer) {
            progressContainer.innerHTML = `
                <div class="flex justify-between mb-2" style="font-size: var(--font-size-sm); font-weight: 500;">
                    <span class="text-muted">Spent: <span style="color: ${progressColor}">${this.formatCurrency(totalSpent)}</span></span>
                    <span class="text-muted">Limit: <span>${this.formatCurrency(maxLimit)}</span></span>
                </div>
                <div style="width: 100%; background-color: var(--clr-surface); border-radius: 9999px; height: 12px; overflow: hidden; border: 1px solid var(--glass-border);">
                    <div style="height: 12px; border-radius: 9999px; width: ${percentage}%; background-color: ${progressColor}; transition: width 0.5s ease;"></div>
                </div>
            `;
        }
    }

    renderAccounts(container, data) {
        let html = `
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-3xl font-bold text-gradient-aurora">My Wealth</h2>
                    <p class="text-muted text-sm mt-1">Organized by institutions and goals</p>
                </div>
                <button class="btn btn-primary btn-round shadow-glow" id="btn-add-account" aria-label="Add Bank">
                    <span class="material-symbols-rounded">add_business</span>
                </button>
            </div>
            
            <div class="flex-col gap-8">
        `;

        if (data.accounts.length === 0) {
            html += `<div class="glass-panel p-8 text-center text-muted border-dashed">No institutions added yet.</div>`;
        }

        data.accounts.forEach(acc => {
            html += `
                <div class="account-group">
                    <!-- Bank Header -->
                    <div class="bank-header p-4 md:p-5 rounded-2xl mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative overflow-hidden group/bank" style="background: linear-gradient(135deg, var(--clr-bg-card), var(--clr-primary-variant)); border: 2px solid var(--clr-primary); box-shadow: var(--shadow-glow);">
                        <!-- Edit/Delete Actions Absolutely Positioned -->
                        <div class="bank-actions">
                            <button class="btn-icon bg-black bg-opacity-50 hover:bg-primary text-white rounded p-1 transition-all btn-edit-account" data-accid="${acc.id}" title="Edit"><span class="material-symbols-rounded text-[14px]">edit</span></button>
                            <button class="btn-icon bg-black bg-opacity-50 hover:bg-danger text-white rounded p-1 transition-all btn-delete-account" data-accid="${acc.id}" title="Delete"><span class="material-symbols-rounded text-[14px]">delete</span></button>
                        </div>
                        
                        <div class="z-10 relative flex-1 w-full text-center md:text-left pr-14 md:pr-0">
                            <div class="flex justify-center md:justify-start items-center gap-2 mb-1">
                                <span class="text-[10px] font-bold text-primary uppercase tracking-widest bg-black bg-opacity-40 px-2 py-0.5 rounded">Institution</span>
                            </div>
                            <div class="text-2xl font-bold text-white drop-shadow-md">${acc.name}</div>
                        </div>
                        <div class="z-10 relative text-center md:text-right w-full md:w-auto bg-black bg-opacity-30 p-2 md:p-3 rounded-xl border border-white border-opacity-20 backdrop-blur-sm">
                           <div class="text-[10px] text-white uppercase tracking-widest mb-1 opacity-80">Total Assets</div>
                           <div style="display: flex; align-items: center; gap: 8px;">
                               <div class="text-xl font-bold text-success drop-shadow-md">${this.formatCurrencyColor(acc.balance)}</div>
                               <button class="btn-icon text-white transition-colors btn-edit-account-bal" style="opacity: 0.5; padding: 0;" onmouseover="this.style.opacity='1'; this.style.color='var(--clr-primary)';" onmouseout="this.style.opacity='0.5'; this.style.color='white';" data-accid="${acc.id}" title="Edit Balance"><span class="material-symbols-rounded" style="font-size: 14px; font-weight: 300;">edit</span></button>
                           </div>
                        </div>
                        <!-- decorative background blob -->
                        <div class="absolute -right-10 -top-10 w-48 h-48 bg-secondary opacity-30 rounded-full blur-3xl pointer-events-none"></div>
                        <div class="absolute -left-10 -bottom-10 w-48 h-48 bg-primary opacity-30 rounded-full blur-3xl pointer-events-none"></div>
                    </div>
                    
                    <!-- SubAccounts Grid -->
                    <div class="grid grid-cols-sub gap-4 relative mt-4 mb-6 pl-2 ml-1" style="overflow: visible;">
            `;

            const subs = store.getSubAccounts(acc.id);

            subs.forEach(s => {
                const depts = store.getDepartments(s.id);
                // We'll create a card for the sub account that expands a drawer on click
                html += `
                        <div class="sub-account-wrapper relative ${this.expandedSubAccounts.has(s.id) ? 'expanded' : ''}" data-subid="${s.id}">
                            <div class="sub-account-card rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between relative z-[100] drawer-trigger cursor-pointer text-center group/sub" data-toggle-subid="${s.id}">
                                <!-- Actions Wrapper (Flow layout, NOT absolute) -->
                                <div style="width: 100%; display: flex; justify-content: space-between; padding: 4px; z-index: 110; min-height: 24px;">
                                    <div class="sub-account-sequence-actions" style="display: flex; gap: 2px;">
                                        <button class="btn-sub-action move-up btn-move-sub" data-subid="${s.id}" data-dir="-1" title="Move Left/Up"><span class="material-symbols-rounded" style="font-size: 16px;">arrow_back</span></button>
                                        <button class="btn-sub-action move-down btn-move-sub" data-subid="${s.id}" data-dir="1" title="Move Right/Down"><span class="material-symbols-rounded" style="font-size: 16px;">arrow_forward</span></button>
                                    </div>
                                    <div class="sub-account-actions">
                                        <button class="btn-sub-action edit-name btn-edit-sub" data-subid="${s.id}" title="Rename Vault"><span class="material-symbols-rounded">edit</span></button>
                                        <button class="btn-sub-action edit-bal btn-edit-sub-bal" data-subid="${s.id}" title="Edit Balance"><span class="material-symbols-rounded">currency_rupee</span></button>
                                        <button class="btn-sub-action delete-sub btn-delete-sub" data-subid="${s.id}" title="Delete"><span class="material-symbols-rounded">delete</span></button>
                                    </div>
                                </div>
                                
                                <!-- Middle: Name (Centered) -->
                                <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 0 4px; text-align: center; width: 100%;">
                                    <div style="font-weight: bold; font-size: 14px; color: white; line-height: 1.2; word-break: break-word; text-align: center; width: 100%;" title="${s.name}">${s.name}</div>
                                </div>

                                <!-- Bottom: Fixed Layout Balance -->
                                <div style="padding: 4px; background: rgba(0,0,0,0.2); border-top: 1px solid var(--glass-border); display: flex; flex-direction: column; justify-content: center; align-items: center; flex-shrink: 0; width: 100%;">
                                    <div style="font-size: 9px; color: var(--clr-text-muted); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; margin-bottom: 2px;">Balance</div>
                                    <div style="font-size: 14px; font-weight: bold;">${this.formatCurrencyColor(s.balance)}</div>
                                </div>
                            </div>
                        </div>
                `;
            });

            html += `
                        <!-- Add Sub Account Card -->
                        <div class="sub-account-card rounded-2xl border-2 border-dashed border-light flex items-center justify-center p-4 cursor-pointer hover:border-primary transition-colors btn-add-sub group min-h-[120px]" data-accid="${acc.id}">
                            <div class="flex flex-col items-center gap-2 text-muted group-hover:text-primary transition-colors">
                                <span class="material-symbols-rounded text-3xl transition-transform group-hover:rotate-90">add</span>
                                <span class="text-sm font-medium">Add Vault</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;

        // Event Listeners for Account Management
        container.querySelectorAll('.drawer-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const subId = trigger.dataset.toggleSubid;
                this.expandedSubAccounts.add(subId);
                this.renderDepartmentModal(subId);
            });
        });

        // Close drawer modal by clicking background 
        const drawerOverlay = document.getElementById('drawer-overlay');
        if (drawerOverlay) {
            const overlayClone = drawerOverlay.cloneNode(true);
            drawerOverlay.parentNode.replaceChild(overlayClone, drawerOverlay);
            overlayClone.addEventListener('click', () => {
                this.expandedSubAccounts.clear();
                container.querySelectorAll('.sub-account-wrapper.expanded').forEach(w => w.classList.remove('expanded'));
                document.body.classList.remove('drawer-open');
            });
        }

        container.querySelector('#btn-add-account').addEventListener('click', () => {
            const name = prompt("Enter new institution name:");
            if (name) {
                const bal = prompt("Enter initial balance (optional):", "0");
                store.addAccount(name, parseFloat(bal) || 0);
            }
        });

        container.querySelectorAll('.btn-add-sub').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const accId = e.currentTarget.dataset.accid;
                const name = prompt("Enter vault/sub-account name:");
                if (name) {
                    const bal = prompt("Enter initial balance (optional):", "0");
                    store.addSubAccount(accId, name, parseFloat(bal) || 0);
                }
            });
        });

        container.querySelectorAll('.btn-add-dept').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const subId = e.currentTarget.dataset.subid;
                const name = prompt("Enter department name:");
                if (name) {
                    const bal = prompt("Enter initial balance (optional):", "0");
                    store.addDepartment(subId, name, parseFloat(bal) || 0);
                    // Rerender modal if it's the active one
                    if (this.expandedSubAccounts.has(subId)) {
                        this.renderDepartmentModal(subId);
                    }
                }
            });
        });

        // Edit/Delete Listeners
        container.querySelectorAll('.btn-edit-account').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const accId = e.currentTarget.dataset.accid;
                const acc = store.data.accounts.find(a => a.id === accId);
                if (!acc) return;
                const newName = prompt("Rename institution:", acc.name);
                if (newName !== null) {
                    store.editAccount(accId, newName || acc.name, acc.balance);
                }
            });
        });

        container.querySelectorAll('.btn-edit-account-bal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const accId = e.currentTarget.dataset.accid;
                const acc = store.data.accounts.find(a => a.id === accId);
                if (!acc) return;
                const bal = prompt(`Edit current Total Assets for ${acc.name} (will adjust initial balance to match this number):`, acc.balance);
                if (bal !== null) {
                    store.editAccount(accId, acc.name, bal);
                }
            });
        });

        container.querySelectorAll('.btn-delete-account').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const accId = e.currentTarget.dataset.accid;
                if (confirm(`Are you sure you want to delete this institution and ALL its nested vaults/departments and transactions?`)) {
                    store.deleteAccount(accId);
                }
            });
        });

        container.querySelectorAll('.btn-edit-sub').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const subId = e.currentTarget.dataset.subid;
                const sub = store.data.subAccounts.find(s => s.id === subId);
                if (!sub) return;
                const newName = prompt("Rename vault:", sub.name);
                if (newName !== null) {
                    store.editSubAccount(subId, newName || sub.name, sub.balance);
                }
            });
        });

        container.querySelectorAll('.btn-edit-sub-bal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const subId = e.currentTarget.dataset.subid;
                const sub = store.data.subAccounts.find(s => s.id === subId);
                if (!sub) return;
                const bal = prompt(`Edit current Balance for ${sub.name} (will adjust initial balance to match this number):`, sub.balance);
                if (bal !== null) {
                    store.editSubAccount(subId, sub.name, bal);
                }
            });
        });

        container.querySelectorAll('.btn-delete-sub').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const subId = e.currentTarget.dataset.subid;
                if (confirm(`Are you sure you want to delete this vault and all its departments and transactions?`)) {
                    this.expandedSubAccounts.delete(subId);
                    store.deleteSubAccount(subId);
                }
            });
        });

        // Sequence Listeners
        container.querySelectorAll('.btn-move-sub').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const subId = e.currentTarget.dataset.subid;
                const dir = parseInt(e.currentTarget.dataset.dir);
                store.moveSubAccount(subId, dir);
            });
        });
    }
    renderDepartmentModal(subId) {
        const sub = store.data.subAccounts.find(s => s.id === subId);
        if (!sub) return;

        const depts = store.getDepartments(subId);

        let deptsHtml = '';
        if (depts.length === 0) {
            deptsHtml = `<div class="text-sm text-muted mb-4 text-center py-4 bg-surface rounded-xl border border-dashed border-light">No departments in this vault yet.</div>`;
        } else {
            depts.forEach(d => {
                deptsHtml += `
                    <div class="flex justify-between items-center text-md p-3 rounded-lg bg-surface border border-light mb-2 hover:border-primary transition-colors group/dept">
                        <div class="flex items-center gap-3">
                           <span class="w-2 h-2 rounded-full bg-secondary block shadow-glow-sm"></span>
                           <span class="font-medium text-gray-200">${d.name}</span>
                        </div>
                        <div class="flex items-center gap-3">
                            <span class="font-bold text-white whitespace-nowrap">${this.formatCurrencyColor(d.balance)}</span>
                            <button class="btn-icon text-muted hover:text-primary transition-colors btn-edit-dept opacity-50 group-hover/dept:opacity-100" data-deptid="${d.id}" data-parentsubid="${subId}"><span class="material-symbols-rounded text-sm">edit</span></button>
                            <button class="btn-icon text-muted hover:text-danger transition-colors btn-delete-dept opacity-50 group-hover/dept:opacity-100" data-deptid="${d.id}" data-parentsubid="${subId}"><span class="material-symbols-rounded text-sm">delete</span></button>
                        </div>
                    </div>
                `;
            });
        }

        this.modalRoot.innerHTML = `
            <div class="modal-overlay active" id="dept-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="text-xl font-bold text-gradient-aurora">${sub.name} Departments</h3>
                        <button class="btn btn-ghost" id="dept-close"><span class="material-symbols-rounded">close</span></button>
                    </div>
                    
                    <div class="mb-4">
                       ${deptsHtml}
                    </div>

                    <button class="btn btn-primary w-full justify-center py-3 btn-add-dept-inline" data-subid="${subId}">
                        <span class="material-symbols-rounded text-sm">add</span> Add New Department
                    </button>
                </div>
            </div>
        `;

        const modal = document.getElementById('dept-modal');
        const closeBtn = document.getElementById('dept-close');

        // Note: do not duplicate event binding if already open to avoid stacking, 
        // however since we overwrite innerHTML above, we must rebind inside the new container.
        
        const closeModal = () => {
            modal.classList.remove('active');
            this.expandedSubAccounts.delete(subId);
            setTimeout(() => this.modalRoot.innerHTML = '', 300);
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Bind internal actions
        this.bindDepartmentModalActions(modal, subId);
    }

    bindDepartmentModalActions(modalScope, subId) {
        modalScope.querySelector('.btn-add-dept-inline').addEventListener('click', (e) => {
            e.preventDefault();
            const name = prompt("Enter department name:");
            if (name) {
                const bal = prompt("Enter initial balance (optional):", "0");
                store.addDepartment(subId, name, parseFloat(bal) || 0);
                this.renderDepartmentModal(subId);
            }
        });

        modalScope.querySelectorAll('.btn-edit-dept').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const deptId = e.currentTarget.dataset.deptid;
                const dept = store.data.departments.find(d => d.id === deptId);
                if (!dept) return;
                const newName = prompt("Edit department name:", dept.name);
                if (newName !== null) {
                    const bal = prompt("Edit current balance (will override history):", dept.balance);
                    store.editDepartment(deptId, newName || dept.name, bal !== null ? bal : dept.balance);
                    this.renderDepartmentModal(subId);
                }
            });
        });

        modalScope.querySelectorAll('.btn-delete-dept').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const deptId = e.currentTarget.dataset.deptid;
                if (confirm('Delete this department?')) {
                    store.deleteDepartment(deptId);
                    this.renderDepartmentModal(subId);
                }
            });
        });
    }

    renderHistory(container, data) {
        let html = `
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-3xl font-bold text-gradient-aurora">Transaction History</h2>
                    <p class="text-muted text-sm mt-1">Review, edit, and manage your past activity</p>
                </div>
            </div>
            
            <div class="flex-col gap-4">
        `;

        if (data.transactions.length === 0) {
            html += `<div class="glass-panel p-8 text-center text-muted border-dashed">No transactions recorded yet.</div>`;
        } else {
            // Sort by date descending
            const sortedTx = [...data.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

            sortedTx.forEach(tx => {
                const isExpense = tx.type === 'expense';
                const colorClass = isExpense ? 'text-danger' : 'text-success';
                const sign = isExpense ? '-' : '+';
                const dateObj = new Date(tx.date);
                const dateStr = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                // Construct Location String
                let locationParts = [];
                if (tx.accountId) {
                    const acc = data.accounts.find(a => a.id === tx.accountId);
                    if (acc) locationParts.push(acc.name);
                }
                if (tx.subAccountId) {
                    const sub = data.subAccounts.find(s => s.id === tx.subAccountId);
                    if (sub) locationParts.push(sub.name);
                }
                if (tx.departmentId) {
                    const dept = data.departments.find(d => d.id === tx.departmentId);
                    if (dept) locationParts.push(dept.name);
                }
                const locationStr = locationParts.join(' > ') || 'General';

                html += `
                    <div class="glass-panel p-4 mb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative group/tx" style="border-left: 4px solid ${isExpense ? 'var(--clr-danger)' : 'var(--clr-success)'};">
                        
                        <!-- Floating Actions (Edit/Delete) Top Right -->
                        <div class="absolute flex gap-1 opacity-100 md:opacity-0 group-hover/tx:opacity-100 transition-opacity bg-black bg-opacity-60 px-1 py-0.5 rounded backdrop-blur-sm z-20 shadow-md" style="top: 8px; right: 8px;">
                            <button class="btn-icon hover:text-primary text-white transition-colors btn-edit-tx p-1" data-txid="${tx.id}" title="Edit Amount/Note"><span class="material-symbols-rounded text-sm">edit</span></button>
                            <button class="btn-icon hover:text-danger text-white transition-colors btn-delete-tx p-1" data-txid="${tx.id}" title="Delete"><span class="material-symbols-rounded text-sm">delete</span></button>
                        </div>
                        
                        <div class="flex-1 pr-16 md:pr-20 mt-2 md:mt-0">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="material-symbols-rounded" style="font-size:18px; color: var(${isExpense ? '--clr-danger' : '--clr-success'})">
                                    ${isExpense ? 'arrow_downward' : 'arrow_upward'}
                                </span>
                                <span class="font-bold text-white text-lg">${tx.note || (isExpense ? 'Expense' : 'Income')}</span>
                            </div>
                            <div class="text-xs text-muted flex items-center gap-2 flex-wrap">
                                <span class="bg-surface px-2 py-0.5 rounded border border-light">${locationStr}</span>
                                <span>•</span>
                                <span>${tx.category || 'General'}</span>
                                <span>•</span>
                                <span>${dateStr} at ${timeStr}</span>
                            </div>
                        </div>
                        
                        <div class="text-right mt-2 md:mt-0 w-full md:w-auto pt-2 md:pt-0 border-t border-light md:border-0">
                            <div class="text-xl font-bold">${this.formatCurrencyColor(isExpense ? -tx.amount : tx.amount)}</div>
                        </div>
                    </div>
                `;
            });
        }

        html += `</div>`;
        container.innerHTML = html;

        // Bind Edit/Delete Listeners
        container.querySelectorAll('.btn-edit-tx').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const txId = e.currentTarget.dataset.txid;
                const tx = store.data.transactions.find(t => t.id === txId);
                if (!tx) return;
                
                const newNote = prompt("Edit Transaction Note:", tx.note);
                if (newNote !== null) {
                    const newAmount = prompt("Edit Amount (positive value):", tx.amount);
                    if (newAmount !== null && !isNaN(parseFloat(newAmount))) {
                        store.editTransaction(txId, {
                            note: newNote,
                            amount: parseFloat(newAmount)
                        });
                        this.renderHistory(container, store.data);
                    }
                }
            });
        });

        container.querySelectorAll('.btn-delete-tx').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const txId = e.currentTarget.dataset.txid;
                if (confirm('Are you sure you want to completely delete this transaction? This will automatically reverse its impact on all your balances.')) {
                    store.deleteTransaction(txId);
                    this.renderHistory(container, store.data);
                }
            });
        });
    }

    renderBudgets(container, data) {
        let html = `
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl">Weekly Budgets</h2>
                    <p class="text-muted text-sm">Track your spending limits</p>
                </div>
                <button class="btn btn-primary" id="btn-add-budget">
                    <span class="material-symbols-rounded">add</span>
                </button>
            </div>
            
            <div class="flex-col gap-4">
        `;

        if (data.budgets.length === 0) {
            html += `<div class="glass-panel p-6 text-center text-muted">No budgets set yet.</div>`;
        }

        data.budgets.forEach(b => {
            const spent = store.getBudgetSpent(b.id);
            const remaining = b.amount - spent;
            const percentage = Math.min((spent / b.amount) * 100, 100);

            let progressColor = 'var(--clr-primary)';
            if (percentage > 80) progressColor = 'var(--clr-warning)';
            if (percentage >= 100) progressColor = 'var(--clr-danger)';

            let scopeName = "Multiple Sources";
            if (!b.sources || b.sources.length === 0) {
                scopeName = "All Accounts";
                if (b.accountId) scopeName = data.accounts.find(a => a.id === b.accountId)?.name || scopeName;
                if (b.subAccountId) scopeName += ` > ${data.subAccounts.find(s => s.id === b.subAccountId)?.name}`;
                if (b.departmentId) scopeName += ` > ${data.departments.find(d => d.id === b.departmentId)?.name}`;
            } else {
                const totalSources = b.sources.reduce((sum, s) => sum + (s.departments.length === 0 ? 1 : s.departments.length), 0);
                scopeName = `${totalSources} sources tracked`;
            }

            html += `
                <div class="glass-panel p-4">
                    <div class="flex justify-between items-center mb-2">
                        <div>
                            <div class="text-lg font-bold">Week of ${new Date(b.weekStarting).toLocaleDateString()}</div>
                            <div class="text-xs text-muted">${scopeName}</div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm">Total: ${this.formatCurrency(b.amount)}</div>
                        </div>
                    </div>
                    
                    <div class="w-full bg-surface rounded-full h-2 mb-2 mt-4 overflow-hidden border border-light">
                        <div class="h-2 rounded-full" style="width: ${percentage}%; background-color: ${progressColor}; transition: width 0.5s ease;"></div>
                    </div>
                    
                    <div class="flex justify-between text-xs font-medium">
                        <span class="text-muted">Spent: <span style="color: ${progressColor}">${this.formatCurrency(spent)}</span></span>
                        <span class="text-muted">Remaining: <span>${this.formatCurrency(remaining)}</span></span>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;

        container.querySelector('#btn-add-budget')?.addEventListener('click', () => {
            this.renderBudgetModal();
        });
    }

    renderInvestments(container, data) {
        let html = `
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl">Investments</h2>
                    <p class="text-muted text-sm">Track your portfolio</p>
                </div>
                <button class="btn btn-primary" id="btn-add-investment">
                    <span class="material-symbols-rounded">add</span>
                </button>
            </div>
            
            <div class="flex-col gap-4">
        `;

        if (data.investments.length === 0) {
            html += `<div class="glass-panel p-6 text-center text-muted">No investments recorded.</div>`;
        }

        data.investments.forEach(inv => {
            html += `
                <div class="list-item glass-panel mb-2">
                    <div class="list-item-left">
                        <div class="icon-box"><span class="material-symbols-rounded">trending_up</span></div>
                        <div>
                            <div class="font-bold">${inv.name}</div>
                            <div class="text-xs text-muted">${new Date(inv.date).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div class="text-right font-semibold text-lg">
                        ${this.formatCurrency(inv.amount)}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;

        container.querySelector('#btn-add-investment')?.addEventListener('click', () => {
            const name = prompt("Investment Name (e.g., Mutual Fund):");
            if (name) {
                const amountStr = prompt(`Amount invested in ${name}:`);
                const amount = parseFloat(amountStr);
                if (!isNaN(amount)) {
                    store.addInvestment({
                        name,
                        amount,
                        date: new Date().toISOString().split('T')[0]
                    });
                }
            }
        });
    }

    renderMoneyLent(container, data) {
        let html = `
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl">Money Lent</h2>
                    <p class="text-muted text-sm">Track money you have lent out</p>
                </div>
                <button class="btn btn-primary" id="btn-add-lent">
                    <span class="material-symbols-rounded">add</span>
                </button>
            </div>
            
            <div class="flex-col gap-4">
        `;

        const lentEntries = data.moneyLent || [];
        if (lentEntries.length === 0) {
            html += `<div class="glass-panel p-6 text-center text-muted">No records found.</div>`;
        }

        lentEntries.forEach(entry => {
            const isRepaid = entry.status === 'repaid';
            html += `
                <div class="list-item glass-panel mb-2 ${isRepaid ? 'opacity-50' : ''}">
                    <div class="list-item-left">
                        <div class="icon-box"><span class="material-symbols-rounded">person</span></div>
                        <div>
                            <div class="font-bold">${entry.name}</div>
                            <div class="text-xs text-muted">${new Date(entry.date).toLocaleDateString()} &middot; ${entry.description || ''} ${isRepaid ? '<span class="text-success ml-1 font-bold">(Repaid)</span>' : ''}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="text-right font-semibold text-lg text-danger">
                            -${this.formatCurrency(entry.amount)}
                        </div>
                        ${!isRepaid ? `<button class="btn btn-sm btn-outline text-xs btn-repaid" data-id="${entry.id}">Mark Repaid</button>` : ''}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;

        container.querySelector('#btn-add-lent')?.addEventListener('click', () => {
            const name = prompt("Who did you lend money to?");
            if (name) {
                const amountStr = prompt("Amount lent:");
                const amount = parseFloat(amountStr);
                if (!isNaN(amount)) {
                    const description = prompt("Description (optional):") || '';
                    store.addMoneyLent({
                        name,
                        amount,
                        description,
                        date: new Date().toISOString().split('T')[0]
                    });
                }
            }
        });

        container.querySelectorAll('.btn-repaid').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                store.markMoneyLentRepaid(id);
            });
        });
    }

    renderAccountInfo(container, data) {
        let html = `
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl">Account Info</h2>
                    <p class="text-muted text-sm">Information regarding different accounts</p>
                </div>
                <button class="btn btn-primary" id="btn-add-info">
                    <span class="material-symbols-rounded">add</span>
                </button>
            </div>
            
            <div class="flex-col gap-4">
        `;

        const infoEntries = data.accountInfo || [];
        if (infoEntries.length === 0) {
            html += `<div class="glass-panel p-6 text-center text-muted">No information saved yet.</div>`;
        }

        infoEntries.forEach(info => {
            html += `
                <div class="glass-panel p-4 mb-2">
                    <div class="flex justify-between items-start mb-2">
                        <div class="font-bold text-lg text-primary">${info.name}</div>
                        <div class="font-bold text-lg">${this.formatCurrency(info.amount)}</div>
                    </div>
                    <div class="text-sm text-muted whitespace-pre-line">${info.description}</div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;

        container.querySelector('#btn-add-info')?.addEventListener('click', () => {
            const name = prompt("Account Name (e.g., Savings Goal):");
            if (name) {
                const amountStr = prompt("Amount:");
                const amount = parseFloat(amountStr);
                if (!isNaN(amount)) {
                    const description = prompt("Description/Details:") || '';
                    store.addAccountInfo({
                        name,
                        amount,
                        description
                    });
                }
            }
        });
    }

    renderTransactions(container, data) {
        let html = `
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-2xl">Transactions</h2>
                    <p class="text-muted text-sm">Recent activity</p>
                </div>
                <button class="btn btn-primary" onclick="document.querySelector('.fab-item').click()">
                    <span class="material-symbols-rounded">add</span>
                </button>
            </div>
            
            <div class="glass-panel p-2">
        `;

        if (data.transactions.length === 0) {
            html += `<div class="p-6 text-center text-muted">No transactions found.</div>`;
        } else {
            const sortedTx = [...data.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

            sortedTx.forEach(tx => {
                const isIncome = tx.type === 'income';
                const colorClass = isIncome ? 'text-success' : 'text-danger';
                const sign = isIncome ? '+' : '-';
                const icon = isIncome ? 'south_west' : 'north_east';

                let path = [];
                if (tx.accountId) path.push(data.accounts.find(a => a.id === tx.accountId)?.name || 'Unknown');
                if (tx.subAccountId) path.push(data.subAccounts.find(s => s.id === tx.subAccountId)?.name);
                if (tx.departmentId) path.push(data.departments.find(d => d.id === tx.departmentId)?.name);

                const pathString = path.filter(Boolean).join(' > ');

                html += `
                    <div class="list-item">
                        <div class="list-item-left">
                            <div class="icon-box" style="background: ${isIncome ? 'var(--clr-success-bg)' : 'var(--clr-danger-bg)'}">
                                <span class="material-symbols-rounded ${colorClass}">${icon}</span>
                            </div>
                            <div>
                                <div class="font-medium text-sm">${pathString}</div>
                                <div class="text-xs text-muted">${new Date(tx.date).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div class="text-right font-bold ${colorClass}">
                            ${sign}${this.formatCurrency(tx.amount)}
                        </div>
                    </div>
                `;
            });
        }

        html += `</div>`;
        container.innerHTML = html;
    }


    // --- Budget Modal ---
    renderBudgetModal() {
        const data = store.data;

        let sourcesHtml = '';
        data.subAccounts.forEach(sub => {
            const depts = store.getDepartments(sub.id);
            sourcesHtml += `
                <div class="mb-3 p-2 bg-surface border border-light rounded-lg">
                    <label class="flex items-center font-bold text-sm mb-2 text-primary cursor-pointer w-fit">
                        <input type="checkbox" class="mr-2 sub-checkbox form-checkbox" data-subid="${sub.id}">
                        ${sub.name} (Whole Vault)
                    </label>
                    <div class="pl-6 flex flex-col gap-1">
            `;
            depts.forEach(dept => {
                sourcesHtml += `
                    <label class="flex items-center text-sm text-gray-300 cursor-pointer w-fit">
                        <input type="checkbox" class="mr-2 dept-checkbox form-checkbox" data-subid="${sub.id}" data-deptid="${dept.id}">
                        ${dept.name}
                    </label>
                `;
            });
            sourcesHtml += `</div></div>`;
        });

        this.modalRoot.innerHTML = `
            <div class="modal-overlay active" id="budget-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="text-xl font-bold">New Weekly Budget</h3>
                        <button class="btn btn-ghost" id="budget-close"><span class="material-symbols-rounded">close</span></button>
                    </div>
                    
                    <form id="budget-form">
                        <div class="form-group mb-4">
                            <label class="form-label">Weekly Amount (INR)</label>
                            <input type="number" id="budget-amount" class="form-input" placeholder="0.00" step="0.01" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label mb-2">Select Tracked Sources</label>
                            <div class="text-xs text-muted mb-2">Selecting a Vault tracks all its departments.</div>
                            <div class="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                ${sourcesHtml || '<div class="text-xs text-muted">No vaults/departments found.</div>'}
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary w-full mt-6 justify-center py-3">Create Budget</button>
                    </form>
                </div>
            </div>
        `;

        const modal = document.getElementById('budget-modal');
        const closeBtn = document.getElementById('budget-close');
        const form = document.getElementById('budget-form');

        // Checkbox interaction logic
        const subChecks = document.querySelectorAll('.sub-checkbox');
        const deptChecks = document.querySelectorAll('.dept-checkbox');

        subChecks.forEach(subCb => {
            subCb.addEventListener('change', (e) => {
                const isChecked = e.target.checked;
                const subId = e.target.dataset.subid;
                // If sub-account is checked, disable/uncheck its departments
                deptChecks.forEach(dCb => {
                    if (dCb.dataset.subid === subId) {
                        dCb.checked = false;
                        dCb.disabled = isChecked;
                        if (isChecked) dCb.parentElement.classList.add('opacity-50');
                        else dCb.parentElement.classList.remove('opacity-50');
                    }
                });
            });
        });

        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => this.modalRoot.innerHTML = '', 300);
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('budget-amount').value);

            // Collect sources
            const sources = [];
            const processedSubs = new Set();

            subChecks.forEach(subCb => {
                if (subCb.checked) {
                    sources.push({ subAccount: subCb.dataset.subid, departments: [] });
                    processedSubs.add(subCb.dataset.subid);
                }
            });

            // Group checked departments
            const deptGroups = {};
            deptChecks.forEach(dCb => {
                if (dCb.checked && !processedSubs.has(dCb.dataset.subid)) {
                    if (!deptGroups[dCb.dataset.subid]) deptGroups[dCb.dataset.subid] = [];
                    deptGroups[dCb.dataset.subid].push(dCb.dataset.deptid);
                }
            });

            for (const [subId, depts] of Object.entries(deptGroups)) {
                sources.push({ subAccount: subId, departments: depts });
            }

            store.addBudget({
                weekStarting: new Date().toISOString().split('T')[0],
                amount: amount,
                sources: sources
            });

            closeModal();
        });
    }

    // --- Transaction Modal ---
    renderTransactionModal() {
        // Needs dynamic dropdowns based on state
        const data = store.data;
        const accountsOptions = data.accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');

        this.modalRoot.innerHTML = `
            <div class="modal-overlay active" id="tx-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="text-xl font-bold">New Transaction</h3>
                        <button class="btn btn-ghost" id="tx-close"><span class="material-symbols-rounded">close</span></button>
                    </div>
                    
                    <form id="tx-form">
                        <div class="form-group">
                            <label class="form-label">Type</label>
                            <select id="tx-type" class="form-select" required>
                                <option value="expense">Expense (-)</option>
                                <option value="income">Income (+)</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Amount (INR)</label>
                            <input type="number" id="tx-amount" class="form-input" placeholder="0.00" step="0.01" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Date</label>
                            <input type="date" id="tx-date" class="form-input" required>
                        </div>

                        <!-- Hierarchy Selection -->
                        <div class="form-group">
                            <label class="form-label">Account</label>
                            <select id="tx-account" class="form-select" required>
                                <option value="" disabled selected>Select Account</option>
                                ${accountsOptions}
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label">Sub Account</label>
                            <select id="tx-sub" class="form-select" disabled>
                                <option value="">None</option>
                            </select>
                        </div>

                        <div class="form-group" id="dept-container">
                            <label class="form-label">Department</label>
                            <select id="tx-dept" class="form-select" disabled>
                                <option value="">None</option>
                            </select>
                        </div>

                        <div id="bulk-split-section" class="form-group" style="display: none; background: rgba(0,0,0,0.2); border: 1px solid var(--clr-primary); padding: 10px; border-radius: 8px;">
                            <label class="form-label text-primary">Bulk Split (Turf Mode)</label>
                            <div class="text-xs text-muted mb-2">Select players and number of shares (people they are playing for).</div>
                            <div id="bulk-players-container" class="max-h-60 overflow-y-auto mb-2 custom-scrollbar pr-2 block"></div>
                            <div id="bulk-split-summary" class="text-sm font-bold text-success border-t border-light pt-2"></div>
                        </div>

                        <button type="submit" class="btn btn-primary w-full mt-4 justify-center py-3">Save Transaction</button>
                    </form>
                </div>
            </div>
        `;

        const modal = document.getElementById('tx-modal');
        const closeBtn = document.getElementById('tx-close');
        const form = document.getElementById('tx-form');

        // Dynamic Dropdowns Logic
        const accSelect = document.getElementById('tx-account');
        const subSelect = document.getElementById('tx-sub');
        const deptSelect = document.getElementById('tx-dept');

        // Initial Date
        document.getElementById('tx-date').valueAsDate = new Date();

        accSelect.addEventListener('change', (e) => {
            const accId = e.target.value;
            const subs = store.getSubAccounts(accId);
            if (subs.length > 0) {
                subSelect.innerHTML = `<option value="">Select Sub-Account (Optional)</option>` +
                    subs.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
                subSelect.disabled = false;
            } else {
                subSelect.innerHTML = '<option value="">None</option>';
                subSelect.disabled = true;
                deptSelect.innerHTML = '<option value="">None</option>';
                deptSelect.disabled = true;
            }
        });

        subSelect.addEventListener('change', (e) => {
            const subId = e.target.value;
            const depts = store.getDepartments(subId);
            const subAccount = store.data.subAccounts.find(s => s.id === subId);
            const isTurf = subAccount && subAccount.name.toLowerCase().includes('turf');
            
            const deptContainer = document.getElementById('dept-container');
            const bulkSection = document.getElementById('bulk-split-section');
            const bulkContainer = document.getElementById('bulk-players-container');

            if (isTurf && depts.length > 0) {
                // Activate Bulk Split Mode
                deptContainer.style.display = 'none';
                deptSelect.value = '';
                deptSelect.disabled = true;
                
                bulkSection.style.display = 'block';
                bulkContainer.innerHTML = depts.map(d => `
                    <div class="flex items-center justify-between mb-2">
                        <label class="flex items-center text-sm cursor-pointer flex-1 text-white">
                            <input type="checkbox" class="mr-2 bulk-player-check form-checkbox" data-deptid="${d.id}" checked>
                            ${d.name}
                        </label>
                        <div class="flex items-center ml-2">
                            <span class="text-xs text-muted mr-2">Shares:</span>
                            <input type="number" class="bulk-player-shares w-16 bg-surface text-center p-1 rounded border border-light text-sm" data-deptid="${d.id}" value="1" min="1">
                        </div>
                    </div>
                `).join('');
                
                updateBulkSummary();
                
                // Add listeners to new inputs
                bulkContainer.querySelectorAll('input').forEach(input => {
                    input.addEventListener('change', updateBulkSummary);
                    input.addEventListener('input', updateBulkSummary);
                });
                
            } else {
                // Normal Mode
                bulkSection.style.display = 'none';
                bulkContainer.innerHTML = '';
                deptContainer.style.display = 'flex';
                
                if (depts.length > 0 && subId) {
                    deptSelect.innerHTML = `<option value="">Select Department (Optional)</option>` +
                        depts.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
                    deptSelect.disabled = false;
                } else {
                    deptSelect.innerHTML = '<option value="">None</option>';
                    deptSelect.disabled = true;
                }
            }
        });

        const updateBulkSummary = () => {
            const amount = parseFloat(document.getElementById('tx-amount').value) || 0;
            const checks = document.querySelectorAll('.bulk-player-check:checked');
            let totalShares = 0;
            
            checks.forEach(chk => {
                const deptId = chk.dataset.deptid;
                const sharesInput = document.querySelector(`.bulk-player-shares[data-deptid="${deptId}"]`);
                totalShares += parseInt(sharesInput.value) || 1;
            });
            
            const summaryDiv = document.getElementById('bulk-split-summary');
            if (totalShares > 0) {
                const perShare = amount / totalShares;
                summaryDiv.innerHTML = `Split across ${totalShares} total shares. Cost per share: ${this.formatCurrency(perShare)}`;
            } else {
                summaryDiv.innerHTML = 'Select at least one player to split.';
            }
        };

        document.getElementById('tx-amount').addEventListener('input', () => {
             if (document.getElementById('bulk-split-section').style.display === 'block') {
                 updateBulkSummary();
             }
        });

        // Close logic
        const closeModal = () => {
            modal.classList.remove('active');
            setTimeout(() => this.modalRoot.innerHTML = '', 300);
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });

        // Submit logic
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const txType = document.getElementById('tx-type').value;
            const amount = parseFloat(document.getElementById('tx-amount').value);
            const date = document.getElementById('tx-date').value;
            const accId = accSelect.value;
            const subId = subSelect.value;
            const deptId = deptSelect.value;

            const bulkSection = document.getElementById('bulk-split-section');
            if (bulkSection && bulkSection.style.display === 'block') {
                // Turf Bulk Split Submit
                const checks = document.querySelectorAll('.bulk-player-check:checked');
                let totalShares = 0;
                const players = [];
                
                checks.forEach(chk => {
                    const dId = chk.dataset.deptid;
                    const shares = parseInt(document.querySelector(`.bulk-player-shares[data-deptid="${dId}"]`).value) || 1;
                    totalShares += shares;
                    players.push({ id: dId, shares });
                });
                
                if (totalShares === 0) {
                    alert('Please select at least one player to split the amount.');
                    return;
                }
                
                const perShareAmount = amount / totalShares;
                const transactions = [];
                
                players.forEach(p => {
                    const playerShareAmount = perShareAmount * p.shares;
                    transactions.push({
                        type: txType,
                        amount: playerShareAmount,
                        date: date,
                        accountId: accId,
                        subAccountId: subId,
                        departmentId: p.id,
                        note: `Bulk Split (${p.shares} share${p.shares > 1 ? 's' : ''})`
                    });
                });
                
                store.addBulkTransactions(transactions);
            } else {
                // Normal Submit
                store.addTransaction({
                    type: txType,
                    amount: amount,
                    date: date,
                    accountId: accId,
                    subAccountId: subId || null,
                    departmentId: deptId || null
                });
            }

            closeModal();
            // Optional Toast Notification
            alert(`Transaction Saved!`);
        });
    }
}

// Export singleton
export const ui = new UIManager();
