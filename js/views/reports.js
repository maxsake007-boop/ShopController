// --- REPORTS (ОТЧЕТНОСТЬ) VIEW ---

window.renderReport = () => {
    const startTime = getStartTime(state.report.period);
    const stats = getStats(state.report.period);
    
    const closedDeals = getClosedDeals(startTime);
    const totalClosed = closedDeals.reduce((s, x) => s + x.total, 0);

    // Group deals by exact timestamp
    const groupDealsByMinute = (deals) => {
        const getGroupKey = (timestamp) => String(timestamp);

        const timestampGroups = {};
        deals.forEach(deal => {
            const isPmt = deal.id.toString().startsWith('pmt-');
            if (!isPmt) {
                const key = getGroupKey(deal.timestamp);
                if (!timestampGroups[key]) {
                    timestampGroups[key] = [];
                }
                timestampGroups[key].push(deal);
            }
        });

        const result = [];
        const processedKeys = new Set();

        deals.forEach(deal => {
            const isPmt = deal.id.toString().startsWith('pmt-');
            if (isPmt) {
                result.push({ isGroup: false, sale: deal, timestamp: deal.timestamp });
            } else {
                const key = getGroupKey(deal.timestamp);
                const group = timestampGroups[key];
                if (group.length > 1) {
                    if (!processedKeys.has(key)) {
                        processedKeys.add(key);
                        result.push({
                            isGroup: true,
                            key: key,
                            timestamp: group[0].timestamp,
                            sales: group,
                            total: group.reduce((sum, s) => sum + s.total, 0)
                        });
                    }
                } else {
                    result.push({ isGroup: false, sale: deal, timestamp: deal.timestamp });
                }
            }
        });

        return result;
    };

    const displayItems = groupDealsByMinute(closedDeals);

    // Active Debtors Summary
    const activeDebtors = state.debts.map(c => {
        const totalDebt = c.transactions.reduce((s, t) => t.type === 'debt' ? s + t.amount : s, 0);
        const totalPaid = c.transactions.reduce((s, t) => t.type === 'payment' ? s + t.amount : s, 0);
        const balance = totalDebt - totalPaid;
        
        const clientSales = state.sales.filter(s => s.clientName === c.clientName && s.paymentType === 'debt');
        const products = [];
        clientSales.forEach(s => products.push(...s.items));
        
        return { name: c.clientName, totalDebt, totalPaid, balance, products };
    }).filter(d => d.balance > 0).sort((a, b) => b.balance - a.balance);

    return `
        <div class="space-y-3 sm:space-y-4 pb-20 md:pb-8">
            <div class="flex justify-between items-center gap-2">
                <h2 class="text-xs sm:text-base font-black uppercase italic text-slate-800 tracking-wider flex items-center gap-2">
                    <i data-lucide="file-text" class="text-accent w-4 h-4 sm:w-5 sm:h-5"></i> ${t('reports')}
                </h2>
                <div class="flex bg-white p-0.5 border border-slate-200 rounded-xl text-[10px] sm:text-xs font-black uppercase overflow-x-auto">
                    ${['today', 'week', 'month', 'quarter', 'year'].map(p => {
                        const labels = {
                            'today': t('for_today'),
                            'week': t('for_week'),
                            'month': t('for_month'),
                            'quarter': t('for_quarter'),
                            'year': t('for_year')
                        };
                        return `
                            <button onclick="state.report.period='${p}'; render()" class="px-2.5 py-1 rounded-lg transition-all whitespace-nowrap ${state.report.period === p ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}">${labels[p]}</button>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
                <div class="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-18 sm:h-20">
                    <div class="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">${t('revenue')}</div>
                    <div class="text-base sm:text-xl font-black text-slate-900 leading-none">${formatPrice(totalClosed)}</div>
                </div>
                <div class="bg-emerald-50/40 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between h-18 sm:h-20">
                     <div class="text-[9px] sm:text-[10px] font-black text-emerald-600 uppercase tracking-widest">${t('profit')} 🎉</div>
                     <div class="text-base sm:text-xl font-black text-emerald-800 leading-none">${formatPrice(stats.profit)}</div>
                </div>
            </div>

            <!-- Transactions Section -->
            <div class="space-y-2.5 sm:space-y-3">
                <div class="flex justify-between items-center ml-0.5">
                    <h3 class="text-xs sm:text-sm font-black uppercase italic text-slate-500 flex items-center gap-1.5">
                        <i data-lucide="check-circle-2" class="w-4 h-4 text-accent"></i> ${t('transactions')}
                    </h3>
                </div>

                <div class="space-y-2.5 sm:space-y-3">
                    <!-- Headers for Perfect Align (Desktop) -->
                    <div class="hidden md:grid grid-cols-12 gap-3 sm:gap-4 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-[9.5px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest items-center">
                        <div class="col-span-2">${state.lang === 'ru' ? 'ВРЕМЯ' : 'VAQT'}</div>
                        <div class="col-span-5">${state.lang === 'ru' ? 'ТОВАРЫ' : 'MAHSULOTLAR'}</div>
                        <div class="col-span-2 text-center">${state.lang === 'ru' ? 'СТАТУС' : 'HOLAT'}</div>
                        <div class="col-span-3 text-right">${state.lang === 'ru' ? 'ИТОГ' : 'SUMMA'}</div>
                    </div>

                    <!-- List of Receipts cards -->
                    <div class="space-y-3">
                        ${displayItems.map(item => {
                            if (item.isGroup) {
                                return `
                                <div class="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all flex flex-col gap-2.5 sm:gap-3.5 relative overflow-hidden">
                                    <!-- Group Header -->
                                    <div class="flex flex-wrap items-center justify-between pb-2 border-b border-slate-100 gap-2">
                                        <div class="flex items-center gap-2">
                                            <span class="font-bold text-slate-700 text-xs sm:text-sm">${formatDate(item.timestamp)}</span>
                                            <span class="inline-flex items-center gap-1 bg-slate-50 text-slate-400 text-[10px] font-semibold py-0.5 px-1.5 rounded-lg">
                                                <i class="w-3 h-3 text-slate-350 mr-0.5" data-lucide="clock"></i>
                                                ${new Date(item.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <div>
                                            <span class="inline-flex items-center gap-1 bg-orange-100 text-orange-800 px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                                                <i class="w-3 h-3 text-accent mr-0.5" data-lucide="shopping-bag"></i>
                                                ${state.lang === 'ru' ? 'В ОДНОМ ЧЕКЕ' : 'BIRGA'}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Group Rows -->
                                    <div class="divide-y divide-slate-100 space-y-2.5">
                                        ${item.sales.map((s, idx) => `
                                            <div class="${idx > 0 ? 'pt-2.5' : ''} flex flex-col md:grid md:grid-cols-12 gap-2.5 sm:gap-4 items-center">
                                                <div class="hidden md:block col-span-2"></div>
                                                <div class="col-span-5 w-full text-left flex flex-col gap-1">
                                                    <div class="bg-slate-50/55 p-2 sm:p-2.5 rounded-xl border border-slate-100 flex flex-col gap-1 shadow-inner">
                                                        ${s.items.map(i => `
                                                            <div class="flex justify-between items-center text-xs text-slate-700 gap-2">
                                                                <div class="font-semibold text-slate-800 flex items-center gap-1 min-w-0">
                                                                    <span class="w-1.5 h-1.5 rounded-full bg-slate-350 flex-shrink-0 animate-pulse"></span>
                                                                    <span class="truncate min-w-0">${i.name}</span>
                                                                    <span class="text-accent font-black bg-orange-50 px-1 py-0.2 rounded text-[9px] flex-shrink-0">x${i.qty}</span>
                                                                </div>
                                                                <span class="font-black text-slate-500 whitespace-nowrap text-xs">${formatPrice(i.price * i.qty)}</span>
                                                            </div>
                                                        `).join('')}
                                                    </div>
                                                </div>
                                                <div class="col-span-2 w-full md:w-auto flex md:flex-col items-center md:justify-center justify-between py-0.5 md:py-0">
                                                    <div class="md:hidden text-[9px] font-black uppercase text-slate-400 tracking-widest">${state.lang === 'ru' ? 'СТАТУС' : 'HOLAT'}</div>
                                                    ${(() => {
                                                        const colors = {
                                                            'cash': 'text-emerald-700 bg-emerald-50 border-emerald-150',
                                                            'card': 'text-blue-700 bg-blue-50 border-blue-150',
                                                            'debt': 'text-red-700 bg-red-50 border-red-150',
                                                            'Уплочен': 'text-amber-700 bg-amber-50 border-amber-150'
                                                        };
                                                        const labels = { 
                                                            'cash': (state.lang === 'ru' ? 'Наличные' : 'Naqd'), 
                                                            'card': (state.lang === 'ru' ? 'Карта' : 'Karta'), 
                                                            'debt': (state.lang === 'ru' ? 'Долг' : 'Qarz'), 
                                                            'Уплочен': (state.lang === 'ru' ? 'Погашен' : 'To\'langan') 
                                                        };
                                                        return `<span class="px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest border shadow-sm ${colors[s.paymentType] || 'text-slate-400'}">${labels[s.paymentType] || s.paymentType}</span>`;
                                                    })()}
                                                </div>
                                                <div class="col-span-3 w-full flex flex-row md:flex-col justify-between items-center md:items-end gap-2">
                                                    <div class="md:hidden text-[9px] font-black uppercase text-slate-400 tracking-widest">${state.lang === 'ru' ? 'ИТОГ' : 'JAMI'}</div>
                                                    <div class="text-right">
                                                        <span class="text-xs sm:text-sm font-extrabold text-slate-900 leading-none">${formatPrice(s.total)}</span>
                                                    </div>
                                                    <div class="flex gap-1.5 transition-all">
                                                        <button onclick="editSale('${s.id}')" class="p-1.5 bg-slate-50 text-slate-400 hover:text-accent hover:bg-orange-50 rounded-lg transition-all shadow-sm border border-slate-100 flex items-center justify-center">
                                                            <i class="w-3.5 h-3.5" data-lucide="edit-3"></i>
                                                        </button>
                                                        <button onclick="deleteSale('${s.id}')" class="p-1.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shadow-sm border border-slate-100 flex items-center justify-center">
                                                            <i class="w-3.5 h-3.5" data-lucide="trash-2"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>

                                    <!-- Group Footer -->
                                    <div class="border-t border-slate-100 pt-2.5 flex justify-between items-center">
                                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">${state.lang === 'ru' ? 'ОБЩИЙ ИТОГ ЧЕКА' : 'CHEKNING UMUMIY JAMI'}</span>
                                        <span class="text-sm sm:text-base font-black text-slate-950 leading-none">${formatPrice(item.total)}</span>
                                    </div>
                                </div>
                                `;
                            } else {
                                const s = item.sale;
                                return `
                                <div class="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all group flex flex-col md:grid md:grid-cols-12 gap-2.5 sm:gap-4 items-center relative">
                                    <!-- Column 1: Time & Date -->
                                    <div class="col-span-2 w-full md:w-auto text-left flex md:flex-col items-center md:items-start justify-between md:justify-center">
                                        <div class="md:hidden text-[9px] font-black uppercase text-slate-400 tracking-widest">${state.lang === 'ru' ? 'ВРЕМЯ' : 'VAQT'}</div>
                                        <div>
                                            <div class="font-bold text-slate-700 text-xs sm:text-sm">${formatDate(s.displayTimestamp || s.timestamp)}</div>
                                            <div class="text-[10px] font-semibold text-slate-400 mt-0.5 flex items-center gap-1">
                                                <i class="w-3 h-3 text-slate-350" data-lucide="clock"></i>
                                                ${new Date(s.displayTimestamp || s.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Column 2: Products List -->
                                    <div class="col-span-5 w-full text-left flex flex-col gap-1">
                                        <div class="md:hidden text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">${state.lang === 'ru' ? 'ТОВАРЫ' : 'MAHSULOTLAR'}</div>
                                        <div class="bg-slate-50/55 p-2 sm:p-2.5 rounded-xl border border-slate-100 flex flex-col gap-1 shadow-inner">
                                            ${s.items.length > 0 
                                                ? s.items.map(i => `
                                                    <div class="flex justify-between items-center text-xs text-slate-700 gap-2">
                                                        <div class="font-semibold text-slate-800 flex items-center gap-1 min-w-0">
                                                            <span class="w-1.5 h-1.5 rounded-full bg-slate-350 flex-shrink-0 animate-pulse"></span>
                                                            <span class="truncate min-w-0">${i.name}</span>
                                                            <span class="text-accent font-black bg-orange-50 px-1 py-0.2 rounded text-[9px] flex-shrink-0">x${i.qty}</span>
                                                        </div>
                                                        <span class="font-black text-slate-500 whitespace-nowrap text-xs">${formatPrice(i.price * i.qty)}</span>
                                                    </div>
                                                `).join('')
                                                : `
                                                    <div class="italic text-xs font-bold text-amber-600 flex items-center gap-1">
                                                        <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                                        ${s.paymentType === 'Уплочен' ? (state.lang === 'ru' ? 'Оплата старого долга 💳' : "Eski qarz to'lovi 💳") : '—'}
                                                    </div>
                                                `
                                            }
                                        </div>
                                    </div>

                                    <!-- Column 3: Payment Status -->
                                    <div class="col-span-2 w-full md:w-auto flex md:flex-col items-center md:justify-center justify-between py-1 md:py-0 border-y md:border-y-0 border-slate-100">
                                        <div class="md:hidden text-[9px] font-black uppercase text-slate-400 tracking-widest">${state.lang === 'ru' ? 'СТАТУС' : 'HOLAT'}</div>
                                        ${(() => {
                                            const colors = {
                                                'cash': 'text-emerald-700 bg-emerald-50 border-emerald-150',
                                                'card': 'text-blue-700 bg-blue-50 border-blue-150',
                                                'debt': 'text-red-700 bg-red-50 border-red-150',
                                                'Уплочен': 'text-amber-700 bg-amber-50 border-amber-150'
                                            };
                                            const labels = { 
                                                'cash': (state.lang === 'ru' ? 'Наличные' : 'Naqd'), 
                                                'card': (state.lang === 'ru' ? 'Карта' : 'Karta'), 
                                                'debt': (state.lang === 'ru' ? 'Долг' : 'Qarz'), 
                                                'Уплочен': (state.lang === 'ru' ? 'Погашен' : 'To\'langan') 
                                            };
                                            return `<span class="px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest border shadow-sm ${colors[s.paymentType] || 'text-slate-400'}">${labels[s.paymentType] || s.paymentType}</span>`;
                                        })()}
                                    </div>

                                    <!-- Column 4: Total & Actions -->
                                    <div class="col-span-3 w-full flex flex-row md:flex-col justify-between items-center md:items-end gap-2">
                                        <div class="md:hidden text-[9px] font-black uppercase text-slate-400 tracking-widest">${state.lang === 'ru' ? 'ИТОГ' : 'JAMI'}</div>
                                        <div class="text-right flex flex-col md:items-end">
                                            <span class="text-xs sm:text-sm font-extrabold text-slate-950 leading-none mt-1">${formatPrice(s.total)}</span>
                                        </div>
                                        <div class="flex gap-1.5 transition-all">
                                            <button onclick="editSale('${s.id}')" class="p-1.5 bg-slate-50 text-slate-400 hover:text-accent hover:bg-orange-50 rounded-lg transition-all shadow-sm border border-slate-100 flex items-center justify-center">
                                                <i class="w-3.5 h-3.5" data-lucide="edit-3"></i>
                                            </button>
                                            <button onclick="deleteSale('${s.id}')" class="p-1.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shadow-sm border border-slate-100 flex items-center justify-center">
                                                <i class="w-3.5 h-3.5" data-lucide="trash-2"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                `;
                            }
                        }).join('')}
                        ${closedDeals.length === 0 ? `
                            <div class="bg-white p-16 text-center text-slate-350 italic rounded-3xl border border-slate-200 shadow-inner">
                                ${t('no_records')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- Active Debtors Breakdown -->
            <div class="space-y-2.5 sm:space-y-3">
                <div class="flex justify-between items-end ml-1">
                    <h3 class="text-xs sm:text-sm font-black uppercase italic text-slate-500 flex items-center gap-1.5">
                        <i data-lucide="users" class="w-4 h-4 text-red-500"></i> ${t('current_debtors')}
                    </h3>
                </div>
                
                <div class="hidden md:grid grid-cols-12 gap-3 sm:gap-4 px-4 py-2.5 bg-slate-50 border border-slate-200 border-l-4 border-l-transparent text-[9.5px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest rounded-xl">
                    <div class="col-span-2">${t('client')}</div>
                    <div class="col-span-4">${t('products')}</div>
                    <div class="col-span-2 text-right">${t('total')}</div>
                    <div class="col-span-2 text-right whitespace-nowrap">${state.lang === 'ru' ? 'ПОГАШЕНО' : t('repaid')}</div>
                    <div class="col-span-2 text-right">${state.lang === 'ru' ? 'ОСТАТОК' : t('remaining')}</div>
                </div>

                <div class="space-y-2.5 sm:space-y-3">
                    ${activeDebtors.map(d => `
                        <div class="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all group flex flex-col md:grid md:grid-cols-12 gap-2.5 sm:gap-4 items-center relative">
                            <!-- Client details -->
                            <div class="col-span-2 w-full md:w-auto text-left flex md:flex-col items-center md:items-start justify-between md:justify-center">
                                <div class="md:hidden text-[9px] font-black uppercase text-slate-400 tracking-widest">${t('client')}</div>
                                <div class="flex items-center gap-2.5">
                                    <div class="w-8 h-8 rounded-xl bg-red-50 text-red-500 font-extrabold flex items-center justify-center border border-red-100 flex-shrink-0">
                                        <i data-lucide="user" class="w-4 h-4"></i>
                                    </div>
                                    <div>
                                        <button onclick="openDebtModal('${d.name.replace(/'/g, "\\'")}')" class="font-black text-slate-800 text-xs sm:text-sm hover:text-red-500 hover:underline text-left transition-colors">
                                            ${d.name}
                                        </button>
                                        <div class="text-[9px] font-black text-red-500/95 tracking-widest mt-0.5 uppercase">${state.lang === 'ru' ? 'ДОЛЖНИК' : 'QARZDOR'}</div>
                                    </div>
                                </div>
                            </div>

                            <!-- Debt products list -->
                            <div class="col-span-4 w-full text-left flex flex-col gap-1">
                                <div class="md:hidden text-[9px] font-black uppercase text-slate-400 tracking-widest mb-0.5">${t('products')}</div>
                                <div class="bg-slate-50/55 p-2 sm:p-2.5 rounded-xl border border-slate-100 flex flex-col gap-1 shadow-inner">
                                    ${d.products.length > 0 
                                        ? d.products.map(i => `
                                            <div class="flex justify-between items-center text-xs text-slate-700 gap-2">
                                                <div class="font-semibold text-slate-800 flex items-center gap-1 min-w-0">
                                                    <span class="w-1.5 h-1.5 rounded-full bg-slate-350 flex-shrink-0 animate-pulse"></span>
                                                    <span class="truncate min-w-0">${i.name}</span>
                                                    <span class="text-accent font-black bg-orange-50 px-1 py-0.2 rounded text-[9px] flex-shrink-0">x${i.qty}</span>
                                                </div>
                                                <span class="font-black text-slate-500 whitespace-nowrap text-xs">${formatPrice(i.price * i.qty)}</span>
                                            </div>
                                        `).join('')
                                        : `
                                            <div class="italic text-xs font-bold text-slate-400 flex items-center gap-1">
                                                <span class="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
                                                ${state.lang === 'ru' ? 'Старая задолженность' : 'Eski qarz summasi'}
                                            </div>
                                        `
                                    }
                                </div>
                            </div>

                            <!-- Total Debt -->
                            <div class="col-span-2 w-full md:w-auto flex md:flex-col items-center md:items-end justify-between py-1 md:py-0 border-y md:border-y-0 border-slate-100">
                                <div class="md:hidden text-[9px] font-black uppercase text-slate-400 tracking-widest">${t('total')}</div>
                                <div class="text-right flex flex-col md:items-end w-full">
                                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 hidden md:block">Всего долг</span>
                                    <span class="text-xs font-semibold text-slate-500">${formatPrice(d.totalDebt)}</span>
                                </div>
                            </div>

                            <!-- Repaid -->
                            <div class="col-span-2 w-full md:w-auto flex md:flex-col items-center md:items-end justify-between py-1 md:py-0 border-b md:border-b-0 border-slate-100">
                                <div class="md:hidden text-[9px] font-black uppercase text-slate-400 tracking-widest">${state.lang === 'ru' ? 'ПОГАШЕНО' : t('repaid')}</div>
                                <div class="text-right flex flex-col md:items-end w-full">
                                    <span class="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1 hidden md:block">${state.lang === 'ru' ? 'ПОГАШЕНО' : t('repaid')}</span>
                                    <span class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                                        ${formatPrice(d.totalPaid)}
                                    </span>
                                </div>
                            </div>

                            <!-- Remaining Debt/Balance -->
                            <div class="col-span-2 w-full flex flex-row md:flex-col justify-between items-center md:items-end gap-2">
                                <div class="md:hidden text-[9px] font-black uppercase text-slate-400 tracking-widest">${state.lang === 'ru' ? 'ОСТАТОК' : t('remaining')}</div>
                                <div class="text-right flex flex-col md:items-end w-full">
                                    <span class="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1 hidden md:block">${state.lang === 'ru' ? 'ОСТАТОК' : t('remaining')}</span>
                                    <span class="text-xs sm:text-sm font-extrabold text-red-600 leading-none">${formatPrice(d.balance)}</span>
                                </div>
                                <div class="flex gap-1.5 transition-all">
                                    <button onclick="openDebtModal('${d.name.replace(/'/g, "\\'")}')" class="p-1.5 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shadow-sm border border-slate-100 flex items-center justify-center" title="${state.lang === 'ru' ? 'Детали долгов' : 'Qarz tafsilotlari'}">
                                        <i class="w-3.5 h-3.5" data-lucide="edit-3"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    ${activeDebtors.length === 0 ? `
                        <div class="bg-white p-16 text-center text-slate-350 italic rounded-3xl border border-slate-200 shadow-inner">
                            ${state.lang === 'ru' ? 'Никто не должен' : 'Hozircha qarzlar yo\'q'}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
};

window.deleteSale = (id) => {
    const modal = document.getElementById('modal-container');
    const rootLabel = state.lang === 'ru' ? 'Доступ' : 'Ruxsat';
    const enterPinLabel = state.lang === 'ru' ? 'Введите PIN-код' : 'PIN-kodni kiriting';
    modal.innerHTML = `
        <div onclick="if(event.target===this) document.getElementById('modal-container').innerHTML=''" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
            <div class="bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md text-center transform transition-all animate-in fade-in zoom-in duration-200 max-h-[calc(100dvh-16px)] flex flex-col overflow-hidden my-auto">
                <div class="w-10 h-10 sm:w-14 sm:h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 flex-shrink-0">
                    <i data-lucide="lock" class="w-5 h-5 sm:w-7 sm:h-7"></i>
                </div>
                <h2 class="text-base sm:text-lg font-black uppercase italic text-slate-800 tracking-wide flex-shrink-0">${rootLabel}</h2>
                <p class="text-slate-400 text-xs mb-3 sm:mb-4 mt-1 font-bold uppercase tracking-widest flex-shrink-0">${enterPinLabel}</p>
                
                <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar my-2">
                    <input 
                        id="delete-pin-input" 
                        type="password" 
                        inputmode="numeric" 
                        maxlength="4" 
                        placeholder="••••" 
                        class="w-full text-center text-2xl sm:text-3xl font-black tracking-[0.5em] py-2.5 sm:py-3 bg-slate-50 border border-slate-150 rounded-2xl outline-none focus:border-red-500 focus:bg-white transition-all shadow-inner min-h-[44px]"
                        autofocus
                    >
                </div>
                
                <div class="flex gap-2 sm:gap-3 flex-shrink-0 pt-2 border-t border-slate-100">
                    <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-3 border border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all min-h-[44px] flex items-center justify-center">${t('cancel')}</button>
                    <button onclick="confirmDeleteSale('${id}')" class="flex-1 py-3 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-100 hover:bg-red-700 transition-all min-h-[44px] flex items-center justify-center">OK</button>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
    const pinInput = document.getElementById('delete-pin-input');
    if (pinInput) pinInput.focus();
};

window.confirmDeleteSale = async (id) => {
    const pinInput = document.getElementById('delete-pin-input');
    const pin = pinInput ? pinInput.value : '';
    if (pin === '1111') {
        if (id.toString().startsWith('pmt-')) {
            const timestamp = parseInt(id.toString().replace('pmt-', ''));
            state.debts.forEach(c => {
                const oldLen = c.transactions.length;
                c.transactions = c.transactions.filter(t => t.timestamp !== timestamp);
                if (c.transactions.length !== oldLen) showToast(state.lang === 'ru' ? 'Оплата удалена' : 'To\'lov o\'chirildi');
            });
        } else {
            const saleToRemove = state.sales.find(s => String(s.id) === String(id));
            if (saleToRemove) {
                if (saleToRemove.paymentType === 'debt') {
                    state.debts.forEach(c => {
                        c.transactions = c.transactions.filter(t => String(t.saleId) !== String(id));
                    });
                    state.debts = state.debts.filter(c => c.transactions.length > 0);
                }
                state.sales = state.sales.filter(s => String(s.id) !== String(id));
                showToast(state.lang === 'ru' ? 'Продажа удалена' : 'Sotuv o\'chirildi');
            }
        }
        await saveState();
        render();
        document.getElementById('modal-container').innerHTML = '';
    } else {
        showToast(state.lang === 'ru' ? '❌ Неверный код' : '❌ PIN noto\'g\'ri');
        if (pinInput) {
            pinInput.value = '';
            pinInput.classList.add('border-red-500', 'animate-shake');
            setTimeout(() => pinInput.classList.remove('animate-shake'), 500);
        }
    }
};

window.setEditPaymentType = (type) => {
    state.tempEdit.paymentType = type;
    const container = document.getElementById('edit-client-name-container');
    if (type === 'debt') {
        container?.classList.remove('hidden');
    } else {
        container?.classList.add('hidden');
    }
    ['cash', 'card', 'debt'].forEach(tKey => {
        const btn = document.getElementById(`edit-pmt-btn-${tKey}`);
        if (btn) {
            if (tKey === type) {
                btn.className = 'flex-1 py-1.5 text-[9px] font-black uppercase rounded-md transition-all bg-accent text-white shadow-sm min-h-[36px] flex items-center justify-center';
            } else {
                btn.className = 'flex-1 py-1.5 text-[9px] font-black uppercase rounded-md transition-all text-slate-500 hover:text-slate-400 bg-slate-50 border border-slate-100 min-h-[36px] flex items-center justify-center';
            }
        }
    });
};

window.editSale = (id) => {
    const isPmt = id.toString().startsWith('pmt-');
    let currentAmount = 0;
    let currentName = '';
    
    if (isPmt) {
        const timestamp = parseInt(id.toString().replace('pmt-', ''));
        const c = state.debts.find(d => d.transactions.some(t => t.timestamp === timestamp));
        if (!c) return;
        const tItem = c.transactions.find(tItem => tItem.timestamp === timestamp);
        currentAmount = tItem.amount;
        currentName = state.lang === 'ru' ? `Оплата от ${c.clientName}` : `To'lov (mijoz: ${c.clientName})`;
    } else {
        const s = state.sales.find(s => String(s.id) === String(id));
        if (!s) return;
        currentAmount = s.total;
        currentName = s.items.map(i => i.name).join(', ');
        
        state.tempEdit = {
            paymentType: s.paymentType,
            clientName: s.clientName || ''
        };
    }

    const modal = document.getElementById('modal-container');
    const changeHeading = state.lang === 'ru' ? 'Изменить' : 'Tahrirlash';
    const qtyHeading = state.lang === 'ru' ? 'Продажа' : 'Sotuv';
    const payTypeHeading = state.lang === 'ru' ? 'Тип оплаты' : 'To\'lov turi';
    const debtorNameHeading = state.lang === 'ru' ? 'Имя должника' : 'Qarzdor ismi';
    modal.innerHTML = `
        <div onclick="if(event.target===this) document.getElementById('modal-container').innerHTML=''" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
            <div class="bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md md:max-w-lg text-center transform transition-all animate-in fade-in zoom-in duration-300 max-h-[calc(100dvh-16px)] flex flex-col overflow-hidden my-auto">
                <div class="w-10 h-10 sm:w-14 sm:h-14 bg-orange-100 text-accent rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 flex-shrink-0">
                    <i data-lucide="edit-3" class="w-5 h-5 sm:w-7 sm:h-7"></i>
                </div>
                <h2 class="text-sm sm:text-base md:text-lg font-black uppercase italic text-slate-800 tracking-wide flex-shrink-0">${changeHeading}</h2>
                <p class="text-slate-400 text-xs mb-3 sm:mb-4 mt-1 font-bold leading-tight flex-shrink-0 truncate">${qtyHeading}: <span class="text-slate-700">${currentName}</span></p>
                
                <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-3 sm:space-y-4 p-1">
                    <div class="space-y-1">
                        <label class="text-xs font-black tracking-widest text-slate-400 uppercase block text-left ml-1">${t('expense_amount_placeholder')}</label>
                        <div class="relative">
                            <input 
                                id="edit-amount-input" 
                                type="text" 
                                inputmode="numeric" 
                                value="${formatNumberString(currentAmount)}" 
                                oninput="handleNumericInput(this)" 
                                class="w-full text-center text-xl sm:text-2xl font-black py-2.5 sm:py-3 bg-slate-50 border border-slate-150 rounded-2xl outline-none focus:border-accent focus:bg-white transition-all pl-10 pr-10 shadow-inner min-h-[44px]"
                                onkeydown="if(event.key === 'Enter') confirmEditSale('${id}')"
                            >
                            <span class="absolute right-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs sm:text-sm">${state.settings.currency}</span>
                        </div>
                    </div>

                    ${!isPmt ? `
                    <div class="space-y-1.5">
                        <div class="text-xs font-black tracking-widest text-slate-400 uppercase block text-left ml-1">${payTypeHeading}</div>
                        <div class="flex gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                            ${['cash', 'card', 'debt'].map(tKey => {
                                const active = state.tempEdit.paymentType === tKey;
                                const btnLabel = tKey === 'cash' ? (state.lang === 'ru' ? 'Нал' : 'Naqd') : tKey === 'card' ? (state.lang === 'ru' ? 'Карта' : 'Karta') : (state.lang === 'ru' ? 'Долг' : 'Qarz');
                                return `<button type="button" id="edit-pmt-btn-${tKey}" onclick="setEditPaymentType('${tKey}')" class="flex-1 py-2 text-xs font-black uppercase rounded-xl transition-all min-h-[38px] flex items-center justify-center ${active ? 'bg-accent text-white shadow-sm' : 'text-slate-500 hover:text-slate-400 bg-slate-50 border border-slate-100'}">${btnLabel}</button>`;
                            }).join('')}
                        </div>
                    </div>
                    <div id="edit-client-name-container" class="space-y-1.5 ${state.tempEdit.paymentType === 'debt' ? '' : 'hidden'}">
                        <label class="text-xs font-black tracking-widest text-slate-400 uppercase block text-left ml-1">${debtorNameHeading}</label>
                        <input id="edit-client-name-input" type="text" value="${state.tempEdit.clientName}" placeholder="${t('client_name_placeholder')}" class="w-full bg-slate-50 border border-slate-150 px-4 py-2.5 sm:py-3 text-sm rounded-xl outline-none focus:border-accent font-bold text-slate-700 min-h-[44px]">
                    </div>
                    ` : ''}
                </div>
                
                <div class="flex gap-2 sm:gap-3 flex-shrink-0 pt-2 border-t border-slate-100 sticky bottom-0 bg-white">
                    <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-3 border border-slate-200 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all min-h-[44px] flex items-center justify-center">${t('cancel')}</button>
                    <button onclick="confirmEditSale('${id}')" class="flex-1 py-3 bg-accent text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all min-h-[44px] flex items-center justify-center">${t('save')}</button>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
    const amountInput = document.getElementById('edit-amount-input');
    if (amountInput) amountInput.focus();
};

window.confirmEditSale = async (id) => {
    const isPmt = id.toString().startsWith('pmt-');
    const inputVal = document.getElementById('edit-amount-input').value;
    const newAmount = parseNumber(inputVal);

    if (isNaN(newAmount) || inputVal.trim() === '') {
        showToast('❌ ' + t('summa_error'));
        return;
    }

    if (isPmt) {
        const timestamp = parseInt(id.toString().replace('pmt-', ''));
        const c = state.debts.find(d => d.transactions.some(t => t.timestamp === timestamp));
        if (!c) return;
        const tItem = c.transactions.find(tItem => tItem.timestamp === timestamp);
        if (tItem) tItem.amount = newAmount;
    } else {
        const s = state.sales.find(s => String(s.id) === String(id));
        if (!s) return;

        const newPmtType = state.tempEdit.paymentType;
        let newClientName = undefined;

        if (newPmtType === 'debt') {
            const nameInput = document.getElementById('edit-client-name-input');
            newClientName = nameInput ? nameInput.value.trim() : '';
            if (!newClientName) {
                showToast('❌ ' + t('enter_client_name_toast'));
                return;
            }
        }

        s.total = newAmount;
        s.paymentType = newPmtType;
        s.clientName = newClientName;

        // Clear old transactions associated with this sale
        state.debts.forEach(c => {
            c.transactions = c.transactions.filter(t => String(t.saleId) !== String(id));
        });
        state.debts = state.debts.filter(c => c.transactions.length > 0);

        // Add debt transaction if payment type is debt
        if (s.paymentType === 'debt' && s.clientName) {
            let client = state.debts.find(c => c.clientName === s.clientName);
            if (!client) {
                client = { clientName: s.clientName, transactions: [] };
                state.debts.push(client);
            }
            client.transactions.push({
                type: 'debt',
                amount: s.total,
                timestamp: s.timestamp,
                saleId: s.id,
                items: JSON.parse(JSON.stringify(s.items || []))
            });
        }

        if (s.items && s.items.length === 1) {
            s.items[0].price = s.total / s.items[0].qty;
        }
    }
    await saveState();
    render();
    document.getElementById('modal-container').innerHTML = '';
    showToast(t('changes_saved'));
};
