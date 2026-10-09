// --- UTILITIES & UI HELPERS ---

window.formatPrice = (val) => {
    return Number(val || 0).toLocaleString();
};

window.formatDate = (ts) => {
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

window.formatNumberString = (val) => {
    if (val === undefined || val === null || val === '') return '';
    const cleaned = val.toString().replace(/\D/g, '');
    if (!cleaned) return '';
    const num = parseInt(cleaned, 10);
    return isNaN(num) ? '' : num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

window.parseNumber = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleaned = val.toString().replace(/,/g, '');
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
};

// Formats input value live with thousand separators while preserving cursor position
window.handleNumericInput = (input) => {
    const selectionStart = input.selectionStart;
    const originalLength = input.value.length;

    const clean = input.value.replace(/\D/g, '');
    if (clean === '') {
        input.value = '';
        return;
    }

    const num = parseInt(clean, 10);
    const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    input.value = formatted;

    const newLength = input.value.length;
    const diff = newLength - originalLength;
    const pos = selectionStart + diff;
    input.setSelectionRange(pos, pos);
};

// Animated toast notification display
window.showToast = (msg) => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[200px] transform transition-all duration-300 translate-x-full';
    el.innerHTML = `<div class="w-2 h-2 bg-accent rounded-full flex-shrink-0"></div><span class="text-sm font-medium">${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => el.classList.remove('translate-x-full'), 10);
    setTimeout(() => {
        el.classList.add('opacity-0', 'translate-x-full');
        setTimeout(() => el.remove(), 300);
    }, 3000);
};

// Fullscreen controller for tablet POS kiosk mode
window.toggleAppFullscreen = () => {
    try {
        const isFull = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
        if (!isFull) {
            const el = document.documentElement;
            if (el.requestFullscreen) {
                el.requestFullscreen().catch(() => {});
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            } else if (el.mozRequestFullScreen) {
                el.mozRequestFullScreen();
            }
            if (window.showToast) showToast('🖥️ Полноэкранный режим включен');
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
        }
    } catch (e) {
        console.warn('Fullscreen error:', e);
    }
};
