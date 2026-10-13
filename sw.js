// =============================================================================
//                    SERVICE WORKER - AGORA POS (PWA)
// =============================================================================

const CACHE_NAME = 'agora-pos-v3.3';

// Основные файлы приложения для автономной работы (App Shell)
const STATIC_ASSETS = [
    '/',
    '/?v=3.3',
    '/index.html',
    '/manifest.json',
    '/manifest.json?v=3.3',
    '/css/app.css?v=3.3',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-maskable.png',
    '/icons/favicon.png',
    '/icons/logo.png',
    '/js/config.js?v=3.3',
    '/js/translations.js?v=3.3',
    '/js/db.js?v=3.3',
    '/js/state.js?v=3.3',
    '/js/utils.js?v=3.3',
    '/js/tablet-zoom.js?v=3.3',
    '/js/photo.js?v=3.3',
    '/js/activation.js?v=3.3',
    '/js/backup.js?v=3.3',
    '/js/views/kassa.js?v=3.3',
    '/js/views/sklad.js?v=3.3',
    '/js/views/dolgi.js?v=3.3',
    '/js/views/reports.js?v=3.3',
    '/js/views/dashboard.js?v=3.3',
    '/js/views/settings.js?v=3.3',
    '/js/app.js?v=3.3'
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
            for (const asset of STATIC_ASSETS) {
                try {
                    await cache.add(asset);
                } catch (e) {
                    console.warn('[SW] Ошибка кеширования:', asset, e);
                }
            }
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

    // 1. Запросы к Supabase никогда не кешируются
    if (
        url.hostname.includes('supabase.co') ||
        url.pathname.includes('/rest/v1/') ||
        request.method !== 'GET'
    ) {
        event.respondWith(fetch(request));
        return;
    }

    // 2. Для навигации (HTML) - Network First с надежным отказоустойчивым кешем
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
                    const match = (await cache.match(request)) ||
                                  (await cache.match('/')) ||
                                  (await cache.match('/?v=2.5')) ||
                                  (await cache.match('/index.html'));
                    if (match) return match;
                    return new Response(
                        '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Agora</title><meta http-equiv="refresh" content="2"></head><body>Загрузка Agora...</body></html>',
                        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                    );
                })
        );
        return;
    }

    // 2.5. Для локальных JS и CSS файлов приложения - Network First, чтобы изменения кода вступали в силу сразу
    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
        event.respondWith(
            fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const copy = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return networkResponse;
                })
                .catch(() => caches.match(request))
        );
        return;
    }

    // 3. Для остальных GET-запросов (картинки, шрифты) - Cache First
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                fetch(request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
                    }
                }).catch(() => {});
                return cachedResponse;
            }
            return fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const copy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                }
                return networkResponse;
            }).catch(() => {
                return new Response('', { status: 408, statusText: 'Offline' });
            });
        })
    );
});
