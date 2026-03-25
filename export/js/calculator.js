export function initCalculator() {
    const calcWidget = document.getElementById('calculator-widget');
    const toggleBtn = document.getElementById('calc-toggle-btn');
    const closeBtn = document.getElementById('calc-close-btn');
    const display = document.getElementById('calc-display');
    const historyDisp = document.getElementById('calc-history');
    const buttons = document.querySelectorAll('.calc-btn');

    let currentVal = '0';
    let previousVal = '';
    let operator = null;
    let newNumberStarted = true;

    toggleBtn.addEventListener('click', () => {
        calcWidget.classList.remove('calculator-collapsed');
        calcWidget.classList.add('calculator-expanded');
    });

    closeBtn.addEventListener('click', () => {
        calcWidget.classList.remove('calculator-expanded');
        calcWidget.classList.add('calculator-collapsed');
    });

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.closest('.calc-btn').dataset.val;
            const action = btn.closest('.calc-btn').dataset.action;

            if (val !== undefined && action !== 'operator') {
                if (newNumberStarted) {
                    currentVal = val === '.' ? '0.' : val;
                    newNumberStarted = false;
                } else {
                    if (val === '.' && currentVal.includes('.')) return;
                    currentVal = currentVal === '0' && val !== '.' ? val : currentVal + val;
                }
                updateDisplay();
            }

            if (action) {
                switch (action) {
                    case 'clear':
                        currentVal = '0';
                        previousVal = '';
                        operator = null;
                        newNumberStarted = true;
                        historyDisp.textContent = '';
                        updateDisplay();
                        break;
                    case 'delete':
                        if (newNumberStarted) return;
                        currentVal = currentVal.slice(0, -1) || '0';
                        updateDisplay();
                        break;
                    case 'operator':
                        handleOperator(val);
                        break;
                    case 'calculate':
                        calculate();
                        break;
                }
            }
        });
    });

    function handleOperator(op) {
        if (!newNumberStarted && previousVal !== '') {
            calculate();
        } else if (previousVal === '') {
            previousVal = currentVal;
        }
        operator = op;
        newNumberStarted = true;
        historyDisp.textContent = `${previousVal} ${operator}`;
    }

    function calculate() {
        if (operator === null || newNumberStarted) return;

        const prev = parseFloat(previousVal);
        const curr = parseFloat(currentVal);
        let result = 0;

        switch (operator) {
            case '+': result = prev + curr; break;
            case '-': result = prev - curr; break;
            case '*': result = prev * curr; break;
            case '/': result = prev / curr; break;
        }

        // Handle floating point precision issues
        result = Math.round(result * 100000000) / 100000000;

        historyDisp.textContent = `${previousVal} ${operator} ${currentVal} =`;
        currentVal = result.toString();
        operator = null;
        previousVal = currentVal;
        newNumberStarted = true;
        updateDisplay();
    }

    function updateDisplay() {
        display.textContent = currentVal;
    }
}
