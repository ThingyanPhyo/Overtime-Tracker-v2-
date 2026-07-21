// ==========================================
// setting-personal.js — Personal Info sub layout
// Sub-layout animation pattern ကို record-menu.js ရဲ့ openRecSubLayout()
// (recSubIn/recSubOut) အတိုင်း တိုက်ရိုက်ကူးသုံးထားသည် — existing
// .sub-layout wrapper elements ပေါ်မှာပဲ fade class ကို ထပ်ထည့်ပြီး
// <style> ထဲမှာ keyframe ကို embed လုပ်ထားလို့ render ဖြစ်တာနဲ့ entrance
// animation အလိုအလျောက် run သွားသည် (JS reflow-trick မလိုအပ်တော့ပါ)
// ==========================================
(function() {

function h() { return window._settingHelpers || {}; }

function openPersonalSubLayout(isReturning) {
    ['pic-sub-layout','email-sub-layout'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el && typeof el._kbCleanup === 'function') el._kbCleanup();
    });

    const contentView = document.getElementById('content-view');
    const bottomNav   = document.getElementById('main-bottom-nav');
    if (!contentView || !bottomNav) return;
    bottomNav.classList.add('hidden');

    const photo = (typeof window.getProfilePhoto === 'function') ? window.getProfilePhoto() : null;
    const avatarHTML = photo
        ? `<img src="${photo}" class="personal-avatar-img" alt="profile">`
        : `<div class="personal-avatar-placeholder">
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8">
                   <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                   <circle cx="12" cy="7" r="4"></circle>
               </svg>
           </div>`;

    contentView.innerHTML = `
        <div class="sub-layout personal-sub-fade">
        <div id="personal-view-marker" style="display:none;"></div>
        <div class="sub-head">
            <div class="personal-header-section">
                <button class="personal-back-btn" id="personal-back-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <span class="personal-header-title">${window.t('menu_personal_info')}</span>
                <div class="personal-avatar-wrap" id="personal-avatar-trigger">${avatarHTML}</div>
                <div class="personal-name-display" id="personal-name-display">
                    ${localStorage.getItem('ot_username')
                        ? `<span class="personal-name-label">${window.t('personal_name_label')}:</span> <span class="personal-name-value">${localStorage.getItem('ot_username')}</span>`
                        : ''}
                </div>
            </div>
        </div>
        <div class="sub-body">
            <div class="personal-divider"></div>
            <div class="list-wrapper setting-list-wrapper">
                <div class="menu-row personal-menu-row" id="personal-picture-row">
                    <span>${window.t('personal_picture')}</span>
                    <span class="arrow-right">›</span>
                </div>
                <div class="menu-row personal-menu-row" id="personal-email-row">
                    <span>${window.t('personal_email')}</span>
                    <span class="arrow-right">›</span>
                </div>
            </div>
        </div>
        </div>
        <style>@keyframes personalSubIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .personal-sub-fade{animation:personalSubIn 0.2s ease-out;}
        @keyframes personalSubOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(30px)}}</style>`;

    // hardware back ခလုတ်အတွက် — Personal Info ကို Setting tab ကနေ တစ်ခါ
    // ဝင်တဲ့အခါမှသာ register (Picture/Email ကနေ ပြန်ဝင်လာတာဆိုရင် (isReturning)
    // ရှေ့က register ထားတဲ့ handler ကိုပဲ ဆက်သုံး — ထပ်မထည့်ပါ)
    if (!isReturning && window.pushBackHandler) {
        window.pushBackHandler(() => document.getElementById('personal-back-btn')?.click());
    }

    document.getElementById('personal-back-btn')?.addEventListener('click', () => {
        if (window.popBackHandler) window.popBackHandler();
        const fadeEl = document.querySelector('.personal-sub-fade');
        if (fadeEl) fadeEl.style.animation = 'personalSubOut 0.18s ease-in forwards';
        setTimeout(() => {
            bottomNav.classList.remove('hidden', 'hide-nav');
            // header/bottomNav/body အားလုံး ညီညာစွာ slide-in ဝင်ရန် (app.js ရဲ့
            // openSubLayout back button default behavior အတိုင်း) flag ကို set
            if (typeof _loadTab === 'function') {
                _loadTab._fromBack = true;
                _loadTab('setting');
            } else {
                window.switchTab('setting');
            }
        }, 180);
    });
    document.getElementById('personal-picture-row')?.addEventListener('click', () => {
        const fadeEl = document.querySelector('.personal-sub-fade');
        if (fadeEl) fadeEl.style.animation = 'personalSubOut 0.18s ease-in forwards';
        setTimeout(() => openPictureSubLayout(), 180);
    });
    document.getElementById('personal-email-row')?.addEventListener('click', () => {
        const fadeEl = document.querySelector('.personal-sub-fade');
        if (fadeEl) fadeEl.style.animation = 'personalSubOut 0.18s ease-in forwards';
        setTimeout(() => openEmailSubLayout(), 180);
    });
}

function openPictureSubLayout(isRefresh) {
    // ကိုယ့်ဟာကိုယ် ပြန်ဖွင့်နေတာဆိုရင် (upload/delete ပြီးနောက် ပြန် render) —
    // ရှေ့က push ထားတဲ့ handler ဟာဟာသက်သက် ကျန်နေမှာမို့ အရင်ဖယ်ပြီးမှ အသစ်ထည့်
    if (isRefresh && window.popBackHandler) window.popBackHandler();
    const contentView = document.getElementById('content-view');
    if (!contentView) return;
    const photo     = (typeof window.getProfilePhoto === 'function') ? window.getProfilePhoto() : null;
    const savedName = localStorage.getItem('ot_username') || '';
    const previewHTML = photo
        ? `<img src="${photo}" class="personal-avatar-img" alt="preview">`
        : `<div class="personal-avatar-placeholder">
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.5">
                   <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                   <circle cx="12" cy="7" r="4"></circle>
               </svg>
           </div>`;

    contentView.innerHTML = `
        <div class="sub-layout pic-sub-fade" id="pic-sub-layout">
        <div class="sub-head">
            <div class="pic-sub-header">
                <button class="personal-back-btn" id="pic-sub-back-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <span class="personal-header-title">${window.t('personal_picture')}</span>
                <div class="personal-avatar-wrap" id="pic-avatar-trigger">
                    ${previewHTML}
                    <div class="personal-avatar-edit-badge">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </div>
                </div>
                <div class="personal-name-display">
                    ${savedName ? `<span class="personal-name-label">${window.t('personal_name_label')}:</span> <span class="personal-name-value">${savedName}</span>` : ''}
                </div>
            </div>
        </div>
        <div class="sub-body">
            <div class="username-input-wrap">
                <input type="text" id="username-input" class="username-input"
                    placeholder="${window.t('personal_username_placeholder')}"
                    value="${savedName}" maxlength="30">
            </div>
            <div class="personal-divider"></div>
            <div class="username-action-bar">
                <button class="username-action-btn username-cancel-btn" id="username-cancel-btn">
                    <div class="btn-icon-circle">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </div>
                    <span>Cancel</span>
                </button>
                <button class="username-action-btn username-confirm-btn username-confirm-disabled"
                        id="username-confirm-btn" disabled>
                    <div class="btn-icon-circle">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <span>Confirm</span>
                </button>
            </div>
        </div>
        </div>
        <style>@keyframes picSubIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .pic-sub-fade{animation:picSubIn 0.2s ease-out;}
        @keyframes picSubOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(30px)}}</style>`;

    if (window.pushBackHandler) {
        window.pushBackHandler(() => document.getElementById('pic-sub-back-btn')?.click());
    }

    function exitToPersonal() {
        if (window.popBackHandler) window.popBackHandler();
        const fadeEl = document.getElementById('pic-sub-layout');
        if (fadeEl) fadeEl.style.animation = 'picSubOut 0.18s ease-in forwards';
        setTimeout(() => openPersonalSubLayout(true), 180);
    }
    document.getElementById('pic-sub-back-btn')?.addEventListener('click', exitToPersonal);
    document.getElementById('username-cancel-btn')?.addEventListener('click', exitToPersonal);

    // Keyboard show/hide — action bar ကို keyboard နဲ့ sync
    (function() {
        var initH = window.innerHeight;
        function onResize() {
            var bar = document.querySelector('.username-action-bar');
            if (!bar) return;
            var kbOpen = window.innerHeight < initH - 100;
            bar.classList.toggle('keyboard-hidden', kbOpen);
        }
        window.addEventListener('resize', onResize);
        // cleanup — sub-layout ပြန်ဆင်းရင် listener ဖယ်
        var sublayout = document.getElementById('pic-sub-layout');
        if (sublayout) sublayout._kbCleanup = function() { window.removeEventListener('resize', onResize); };
    })();
    document.getElementById('username-input')?.addEventListener('input', function() {
        const btn = document.getElementById('username-confirm-btn');
        if (!btn) return;
        const trimmed = this.value.trim();
        const unchanged = trimmed === savedName;
        const empty = trimmed.length === 0;
        const shouldDisable = empty || unchanged;
        btn.disabled = shouldDisable;
        btn.classList.toggle('username-confirm-disabled', shouldDisable);
    });
    document.getElementById('username-confirm-btn')?.addEventListener('click', () => {
        const val = document.getElementById('username-input')?.value.trim() || '';
        if (!val) return;
        const overlay = document.createElement('div');
        overlay.id = 'pic-saving-overlay'; overlay.className = 'pic-saving-overlay';
        overlay.innerHTML = `<div class="pic-saving-spinner"></div>`;
        document.querySelector('.sub-layout')?.appendChild(overlay);
        localStorage.setItem('ot_username', val);
        setTimeout(() => {
            const spinner = overlay.querySelector('.pic-saving-spinner');
            if (spinner) {
                spinner.classList.remove('pic-saving-spinner');
                spinner.classList.add('pic-saving-check');
                spinner.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            }
            setTimeout(() => {
                document.getElementById('pic-saving-overlay')?.remove();
                if (window.popBackHandler) window.popBackHandler();
                openPersonalSubLayout(true);
            }, 400);
        }, 700);
    });

    let fileInput = document.getElementById('profile-photo-input');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file'; fileInput.id = 'profile-photo-input';
        fileInput.accept = 'image/*'; fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
    }
    const fresh = fileInput.cloneNode();
    fileInput.replaceWith(fresh); fresh.id = 'profile-photo-input';
    fresh.addEventListener('change', function() {
        const file = this.files[0]; if (!file) return;
        if (typeof window.compressProfileImage === 'function') {
            window.compressProfileImage(file, function(b64) {
                if (typeof window.saveProfilePhoto === 'function') window.saveProfilePhoto(b64);
                if (typeof window.patchProfileAvatar === 'function') window.patchProfileAvatar();
                openPictureSubLayout(true);
            });
        }
        this.value = '';
    });
    document.getElementById('pic-avatar-trigger')?.addEventListener('click', () => openPictureDialog(fresh));
}

function openEmailSubLayout() {
    const contentView = document.getElementById('content-view');
    if (!contentView) return;
    const savedEmail = localStorage.getItem('ot_email') || '';

    contentView.innerHTML = `
        <div class="sub-layout email-sub-fade" id="email-sub-layout">
        <div class="sub-head">
            <div class="pic-sub-header">
                <button class="personal-back-btn" id="email-back-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <span class="personal-header-title">${window.t ? window.t('personal_email') : 'Email'}</span>
            </div>
        </div>
        <div class="sub-body">
            <div class="username-input-wrap">
                <input type="email" id="email-input" class="username-input"
                    placeholder="example@email.com" value="${savedEmail}" maxlength="80" autocomplete="email">
            </div>
            <div class="personal-divider"></div>
            <div class="username-action-bar">
                <button class="username-action-btn username-cancel-btn" id="email-cancel-btn">
                    <div class="btn-icon-circle">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </div>
                    <span>Cancel</span>
                </button>
                <button class="username-action-btn username-confirm-btn username-confirm-disabled"
                        id="email-confirm-btn" disabled>
                    <div class="btn-icon-circle">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <span>Confirm</span>
                </button>
            </div>
        </div>
        </div>
        <style>@keyframes emailSubIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .email-sub-fade{animation:emailSubIn 0.2s ease-out;}
        @keyframes emailSubOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(30px)}}</style>`;

    if (window.pushBackHandler) {
        window.pushBackHandler(() => document.getElementById('email-back-btn')?.click());
    }

    function exitToPersonal() {
        if (window.popBackHandler) window.popBackHandler();
        const fadeEl = document.getElementById('email-sub-layout');
        if (fadeEl) fadeEl.style.animation = 'emailSubOut 0.18s ease-in forwards';
        setTimeout(() => openPersonalSubLayout(true), 180);
    }
    document.getElementById('email-back-btn')?.addEventListener('click',    exitToPersonal);
    document.getElementById('email-cancel-btn')?.addEventListener('click',  exitToPersonal);

    (function() {
        var initH = window.innerHeight;
        function onResize() {
            var bar = document.querySelector('.username-action-bar');
            if (!bar) return;
            var kbOpen = window.innerHeight < initH - 100;
            bar.classList.toggle('keyboard-hidden', kbOpen);
        }
        window.addEventListener('resize', onResize);
        var sublayout = document.getElementById('email-sub-layout');
        if (sublayout) sublayout._kbCleanup = function() { window.removeEventListener('resize', onResize); };
    })();
    document.getElementById('email-input')?.addEventListener('input', function() {
        const btn = document.getElementById('email-confirm-btn'); if (!btn) return;
        const trimmed = this.value.trim();
        const unchanged = trimmed === savedEmail;
        const empty = trimmed.length === 0;
        const shouldDisable = empty || unchanged;
        btn.disabled = shouldDisable;
        btn.classList.toggle('username-confirm-disabled', shouldDisable);
    });
    document.getElementById('email-confirm-btn')?.addEventListener('click', () => {
        const val = document.getElementById('email-input')?.value.trim() || '';
        if (!val) return;
        const overlay = document.createElement('div');
        overlay.className = 'pic-saving-overlay';
        overlay.innerHTML = `<div class="pic-saving-spinner"></div>`;
        document.querySelector('.sub-layout')?.appendChild(overlay);
        localStorage.setItem('ot_email', val);
        setTimeout(() => {
            const spinner = overlay.querySelector('.pic-saving-spinner');
            if (spinner) {
                spinner.classList.remove('pic-saving-spinner');
                spinner.classList.add('pic-saving-check');
                spinner.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
            }
            setTimeout(() => {
                overlay.remove();
                if (window.popBackHandler) window.popBackHandler();
                openPersonalSubLayout(true);
            }, 400);
        }, 700);
    });
}

function openPictureDialog(fileInput) {
    document.getElementById('pic-dialog-overlay')?.remove();
    const photo = (typeof window.getProfilePhoto === 'function') ? window.getProfilePhoto() : null;
    const overlay = document.createElement('div');
    overlay.id = 'pic-dialog-overlay'; overlay.className = 'pic-dialog-overlay';
    overlay.innerHTML = `
        <div class="pic-dialog-modal">
            <button class="pic-dialog-close" id="pic-dialog-cancel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="pic-dialog-grid">
                <button class="pic-dialog-box" id="pic-dialog-upload">
                    <div class="pic-dialog-box-icon pic-dialog-icon-upload">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                    </div>
                    <span class="pic-dialog-box-label">${window.t('personal_pic_upload')}</span>
                </button>
                <button class="pic-dialog-box ${!photo ? 'pic-dialog-box-disabled' : ''}" id="pic-dialog-delete" ${!photo ? 'disabled' : ''}>
                    <div class="pic-dialog-box-icon pic-dialog-icon-delete">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"></path><path d="M8 6V4h8v2"></path>
                            <rect x="5" y="6" width="14" height="14" rx="2"></rect>
                            <path d="M10 11v4"></path><path d="M14 11v4"></path>
                        </svg>
                    </div>
                    <span class="pic-dialog-box-label">${window.t('personal_pic_delete')}</span>
                </button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('pic-dialog-cancel')?.addEventListener('click', () => overlay.remove());
    document.getElementById('pic-dialog-upload')?.addEventListener('click', () => { overlay.remove(); fileInput.click(); });
    document.getElementById('pic-dialog-delete')?.addEventListener('click', () => {
        if (!window.getProfilePhoto()) return;
        overlay.remove();
        localStorage.removeItem('ot_profile_photo');
        if (typeof window.patchProfileAvatar === 'function') window.patchProfileAvatar();
        openPictureSubLayout(true);
    });
}

window.openSettingPersonal = openPersonalSubLayout;

})();
