// ==========================================
// setting-record-rule.js — Record Rule
// ==========================================
(function() {

function applyDarkHeadNav()  { window._settingHelpers?.applyDarkHeadNav(); }
function removeDarkHeadNav() { window._settingHelpers?.removeDarkHeadNav(); }
function replaceBackBtnSvg() { window._settingHelpers?.replaceBackBtnSvg(); }

const RULE_KEY = 'record_rule';
function loadRule() { try { return JSON.parse(localStorage.getItem(RULE_KEY)) || {}; } catch(e) { return {}; } }
function saveRule(obj) { localStorage.setItem(RULE_KEY, JSON.stringify(obj)); }

function openRecordRuleSubLayout() {
    if (typeof window.openSubLayout !== 'function') return;

    window.openSubLayout(window.t('menu_record_rule') || 'Record Rule', function() {
        var rule = loadRule();
        return `
            <div id="record-rule-marker" style="display:none;"></div>
            <div class="sub-body" style="padding:24px 20px 32px;display:flex;flex-direction:column;gap:0;">

                <div style="font-size:11px;font-weight:700;color:#a0aec0;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:8px;">
                    ${window.t('rule_section_pay') || 'PAY RULES'}
                </div>

                <div class="menu-row setting-menu-row" style="border-bottom:1px solid #f0f0f0;padding:16px 0;align-items:center;justify-content:space-between;">
                    <div style="display:flex;flex-direction:column;gap:3px;">
                        <span class="menu-row-label">${window.t('rule_work_hour') || 'Work Hour'}</span>
                        <span style="font-size:12px;color:#a0aec0;">${window.t('rule_workhour_formula') || 'Work Out − Work In − Lunch'}</span>
                    </div>
                    <input id="rule-workhour" type="number" min="0" step="0.01" value="${rule.workHour || ''}" placeholder="—" readonly
                        style="width:80px;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:15px;text-align:center;color:#718096;background:#f7f9fa;outline:none;font-weight:600;">
                </div>

                <div class="menu-row setting-menu-row" style="border-bottom:1px solid #f0f0f0;padding:16px 0;align-items:center;justify-content:space-between;">
                    <span class="menu-row-label">${window.t('rule_per_hour') || 'Hourly Wage'}</span>
                    <input id="rule-perhour" type="number" min="0" step="1" value="${rule.perHour || ''}" placeholder="0"
                        style="width:90px;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:15px;text-align:center;color:#1a202c;background:#fff;outline:none;">
                </div>

                <div class="menu-row setting-menu-row" style="border-bottom:1px solid #f0f0f0;padding:16px 0;align-items:center;justify-content:space-between;">
                    <span class="menu-row-label">${window.t('rule_ot_pay') || 'Hourly OT'}</span>
                    <input id="rule-otpay" type="number" min="0" step="0.01" value="${rule.otPay || ''}" placeholder="0"
                        style="width:90px;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:15px;text-align:center;color:#1a202c;background:#fff;outline:none;">
                </div>

                <div class="menu-row setting-menu-row" style="padding:16px 0;align-items:center;justify-content:space-between;">
                    <div style="display:flex;flex-direction:column;gap:3px;">
                        <span class="menu-row-label">${window.t('wc_night_allowance') || 'Night Shift Allowance'}</span>
                        <span style="font-size:12px;color:#a0aec0;">${window.t('rule_nsa_sub') || 'Extra pay added on Night shift records'}</span>
                    </div>
                    <input id="rule-nsa" type="number" min="0" step="0.01" value="${rule.nsa || ''}" placeholder="0"
                        style="width:90px;padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:15px;text-align:center;color:#1a202c;background:#fff;outline:none;">
                </div>

                <div style="font-size:11px;font-weight:700;color:#a0aec0;letter-spacing:0.6px;text-transform:uppercase;margin:20px 0 8px;">
                    ${window.t('rule_section_shift') || 'SHIFT TEMPLATE'}
                </div>
                <div style="font-size:12px;color:#a0aec0;margin-bottom:12px;line-height:1.5;">
                    ${window.t('rule_shift_desc') || 'Default Work In / Out — auto-filled when logging record'}
                </div>

                <div class="menu-row setting-menu-row" style="border-bottom:1px solid #f0f0f0;padding:16px 0;align-items:center;justify-content:space-between;">
                    <span class="menu-row-label">${window.t('rec_work_in') || 'Work In'}</span>
                    <input id="rule-workin" type="time" value="${rule.workIn || ''}"
                        style="padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:15px;text-align:center;color:#1a202c;background:#fff;outline:none;">
                </div>

                <div class="menu-row setting-menu-row" style="border-bottom:1px solid #f0f0f0;padding:16px 0;align-items:center;justify-content:space-between;">
                    <span class="menu-row-label">${window.t('rec_work_out') || 'Work Out'}</span>
                    <input id="rule-workout" type="time" value="${rule.workOut || ''}"
                        style="padding:8px 10px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:15px;text-align:center;color:#1a202c;background:#fff;outline:none;">
                </div>

                <div class="menu-row setting-menu-row" style="padding:16px 0;align-items:center;justify-content:space-between;">
                    <div style="display:flex;flex-direction:column;gap:3px;">
                        <span class="menu-row-label">${window.t('rec_lunch_time') || 'Lunch Break'}</span>
                        <span style="font-size:12px;color:#a0aec0;">${window.t('rule_workhour_formula') || 'Work hr = Work Out − Work In − Lunch'}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <button type="button" id="rule-lunch-minus" style="width:30px;height:30px;border-radius:50%;border:1.5px solid #e2e8f0;background:#f7f9fa;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#4a5568;">−</button>
                        <div style="min-width:54px;text-align:center;">
                            <span id="rule-lunch-val" style="font-size:16px;font-weight:700;color:#1a202c;">${rule.lunchMin || '60'}</span>
                            <span style="font-size:12px;color:#a0aec0;margin-left:2px;">${window.t('rec_lunch_min') || 'min'}</span>
                        </div>
                        <button type="button" id="rule-lunch-plus" style="width:30px;height:30px;border-radius:50%;border:1.5px solid #e2e8f0;background:#f7f9fa;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#4a5568;">+</button>
                    </div>
                </div>

                <div style="font-size:11px;font-weight:700;color:#a0aec0;letter-spacing:0.6px;text-transform:uppercase;margin:20px 0 8px;">
                    ${window.t('rule_section_options') || 'RECORD OPTIONS'}
                </div>

                <div class="menu-row setting-menu-row" style="border-bottom:1px solid #f0f0f0;padding:16px 0;align-items:center;justify-content:space-between;">
                    <div style="display:flex;flex-direction:column;gap:3px;">
                        <span class="menu-row-label">${window.t('rule_auto_workhour') || 'Auto Work Hours'}</span>
                        <span style="font-size:12px;color:#a0aec0;">${window.t('rule_auto_workhour_sub') || 'Calc from Work In / Out'}</span>
                    </div>
                    <label class="cp-toggle-wrap" style="margin:0;">
                        <input type="checkbox" id="rule-auto-workhour" ${rule.autoWorkHour ? 'checked' : ''}>
                        <span class="cp-toggle-slider"></span>
                    </label>
                </div>

                <div class="menu-row setting-menu-row" style="border-bottom:1px solid #f0f0f0;padding:16px 0;align-items:center;justify-content:space-between;">
                    <div style="display:flex;flex-direction:column;gap:3px;">
                        <span class="menu-row-label">${window.t('rule_holiday_detect') || 'Holiday Auto-Detect'}</span>
                        <span style="font-size:12px;color:#a0aec0;">${window.t('rule_holiday_detect_sub') || 'Suggest note on Thai holidays'}</span>
                    </div>
                    <label class="cp-toggle-wrap" style="margin:0;">
                        <input type="checkbox" id="rule-holiday-detect" ${rule.holidayDetect !== false ? 'checked' : ''}>
                        <span class="cp-toggle-slider"></span>
                    </label>
                </div>

                <div class="menu-row setting-menu-row" style="padding:16px 0;align-items:center;justify-content:space-between;">
                    <div style="display:flex;flex-direction:column;gap:3px;">
                        <span class="menu-row-label">${window.t('rule_dup_warn') || 'Duplicate Date Warning'}</span>
                        <span style="font-size:12px;color:#a0aec0;">${window.t('rule_dup_warn_sub') || 'Warn before saving same date'}</span>
                    </div>
                    <label class="cp-toggle-wrap" style="margin:0;">
                        <input type="checkbox" id="rule-dup-warn" ${rule.dupWarn !== false ? 'checked' : ''}>
                        <span class="cp-toggle-slider"></span>
                    </label>
                </div>

                <button id="rule-save-btn" style="margin-top:28px;width:100%;padding:14px;border:none;border-radius:12px;background:#1a4e8f;color:#fff;font-size:15px;font-weight:600;cursor:pointer;-webkit-tap-highlight-color:transparent;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.15s;">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    <span id="rule-save-text">${window.t('save') || 'Save'}</span>
                </button>
                <p id="rule-save-msg" style="text-align:center;font-size:13px;color:#38a169;min-height:18px;margin:10px 0 0;"></p>
            </div>`;
    });

    replaceBackBtnSvg();
    applyDarkHeadNav();
    const backBtn = document.getElementById('sub-back-btn')
        || document.querySelector('.sub-layout .back-btn')
        || document.querySelector('.head-nav .back-btn');
    backBtn?.addEventListener('click', removeDarkHeadNav, { once: true });

    requestAnimationFrame(function() {
        var lunchVal = document.getElementById('rule-lunch-val');
        function getLunch() { return parseInt(lunchVal?.textContent || '60') || 0; }
        function calcWH() {
            var wi = document.getElementById('rule-workin')?.value;
            var wo = document.getElementById('rule-workout')?.value;
            var el = document.getElementById('rule-workhour');
            if (!el) return;
            if (!wi || !wo) { el.value = ''; return; }
            var inM  = parseInt(wi.split(':')[0])*60 + parseInt(wi.split(':')[1]);
            var outM = parseInt(wo.split(':')[0])*60 + parseInt(wo.split(':')[1]);
            if (outM <= inM) outM += 24*60;
            el.value = (Math.max(0, outM - inM - getLunch()) / 60).toFixed(2);
        }
        document.getElementById('rule-workin')?.addEventListener('change',  calcWH);
        document.getElementById('rule-workout')?.addEventListener('change', calcWH);
        document.getElementById('rule-lunch-minus')?.addEventListener('click', () => { if(lunchVal) lunchVal.textContent = Math.max(0,   getLunch()-15); calcWH(); });
        document.getElementById('rule-lunch-plus')?.addEventListener('click',  () => { if(lunchVal) lunchVal.textContent = Math.min(180, getLunch()+15); calcWH(); });
        calcWH();
    });

    requestAnimationFrame(function() {
        const saveBtn  = document.getElementById('rule-save-btn');
        const saveText = document.getElementById('rule-save-text');
        const saveMsg  = document.getElementById('rule-save-msg');
        if (!saveBtn) return;
        saveBtn.addEventListener('click', function() {
            var wh = (document.getElementById('rule-workhour')?.value || '').trim();
            var ph = (document.getElementById('rule-perhour')?.value  || '').trim();
            var op = (document.getElementById('rule-otpay')?.value    || '').trim();
            var nsa = (document.getElementById('rule-nsa')?.value     || '').trim();
            var wi = (document.getElementById('rule-workin')?.value   || '');
            var wo = (document.getElementById('rule-workout')?.value  || '');
            var lm = document.getElementById('rule-lunch-val')?.textContent || '60';
            var holDet  = document.getElementById('rule-holiday-detect')?.checked !== false;
            var dupWarn = document.getElementById('rule-dup-warn')?.checked       !== false;
            var autoWH  = document.getElementById('rule-auto-workhour')?.checked  || false;
            saveBtn.disabled = true; saveText.textContent = '';
            var spinner = document.createElement('svg');
            spinner.setAttribute('width','18'); spinner.setAttribute('height','18');
            spinner.setAttribute('viewBox','0 0 44 44');
            if (!document.getElementById('rule-spin-style')) {
                var st = document.createElement('style'); st.id = 'rule-spin-style';
                st.textContent = '@keyframes rule-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';
                document.head.appendChild(st);
            }
            spinner.style.animation = 'rule-spin 0.7s linear infinite';
            spinner.innerHTML = '<circle cx="22" cy="22" r="18" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="90" stroke-dashoffset="60" stroke-linecap="round"/>';
            saveBtn.appendChild(spinner);
            setTimeout(function() {
                saveRule({ workHour:wh, perHour:ph, otPay:op, nsa:nsa, workIn:wi, workOut:wo, lunchMin:lm, holidayDetect:holDet, dupWarn:dupWarn, autoWorkHour:autoWH });
                saveBtn.disabled = false; spinner.remove(); saveText.textContent = window.t('save') || 'Save';
                if (saveMsg) { saveMsg.textContent = window.t('rule_saved_msg') || 'Saved!'; setTimeout(() => { if(saveMsg) saveMsg.textContent = ''; }, 2000); }
            }, 700);
        });
    });
}

window.openSettingRecordRule = openRecordRuleSubLayout;

})();
