// =============================================================================
//                    LICENSE ACTIVATION & SUPABASE INTEGRATION
// =============================================================================

/**
 * Получение или генерация уникального ID устройства
 * Хранится в IndexedDB (db.settings)
 */
window.getOrCreateDeviceId = async () => {
    try {
        const stored = await db.settings.get('device_id');
        if (stored && stored.value) {
            return stored.value;
        }

        // Генерация криптографически стойкого ID
        let newId = '';
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            newId = crypto.randomUUID();
        } else {
            const arr = new Uint8Array(16);
            crypto.getRandomValues(arr);
            newId = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
        }

        await db.settings.put({ key: 'device_id', value: newId });
        return newId;
    } catch (e) {
        console.error('[License] Ошибка получения deviceId:', e);
        return 'device-' + Date.now();
    }
};

/**
 * Проверка текущего статуса активации в IndexedDB
 * @returns {Promise<Object|null>} Объект лицензии или null
 */
window.checkActivationStatus = async () => {
    try {
        const licenseRecord = await db.settings.get('license');
        if (licenseRecord && licenseRecord.value && licenseRecord.value.status === 'active') {
            return licenseRecord.value;
        }
        return null;
    } catch (e) {
        console.error('[License] Ошибка чтения лицензии из IndexedDB:', e);
        return null;
    }
};

/**
 * Единая точка проверки ключа активации через серверную функцию Supabase (RPC).
 * В коде клиента нет секретов, список лицензий хранится только в Supabase.
 */
window.verifyLicenseKey = async (licenseKey) => {
    return await window.verifyKeyWithSupabase(licenseKey);
};

/**
 * Серверная проверка и привязка ключа через Supabase RPC функцию
 * В клиентском коде используется ТОЛЬКО публичный анонимный ключ!
 * @param {string} licenseKey Ключ активации, введенный пользователем
 * @returns {Promise<{success: boolean, message?: string, clientName?: string}>}
 */
window.verifyKeyWithSupabase = async (licenseKey) => {
    const config = window.CLIENT_CONFIG || {};
    const url = config.supabaseUrl;
    const anonKey = config.supabaseAnonKey;

    if (!url || !anonKey || url.includes('your-project')) {
        return {
            success: false,
            message: 'Сервер Supabase не настроен'
        };
    }

    if (!navigator.onLine) {
        return {
            success: false,
            message: 'Для онлайн-активации требуется интернет'
        };
    }

    const deviceId = await getOrCreateDeviceId();
    const endpoint = `${url.replace(/\/+$/, '')}/rest/v1/rpc/activate_license`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${anonKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                p_license_key: licenseKey.trim().toUpperCase(),
                p_device_id: deviceId
            })
        });

        if (!response.ok) {
            return {
                success: false,
                message: 'Неверный или недействительный ключ активации'
            };
        }

        const data = await response.json();
        if (data && data.success) {
            return {
                success: true,
                clientName: data.client_name || config.shopName
            };
        }

        return {
            success: false,
            message: 'Неверный или недействительный ключ активации'
        };
    } catch (err) {
        console.warn('[License] Сетевая ошибка проверки ключа Supabase:', err);
        return {
            success: false,
            message: 'Ошибка соединения с сервером активации'
        };
    }
};

/**
 * Процесс активации: вызов проверки ключа и сохранение в IndexedDB
 */
window.handleActivationSubmit = async (e) => {
    if (e) e.preventDefault();
    const input = document.getElementById('activation-key-input');
    const errorEl = document.getElementById('activation-error-msg');
    const submitBtn = document.getElementById('activation-submit-btn');

    if (!input || !input.value.trim()) {
        if (errorEl) {
            errorEl.textContent = 'Пожалуйста, введите ключ активации';
            errorEl.classList.remove('hidden');
        }
        return;
    }

    const key = input.value.trim().toUpperCase();

    if (errorEl) errorEl.classList.add('hidden');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Проверка...</span>
        `;
    }

    const deviceId = await getOrCreateDeviceId();
    const res = await window.verifyLicenseKey(key);

    if (res.success) {
        const licenseData = {
            key: key,
            deviceId: deviceId,
            activatedAt: new Date().toISOString(),
            clientName: res.clientName || window.CLIENT_CONFIG?.shopName || 'Client',
            status: 'active'
        };

        // Сохраняем статус активации в существующую IndexedDB
        await db.settings.put({ key: 'license', value: licenseData });

        // Запрос постоянного хранилища браузера
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().catch(() => {});
        }

        // Скрываем экран активации и запускаем приложение
        hideActivationScreen();
        await loadStateFromDb();
        render();
        showToast('✅ Приложение успешно активировано!');
    } else {
        if (errorEl) {
            errorEl.textContent = res.message || 'Неверный или недействительный ключ активации';
            errorEl.classList.remove('hidden');
        }
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `
                <i data-lucide="shield-check" class="w-4 h-4"></i>
                <span>Активировать</span>
            `;
            if (window.lucide) lucide.createIcons();
        }
        if (input) {
            input.classList.add('border-red-500', 'animate-shake');
            setTimeout(() => input.classList.remove('animate-shake'), 400);
        }
    }
};

/**
 * Отображение экрана ввода ключа активации
 * Включает возможность восстановить резервную копию при очистке хранилища!
 */
window.showActivationScreen = () => {
    let screen = document.getElementById('activation-screen');
    const shopName = window.CLIENT_CONFIG?.shopName || 'ShopRuler';

    if (!screen) {
        screen = document.createElement('div');
        screen.id = 'activation-screen';
        screen.className = 'fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto custom-scrollbar';
        document.body.appendChild(screen);
    }

    screen.innerHTML = `
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md p-5 sm:p-8 flex flex-col text-center animate-in my-auto border border-slate-100">
            <!-- App Logo / Badge -->
            <img src="icons/icon-192.png" alt="${shopName}" class="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl mx-auto mb-4 shadow-xl shadow-accent/25 object-cover">

            <h2 class="text-lg sm:text-2xl font-black uppercase italic text-slate-800 tracking-tight leading-tight">
                ${shopName}
            </h2>
            <p class="text-xs sm:text-sm font-semibold text-slate-400 uppercase tracking-wider mt-1 mb-5">
                Активация приложения
            </p>

            <!-- Error message container -->
            <div id="activation-error-msg" class="hidden mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold leading-relaxed text-center">
            </div>

            <!-- Activation Key Form -->
            <form onsubmit="handleActivationSubmit(event)" class="space-y-3.5 text-left">
                <div>
                    <label class="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 ml-1 mb-1 block">
                        Лицензионный ключ
                    </label>
                    <input 
                        id="activation-key-input" 
                        type="text" 
                        autocomplete="off" 
                        spellcheck="false"
                        required 
                        placeholder="XXXX-XXXX-XXXX-XXXX" 
                        class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-accent font-mono font-black text-sm sm:text-base text-slate-800 tracking-wider text-center uppercase min-h-[48px] shadow-inner transition-colors"
                    >
                </div>

                <button 
                    id="activation-submit-btn" 
                    type="submit" 
                    class="w-full min-h-[48px] bg-accent text-white py-3 px-5 rounded-2xl font-black uppercase text-xs sm:text-sm tracking-wider shadow-lg shadow-accent/25 hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                    <i data-lucide="shield-check" class="w-4 h-4"></i>
                    <span>Активировать</span>
                </button>
            </form>

            <!-- Divider -->
            <div class="relative my-5">
                <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200"></div></div>
                <div class="relative flex justify-center text-[10px] uppercase font-black text-slate-400 bg-white px-2">
                    или восстановите данные
                </div>
            </div>

            <!-- Restore from backup directly on activation screen -->
            <div class="space-y-2">
                <input type="file" id="activation-restore-file" accept=".json,application/json" class="hidden" onchange="handleActivationBackupSelect(event)">
                <button 
                    type="button" 
                    onclick="document.getElementById('activation-restore-file').click()" 
                    class="w-full min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-4 rounded-2xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                    <i data-lucide="archive-restore" class="w-4 h-4 text-slate-500"></i>
                    <span>Восстановить из копии</span>
                </button>
                <p class="text-[10px] text-slate-400 font-medium leading-tight">
                    Если история браузера была очищена, выберите ранее сохраненную копию
                </p>
            </div>
        </div>
    `;

    screen.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
    const input = document.getElementById('activation-key-input');
    if (input) input.focus();
};

/**
 * Скрытие экрана активации
 */
window.hideActivationScreen = () => {
    const screen = document.getElementById('activation-screen');
    if (screen) {
        screen.style.display = 'none';
    }
};

/**
 * Обработка выбора файла резервной копии на экране активации
 */
window.handleActivationBackupSelect = (event) => {
    const file = event.target.files?.[0];
    if (file && window.restoreBackup) {
        window.restoreBackup(file);
    }
    event.target.value = '';
};
