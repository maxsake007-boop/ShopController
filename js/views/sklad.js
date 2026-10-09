// --- SKLAD (WAREHOUSE) VIEW ---

window.renderSklad = () => `
    <div class="space-y-2.5 sm:space-y-4 pb-36 sm:pb-32 md:pb-20">
        <div class="flex justify-between items-center gap-2">
            <h2 class="text-xs sm:text-base font-black uppercase italic text-slate-800 tracking-wider flex items-center gap-2">
                <i data-lucide="package" class="text-accent w-4 h-4 sm:w-5 sm:h-5"></i> ${t('sklad')}
            </h2>
            <button onclick="toggleAddForm(true)" class="min-h-[36px] sm:min-h-[40px] bg-accent text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-1.5 hover:bg-orange-600 active:scale-95 transition-all text-[11px] sm:text-xs uppercase tracking-widest shadow-sm">
                <i data-lucide="plus" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i> ${t('add_product')}
            </button>
        </div>
        <div class="bg-white rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-xs sm:text-sm">
            <div class="overflow-x-auto custom-scrollbar sklad-table-container">
                <table class="w-full text-left font-sans min-w-[540px]">
                    <thead class="sticky top-0 z-10 bg-slate-50 border-b text-[10px] sm:text-xs font-black uppercase text-slate-400 tracking-widest shadow-sm">
                        <tr>
                            <th class="py-2 px-2.5 sm:py-2.5 sm:px-3.5">${t('photo')}</th>
                            <th class="py-2 px-2.5 sm:py-2.5 sm:px-3.5">${t('name')}</th>
                            <th class="py-2 px-2.5 sm:py-2.5 sm:px-3.5">${t('sale_short')}</th>
                            <th class="py-2 px-2.5 sm:py-2.5 sm:px-3.5 flex items-center gap-1.5">
                                ${t('purchase_short')} 
                                <button onclick="state.showPurchasePrices = !state.showPurchasePrices; render()" class="hover:text-accent transition-colors p-0.5">
                                    <i data-lucide="${state.showPurchasePrices ? 'eye-off' : 'eye'}" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i>
                                </button>
                            </th>
                            <th class="py-2 px-2.5 sm:py-2.5 sm:px-3.5">${t('stock')}</th>
                            <th class="py-2 px-2.5 sm:py-2.5 sm:px-3.5 text-right"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${state.products.map(p => `
                            <tr class="hover:bg-slate-50/50 transition-colors group">
                                <td class="py-1.5 px-2.5 sm:py-2 sm:px-3.5">
                                    <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-100 border border-slate-100 flex items-center justify-center overflow-hidden">
                                        ${p.photoUrl ? `<img src="${p.photoUrl}" class="w-full h-full object-cover" alt="${p.name}">` : '<i data-lucide="package" class="w-4 h-4 text-slate-400"></i>'}
                                    </div>
                                </td>
                                <td class="py-1.5 px-2.5 sm:py-2 sm:px-3.5">
                                    <input class="w-full bg-transparent border-b border-transparent focus:border-accent outline-none font-bold text-slate-800 text-xs sm:text-sm py-1 min-h-[32px] touch-pan-y" style="touch-action: pan-y;" value="${p.name}" onchange="editProduct('${p.id}', 'name', this.value)">
                                </td>
                                <td class="py-1.5 px-2.5 sm:py-2 sm:px-3.5 font-black text-accent tracking-tighter text-xs sm:text-sm">
                                    <input type="text" inputmode="numeric" class="w-20 bg-transparent border-b border-transparent focus:border-accent outline-none font-black text-accent py-1 min-h-[32px] touch-pan-y" style="touch-action: pan-y;" value="${formatNumberString(p.salePrice)}" oninput="handleNumericInput(this)" onchange="editProduct('${p.id}', 'salePrice', this.value)">
                                </td>
                                <td class="py-1.5 px-2.5 sm:py-2 sm:px-3.5 font-bold text-slate-500 tracking-tighter text-xs sm:text-sm">
                                    <div class="flex items-center gap-1">
                                        ${(state.showPurchasePrices || state.visiblePurchasePrices.map(String).includes(String(p.id))) 
                                            ? `<input type="text" inputmode="numeric" class="w-20 bg-transparent border-b border-transparent focus:border-accent outline-none font-bold text-slate-500 py-1 min-h-[32px] touch-pan-y" style="touch-action: pan-y;" value="${formatNumberString(p.purchasePrice)}" oninput="handleNumericInput(this)" onchange="editProduct('${p.id}', 'purchasePrice', this.value)">`
                                            : '<span class="font-bold tracking-[0.1em] text-slate-300">••••</span>'
                                        }
                                        <button onclick="toggleRowPurchasePrice('${p.id}')" class="text-slate-400 hover:text-accent transition-all p-1 min-w-[30px] min-h-[30px] flex items-center justify-center">
                                            <i data-lucide="${state.visiblePurchasePrices.map(String).includes(String(p.id)) ? 'eye-off' : 'eye'}" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i>
                                        </button>
                                    </div>
                                </td>
                                <td class="py-1.5 px-2.5 sm:py-2 sm:px-3.5 text-xs sm:text-sm">
                                    <input type="text" inputmode="numeric" class="w-14 bg-transparent border-b border-transparent focus:border-accent outline-none py-1 min-h-[32px] touch-pan-y ${p.stock <= 3 ? 'text-red-500 font-black' : 'font-bold text-slate-700'}" style="touch-action: pan-y;" value="${formatNumberString(p.stock)}" oninput="handleNumericInput(this)" onchange="editProduct('${p.id}', 'stock', this.value)">
                                </td>
                                <td class="py-1.5 px-2.5 sm:py-2 sm:px-3.5 text-right">
                                    <button onclick="confirmDeleteProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')" class="text-slate-300 hover:text-red-500 active:scale-95 transition-colors p-1.5 min-w-[32px] min-h-[32px] inline-flex items-center justify-center">
                                        <i data-lucide="trash-2" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                        ${state.products.length === 0 ? `<tr><td colspan="6" class="p-8 text-center text-slate-350 italic text-xs">${t('no_records')}</td></tr>` : ''}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <div id="sklad-modal"></div>
`;

window.toggleRowPurchasePrice = (id) => {
    const strId = String(id);
    if (state.visiblePurchasePrices.map(String).includes(strId)) {
        state.visiblePurchasePrices = state.visiblePurchasePrices.filter(x => String(x) !== strId);
    } else {
        state.visiblePurchasePrices.push(id);
    }
    render();
};

window.confirmDeleteProduct = (id, name) => {
    const m = document.getElementById('modal-container');
    m.innerHTML = `
        <div onclick="if(event.target===this) document.getElementById('modal-container').innerHTML=''" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <div class="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md flex flex-col max-h-[calc(100dvh-16px)] overflow-hidden text-center animate-in scale-in">
                <div class="p-4 sm:p-6 flex-1 min-h-0 overflow-y-auto custom-scrollbar touch-pan-y">
                    <div class="w-12 h-12 sm:w-16 sm:h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i data-lucide="alert-triangle" class="w-6 h-6 sm:w-8 sm:h-8"></i>
                    </div>
                    <h3 class="text-base sm:text-xl font-black uppercase italic text-slate-800 leading-tight">${t('confirm_delete_product')}</h3>
                    <p class="text-slate-400 text-xs sm:text-sm mb-2 mt-2 font-semibold uppercase tracking-wider leading-relaxed bg-slate-50/50 p-2.5 rounded-xl border border-dashed border-slate-200 break-words">${name}</p>
                </div>
                <div class="p-3 sm:p-4 border-t bg-slate-50 flex gap-3 flex-shrink-0 sticky bottom-0">
                     <button onclick="document.getElementById('modal-container').innerHTML=''" class="flex-1 min-h-[44px] py-2.5 border border-slate-200 rounded-xl sm:rounded-2xl font-black text-slate-500 hover:bg-slate-100 active:scale-95 transition-all uppercase text-xs tracking-widest flex items-center justify-center">${t('no')}</button>
                     <button onclick="document.getElementById('modal-container').innerHTML=''; deleteProduct('${id}')" class="flex-1 min-h-[44px] py-2.5 bg-red-500 text-white rounded-xl sm:rounded-2xl font-black hover:bg-red-600 active:scale-95 transition-all uppercase text-xs tracking-widest shadow-lg shadow-red-100 flex items-center justify-center">${t('yes')}</button>
                </div>
            </div>
        </div>
    `;
    lucide.createIcons();
};

window.toggleAddForm = (show) => {
    const m = document.getElementById('sklad-modal');
    if (!m) return;
    if (!show) return m.innerHTML = '';
    m.innerHTML = `
        <div onclick="if(event.target===this) toggleAddForm(false)" class="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            <div class="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg md:max-w-xl flex flex-col max-h-[calc(100dvh-16px)] overflow-hidden animate-in scale-in">
                <div class="px-4 py-3 sm:px-6 sm:py-4 border-b flex justify-between items-center bg-slate-50/70 flex-shrink-0">
                    <h2 class="text-sm sm:text-lg font-black italic uppercase text-slate-800 tracking-tight">${t('new_product')}</h2>
                    <button onclick="toggleAddForm(false)" class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 active:bg-slate-100">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
                <form onsubmit="addProduct(event)" class="flex flex-col flex-1 min-h-0 overflow-hidden">
                    <div class="p-3 sm:p-6 space-y-3 flex-1 min-h-0 overflow-y-auto custom-scrollbar touch-pan-y">
                        <div class="space-y-1">
                            <label class="text-[11px] font-black text-slate-400 uppercase ml-1 block">${t('name')}</label>
                            <input name="name" required placeholder="${t('product_name_placeholder')}" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent font-bold text-sm min-h-[44px]">
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-1">
                                <label class="text-[11px] font-black text-slate-400 uppercase ml-1 block">${t('sale_short')}</label>
                                <input name="salePrice" type="text" inputmode="numeric" oninput="handleNumericInput(this)" required placeholder="0" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent font-bold text-sm min-h-[44px]">
                            </div>
                            <div class="space-y-1">
                                <label class="text-[11px] font-black text-slate-400 uppercase ml-1 block">${t('purchase_short')}</label>
                                <input name="purchasePrice" type="text" inputmode="numeric" oninput="handleNumericInput(this)" required placeholder="0" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent font-bold text-sm text-slate-600 min-h-[44px]">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-1">
                                <label class="text-[11px] font-black text-slate-400 uppercase ml-1 block">${t('stock')}</label>
                                <input name="stock" type="text" inputmode="numeric" oninput="handleNumericInput(this)" required placeholder="0" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent font-bold text-sm min-h-[44px]">
                            </div>
                            <div class="space-y-1">
                                <label class="text-[11px] font-black text-slate-400 uppercase ml-1 block">${t('photo')}</label>
                                <input name="photoUrl" placeholder="URL" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent text-sm min-h-[44px]">
                            </div>
                        </div>
                    </div>
                    <div class="p-3 sm:p-4 border-t bg-slate-50/90 flex gap-3 flex-shrink-0 sticky bottom-0">
                        <button type="button" onclick="toggleAddForm(false)" class="flex-1 min-h-[44px] py-2.5 border border-slate-200 rounded-xl sm:rounded-2xl font-bold text-slate-500 uppercase text-xs tracking-widest hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center">${t('cancel')}</button>
                        <button type="submit" class="flex-1 min-h-[44px] py-2.5 bg-accent text-white rounded-xl sm:rounded-2xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center">${t('create')}</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    lucide.createIcons();
};

window.addProduct = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const p = {
        id: Date.now().toString(),
        name: fd.get('name'),
        salePrice: parseNumber(fd.get('salePrice')),
        purchasePrice: parseNumber(fd.get('purchasePrice')),
        stock: parseNumber(fd.get('stock')),
        ost: parseNumber(fd.get('stock')),
        photoUrl: fd.get('photoUrl')
    };
    state.products.push(p);
    await saveState();
    toggleAddForm(false);
    render();
    showToast(t('product_added_toast'));
};

window.editProduct = async (id, field, val) => {
    const p = state.products.find(x => String(x.id) === String(id));
    if (p) {
        const parsedVal = field === 'name' ? val : parseNumber(val);
        p[field] = parsedVal;
        if (field === 'stock' || field === 'ost') {
            p.stock = parsedVal;
            p.ost = parsedVal;
        }
        await saveState();
        showToast(t('updated_toast'));
    }
};

window.deleteProduct = async (id) => {
    state.products = state.products.filter(x => String(x.id) !== String(id));
    await saveState();
    const modalEl = document.getElementById('modal-container');
    if (modalEl) modalEl.innerHTML = '';
    render();
    showToast(t('product_deleted_toast'));
};
