// --- SETTINGS VIEW ---

window.renderSettings = () => `
    <div class="max-w-xl mx-auto space-y-3.5 sm:space-y-4 pb-16">
        <h2 class="text-xs sm:text-base font-black uppercase italic text-slate-800 tracking-wider flex items-center gap-2">
            <i data-lucide="settings" class="text-accent w-4 h-4 sm:w-5 sm:h-5"></i> ${t('settings')}
        </h2>
        
        <!-- General Store Settings -->
        <div class="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
            <h3 class="text-xs font-black uppercase text-slate-400 tracking-wide border-b pb-1.5 mb-2.5">
                ${state.lang === 'ru' ? 'Основные' : 'Asosiylar'}
            </h3>
            <div class="space-y-3">
                <label class="block">
                    <span class="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 mb-1 ml-1 block">
                        ${state.lang === 'ru' ? 'Название приложения' : 'Ilova nomi'}
                    </span>
                    <input class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent font-bold text-xs sm:text-sm text-slate-700 min-h-[38px]" value="${state.settings.appName}" onchange="updateSettings('appName', this.value)">
                </label>
                <label class="block">
                    <span class="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 mb-1 ml-1 block">
                        ${state.lang === 'ru' ? 'Валюта' : 'Valyuta'}
                    </span>
                    <input class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent font-bold text-xs sm:text-sm text-slate-700 min-h-[38px]" value="${state.settings.currency}" onchange="updateSettings('currency', this.value)">
                </label>
            </div>
        </div>

        <!-- Backup & Restore Section -->
        <div class="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
            <h3 class="text-xs font-black uppercase text-slate-400 tracking-wide border-b pb-1.5 mb-2.5 flex items-center justify-between">
                <span>${state.lang === 'ru' ? 'Резервное копирование' : 'Zaxira nusxasi'}</span>
                <span class="text-[9px] font-bold text-accent bg-orange-50 px-2 py-0.5 rounded-full uppercase tracking-wider">IndexedDB</span>
            </h3>
            <p class="text-xs text-slate-500 font-medium leading-relaxed">
                ${state.lang === 'ru' 
                    ? 'Сохраните копию всех данных (склад, продажи, долги, фотографии и лицензию) в один файл на случай очистки истории браузера.' 
                    : 'Barcha ma\'lumotlar (ombor, sotuvlar, qarzlar, fotosuratlar va litsenziya) nusxasini bitta faylga saqlang.'}
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button type="button" onclick="exportBackup()" class="min-h-[44px] bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer">
                    <i data-lucide="download" class="w-4 h-4 text-accent"></i>
                    <span>${state.lang === 'ru' ? 'Сохранить копию' : 'Nusxani saqlash'}</span>
                </button>

                <input type="file" id="settings-restore-file" accept=".json,application/json" class="hidden" onchange="handleSettingsRestoreSelect(event)">
                <button type="button" onclick="document.getElementById('settings-restore-file').click()" class="min-h-[44px] bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-2xs active:scale-95 transition-all cursor-pointer">
                    <i data-lucide="upload" class="w-4 h-4 text-slate-500"></i>
                    <span>${state.lang === 'ru' ? 'Восстановить из копии' : 'Nusxadan tiklash'}</span>
                </button>
            </div>
        </div>

        <!-- PWA Install Section -->
        <div class="bg-gradient-to-r from-orange-50 to-amber-50 p-3.5 sm:p-5 rounded-2xl border border-orange-200 shadow-sm space-y-2.5">
            <h3 class="text-xs font-black uppercase text-accent tracking-wide flex items-center justify-between">
                <span>${state.lang === 'ru' ? 'Установка на устройство' : 'Qurilmaga o\'rnatish'}</span>
                <i data-lucide="smartphone" class="w-4 h-4 text-accent"></i>
            </h3>
            <p class="text-xs text-slate-600 font-medium leading-relaxed">
                ${state.lang === 'ru'
                    ? 'Установите Agora как отдельное приложение на рабочий стол или экран планшета для быстрой работы без браузера.'
                    : 'Brauzersiz tez ishlash uchun Agorani ish stoli yoki planshet ekraniga alohida ilova sifatida o\'rnating.'}
            </p>
            <button type="button" onclick="triggerPWAInstall()" class="w-full min-h-[44px] bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-accent/20 active:scale-95 transition-all cursor-pointer">
                <i data-lucide="download" class="w-4 h-4"></i>
                <span>${state.lang === 'ru' ? 'Установить Agora на экран' : 'Agorani o\'rnatish'}</span>
            </button>
        </div>

        <!-- License & System Info -->
        <div class="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 class="text-xs font-black uppercase text-slate-400 tracking-wide border-b pb-1.5 mb-2.5 flex items-center justify-between">
                <span>${state.lang === 'ru' ? 'Лицензия и устройство' : 'Litsenziya va qurilma'}</span>
                <span class="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                    <i data-lucide="shield-check" class="w-3 h-3"></i>
                    ${state.lang === 'ru' ? 'Активна' : 'Faol'}
                </span>
            </h3>
            <div class="text-xs space-y-1.5 text-slate-500">
                <div class="flex justify-between items-center py-1 border-b border-slate-100">
                    <span class="font-bold text-slate-400 uppercase text-[10px]">${state.lang === 'ru' ? 'Клиент' : 'Mijoz'}:</span>
                    <span class="font-black text-slate-800">${window.CLIENT_CONFIG?.shopName || 'Agora'}</span>
                </div>
                <div class="flex justify-between items-center py-1 border-b border-slate-100">
                    <span class="font-bold text-slate-400 uppercase text-[10px]">${state.lang === 'ru' ? 'Хранилище' : 'Xotira'}:</span>
                    <span class="font-bold text-slate-700">IndexedDB (Offline)</span>
                </div>
            </div>
        </div>

        <!-- Danger Zone -->
        <div class="bg-white p-3.5 sm:p-5 rounded-2xl border border-red-200 shadow-sm space-y-3 sm:space-y-4">
            <h3 class="text-xs font-black uppercase text-red-500 tracking-wide border-b border-red-100 pb-1.5 mb-2.5">
                ${state.lang === 'ru' ? 'Опасная зона' : 'Xavfli hudud'}
            </h3>
            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div class="text-left space-y-0.5">
                    <h4 class="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight">
                        ${state.lang === 'ru' ? 'Очистить историю продаж' : 'Sotuvlar tarixini o\'chirish'}
                    </h4>
                    <p class="text-[10px] text-slate-400 font-bold uppercase leading-normal">
                        ${state.lang === 'ru' ? 'Удаление всех продаж и расходов. Склад и долги останутся нетронутыми.' : 'Barcha sotuvlar va xarajatlarni o\'chirish. Ombor va qarzlar saqlab qolinadi.'}
                    </p>
                </div>
                <button onclick="openClearDataModal()" class="w-full sm:w-auto px-4 py-2 sm:py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 min-h-[38px] cursor-pointer">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    <span>${state.lang === 'ru' ? 'Очистить данные' : 'O\'chirish'}</span>
                </button>
            </div>
        </div>
    </div>
`;

window.updateSettings = async (key, val) => {
    state.settings[key] = val;
    await saveState();
    render();
};

window.handleSettingsRestoreSelect = (event) => {
    const file = event.target.files?.[0];
    if (file && window.restoreBackup) {
        window.restoreBackup(file);
    }
    event.target.value = '';
};

window.exportData = () => {
    if (window.exportBackup) {
        window.exportBackup();
    }
};

window.confirmResetAll = async () => {
    await db.delete();
    localStorage.clear();
    window.location.reload();
};

window.resetApp = () => {
    const m = document.getElementById('modal-container');
    const title = state.lang === 'ru' ? 'Сброс данных' : 'Ma\'lumotlarni qayta o\'rnatish';
    const text = state.lang === 'ru' 
        ? 'Это действие полностью уничтожит все данные. <br><span class="text-red-500">Восстановление невозможно!</span>'
        : 'Ushbu harakat barcha ma\'lumotlarni butunlay yo\'q qiladi. <br><span class="text-red-500">Qayta tiklash imkonsiz!</span>';
    const btnCancel = t('cancel');
    const btnConfirm = state.lang === 'ru' ? 'Удалить всё' : 'Hammasini o\'chirish';

    m.innerHTML = `
        <div onclick="if(event.target===this) document.getElementById('modal-container').innerHTML=''" class="fixed inset-0 bg-red-900/40 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
            <div class="bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md text-center animate-in scale-in max-h-[calc(100dvh-16px)] flex flex-col overflow-hidden my-auto">
                <div class="w-10 h-10 sm:w-14 sm:h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 flex-shrink-0">
                    <i data-lucide="skull" class="w-5 h-5 sm:w-7 sm:h-7"></i>
                </div>
                <h2 class="text-base sm:text-lg md:text-xl font-black uppercase italic text-red-600 flex-shrink-0">${title}</h2>
                <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar my-2">
                    <p class="text-slate-400 text-xs sm:text-sm font-semibold uppercase tracking-wider leading-relaxed bg-red-50/20 p-3 sm:p-4 rounded-2xl border border-dashed border-red-200/55">${text}</p>
                </div>
                
                <div class="flex gap-2 sm:gap-3 flex-shrink-0 pt-2 border-t border-slate-100">
                    <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-3 border border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all min-h-[44px] flex items-center justify-center">${btnCancel}</button>
                    <button onclick="confirmResetAll()" class="flex-1 py-3 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-200 hover:bg-red-800 transition-all min-h-[44px] flex items-center justify-center">${btnConfirm}</button>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
};

window.openClearDataModal = () => {
    const m = document.getElementById('modal-container');
    const title = state.lang === 'ru' ? 'Очистить историю продаж?' : 'Sotuvlar tarixini o\'chirish?';
    const desc = state.lang === 'ru'
        ? 'Это действие полностью и безвозвратно удалит все продажи и расходы. Склад (товары) и долги останутся нетронутыми. Для подтверждения введите секретный код.'
        : 'Ushbu harakat barcha sotuvlar va xarajatlarni butunlay va qaytarib bo\'lmaydigan qilib o\'chirib tashlaydi. Ombor (mahsulotlar) va qarzlar saqlab qolinadi. Tasdiqlash uchun maxfiy kodni kiriting.';
    const btnCancel = t('cancel');
    const btnConfirm = state.lang === 'ru' ? 'Очистить данные' : 'Ma\'lumotlarni o\'chirish';

    m.innerHTML = `
        <div onclick="if(event.target===this) document.getElementById('modal-container').innerHTML=''" class="fixed inset-0 bg-red-900/40 backdrop-blur-md z-[9999] flex items-center justify-center p-2 sm:p-4">
            <div class="bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md text-center animate-in scale-in max-h-[calc(100dvh-16px)] flex flex-col overflow-hidden my-auto">
                <div class="w-10 h-10 sm:w-14 sm:h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 flex-shrink-0">
                    <i data-lucide="trash-2" class="w-5 h-5 sm:w-7 sm:h-7"></i>
                </div>
                <h2 class="text-base sm:text-lg md:text-xl font-black uppercase italic text-red-600 flex-shrink-0">${title}</h2>
                <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar my-2">
                    <p class="text-slate-400 text-xs sm:text-sm font-semibold uppercase tracking-wider leading-relaxed bg-red-50/20 p-3 sm:p-4 rounded-2xl border border-dashed border-red-200/55">${desc}</p>
                    <div class="my-2 space-y-1.5">
                        <div class="text-[11px] font-black tracking-widest text-slate-400 uppercase text-center">${state.lang === 'ru' ? 'ВВЕДИТЕ КОД ПОДТВЕРЖДЕНИЯ' : 'TASDIQLASH KODINI KIRITING'}</div>
                        <input id="clear-data-code-input" type="password" maxlength="4" placeholder="••••" class="w-32 sm:w-36 text-center bg-slate-50 border border-slate-150 px-3 py-2 text-xl sm:text-2xl rounded-xl outline-none focus:border-red-500 font-bold text-slate-700 tracking-widest mx-auto block shadow-inner min-h-[44px]">
                    </div>
                </div>

                <div class="flex gap-2 sm:gap-3 flex-shrink-0 pt-2 border-t border-slate-100">
                    <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-3 border border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all min-h-[44px] flex items-center justify-center">${btnCancel}</button>
                    <button onclick="confirmClearAllData()" class="flex-1 py-3 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-200 hover:bg-red-800 transition-all min-h-[44px] flex items-center justify-center">${btnConfirm}</button>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
    const codeInput = document.getElementById('clear-data-code-input');
    if (codeInput) codeInput.focus();
};

window.confirmClearAllData = async () => {
    const codeInput = document.getElementById('clear-data-code-input');
    const code = codeInput ? codeInput.value : '';
    if (code === '0310') {
        await db.sales.clear();
        await db.expenses.clear();

        // Process debtors to only keep active unpaid debts, and clean their transactions list
        const newDebts = [];
        for (const d of state.debts) {
            const debtsList = (d.transactions || []).filter(t => t.type === 'debt').sort((a, b) => a.timestamp - b.timestamp);
            const paymentsList = (d.transactions || []).filter(t => t.type === 'payment').sort((a, b) => a.timestamp - b.timestamp);
            
            const totalPaid = paymentsList.reduce((sum, p) => sum + p.amount, 0);
            const totalDebt = debtsList.reduce((sum, t) => sum + t.amount, 0);
            const balance = totalDebt - totalPaid;

            if (balance > 0) {
                let runningPaid = totalPaid;
                const cleanedTransactions = [];
                
                for (const debtItem of debtsList) {
                    if (runningPaid >= debtItem.amount) {
                        runningPaid -= debtItem.amount;
                    } else if (runningPaid > 0) {
                        const unpaidAmount = debtItem.amount - runningPaid;
                        cleanedTransactions.push({
                            ...debtItem,
                            amount: unpaidAmount
                        });
                        runningPaid = 0;
                    } else {
                        cleanedTransactions.push(debtItem);
                    }
                }

                newDebts.push({
                    id: d.id,
                    clientName: d.clientName || d.name || '',
                    name: d.clientName || d.name || '',
                    debt: balance,
                    transactions: cleanedTransactions
                });
            }
        }

        await db.debtors.clear();
        if (newDebts.length > 0) {
            await db.debtors.bulkAdd(newDebts.map(d => ({
                id: d.id ? (isNaN(Number(d.id)) ? undefined : Number(d.id)) : undefined,
                name: d.clientName || d.name || '',
                debt: d.debt,
                clientName: d.clientName || d.name || '',
                transactions: d.transactions || []
            })));
        }

        state.sales = [];
        state.expenses = [];
        state.debts = newDebts;

        window.location.reload();
    } else {
        showToast(state.lang === 'ru' ? '❌ Неверный код' : '❌ Kod noto\'g\'ri');
        if (codeInput) {
            codeInput.value = '';
            codeInput.classList.add('border-red-500', 'animate-shake');
            setTimeout(() => codeInput.classList.remove('animate-shake'), 500);
        }
    }
};
