// --- DOLGI (DEBTORS) VIEW ---

window.renderDolgi = () => {
    const getDebt = (c) => c.transactions.reduce((s, t) => t.type === 'debt' ? s + t.amount : s - t.amount, 0);
    return `
        <div class="space-y-3 sm:space-y-4">
            <h2 class="text-xs sm:text-base font-black uppercase italic text-slate-800 tracking-wider flex items-center gap-2">
                <i data-lucide="users" class="text-accent w-4 h-4 sm:w-5 sm:h-5"></i> ${t('debtors')}
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3.5">
                ${state.debts.map(c => {
                    const d = getDebt(c);
                    if (d <= 0) return '';
                    return `
                        <div onclick="openDebtModal('${c.clientName.replace(/'/g, "\\'")}')" class="bg-white p-3.5 sm:p-4.5 rounded-2xl border border-slate-200 hover:border-accent cursor-pointer shadow-sm hover:shadow-md transition-all group">
                            <div class="flex items-center gap-3 sm:gap-3.5 mb-3">
                                <div class="w-10 h-10 sm:w-11 sm:h-11 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-accent border border-slate-100 flex-shrink-0">
                                    <i data-lucide="user" class="w-5 h-5"></i>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <h3 class="font-extrabold text-xs sm:text-sm text-slate-800 truncate">${c.clientName}</h3>
                                    <div class="text-[9px] sm:text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">${t('client')}</div>
                                </div>
                            </div>
                            <div class="flex justify-between items-center pt-2.5 sm:pt-3 border-t border-slate-100">
                                <span class="text-[10px] sm:text-xs font-black text-slate-400 uppercase">${t('debt_label')}:</span>
                                <span class="text-sm sm:text-base font-black text-red-500">${formatPrice(d)} ${state.settings.currency}</span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        <div id="debt-modal-root"></div>
    `;
};

window.openDebtModal = (name) => {
    const c = state.debts.find(x => x.clientName === name);
    if (!c) return;
    const getDebt = () => c.transactions.reduce((s, t) => t.type === 'debt' ? s + t.amount : s - t.amount, 0);
    let root = document.getElementById('debt-modal-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'debt-modal-root';
        document.body.appendChild(root);
    }
    root.innerHTML = `
        <div onclick="if(event.target===this) document.getElementById('debt-modal-root').innerHTML=''" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md md:max-w-lg overflow-hidden max-h-[calc(100dvh-16px)] flex flex-col animate-in scale-in my-auto">
                <div class="p-3.5 sm:p-5 border-b flex justify-between items-center bg-slate-50/50 flex-shrink-0">
                    <div>
                        <h2 class="text-sm sm:text-base md:text-lg font-black uppercase italic tracking-tight text-slate-800">${name}</h2>
                        <div class="text-xs sm:text-sm font-black text-red-500 uppercase tracking-widest mt-0.5">${t('debt_label')}: ${formatPrice(getDebt())}</div>
                    </div>
                    <button type="button" onclick="document.getElementById('debt-modal-root').innerHTML=''" class="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center bg-white rounded-full shadow border border-slate-100 text-slate-400 hover:text-red-500 transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                <div class="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-5 space-y-3 bg-slate-50/10 custom-scrollbar">
                    ${c.transactions.map((tItem, idx) => {
                        const sale = state.sales.find(s => String(s.id) === String(tItem.saleId));
                        return `
                            <div class="p-3 sm:p-4 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-2.5">
                                <div class="flex justify-between items-start">
                                    <div class="space-y-1">
                                        <div class="flex items-center gap-1.5 flex-wrap">
                                            <div class="w-2.5 h-2.5 rounded-full ${tItem.type === 'debt' ? 'bg-red-500' : 'bg-emerald-500'}"></div>
                                            <span class="text-[11px] font-black uppercase tracking-widest ${tItem.type === 'debt' ? 'text-red-500' : 'text-emerald-500'}">
                                                ${tItem.type === 'debt' ? t('debt_label') : t('payment')}
                                            </span>
                                        </div>
                                        ${tItem.type === 'debt' ? `
                                            <div class="relative inline-block mt-0.5">
                                                <input 
                                                    type="date" 
                                                    class="bg-slate-50 text-slate-500 font-bold text-xs py-1 px-2.5 rounded-lg outline-none border border-slate-100 focus:border-accent cursor-pointer min-h-[36px]"
                                                    value="${(() => {
                                                        const d = new Date(tItem.timestamp);
                                                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                                    })()}"
                                                    onchange="editDebtDate('${name.replace(/'/g, "\\'")}', ${idx}, this.value)"
                                                >
                                            </div>
                                        ` : `
                                            <div class="text-[11px] text-slate-400 font-bold uppercase ml-1 mt-0.5">${formatDate(tItem.timestamp)}</div>
                                        `}
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm md:text-base font-black tracking-tight ${tItem.type === 'debt' ? 'text-red-600' : 'text-emerald-600'}">${tItem.type === 'debt' ? '+' : '-'}${formatPrice(tItem.amount)}</span>
                                        <button onclick="deleteDebtTransaction('${name.replace(/'/g, "\\'")}', ${idx})" class="min-w-[40px] min-h-[40px] p-2 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shadow-sm border border-slate-100 flex items-center justify-center">
                                            <i class="w-4 h-4" data-lucide="trash-2"></i>
                                        </button>
                                    </div>
                                </div>
                                ${sale ? `
                                    <div class="pt-2 border-t border-slate-100 space-y-1">
                                        ${sale.items.map(i => `
                                            <div class="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-tight">
                                                <span>${i.name} x${i.qty}</span>
                                                <span>${formatPrice(i.price * i.qty)}</span>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).reverse().join('')}
                </div>
                <form onsubmit="payDebt(event, '${name.replace(/'/g, "\\'")}')" class="p-3 sm:p-4 border-t bg-white flex gap-2 sm:gap-3 flex-shrink-0 sticky bottom-0">
                    <input 
                        name="amount" 
                        type="text" 
                        inputmode="numeric" 
                        oninput="handleNumericInput(this)"
                        required 
                        placeholder="${t('pay_debt_placeholder')}" 
                        class="flex-1 px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-150 rounded-xl outline-none focus:border-accent font-black text-sm placeholder:text-slate-300 shadow-inner min-h-[44px]"
                    >
                    <button type="submit" class="px-5 sm:px-6 bg-accent text-white font-black rounded-xl uppercase text-xs tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-95 transition-all min-h-[44px] flex items-center justify-center">${t('pay_button')}</button>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
};

window.payDebt = async (e, name) => {
    e.preventDefault();
    const amount = parseNumber(new FormData(e.target).get('amount'));
    if (amount <= 0) return alert(t('summa_error'));
    const c = state.debts.find(x => x.clientName === name);
    if (!c) return;
    c.transactions.push({ type: 'payment', amount, timestamp: Date.now() });
    await saveState();
    render();
    openDebtModal(name);
    showToast(t('debt_repaid_toast'));
};

window.deleteDebtTransaction = (clientName, idx) => {
    const c = state.debts.find(x => x.clientName === clientName);
    if (!c) return;
    const tItem = c.transactions[idx];
    if (!tItem) return;
    
    // Show confirmation PIN modal
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
        <div onclick="if(event.target===this) document.getElementById('modal-container').innerHTML=''" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-2 sm:p-4">
            <div class="bg-white p-4 sm:p-6 rounded-3xl shadow-2xl w-full max-w-sm text-center animate-in scale-in max-h-[calc(100dvh-16px)] flex flex-col overflow-hidden my-auto">
                <div class="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 flex-shrink-0">
                    <i data-lucide="trash-2" class="w-5 h-5 sm:w-6 sm:h-6"></i>
                </div>
                <h3 class="text-base sm:text-lg font-black uppercase text-slate-800 tracking-tight mb-1 flex-shrink-0">
                    ${state.lang === 'ru' ? 'Удалить операцию?' : 'Amalni o\'chirish?'}
                </h3>
                <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar my-2">
                    <p class="text-[11px] font-black text-slate-400 mb-3 uppercase tracking-wider leading-relaxed">
                        ${tItem.type === 'payment' 
                            ? (state.lang === 'ru' ? `Удалить платеж на сумму ${formatPrice(tItem.amount)}` : `To'lovni o'chirish ${formatPrice(tItem.amount)}`)
                            : (state.lang === 'ru' ? `Удалить долг на сумму ${formatPrice(tItem.amount)}` : `Qarzni o'chirish ${formatPrice(tItem.amount)}`)}
                    </p>
                    <div class="mb-2 space-y-1.5">
                        <div class="text-[11px] font-black tracking-widest text-slate-400 uppercase text-center">${t('enter_pin')}</div>
                        <input id="delete-debt-pin-input" type="password" maxlength="4" placeholder="••••" class="w-32 text-center bg-slate-50 border border-slate-150 px-3 py-2 sm:py-2.5 text-base sm:text-lg rounded-xl outline-none focus:border-red-500 font-bold text-slate-700 tracking-widest mx-auto block shadow-inner min-h-[44px]">
                    </div>
                </div>
                <div class="flex gap-2 sm:gap-3 flex-shrink-0 pt-2 border-t border-slate-100">
                    <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-3 border border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all min-h-[44px] flex items-center justify-center">${t('cancel')}</button>
                    <button onclick="confirmDeleteDebtTransaction('${clientName.replace(/'/g, "\\'")}', ${idx})" class="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-100 transition-all min-h-[44px] flex items-center justify-center">${t('delete')}</button>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
    const pinInput = document.getElementById('delete-debt-pin-input');
    if (pinInput) pinInput.focus();
};

window.confirmDeleteDebtTransaction = async (clientName, idx) => {
    const pinInput = document.getElementById('delete-debt-pin-input');
    const pin = pinInput ? pinInput.value : '';
    if (pin === '1111') {
        const c = state.debts.find(x => x.clientName === clientName);
        if (c) {
            const tItem = c.transactions[idx];
            if (tItem) {
                if (tItem.type === 'debt') {
                    state.sales = state.sales.filter(s => String(s.id) !== String(tItem.saleId));
                }
                c.transactions.splice(idx, 1);
                state.debts = state.debts.filter(x => x.transactions.length > 0);
                showToast(state.lang === 'ru' ? 'Операция удалена' : 'Amal o\'chirildi');
            }
        }
        await saveState();
        render();
        document.getElementById('modal-container').innerHTML = '';
        if (state.debts.find(x => x.clientName === clientName)) {
            openDebtModal(clientName);
        } else {
            const root = document.getElementById('debt-modal-root');
            if (root) root.innerHTML = '';
        }
    } else {
        showToast(state.lang === 'ru' ? '❌ Неверный код' : '❌ PIN noto\'g\'ri');
        if (pinInput) {
            pinInput.value = '';
            pinInput.classList.add('border-red-500', 'animate-shake');
            setTimeout(() => pinInput.classList.remove('animate-shake'), 500);
        }
    }
};

window.editDebtDate = async (clientName, idx, newDate) => {
    const c = state.debts.find(x => x.clientName === clientName);
    if (!c) return;
    const tItem = c.transactions[idx];
    
    if (newDate && tItem) {
        const ts = new Date(newDate).getTime();
        if (!isNaN(ts)) {
            tItem.timestamp = ts;
            await saveState();
            render();
            openDebtModal(clientName);
            showToast(t('debt_date_edited'));
        } else {
            alert(t('check_data'));
        }
    }
};
