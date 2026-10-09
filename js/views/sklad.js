// =============================================================================
//                    SKLAD (WAREHOUSE) VIEW
// =============================================================================

window._currentAddPhotoBlob = null;

window.renderSklad = () => `
    <div class="space-y-2.5 sm:space-y-4 pb-36 sm:pb-32 md:pb-20">
        <div class="flex justify-between items-center gap-2">
            <h2 class="text-xs sm:text-base font-black uppercase italic text-slate-800 tracking-wider flex items-center gap-2">
                <i data-lucide="package" class="text-accent w-4 h-4 sm:w-5 sm:h-5"></i> ${t('sklad')}
            </h2>
            <button onclick="toggleAddForm(true)" class="min-h-[44px] bg-accent text-white px-3 sm:px-5 py-2 rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-1.5 hover:bg-orange-600 active:scale-95 transition-all text-xs uppercase tracking-widest shadow-sm cursor-pointer">
                <i data-lucide="plus" class="w-4 h-4"></i> ${t('add_product')}
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
                        ${state.products.map(p => {
                            const photoSrc = window.getPhotoSrc ? window.getPhotoSrc(p) : (p.photoUrl || '');
                            return `
                                <tr class="hover:bg-slate-50/50 transition-colors group">
                                    <td class="py-1.5 px-2.5 sm:py-2 sm:px-3.5">
                                        <div onclick="triggerChangePhoto('${p.id}')" class="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-100 border border-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer hover:border-accent hover:opacity-85 transition-all" title="Нажмите, чтобы изменить фото">
                                            ${photoSrc ? `<img src="${photoSrc}" class="w-full h-full object-cover" alt="${p.name}" loading="lazy">` : '<i data-lucide="package" class="w-4 h-4 text-slate-400"></i>'}
                                        </div>
                                    </td>
                                    <td class="py-1.5 px-2.5 sm:py-2 sm:px-3.5">
                                        <input class="w-full bg-transparent border-b border-transparent focus:border-accent outline-none font-bold text-slate-800 text-xs sm:text-sm py-1 min-h-[36px] touch-pan-y" style="touch-action: pan-y;" value="${p.name}" onchange="editProduct('${p.id}', 'name', this.value)">
                                    </td>
                                    <td class="py-1.5 px-2.5 sm:py-2 sm:px-3.5 font-black text-accent tracking-tighter text-xs sm:text-sm">
                                        <input type="text" inputmode="numeric" class="w-20 bg-transparent border-b border-transparent focus:border-accent outline-none font-black text-accent py-1 min-h-[36px] touch-pan-y" style="touch-action: pan-y;" value="${formatNumberString(p.salePrice)}" oninput="handleNumericInput(this)" onchange="editProduct('${p.id}', 'salePrice', this.value)">
                                    </td>
                                    <td class="py-1.5 px-2.5 sm:py-2 sm:px-3.5 font-bold text-slate-500 tracking-tighter text-xs sm:text-sm">
                                        <div class="flex items-center gap-1">
                                            ${(state.showPurchasePrices || state.visiblePurchasePrices.map(String).includes(String(p.id))) 
                                                ? `<input type="text" inputmode="numeric" class="w-20 bg-transparent border-b border-transparent focus:border-accent outline-none font-bold text-slate-500 py-1 min-h-[36px] touch-pan-y" style="touch-action: pan-y;" value="${formatNumberString(p.purchasePrice)}" oninput="handleNumericInput(this)" onchange="editProduct('${p.id}', 'purchasePrice', this.value)">`
                                                : '<span class="font-bold tracking-[0.1em] text-slate-300">••••</span>'
                                            }
                                            <button onclick="toggleRowPurchasePrice('${p.id}')" class="text-slate-400 hover:text-accent transition-all p-1 min-w-[32px] min-h-[32px] flex items-center justify-center">
                                                <i data-lucide="${state.visiblePurchasePrices.map(String).includes(String(p.id)) ? 'eye-off' : 'eye'}" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i>
                                            </button>
                                        </div>
                                    </td>
                                    <td class="py-1.5 px-2.5 sm:py-2 sm:px-3.5 text-xs sm:text-sm">
                                        <input type="text" inputmode="numeric" class="w-14 bg-transparent border-b border-transparent focus:border-accent outline-none py-1 min-h-[36px] touch-pan-y ${p.stock <= 3 ? 'text-red-500 font-black' : 'font-bold text-slate-700'}" style="touch-action: pan-y;" value="${formatNumberString(p.stock)}" oninput="handleNumericInput(this)" onchange="editProduct('${p.id}', 'stock', this.value)">
                                    </td>
                                    <td class="py-1.5 px-2.5 sm:py-2 sm:px-3.5 text-right">
                                        <button onclick="confirmDeleteProduct('${p.id}', '${p.name.replace(/'/g, "\\'")}')" class="text-slate-300 hover:text-red-500 active:scale-95 transition-colors p-1.5 min-w-[36px] min-h-[36px] inline-flex items-center justify-center">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                        ${state.products.length === 0 ? `<tr><td colspan="6" class="p-8 text-center text-slate-350 italic text-xs">${t('no_records')}</td></tr>` : ''}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <input type="file" id="change-product-photo-input" accept="image/*" class="hidden" onchange="handleProductPhotoChanged(event)">
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

window.handleNewProductPhotoSelected = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const metaEl = document.getElementById('new-photo-meta');
    const thumbEl = document.getElementById('new-photo-thumb');
    const clearBtn = document.getElementById('new-photo-clear-btn');

    if (metaEl) metaEl.textContent = 'Сжатие фото...';

    try {
        const compressedBlob = await window.compressImage(file);
        window._currentAddPhotoBlob = compressedBlob;

        const previewUrl = URL.createObjectURL(compressedBlob);
        if (thumbEl) {
            thumbEl.innerHTML = `<img src="${previewUrl}" class="w-full h-full object-cover">`;
        }
        if (metaEl) {
            const sizeKb = Math.round(compressedBlob.size / 1024);
            metaEl.textContent = `Сжато: ~${sizeKb} КБ`;
        }
        if (clearBtn) clearBtn.classList.remove('hidden');
    } catch (err) {
        console.error('Ошибка сжатия фото:', err);
        showToast('❌ Ошибка сжатия фото');
        if (metaEl) metaEl.textContent = 'Ошибка сжатия';
    }
};

window.clearNewProductPhoto = () => {
    window._currentAddPhotoBlob = null;
    const fileInput = document.getElementById('new-product-photo-file');
    if (fileInput) fileInput.value = '';
    const thumbEl = document.getElementById('new-photo-thumb');
    if (thumbEl) thumbEl.innerHTML = '<i data-lucide="image" class="w-5 h-5 text-slate-300"></i>';
    const metaEl = document.getElementById('new-photo-meta');
    if (metaEl) metaEl.textContent = '';
    const clearBtn = document.getElementById('new-photo-clear-btn');
    if (clearBtn) clearBtn.classList.add('hidden');
    if (window.lucide) lucide.createIcons();
};

window.toggleAddForm = (show) => {
    const m = document.getElementById('sklad-modal');
    if (!m) return;
    if (!show) {
        window._currentAddPhotoBlob = null;
        return m.innerHTML = '';
    }

    window._currentAddPhotoBlob = null;
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
                        <div class="space-y-1">
                            <label class="text-[11px] font-black text-slate-400 uppercase ml-1 block">${t('stock')}</label>
                            <input name="stock" type="text" inputmode="numeric" oninput="handleNumericInput(this)" required placeholder="0" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-accent font-bold text-sm min-h-[44px]">
                        </div>

                        <!-- Фото товара (Загрузка файла, камера на планшете/смартфоне, авто-сжатие) -->
                        <div class="space-y-1">
                            <label class="text-[11px] font-black text-slate-400 uppercase ml-1 block">${t('photo')}</label>
                            <input type="file" id="new-product-photo-file" accept="image/*" class="hidden" onchange="handleNewProductPhotoSelected(event)">
                            <div id="new-photo-preview-wrap" class="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[52px]">
                                <div id="new-photo-thumb" class="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    <i data-lucide="image" class="w-5 h-5 text-slate-300"></i>
                                </div>
                                <div class="flex-1 min-w-0">
                                    <button type="button" onclick="document.getElementById('new-product-photo-file').click()" class="min-h-[44px] px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 flex items-center gap-2 shadow-2xs active:scale-95 transition-all cursor-pointer">
                                        <i data-lucide="camera" class="w-4 h-4 text-accent"></i>
                                        <span>${state.lang === 'ru' ? 'Выбрать фото / Камера' : 'Rasm / Kamera'}</span>
                                    </button>
                                    <div id="new-photo-meta" class="text-[10px] text-slate-400 font-semibold mt-1 truncate"></div>
                                </div>
                                <button type="button" id="new-photo-clear-btn" onclick="clearNewProductPhoto()" class="hidden w-9 h-9 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center cursor-pointer">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="p-3 sm:p-4 border-t bg-slate-50/90 flex gap-3 flex-shrink-0 sticky bottom-0">
                        <button type="button" onclick="toggleAddForm(false)" class="flex-1 min-h-[44px] py-2.5 border border-slate-200 rounded-xl sm:rounded-2xl font-bold text-slate-500 uppercase text-xs tracking-widest hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer">${t('cancel')}</button>
                        <button type="submit" class="flex-1 min-h-[44px] py-2.5 bg-accent text-white rounded-xl sm:rounded-2xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-orange-100 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center cursor-pointer">${t('create')}</button>
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
    const stockVal = parseNumber(fd.get('stock'));
    const p = {
        id: Date.now().toString(),
        name: fd.get('name'),
        salePrice: parseNumber(fd.get('salePrice')),
        purchasePrice: parseNumber(fd.get('purchasePrice')),
        stock: stockVal,
        ost: stockVal,
        photoUrl: '',
        photoBlob: window._currentAddPhotoBlob || null
    };
    state.products.push(p);
    await saveState();
    window._currentAddPhotoBlob = null;
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

window._targetProductIdForPhoto = null;

window.triggerChangePhoto = (id) => {
    window._targetProductIdForPhoto = id;
    const input = document.getElementById('change-product-photo-input');
    if (input) input.click();
};

window.handleProductPhotoChanged = async (e) => {
    const file = e.target.files?.[0];
    const prodId = window._targetProductIdForPhoto;
    if (!file || !prodId) return;

    const p = state.products.find(x => String(x.id) === String(prodId));
    if (p) {
        try {
            showToast('Сжатие и обновление фото...');
            const compressedBlob = await window.compressImage(file);
            p.photoBlob = compressedBlob;
            p.photoUrl = '';
            if (window.revokeProductPhotoUrl) {
                window.revokeProductPhotoUrl(prodId);
            }
            await saveState();
            render();
            showToast('✅ Фото товара обновлено');
        } catch (err) {
            console.error('Ошибка обновления фото:', err);
            showToast('❌ Ошибка обновления фото');
        }
    }
    e.target.value = '';
    window._targetProductIdForPhoto = null;
};

window.deleteProduct = async (id) => {
    if (window.revokeProductPhotoUrl) {
        window.revokeProductPhotoUrl(id);
    }
    state.products = state.products.filter(x => String(x.id) !== String(id));
    await saveState();
    const modalEl = document.getElementById('modal-container');
    if (modalEl) modalEl.innerHTML = '';
    render();
    showToast(t('product_deleted_toast'));
};
