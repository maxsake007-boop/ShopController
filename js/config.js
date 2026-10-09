// =============================================================================
//                       БЛОК НАСТРОЕК КЛИЕНТА (CLIENT CONFIG)
//       Все параметры, уникальные для каждого клиента, настраиваются здесь.
// =============================================================================
window.CLIENT_CONFIG = {
    // 1. Основные данные магазина
    shopName: "Agora",                // Название магазина
    primaryColor: "#FF6B00",          // Основной фирменный цвет (HEX)
    primaryHoverColor: "#E66100",     // Цвет при наведении/нажатии
    logoIcon: "store",                // Иконка Lucide (store, shopping-bag, tag, box и т.д.)

    // 2. Интеграция с Supabase (только публичные данные! Никаких service_role ключей!)
    supabaseUrl: "https://vrvgequztuqvbpluwztr.supabase.co",
    supabaseAnonKey: "sb_publishable_ynOpagpq8vKfmaIU_G0kWQ_asEUa1o7",

    // 3. Параметры сжатия фотографий
    photoCompression: {
        maxDimension: 800,            // Макс. размер по длинной стороне (px)
        quality: 0.80,                // Качество сжатия (0.1 - 1.0)
        mimeType: "image/jpeg"        // Формат хранения сжатого Blob
    },

    // 4. Формат резервного копирования
    backup: {
        formatTag: "shopruller",
        version: 1
    }
};

// Применение фирменного цвета в CSS переменные
if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--accent', window.CLIENT_CONFIG.primaryColor);
    document.documentElement.style.setProperty('--accent-hover', window.CLIENT_CONFIG.primaryHoverColor);
}

// --- СИСТЕМНАЯ КОНФИГУРАЦИЯ И НАВИГАЦИЯ ---
window.AppConfig = {
    TABLET_ZOOM_KEY: 'pos_tablet_zoom_v3',
    DEFAULT_ZOOM: 0.70,
    DEFAULT_APP_NAME: window.CLIENT_CONFIG.shopName,
    DEFAULT_CURRENCY: 'сум',
    DEFAULT_LANG: 'ru',
    NAV_ITEMS: [
        { id: 'kassa', icon: 'store', label: 'Касса' },
        { id: 'dolgi', icon: 'credit-card', label: 'Долги' },
        { id: 'sklad', icon: 'package', label: 'Склад' },
        { id: 'report', icon: 'file-text', label: 'Отчёт' },
        { id: 'dashboard', icon: 'layout-dashboard', label: 'Дашборд' },
        { id: 'settings', icon: 'settings', label: 'Настройки' },
    ]
};

window.NAV_ITEMS = window.AppConfig.NAV_ITEMS;
