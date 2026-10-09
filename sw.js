// =============================================================================
//                    SERVICE WORKER - AGORA POS (PWA)
// =============================================================================

const CACHE_NAME = 'agora-pos-v2.2';

// Основные файлы приложения для автономной работы (App Shell)
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/css/app.css',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-maskable.png',
    '/icons/favicon.png',
    '/icons/logo.png',
    '/js/config.js',
    '/js/translations.js',
    '/js/db.js',
    '/js/state.js',
    '/js/utils.js',
    '/js/tablet-zoom.js',
    '/js/photo.js',
    '/js/activation.js',
    '/js/backup.js',
    '/js/views/kassa.js',
    '/js/views/sklad.js',
    '/js/views/dolgi.js',
    '/js/views/reports.js',
    '/js/views/dashboard.js',
    '/js/views/settings.js',
    '/js/app.js'
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
            // Кешируем локальные файлы по одному, чтобы один сбой не ломал остальные
            for (const asset of STATIC_ASSETS) {
                try {
                    await cache.add(asset);
                } catch (e) {
                    console.warn('[SW] Ошибка предварительного кеширования:', asset, e);
                }
            }
            // Предзагрузка внешних CDN
            for (const url of CDN_ASSETS) {
                try {
                    await cache.add(url);
                } catch (e) {}
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
    if (
        url.hostname.includes('supabase.co') ||
        url.pathname.includes('/rest/v1/') ||
        request.method !== 'GET'
    ) {
        event.respondWith(fetch(request));
        return;
    }

    // 2. Для навигации (HTML страница) - Network First с падением в кеш
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
                .catch(async () => {
                    const cache = await caches.open(CACHE_NAME);
                    const directMatch = await cache.match(request);
                    if (directMatch) return directMatch;
                    const rootMatch = await cache.match('/');
                    if (rootMatch) return rootMatch;
                    return (await cache.match('/index.html')) || Response.error();
                })
        );
        return;
    }

    // 3. Для остальных GET-запросов (скрипты, стили, CDN, картинки) - Stale While Revalidate
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
                .catch(() => cachedResponse);

            return cachedResponse || fetchPromise;
        })
    );
});
