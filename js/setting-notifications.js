// ==========================================
// setting-notifications.js — Notifications
// ==========================================
(function() {

function applyDarkHeadNav()  { window._settingHelpers?.applyDarkHeadNav(); }
function replaceBackBtnSvg() { window._settingHelpers?.replaceBackBtnSvg(); }

function openNotifSubLayout() {
    if (typeof window.openSubLayout !== 'function') return;

    const NOTIF_KEY = 'ot_notif_settings';
    const saved     = JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}');
    const enabled   = saved.enabled || false;
    const time      = saved.time    || '18:00';
    const skipSun   = saved.skipSunday !== false; // default: Sunday ကို ကျော်ခြင်း (wage logic ရဲ့ Sunday=ပိတ်ရက် သဘောနဲ့ ကိုက်ညီအောင်)

    window.openSubLayout(window.t('menu_notif'), () => `
        <div class="list-wrapper setting-list-wrapper">

            <div class="lang-row" style="align-items:center;">
                <div class="menu-row-text-wrap">
                    <span class="menu-row-label">${window.t('notif_reminder_toggle')}</span>
                    <span class="menu-row-sub">${window.t('notif_reminder_sub')}</span>
                </div>
                <label style="position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0;">
                    <input type="checkbox" id="notif-toggle" ${enabled ? 'checked' : ''} style="opacity:0;width:0;height:0;">
                    <span id="notif-toggle-track" style="
                        position:absolute;inset:0;border-radius:34px;cursor:pointer;
                        background:${enabled ? '#10b981' : '#e2e8f0'};transition:background 0.2s;">
                    </span>
                    <span id="notif-toggle-thumb" style="
                        position:absolute;top:3px;left:${enabled ? '23px' : '3px'};
                        width:18px;height:18px;border-radius:50%;background:#fff;
                        box-shadow:0 1px 4px rgba(0,0,0,0.18);transition:left 0.2s;">
                    </span>
                </label>
            </div>

            <div class="lang-row" id="notif-time-row" style="${enabled ? '' : 'opacity:0.4;pointer-events:none;'}">
                <span class="menu-row-label">${window.t('notif_reminder_time')}</span>
                <input type="time" id="notif-time-input" value="${time}" style="
                    border:1px solid #e2e8f0;border-radius:8px;padding:6px 10px;
                    font-size:15px;color:#2d3748;background:#f8fafc;outline:none;
                    -webkit-tap-highlight-color:transparent;">
            </div>

            <div class="lang-row" id="notif-skip-sun-row" style="align-items:center;${enabled ? '' : 'opacity:0.4;pointer-events:none;'}">
                <div class="menu-row-text-wrap">
                    <span class="menu-row-label">${window.t('notif_skip_sunday') || 'Skip Sundays'}</span>
                    <span class="menu-row-sub">${window.t('notif_skip_sunday_sub') || "Don't remind on Sundays (rest day)"}</span>
                </div>
                <label style="position:relative;display:inline-block;width:44px;height:24px;flex-shrink:0;">
                    <input type="checkbox" id="notif-skip-sun-toggle" ${skipSun ? 'checked' : ''} style="opacity:0;width:0;height:0;">
                    <span id="notif-skip-sun-track" style="
                        position:absolute;inset:0;border-radius:34px;cursor:pointer;
                        background:${skipSun ? '#10b981' : '#e2e8f0'};transition:background 0.2s;">
                    </span>
                    <span id="notif-skip-sun-thumb" style="
                        position:absolute;top:3px;left:${skipSun ? '23px' : '3px'};
                        width:18px;height:18px;border-radius:50%;background:#fff;
                        box-shadow:0 1px 4px rgba(0,0,0,0.18);transition:left 0.2s;">
                    </span>
                </label>
            </div>

        </div>`);

    replaceBackBtnSvg();
    applyDarkHeadNav();

    const toggle    = document.getElementById('notif-toggle');
    const track     = document.getElementById('notif-toggle-track');
    const thumb     = document.getElementById('notif-toggle-thumb');
    const timeRow   = document.getElementById('notif-time-row');
    const timeInput = document.getElementById('notif-time-input');
    const skipRow   = document.getElementById('notif-skip-sun-row');
    const skipToggle = document.getElementById('notif-skip-sun-toggle');
    const skipTrack   = document.getElementById('notif-skip-sun-track');
    const skipThumb   = document.getElementById('notif-skip-sun-thumb');

    function save() {
        const isOn = toggle.checked;
        localStorage.setItem(NOTIF_KEY, JSON.stringify({ enabled: isOn, time: timeInput.value, skipSunday: skipToggle.checked }));
        track.style.background = isOn ? '#10b981' : '#e2e8f0';
        thumb.style.left       = isOn ? '23px' : '3px';
        timeRow.style.opacity  = isOn ? '1' : '0.4';
        timeRow.style.pointerEvents = isOn ? 'auto' : 'none';
        skipRow.style.opacity  = isOn ? '1' : '0.4';
        skipRow.style.pointerEvents = isOn ? 'auto' : 'none';
    }

    toggle?.addEventListener('change', save);
    timeInput?.addEventListener('change', save);
    skipToggle?.addEventListener('change', function() {
        skipTrack.style.background = skipToggle.checked ? '#10b981' : '#e2e8f0';
        skipThumb.style.left       = skipToggle.checked ? '23px' : '3px';
        save();
    });
}

window.openSettingNotif = openNotifSubLayout;

})();
