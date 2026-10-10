// =============================================================================
//                    DATABASE LAYER (Dexie.js / IndexedDB)
// =============================================================================

// Используем существующую базу данных и схему
const db = new Dexie("ShopDatabase");
db.version(1).stores({
    products: "++id, name, price, ost",
    sales: "++id, date, total, payment_method",
    debtors: "++id, name, debt",
    expenses: "++id, timestamp",
    settings: "key, value"
});

window.db = db;

// Безопасная и идемпотентная миграция данных из legacy localStorage
window.migrateFromLocalStorage = async () => {
    try {
        // Проверяем, не выполнялась ли полная миграция ранее
        const migrationFlag = await db.settings.get('migrated_from_localstorage');
        if (migrationFlag && migrationFlag.value) {
            return false;
        }

        const rawKeys = {
            products: localStorage.getItem('mpro_products'),
            sales: localStorage.getItem('mpro_sales'),
            debts: localStorage.getItem('mpro_debts'),
            expenses: localStorage.getItem('mpro_expenses'),
            settings: localStorage.getItem('mpro_settings'),
            lang: localStorage.getItem('mpro_lang')
        };

        const hasAnyOldData = Object.values(rawKeys).some(val => val !== null);
        if (!hasAnyOldData) {
            return false;
        }

        console.log('[Migration] Обнаружены данные в localStorage. Запуск безопасного переноса...');

        const parsed = {
            products: null,
            sales: null,
            debts: null,
            expenses: null,
            settings: null,
            lang: null
        };
        const failedKeys = [];

        // 1. Безопасный предварительный парсинг каждой сущности
        if (rawKeys.products) {
            try {
                const arr = JSON.parse(rawKeys.products);
                if (Array.isArray(arr)) {
                    parsed.products = arr.map(p => {
                        const initialStock = p.stock !== undefined ? p.stock : (p.ost !== undefined ? p.ost : 0);
                        return {
                            id: p.id ? (isNaN(Number(p.id)) ? undefined : Number(p.id)) : undefined,
                            name: p.name || '',
                            price: p.salePrice || p.price || 0,
                            ost: initialStock,
                            salePrice: p.salePrice || p.price || 0,
                            purchasePrice: p.purchasePrice || 0,
                            stock: initialStock,
                            photoUrl: p.photoUrl || '',
                            photoBlob: null
                        };
                    });
                }
            } catch (e) {
                console.error('[Migration] Ошибка парсинга mpro_products:', e);
                failedKeys.push('mpro_products');
            }
        }

        if (rawKeys.sales) {
            try {
                const arr = JSON.parse(rawKeys.sales);
                if (Array.isArray(arr)) {
                    parsed.sales = arr.map(s => ({
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
                }
            } catch (e) {
                console.error('[Migration] Ошибка парсинга mpro_sales:', e);
                failedKeys.push('mpro_sales');
            }
        }

        if (rawKeys.debts) {
            try {
                const arr = JSON.parse(rawKeys.debts);
                if (Array.isArray(arr)) {
                    parsed.debts = arr.map(d => {
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
                }
            } catch (e) {
                console.error('[Migration] Ошибка парсинга mpro_debts:', e);
                failedKeys.push('mpro_debts');
            }
        }

        if (rawKeys.expenses) {
            try {
                const arr = JSON.parse(rawKeys.expenses);
                if (Array.isArray(arr)) {
                    parsed.expenses = arr.map(e => ({
                        id: e.id ? (isNaN(Number(e.id)) ? undefined : Number(e.id)) : undefined,
                        timestamp: e.timestamp || Date.now(),
                        amount: e.amount || 0,
                        note: e.note || ''
                    }));
                }
            } catch (e) {
                console.error('[Migration] Ошибка парсинга mpro_expenses:', e);
                failedKeys.push('mpro_expenses');
            }
        }

        if (rawKeys.settings) {
            try {
                parsed.settings = JSON.parse(rawKeys.settings);
            } catch (e) {
                console.error('[Migration] Ошибка парсинга mpro_settings:', e);
                failedKeys.push('mpro_settings');
            }
        }

        if (rawKeys.lang) {
            parsed.lang = rawKeys.lang;
        }

        const successfullyMigratedKeys = [];

        // 2. Атомарная запись в IndexedDB
        await db.transaction('rw', [db.products, db.sales, db.debtors, db.expenses, db.settings], async () => {
            if (parsed.products && parsed.products.length > 0) {
                await db.products.bulkAdd(parsed.products);
                successfullyMigratedKeys.push('mpro_products');
            }
            if (parsed.sales && parsed.sales.length > 0) {
                await db.sales.bulkAdd(parsed.sales);
                successfullyMigratedKeys.push('mpro_sales');
            }
            if (parsed.debts && parsed.debts.length > 0) {
                await db.debtors.bulkAdd(parsed.debts);
                successfullyMigratedKeys.push('mpro_debts');
            }
            if (parsed.expenses && parsed.expenses.length > 0) {
                await db.expenses.bulkAdd(parsed.expenses);
                successfullyMigratedKeys.push('mpro_expenses');
            }
            if (parsed.settings) {
                if (parsed.settings.appName) await db.settings.put({ key: 'appName', value: parsed.settings.appName });
                if (parsed.settings.currency) await db.settings.put({ key: 'currency', value: parsed.settings.currency });
                successfullyMigratedKeys.push('mpro_settings');
            }
            if (parsed.lang) {
                await db.settings.put({ key: 'lang', value: parsed.lang });
                successfullyMigratedKeys.push('mpro_lang');
            }

            // Отметку о завершении ставим только если ВСЕ ключи успешно перенесены
            if (failedKeys.length === 0) {
                await db.settings.put({ key: 'migrated_from_localstorage', value: true });
            }
        });

        // 3. Безопасное точечное удаление ТОЛЬКО тех ключей, которые гарантированно записаны
        successfullyMigratedKeys.forEach(k => {
            localStorage.removeItem(k);
        });

        if (failedKeys.length > 0) {
            console.warn('[Migration] Часть ключей не перенесена из-за ошибок парсинга и сохранена в localStorage:', failedKeys);
        }

        return successfullyMigratedKeys.length > 0;
    } catch (err) {
        console.error('[Migration] Критическая ошибка миграции:', err);
        return false;
    }
};

// Загрузка коллекций IndexedDB в рабочее состояние памяти
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
            photoUrl: p.photoUrl || '',
            photoBlob: p.photoBlob || null
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

    // Автоматическое заполнение товаров для старых транзакций
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
        appName: settingsObj.appName || window.CLIENT_CONFIG?.shopName || 'Agora',
        currency: settingsObj.currency || 'сум'
    };
    
    state.lang = settingsObj.lang || 'ru';
};

// Сохранение текущего состояния памяти в IndexedDB (Dexie)
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
                photoUrl: p.photoUrl || '',
                photoBlob: p.photoBlob || null
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
        await db.settings.put({ key: 'appName', value: state.settings.appName || window.CLIENT_CONFIG?.shopName || 'Agora' });
        await db.settings.put({ key: 'currency', value: state.settings.currency || 'сум' });
        await db.settings.put({ key: 'lang', value: state.lang || 'ru' });
    });
};
