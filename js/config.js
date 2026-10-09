// --- CONFIG & CONSTANTS ---
window.AppConfig = {
    TABLET_ZOOM_KEY: 'pos_tablet_zoom_v3',
    DEFAULT_ZOOM: 0.70,
    DEFAULT_APP_NAME: 'NMN',
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

// Global shorthand for backward-compatibility
window.NAV_ITEMS = window.AppConfig.NAV_ITEMS;
