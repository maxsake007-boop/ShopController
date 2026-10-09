// =============================================================================
//                    SERVICE WORKER - SHOPRULER POS (PWA)
// =============================================================================

const CACHE_NAME = 'shopruller-pos-v2.1';

// Основные файлы приложения для автономной работы (App Shell)
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/app.css',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './js/config.js',
    './js/translations.js',
    './js/db.js',
    './js/state.js',
    './js/utils.js',
    './js/tablet-zoom.js',
    './js/photo.js',
    './js/activation.js',
    './js/backup.js',
    './js/views/kassa.js',
    './js/views/sklad.js',
    './js/views/dolgi.js',
    './js/views/reports.js',
    './js/views/dashboard.js',
    './js/views/settings.js',
    './js/app.js'
];

// Внешние CDN библиотеки для кеширования
const CDN_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://unpkg.com/lucide@latest',
    'https://unpkg.com/dexie@latest/dist/dexie.js'
];

// Установка: кешируем App Shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            // Кешируем локальные файлы
            await cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[SW] Ошибка предварительного кеширования локальных ресурсов:', err);
            });
            // Пробуем предварительно загрузить CDN
            for (const url of CDN_ASSETS) {
                try {
                    await cache.add(url);
                } catch (e) {
                    // CDN может загружаться позже в runtime
                }
            }
        })
    );
    self.skipWaiting();
});

// Активация: очистка старых версий кеша (НЕ затрагивает IndexedDB!)
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Удаление устаревшего кеша:', key);
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Обработка сетевых запросов
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 1. КРИТИЧЕСКИ ВАЖНО: Запросы к Supabase (проверка активации) НИКОГДА НЕ КЕШИРУЮТСЯ
    // Это исключает обход проверки через кеш браузера или service worker.
    if (
        url.hostname.includes('supabase.co') ||
        url.pathname.includes('/rest/v1/') ||
        request.method !== 'GET'
    ) {
        // Только реальная сеть без вмешательства Service Worker
        event.respondWith(fetch(request));
        return;
    }

    // 2. Для навигации (HTML) - Network First с падением в кеш (для мгновенного обновления после деплоя)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match('./index.html') || caches.match('./'))
        );
        return;
    }

    // 3. Для остальных GET-запросов (скрипты, стили, CDN, картинки):
    // Stale-While-Revalidate: отдаем быстрый кеш, параллельно обновляем его из сети
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(() => {
                    // Офлайн: если нет сети, ничего не делаем, отдали cachedResponse
                });

            return cachedResponse || fetchPromise;
        })
    );
});
