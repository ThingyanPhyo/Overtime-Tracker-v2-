// ==========================================
// record-menu.js — Record Tab Menu (Bottom Nav "Record" entry point)
// Bottom navigation ရဲ့ "Record" tab ကို ဒီ file က ထိန်းချုပ်သည်။
// Menu row style ကို setting menu list style အတိုင်း (icon + title + sub + arrow) ။
// Row 2 ခု ပါသည်: "Record" (record.js form) နှင့် "Wage Calculator"
// (Total wage + Attendance bonus - Social Security = Remaining)
// နှစ်ခုစလုံးကို sub-layout head-nav style (dark-mode, setting-security.js ရဲ့
// Change-PIN pattern) အတူတူပဲ သုံးထားသည်။
// ==========================================

// ==========================================
// 📍 Sub-layout persistence — refresh (သို့) ဘာဖြစ်ဖြစ် page ပြန် render သွားရင်
// "record" tab ရဲ့ sub-layout (Record Form / Wage Calculator) ကနေ ချက်ချင်း
// ပြန်မထွက်စေရန်၊ Back ခလုတ်ကို အမှန်တကယ်နှိပ်မှသာ ရှင်းမည်
// ==========================================
var REC_SUBVIEW_KEY = 'ot_rec_active_subview'; // '' | 'form' | 'calc'

function _setRecSubActive(view) {
    if (view) localStorage.setItem(REC_SUBVIEW_KEY, view);
    else localStorage.removeItem(REC_SUBVIEW_KEY);
}

// ==========================================
// 📍 Wage Calculator result snapshot — "Calculator" ခလုတ်ကို အမှန်တကယ်
// နှိပ်မှသာ လအလိုက် (YYYY-MM key) သိမ်းမည် (Wage History ရဲ့ Month Card ကို
// tap လုပ်ရင် ဒီ snapshot ကိုပဲ ပြန်ပြသည် — auto-calculate လုပ်ပြီး မပြပါ)
// ==========================================
var WC_RESULTS_KEY = 'wc_calc_results';
function loadWcCalcResults() {
    try { return JSON.parse(localStorage.getItem(WC_RESULTS_KEY)) || {}; } catch (e) { return {}; }
}
function saveWcCalcResult(ymKey, data) {
    var all = loadWcCalcResults();
    all[ymKey] = data;
    localStorage.setItem(WC_RESULTS_KEY, JSON.stringify(all));
}

window.views.record = function (container) {

    // ── Menu row builder (setting-security.js ရဲ့ .menu-row markup အတိုင်း) ──
    function menuRow(opts) {
        return '<div class="menu-row setting-menu-row" id="' + opts.id + '">'
            +   '<div class="menu-row-left">'
            +     opts.icon
            +     '<div class="menu-row-text" style="display:flex;flex-direction:column;">'
            +       '<span class="menu-row-label">' + opts.title + '</span>'
            +       '<span class="menu-row-sub" style="font-size:12px;color:#94a3b8;margin-top:2px;">' + opts.sub + '</span>'
            +     '</div>'
            +   '</div>'
            +   '<span class="arrow-right" style="font-size:26px;line-height:1;">\u203a</span>'
            + '</div>';
    }

    var recordIcon =
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2" '
        + 'stroke-linecap="round" stroke-linejoin="round" class="menu-row-icon">'
        +   '<circle cx="12" cy="12" r="9"></circle>'
        +   '<polyline points="12 7 12 12 15 14"></polyline>'
        + '</svg>';

    var calcIcon =
        '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2" '
        + 'stroke-linecap="round" stroke-linejoin="round" class="menu-row-icon">'
        +   '<rect x="4" y="2" width="16" height="20" rx="2"></rect>'
        +   '<line x1="8" y1="6" x2="16" y2="6"></line>'
        +   '<line x1="8" y1="11" x2="8" y2="11.01"></line>'
        +   '<line x1="12" y1="11" x2="12" y2="11.01"></line>'
        +   '<line x1="16" y1="11" x2="16" y2="11.01"></line>'
        +   '<line x1="8" y1="15" x2="8" y2="15.01"></line>'
        +   '<line x1="12" y1="15" x2="12" y2="15.01"></line>'
        +   '<line x1="16" y1="15" x2="16" y2="15.01"></line>'
        +   '<line x1="8" y1="19" x2="16" y2="19"></line>'
        + '</svg>';

    container.innerHTML =
        '<div class="list-wrapper setting-list-wrapper">'
        +   menuRow({
                id:    'open-record-form-menu',
                icon:  recordIcon,
                title: window.t('record')      || 'Record',
                sub:   window.t('title_record') || 'Log Overtime'
            })
        +   menuRow({
                id:    'open-wage-calc-menu',
                icon:  calcIcon,
                title: window.t('wage_calculator') || 'Wage Calculator',
                sub:   (window.t('wc_total_wage') || 'Total wage') + ' \u00b7 ' + (window.t('wc_attendance_bonus') || 'Attendance bonus')
            })
        + '</div>';

    document.getElementById('open-record-form-menu')
        ?.addEventListener('click', function () { window.openRecordFormSubLayout(); });
    document.getElementById('open-wage-calc-menu')
        ?.addEventListener('click', function () { window.openWageCalculatorSubLayout(); });
};

/**
 * 📍 Generic Sub Layout opener — setting-security.js ထဲက Change-PIN screen
 * (renderPinScreen) ရဲ့ sub-layout > sub-head > head-nav.dark-mode markup
 * pattern ကို တိုက်ရိုက်ကူးသုံးထားသည် (window.openSubLayout ကို မသုံး —
 * back target 'setting' အမြဲ hardcode ဖြစ်နေတာနဲ့ head-nav ပျောက်တဲ့ပြဿနာရှောင်ဖို့)
 *
 * @param {string} titleText  head-title မှာပြမည့် စာသား (translate ပြီးသား)
 * @param {string} backTab    back button နှိပ်လျှင် ပြန်ရောက်မည့် bottom-nav tab name
 * @param {function(HTMLElement)} initBody  body container ကို render/bind လုပ်မည့် callback
 * @param {string} [subviewKey]  refresh ဖြစ်ရင် ပြန်ဖွင့်ရန် သိမ်းမည့် mark ('form'/'calc')
 * @param {string} [rightHtml]  head-nav ဘေးအစွန်း (title ရဲ့ညာဘက်) မှာ ထည့်မည့် icon-button HTML
 */
function openRecSubLayout(titleText, backTab, initBody, subviewKey, rightHtml) {
    const contentView = document.getElementById('content-view');
    const bottomNav   = document.getElementById('main-bottom-nav');
    if (!contentView || !bottomNav) return;

    if (subviewKey) _setRecSubActive(subviewKey);

    bottomNav.classList.add('hidden');
    contentView.classList.add('sub-layout-active');

    contentView.innerHTML =
        '<div class="sub-layout rec-sub-layout">'
        +   '<div class="sub-head">'
        +     '<div class="head-nav dark-mode rec-head-nav">'
        +       '<button id="rec-form-back-btn" class="back-btn rec-back-btn">'
        +         '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" '
        +         'stroke-linecap="round" stroke-linejoin="round" style="display:block;">'
        +           '<polyline points="15 18 9 12 15 6"></polyline>'
        +         '</svg>'
        +       '</button>'
        +       '<div class="head-title rec-head-title">' + titleText + '</div>'
        +       (rightHtml || '')
        +     '</div>'
        +   '</div>'
        +   '<div class="sub-body rec-wrapper" id="rec-form-body" '
        +   'style="padding:16px 20px 32px;box-sizing:border-box;overflow-y:auto;height:100%;"></div>'
        + '</div>'
        + '<style>@keyframes recSubIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}'
        + '.rec-sub-layout{animation:recSubIn 0.2s ease-out;}'
        + '@keyframes recSubOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(30px)}}</style>';

    const recSubLayoutEl = contentView.querySelector('.rec-sub-layout');

    document.getElementById('rec-form-back-btn').addEventListener('click', function () {
        if (recSubLayoutEl) recSubLayoutEl.style.animation = 'recSubOut 0.18s ease-in forwards';
        setTimeout(function () {
            _setRecSubActive(null);
            bottomNav.classList.remove('hidden', 'hide-nav');
            contentView.classList.remove('sub-layout-active');
            _loadTab._fromBack = true;
            _loadTab(backTab);
        }, 180);
    });

    const formBody = document.getElementById('rec-form-body');
    if (formBody && typeof initBody === 'function') {
        initBody(formBody);
    }
}

/** 📍 Record Form (record.js) ကို Sub Layout အနေနဲ့ ဖွင့်ပေးသည် */
window.openRecordFormSubLayout = function () {
    openRecSubLayout(window.t('title_record') || 'Log Overtime', 'record', function (body) {
        if (typeof window.views.recordForm === 'function') {
            window.views.recordForm(body);
        }
    }, 'form');
};

/**
 * 📍 Wage Calculator ကို Sub Layout အနေနဲ့ ဖွင့်ပေးသည်
 * တွက်ချက်ပုံ: Remaining = Total wage + Attendance bonus − Social Security
 * Head-nav ဘေးအစွန်းမှာ History icon နှင့် Delete icon ရှိသည်:
 *  - History icon → window.openWageHistoryPanel() (app.js ရဲ့ 🔔 Notification
 *    panel — showDailyDetailPanel() — pattern အတိုင်းယူထားသည်)
 *  - Delete icon → window.showWcClearConfirmDialog() (app.js ရဲ့ Exit dialog —
 *    showExitConfirmationDialog() — pattern အတိုင်းယူထားသည်) confirm ရရင်
 *    Total wage box ကလွဲလို့ ကျန်တဲ့ input/result field အားလုံး ရှင်းမည်
 */
window.openWageCalculatorSubLayout = function () {
    var historyBtnHtml =
        '<div id="wc-history-btn" style="cursor:pointer;padding:2px;display:flex;align-items:center;'
        + 'justify-content:center;-webkit-tap-highlight-color:transparent;user-select:none;">'
        +   '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" '
        +   'stroke-linecap="round" stroke-linejoin="round" style="display:block;">'
        +     '<path d="M3 3v5h5"></path>'
        +     '<path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path>'
        +     '<path d="M12 7v5l4 2"></path>'
        +   '</svg>'
        + '</div>';

    var deleteBtnHtml =
        '<div id="wc-delete-btn" style="cursor:pointer;padding:2px;display:flex;align-items:center;'
        + 'justify-content:center;-webkit-tap-highlight-color:transparent;user-select:none;">'
        +   '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" '
        +   'stroke-linecap="round" stroke-linejoin="round" style="display:block;">'
        +     '<polyline points="3 6 5 6 21 6"></polyline>'
        +     '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>'
        +     '<path d="M10 11v6"></path>'
        +     '<path d="M14 11v6"></path>'
        +     '<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>'
        +   '</svg>'
        + '</div>';

    var actionsHtml =
        '<div style="display:flex;align-items:center;gap:14px;margin-left:auto;">'
        +   deleteBtnHtml
        +   historyBtnHtml
        + '</div>';

    openRecSubLayout(window.t('wage_calculator') || 'Wage Calculator', 'record', renderWageCalculator, 'calc', actionsHtml);

    document.getElementById('wc-history-btn')?.addEventListener('click', function () {
        window.openWageHistoryPanel();
    });
};

/**
 * 📍 Lightweight Warning Toast (dialog box မဟုတ်ဘဲ သတိပေးစာ) — auto-dismiss
 * ဖြစ်ပြီး OK/Cancel ခလုတ်မပါ၊ user action မလိုအပ်ဘဲ ခဏပြီး ပျောက်သွားမည်
 */
window.showAppToast = function (message) {
    var old = document.getElementById('app-toast');
    if (old) old.remove();

    var toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.style.cssText = 'position:fixed;bottom:calc(24px + env(safe-area-inset-bottom));left:50%;'
        + 'transform:translateX(-50%) translateY(20px);'
        + 'z-index:9999;background:#1e293b;color:#fff;font-size:13px;font-weight:600;'
        + 'padding:11px 18px;border-radius:10px;box-shadow:0 4px 16px rgba(0,0,0,0.18);'
        + 'display:flex;align-items:center;gap:8px;max-width:86%;text-align:left;'
        + 'opacity:0;transition:opacity 0.25s ease,transform 0.25s ease;pointer-events:none;'
        + 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;';
    toast.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.4" '
        + 'stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">'
        +   '<path d="M12 9v4"></path><path d="M12 17h.01"></path>'
        +   '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>'
        + '</svg>'
        + '<span>' + message + '</span>';

    document.body.appendChild(toast);
    requestAnimationFrame(function () {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(function () {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(function () { toast.remove(); }, 250);
    }, 2000);
};

/**
 * 📍 Wage Calculator — Clear Fields Confirm Dialog
 * app.js ရဲ့ showExitConfirmationDialog() dialog-overlay/dialog-box markup
 * pattern ကို တိုက်ရိုက်ကူးသုံးထားသည် — confirm လုပ်ရင် onConfirm() ကို run မည်
 */
window.showWcClearConfirmDialog = function (onConfirm) {
    var old = document.getElementById('wc-clear-dialog-overlay');
    if (old) old.remove();

    var titleText = window.t('wc_clear_title') || 'Clear Calculator';
    var msgText   = window.t('wc_clear_msg')   || 'This will delete everything except the total wage box. Continue?';
    var yesText   = window.t('hist_delete') || 'Delete';
    var noText    = window.t('cancel') || window.t('hist_cancel') || 'Cancel';

    var dialogOverlay = document.createElement('div');
    dialogOverlay.id = 'wc-clear-dialog-overlay';
    dialogOverlay.className = 'dialog-overlay';
    dialogOverlay.innerHTML = `
        <div class="dialog-box">
            <div style="display:flex;justify-content:center;margin-bottom:4px;">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.0" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <div class="dialog-title">${titleText}</div>
            <div class="dialog-msg">${msgText}</div>
            <div class="dialog-divider"></div>
            <div class="dialog-btn-row">
                <button id="wc-clear-dialog-cancel" class="dialog-btn dialog-btn-cancel">
                    <div class="dialog-icon dialog-icon-cancel">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </div>
                    <span class="dialog-btn-label">${noText}</span>
                </button>
                <button id="wc-clear-dialog-confirm" class="dialog-btn dialog-btn-confirm">
                    <span class="dialog-btn-label confirm">${yesText}</span>
                    <div class="dialog-icon dialog-icon-confirm">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(dialogOverlay);

    document.getElementById('wc-clear-dialog-cancel').addEventListener('click', function () {
        dialogOverlay.remove();
    });

    document.getElementById('wc-clear-dialog-confirm').addEventListener('click', function () {
        dialogOverlay.remove();
        if (typeof onConfirm === 'function') onConfirm();
    });
};

/**
 * 📍 Monthly Wage History Panel — app.js ရဲ့ showDailyDetailPanel() (🔔 Notification)
 * pattern ကိုတိုက်ရိုက် ယူထားသည် (body-appended fixed overlay, .sub-head > .head-nav.dark-mode.cp-head-nav,
 * spacer div ညာဘက်, slide-in animation) — record အားလုံးကို လအလိုက် group လုပ်ပြီး
 * Total column ပေါင်းလဒ် (window.sumRecordsTotal) ကို ပြသည်
 *
 * Head-nav ဘေးအစွန်းမှာ Delete icon ရှိသည် — နှိပ်လျှင် selection mode ဝင်ပြီး
 * card တစ်ခုချင်းစီကို tap လုပ်ရွေးနိုင်၊ Select All / Delete(n) bottom bar ပေါ်လာမည်
 */
window.openWageHistoryPanel = function () {
    var old = document.getElementById('wc-history-overlay');
    if (old) { old.remove(); return; }

    var allRecs = typeof window.getRecords === 'function' ? window.getRecords() : [];
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // ── record အားလုံးကို "YYYY-MM" အလိုက် group လုပ်သည် (card ရဲ့ record-count
    //    subtitle အတွက်သာသုံး) ──
    var groups = {};
    allRecs.forEach(function (r) {
        var y = r.year || String(new Date().getFullYear());
        var m = String(r.month).padStart(2, '0');
        var key = y + '-' + m;
        if (!groups[key]) groups[key] = { year: y, month: m, records: [] };
        groups[key].records.push(r);
    });

    // ── 🩹 Ghost-card ပြင်ဆင်ချက်: Calculator ခလုတ်ကို အမှန်တကယ်နှိပ်ပြီးသား
    //    လ (wc_calc_results ထဲ snapshot ရှိတဲ့ key) တွေကိုပဲ card အဖြစ်ပြသည်
    //    (မနှိပ်ရသေးတဲ့ လက card လုံးဝမပေါ်ပါ) — ADD-ON: snapshot ရှိပေမယ့်
    //    ဒီလအတွက် record တွေ ပြန်ဖျက်ထားလို့ (records.length === 0) group
    //    မရှိတော့တဲ့ key တွေကိုလည်း "data မရှိတော့ဘူး" ဟု သတ်မှတ်ပြီး filter
    //    ချန်ထား + storage ထဲကနေပါ prune လုပ်ပစ်သည် ──
    var savedResults = loadWcCalcResults();
    var prunedResults = {};
    var didPrune = false;
    Object.keys(savedResults).forEach(function (key) {
        if (groups[key] && groups[key].records.length > 0) {
            prunedResults[key] = savedResults[key];
        } else {
            didPrune = true;
        }
    });
    if (didPrune) localStorage.setItem(WC_RESULTS_KEY, JSON.stringify(prunedResults));

    function getMonthKeys() {
        return Object.keys(loadWcCalcResults())
            .filter(function (key) { return groups[key] && groups[key].records.length > 0; })
            .sort(function (a, b) { return b.localeCompare(a); }); // အသစ်ဆုံးအရင်
    }

    var selectionMode = false;
    var selectedKeys  = {};
    var selectedCount = 0;

    function formatCalcDate(ts) {
        if (!ts) return '';
        var d = new Date(ts);
        return monthNames[d.getMonth()] + ' ' + d.getDate();
    }

    // ── ယခင် (calculate ရှိပြီးသား) လနှင့် Remaining ကို နှိုင်းယှဉ်ပြီး
    //    up/down trend badge ပြသည် — sortedKeys က newest→oldest ဖြစ်နေလို့
    //    idx+1 ဟာ ဇယားအလိုက် "အရင်လ" ဖြစ်သည် ──
    function buildTrendHtml(key, idx, sortedKeys, savedMap) {
        var prevKey = sortedKeys[idx + 1];
        if (!prevKey || !savedMap[prevKey]) return '';

        var cur  = parseFloat(savedMap[key].remaining)     || 0;
        var prev = parseFloat(savedMap[prevKey].remaining) || 0;
        var diff = cur - prev;

        if (Math.abs(diff) < 0.005) {
            return '<span style="display:inline-flex;align-items:center;gap:2px;font-size:10px;font-weight:700;color:#94a3b8;">'
                + '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="3.5" stroke-linecap="round">'
                + '<line x1="5" y1="12" x2="19" y2="12"></line></svg>0%</span>';
        }

        var up     = diff > 0;
        var pct    = prev !== 0 ? Math.abs(diff / prev * 100) : null;
        var color  = up ? '#16a34a' : '#e53e3e';
        var arrow  = up ? '<polyline points="18 15 12 9 6 15"></polyline>' : '<polyline points="6 9 12 15 18 9"></polyline>';
        var pctTxt = pct !== null ? pct.toFixed(0) + '%' : (up ? '+' : '-');

        return '<span style="display:inline-flex;align-items:center;gap:2px;font-size:10px;font-weight:700;color:' + color + ';">'
            + '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="' + color + '" stroke-width="3.5" '
            + 'stroke-linecap="round" stroke-linejoin="round">' + arrow + '</svg>' + pctTxt + '</span>';
    }

    function buildMonthCard(key, idx, sortedKeys, savedMap) {
        var g        = groups[key];
        var parts    = key.split('-');
        var year     = g ? g.year  : parts[0];
        var month    = g ? g.month : parts[1];
        var recCount = g ? g.records.length : 0;
        var label    = monthNames[parseInt(month) - 1] + ' ' + year;
        var isSel    = !!selectedKeys[key];

        var saved       = savedMap[key] || {};
        var calcDateStr = formatCalcDate(saved.calculatedAt);
        var trendHtml   = buildTrendHtml(key, idx, sortedKeys, savedMap);

        var metaLine2 = (calcDateStr || trendHtml)
            ? '<div style="display:flex;align-items:center;gap:8px;margin-top:2px;">'
              +   (calcDateStr ? '<span style="font-size:10px;color:#a0aec0;">' + (window.t('wc_calculated_on') || 'Calculated') + ' ' + calcDateStr + '</span>' : '')
              +   trendHtml
              + '</div>'
            : '';

        var checkboxHtml = selectionMode
            ? '<span class="wc-hist-checkbox" style="width:20px;height:20px;border-radius:50%;flex-shrink:0;'
              + 'display:flex;align-items:center;justify-content:center;margin-right:12px;box-sizing:border-box;'
              + 'border:2px solid ' + (isSel ? '#2563eb' : '#cbd5e0') + ';background:' + (isSel ? '#2563eb' : 'transparent') + ';">'
              +   (isSel ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" '
                  + 'stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '')
              + '</span>'
            : '';

        var arrowHtml = selectionMode ? '' : '<span style="font-size:22px;line-height:1;color:#cbd5e0;">\u203a</span>';

        return '<div class="wc-month-card" data-key="' + key + '" style="background:' + (isSel ? '#eef4ff' : '#ffffff') + ';'
            + 'border-radius:14px;margin-bottom:10px;box-shadow:0 2px 8px rgba(0,0,0,0.06);'
            + 'border:' + (isSel ? '1.5px solid #2563eb' : '1px solid #f0f4f8') + ';cursor:pointer;'
            + '-webkit-tap-highlight-color:transparent;user-select:none;'
            + 'display:flex;justify-content:space-between;align-items:center;padding:14px 16px;">'
            +   '<div style="display:flex;align-items:center;min-width:0;">'
            +     checkboxHtml
            +     '<div style="display:flex;flex-direction:column;gap:2px;min-width:0;">'
            +       '<span style="font-size:14px;font-weight:700;color:#1a202c;">' + label + '</span>'
            +       '<span style="font-size:11px;color:#94a3b8;">' + recCount + ' record' + (recCount !== 1 ? 's' : '') + '</span>'
            +       metaLine2
            +     '</div>'
            +   '</div>'
            +   arrowHtml
            + '</div>';
    }

    var titleText = window.t('monthly_total') || 'Monthly Summary';

    var deleteIconBtnHtml =
        '<button id="wc-hist-delete-btn" style="background:none;border:none;padding:2px;width:44px;height:44px;'
        + 'cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;">'
        +   '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" '
        +   'stroke-linecap="round" stroke-linejoin="round" style="display:block;">'
        +     '<polyline points="3 6 5 6 21 6"></polyline>'
        +     '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>'
        +     '<path d="M10 11v6"></path>'
        +     '<path d="M14 11v6"></path>'
        +     '<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>'
        +   '</svg>'
        + '</button>';

    var cancelTextBtnHtml =
        '<button id="wc-hist-cancel-btn" style="background:none;border:none;width:44px;height:44px;'
        + 'color:#ffffff;font-size:14px;font-weight:600;cursor:pointer;-webkit-tap-highlight-color:transparent;">'
        + (window.t('hist_cancel') || 'Cancel') + '</button>';

    var overlay = document.createElement('div');
    overlay.id  = 'wc-history-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:8500;background:#fff;'
        + 'display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;';

    overlay.innerHTML =
        '<div class="sub-head">'
        +   '<div class="head-nav dark-mode cp-head-nav">'
        +     '<button id="wc-history-back" class="back-btn cp-back-btn" style="-webkit-tap-highlight-color:transparent;">'
        +       '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" '
        +       'stroke-linecap="round" stroke-linejoin="round" style="display:block;"><polyline points="15 18 9 12 15 6"></polyline></svg>'
        +     '</button>'
        +     '<div class="head-title cp-head-title" style="margin:0;">' + titleText + '</div>'
        +     '<div id="wc-hist-actions">' + deleteIconBtnHtml + '</div>'
        +   '</div>'
        + '</div>'
        + '<div class="sub-body" id="wc-hist-body" style="flex:1;overflow-y:auto;padding:16px 14px 32px;background:#f0f4f8;"></div>'
        + '<style>@keyframes wcHistSubIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}'
        + '#wc-history-overlay{animation:wcHistSubIn 0.2s ease-out;}'
        + '@keyframes wcHistOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(30px)}}</style>';

    document.body.appendChild(overlay);

    function renderActionBar(total) {
        var bar = document.getElementById('wc-hist-selbar');
        // ── data တကယ် select ထားမှသာ (selectedCount > 0) အောက်ခြေ bar ပေါ်မည်
        //    — selection mode ဝင်ခါစ (ဘာမှမရွေးရသေးရင်) bar လုံးဝမပေါ်ပါ ──
        if (!selectionMode || selectedCount === 0) {
            if (bar) bar.remove();
            return;
        }
        var allSelected = total > 0 && selectedCount === total;
        var barHtml =
            '<button id="wc-hist-selall-btn" style="background:none;border:none;color:#2563eb;font-size:13px;'
            + 'font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent;padding:6px 4px;">'
            + (allSelected ? (window.t('hist_cancel') || 'Cancel') : (window.t('hist_select_all') || 'All'))
            + '</button>'
            + '<button id="wc-hist-seldelete-btn" style="border:none;border-radius:10px;padding:10px 20px;'
            + 'font-size:14px;font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent;'
            + (selectedCount > 0
                ? 'background:#e53e3e;color:#fff;'
                : 'background:#e2e8f0;color:#a0aec0;pointer-events:none;')
            + '">' + (window.t('hist_delete') || 'Delete') + (selectedCount > 0 ? ' (' + selectedCount + ')' : '') + '</button>';

        if (!bar) {
            bar = document.createElement('div');
            bar.id = 'wc-hist-selbar';
            bar.style.cssText = 'flex-shrink:0;background:#fff;border-top:1px solid #e2e8f0;'
                + 'padding:10px 16px calc(10px + env(safe-area-inset-bottom));'
                + 'display:flex;align-items:center;justify-content:space-between;gap:10px;';
            overlay.appendChild(bar);
        }
        bar.innerHTML = barHtml;

        document.getElementById('wc-hist-selall-btn').addEventListener('click', function () {
            var keys = getMonthKeys();
            if (allSelected) {
                selectedKeys = {};
                selectedCount = 0;
            } else {
                selectedKeys = {};
                keys.forEach(function (k) { selectedKeys[k] = true; });
                selectedCount = keys.length;
            }
            renderList();
        });

        document.getElementById('wc-hist-seldelete-btn').addEventListener('click', function () {
            if (selectedCount === 0) return;
            window.showWcHistoryDeleteConfirmDialog(selectedCount, function () {
                var all = loadWcCalcResults();
                Object.keys(selectedKeys).forEach(function (k) { delete all[k]; });
                localStorage.setItem(WC_RESULTS_KEY, JSON.stringify(all));
                selectionMode = false;
                selectedKeys = {};
                selectedCount = 0;
                renderHeaderActions();
                renderList();
            });
        });
    }

    function renderList() {
        var monthKeys = getMonthKeys();
        var savedMap  = loadWcCalcResults();
        var bodyEl = document.getElementById('wc-hist-body');
        bodyEl.innerHTML = monthKeys.length === 0
            ? '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60%;gap:12px;color:#94a3b8;">'
              +   '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e0" stroke-width="1.5">'
              +     '<path d="M3 3v5h5"></path><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path><path d="M12 7v5l4 2"></path>'
              +   '</svg>'
              +   '<p style="font-size:14px;margin:0;">' + (window.t('no_data') || 'No records') + '</p>'
              + '</div>'
            : monthKeys.map(function (key, idx) { return buildMonthCard(key, idx, monthKeys, savedMap); }).join('');

        document.querySelectorAll('.wc-month-card').forEach(function (card) {
            card.addEventListener('click', function () {
                var key = card.dataset.key;
                if (selectionMode) {
                    if (selectedKeys[key]) {
                        delete selectedKeys[key];
                        selectedCount--;
                    } else {
                        selectedKeys[key] = true;
                        selectedCount++;
                    }
                    renderList();
                    return;
                }
                var parts = key.split('-');
                var group = groups[key] || { year: parts[0], month: parts[1], records: [] };
                openWageMonthDetailOverlay(key, group);
            });
        });

        renderActionBar(monthKeys.length);
    }

    function renderHeaderActions() {
        var slot = document.getElementById('wc-hist-actions');
        slot.innerHTML = selectionMode ? cancelTextBtnHtml : deleteIconBtnHtml;

        if (selectionMode) {
            document.getElementById('wc-hist-cancel-btn').addEventListener('click', function () {
                selectionMode = false;
                selectedKeys = {};
                selectedCount = 0;
                renderHeaderActions();
                renderList();
            });
        } else {
            document.getElementById('wc-hist-delete-btn').addEventListener('click', function () {
                // ── Card တစ်ခုမှ လုံးဝမရှိရင် (calculate လုပ်ထားတဲ့ လ လုံးဝမရှိရင်)
                //    selection mode ဝင်စရာမလို — "Nothing to delete" toast ပဲပြ ──
                if (getMonthKeys().length === 0) {
                    window.showAppToast(window.t('wc_nothing_to_delete') || 'Nothing to delete');
                    return;
                }
                selectionMode = true;
                selectedKeys = {};
                selectedCount = 0;
                renderHeaderActions();
                renderList();
            });
        }
    }

    document.getElementById('wc-history-back').addEventListener('click', function () {
        overlay.style.animation = 'wcHistOut 0.18s ease-in forwards';
        setTimeout(function () {
            overlay.remove();
            var headerEl  = document.querySelector('.custom-dashboard-header');
            var bottomNav = document.getElementById('main-bottom-nav');
            var bodyEl    = document.getElementById('dynamic-view-body');
            if (window._playTabSlideIn) window._playTabSlideIn([headerEl, bottomNav, bodyEl]);
        }, 180);
    });

    renderHeaderActions();
    renderList();
};

/**
 * 📍 Monthly Wage History — Multi-select Delete Confirm Dialog
 * showWcClearConfirmDialog()/showExitConfirmationDialog() ရဲ့ dialog-overlay/
 * dialog-box markup pattern ကို တိုက်ရိုက်ကူးသုံးထားသည် — hist_delete_title/
 * hist_delete_msg i18n key (History tab ၏ Delete confirm နှင့် တူညီသော text) ကို ပြန်သုံး
 */
window.showWcHistoryDeleteConfirmDialog = function (count, onConfirm) {
    var old = document.getElementById('wc-hist-delete-dialog-overlay');
    if (old) old.remove();

    var titleText = window.t('hist_delete_title') || 'Delete Records';
    var msgText   = window.t('hist_delete_msg')   || 'Delete selected months? This cannot be undone.';
    var yesText   = window.t('hist_delete') || 'Delete';
    var noText    = window.t('cancel') || window.t('hist_cancel') || 'Cancel';

    var dialogOverlay = document.createElement('div');
    dialogOverlay.id = 'wc-hist-delete-dialog-overlay';
    dialogOverlay.className = 'dialog-overlay';
    dialogOverlay.innerHTML = `
        <div class="dialog-box">
            <div style="display:flex;justify-content:center;margin-bottom:4px;">
                <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.0" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <div class="dialog-title">${titleText}</div>
            <div class="dialog-msg">${msgText}</div>
            <div class="dialog-divider"></div>
            <div class="dialog-btn-row">
                <button id="wc-hist-delete-dialog-cancel" class="dialog-btn dialog-btn-cancel">
                    <div class="dialog-icon dialog-icon-cancel">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </div>
                    <span class="dialog-btn-label">${noText}</span>
                </button>
                <button id="wc-hist-delete-dialog-confirm" class="dialog-btn dialog-btn-confirm">
                    <span class="dialog-btn-label confirm">${yesText}</span>
                    <div class="dialog-icon dialog-icon-confirm">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(dialogOverlay);

    document.getElementById('wc-hist-delete-dialog-cancel').addEventListener('click', function () {
        dialogOverlay.remove();
    });

    document.getElementById('wc-hist-delete-dialog-confirm').addEventListener('click', function () {
        dialogOverlay.remove();
        if (typeof onConfirm === 'function') onConfirm();
    });
};

/**

 * 📍 Wage History → Month Card ကို tap လုပ်ရင် ပေါ်လာမည့် Detail overlay
 * app.js ရဲ့ 🔔 showDailyDetailPanel() → showRecordDetail() pattern ကို
 * တိုက်ရိုက်ကူးသုံးထားသည် — dark-mode header (height:65px, rounded-bottom,
 * back-btn ဘယ်ဘက်၊ title+subtitle အလယ်၊ spacer ညာဘက်) + drow() label/value
 * row style (card/table box မဟုတ်ဘဲ border-bottom line rows) ကို ယူထားသည်
 * (Card ပေါ်မှာ ငွေပမာဏ တိုက်ရိုက်မပြတော့ဘဲ ဒီ overlay ထဲမှာသာ ပြသည်)
 */
function openWageMonthDetailOverlay(key, group) {
    var old = document.getElementById('wc-month-detail-overlay');
    if (old) old.remove();

    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var label    = monthNames[parseInt(group.month) - 1] + ' ' + group.year;
    var recCount = (group.records || []).length;
    var subTitle = recCount + ' record' + (recCount !== 1 ? 's' : '');

    // Calculator ခလုတ်နှိပ်ပြီးသားမှသာ ဒီ key အတွက် snapshot ရှိမည် — မရှိရင်
    // Grand total / Remaining ကို auto-ပြမည်မဟုတ်ဘဲ "not calculated yet" ပြမည်
    var saved = loadWcCalcResults()[key];

    // app.js drow() pattern အတိုင်း — label ဘယ်ဘက်၊ value ညာဘက်၊ border-bottom line
    function drow(rlabel, value) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;'
             + 'padding:14px 0;border-bottom:1px solid #f1f5f9;">'
             + '<span style="font-size:14px;color:#64748b;">' + rlabel + '</span>'
             + '<span style="font-size:14px;font-weight:600;color:#1a202c;">' + value + '</span>'
             + '</div>';
    }

    var bodyHtml;
    if (saved) {
        bodyHtml =
            drow(window.t('wc_social_security')  || 'Social Security',      (parseFloat(saved.ss) || 0).toFixed(2))
            + drow(window.t('wc_attendance_bonus') || 'Attendance bonus',     (parseFloat(saved.bonus) || 0).toFixed(2))
            + drow(window.t('wc_night_allowance')  || 'Night Shift Allowance',(parseFloat(saved.night) || 0).toFixed(2))
            + '<div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0;">'
            +   '<span style="font-size:15px;font-weight:700;color:#1a202c;">' + (window.t('wc_remaining') || 'Remaining') + '</span>'
            +   '<span style="font-size:16px;font-weight:800;color:#1a4e8f;">' + (parseFloat(saved.remaining) || 0).toFixed(2) + '</span>'
            + '</div>';
    } else {
        bodyHtml =
            '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:70px 24px;gap:12px;color:#94a3b8;text-align:center;">'
            +   '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e0" stroke-width="1.5">'
            +     '<rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line>'
            +     '<line x1="8" y1="11" x2="8" y2="11.01"></line><line x1="12" y1="11" x2="12" y2="11.01"></line>'
            +     '<line x1="16" y1="11" x2="16" y2="11.01"></line>'
            +   '</svg>'
            +   '<p style="font-size:13px;margin:0;">' + (window.t('wc_not_calculated') || 'Not calculated yet for this month') + '</p>'
            + '</div>';
    }

    var overlay = document.createElement('div');
    overlay.id  = 'wc-month-detail-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:8600;'
        + 'background:#fff;display:flex;flex-direction:column;'
        + 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;'
        + 'animation:wcMonthDetailIn 0.2s ease-out;';

    overlay.innerHTML =
        '<div class="sub-head">'
        +   '<div class="head-nav dark-mode" style="height:65px;border-radius:0 0 16px 16px;">'
        +     '<button id="wc-month-detail-back" class="back-btn" style="-webkit-tap-highlight-color:transparent;">'
        +       '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff"'
        +       ' stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">'
        +       '<polyline points="15 18 9 12 15 6"></polyline></svg>'
        +     '</button>'
        +     '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;">'
        +       '<div style="font-size:17px;font-weight:700;color:#fff;">' + label + '</div>'
        +       '<div style="font-size:11px;color:rgba(255,255,255,0.65);margin-top:2px;">' + subTitle + '</div>'
        +     '</div>'
        +     '<div style="width:44px;"></div>'
        +   '</div>'
        + '</div>'
        + '<div style="flex:1;overflow-y:auto;padding:20px 16px 40px;">'
        +   bodyHtml
        + '</div>'
        + '<style>@keyframes wcMonthDetailIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}</style>';

    document.body.appendChild(overlay);
    document.getElementById('wc-month-detail-back').addEventListener('click', function () {
        overlay.remove();
    });
}

function renderWageCalculator(container) {
    // ── record.js form ထဲမှာ လက်ရှိရွေးထားတဲ့ Year/Month အတွက် record တွေကို ယူပြီး
    //    Total column အတိုင်း ပေါင်းလိုက်သည် (window.calcRecordWage / calcRecordOtTotal
    //    ကိုသာ record.js နဲ့ တွက်ချက်ပုံတူညီအောင် ပြန်သုံးထားသည်) ──
    function computeAutoTotalWage() {
        if (typeof window.getRecords !== 'function' || typeof window.sumRecordsTotal !== 'function') return 0;
        var ym = typeof window.getRecordSelectedYM === 'function'
            ? window.getRecordSelectedYM()
            : (function () { var n = new Date(); return { year: String(n.getFullYear()), month: String(n.getMonth() + 1).padStart(2, '0') }; })();
        var monthRecords = window.getRecords().filter(function (r) {
            return r.month === ym.month && (r.year || ym.year) === ym.year;
        });
        return window.sumRecordsTotal(monthRecords);
    }

    var autoTotalWage = computeAutoTotalWage();
    var ymForLabel = typeof window.getRecordSelectedYM === 'function' ? window.getRecordSelectedYM() : null;
    var ymHint = '';
    if (ymForLabel) {
        var mLabel = new Date(parseInt(ymForLabel.year), parseInt(ymForLabel.month) - 1, 1)
            .toLocaleString('en', { month: 'short' });
        ymHint = mLabel + ' ' + ymForLabel.year;
    }

    container.innerHTML =
        '<div class="rec-page">'
        +   '<div style="display:flex;gap:12px;">'
        +     '<div class="rec-field-wrap" style="flex:1;">'
        +       '<label class="rec-label">' + (window.t('wc_total_wage') || 'Total wage')
        +         (ymHint ? ' <span style="font-weight:400;color:#a0aec0;">(' + ymHint + ')</span>' : '') + '</label>'
        +       '<input id="wc-total" type="number" class="rec-input" value="' + autoTotalWage.toFixed(2) + '" '
        +       'readonly title="' + (window.t('rule_readonly_tip') || 'Auto-calculated from Record') + '">'
        +     '</div>'
        +     '<div class="rec-field-wrap" style="flex:1;">'
        +       '<label class="rec-label">' + (window.t('wc_attendance_bonus') || 'Attendance bonus') + '</label>'
        +       '<input id="wc-bonus" type="number" min="0" step="0.01" class="rec-input" placeholder="0.00">'
        +     '</div>'
        +   '</div>'
        +   '<div style="display:flex;gap:12px;margin-top:16px;">'
        +     '<div class="rec-field-wrap" style="flex:1;">'
        +       '<label class="rec-label" style="font-size:11px;white-space:nowrap;">' + (window.t('wc_night_allowance') || 'Night Shift Allowance') + '</label>'
        +       '<input id="wc-night" type="number" min="0" step="0.01" class="rec-input" placeholder="0.00">'
        +     '</div>'
        +     '<div class="rec-field-wrap" style="flex:1;">'
        +       '<label class="rec-label">' + (window.t('wc_social_security') || 'Social Security') + '</label>'
        +       '<input id="wc-ss" type="number" min="0" step="0.01" class="rec-input" placeholder="0.00">'
        +     '</div>'
        +   '</div>'
        +   '<button id="wc-calc-btn" class="rec-save-btn" style="margin-top:20px;">'
        +     (window.t('wc_calculate') || 'Calculator')
        +   '</button>'
        +   '<div class="rec-table-section" style="margin-top:28px;">'
        +     '<p class="rec-table-title">' + (window.t('rec_detail_table') || 'Detail Table') + '</p>'
        +     '<div style="background:#f7fafc;border-radius:12px;border:1px solid #edf2f7;overflow:hidden;">'
        +       wcResultRow('wc-result-ss', window.t('wc_social_security') || 'Social Security', false)
        +       wcResultRow('wc-result-bonus', window.t('wc_attendance_bonus') || 'Attendance bonus', false)
        +       wcResultRow('wc-result-night', window.t('wc_night_allowance') || 'Night Shift Allowance', false)
        +       wcResultRow('wc-result-remaining', window.t('wc_remaining') || 'Remaining', true, true)
        +     '</div>'
        +   '</div>'
        + '</div>';

    function wcResultRow(id, label, emphasize, isLast) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;'
            + 'padding:12px 14px;' + (isLast ? '' : 'border-bottom:1px solid #edf2f7;') + '">'
            +   '<span style="font-size:13px;color:#4a5568;">' + label + '</span>'
            +   '<span id="' + id + '" style="font-size:' + (emphasize ? '16px' : '14px') + ';'
            +   'font-weight:' + (emphasize ? '700' : '600') + ';color:' + (emphasize ? '#1a4e8f' : '#1a202c') + ';">0.00</span>'
            + '</div>';
    }

    function recalcWageResult() {
        var total = parseFloat(document.getElementById('wc-total').value) || 0;
        var bonus = parseFloat(document.getElementById('wc-bonus').value) || 0;
        var night = parseFloat(document.getElementById('wc-night').value) || 0;
        var ss    = parseFloat(document.getElementById('wc-ss').value)    || 0;
        var remaining = total + bonus + night - ss;

        document.getElementById('wc-result-remaining').textContent = remaining.toFixed(2);
        document.getElementById('wc-result-ss').textContent        = ss.toFixed(2);
        document.getElementById('wc-result-bonus').textContent     = bonus.toFixed(2);
        document.getElementById('wc-result-night').textContent     = night.toFixed(2);

        // Calculator ခလုတ်နှိပ်မှသာ ဒီ function run ရမည် (hasCalculated guard က
        // ခေါ်တဲ့နေရာမှာ ရှိပြီးသား) — ဒီအတိုင်း လအလိုက် snapshot သိမ်းမည်
        if (ymForLabel) {
            var ymKey = ymForLabel.year + '-' + ymForLabel.month;
            saveWcCalcResult(ymKey, { total: total, bonus: bonus, night: night, ss: ss, remaining: remaining, calculatedAt: Date.now() });
        }
    }

    // Calculator ခလုတ် တစ်ခါမှ မနှိပ်ခင် Backspace/Delete/Cut ဘာလုပ်လုပ် update မဖြစ်ပါ။
    // Calculator ကိုနှိပ်ပြီး ဂဏန်းတွေ Detail Table ထဲရောက်သွားမှသာ —
    // အဲ့နောက်ပိုင်း box ထဲမှာ Backspace/Delete/Cut လုပ်ရင် live update ဖြစ်စေမည်
    var hasCalculated = false;

    ['wc-bonus', 'wc-ss', 'wc-night'].forEach(function (id) {
        document.getElementById(id)?.addEventListener('input', function (e) {
            if (!hasCalculated) return;
            var isDelete = e.inputType && e.inputType.indexOf('delete') === 0;
            if (isDelete) recalcWageResult();
        });
    });
    document.getElementById('wc-calc-btn').addEventListener('click', function () {
        hasCalculated = true;
        recalcWageResult();
    });

    // ── Delete icon (head-nav) — Total wage box ကလွဲလို့ ကျန်တဲ့ input/result
    //    field အားလုံးကို ရှင်း၊ လက်ရှိ month ရဲ့ saved snapshot ကိုပါ ဖျက် ──
    document.getElementById('wc-delete-btn')?.addEventListener('click', function () {
        var bonusVal = parseFloat(document.getElementById('wc-bonus')?.value) || 0;
        var nightVal = parseFloat(document.getElementById('wc-night')?.value) || 0;
        var ssVal    = parseFloat(document.getElementById('wc-ss')?.value)    || 0;
        var ymKey    = ymForLabel ? (ymForLabel.year + '-' + ymForLabel.month) : null;
        var hasSaved = ymKey ? !!loadWcCalcResults()[ymKey] : false;

        // Total wage box ကလွဲလို့ ကျန်တဲ့ box (bonus/night/ss) မှာ data လုံးဝ
        // မထည့်ထားရင် dialog box မပြပဲ သတိပေးစာ (toast) ပဲပြမည်
        if (!bonusVal && !nightVal && !ssVal && !hasSaved) {
            window.showAppToast(window.t('wc_nothing_to_delete') || 'Nothing to delete');
            return;
        }

        window.showWcClearConfirmDialog(function () {
            ['wc-bonus', 'wc-night', 'wc-ss'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.value = '';
            });
            ['wc-result-ss', 'wc-result-bonus', 'wc-result-night', 'wc-result-remaining'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.textContent = '0.00';
            });
            hasCalculated = false;

            if (ymForLabel) {
                var all = loadWcCalcResults();
                delete all[ymKey];
                localStorage.setItem(WC_RESULTS_KEY, JSON.stringify(all));
            }
        });
    });
}

// ==========================================
// 📍 Refresh ဖြစ်တဲ့အခါ sub-layout ကို ပြန်ဖွင့်ပေးရန်
// app.js ရဲ့ DOMContentLoaded init (_loadTab/switchTab) ပြီးမှသာ run အောင်
// setTimeout(0) နဲ့ နောက်ဆုံး queue ထဲ ထည့်ထားသည်
// ==========================================
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        var activeTab = document.querySelector('.app-container')?.getAttribute('data-tab');
        var subview   = localStorage.getItem(REC_SUBVIEW_KEY);
        if (activeTab !== 'record' || !subview) return;

        if (subview === 'form' && typeof window.openRecordFormSubLayout === 'function') {
            window.openRecordFormSubLayout();
        } else if (subview === 'calc' && typeof window.openWageCalculatorSubLayout === 'function') {
            window.openWageCalculatorSubLayout();
        }
    }, 0);
});
