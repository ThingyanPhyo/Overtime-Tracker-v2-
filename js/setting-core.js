// ==========================================
// setting-core.js — Main menu + shared helpers
// ==========================================

// ── Shared Helpers (module-level — always available from app start, ──
// even if Settings tab has never been mounted this session. Home tab's
// quick actions reuse the export Sub layout and need these too.) ──
function _applyDarkHeadNav() {
    const headNav = document.querySelector('.head-nav');
    const bottomNav = document.querySelector('.bottom-nav');
    if (headNav) headNav.classList.add('dark-mode');
    if (bottomNav) bottomNav.classList.add('hide-nav');
}

function _removeDarkHeadNav() {
    const headNav = document.querySelector('.head-nav');
    const bottomNav = document.querySelector('.bottom-nav');
    if (headNav) headNav.classList.remove('dark-mode');
    if (bottomNav) bottomNav.classList.remove('hide-nav');
}

function _replaceBackBtnSvg() {
    const backBtn = document.getElementById('sub-back-btn')
        || document.querySelector('.sub-layout .back-btn')
        || document.querySelector('.head-nav .back-btn');
    if (backBtn) {
        backBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="back-btn-svg">
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>`;
    }
}

// Assign immediately at script load — not tied to window.views.setting running
window._settingHelpers = window._settingHelpers || {};
window._settingHelpers.applyDarkHeadNav  = _applyDarkHeadNav;
window._settingHelpers.removeDarkHeadNav = _removeDarkHeadNav;
window._settingHelpers.replaceBackBtnSvg = _replaceBackBtnSvg;

window.views = window.views || {};
window.views.setting = function(container) {

    // ── Local aliases (kept for existing code inside this function) ──
    const applyDarkHeadNav  = _applyDarkHeadNav;
    const removeDarkHeadNav = _removeDarkHeadNav;
    const replaceBackBtnSvg = _replaceBackBtnSvg;

    // Menu row နှိပ်ပြီး sub layout သို့ဆက်ဝင်တဲ့အခါ (forward navigation) —
    // Main Setting ကိုယ်တိုင် (.main-sub-fade) ကို fade-out အရင်ပြပြီးမှ
    // navigateFn ခေါ်သည့် helper — record-menu.js ရဲ့ recSubOut pattern
    function slideLeftThenNavigate(navigateFn) {
        const fadeEl = container.querySelector('.main-sub-fade');
        if (fadeEl) fadeEl.style.animation = 'mainSubOut 0.18s ease-in forwards';
        setTimeout(navigateFn, 180);
    }

    // expose helpers so sub-files can use them (merge — applyDarkHeadNav etc.
    // are already set at module-load time above; just add renderMainSetting)
    window._settingHelpers.renderMainSetting = renderMainSetting;

    // ── Main Menu ────────────────────────────────────
    // playFadeIn: sub-menu ကနေ back ကနေ ပြန်ဝင်တဲ့အခါ .main-sub-fade
    // (slide-in animation) ကို ပြရန် — Setting tab ကို ဘောင်တမ်နက်ကနေ
    // တိုက်ရိုက် ဖွင့်တဲ့ initial entry မှာတော့ animation မလိုအပ်ပါ
    // (default: true — sub-file တွေက window._settingHelpers.renderMainSetting()
    // ကို ဘယ်လိုပဲ ခေါ်ခေါ် ရှေးကလို fade-in ကို ဆက်ရအောင်)
    function renderMainSetting(playFadeIn) {
        if (playFadeIn === undefined) playFadeIn = true;
        container.innerHTML = `
            <div class="view-body setting-view-body${playFadeIn ? ' main-sub-fade' : ''}" style="padding:0;height:100%;display:flex;flex-direction:column;">
                <div class="list-wrapper setting-list-wrapper" style="flex:1;padding:0 16px;margin-top:8px;">

                    <div class="menu-row setting-menu-row" id="open-personal-menu">
                        <div class="menu-row-left">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-row-icon">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <div class="menu-row-text-wrap">
                                <span class="menu-row-label">${window.t('menu_personal_info')}</span>
                                <span class="menu-row-sub">${window.t('menu_personal_info_sub')}</span>
                            </div>
                        </div>
                        <span class="arrow-right">›</span>
                    </div>

                    <div class="menu-row setting-menu-row" id="open-security-menu">
                        <div class="menu-row-left">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-row-icon">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <div class="menu-row-text-wrap">
                                <span class="menu-row-label">${window.t('menu_security_info')}</span>
                                <span class="menu-row-sub">${window.t('menu_security_info_sub')}</span>
                            </div>
                        </div>
                        <span class="arrow-right">›</span>
                    </div>

                    <div class="menu-row setting-menu-row" id="open-lang-menu">
                        <div class="menu-row-left">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-row-icon">
                                <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
                                <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
                                <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
                                <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
                            </svg>
                            <div class="menu-row-text-wrap">
                                <span class="menu-row-label">${window.t('lang_menu_item')}</span>
                                <span class="menu-row-sub">${window.t('lang_menu_item_sub')}</span>
                            </div>
                        </div>
                        <span class="arrow-right">›</span>
                    </div>

                    <div class="menu-row setting-menu-row" id="open-record-rule-menu">
                        <div class="menu-row-left">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-row-icon">
                                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                                <line x1="3" y1="9" x2="21" y2="9"></line>
                                <line x1="3" y1="15" x2="21" y2="15"></line>
                                <line x1="9" y1="9" x2="9" y2="21"></line>
                            </svg>
                            <div class="menu-row-text-wrap">
                                <span class="menu-row-label">${window.t('menu_record_rule') || 'Record Rule'}</span>
                                <span class="menu-row-sub">${window.t('menu_record_rule_sub')}</span>
                            </div>
                        </div>
                        <span class="arrow-right">›</span>
                    </div>

                    <div class="menu-row setting-menu-row" id="open-export-menu">
                        <div class="menu-row-left">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-row-icon">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            <div class="menu-row-text-wrap">
                                <span class="menu-row-label">${window.t('menu_export')}</span>
                                <span class="menu-row-sub">${window.t('menu_export_sub')}</span>
                            </div>
                        </div>
                        <span class="arrow-right">›</span>
                    </div>

                    <div class="menu-row setting-menu-row" id="open-notif-menu">
                        <div class="menu-row-left">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-row-icon">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                            </svg>
                            <div class="menu-row-text-wrap">
                                <span class="menu-row-label">${window.t('menu_notif')}</span>
                                <span class="menu-row-sub">${window.t('menu_notif_sub')}</span>
                            </div>
                        </div>
                        <span class="arrow-right">›</span>
                    </div>

                    <div class="menu-row setting-menu-row" id="open-about-menu">
                        <div class="menu-row-left">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-row-icon">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <div class="menu-row-text-wrap">
                                <span class="menu-row-label">${window.t('menu_about')}</span>
                                <span class="menu-row-sub">${window.t('menu_about_sub')}</span>
                            </div>
                        </div>
                        <span class="arrow-right">›</span>
                    </div>

                </div>
            </div>
            <style>@keyframes mainSubIn{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}
            .main-sub-fade{animation:mainSubIn 0.2s ease-out;}
            @keyframes mainSubOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(-30px)}}</style>
        `;

        document.getElementById('open-personal-menu')?.addEventListener('click', () => slideLeftThenNavigate(() => window.openSettingPersonal()));
        document.getElementById('open-security-menu')?.addEventListener('click', () => slideLeftThenNavigate(() => window.openSettingSecurity()));
        document.getElementById('open-lang-menu')?.addEventListener('click', () => slideLeftThenNavigate(() => window.openSettingApplication()));
        document.getElementById('open-record-rule-menu')?.addEventListener('click', () => slideLeftThenNavigate(() => window.openSettingRecordRule()));
        document.getElementById('open-export-menu')?.addEventListener('click', () => slideLeftThenNavigate(() => window.openSettingExport()));
        document.getElementById('open-notif-menu')?.addEventListener('click', () => slideLeftThenNavigate(() => window.openSettingNotif()));
        document.getElementById('open-about-menu')?.addEventListener('click', () => slideLeftThenNavigate(() => window.openSettingAbout()));
    }

    // ── Init ─────────────────────────────────────────
    // Setting tab ကို bottom-nav ကနေ တိုက်ရိုက်ဖွင့်တဲ့ initial entry —
    // animation မလို (false ဖြင့် ခေါ်)
    renderMainSetting(false);

    if (typeof window._pendingAfterSettingLoad === 'function') {
        setTimeout(function() {
            if (typeof window._pendingAfterSettingLoad === 'function') {
                window._pendingAfterSettingLoad();
            }
        }, 80);
    }
};

// ── Sub-label Styles ──────────────────────────────────
(function() {
    if (document.getElementById('setting-sub-label-style')) return;
    var st = document.createElement('style');
    st.id = 'setting-sub-label-style';
    st.textContent = `
        .menu-row-text-wrap { display:flex; flex-direction:column; gap:2px; }
        .menu-row-text-wrap .menu-row-label { font-size:15px; color:#2d3748; font-weight:500; }
        .menu-row-text-wrap .menu-row-sub { font-size:12px !important; color:#b0bec5 !important;
            font-weight:400 !important; line-height:1.3; letter-spacing:0.1px; }
    `;
    document.head.appendChild(st);
})();
