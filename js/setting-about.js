// ==========================================
// setting-about.js — About App
// ==========================================
(function() {

function applyDarkHeadNav()  { window._settingHelpers?.applyDarkHeadNav(); }
function replaceBackBtnSvg() { window._settingHelpers?.replaceBackBtnSvg(); }

function openAboutSubLayout() {
    if (typeof window.openSubLayout !== 'function') return;

    window.openSubLayout(window.t('menu_about'), () => `
        <div class="list-wrapper setting-list-wrapper">

            <div style="display:flex;flex-direction:column;align-items:center;padding:28px 16px 24px;">
                <div style="width:72px;height:72px;border-radius:20px;
                    background:linear-gradient(135deg,#10b981,#059669);
                    display:flex;align-items:center;justify-content:center;
                    margin-bottom:14px;box-shadow:0 6px 20px rgba(16,185,129,0.28);">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </div>
                <div style="font-size:18px;font-weight:700;color:#1a202c;">${window.t('about_app_name')}</div>
                <div style="font-size:13px;color:#a0aec0;margin-top:4px;">${window.t('about_version')} 1.0.0</div>
            </div>

            <div class="lang-row">
                <span class="menu-row-label">${window.t('about_version')}</span>
                <span style="font-size:14px;color:#718096;font-weight:500;">1.0.0</span>
            </div>
            <div class="lang-row">
                <span class="menu-row-label">${window.t('about_build')}</span>
                <span style="font-size:14px;color:#718096;font-weight:500;">2026.06</span>
            </div>
            <div class="lang-row" style="border-bottom:none;">
                <span class="menu-row-label">${window.t('about_developer')}</span>
                <span style="font-size:14px;color:#718096;font-weight:500;">${window.t('about_developer_name')}</span>
            </div>

        </div>`);

    replaceBackBtnSvg();
    applyDarkHeadNav();
}

window.openSettingAbout = openAboutSubLayout;

})();
