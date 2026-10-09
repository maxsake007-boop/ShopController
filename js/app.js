// --- APPLICATION ORCHESTRATOR & RENDERING ENGINE ---

window.renderLang = () => {
    const containerHtml = `
        <div class="flex bg-slate-50 p-1 border border-slate-200 rounded-xl text-[10px] font-black uppercase shadow-inner">
            <button onclick="setLang('ru')" class="px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${state.lang === 'ru' ? 'bg-slate-800 text-white shadow-sm font-black' : 'text-slate-400 hover:text-slate-600'}">RU</button>
            <button onclick="setLang('uz')" class="px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${state.lang === 'uz' ? 'bg-slate-800 text-white shadow-sm font-black' : 'text-slate-400 hover:text-slate-600'}">UZ</button>
        </div>
    `;
    const desktopCont = document.getElementById('desktop-lang-container');
    const mobileCont = document.getElementById('mobile-lang-container');
    if (desktopCont) desktopCont.innerHTML = containerHtml;
    if (mobileCont) mobileCont.innerHTML = containerHtml;
};

window.setLang = async (lang) => {
    state.lang = lang;
    await saveState();
    const titleLabel = document.getElementById('current-tab-label');
    if (titleLabel) titleLabel.textContent = t(state.activeTab);
    render();
    showToast(lang === 'ru' ? 'Язык изменен на Русский' : 'Til O\'zbekchaga o\'zgartirildi');
};

window.renderNav = () => {
    const sidebar = document.getElementById('nav-links');
    const mobile = document.getElementById('mobile-nav');
    const items = window.AppConfig?.NAV_ITEMS || window.NAV_ITEMS;

    const generateLinks = (isMobile) => items.map(item => `
        <button onclick="switchTab('${item.id}')" class="${isMobile ? 'flex flex-col items-center justify-center gap-0.5 p-1 flex-1 min-w-0 min-h-[44px] overflow-hidden' : 'w-full max-w-[5rem] py-2 md:py-3.5 flex flex-col items-center justify-center gap-1 rounded-xl md:rounded-2xl nav-btn min-h-[44px]'} transition-all group ${state.activeTab === item.id ? (isMobile ? 'text-accent' : 'bg-orange-100 text-accent font-black') : 'text-slate-400 hover:bg-slate-50' }">
            <i data-lucide="${item.icon}" class="${isMobile ? 'w-4 h-4 flex-shrink-0' : 'w-5 h-5 md:w-6 md:h-6'} ${state.activeTab === item.id ? 'text-accent' : 'text-slate-400'}"></i>
            <span class="${isMobile ? 'text-[8px] font-black uppercase tracking-wider text-center truncate w-full px-0.5' : 'text-[9px] md:text-[10px] font-black uppercase tracking-wider text-center'} ${state.activeTab === item.id ? 'text-accent' : 'text-slate-400'}">${t(item.id)}</span>
        </button>
    `).join('');

    if (sidebar) sidebar.innerHTML = generateLinks(false);
    if (mobile) mobile.innerHTML = generateLinks(true);
};

window.switchTab = (id) => {
    state.activeTab = id;
    const titleLabel = document.getElementById('current-tab-label');
    if (titleLabel) titleLabel.textContent = t(id);
    render();
};

window.renderContent = () => {
    const main = document.getElementById('main-content');
    if (!main) return;
    const tabId = state.activeTab;
    
    if (tabId === 'kassa') {
        main.className = "flex-1 overflow-hidden p-1.5 sm:p-2.5 md:p-3.5 custom-scrollbar touch-pan-y flex flex-col min-h-0";
        main.innerHTML = renderKassa();
    } else {
        main.className = "flex-1 overflow-y-auto p-2.5 sm:p-3.5 md:p-4 lg:p-6 pb-36 md:pb-16 custom-scrollbar touch-pan-y min-h-0";
        if (tabId === 'sklad') main.innerHTML = renderSklad();
        else if (tabId === 'dolgi') main.innerHTML = renderDolgi();
        else if (tabId === 'report') main.innerHTML = renderReport();
        else if (tabId === 'dashboard') {
            main.innerHTML = renderDashboard();
            initCharts();
        }
        else if (tabId === 'settings') main.innerHTML = renderSettings();
    }
};

window.render = () => {
    renderLang();
    renderNav();
    renderContent();
    if (window.lucide && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
    }
    document.querySelectorAll('.app-name-display').forEach(el => el.textContent = state.settings.appName);
    applyTabletZoom();
};

// Lifecycle initialization
window.initApp = async () => {
    // 1. Регистрация Service Worker (PWA)
    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        navigator.serviceWorker.register('./sw.js?v=2.5').then((reg) => {
            console.log('[PWA] Service Worker зарегистрирован:', reg.scope);
            reg.update().catch(() => {});
        }).catch((err) => {
            console.warn('[PWA] Ошибка регистрации Service Worker:', err);
        });
    }

    try {
        // 2. Проверка статуса активации в существующей IndexedDB
        const license = window.checkActivationStatus ? await window.checkActivationStatus() : null;
        if (!license) {
            // Приложение не активировано: показываем экран ввода ключа
            if (window.showActivationScreen) {
                window.showActivationScreen();
            }
            return;
        }

        // 3. Запрос на защиту от автоочистки хранилища браузера
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().then((persisted) => {
                console.log(`[Storage] Статус постоянного хранилища: ${persisted ? 'предоставлено' : 'отклонено'}`);
            }).catch(() => {});
        }

        // 4. Безопасная проверка и миграция из localStorage (только если необходимо)
        await migrateFromLocalStorage();

        // 5. Загрузка данных из IndexedDB
        await loadStateFromDb();
    } catch (err) {
        console.error("Initialization error:", err);
    }
    
    const urlTab = new URLSearchParams(window.location.search).get('tab') || window.location.hash.replace('#', '');
    if (urlTab && ['kassa', 'sklad', 'dolgi', 'report', 'dashboard', 'settings'].includes(urlTab)) {
        state.activeTab = urlTab;
    }
    
    const titleLabel = document.getElementById('current-tab-label');
    if (titleLabel) titleLabel.textContent = t(state.activeTab);

    render();
    if (window.checkInstallButtonsVisibility) {
        window.checkInstallButtonsVisibility();
    }
    if (window.initModalScrollLock) {
        window.initModalScrollLock();
    }
};

// --- PWA INSTALLATION SYSTEM ---
window.deferredInstallPrompt = null;

window.checkInstallButtonsVisibility = () => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         window.navigator.standalone === true ||
                         (document.referrer && document.referrer.includes('android-app://'));

    document.querySelectorAll('#desktop-pwa-install-btn, #mobile-pwa-install-btn').forEach(b => {
        if (isStandalone) {
            b.classList.add('hidden');
            b.classList.remove('flex');
        } else {
            b.classList.remove('hidden');
            b.classList.add('flex');
        }
    });
};

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.deferredInstallPrompt = e;
    console.log('[PWA] beforeinstallprompt перехвачен');
    window.checkInstallButtonsVisibility();
});

window.addEventListener('appinstalled', () => {
    console.log('[PWA] Приложение успешно установлено на устройство');
    window.deferredInstallPrompt = null;
    document.querySelectorAll('#desktop-pwa-install-btn, #mobile-pwa-install-btn').forEach(b => {
        b.classList.add('hidden');
        b.classList.remove('flex');
    });
    if (window.showToast) {
        showToast('✅ Agora успешно установлена на экран устройства!');
    }
});

window.triggerPWAInstall = async () => {
    if (window.deferredInstallPrompt) {
        try {
            window.deferredInstallPrompt.prompt();
            const { outcome } = await window.deferredInstallPrompt.userChoice;
            console.log('[PWA] Выбор пользователя:', outcome);
            if (outcome === 'accepted') {
                window.deferredInstallPrompt = null;
                document.querySelectorAll('#desktop-pwa-install-btn, #mobile-pwa-install-btn').forEach(b => {
                    b.classList.add('hidden');
                    b.classList.remove('flex');
                });
            }
            return;
        } catch (err) {
            console.warn('[PWA] Ошибка prompt:', err);
        }
    }

    const modal = document.getElementById('modal-container');
    if (modal) {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        modal.innerHTML = `
            <div onclick="if(event.target===this) document.getElementById('modal-container').innerHTML=''" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-3 sm:p-4">
                <div class="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
                    <div class="w-14 h-14 rounded-2xl bg-orange-100 text-accent flex items-center justify-center mx-auto shadow-inner">
                        <i data-lucide="${isIOS ? 'share' : 'smartphone'}" class="w-7 h-7"></i>
                    </div>
                    <div class="text-center space-y-1">
                        <h3 class="text-base font-black text-slate-800 uppercase tracking-tight">Установка на рабочий стол</h3>
                        <p class="text-xs text-slate-500 font-medium">Работает на весь экран и без интернета</p>
                    </div>
                    ${isIOS ? `
                        <div class="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs text-slate-700 border border-slate-100">
                            <p class="font-bold text-accent">Инструкция для Safari (iPad / iPhone):</p>
                            <p>1. Внизу экрана нажмите кнопку <b>«Поделиться»</b> (квадрат со стрелкой).</p>
                            <p>2. Прокрутите список и нажмите <b>«На экран "Домой"»</b>.</p>
                            <p>3. Нажмите <b>«Добавить»</b> в правом верхнем углу.</p>
                        </div>
                    ` : `
                        <div class="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs text-slate-700 border border-slate-100">
                            <p class="font-bold text-accent">Инструкция для Chrome на планшете / телефоне:</p>
                            <p>1. Нажмите три точки <b>(⋮)</b> в правом верхнем углу Chrome.</p>
                            <p>2. Выберите пункт <b>«Добавить на главный экран»</b> (или «Установить приложение»).</p>
                            <p>3. Подтвердите нажатием <b>«Добавить»</b>.</p>
                        </div>
                    `}
                    <button type="button" onclick="document.getElementById('modal-container').innerHTML=''" class="w-full min-h-[44px] py-3 bg-accent hover:bg-accent-hover text-white rounded-2xl font-black uppercase text-xs tracking-wider transition-all shadow-md shadow-accent/20 cursor-pointer active:scale-95">
                        Понятно
                    </button>
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    } else {
        alert('Для установки Agora:\nВ меню браузера Chrome (три точки ⋮) выберите «Добавить на главный экран» или «Установить приложение».');
    }
};

// Auto-run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initApp);
} else {
    window.initApp();
}
