// --- TABLET ZOOM CONTROLLER & GESTURE SYSTEM ---
const TABLET_ZOOM_KEY = window.AppConfig?.TABLET_ZOOM_KEY || 'pos_tablet_zoom_v3';

let tabletZoomLevel = (() => {
    try {
        const saved = localStorage.getItem(TABLET_ZOOM_KEY);
        if (saved) {
            const parsed = parseFloat(saved);
            if (parsed >= 0.5 && parsed <= 1.0) return Math.round(parsed * 100) / 100;
        }
    } catch (e) {}
    return 0.70; // Default 70% as requested by user
})();

window.tabletZoomLevel = tabletZoomLevel;

window.applyTabletZoom = () => {
    const isTabletLandscape = (window.innerWidth <= 1280 && window.innerHeight <= 950) || (window.innerWidth <= 1024);
    const zoomText = `${Math.round(tabletZoomLevel * 100)}%`;
    const zoomValEl = document.getElementById('tablet-zoom-value');
    if (zoomValEl) {
        zoomValEl.textContent = zoomText;
    }
    document.querySelectorAll('.tablet-zoom-value-sync').forEach(el => el.textContent = zoomText);

    if (isTabletLandscape) {
        document.documentElement.style.setProperty('--tablet-zoom', String(tabletZoomLevel));
        document.documentElement.style.fontSize = '';
        document.body.style.zoom = String(tabletZoomLevel);
        document.body.style.width = `calc(100vw / ${tabletZoomLevel})`;
        document.body.style.maxWidth = `calc(100vw / ${tabletZoomLevel})`;
        document.body.style.height = `calc(100dvh / ${tabletZoomLevel})`;
        document.body.style.minHeight = `calc(100dvh / ${tabletZoomLevel})`;
        document.body.style.maxHeight = `calc(100dvh / ${tabletZoomLevel})`;
    } else {
        document.documentElement.style.removeProperty('--tablet-zoom');
        document.documentElement.style.fontSize = '';
        document.body.style.zoom = '';
        document.body.style.width = '';
        document.body.style.maxWidth = '';
        document.body.style.height = '';
        document.body.style.minHeight = '';
        document.body.style.maxHeight = '';
    }
};

window.changeTabletZoom = (delta) => {
    let next = Math.round((tabletZoomLevel + delta) * 100) / 100;
    if (next < 0.5) next = 0.5;
    if (next > 1.0) next = 1.0;
    tabletZoomLevel = next;
    window.tabletZoomLevel = next;
    try {
        localStorage.setItem(TABLET_ZOOM_KEY, String(tabletZoomLevel));
    } catch (e) {}
    applyTabletZoom();
    window.dispatchEvent(new Event('resize'));
};

window.resetTabletZoom = () => {
    tabletZoomLevel = 0.70;
    window.tabletZoomLevel = 0.70;
    try {
        localStorage.setItem(TABLET_ZOOM_KEY, '0.70');
    } catch (e) {}
    applyTabletZoom();
    window.dispatchEvent(new Event('resize'));
};

window.addEventListener('resize', applyTabletZoom);
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTabletZoom);
} else {
    applyTabletZoom();
}

// TABLET TOUCH-SCROLL GESTURE HELPER
// Ensures smooth, effortless vertical scrolling across tables and inputs on tablets
let touchScrollActive = false;
let touchStartY = 0;
let touchStartX = 0;
let initialScrollTop = 0;

document.addEventListener('touchstart', (e) => {
    const main = document.getElementById('main-content');
    if (!main || (window.state && window.state.activeTab === 'kassa')) return;
    if (e.target.closest('button, a, #modal-container, #scanner-modal-container')) return;
    if (e.touches && e.touches.length === 1 && main.contains(e.target)) {
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        initialScrollTop = main.scrollTop;
        touchScrollActive = true;
    }
}, { passive: true });

document.addEventListener('touchmove', (e) => {
    if (!touchScrollActive) return;
    const main = document.getElementById('main-content');
    if (!main || (window.state && window.state.activeTab === 'kassa')) return;
    if (e.touches && e.touches.length === 1) {
        const diffX = Math.abs(e.touches[0].clientX - touchStartX);
        const diffY = e.touches[0].clientY - touchStartY;
        // Allow horizontal table pan if horizontal motion is dominant
        if (diffX > Math.abs(diffY) + 8) return;

        const isTabletLandscape = window.innerWidth <= 1024 && window.innerHeight <= 550;
        const zoomFactor = isTabletLandscape ? (tabletZoomLevel || 0.70) : 1;
        main.scrollTop = initialScrollTop - (diffY / zoomFactor);
    }
}, { passive: true });

const endTouchScroll = () => { touchScrollActive = false; };
document.addEventListener('touchend', endTouchScroll, { passive: true });
document.addEventListener('touchcancel', endTouchScroll, { passive: true });

// MODAL SCROLL LOCK OBSERVER
window.updateModalBodyScrollLock = () => {
    const hasModal = ['modal-container', 'sklad-modal', 'debt-modal-root'].some(id => {
        const el = document.getElementById(id);
        return el && el.children.length > 0 && el.innerHTML.trim() !== '';
    });
    if (hasModal) {
        document.body.classList.add('modal-open');
    } else {
        document.body.classList.remove('modal-open');
    }
};

window.modalObserver = new MutationObserver(window.updateModalBodyScrollLock);
window.initModalScrollLock = () => {
    ['modal-container', 'sklad-modal', 'debt-modal-root'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            window.modalObserver.observe(el, { childList: true, subtree: true });
        }
    });
    window.modalObserver.observe(document.body, { childList: true });
};
