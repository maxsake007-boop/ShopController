// =============================================================================
//                    BACKUP & RESTORE MODULE (JSON + ATOMIC TRANSACTION)
// =============================================================================

/**
 * Показ модального окна прогресса (для планшетов и больших баз)
 */
window.showBackupProgressModal = (title, message) => {
    let el = document.getElementById('backup-progress-modal');
    if (!el) {
        el = document.createElement('div');
        el.id = 'backup-progress-modal';
        el.className = 'fixed inset-0 z-[200] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4';
        document.body.appendChild(el);
    }
    el.innerHTML = `
        <div class="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-in space-y-4">
            <div class="w-14 h-14 bg-orange-100 text-accent rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                <i data-lucide="database" class="w-7 h-7"></i>
            </div>
            <h3 class="text-base font-black uppercase italic text-slate-800" id="backup-progress-title">${title}</h3>
            <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider" id="backup-progress-msg">${message}</p>
            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div id="backup-progress-bar" class="bg-accent h-full w-1/3 transition-all duration-300"></div>
            </div>
        </div>
    `;
    el.style.display = 'flex';
    if (window.lucide) lucide.createIcons();
};

window.updateBackupProgress = (percent, message) => {
    const bar = document.getElementById('backup-progress-bar');
    const msg = document.getElementById('backup-progress-msg');
    if (bar) bar.style.width = `${percent}%`;
    if (msg && message) msg.textContent = message;
};

window.hideBackupProgressModal = () => {
    const el = document.getElementById('backup-progress-modal');
    if (el) el.style.display = 'none';
};

/**
 * Экспорт резервной копии со всеми хранилищами IndexedDB и Base64-фотографиями
 */
window.exportBackup = async () => {
    try {
        showBackupProgressModal('Резервное копирование', 'Сбор данных из базы...');
        updateBackupProgress(15, 'Чтение записей...');

        const [products, sales, debtors, expenses, settings] = await Promise.all([
            db.products.toArray(),
            db.sales.toArray(),
            db.debtors.toArray(),
            db.expenses.toArray(),
            db.settings.toArray()
        ]);

        updateBackupProgress(35, `Конвертация фотографий (всего ${products.length} тов.)...`);

        // Преобразование фотографий (Blob -> Base64) для текстового формата JSON
        const exportedProducts = [];
        for (let i = 0; i < products.length; i++) {
            const p = products[i];
            let photoBase64 = null;
            if (p.photoBlob) {
                try {
                    photoBase64 = await blobToBase64(p.photoBlob);
                } catch (e) {
                    console.warn(`Не удалось закодировать фото товара ${p.id}:`, e);
                }
            }

            exportedProducts.push({
                ...p,
                photoBlob: null,       // Blob не сериализуется в JSON
                photoBase64: photoBase64 // Текстовое представление
            });

            if (i % 5 === 0) {
                const percent = 35 + Math.round(((i + 1) / products.length) * 45);
                updateBackupProgress(percent, `Обработка фото ${i + 1} из ${products.length}...`);
            }
        }

        updateBackupProgress(85, 'Формирование файла JSON...');

        const backupConfig = window.CLIENT_CONFIG?.backup || {};
        const backupPayload = {
            format: backupConfig.formatTag || "shopruller",
            version: backupConfig.version || 1,
            createdAt: new Date().toISOString(),
            shopName: window.CLIENT_CONFIG?.shopName || 'Store',
            data: {
                products: exportedProducts,
                sales: sales,
                debtors: debtors,
                expenses: expenses,
                settings: settings
            }
        };

        const jsonString = JSON.stringify(backupPayload, null, 2);
        const fileBlob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });

        updateBackupProgress(100, 'Сохранение файла...');

        // Скачивание файла с поддержкой iOS Safari и Android Chrome
        const fileName = `${backupPayload.format}_backup_${new Date().toISOString().slice(0, 10)}.json`;
        const blobUrl = URL.createObjectURL(fileBlob);
        const downloadLink = document.createElement('a');
        downloadLink.href = blobUrl;
        downloadLink.download = fileName;
        downloadLink.rel = 'noopener';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        setTimeout(() => {
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(blobUrl);
            hideBackupProgressModal();
            showToast('✅ Резервная копия успешно сохранена');
        }, 500);

    } catch (err) {
        hideBackupProgressModal();
        console.error('[Backup] Ошибка экспорта:', err);
        showToast('❌ Ошибка создания резервной копии');
    }
};

/**
 * Валидация файла и отображение подтверждения перед заменой данных
 * @param {File} file Загруженный JSON файл
 */
window.restoreBackup = (file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = () => {
        showToast('❌ Ошибка чтения файла');
    };

    reader.onload = async (e) => {
        try {
            let json;
            try {
                json = JSON.parse(e.target.result);
            } catch (parseErr) {
                alert('Ошибка: Выбранный файл повреждён или не является корректным JSON.');
                return;
            }

            // Проверка формата
            const expectedTag = window.CLIENT_CONFIG?.backup?.formatTag || "shopruller";
            if (!json || json.format !== expectedTag) {
                alert(`Ошибка: Файл не является резервной копией ${expectedTag}.`);
                return;
            }

            // Проверка версии
            if (!json.version || json.version > 1) {
                alert('Ошибка: Версия формата резервной копии не поддерживается.');
                return;
            }

            if (!json.data || typeof json.data !== 'object') {
                alert('Ошибка: Структура данных в файле повреждена.');
                return;
            }

            const backupDate = json.createdAt ? new Date(json.createdAt).toLocaleString('ru-RU') : 'Неизвестно';
            const prodsCount = json.data.products?.length || 0;
            const salesCount = json.data.sales?.length || 0;
            const debtsCount = json.data.debtors?.length || 0;

            // Окно подтверждения с информацией о содержимом копии
            window.showRestoreConfirmationModal(json, { backupDate, prodsCount, salesCount, debtsCount });

        } catch (err) {
            console.error('[Backup] Ошибка при валидации копии:', err);
            alert('Произошла непредвиденная ошибка при проверке файла.');
        }
    };

    reader.readAsText(file);
};

/**
 * Окно подтверждения полной замены данных
 */
window.showRestoreConfirmationModal = (backupData, meta) => {
    let m = document.getElementById('modal-container');
    if (!m) {
        m = document.createElement('div');
        m.id = 'modal-container';
        document.body.appendChild(m);
    }

    m.innerHTML = `
        <div onclick="if(event.target===this) document.getElementById('modal-container').innerHTML=''" class="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[150] flex items-center justify-center p-3 sm:p-4 overflow-y-auto custom-scrollbar">
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[calc(100dvh-20px)] overflow-hidden text-center animate-in my-auto border border-red-200">
                <div class="p-5 sm:p-7 flex-1 min-h-0 overflow-y-auto custom-scrollbar touch-pan-y space-y-4">
                    <div class="w-14 h-14 sm:w-16 sm:h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                        <i data-lucide="alert-triangle" class="w-7 h-7 sm:w-8 sm:h-8"></i>
                    </div>

                    <div>
                        <h3 class="text-base sm:text-xl font-black uppercase italic text-slate-800 leading-tight">
                            Восстановление из копии
                        </h3>
                        <p class="text-red-500 font-bold text-xs uppercase tracking-wider mt-1">
                            Внимание: Все текущие данные будут полностью удалены и заменены данными из файла!
                        </p>
                    </div>

                    <!-- Информация о восстанавливаемых данных -->
                    <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2 text-xs">
                        <div class="flex justify-between items-center text-slate-500 font-medium pb-2 border-b border-slate-200">
                            <span>Дата создания копии:</span>
                            <span class="font-bold text-slate-800">${meta.backupDate}</span>
                        </div>
                        <div class="grid grid-cols-3 gap-2 pt-1 text-center font-bold">
                            <div class="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                                <div class="text-[10px] text-slate-400 uppercase font-black">Товаров</div>
                                <div class="text-sm font-black text-slate-800 mt-0.5">${meta.prodsCount}</div>
                            </div>
                            <div class="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                                <div class="text-[10px] text-slate-400 uppercase font-black">Продаж</div>
                                <div class="text-sm font-black text-slate-800 mt-0.5">${meta.salesCount}</div>
                            </div>
                            <div class="bg-white p-2 rounded-xl border border-slate-100 shadow-2xs">
                                <div class="text-[10px] text-slate-400 uppercase font-black">Долгов</div>
                                <div class="text-sm font-black text-slate-800 mt-0.5">${meta.debtsCount}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="p-4 border-t bg-slate-50/90 flex gap-3 flex-shrink-0">
                    <button 
                        type="button" 
                        onclick="document.getElementById('modal-container').innerHTML=''" 
                        class="flex-1 min-h-[44px] py-2.5 border border-slate-200 rounded-2xl font-black text-slate-500 hover:bg-slate-100 uppercase text-xs tracking-widest transition-all cursor-pointer"
                    >
                        Отмена
                    </button>
                    <button 
                        type="button" 
                        onclick="executeRestoreBackup()" 
                        class="flex-1 min-h-[44px] py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-200 active:scale-95 transition-all cursor-pointer"
                    >
                        Заменить данные
                    </button>
                </div>
            </div>
        </div>
    `;

    // Сохраняем восстанавливаемый объект во временную переменную
    window._pendingRestoreData = backupData;
    if (window.lucide) lucide.createIcons();
};

/**
 * Исполнение восстановления в единой атомарной транзакции Dexie
 */
window.executeRestoreBackup = async () => {
    const backupObj = window._pendingRestoreData;
    if (!backupObj || !backupObj.data) {
        showToast('❌ Ошибка: данные для восстановления отсутствуют');
        return;
    }

    const modal = document.getElementById('modal-container');
    if (modal) modal.innerHTML = '';

    showBackupProgressModal('Восстановление данных', 'Подготовка хранилища...');
    updateBackupProgress(20, 'Распаковка фотографий...');

    try {
        const rawProducts = backupObj.data.products || [];
        const restoredProducts = [];

        // Восстановление Blob из Base64
        for (let i = 0; i < rawProducts.length; i++) {
            const p = rawProducts[i];
            let blob = null;
            if (p.photoBase64) {
                blob = base64ToBlob(p.photoBase64);
            }

            restoredProducts.push({
                ...p,
                photoBlob: blob,
                photoBase64: undefined // Не засоряем базу лишней строкой
            });

            if (i % 5 === 0) {
                const percent = 20 + Math.round(((i + 1) / rawProducts.length) * 40);
                updateBackupProgress(percent, `Декодирование фото ${i + 1} из ${rawProducts.length}...`);
            }
        }

        const localDeviceId = await getOrCreateDeviceId();

        updateBackupProgress(75, 'Атомарная запись в базу данных...');

        // ЕДИНАЯ ТРАНЗАКЦИЯ ДЛЯ ВСЕХ 5 ТАБЛИЦ: если произойдет сбой, откатятся все таблицы
        await db.transaction('rw', [db.products, db.sales, db.debtors, db.expenses, db.settings], async () => {
            // Полная очистка существующих данных
            await db.products.clear();
            await db.sales.clear();
            await db.debtors.clear();
            await db.expenses.clear();
            await db.settings.clear();

            // Запись данных из копии
            if (restoredProducts.length > 0) {
                await db.products.bulkAdd(restoredProducts);
            }
            if (backupObj.data.sales?.length > 0) {
                await db.sales.bulkAdd(backupObj.data.sales);
            }
            if (backupObj.data.debtors?.length > 0) {
                await db.debtors.bulkAdd(backupObj.data.debtors);
            }
            if (backupObj.data.expenses?.length > 0) {
                await db.expenses.bulkAdd(backupObj.data.expenses);
            }
            if (backupObj.data.settings?.length > 0) {
                // Сохраняем физический ID текущего устройства (предотвращает клонирование лицензии на 10 планшетов)
                const sanitizedSettings = backupObj.data.settings.map(s => {
                    if (s.key === 'device_id') return { key: 'device_id', value: localDeviceId };
                    return s;
                });
                await db.settings.bulkAdd(sanitizedSettings);
            }
            // Гарантируем привязку локального идентификатора
            await db.settings.put({ key: 'device_id', value: localDeviceId });
        });

        updateBackupProgress(95, 'Проверка лицензии и перезагрузка...');

        // Проверяем статус лицензии из копии
        const restoredLicense = await db.settings.get('license');
        let isLicenseValid = false;

        if (restoredLicense && restoredLicense.value && restoredLicense.value.key) {
            const check = await window.verifyLicenseKey(restoredLicense.value.key);
            if (check && check.success) {
                isLicenseValid = true;
                await db.settings.put({
                    key: 'license',
                    value: {
                        ...restoredLicense.value,
                        deviceId: localDeviceId,
                        status: 'active'
                    }
                });
            }
        }

        hideBackupProgressModal();
        window._pendingRestoreData = null;

        // Очищаем кэш URL картинок и перезагружаем состояние приложения
        revokeAllPhotoUrls();
        await loadStateFromDb();
        render();

        if (isLicenseValid) {
            hideActivationScreen();
            showToast('✅ База данных успешно восстановлена!');
        } else {
            // Если в файле был невалидный ключ, требуем ввод ключа на этом устройстве
            if (window.showActivationScreen) {
                window.showActivationScreen();
            }
            showToast('Данные восстановлены. Активируйте приложение ключом');
        }

    } catch (err) {
        hideBackupProgressModal();
        console.error('[Backup] Критическая ошибка атомарной транзакции восстановления:', err);
        alert('Ошибка восстановления базы данных! Текущие данные не были повреждены.');
    }
};
