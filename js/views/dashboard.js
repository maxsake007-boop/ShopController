// --- DASHBOARD (ANALYTICS & EXPENSES) VIEW ---

let barChartInstance = null;
let doughnutChartInstance = null;

window.renderDashboard = () => {
    const stats = getStats(state.dashboard.filter);
    const startTime = getStartTime(state.dashboard.filter);
    const filteredExpenses = state.expenses.filter(e => e.timestamp >= startTime).sort((a, b) => b.timestamp - a.timestamp);

    return `
        <div class="space-y-3 sm:space-y-4 pb-16">
            <div class="flex justify-between items-center gap-2">
                <h2 class="text-xs sm:text-base font-black uppercase italic text-slate-800 tracking-wider flex items-center gap-2">
                    <i data-lucide="layout-dashboard" class="w-4 h-4 sm:w-5 sm:h-5 text-accent"></i> ${t('dashboard')}
                </h2>
                <div class="flex bg-white p-0.5 border border-slate-200 rounded-xl text-[10px] sm:text-xs font-black uppercase overflow-x-auto">
                    ${['today', 'week', 'month', 'quarter', 'year'].map(f => {
                        const labels = {
                            'today': t('for_today'),
                            'week': t('for_week'),
                            'month': t('for_month'),
                            'quarter': t('for_quarter'),
                            'year': t('for_year')
                        };
                        return `
                            <button onclick="state.dashboard.filter='${f}'; render()" class="px-2.5 py-1 rounded-lg transition-all whitespace-nowrap min-h-[32px] flex items-center justify-center ${state.dashboard.filter === f ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}">${labels[f]}</button>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <!-- KPI Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                <div class="bg-white p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-150 shadow-sm flex flex-col justify-between h-16 sm:h-20 dashboard-kpi-card">
                     <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest">${t('revenue')}</div>
                     <div class="text-xs sm:text-base md:text-lg font-black text-slate-800 leading-none truncate">${formatPrice(stats.revenue)}</div>
                </div>
                <div class="bg-emerald-50/40 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between h-16 sm:h-20 dashboard-kpi-card">
                     <div class="text-[9px] font-black text-emerald-600/70 uppercase tracking-widest">${t('profit')}</div>
                     <div class="text-xs sm:text-base md:text-lg font-black text-emerald-700 leading-none truncate">${formatPrice(stats.profit)}</div>
                </div>
                <div class="bg-red-50/40 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-red-100 shadow-sm flex flex-col justify-between h-16 sm:h-20 dashboard-kpi-card">
                     <div class="text-[9px] font-black text-red-600/70 uppercase tracking-widest">${t('expenses')}</div>
                     <div class="text-xs sm:text-base md:text-lg font-black text-red-700 leading-none truncate">${formatPrice(stats.totalExpenses)}</div>
                </div>
                <div class="bg-indigo-50/40 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-indigo-100 shadow-sm flex flex-col justify-between h-16 sm:h-20 dashboard-kpi-card">
                     <div class="text-[9px] font-black text-indigo-600/70 uppercase tracking-widest">${t('net_profit')}</div>
                     <div class="text-xs sm:text-base md:text-lg font-black text-indigo-800 leading-none truncate">${formatPrice(stats.netProfit)}</div>
                </div>
            </div>
            
            <!-- Charts Section -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
                <div class="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 md:col-span-8 min-h-[300px] h-[320px] flex flex-col shadow-sm dashboard-chart-card">
                    <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1.5">
                        <i data-lucide="trending-up" class="w-3.5 h-3.5 text-accent"></i> ${state.lang === 'ru' ? 'График продаж' : 'Sotuvlar grafigi'}${state.dashboard.filter === 'week' ? ` (W${getWeekNumber(Date.now())})` : ''}
                    </h3>
                    <div class="flex-1 min-h-0 relative"><canvas id="barChart"></canvas></div>
                </div>
                <div class="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 md:col-span-4 min-h-[300px] h-[320px] flex flex-col shadow-sm dashboard-chart-card">
                    <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 sm:mb-2 flex items-center gap-1.5">
                        <i data-lucide="pie-chart" class="w-3.5 h-3.5 text-accent"></i> ${state.lang === 'ru' ? 'Способы оплаты' : 'To\'lov turlari'}
                    </h3>
                    <div class="flex-1 min-h-0 relative flex items-center justify-center"><canvas id="doughnutChart"></canvas></div>
                </div>
            </div>

            <!-- Personal Expenses -->
            <div class="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                    <h3 class="font-black text-xs text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <i data-lucide="calculator" class="w-3.5 h-3.5 text-accent"></i> ${t('personal_expenses')}
                    </h3>
                </div>

                <div class="flex flex-col sm:flex-row gap-2 sm:gap-2.5">
                     <input type="text" inputmode="numeric" placeholder="${t('expense_amount_placeholder')}" class="w-full sm:w-1/3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-accent min-h-[38px]" value="${formatNumberString(state.dashboard.expenseAmount)}" oninput="handleNumericInput(this); state.dashboard.expenseAmount=this.value">
                     <input type="text" placeholder="${t('expense_note_placeholder')}" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-accent min-h-[38px]" value="${state.dashboard.expenseNote || ''}" oninput="state.dashboard.expenseNote=this.value">
                     <button onclick="addExpense()" class="bg-slate-900 text-white rounded-xl py-2 px-5 font-bold uppercase text-xs hover:bg-black active:scale-95 transition-all shadow-md min-h-[38px] flex items-center justify-center">${t('add')}</button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                    ${filteredExpenses.map(e => `
                        <div class="bg-slate-50/50 p-2.5 sm:p-3 rounded-lg border border-slate-200 flex justify-between items-center group hover:border-slate-300 transition-all shadow-sm">
                            <div class="truncate mr-2 max-w-[85%]">
                                <div class="text-xs sm:text-sm font-black text-slate-800 leading-none">${formatPrice(e.amount)}</div>
                                ${e.note ? `<div class="text-[11px] text-slate-500 font-semibold truncate mt-0.5" title="${e.note}">${e.note}</div>` : ''}
                                <div class="text-[9px] text-slate-400 font-black uppercase tracking-wider mt-0.5">${formatDate(e.timestamp)}</div>
                            </div>
                            <button onclick="deleteExpense('${e.id}')" class="text-slate-300 hover:text-red-500 opacity-30 group-hover:opacity-100 transition-all flex-shrink-0 p-1">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    `).join('')}
                    ${filteredExpenses.length === 0 ? `<div class="col-span-full py-6 text-center text-slate-300 italic text-[11px] font-black uppercase tracking-widest">${t('no_records')}</div>` : ''}
                </div>
            </div>
        </div>
    `;
};

window.addExpense = async () => {
    const amount = parseNumber(state.dashboard.expenseAmount);
    if (isNaN(amount) || amount <= 0) {
        showToast(`❌ ${t('summa_error')}`);
        return;
    }
    state.expenses.unshift({
        id: Date.now().toString(),
        amount,
        note: (state.dashboard.expenseNote || '').trim(),
        timestamp: Date.now()
    });
    state.dashboard.expenseAmount = '';
    state.dashboard.expenseNote = '';
    await saveState();
    render();
    showToast(`✅ ${t('expense_added_toast')}`);
};

window.deleteExpense = (id) => {
    const m = document.getElementById('modal-container');
    const title = state.lang === 'ru' ? 'Удалить запись?' : 'Yozuvni o\'chirish?';
    const text = state.lang === 'ru' ? 'Вы уверены, что хотите удалить этот расход?' : 'Ushbu xarajatni o\'chirishni xohlaysizmi?';
    const btnCancel = t('cancel');
    const btnDelete = state.lang === 'ru' ? 'Удалить' : 'O\'chirish';

    m.innerHTML = `
        <div onclick="if(event.target===this) document.getElementById('modal-container').innerHTML=''" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
            <div class="bg-white p-4 sm:p-6 md:p-8 rounded-3xl shadow-2xl w-full max-w-md text-center animate-in scale-in max-h-[calc(100dvh-16px)] flex flex-col overflow-hidden my-auto">
                <div class="w-10 h-10 sm:w-14 sm:h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4 flex-shrink-0">
                    <i data-lucide="trash-2" class="w-5 h-5 sm:w-7 sm:h-7"></i>
                </div>
                <h3 class="text-sm sm:text-base md:text-lg font-black uppercase italic text-slate-800 flex-shrink-0">${title}</h3>
                <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar my-2">
                    <p class="text-slate-400 text-xs sm:text-sm uppercase font-semibold tracking-wider leading-relaxed">${text}</p>
                </div>
                <div class="flex gap-2 sm:gap-3 flex-shrink-0 pt-2 border-t border-slate-100">
                     <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 py-3 px-4 border border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-50 transition-all uppercase text-xs tracking-widest min-h-[44px] flex items-center justify-center">${btnCancel}</button>
                     <button onclick="confirmDeleteExpense('${id}')" class="flex-1 py-3 px-4 bg-red-600 text-white rounded-2xl font-black hover:bg-red-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-red-100 min-h-[44px] flex items-center justify-center">${btnDelete}</button>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
};

window.confirmDeleteExpense = async (id) => {
    state.expenses = state.expenses.filter(e => String(e.id) !== String(id));
    await saveState();
    const modalEl = document.getElementById('modal-container');
    if (modalEl) modalEl.innerHTML = '';
    render();
    showToast(state.lang === 'ru' ? 'Расход удален' : 'Xarajat o\'chirildi');
};

// Safe Chart.js initialization preventing memory leaks and canvas conflicts
window.initCharts = () => {
    const ctxBar = document.getElementById('barChart');
    const ctxPie = document.getElementById('doughnutChart');
    if (!ctxBar || !ctxPie) return;

    // Destroy existing chart instances to prevent leaks and canvas conflict
    if (barChartInstance) {
        barChartInstance.destroy();
        barChartInstance = null;
    }
    if (doughnutChartInstance) {
        doughnutChartInstance.destroy();
        doughnutChartInstance = null;
    }

    const startTime = getStartTime(state.dashboard.filter);
    const closedDealsForCharts = getClosedDeals(startTime);

    let chartLabels = [];
    let chartData = [];
    
    if (state.dashboard.filter === 'today') {
        for (let i = 0; i < 24; i++) {
            chartLabels.push(`${i}:00`);
        }
        chartData = chartLabels.map((_, h) => {
            const start = new Date();
            start.setHours(h, 0, 0, 0);
            const end = new Date(start);
            end.setHours(h + 1);
            return closedDealsForCharts
                .filter(s => s.timestamp >= start.getTime() && s.timestamp < end.getTime())
                .reduce((sum, s) => sum + s.total, 0);
        });
    } else if (state.dashboard.filter === 'week') {
        chartLabels = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
        
        const now = new Date();
        const currentDay = now.getDay();
        const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        chartData = [...Array(7)].map((_, i) => {
            const startDay = new Date(startOfWeek);
            startDay.setDate(startOfWeek.getDate() + i);
            startDay.setHours(0, 0, 0, 0);
            
            const endDay = new Date(startDay);
            endDay.setDate(startDay.getDate() + 1);
            
            return closedDealsForCharts
                .filter(s => s.timestamp >= startDay.getTime() && s.timestamp < endDay.getTime())
                .reduce((sum, s) => sum + s.total, 0);
        });
    } else if (state.dashboard.filter === 'month') {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const shortMonths = state.lang === 'uz' 
            ? ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"]
            : ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
        
        const startOfMonth = new Date(year, month, 1);
        startOfMonth.setHours(0, 0, 0, 0);

        chartLabels = [...Array(daysInMonth)].map((_, i) => {
            const d = new Date(startOfMonth);
            d.setDate(startOfMonth.getDate() + i);
            return `${d.getDate()} ${shortMonths[d.getMonth()]}`;
        });

        chartData = [...Array(daysInMonth)].map((_, i) => {
            const startDay = new Date(startOfMonth);
            startDay.setDate(startOfMonth.getDate() + i);
            startDay.setHours(0, 0, 0, 0);
            
            const endDay = new Date(startDay);
            endDay.setDate(startDay.getDate() + 1);
            
            return closedDealsForCharts
                .filter(s => s.timestamp >= startDay.getTime() && s.timestamp < endDay.getTime())
                .reduce((sum, s) => sum + s.total, 0);
        });
    } else if (state.dashboard.filter === 'quarter') {
        const now = new Date();
        const currentQuarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        const shortMonths = state.lang === 'uz' 
            ? ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"]
            : ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
        
        chartLabels = [
            shortMonths[currentQuarterStartMonth],
            shortMonths[currentQuarterStartMonth + 1],
            shortMonths[currentQuarterStartMonth + 2]
        ];
        
        chartData = [0, 1, 2].map(offset => {
            const m = currentQuarterStartMonth + offset;
            const start = new Date(now.getFullYear(), m, 1);
            start.setHours(0, 0, 0, 0);
            const end = new Date(now.getFullYear(), m + 1, 1);
            end.setHours(0, 0, 0, 0);
            return closedDealsForCharts
                .filter(s => s.timestamp >= start.getTime() && s.timestamp < end.getTime())
                .reduce((sum, s) => sum + s.total, 0);
        });
    } else { // 'year'
        const now = new Date();
        const shortMonths = state.lang === 'uz' 
            ? ["Yan", "Fev", "Mar", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"]
            : ["Янв", "Фев", "Мар", "Апр", "Май", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
        
        chartLabels = shortMonths;
        
        chartData = [...Array(12)].map((_, m) => {
            const start = new Date(now.getFullYear(), m, 1);
            start.setHours(0, 0, 0, 0);
            const end = new Date(now.getFullYear(), m + 1, 1);
            end.setHours(0, 0, 0, 0);
            return closedDealsForCharts
                .filter(s => s.timestamp >= start.getTime() && s.timestamp < end.getTime())
                .reduce((sum, s) => sum + s.total, 0);
        });
    }

    const isQuarter = state.dashboard.filter === 'quarter';
    barChartInstance = new Chart(ctxBar, {
        type: isQuarter ? 'bar' : 'line',
        data: {
            labels: chartLabels,
            datasets: [{ 
                label: state.lang === 'ru' ? 'Выручка' : 'Kirim', 
                data: chartData, 
                borderColor: '#FF6B00', 
                tension: 0.4, 
                fill: !isQuarter, 
                backgroundColor: isQuarter ? 'rgba(255, 107, 0, 0.85)' : 'rgba(255, 107, 0, 0.1)', 
                borderWidth: isQuarter ? 0 : 3, 
                pointRadius: isQuarter ? 0 : 4, 
                pointBackgroundColor: '#FF6B00',
                borderRadius: isQuarter ? 16 : 0,
                maxBarThickness: isQuarter ? 48 : undefined
            }]
        },
        options: { 
            maintainAspectRatio: false, 
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });

    // Payment types for doughnut chart
    const types = { cash: 0, card: 0, Уплочен: 0 };
    closedDealsForCharts.forEach(s => { 
        if (s.paymentType === 'cash' || s.paymentType === 'card' || s.paymentType === 'Уплочен') {
            types[s.paymentType] += s.total; 
        }
    });

    const pieLabels = state.lang === 'ru' 
        ? ['Наличные', 'Карта', 'Погашение долгов'] 
        : ['Naqd', 'Karta', 'Qarz to\'lovlari'];

    doughnutChartInstance = new Chart(ctxPie, {
        type: 'doughnut',
        data: {
            labels: pieLabels,
            datasets: [{ 
                data: [types.cash, types.card, types.Уплочен], 
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b'], 
                borderWidth: 0, 
                hoverOffset: 10 
            }]
        },
        options: { 
            maintainAspectRatio: false, 
            cutout: '75%', 
            plugins: { 
                legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 10, weight: 'bold' } } } 
            } 
        }
    });
};
