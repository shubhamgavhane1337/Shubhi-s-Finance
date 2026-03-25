/**
 * app.js - Main Application Entry Point
 * Initializes the store and UIManager.
 */

import { store } from './store.js';
import { ui } from './ui.js';
import { initCalculator } from './calculator.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Float Calculator
    initCalculator();

    // Wait for the store to finish loading data from API or localStorage
    await store.initPromise;

    // Check if initial dummy data is needed for demonstration
    if (store.getAccounts().length === 0) {
        console.log("Initializing dummy data for fresh session...");
        const hdfc = store.addAccount('HDFC Bank');
        const sbi = store.addAccount('SBI Bank');

        // SBI Sub-Accounts
        const homeExpe = store.addSubAccount(sbi.id, 'Home Expe');
        const library = store.addSubAccount(sbi.id, 'Library');
        const savingFund = store.addSubAccount(sbi.id, 'Saving Fund');
        const turf = store.addSubAccount(sbi.id, 'Turf');
        const begaana = store.addSubAccount(sbi.id, 'Begaana');
        const biShoot = store.addSubAccount(sbi.id, 'BI Shoot');
        const account = store.addSubAccount(sbi.id, 'Account');
        const cashInHand = store.addSubAccount(sbi.id, 'Cash In Hand');
        const personal = store.addSubAccount(sbi.id, 'Personal');

        // Personal Departments
        const personalDepts = ['Car Expenses', 'Unni', 'VP', 'Pranali', 'P Gym', 'Koths', 'Aryan', 'Guddu', 'Swapna Di'];
        personalDepts.forEach(dept => store.addDepartment(personal.id, dept));

        // Turf Departments
        const turfDepts = ['Shubhi', 'Rahul more', 'Anna', 'Rohit', 'Rahul k', 'Arya + 3', 'Harsh + 4', 'Karan', 'Raunak', 'Hector'];
        turfDepts.forEach(dept => store.addDepartment(turf.id, dept));

        const current = store.addSubAccount(hdfc.id, 'Current');
        store.addDepartment(current.id, 'Business');

        // Initial render logic will implicitly be called by ui.js constructor 
        // which calls renderCurrentView().
    }

    // Bind emergency reset button if it exists
    const resetBtn = document.getElementById('btn-reset-data');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to delete ALL data and restore defaults?")) {
                localStorage.removeItem('shubhis_finance_data');
                window.location.reload();
            }
        });
    }

    // Export Data Binding
    const exportBtn = document.getElementById('btn-export-data');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const dataStr = localStorage.getItem('shubhis_finance_data');
            if (!dataStr) {
                ui.showToast('No data found to export!', 'error');
                return;
            }
            const blob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            a.download = `finance_data_export_${dateStr}.json`;
            a.click();
            URL.revokeObjectURL(url);
            ui.showToast('Data exported successfully!', 'success');
        });
    }

    // Import Data Binding
    const importBtn = document.getElementById('btn-import-data');
    const importInput = document.getElementById('import-file-input');
    if (importBtn && importInput) {
        importBtn.addEventListener('click', () => {
            importInput.click();
        });
        
        importInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const content = event.target.result;
                    // Validate JSON
                    JSON.parse(content);
                    localStorage.setItem('shubhis_finance_data', content);
                    ui.showToast('Data imported successfully! Reloading...', 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } catch (err) {
                    ui.showToast('Invalid format. Please upload a valid JSON file.', 'error');
                    console.error('Import Error:', err);
                }
            };
            reader.readAsText(file);
            // Reset the input so the same file can be selected again
            e.target.value = '';
        });
    }

    // Force initial render of the dashboard
    ui.switchView('dashboard');
});
