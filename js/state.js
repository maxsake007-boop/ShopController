// --- APPLICATION STATE & ANALYTICS HELPERS ---
window.state = {
    lang: 'ru',
    products: [],
    sales: [],
    debts: [],
    expenses: [],
    settings: {
        appName: window.CLIENT_CONFIG?.shopName || 'Agora',
        currency: 'сум'
    },
    activeTab: 'kassa',
    showPurchasePrices: false,
    visiblePurchasePrices: [],
    kassa: {
        order: [],
        paymentType: 'cash',
        clientName: '',
        search: '',
        mobileTab: 'catalog'
    },
    dashboard: {
        filter: 'month',
        expenseAmount: '',
        expenseNote: ''
    },
    report: {
        period: 'today'
    },
    tempEdit: {
        paymentType: 'cash',
        clientName: ''
    }
};

// Returns ISO week number for a given timestamp
window.getWeekNumber = (ts) => {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

// Calculates millisecond timestamp for the start of the period filter
window.getStartTime = (filter) => {
    const now = new Date();
    if (filter === 'today') return new Date().setHours(0, 0, 0, 0);
    if (filter === 'week') {
        const currentDay = now.getDay();
        const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday);
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek.getTime();
    }
    if (filter === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    if (filter === 'quarter') {
        const startMonthOfQuarter = Math.floor(now.getMonth() / 3) * 3;
        return new Date(now.getFullYear(), startMonthOfQuarter, 1).getTime();
    }
    if (filter === 'year') return new Date(now.getFullYear(), 0, 1).getTime();
    return 0;
};

// Gathers closed cash/card deals and fully paid debt transactions for a timeframe
window.getClosedDeals = (startTime, endTime = Infinity) => {
    // 1. Cash and card sales in the timeframe
    const cashCardSales = (state.sales || []).filter(s => 
        s && s.timestamp >= startTime && s.timestamp <= endTime && 
        (s.paymentType === 'cash' || s.paymentType === 'card')
    );

    // 2. Clear out manual payments and retrieve fully paid debt sales
    const fullyPaidDebtSales = [];
    (state.debts || []).forEach(c => {
        if (!c) return;
        const transactions = c.transactions || [];
        const debtsList = transactions.filter(t => t && t.type === 'debt').sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        const paymentsList = transactions.filter(t => t && t.type === 'payment').sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        
        const totalPaid = paymentsList.reduce((sum, p) => sum + (p.amount || 0), 0);
        let cumulativeDebt = 0;

        debtsList.forEach(d => {
            cumulativeDebt += (d.amount || 0);
            if (totalPaid >= cumulativeDebt) {
                // Debt is completely covered
                let payoffTimestamp = d.timestamp || Date.now();
                let runningPaySum = 0;
                for (const p of paymentsList) {
                    runningPaySum += (p.amount || 0);
                    if (runningPaySum >= cumulativeDebt) {
                        payoffTimestamp = p.timestamp || payoffTimestamp;
                        break;
                    }
                }

                // Filter by payoff timestamp
                if (payoffTimestamp >= startTime && payoffTimestamp <= endTime) {
                    const originalSale = (state.sales || []).find(s => String(s.id) === String(d.saleId));
                    if (originalSale) {
                        fullyPaidDebtSales.push({
                            ...originalSale,
                            id: originalSale.id,
                            timestamp: payoffTimestamp,
                            originalTimestamp: originalSale.timestamp,
                            paymentType: 'Уплочен',
                            items: originalSale.items && originalSale.items.length > 0 ? originalSale.items : (d.items || [])
                        });
                    } else {
                        fullyPaidDebtSales.push({
                            id: `pmt-${payoffTimestamp}`,
                            timestamp: payoffTimestamp,
                            items: d.items || [],
                            total: d.amount || 0,
                            paymentType: 'Уплочен',
                            clientName: c.clientName || ''
                        });
                    }
                }
            }
        });
    });

    return [...cashCardSales, ...fullyPaidDebtSales].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
};

// Aggregates revenue, profit, expenses, and transaction count
window.getStats = (filter) => {
    const startTime = getStartTime(filter);
    const closedDeals = getClosedDeals(startTime);

    const revenue = closedDeals.reduce((sum, s) => sum + s.total, 0);
    
    let profit = 0;
    closedDeals.forEach(sale => {
        sale.items.forEach(item => {
            const product = state.products.find(p => String(p.id) === String(item.productId));
            if (product) {
                profit += (item.price - product.purchasePrice) * item.qty;
            }
        });
    });

    const filteredExpenses = state.expenses.filter(e => e.timestamp >= startTime);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    return {
        revenue,
        profit,
        totalExpenses,
        netProfit: profit - totalExpenses,
        salesCount: closedDeals.length
    };
};
