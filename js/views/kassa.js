// --- KASSA (POS) VIEW ---

window.renderKassa = () => {
    const kassaProducts = state.products.filter(p => p.stock > 0);
    const total = state.kassa.order.reduce((s, i) => s + (i.price * i.qty), 0);
    const totalQty = state.kassa.order.reduce((s, i) => s + i.qty, 0);
    const searchQuery = (state.kassa.search || '').toLowerCase();
    const isMobileCartActive = state.kassa.mobileTab === 'cart';
    
    return `
        <div class="flex flex-col sm:flex-row h-full gap-2.5 sm:gap-4 lg:gap-6 min-h-0 overflow-hidden relative kassa-container">
            
            <!-- Mobile View Switcher (Portrait phones only) -->
            <div class="sm:hidden flex bg-slate-200/60 p-1 rounded-xl gap-1 flex-shrink-0">
                <button onclick="state.kassa.mobileTab='catalog'; render()" class="flex-1 min-w-0 py-2 px-2 text-xs font-black uppercase rounded-lg transition-all ${!isMobileCartActive ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'} flex items-center justify-center gap-1.5 min-h-[38px]">
                    <i data-lucide="grid" class="w-3.5 h-3.5 flex-shrink-0"></i>
                    <span class="truncate">${t('products')}</span>
                </button>
                <button onclick="state.kassa.mobileTab='cart'; render()" class="flex-1 min-w-0 py-2 px-2 text-xs font-black uppercase rounded-lg transition-all ${isMobileCartActive ? 'bg-accent text-white shadow-sm' : 'text-slate-500'} flex items-center justify-center gap-1.5 min-h-[38px]">
                    <i data-lucide="shopping-cart" class="w-3.5 h-3.5 flex-shrink-0"></i>
                    <span class="truncate">${t('cart')}</span>
                    ${totalQty > 0 ? `<span class="bg-white/20 text-white px-1.5 py-0.2 rounded-full text-[10px] flex-shrink-0">${totalQty}</span>` : ''}
                </button>
            </div>

            <!-- LEFT: PRODUCTS CATALOG (Independent Scroll) -->
            <div class="flex-1 flex flex-col min-h-0 overflow-hidden ${isMobileCartActive ? 'hidden sm:flex' : 'flex'}">
                <!-- Sticky Search -->
                <div class="mb-2 sm:mb-2.5 relative flex-shrink-0 kassa-search-bar">
                    <i data-lucide="search" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"></i>
                    <input type="text" placeholder="${t('search_product')}" class="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-accent shadow-sm font-medium text-xs sm:text-sm min-h-[40px]" value="${state.kassa.search}" oninput="filterProducts(this.value)">
                </div>

                <!-- Product Cards Grid with internal independent scroll (4 columns) -->
                <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-2 sm:gap-2.5 overflow-y-auto custom-scrollbar flex-1 min-h-0 pb-2 touch-pan-y content-start auto-rows-max kassa-product-grid">
                    ${kassaProducts.map(p => {
                        const isVisible = p.name.toLowerCase().includes(searchQuery);
                        return `
                            <button onclick="addToOrder('${p.id}')" data-name="${p.name.toLowerCase()}" class="product-card bg-white p-2 sm:p-2.5 rounded-xl border-2 ${p.stock <= 0 ? 'border-dashed border-red-300 opacity-60 bg-red-50/10 cursor-not-allowed shadow-none' : p.stock <= 3 ? 'border-red-200' : 'border-slate-100'} shadow-sm hover:shadow-md transition-all active:scale-95 text-left flex flex-col justify-between ${isVisible ? '' : 'hidden'} focus:outline-none focus:ring-0 select-none touch-manipulation">
                                <div class="w-full">
                                    <div class="w-full aspect-[3/4] max-h-[175px] sm:max-h-[195px] rounded-lg shadow-inner bg-slate-50 mb-1.5 flex items-center justify-center text-3xl sm:text-4xl overflow-hidden flex-shrink-0">
                                        ${p.photoUrl ? `<img src="${p.photoUrl}" class="w-full h-full object-contain p-1" alt="${p.name}">` : '📦'}
                                    </div>
                                    <h3 class="font-bold text-xs sm:text-[13px] line-clamp-1 text-slate-800 leading-snug mb-1" title="${p.name}">${p.name}</h3>
                                </div>
                                <div class="flex justify-between items-center w-full pt-1.5 border-t border-slate-100">
                                    <div class="text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${p.stock <= 0 ? 'text-red-600 bg-red-50/50 px-1 py-0.5 rounded' : p.stock <= 3 ? 'text-red-500 bg-red-50/20 px-1 py-0.5 rounded' : 'text-slate-400 bg-slate-50/85 px-1 py-0.5 rounded'}">
                                        ${p.stock <= 0 ? (state.lang === 'ru' ? 'Нет' : 'Yo\'q') : `${p.stock} ${t('pcs')}`}
                                    </div>
                                    <div class="text-accent font-black text-xs sm:text-sm">${formatPrice(p.salePrice)}</div>
                                </div>
                            </button>
                        `;
                    }).join('')}
                </div>

                <!-- Floating Quick Cart Dock for Mobile Catalog View -->
                ${(!isMobileCartActive && totalQty > 0) ? `
                    <div class="sm:hidden mt-1 pt-1 flex-shrink-0">
                        <button onclick="state.kassa.mobileTab='cart'; render()" class="w-full min-h-[44px] bg-slate-900 text-white py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-between font-black text-xs uppercase tracking-wider active:scale-95 transition-all">
                            <span class="flex items-center gap-2"><i data-lucide="shopping-cart" class="w-4 h-4 text-accent"></i> ${t('cart')}: ${formatPrice(total)} ${state.settings.currency} (${totalQty})</span>
                            <span class="text-accent flex items-center gap-1 font-black">${t('pay')} <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i></span>
                        </button>
                    </div>
                ` : ''}
            </div>

            <!-- RIGHT: CART ASIDE (Independent Scroll + Pinned Footer) -->
            <aside class="w-full sm:w-80 md:w-96 lg:w-[380px] xl:w-[420px] bg-white border border-slate-200 rounded-2xl sm:rounded-3xl flex flex-col shadow-lg h-full max-h-full min-h-0 overflow-hidden flex-shrink-0 kassa-cart-aside ${!isMobileCartActive ? 'hidden sm:flex' : 'flex'}">
                <!-- Pinned Cart Header -->
                <div class="p-2.5 sm:p-4 border-b flex justify-between items-center bg-slate-50/70 flex-shrink-0 kassa-cart-header">
                    <h3 class="font-black text-xs sm:text-sm uppercase tracking-widest flex items-center gap-2 text-slate-700">
                        <i data-lucide="shopping-cart" class="w-4 h-4 text-accent"></i> ${t('cart')}
                        ${totalQty > 0 ? `<span class="bg-accent/10 text-accent px-1.5 py-0.5 rounded-md text-[10px] font-black">${totalQty}</span>` : ''}
                    </h3>
                    ${state.kassa.order.length > 0 ? `<button onclick="state.kassa.order=[]; render()" class="text-[10px] sm:text-xs font-black text-slate-400 uppercase hover:text-red-500 transition-colors p-1">${t('reset_cart')}</button>` : ''}
                </div>

                <!-- Independent Scroll Cart Items -->
                <div class="p-2 sm:p-3 space-y-2 overflow-y-auto custom-scrollbar flex-1 min-h-0 touch-pan-y">
                    ${state.kassa.order.map(item => `
                        <div class="flex items-center justify-between border-b border-slate-100 pb-2 gap-2">
                            <div class="flex-1 min-w-0 pr-1">
                                <div class="text-xs sm:text-sm font-bold text-slate-700 truncate" title="${item.name}">${item.name}</div>
                                <div class="flex items-center gap-2 mt-1">
                                    <div class="flex items-center bg-white rounded-lg border border-slate-200">
                                        <button onclick="updateQty('${item.productId}', -1)" class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-accent active:bg-slate-100 rounded-l-lg touch-manipulation"><i data-lucide="minus" class="w-3 h-3"></i></button>
                                        <span class="w-7 text-center text-xs font-black text-slate-600 select-none">${item.qty}</span>
                                        <button onclick="updateQty('${item.productId}', 1)" class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-accent active:bg-slate-100 rounded-r-lg touch-manipulation"><i data-lucide="plus" class="w-3 h-3"></i></button>
                                    </div>
                                    <button onclick="removeItem('${item.productId}')" class="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-red-500 active:scale-95 transition-all"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
                                </div>
                            </div>
                            <div class="text-right flex-shrink-0">
                                <input 
                                    type="text" 
                                    inputmode="numeric" 
                                    class="w-20 text-right font-black border-b border-transparent focus:border-accent outline-none text-xs sm:text-sm text-slate-900 bg-transparent transition-all" 
                                    value="${formatNumberString(item.price)}" 
                                    oninput="handleNumericInput(this)" 
                                    onchange="updatePrice('${item.productId}', this.value)"
                                >
                                <div class="text-[10px] text-slate-400 font-bold mt-0.5">${formatPrice(item.price * item.qty)}</div>
                            </div>
                        </div>
                    `).join('')}
                    ${state.kassa.order.length === 0 ? `<div class="text-center py-8 text-slate-300 italic text-xs uppercase font-bold tracking-widest opacity-60">${t('cart_empty')}</div>` : ''}
                </div>

                <!-- Pinned Cart Footer: Total + Payment Selector + Pay Button (ALWAYS VISIBLE) -->
                <div class="p-2.5 sm:p-4 bg-slate-950 border-t border-white/5 flex-shrink-0 kassa-cart-footer">
                    <div class="flex justify-between items-baseline mb-2 cart-total-row">
                        <span class="text-slate-400 font-black text-[10px] sm:text-xs uppercase tracking-widest">${t('total')}</span>
                        <span class="text-lg sm:text-2xl font-black text-white leading-none">${formatPrice(total)} <small class="text-xs text-accent font-black">${state.settings.currency}</small></span>
                    </div>
                    <div class="space-y-2">
                        <div class="bg-white/5 p-1 rounded-xl flex gap-1 payment-selector-wrap">
                            ${['cash', 'card', 'debt'].map(tType => `
                                <button onclick="state.kassa.paymentType='${tType}'; render()" class="flex-1 py-1.5 sm:py-2 min-h-[38px] flex items-center justify-center text-[10px] sm:text-[11px] font-black uppercase rounded-lg transition-all ${state.kassa.paymentType === tType ? 'bg-accent text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
                                    ${tType === 'cash' ? t('cash') : tType === 'card' ? t('card') : t('debt')}
                                </button>
                            `).join('')}
                        </div>
                        ${state.kassa.paymentType === 'debt' ? `
                            <input 
                                type="text" 
                                placeholder="${t('client_name_placeholder')}" 
                                class="w-full bg-white/5 text-white placeholder:text-slate-500 px-3 py-2 text-xs border border-white/10 rounded-xl outline-none focus:border-accent font-bold min-h-[38px]" 
                                value="${state.kassa.clientName}" 
                                oninput="state.kassa.clientName=this.value"
                            >
                        ` : ''}
                        <button onclick="confirmSale()" class="w-full min-h-[44px] py-2.5 sm:py-3 bg-accent hover:bg-orange-600 active:scale-[0.98] text-white font-black rounded-xl shadow-lg uppercase tracking-widest text-xs transition-all flex items-center justify-center kassa-pay-btn">
                            ${t('pay')}
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    `;
};

window.filterProducts = (val) => {
    state.kassa.search = val;
    const query = val.toLowerCase();
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        const name = card.getAttribute('data-name') || '';
        if (name.includes(query)) {
            card.classList.remove('hidden');
        } else {
            card.classList.add('hidden');
        }
    });
};

window.addToOrder = (id) => {
    const p = state.products.find(x => String(x.id) === String(id));
    if (!p) return;
    const existing = state.kassa.order.find(i => String(i.productId) === String(id));
    const currentQty = existing ? existing.qty : 0;
    if (currentQty >= p.stock) {
        showToast(state.lang === 'ru' 
            ? `Недостаточно на складе! Доступно: ${p.stock}` 
            : `Omborda yetarli emas! Mavjud: ${p.stock}`);
        return;
    }
    if (existing) existing.qty++;
    else state.kassa.order.push({ productId: id, name: p.name, qty: 1, price: p.salePrice });
    render();
};

window.updateQty = (id, delta) => {
    const item = state.kassa.order.find(i => String(i.productId) === String(id));
    if (item) {
        if (delta > 0) {
            const p = state.products.find(x => String(x.id) === String(id));
            if (p && item.qty >= p.stock) {
                showToast(state.lang === 'ru' 
                    ? `Недостаточно на складе! Доступно: ${p.stock}` 
                    : `Omborda yetarli emas! Mavjud: ${p.stock}`);
                return;
            }
        }
        item.qty += delta;
        if (item.qty <= 0) window.removeItem(id);
        else render();
    }
};

window.updatePrice = (id, val) => {
    const item = state.kassa.order.find(i => String(i.productId) === String(id));
    if (item) {
        item.price = parseNumber(val);
        render();
    }
};

window.removeItem = (id) => {
    state.kassa.order = state.kassa.order.filter(i => String(i.productId) !== String(id));
    render();
};

window.confirmSale = () => {
    if (state.kassa.order.length === 0) return;
    if (state.kassa.paymentType === 'debt' && !state.kassa.clientName.trim()) return alert(t('enter_client_name_toast'));
    
    const total = state.kassa.order.reduce((s, i) => s + (i.price * i.qty), 0);
    const saleData = {
        items: [...state.kassa.order],
        total: total,
        paymentType: state.kassa.paymentType,
        clientName: state.kassa.paymentType === 'debt' ? state.kassa.clientName : undefined
    };

    const modal = document.getElementById('modal-container');
    modal.innerHTML = `
        <div onclick="if(event.target===this) document.getElementById('modal-container').innerHTML=''" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <div class="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[calc(100dvh-16px)] overflow-hidden animate-in scale-in">
                <!-- Header -->
                <div class="p-3 sm:p-4 text-center border-b flex-shrink-0 bg-slate-50/70">
                    <div class="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-1.5">
                        <i data-lucide="receipt" class="w-5 h-5"></i>
                    </div>
                    <h2 class="text-base sm:text-lg font-black uppercase italic tracking-tighter text-slate-800">${t('receipt')}</h2>
                    <div class="text-slate-400 text-[10px] sm:text-xs uppercase font-bold tracking-wider">${t('check_data')}</div>
                </div>

                <!-- Body (Scrollable) -->
                <div class="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-5 space-y-2.5 touch-pan-y">
                    <div class="border-y border-dashed py-2 space-y-1.5 text-left">
                        ${saleData.items.map(i => `<div class="flex justify-between text-xs sm:text-sm"><span class="font-bold text-slate-700">${i.name} x ${i.qty}</span><b class="text-slate-900">${formatPrice(i.price*i.qty)}</b></div>`).join('')}
                    </div>
                    <div class="flex justify-between text-sm sm:text-base font-black text-left text-slate-900 pt-1">
                        <span>${t('total_receipt')}:</span>
                        <span>${formatPrice(saleData.total)} ${state.settings.currency}</span>
                    </div>
                    <div class="text-[10px] sm:text-xs uppercase font-bold text-slate-400 text-right tracking-wide">
                        ${t('payment_receipt')}: ${saleData.paymentType === 'cash' ? t('cash') : saleData.paymentType === 'card' ? t('card') : t('debt') + ' (' + saleData.clientName + ')'}
                    </div>
                </div>

                <!-- Pinned Footer -->
                <div class="p-3 sm:p-4 border-t bg-slate-50/90 flex gap-3 flex-shrink-0 sticky bottom-0">
                    <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 min-h-[44px] py-2.5 border border-slate-200 text-slate-500 rounded-xl sm:rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center">${t('cancel')}</button>
                    <button id="commit-sale-ok-btn" class="flex-1 min-h-[44px] py-2.5 bg-accent text-white rounded-xl sm:rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center">OK</button>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
    document.getElementById('commit-sale-ok-btn').onclick = () => window.commitSale(saleData);
};

window.commitSale = async (saleData) => {
    const timestamp = Date.now();
    
    // Record each item individually
    saleData.items.forEach((item, index) => {
        const individualId = `${timestamp}-${index}`;
        const individualSale = {
            id: individualId,
            timestamp: timestamp,
            items: [item],
            total: item.price * item.qty,
            paymentType: saleData.paymentType,
            clientName: saleData.clientName
        };
        state.sales.unshift(individualSale);

        // Update stock
        const p = state.products.find(x => String(x.id) === String(item.productId));
        if (p) {
            p.stock = Math.max(0, p.stock - item.qty);
            p.ost = p.stock;
        }

        // Update debts
        if (saleData.paymentType === 'debt') {
            let debt = state.debts.find(d => d.clientName === saleData.clientName);
            if (!debt) {
                debt = { clientName: saleData.clientName, transactions: [] };
                state.debts.push(debt);
            }
            debt.transactions.push({ 
                type: 'debt', 
                amount: item.price * item.qty, 
                timestamp: timestamp, 
                saleId: individualId,
                items: [JSON.parse(JSON.stringify(item))]
            });
        }
    });

    state.kassa.order = [];
    state.kassa.clientName = '';
    document.getElementById('modal-container').innerHTML = '';
    await saveState();
    showToast(t('sale_complete_toast'));
    render();
};
