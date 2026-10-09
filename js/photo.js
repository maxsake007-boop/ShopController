// =============================================================================
//                    PHOTO PROCESSING & OBJECT URL LIFECYCLE
// =============================================================================

// Кэш сгенерированных Object URL для предотвращения утечек памяти на планшетах
window._photoUrlCache = new Map();

/**
 * Сжатие изображения в браузере с пропорциональным масштабированием
 * @param {File|Blob} file Исходный файл изображения
 * @param {Object} options Параметры сжатия
 * @returns {Promise<Blob>} Сжатый Blob
 */
window.compressImage = (file, options = {}) => {
    return new Promise((resolve, reject) => {
        const conf = window.CLIENT_CONFIG?.photoCompression || {};
        const maxDimension = options.maxDimension || conf.maxDimension || 800;
        const quality = options.quality !== undefined ? options.quality : (conf.quality || 0.80);
        const mimeType = options.mimeType || conf.mimeType || 'image/jpeg';

        if (!file || !(file instanceof Blob)) {
            return reject(new Error('Недопустимый объект изображения'));
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Не удалось прочитать файл изображения'));
        reader.onload = (e) => {
            const img = new Image();
            img.onerror = () => reject(new Error('Не удалось декодировать изображение'));
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Вычисление новых пропорций
                if (width > maxDimension || height > maxDimension) {
                    if (width > height) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    } else {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                // Рендеринг на Canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                
                // Сглаживание
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, width, height);

                // Преобразование в Blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Ошибка генерации сжатого Blob'));
                    }
                }, mimeType, quality);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
};

/**
 * Получение безопасного src изображения для товара:
 * Поддерживает как новые локальные Blob, так и существующие внешние URL.
 * @param {Object} product Товар
 * @returns {string|null} URL для тега <img src="...">
 */
window.getPhotoSrc = (product) => {
    if (!product) return null;

    // 1. Если есть локальный Blob в IndexedDB
    if (product.photoBlob && product.photoBlob instanceof Blob) {
        const prodId = String(product.id || 'temp');
        
        // Проверяем существующий кэш
        if (window._photoUrlCache.has(prodId)) {
            const cached = window._photoUrlCache.get(prodId);
            if (cached.blob === product.photoBlob) {
                return cached.url;
            }
            // Если Blob изменился, отзываем старый URL
            URL.revokeObjectURL(cached.url);
        }

        const newUrl = URL.createObjectURL(product.photoBlob);
        window._photoUrlCache.set(prodId, { url: newUrl, blob: product.photoBlob });
        return newUrl;
    }

    // 2. Если есть фото в виде URL (обратная совместимость)
    if (product.photoUrl && typeof product.photoUrl === 'string' && product.photoUrl.trim() !== '') {
        return product.photoUrl.trim();
    }

    return null;
};

/**
 * Освобождение Object URL для одного удаленного товара
 */
window.revokeProductPhotoUrl = (productId) => {
    const prodId = String(productId);
    if (window._photoUrlCache && window._photoUrlCache.has(prodId)) {
        const item = window._photoUrlCache.get(prodId);
        if (item && item.url) {
            URL.revokeObjectURL(item.url);
        }
        window._photoUrlCache.delete(prodId);
    }
};

/**
 * Очистка и освобождение всех сгенерированных Object URL (для предотвращения утечек памяти)
 */
window.revokeAllPhotoUrls = () => {
    if (window._photoUrlCache) {
        window._photoUrlCache.forEach((item) => {
            if (item && item.url) {
                URL.revokeObjectURL(item.url);
            }
        });
        window._photoUrlCache.clear();
    }
};

/**
 * Конвертация Blob в Base64 DataURL (для создания JSON резервной копии)
 * @param {Blob} blob 
 * @returns {Promise<string>}
 */
window.blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
        if (!blob || !(blob instanceof Blob)) {
            return resolve(null);
        }
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

/**
 * Конвертация Base64 DataURL обратно в Blob (для восстановления из JSON копии)
 * @param {string} dataUrl 
 * @returns {Blob|null}
 */
window.base64ToBlob = (dataUrl) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
        return null;
    }
    try {
        const arr = dataUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    } catch (e) {
        console.error('[Photo] Ошибка преобразования Base64 в Blob:', e);
        return null;
    }
};
