// ==========================================
// setting-security.js — Security + Change PIN
// ==========================================
(function() {

function applyDarkHeadNav()   { window._settingHelpers?.applyDarkHeadNav(); }
function removeDarkHeadNav()  { window._settingHelpers?.removeDarkHeadNav(); }
function replaceBackBtnSvg()  { window._settingHelpers?.replaceBackBtnSvg(); }

const PIN_CHANGED_KEY     = 'app_pin_changed_at';
const PRIVACY_SCREEN_KEY  = 'privacy_screen_enabled';

// PIN/Backup စတာတွေ ဘယ်တုန်းက last ဖြစ်ခဲ့လဲ — relative time (Today / Yesterday / X ရက်/လ/နှစ်က)
// keyPrefix ဖြင့် context အလိုက် (security_changed_xxx / data_backup_xxx) i18n text ကွဲပေးနိုင်သည်
// (ဘာသာစကားအလိုက် စာကြောင်းဖွဲ့စည်းပုံ မတူတာမို့ prefix+suffix ခွဲမတွဲဘဲ key တစ်ခုချင်းစီ ပြည့်ပြည့်စုံစုံ ဘာသာပြန်ထားသည်)
function formatRelativeTime(ts, keyPrefix) {
    if (!ts) return '';
    keyPrefix = keyPrefix || 'security_changed';
    var diffMs   = Date.now() - parseInt(ts);
    var diffDays = Math.floor(diffMs / 86400000);
    if (diffDays <= 0)  return window.t(keyPrefix + '_today')     || 'Changed today';
    if (diffDays === 1) return window.t(keyPrefix + '_yesterday') || 'Changed yesterday';
    if (diffDays < 30)  return (window.t(keyPrefix + '_days_ago') || 'Changed {n} days ago').replace('{n}', diffDays);
    var diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return (window.t(keyPrefix + '_months_ago') || 'Changed {n} months ago').replace('{n}', diffMonths);
    var diffYears = Math.floor(diffMonths / 12);
    return (window.t(keyPrefix + '_years_ago') || 'Changed {n} years ago').replace('{n}', diffYears);
}
// setting-data.js ကလည်း ဒီ relative-time helper တစ်ခုတည်းကိုပဲ ပြန်သုံးနိုင်အောင်
window.formatRelativeTime = formatRelativeTime;

function openSecuritySubLayout() {
    if (typeof window.openSubLayout !== 'function') return;

    var pinChangedAt   = localStorage.getItem(PIN_CHANGED_KEY);
    var pinSubLabel     = pinChangedAt ? formatRelativeTime(pinChangedAt) : '';
    var privacyEnabled  = localStorage.getItem(PRIVACY_SCREEN_KEY) !== '0'; // default ON

    window.openSubLayout(window.t('menu_security_info'), () => `
        <div id="security-view-marker" style="display:none;"></div>
        <div class="list-wrapper setting-list-wrapper">
            <div class="menu-row setting-menu-row" id="open-change-pin-menu">
                <div class="menu-row-left">
                    <div class="menu-row-text-wrap">
                        <span class="menu-row-label">${window.t('menu_change_pin')}</span>
                        ${pinSubLabel ? '<span class="menu-row-sub">' + pinSubLabel + '</span>' : ''}
                    </div>
                </div>
                <span class="arrow-right">›</span>
            </div>

            <div class="lang-row" style="align-items:center;">
                <div class="menu-row-text-wrap">
                    <span class="menu-row-label">${window.t('security_privacy_screen') || 'Privacy Screen'}</span>
                    <span class="menu-row-sub">${window.t('security_privacy_screen_sub') || 'Hide app content in the recent-apps preview'}</span>
                </div>
                <label style="position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0;">
                    <input type="checkbox" id="privacy-screen-toggle" ${privacyEnabled ? 'checked' : ''} style="opacity:0;width:0;height:0;">
                    <span id="privacy-screen-track" style="
                        position:absolute;inset:0;border-radius:34px;cursor:pointer;
                        background:${privacyEnabled ? '#10b981' : '#e2e8f0'};transition:background 0.2s;">
                    </span>
                    <span id="privacy-screen-thumb" style="
                        position:absolute;top:3px;left:${privacyEnabled ? '23px' : '3px'};
                        width:18px;height:18px;border-radius:50%;background:#fff;
                        box-shadow:0 1px 4px rgba(0,0,0,0.18);transition:left 0.2s;">
                    </span>
                </label>
            </div>
        </div>`);

    replaceBackBtnSvg();
    applyDarkHeadNav();
    const backBtn = document.getElementById('sub-back-btn')
        || document.querySelector('.sub-layout .back-btn')
        || document.querySelector('.head-nav .back-btn');
    backBtn?.addEventListener('click', removeDarkHeadNav, { once: true });
    document.getElementById('open-change-pin-menu')?.addEventListener('click', openChangePinFlow);

    const pToggle = document.getElementById('privacy-screen-toggle');
    const pTrack  = document.getElementById('privacy-screen-track');
    const pThumb  = document.getElementById('privacy-screen-thumb');
    pToggle?.addEventListener('change', function() {
        var isOn = pToggle.checked;
        localStorage.setItem(PRIVACY_SCREEN_KEY, isOn ? '1' : '0');
        pTrack.style.background = isOn ? '#10b981' : '#e2e8f0';
        pThumb.style.left       = isOn ? '23px' : '3px';
    });
}

function openChangePinFlow() {
    var existingPin = localStorage.getItem('app_pin');
    var isCreate    = !existingPin;
    var step        = isCreate ? 'enter_new' : 'verify_old';
    var newPinTemp  = '';

    function getStepLabel() {
        if (step === 'verify_old')  return window.t('change_pin_enter_old');
        if (step === 'enter_new')   return isCreate ? window.t('create_pin_enter') : window.t('change_pin_enter_new');
        return isCreate ? window.t('create_pin_confirm') : window.t('change_pin_confirm_new');
    }
    function getHeadTitle() { return isCreate ? window.t('create_pin_title') : window.t('menu_change_pin'); }

    // playFadeIn: Change PIN menu ကို ပထမဆုံးနှိပ်ပြီး sub-layout ထဲ ဝင်တဲ့
    // တစ်ချက်တည်းမှာသာ Head Navigation animation ကို ပြရန် — keypad နှိပ်ပြီး
    // step (verify_old → enter_new → confirm_new) ပြောင်းတိုင်း ပြန်မပြစေရန်
    function renderPinScreen(errorMsg, playFadeIn) {
        errorMsg = errorMsg || '';
        var cv = document.getElementById('content-view'); if (!cv) return;
        cv.innerHTML = `
            <div class="sub-layout cp-sub-layout${playFadeIn ? ' cp-sub-fade' : ''}">
            <div class="sub-head">
                <div class="head-nav dark-mode cp-head-nav">
                    <button id="sub-back-btn" class="back-btn cp-back-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <div class="head-title cp-head-title">${getHeadTitle()}</div>
                </div>
            </div>
            <div id="change-pin-wrapper" class="sub-body cp-wrapper">
                <div class="cp-upper">
                    <p id="cp-step-label" class="cp-step-label">${getStepLabel()}</p>
                    <div id="cp-dots" class="cp-dots">
                        ${[0,1,2,3,4,5].map(i => '<div class="cp-dot" data-index="'+i+'"></div>').join('')}
                    </div>
                    <p id="cp-error" class="cp-error">${errorMsg}</p>
                </div>
                <div id="cp-keypad" class="cp-keypad">
                    ${['1','2','3','4','5','6','7','8','9','','0','DEL'].map(function(key, idx) {
                        var isEmpty = key === '', isDel = key === 'DEL';
                        var col = idx % 3;
                        var bR = col < 2 ? 'border-right:1px solid #e2e8f0;' : '';
                        var bB = idx < 9 ? 'border-bottom:1px solid #e2e8f0;' : '';
                        return '<button class="cp-key" data-key="'+key+'" style="'+bR+bB+'pointer-events:'+(isEmpty?'none':'auto')+';cursor:'+(isEmpty?'default':'pointer')+';">'
                            + (isDel ? '<svg width="26" height="26" viewBox="0 0 24 24" fill="#5b21b6" stroke="none" style="display:block;"><path d="M22 3H7c-.55 0-1.05.28-1.35.72L1 12l4.65 8.28c.3.44.8.72 1.35.72H22c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.7 12.3a1 1 0 0 1-1.42 1.4L13 13.42l-2.88 2.88a1 1 0 1 1-1.42-1.42L11.58 12 8.7 9.12a1 1 0 1 1 1.42-1.42L13 10.58l2.88-2.88a1 1 0 0 1 1.42 1.42L14.42 12l2.88 2.88z"/></svg>' : key)
                            + '</button>';
                    }).join('')}
                </div>
            </div>
            </div>
            <style>@keyframes cpSubIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
            .cp-sub-fade{animation:cpSubIn 0.2s ease-out;}
            @keyframes cpSubOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(30px)}}</style>`;

        document.getElementById('sub-back-btn')?.addEventListener('click', () => openSecuritySubLayout(), { once: true });
        var currentPin = '';
        function updateDots() {
            document.querySelectorAll('.cp-dot').forEach((d, i) => { d.style.background = i < currentPin.length ? '#5b21b6' : 'transparent'; });
        }
        function processPin(pin) {
            if (step === 'verify_old') {
                pin === localStorage.getItem('app_pin') ? (step = 'enter_new', renderPinScreen()) : renderPinScreen(window.t('change_pin_wrong_old'));
            } else if (step === 'enter_new') {
                newPinTemp = pin; step = 'confirm_new'; renderPinScreen();
            } else {
                if (pin === newPinTemp) { localStorage.setItem('app_pin', pin); localStorage.setItem(PIN_CHANGED_KEY, String(Date.now())); showSuccess(); }
                else { newPinTemp = ''; step = 'enter_new'; renderPinScreen(isCreate ? window.t('create_pin_mismatch') : window.t('change_pin_mismatch')); }
            }
        }
        document.getElementById('cp-keypad')?.addEventListener('click', function(e) {
            var btn = e.target.closest('.cp-key'); if (!btn) return;
            var key = btn.dataset.key; if (!key) return;
            btn.style.background = '#ede9fe';
            setTimeout(() => { btn.style.background = '#fff'; }, 150);
            if (key === 'DEL') { currentPin = currentPin.slice(0,-1); updateDots(); return; }
            if (currentPin.length >= 6) return;
            currentPin += key; updateDots();
            if (currentPin.length === 6) {
                var p = currentPin; currentPin = ''; updateDots();
                setTimeout(() => processPin(p), 150);
            }
        });
    }

    function showSuccess() {
        var w = document.getElementById('change-pin-wrapper'); if (!w) return;
        w.innerHTML = `
            <div class="cp-success-wrap">
                <div class="cp-success-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#38a169" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <p class="cp-success-msg">${isCreate ? window.t('create_pin_success') : window.t('change_pin_success')}</p>
                <button id="cp-ok-btn" class="cp-ok-btn">${window.t('change_pin_ok')}</button>
            </div>`;
        document.getElementById('cp-ok-btn')?.addEventListener('click', () => openSecuritySubLayout());
    }

    renderPinScreen('', true);
}

window.openSettingSecurity = openSecuritySubLayout;

})();
