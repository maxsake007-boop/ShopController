// --- DATABASE LAYER (Dexie.js) ---
const db = new Dexie("ShopDatabase");
db.version(1).stores({
    products: "++id, name, price, ost",
    sales: "++id, date, total, payment_method",
    debtors: "++id, name, debt",
    expenses: "++id, timestamp",
    settings: "key, value"
});

window.db = db;

// Data migration from legacy localStorage to IndexedDB
window.migrateFromLocalStorage = async () => {
    const oldProducts = localStorage.getItem('mpro_products');
    const oldSales = localStorage.getItem('mpro_sales');
    const oldDebts = localStorage.getItem('mpro_debts');
    const oldExpenses = localStorage.getItem('mpro_expenses');
    const oldSettings = localStorage.getItem('mpro_settings');
    const oldLang = localStorage.getItem('mpro_lang');

    let migratedAny = false;

    if (oldProducts || oldSales || oldDebts || oldExpenses || oldSettings) {
        migratedAny = true;
        
        await db.transaction('rw', [db.products, db.sales, db.debtors, db.expenses, db.settings], async () => {
            if (oldProducts) {
                try {
                    const products = JSON.parse(oldProducts);
                    if (Array.isArray(products) && products.length > 0) {
                        const items = products.map(p => {
                            const initialStock = p.stock !== undefined ? p.stock : (p.ost !== undefined ? p.ost : 0);
                            return {
                                id: p.id ? (isNaN(Number(p.id)) ? undefined : Number(p.id)) : undefined,
                                name: p.name || '',
                                price: p.salePrice || p.price || 0,
                                ost: initialStock,
                                salePrice: p.salePrice || p.price || 0,
                                purchasePrice: p.purchasePrice || 0,
                                stock: initialStock,
                                photoUrl: p.photoUrl || ''
                            };
                        });
                        await db.products.bulkAdd(items);
                    }
                } catch (e) { console.error('Migration error (products):', e); }
            }

            if (oldSales) {
                try {
                    const sales = JSON.parse(oldSales);
                    if (Array.isArray(sales) && sales.length > 0) {
                        const items = sales.map(s => ({
                            id: s.id ? (isNaN(Number(s.id)) ? undefined : Number(s.id)) : undefined,
                            date: s.timestamp || s.date || Date.now(),
                            total: s.total || 0,
                            payment_method: s.paymentType || s.payment_method || 'cash',
                            timestamp: s.timestamp || s.date || Date.now(),
                            paymentType: s.paymentType || s.payment_method || 'cash',
                            clientName: s.clientName || '',
                            items: s.items || [],
                            displayTimestamp: s.displayTimestamp || ''
                        }));
                        await db.sales.bulkAdd(items);
                    }
                } catch (e) { console.error('Migration error (sales):', e); }
            }

            if (oldDebts) {
                try {
                    const debts = JSON.parse(oldDebts);
                    if (Array.isArray(debts) && debts.length > 0) {
                        const items = debts.map(d => {
                            const totalDebt = d.transactions?.reduce((sum, t) => t.type === 'debt' ? sum + t.amount : sum, 0) || 0;
                            const totalPaid = d.transactions?.reduce((sum, t) => t.type === 'payment' ? sum + t.amount : sum, 0) || 0;
                            const balance = totalDebt - totalPaid;
                            return {
                                id: d.id ? (isNaN(Number(d.id)) ? undefined : Number(d.id)) : undefined,
                                name: d.clientName || d.name || '',
                                debt: balance,
                                clientName: d.clientName || d.name || '',
                                transactions: d.transactions || []
                            };
                        });
                        await db.debtors.bulkAdd(items);
                    }
                } catch (e) { console.error('Migration error (debts):', e); }
            }

            if (oldExpenses) {
                try {
                    const expenses = JSON.parse(oldExpenses);
                    if (Array.isArray(expenses) && expenses.length > 0) {
                        const items = expenses.map(e => ({
                            id: e.id ? (isNaN(Number(e.id)) ? undefined : Number(e.id)) : undefined,
                            timestamp: e.timestamp || Date.now(),
                            amount: e.amount || 0,
                            note: e.note || ''
                        }));
                        await db.expenses.bulkAdd(items);
                    }
                } catch (e) { console.error('Migration error (expenses):', e); }
            }

            if (oldSettings) {
                try {
                    const settings = JSON.parse(oldSettings);
                    if (settings.appName) await db.settings.put({ key: 'appName', value: settings.appName });
                    if (settings.currency) await db.settings.put({ key: 'currency', value: settings.currency });
                } catch (e) { console.error('Migration error (settings):', e); }
            }
            if (oldLang) {
                await db.settings.put({ key: 'lang', value: oldLang });
            }
        });

        localStorage.clear();
    }
    return migratedAny;
};

// Load database collections into active in-memory state
window.loadStateFromDb = async () => {
    const products = await db.products.toArray();
    const sales = await db.sales.toArray();
    const debtors = await db.debtors.toArray();
    const expenses = await db.expenses.toArray();
    
    const settingsArr = await db.settings.toArray();
    const settingsObj = {};
    settingsArr.forEach(s => {
        settingsObj[s.key] = s.value;
    });

    state.products = products.map(p => {
        const currentStock = p.stock !== undefined ? p.stock : (p.ost !== undefined ? p.ost : 0);
        return {
            id: p.id,
            name: p.name,
            salePrice: p.salePrice || p.price || 0,
            purchasePrice: p.purchasePrice || 0,
            stock: currentStock,
            price: p.price || p.salePrice || 0,
            ost: currentStock,
            photoUrl: p.photoUrl || ''
        };
    });

    state.sales = sales.map(s => ({
        id: s.id,
        timestamp: s.timestamp || s.date || Date.now(),
        date: s.date || s.timestamp || Date.now(),
        total: s.total,
        paymentType: s.paymentType || s.payment_method || 'cash',
        payment_method: s.payment_method || s.paymentType || 'cash',
        clientName: s.clientName || '',
        items: s.items || [],
        displayTimestamp: s.displayTimestamp || ''
    })).sort((a, b) => b.timestamp - a.timestamp);

    state.debts = debtors.map(d => ({
        id: d.id,
        clientName: d.clientName || d.name || '',
        transactions: d.transactions || []
    }));

    // Backfill items for older transactions if missing
    let changedDebts = false;
    for (const d of debtors) {
        let clientChanged = false;
        if (d.transactions) {
            d.transactions.forEach(t => {
                if (t.type === 'debt' && (!t.items || t.items.length === 0) && t.saleId) {
                    const originalSale = state.sales.find(s => String(s.id) === String(t.saleId));
                    if (originalSale && originalSale.items && originalSale.items.length > 0) {
                        t.items = JSON.parse(JSON.stringify(originalSale.items));
                        clientChanged = true;
                        changedDebts = true;
                    }
                }
            });
        }
        if (clientChanged) {
            await db.debtors.put(d);
        }
    }
    if (changedDebts) {
        state.debts = debtors.map(d => ({
            id: d.id,
            clientName: d.clientName || d.name || '',
            transactions: d.transactions || []
        }));
    }

    state.expenses = expenses.map(e => ({
        id: e.id,
        timestamp: e.timestamp,
        amount: e.amount,
        note: e.note || ''
    })).sort((a, b) => b.timestamp - a.timestamp);

    state.settings = {
        appName: settingsObj.appName || 'NMN',
        currency: settingsObj.currency || 'сум'
    };
    
    state.lang = settingsObj.lang || localStorage.getItem('mpro_lang') || 'ru';
};

// High-performance state persistence using bulk operations
window.saveState = async () => {
    await db.transaction('rw', [db.products, db.sales, db.debtors, db.expenses, db.settings], async () => {
        // Products
        await db.products.clear();
        const productsToPut = state.products.map(p => {
            const currentStock = p.stock !== undefined ? p.stock : (p.ost !== undefined ? p.ost : 0);
            return {
                id: p.id ? (isNaN(Number(p.id)) ? p.id : Number(p.id)) : undefined,
                name: p.name || '',
                price: p.salePrice || p.price || 0,
                ost: currentStock,
                salePrice: p.salePrice || p.price || 0,
                purchasePrice: p.purchasePrice || 0,
                stock: currentStock,
                photoUrl: p.photoUrl || ''
            };
        });
        if (productsToPut.length > 0) {
            await db.products.bulkAdd(productsToPut);
        }

        // Sales
        await db.sales.clear();
        const salesToPut = state.sales.map(s => ({
            id: s.id ? (isNaN(Number(s.id)) ? s.id : Number(s.id)) : undefined,
            date: s.timestamp || s.date || Date.now(),
            total: s.total || 0,
            payment_method: s.paymentType || s.payment_method || 'cash',
            timestamp: s.timestamp || s.date || Date.now(),
            paymentType: s.paymentType || s.payment_method || 'cash',
            clientName: s.clientName || '',
            items: s.items || [],
            displayTimestamp: s.displayTimestamp || ''
        }));
        if (salesToPut.length > 0) {
            await db.sales.bulkAdd(salesToPut);
        }

        // Debtors
        await db.debtors.clear();
        const debtorsToPut = state.debts.map(d => {
            const totalDebt = d.transactions?.reduce((sum, t) => t.type === 'debt' ? sum + t.amount : sum, 0) || 0;
            const totalPaid = d.transactions?.reduce((sum, t) => t.type === 'payment' ? sum + t.amount : sum, 0) || 0;
            const balance = totalDebt - totalPaid;
            return {
                id: d.id ? (isNaN(Number(d.id)) ? d.id : Number(d.id)) : undefined,
                name: d.clientName || d.name || '',
                debt: balance,
                clientName: d.clientName || d.name || '',
                transactions: d.transactions || []
            };
        });
        if (debtorsToPut.length > 0) {
            await db.debtors.bulkAdd(debtorsToPut);
        }

        // Expenses
        await db.expenses.clear();
        const expensesToPut = state.expenses.map(e => ({
            id: e.id ? (isNaN(Number(e.id)) ? e.id : Number(e.id)) : undefined,
            timestamp: e.timestamp || Date.now(),
            amount: e.amount || 0,
            note: e.note || ''
        }));
        if (expensesToPut.length > 0) {
            await db.expenses.bulkAdd(expensesToPut);
        }

        // Settings
        await db.settings.put({ key: 'appName', value: state.settings.appName || 'NMN' });
        await db.settings.put({ key: 'currency', value: state.settings.currency || 'сум' });
        await db.settings.put({ key: 'lang', value: state.lang || 'ru' });
    });
};
