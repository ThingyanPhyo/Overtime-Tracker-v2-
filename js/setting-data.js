// ==========================================
// setting-data.js — Data Management
// Sub-layout animation pattern ကို record-menu.js ရဲ့ openRecSubLayout()
// (recSubIn/recSubOut) အတိုင်း တိုက်ရိုက်ကူးသုံးထားသည်
// ==========================================
(function() {

function applyDarkHeadNav()  { window._settingHelpers?.applyDarkHeadNav(); }
function removeDarkHeadNav() { window._settingHelpers?.removeDarkHeadNav(); }
function replaceBackBtnSvg() { window._settingHelpers?.replaceBackBtnSvg(); }

function openDataSubLayout() {
    if (typeof window.openSubLayout !== 'function') return;

    var lastBackupAt = localStorage.getItem('last_backup_at');
    var lastBackupSub = lastBackupAt && typeof window.formatRelativeTime === 'function'
        ? window.formatRelativeTime(lastBackupAt, 'data_backup')
        : (window.t('data_backup_sub'));

    window.openSubLayout(window.t('data_section_title') || 'Data Management', () => `
        <div class="data-sub-fade">
        <div class="list-wrapper setting-list-wrapper">

            <div class="menu-row setting-menu-row" id="data-backup-btn">
                <div class="menu-row-left">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-row-icon">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    <div class="menu-row-text-wrap">
                        <span class="menu-row-label">${window.t('data_backup')}</span>
                        <span class="menu-row-sub">${lastBackupSub}</span>
                    </div>
                </div>
                <span class="arrow-right">›</span>
            </div>

            <div class="menu-row setting-menu-row" id="data-restore-btn">
                <div class="menu-row-left">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-row-icon">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                    <div class="menu-row-text-wrap">
                        <span class="menu-row-label">${window.t('data_restore')}</span>
                        <span class="menu-row-sub">${window.t('data_restore_sub')}</span>
                    </div>
                </div>
                <span class="arrow-right">›</span>
            </div>

            <div class="menu-row setting-menu-row" id="data-clear-btn">
                <div class="menu-row-left">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-row-icon">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
                        <path d="M10 11v6"></path><path d="M14 11v6"></path>
                    </svg>
                    <div class="menu-row-text-wrap">
                        <span class="menu-row-label" style="color:#e53e3e;">${window.t('data_clear')}</span>
                        <span class="menu-row-sub">${window.t('data_clear_sub')}</span>
                    </div>
                </div>
                <span class="arrow-right" style="color:#e53e3e;">›</span>
            </div>

            <div class="menu-row setting-menu-row" id="data-reset-btn">
                <div class="menu-row-left">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e53e3e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="menu-row-icon">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                    </svg>
                    <div class="menu-row-text-wrap">
                        <span class="menu-row-label" style="color:#e53e3e;">${window.t('data_reset')}</span>
                        <span class="menu-row-sub">${window.t('data_reset_sub')}</span>
                    </div>
                </div>
                <span class="arrow-right" style="color:#e53e3e;">›</span>
            </div>

            <input type="file" id="data-restore-file-input" accept=".json" style="display:none;">
        </div>
        </div>
        <style>@keyframes dataSubIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .data-sub-fade{animation:dataSubIn 0.2s ease-out;}
        @keyframes dataSubOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(30px)}}</style>`);

    replaceBackBtnSvg();
    applyDarkHeadNav();

    // Back button ကို clone+replace လုပ်ပြီး default listener (Main setting ကို သွားစေတဲ့) အားလုံးကို ဖယ်ရှားပါ
    const backBtn = document.getElementById('sub-back-btn')
        || document.querySelector('.sub-layout .back-btn')
        || document.querySelector('.head-nav .back-btn');
    if (backBtn) {
        const freshBackBtn = backBtn.cloneNode(true);
        backBtn.parentNode.replaceChild(freshBackBtn, backBtn);
        freshBackBtn.addEventListener('click', () => {
            const fadeEl = document.querySelector('.data-sub-fade');
            if (fadeEl) fadeEl.style.animation = 'dataSubOut 0.18s ease-in forwards';
            setTimeout(() => {
                removeDarkHeadNav();
                window.openSettingApplication?.();
            }, 180);
        }, { once: true });
    }

    function showConfirm(title, msg, onConfirm) {
        document.getElementById('data-dialog-overlay')?.remove();
        const ov = document.createElement('div');
        ov.id = 'data-dialog-overlay'; ov.className = 'dialog-overlay';
        ov.innerHTML = `
            <div class="dialog-box">
                <div class="dialog-title">${title}</div>
                <div class="dialog-msg">${msg}</div>
                <div class="dialog-divider"></div>
                <div class="dialog-btn-row">
                    <button id="data-dialog-cancel" class="dialog-btn dialog-btn-cancel">
                        <div class="dialog-icon dialog-icon-cancel">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </div>
                        <span class="dialog-btn-label">${window.t('data_confirm_no')}</span>
                    </button>
                    <button id="data-dialog-confirm" class="dialog-btn dialog-btn-confirm">
                        <span class="dialog-btn-label confirm">${window.t('data_confirm_yes')}</span>
                        <div class="dialog-icon dialog-icon-confirm">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                    </button>
                </div>
            </div>`;
        document.body.appendChild(ov);
        document.getElementById('data-dialog-cancel')?.addEventListener('click',  () => ov.remove());
        document.getElementById('data-dialog-confirm')?.addEventListener('click', () => { ov.remove(); onConfirm(); });
    }

    function showInfo(title, msg, onOk) {
        document.getElementById('data-dialog-overlay')?.remove();
        const ov = document.createElement('div');
        ov.id = 'data-dialog-overlay'; ov.className = 'dialog-overlay';
        ov.innerHTML = `
            <div class="dialog-box">
                <div class="dialog-title">${title}</div>
                <div class="dialog-msg">${msg}</div>
                <div class="dialog-divider"></div>
                <div class="dialog-btn-row" style="justify-content:center;">
                    <button id="data-dialog-ok" class="dialog-btn dialog-btn-confirm" style="flex:0 0 auto;min-width:120px;">
                        <span class="dialog-btn-label confirm">OK</span>
                        <div class="dialog-icon dialog-icon-confirm">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                    </button>
                </div>
            </div>`;
        document.body.appendChild(ov);
        document.getElementById('data-dialog-ok')?.addEventListener('click', () => { ov.remove(); if (typeof onOk === 'function') onOk(); });
    }

    // Backup
    document.getElementById('data-backup-btn')?.addEventListener('click', async () => {
        const backup = {};
        Object.keys(localStorage).forEach(k => { backup[k] = localStorage.getItem(k); });
        const jsonStr  = JSON.stringify(backup, null, 2);
        const fileName = 'ot_backup_' + new Date().toISOString().slice(0,10) + '.json';

        // Android Web Share API — share sheet ကနေ Download/Files ကို save လုပ်နိုင်
        if (navigator.canShare && navigator.share) {
            try {
                const file = new File([jsonStr], fileName, { type: 'application/json' });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: fileName });
                    localStorage.setItem('last_backup_at', String(Date.now()));
                    return;
                }
            } catch(e) {
                if (e.name === 'AbortError') return; // user ကိုယ်တိုင် cancel လုပ်တာ
            }
        }

        // Fallback — base64 data URI (blob URL Android မှာ မသွားတာကြောင့်)
        const b64  = btoa(unescape(encodeURIComponent(jsonStr)));
        const uri  = 'data:application/json;base64,' + b64;
        const a    = document.createElement('a');
        a.href = uri; a.download = fileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        localStorage.setItem('last_backup_at', String(Date.now()));
        showInfo(window.t('data_backup'), window.t('data_backup_done'), () => openDataSubLayout());
    });

    // Restore
    document.getElementById('data-restore-btn')?.addEventListener('click', () => {
        document.getElementById('data-restore-file-input')?.click();
    });
    document.getElementById('data-restore-file-input')?.addEventListener('change', function() {
        const file = this.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            showConfirm(window.t('data_restore'), window.t('data_restore_confirm'), () => {
                try {
                    const data = JSON.parse(e.target.result);
                    Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
                    showInfo(window.t('data_restore'), window.t('data_restore_done'), () => location.reload());
                } catch(err) { showInfo('Error', 'Invalid backup file.'); }
            });
        };
        reader.readAsText(file); this.value = '';
    });

    // Clear records
    document.getElementById('data-clear-btn')?.addEventListener('click', () => {
        showConfirm(window.t('data_clear'), window.t('data_clear_confirm'), () => {
            Object.keys(localStorage).filter(k => k.startsWith('ot_records_')).forEach(k => localStorage.removeItem(k));
            showInfo(window.t('data_clear'), window.t('data_clear_done'));
        });
    });

    // Reset app
    document.getElementById('data-reset-btn')?.addEventListener('click', () => {
        showConfirm(window.t('data_reset'), window.t('data_reset_confirm'), () => {
            localStorage.clear(); sessionStorage.clear();
            showInfo(window.t('data_reset'), window.t('data_reset_done'), () => location.reload());
        });
    });
}

window.openSettingData = openDataSubLayout;

})();
