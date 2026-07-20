// ==========================================
// record.js — Log Overtime View
// (Sub Layout အနေနဲ့ record-menu.js ကနေ host လုပ်သည် — window.views.record ကို
//  တိုက်ရိုက် မသိမ်းတော့ပဲ window.views.recordForm အနေနဲ့ expose လုပ်ထားသည်)
// ==========================================

// ── Wage calculation helpers — global expose (record-menu.js ရဲ့ Wage
//    Calculator က Detail Table ထဲက "Total" column နဲ့ ဖော်မြူလာတူညီအောင်
//    ဒီ function တွေကိုပဲ ပြန်သုံးမည်) ──
window.calcRecordWage = function (workHr, perHr, note) {
    var wh = parseFloat(workHr) || 0;
    var ph = parseFloat(perHr)  || 0;
    var noteKey = (note || '').trim();
    if (noteKey === 'sunday_ot')           return (wh * ph * 2).toFixed(2);
    if (noteKey === 'government_holiday')  return (wh * ph * 1).toFixed(2);
    if (noteKey === 'sunday')              return '0.00'; // Sunday — ငွေမတွက်
    return (wh * ph).toFixed(2);
};

window.calcRecordOtTotal = function (otIn, otOut, otPay) {
    // OT hours = out - in (decimal), then × otPay
    if (!otIn || !otOut || !otPay) return '0.00';
    var inParts  = otIn.split(':').map(Number);
    var outParts = otOut.split(':').map(Number);
    var inMins   = inParts[0] * 60 + inParts[1];
    var outMins  = outParts[0] * 60 + outParts[1];
    if (outMins <= inMins) outMins += 24 * 60; // overnight
    var hrs = (outMins - inMins) / 60;
    return (hrs * (parseFloat(otPay) || 0)).toFixed(2);
};

// Work In time → Night shift check (global expose — reused by getRecordShiftLabel-style
// callers and by the Night Shift Allowance calculation below)
window.isRecordNightShift = function (workIn) {
    if (!workIn) return false;
    var parts = workIn.split(':').map(Number);
    var hr = parts[0];
    // 18:00 – 05:59 → Night, ကျန်တာ → Day
    return hr >= 18 || hr < 6;
};

// Night Shift Allowance — Work In က Night shift ဖြစ်မှသာ rate ကို ထည့်တွက်သည်
// (Sunday note မှာတော့ ငွေမတွက်ဘူးဆိုတဲ့ စည်းမျဉ်းအတိုင်း 0 ပြန်ပေးသည်)
window.calcRecordNSA = function (workIn, nsaRate, note) {
    if (note === 'sunday') return '0.00';
    var rate = parseFloat(nsaRate) || 0;
    if (!rate) return '0.00';
    return window.isRecordNightShift(workIn) ? rate.toFixed(2) : '0.00';
};

/**
 * record အားလုံးရဲ့ Detail Table "Total" column ကို ပေါင်းပေးသည်
 * (isSunday ဆိုရင် '-' ပြပြီး ပေါင်းရာတွင် 0 အဖြစ်သာ ထည့်တွက်သည်)
 * @param {Array} records  window.getRecords() ကနေရလာသော record list
 * @returns {number} grand total (rounded 2 decimal)
 */
window.sumRecordsTotal = function (records) {
    var sum = 0;
    (records || []).forEach(function (r) {
        if (r.note === 'sunday') return; // Sunday — ငွေမတွက်
        var wage    = parseFloat(window.calcRecordWage(r.workHour, r.perHour, r.note)) || 0;
        var otTotal = (r.note === 'government_holiday' || r.note === 'sunday_ot')
            ? 0
            : parseFloat(window.calcRecordOtTotal(r.otIn, r.otOut, r.otPay)) || 0;
        var nsaAmt  = parseFloat(window.calcRecordNSA(r.workIn, r.nsa, r.note)) || 0;
        sum += wage + otTotal + nsaAmt;
    });
    return Math.round(sum * 100) / 100;
};

/**
 * record.js form ထဲမှာ လက်ရှိရွေးထားတဲ့ Year/Month ကို ပြန်ပေးသည်
 * (တစ်ခါမှ မရွေးရသေးရင် ယနေ့လကို default အဖြစ်ပြန်ပေးမည်)
 * @returns {{year: string, month: string}}
 */
window.getRecordSelectedYM = function () {
    try {
        var saved = JSON.parse(localStorage.getItem('ot_rec_selected_ym'));
        if (saved && saved.year && saved.month) return saved;
    } catch (e) {}
    var now = new Date();
    return { year: String(now.getFullYear()), month: String(now.getMonth() + 1).padStart(2, '0') };
};

/**
 * record note → badge label/style (Detail Table "Status" column)
 * (record-menu.js ရဲ့ Wage History month-detail view ကလည်း ဒီ function ကိုပဲ
 *  ပြန်သုံးအောင် global expose လုပ်ထားသည်)
 */
window.getRecordStatusLabel = function (note) {
    var styleMap = {
        normal_ot:          'background:#dbeafe;color:#1d4ed8;',
        weekend_ot:         'background:#ede9fe;color:#6d28d9;',
        sunday_ot:          'background:#fef9c3;color:#92400e;',
        sunday:             'background:#fee2e2;color:#b91c1c;',
        government_holiday: 'background:#dcfce7;color:#15803d;',
        holiday_ot:         'background:#d1fae5;color:#065f46;',
        night_shift:        'background:#1e293b;color:#e2e8f0;',
        other:              'background:#f1f5f9;color:#475569;'
    };
    var labelMap = {
        normal_ot:          window.t('note_normal_ot')  || 'Normal OT',
        weekend_ot:         window.t('note_weekend_ot') || 'Weekend OT',
        sunday_ot:          window.t('note_sunday_ot')  || 'Sunday OT',
        sunday:             window.t('note_sunday')     || 'Sunday',
        government_holiday: window.t('note_gov_holiday')|| 'Gov Holiday',
        holiday_ot:         window.t('note_holiday_ot') || 'Holiday OT',
        night_shift:        window.t('note_night_shift')|| 'Night Shift',
        other:              window.t('note_other')      || 'Other'
    };
    if (!note) return '<span style="color:#94a3b8;">—</span>';
    var lbl   = labelMap[note] || note;
    var style = styleMap[note] || 'background:#f1f5f9;color:#475569;';
    return '<span style="' + style + 'font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;white-space:nowrap;">' + lbl + '</span>';
};

// Work In time → Day / Night shift label (global expose — Wage History reuse)
window.getRecordShiftLabel = function (workIn) {
    if (!workIn) return '-';
    var parts = workIn.split(':').map(Number);
    var hr = parts[0];
    // 18:00 – 05:59 → Night, ကျန်တာ → Day
    var isNight = hr >= 18 || hr < 6;
    return isNight
        ? '<span style="background:#1e293b;color:#e2e8f0;font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;">🌙 ' + (window.t('shift_night') || 'Night') + '</span>'
        : '<span style="background:#fef9c3;color:#92400e;font-size:10px;font-weight:600;padding:2px 6px;border-radius:4px;">☀️ ' + (window.t('shift_day') || 'Day') + '</span>';
};

// ── Detail Table Date column ဘေးက Weekday abbreviation (Sun/Mon/...) +
//    Note (sunday / sunday_ot) ရွေးထားတာ ရက်စွဲရဲ့ တကယ့်နေ့နဲ့ တိုက်စစ်ခြင်း
//    (global expose — Wage History month-detail view ကလည်း ပြန်သုံးသည်) ──
var WEEKDAY_ABBR_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
var WEEKDAY_TKEY    = ['wd_sun','wd_mon','wd_tue','wd_wed','wd_thu','wd_fri','wd_sat'];
window.getRecordWeekdayIndex = function (year, month, date) {
    var d = new Date(parseInt(year), parseInt(month) - 1, parseInt(date));
    return d.getDay(); // 0 = Sunday ... 6 = Saturday
};
window.getRecordWeekdayAbbr = function (weekdayIdx) {
    return window.t(WEEKDAY_TKEY[weekdayIdx]) || WEEKDAY_ABBR_EN[weekdayIdx];
};
// note က weekday-dependent (sunday / sunday_ot) ဖြစ်ပြီး ရက်စွဲက Sunday
// မဟုတ်ရင် mismatch အဖြစ်သတ်မှတ်သည်
window.isRecordNoteWeekdayMismatch = function (note, weekdayIdx) {
    if (note === 'sunday' || note === 'sunday_ot') return weekdayIdx !== 0;
    return false;
};

window.views.recordForm = function (container) {


    // ── ခေါင်းစဉ်နဲ့ ကိုက်ညီတဲ့ SVG icon (Notice icon = app.js exit dialog
    //    ပုံစံအတိုင်း, Delete/Calendar အတွက် သက်ဆိုင်ရာ icon) ─────────────
    function dialogIconSvg(type) {
        var stroke = '#94a3b8';
        if (type === 'delete') {
            return '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'
                + '<polyline points="3 6 5 6 21 6"></polyline>'
                + '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>'
                + '<path d="M10 11v6"></path><path d="M14 11v6"></path>'
                + '<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path></svg>';
        }
        if (type === 'calendar') {
            return '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'
                + '<rect x="3" y="4" width="18" height="18" rx="2"></rect>'
                + '<line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line>'
                + '<line x1="3" y1="10" x2="21" y2="10"></line></svg>';
        }
        if (type === 'list') {
            return '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'
                + '<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line>'
                + '<line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>';
        }
        if (type === 'clock') {
            return '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'
                + '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>';
        }
        // default 'notice' — app.js ရဲ့ Exit dialog ("Notice") icon အတိုင်း
        return '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="' + stroke + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'
            + '<circle cx="12" cy="12" r="10"></circle>'
            + '<line x1="12" y1="7.5" x2="12" y2="13"></line>'
            + '<circle cx="12" cy="16.5" r="0.6" fill="' + stroke + '" stroke="none"></circle></svg>';
    }

    // ── Custom Dialog (app.js exit dialog style နဲ့တူ) ───────────────
    // type: 'confirm' → No/Yes buttons, onConfirm callback
    // type: 'alert'   → OK button only
    function showRecordDialog(opts) {
        var title     = opts.title   || '';
        var msg       = opts.msg     || '';
        var type      = opts.type    || 'confirm'; // 'confirm' | 'alert'
        var icon      = opts.icon    || 'notice';  // 'notice' | 'delete'
        var onConfirm = opts.onConfirm || function() {};
        var onCancel  = opts.onCancel  || function() {};
        var yesText   = opts.yesText || window.t('exit_dialog_yes') || 'Yes';
        var noText    = opts.noText  || window.t('exit_dialog_no')  || 'No';
        var okText    = opts.okText  || 'OK';

        var old = document.getElementById('rec-custom-dialog-overlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.id = 'rec-custom-dialog-overlay';
        overlay.style.cssText = [
            'position:fixed;top:0;left:0;width:100%;height:100%;',
            'background:rgba(0,0,0,0.4);z-index:9999;',
            'display:flex;align-items:center;justify-content:center;',
            'backdrop-filter:blur(2px);'
        ].join('');

        var btnHtml = type === 'alert'
            ? '<button id="rcd-ok" style="flex:1;display:flex;flex-direction:row;align-items:center;justify-content:center;gap:10px;padding:10px 0;border:none;background:transparent;cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent;">'
              + '<div style="width:28px;height:28px;border-radius:50%;background:#00a651;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,166,81,0.25);flex-shrink:0;">'
              + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
              + '</div><span style="color:#1a202c;font-size:15px;font-weight:600;">' + okText + '</span></button>'
            : '<button id="rcd-cancel" style="flex:1;display:flex;flex-direction:row;align-items:center;justify-content:flex-start;gap:10px;padding:10px 0;border:none;background:transparent;cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent;">'
              + '<div style="width:28px;height:28px;border-radius:50%;background:#ff9800;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(255,152,0,0.25);flex-shrink:0;">'
              + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
              + '</div><span style="color:#4a5568;font-size:15px;font-weight:600;">' + noText + '</span></button>'
              + '<button id="rcd-confirm" style="flex:1;display:flex;flex-direction:row;align-items:center;justify-content:flex-end;gap:10px;padding:10px 0;border:none;background:transparent;cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent;">'
              + '<div style="width:28px;height:28px;border-radius:50%;background:#00a651;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,166,81,0.25);flex-shrink:0;">'
              + '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
              + '</div><span style="color:#1a202c;font-size:15px;font-weight:600;">' + yesText + '</span></button>';

        overlay.innerHTML =
            '<div style="background:#ffffff;width:85%;max-width:320px;min-height:220px;border-radius:0px;padding:32px 24px 16px 24px;box-shadow:0 12px 35px rgba(0,0,0,0.15);text-align:center;display:flex;flex-direction:column;justify-content:center;animation:rcdPopIn 0.2s ease-out;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">'
            + '<div style="display:flex;justify-content:center;margin-bottom:14px;">' + dialogIconSvg(icon) + '</div>'
            + '<div style="color:#1a202c;font-size:20px;font-weight:700;margin-bottom:14px;text-align:center;width:100%;">' + title + '</div>'
            + '<div style="color:#4a5568;font-size:15px;font-weight:400;margin-bottom:24px;line-height:1.6;text-align:center;width:100%;">' + msg + '</div>'
            + '<div style="width:100%;height:1px;background:#e2e8f0;margin:0 0 12px;"></div>'
            + '<div style="display:flex;gap:12px;width:100%;margin-top:auto;">' + btnHtml + '</div>'
            + '</div>'
            + '<style>@keyframes rcdPopIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}'
            + '#rcd-cancel:active span,#rcd-confirm:active span,#rcd-ok:active span{opacity:0.5}'
            + '#rcd-cancel:active div{background:#e68a00!important}'
            + '#rcd-confirm:active div,#rcd-ok:active div{background:#008f45!important}</style>';

        document.body.appendChild(overlay);

        var cancelBtn  = document.getElementById('rcd-cancel');
        var confirmBtn = document.getElementById('rcd-confirm');
        var okBtn      = document.getElementById('rcd-ok');

        if (cancelBtn) cancelBtn.addEventListener('click', function() { overlay.remove(); onCancel(); });
        if (confirmBtn) confirmBtn.addEventListener('click', function() { overlay.remove(); onConfirm(); });
        if (okBtn) okBtn.addEventListener('click', function() { overlay.remove(); onConfirm(); });
    }

    // ── Year / Month / Date Picker Dialog (ပုံကြမ်းအတိုင်း — Title + horizontal
    //    number/name list + Cancel(X) / Save(✓), showRecordDialog style ကိုပဲ
    //    reuse ထားသည်) ───────────────────────────────────────────────
    function showRecordPickerDialog(opts) {
        var title    = opts.title    || '';
        var items    = opts.items    || []; // [{value, label}]
        var onSave   = opts.onSave   || function () {};
        var current  = String(opts.selected);

        var old = document.getElementById('rec-picker-overlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.id = 'rec-picker-overlay';
        overlay.style.cssText = [
            'position:fixed;top:0;left:0;width:100%;height:100%;',
            'background:rgba(0,0,0,0.4);z-index:9999;',
            'display:flex;align-items:center;justify-content:center;',
            'backdrop-filter:blur(2px);'
        ].join('');

        var itemsHtml = items.map(function (it) {
            var isSel = String(it.value) === current;
            return '<span class="rec-picker-item" data-value="' + it.value + '" style="'
                + 'display:inline-block;padding:6px 12px;margin-right:2px;font-size:17px;'
                + 'font-weight:' + (isSel ? '700' : '500') + ';color:' + (isSel ? '#1a4e8f' : '#334155') + ';'
                + 'text-decoration:' + (isSel ? 'underline' : 'none') + ';text-underline-offset:5px;text-decoration-thickness:2px;'
                + 'cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent;">' + it.label + '</span>';
        }).join('');

        overlay.innerHTML =
            '<div style="background:#ffffff;width:85%;max-width:320px;min-height:220px;border-radius:0px;padding:28px 24px 16px 24px;box-shadow:0 12px 35px rgba(0,0,0,0.15);display:flex;flex-direction:column;animation:rcdPopIn 0.2s ease-out;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">'
            + '<div style="display:flex;justify-content:center;margin-bottom:14px;">' + dialogIconSvg('calendar') + '</div>'
            + '<div style="color:#1a202c;font-size:20px;font-weight:700;margin-bottom:22px;text-align:center;width:100%;">' + title + '</div>'
            + '<div id="rec-picker-scroll" style="overflow-x:auto;white-space:nowrap;padding-bottom:14px;margin-bottom:22px;-webkit-overflow-scrolling:touch;">' + itemsHtml + '</div>'
            + '<div style="width:100%;height:1px;background:#e2e8f0;margin:0 0 12px;"></div>'
            + '<div style="display:flex;gap:12px;width:100%;margin-top:auto;">'
            +   '<button id="rpd-cancel" style="flex:1;display:flex;flex-direction:row;align-items:center;justify-content:flex-start;gap:10px;padding:10px 0;border:none;background:transparent;cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent;">'
            +     '<div style="width:28px;height:28px;border-radius:50%;background:#ff9800;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(255,152,0,0.25);flex-shrink:0;">'
            +       '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
            +     '</div><span style="color:#4a5568;font-size:15px;font-weight:600;">' + (window.t('cancel') || 'Cancel') + '</span></button>'
            +   '<button id="rpd-save" style="flex:1;display:flex;flex-direction:row;align-items:center;justify-content:flex-end;gap:10px;padding:10px 0;border:none;background:transparent;cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent;">'
            +     '<span style="color:#1a202c;font-size:15px;font-weight:600;">' + (window.t('save') || 'Save') + '</span>'
            +     '<div style="width:28px;height:28px;border-radius:50%;background:#00a651;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,166,81,0.25);flex-shrink:0;">'
            +       '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
            +     '</div></button>'
            + '</div>'
            + '</div>'
            + '<style>@keyframes rcdPopIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}'
            + '#rpd-cancel:active span,#rpd-save:active span{opacity:0.5}'
            + '#rpd-cancel:active div{background:#e68a00!important}'
            + '#rpd-save:active div{background:#008f45!important}</style>';

        document.body.appendChild(overlay);

        overlay.querySelectorAll('.rec-picker-item').forEach(function (el) {
            el.addEventListener('click', function () {
                current = el.dataset.value;
                overlay.querySelectorAll('.rec-picker-item').forEach(function (x) {
                    x.style.textDecoration  = 'none';
                    x.style.fontWeight      = '500';
                    x.style.color           = '#334155';
                });
                el.style.textDecoration = 'underline';
                el.style.fontWeight     = '700';
                el.style.color          = '#1a4e8f';
            });
        });

        // ရွေးထားတဲ့ item ကို ပွင့်တာနဲ့ view ထဲ auto scroll လုပ်ပေးသည်
        var scrollWrap = document.getElementById('rec-picker-scroll');
        var selEl = overlay.querySelector('.rec-picker-item[data-value="' + current + '"]');
        if (selEl && scrollWrap) scrollWrap.scrollLeft = Math.max(0, selEl.offsetLeft - 16);

        document.getElementById('rpd-cancel').addEventListener('click', function () { overlay.remove(); });
        document.getElementById('rpd-save').addEventListener('click', function () { overlay.remove(); onSave(current); });
    }

    // ── Note Picker Dialog (vertical list, same visual language) ──────
    function showRecordListPickerDialog(opts) {
        var title   = opts.title  || '';
        var items   = opts.items  || []; // [{value, label}]
        var onSave  = opts.onSave || function () {};
        var current = String(opts.selected || '');

        var old = document.getElementById('rec-list-picker-overlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.id = 'rec-list-picker-overlay';
        overlay.style.cssText = [
            'position:fixed;top:0;left:0;width:100%;height:100%;',
            'background:rgba(0,0,0,0.4);z-index:9999;',
            'display:flex;align-items:center;justify-content:center;',
            'backdrop-filter:blur(2px);'
        ].join('');

        function rowHtml(it) {
            var isSel = String(it.value) === current;
            return '<div class="rec-list-item" data-value="' + it.value + '" style="'
                + 'display:flex;align-items:center;justify-content:space-between;padding:12px 2px;'
                + 'font-size:15px;font-weight:' + (isSel ? '700' : '500') + ';color:' + (isSel ? '#1a4e8f' : '#334155') + ';'
                + 'border-bottom:1px solid #f1f5f9;cursor:pointer;-webkit-tap-highlight-color:transparent;">'
                + '<span>' + it.label + '</span>'
                + '<span class="rec-list-check" style="' + (isSel ? '' : 'display:none;') + '">'
                +   '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a4e8f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                + '</span></div>';
        }

        overlay.innerHTML =
            '<div style="background:#ffffff;width:85%;max-width:320px;max-height:78vh;border-radius:0px;padding:28px 24px 16px 24px;box-shadow:0 12px 35px rgba(0,0,0,0.15);display:flex;flex-direction:column;animation:rcdPopIn 0.2s ease-out;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">'
            + '<div style="display:flex;justify-content:center;margin-bottom:14px;">' + dialogIconSvg('list') + '</div>'
            + '<div style="color:#1a202c;font-size:20px;font-weight:700;margin-bottom:16px;text-align:center;width:100%;">' + title + '</div>'
            + '<div id="rec-list-scroll" style="overflow-y:auto;max-height:44vh;margin-bottom:16px;">' + items.map(rowHtml).join('') + '</div>'
            + '<div style="width:100%;height:1px;background:#e2e8f0;margin:0 0 12px;"></div>'
            + '<div style="display:flex;gap:12px;width:100%;">'
            +   '<button id="rlp-cancel" style="flex:1;display:flex;flex-direction:row;align-items:center;justify-content:flex-start;gap:10px;padding:10px 0;border:none;background:transparent;cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent;">'
            +     '<div style="width:28px;height:28px;border-radius:50%;background:#ff9800;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(255,152,0,0.25);flex-shrink:0;">'
            +       '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
            +     '</div><span style="color:#4a5568;font-size:15px;font-weight:600;">' + (window.t('cancel') || 'Cancel') + '</span></button>'
            +   '<button id="rlp-save" style="flex:1;display:flex;flex-direction:row;align-items:center;justify-content:flex-end;gap:10px;padding:10px 0;border:none;background:transparent;cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent;">'
            +     '<span style="color:#1a202c;font-size:15px;font-weight:600;">' + (window.t('save') || 'Save') + '</span>'
            +     '<div style="width:28px;height:28px;border-radius:50%;background:#00a651;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,166,81,0.25);flex-shrink:0;">'
            +       '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
            +     '</div></button>'
            + '</div>'
            + '</div>'
            + '<style>@keyframes rcdPopIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}'
            + '#rlp-cancel:active span,#rlp-save:active span{opacity:0.5}'
            + '#rlp-cancel:active div{background:#e68a00!important}'
            + '#rlp-save:active div{background:#008f45!important}</style>';

        document.body.appendChild(overlay);

        overlay.querySelectorAll('.rec-list-item').forEach(function (el) {
            el.addEventListener('click', function () {
                current = el.dataset.value;
                overlay.querySelectorAll('.rec-list-item').forEach(function (x) {
                    x.style.fontWeight = '500';
                    x.style.color      = '#334155';
                    var chk = x.querySelector('.rec-list-check');
                    if (chk) chk.style.display = 'none';
                });
                el.style.fontWeight = '700';
                el.style.color      = '#1a4e8f';
                var ownChk = el.querySelector('.rec-list-check');
                if (ownChk) ownChk.style.display = '';
            });
        });

        document.getElementById('rlp-cancel').addEventListener('click', function () { overlay.remove(); });
        document.getElementById('rlp-save').addEventListener('click', function () { overlay.remove(); onSave(current); });
    }

    // ── Time Picker Dialog (Work In/Out, OT In/Out — Hour + Minute
    //    horizontal lists, same visual language as Date picker) ───────
    function showRecordTimePickerDialog(opts) {
        var title   = opts.title  || '';
        var onSave  = opts.onSave || function () {};
        var parts   = String(opts.selected || '').split(':');
        var curHour = (parts[0] || '00').padStart(2, '0');
        var curMin  = (parts[1] || '00').padStart(2, '0');

        var old = document.getElementById('rec-time-picker-overlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.id = 'rec-time-picker-overlay';
        overlay.style.cssText = [
            'position:fixed;top:0;left:0;width:100%;height:100%;',
            'background:rgba(0,0,0,0.4);z-index:9999;',
            'display:flex;align-items:center;justify-content:center;',
            'backdrop-filter:blur(2px);'
        ].join('');

        function rowHtml(kind, values, current) {
            return values.map(function (v) {
                var isSel = v === current;
                return '<span class="rec-time-item" data-kind="' + kind + '" data-value="' + v + '" style="'
                    + 'display:inline-block;padding:6px 12px;margin-right:2px;font-size:17px;'
                    + 'font-weight:' + (isSel ? '700' : '500') + ';color:' + (isSel ? '#1a4e8f' : '#334155') + ';'
                    + 'text-decoration:' + (isSel ? 'underline' : 'none') + ';text-underline-offset:5px;text-decoration-thickness:2px;'
                    + 'cursor:pointer;white-space:nowrap;-webkit-tap-highlight-color:transparent;">' + v + '</span>';
            }).join('');
        }

        var hours   = Array.from({ length: 24 }, function (_, i) { return String(i).padStart(2, '0'); });
        var minutes = Array.from({ length: 60 }, function (_, i) { return String(i).padStart(2, '0'); });

        overlay.innerHTML =
            '<div style="background:#ffffff;width:85%;max-width:320px;min-height:260px;border-radius:0px;padding:28px 24px 16px 24px;box-shadow:0 12px 35px rgba(0,0,0,0.15);display:flex;flex-direction:column;animation:rcdPopIn 0.2s ease-out;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">'
            + '<div style="display:flex;justify-content:center;margin-bottom:14px;">' + dialogIconSvg('clock') + '</div>'
            + '<div style="color:#1a202c;font-size:20px;font-weight:700;margin-bottom:18px;text-align:center;width:100%;">' + title + '</div>'
            + '<div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">' + (window.t('time_hour') || 'Hour') + '</div>'
            + '<div id="rec-time-hour-scroll" style="overflow-x:auto;white-space:nowrap;padding-bottom:10px;margin-bottom:14px;-webkit-overflow-scrolling:touch;">' + rowHtml('hour', hours, curHour) + '</div>'
            + '<div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">' + (window.t('time_minute') || 'Minute') + '</div>'
            + '<div id="rec-time-min-scroll" style="overflow-x:auto;white-space:nowrap;padding-bottom:10px;margin-bottom:18px;-webkit-overflow-scrolling:touch;">' + rowHtml('minute', minutes, curMin) + '</div>'
            + '<div style="width:100%;height:1px;background:#e2e8f0;margin:0 0 12px;"></div>'
            + '<div style="display:flex;gap:12px;width:100%;">'
            +   '<button id="rtp-cancel" style="flex:1;display:flex;flex-direction:row;align-items:center;justify-content:flex-start;gap:10px;padding:10px 0;border:none;background:transparent;cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent;">'
            +     '<div style="width:28px;height:28px;border-radius:50%;background:#ff9800;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(255,152,0,0.25);flex-shrink:0;">'
            +       '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
            +     '</div><span style="color:#4a5568;font-size:15px;font-weight:600;">' + (window.t('cancel') || 'Cancel') + '</span></button>'
            +   '<button id="rtp-save" style="flex:1;display:flex;flex-direction:row;align-items:center;justify-content:flex-end;gap:10px;padding:10px 0;border:none;background:transparent;cursor:pointer;outline:none;-webkit-tap-highlight-color:transparent;">'
            +     '<span style="color:#1a202c;font-size:15px;font-weight:600;">' + (window.t('save') || 'Save') + '</span>'
            +     '<div style="width:28px;height:28px;border-radius:50%;background:#00a651;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,166,81,0.25);flex-shrink:0;">'
            +       '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>'
            +     '</div></button>'
            + '</div>'
            + '</div>'
            + '<style>@keyframes rcdPopIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}'
            + '#rtp-cancel:active span,#rtp-save:active span{opacity:0.5}'
            + '#rtp-cancel:active div{background:#e68a00!important}'
            + '#rtp-save:active div{background:#008f45!important}</style>';

        document.body.appendChild(overlay);

        overlay.querySelectorAll('.rec-time-item').forEach(function (el) {
            el.addEventListener('click', function () {
                var kind = el.dataset.kind;
                if (kind === 'hour') curHour = el.dataset.value; else curMin = el.dataset.value;
                overlay.querySelectorAll('.rec-time-item[data-kind="' + kind + '"]').forEach(function (x) {
                    x.style.textDecoration = 'none';
                    x.style.fontWeight     = '500';
                    x.style.color          = '#334155';
                });
                el.style.textDecoration = 'underline';
                el.style.fontWeight     = '700';
                el.style.color          = '#1a4e8f';
            });
        });

        // ရွေးထားတဲ့ hour/minute ကို ပွင့်တာနဲ့ view ထဲ auto scroll လုပ်ပေးသည်
        ['hour', 'minute'].forEach(function (kind) {
            var wrap = document.getElementById(kind === 'hour' ? 'rec-time-hour-scroll' : 'rec-time-min-scroll');
            var val  = kind === 'hour' ? curHour : curMin;
            var el   = overlay.querySelector('.rec-time-item[data-kind="' + kind + '"][data-value="' + val + '"]');
            if (el && wrap) wrap.scrollLeft = Math.max(0, el.offsetLeft - 16);
        });

        document.getElementById('rtp-cancel').addEventListener('click', function () { overlay.remove(); });
        document.getElementById('rtp-save').addEventListener('click', function () {
            overlay.remove();
            onSave(curHour + ':' + curMin);
        });
    }

    // ── Shared Note options + label lookup (main form + edit modal
    //    dialog list-picker နှစ်ခုလုံးအတွက် ပြန်သုံးသည်) ────────────────
    function getNoteOptions() {
        return [
            { value: 'normal_ot',         label: window.t('note_normal_ot')   || 'Normal OT' },
            { value: 'weekend_ot',        label: window.t('note_weekend_ot')  || 'Weekend OT' },
            { value: 'sunday_ot',         label: window.t('note_sunday_ot')   || 'Sunday OT' },
            { value: 'sunday',            label: window.t('note_sunday')      || 'Sunday' },
            { value: 'government_holiday',label: window.t('note_gov_holiday') || 'Government Holiday' },
            { value: 'holiday_ot',        label: window.t('note_holiday_ot')  || 'Holiday OT' },
            { value: 'night_shift',       label: window.t('note_night_shift') || 'Night Shift' },
            { value: 'other',             label: window.t('note_other')       || 'Other' }
        ];
    }
    function noteLabel(val) {
        if (!val) return '— Select —';
        var found = getNoteOptions().find(function (o) { return o.value === val; });
        return found ? found.label : val;
    }

    // ── Time trigger div ကို tap → showRecordTimePickerDialog ပွင့်အောင်
    //    ချိတ်ပေးသည် (Work In/Out, OT In/Out, edit modal အားလုံး ပြန်သုံးသည်) ──
    function attachTimePicker(triggerId, hiddenId, title) {
        var trigger = document.getElementById(triggerId);
        if (!trigger) return;
        trigger.addEventListener('click', function () {
            var hidden = document.getElementById(hiddenId);
            showRecordTimePickerDialog({
                title:    title,
                selected: hidden ? hidden.value : '',
                onSave: function (val) {
                    if (hidden) {
                        hidden.value = val;
                        hidden.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    var t = document.getElementById(triggerId);
                    if (t) t.textContent = val;
                }
            });
        });
    }

    // ── Note trigger div ကို tap → showRecordListPickerDialog ပွင့်အောင်
    //    ချိတ်ပေးသည် (main form + edit modal ပြန်သုံးသည်) ────────────────
    function attachNotePicker(triggerId, hiddenId, onAfterChange) {
        var trigger = document.getElementById(triggerId);
        if (!trigger) return;
        trigger.addEventListener('click', function () {
            var hidden = document.getElementById(hiddenId);
            showRecordListPickerDialog({
                title:    window.t('rec_note') || 'Note',
                items:    getNoteOptions(),
                selected: hidden ? hidden.value : '',
                onSave: function (val) {
                    if (hidden) {
                        hidden.value = val;
                        hidden.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    var t = document.getElementById(triggerId);
                    if (t) t.textContent = noteLabel(val);
                    if (typeof onAfterChange === 'function') onAfterChange(val);
                }
            });
        });
    }

    // ---- Helpers ----
    function getMonthName(m) {
        var names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return names[parseInt(m) - 1] || m;
    }

    function getDaysInMonth(year, month) {
        return new Date(year, parseInt(month), 0).getDate();
    }

    function calcWage(workHr, perHr, note) {
        return window.calcRecordWage(workHr, perHr, note);
    }

    function calcOtTotal(otIn, otOut, otPay) {
        return window.calcRecordOtTotal(otIn, otOut, otPay);
    }

    function calcNSA(workIn, nsaRate, note) {
        return window.calcRecordNSA(workIn, nsaRate, note);
    }

    function getStatusLabel(note) {
        return window.getRecordStatusLabel(note);
    }

    // Work In time → Day / Night shift label
    function getShiftLabel(workIn) {
        return window.getRecordShiftLabel(workIn);
    }

    // ── Detail Table Date column ဘေးက Weekday abbreviation + note/weekday mismatch ──
    function getWeekdayIndex(year, month, date) {
        return window.getRecordWeekdayIndex(year, month, date);
    }
    function getWeekdayAbbr(weekdayIdx) {
        return window.getRecordWeekdayAbbr(weekdayIdx);
    }
    function isNoteWeekdayMismatch(note, weekdayIdx) {
        return window.isRecordNoteWeekdayMismatch(note, weekdayIdx);
    }

    // ---- Persistent form state (localStorage — ไม่ล้างเมื่อ save) ----
    var FORM_KEY = 'rec_form_state';
    var RULE_KEY = 'record_rule';
    function loadFormState() {
        try { return JSON.parse(localStorage.getItem(FORM_KEY)) || {}; } catch(e) { return {}; }
    }
    function loadRecordRule() {
        try { return JSON.parse(localStorage.getItem(RULE_KEY)) || {}; } catch(e) { return {}; }
    }
    function saveFormState(state) {
        localStorage.setItem(FORM_KEY, JSON.stringify(state));
    }

    // ---- Date state ----
    var now      = new Date();
    var selYear  = String(now.getFullYear());
    var selMonth = String(now.getMonth() + 1).padStart(2, '0');
    var selDate  = String(now.getDate()).padStart(2, '0');

    // ---- Edit modal ----
    function openEditModal(rec) {
        var existing = document.getElementById('rec-edit-overlay');
        if (existing) existing.remove();

        var overlay = document.createElement('div');
        overlay.id = 'rec-edit-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.45);z-index:8000;display:flex;align-items:flex-end;justify-content:center;';

        overlay.innerHTML = `
            <div style="
                background:#fff; width:100%; max-width:480px;
                border-radius:20px 20px 0 0; padding:24px 20px 36px;
                font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;
            ">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                    <span style="font-size:16px;font-weight:700;color:#1a202c;">Edit Record</span>
                    <button id="rec-edit-close" style="background:none;border:none;font-size:22px;color:#64748b;cursor:pointer;line-height:1;">×</button>
                </div>

                <div class="rec-row-3" style="margin-bottom:14px;">
                    <div class="rec-field-wrap">
                        <label class="rec-label">${window.t('rec_work_hr') || 'Work hr'}</label>
                        <input id="edit-workhour" type="number" min="0" step="0.5" class="rec-input" value="${rec.workHour || ''}">
                    </div>
                    <div class="rec-field-wrap">
                        <label class="rec-label">${window.t('rec_per_hr') || 'Hourly Wage'}</label>
                        <input id="edit-perhour" type="number" min="0" step="1" class="rec-input" value="${rec.perHour || ''}">
                    </div>
                    <div class="rec-field-wrap">
                        <label class="rec-label">${window.t('rec_ot_pay_hr') || 'Hourly OT'}</label>
                        <input id="edit-otpay" type="number" min="0" step="0.01" class="rec-input" value="${rec.otPay || ''}">
                    </div>
                </div>

                <div class="rec-row-2" style="margin-bottom:14px;">
                    <div class="rec-field-wrap">
                        <label class="rec-label">${window.t('rec_work_in') || 'Work In'}</label>
                        <input type="hidden" id="edit-workin" value="${rec.workIn || ''}">
                        <div id="edit-workin-trigger" class="rec-input rec-select rec-picker-trigger" style="cursor:pointer;">${rec.workIn || '--:--'}</div>
                    </div>
                    <div class="rec-field-wrap">
                        <label class="rec-label">${window.t('rec_work_out') || 'Work Out'}</label>
                        <input type="hidden" id="edit-workout" value="${rec.workOut || ''}">
                        <div id="edit-workout-trigger" class="rec-input rec-select rec-picker-trigger" style="cursor:pointer;">${rec.workOut || '--:--'}</div>
                    </div>
                </div>

                <div class="rec-row-2" style="margin-bottom:14px;">
                    <div class="rec-field-wrap">
                        <label class="rec-label">OT In</label>
                        <input type="hidden" id="edit-otin" value="${rec.otIn || ''}">
                        <div id="edit-otin-trigger" class="rec-input rec-select rec-picker-trigger" style="cursor:pointer;">${rec.otIn || '--:--'}</div>
                    </div>
                    <div class="rec-field-wrap">
                        <label class="rec-label">OT Out</label>
                        <input type="hidden" id="edit-otout" value="${rec.otOut || ''}">
                        <div id="edit-otout-trigger" class="rec-input rec-select rec-picker-trigger" style="cursor:pointer;">${rec.otOut || '--:--'}</div>
                    </div>
                </div>

                <div class="rec-field-wrap" style="margin-bottom:20px;">
                    <label class="rec-label">${window.t('rec_note') || 'Note'}</label>
                    <input type="hidden" id="edit-note" value="${rec.note || ''}">
                    <div id="edit-note-trigger" class="rec-input rec-select rec-picker-trigger" style="cursor:pointer;">${noteLabel(rec.note)}</div>
                </div>


                <div style="display:flex;gap:10px;">
                    <button id="rec-edit-delete" style="flex:1;padding:13px;background:#fee2e2;color:#dc2626;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;">Delete</button>
                    <button id="rec-edit-save" style="flex:2;padding:13px;background:#1a4e8f;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;">Save</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.remove();
        });
        document.getElementById('rec-edit-close').addEventListener('click', function() {
            overlay.remove();
        });

        // Work In / Work Out / OT In / OT Out / Note — tap opens dialog (edit modal)
        attachTimePicker('edit-workin-trigger', 'edit-workin', window.t('rec_work_in') || 'Work In');
        attachTimePicker('edit-workout-trigger','edit-workout',window.t('rec_work_out')|| 'Work Out');
        attachTimePicker('edit-otin-trigger',  'edit-otin',  window.t('rec_ot_in')  || 'OT In');
        attachTimePicker('edit-otout-trigger', 'edit-otout', window.t('rec_ot_out') || 'OT Out');
        attachNotePicker('edit-note-trigger',  'edit-note');

        document.getElementById('rec-edit-save').addEventListener('click', function() {
            var wh    = document.getElementById('edit-workhour').value.trim();
            var ph    = document.getElementById('edit-perhour').value.trim();
            var op    = document.getElementById('edit-otpay').value.trim();
            var wi    = document.getElementById('edit-workin').value;
            var wo    = document.getElementById('edit-workout').value;
            var otin  = document.getElementById('edit-otin').value;
            var otout = document.getElementById('edit-otout').value;
            var note  = document.getElementById('edit-note').value;
            var isNoOt = note === 'government_holiday' || note === 'sunday_ot';

            var recs = window.getRecords().map(function(r) {
                if (r.id !== rec.id) return r;
                return Object.assign({}, r, {
                    workHour: wh, perHour: ph, otPay: op,
                    workIn: wi, workOut: wo,
                    otIn:  isNoOt ? '' : otin,
                    otOut: isNoOt ? '' : otout,
                    note: note
                });
            });
            window.saveRecords(recs);
            overlay.remove();
            render();
            if (typeof window.patchNotifBadge === 'function') window.patchNotifBadge();
        });

        document.getElementById('rec-edit-delete').addEventListener('click', function() {
            showRecordDialog({
                type: 'confirm',
                icon:  'delete',
                title: window.t('rec_delete_title') || 'Delete Record',
                msg:   window.t('rec_delete_msg')   || 'Delete this record?',
                yesText: window.t('exit_dialog_yes') || 'Yes',
                noText:  window.t('exit_dialog_no')  || 'No',
                onConfirm: function() {
                    window.saveRecords(window.getRecords().filter(function(r) { return r.id !== rec.id; }));
                    overlay.remove();
                    render();
                    if (typeof window.patchNotifBadge === 'function') window.patchNotifBadge();
                }
            });
        });
    }

    // ---- Main Render ----
    function render() {
        // record.js ထဲမှာ Year/Month ပြောင်းတိုင်း localStorage ထဲသိမ်း —
        // Wage Calculator (record-menu.js) က ဒီ selection ကို ဖတ်ပြီး
        // Total wage ကို လိုက်ပြောင်းအောင် သုံးမည်
        try { localStorage.setItem('ot_rec_selected_ym', JSON.stringify({ year: selYear, month: selMonth })); } catch (e) {}

        var fs      = loadFormState();
        var rule    = loadRecordRule();
        // rule ထဲမှာ value ရှိရင် fs ကို override လုပ် (setting ကနေ set လုပ်တာ ဦးစားပေး)
        if (rule.workHour) fs.workHour = rule.workHour;
        if (rule.perHour)  fs.perHour  = rule.perHour;
        if (rule.otPay)    fs.otPay    = rule.otPay;
        if (rule.nsa)      fs.nsa      = rule.nsa;
        // Shift Template — workIn/Out default (form state မရှိမှသာ rule ကိုသုံး)
        if (!fs.workIn  && rule.workIn)  fs.workIn  = rule.workIn;
        if (!fs.workOut && rule.workOut) fs.workOut = rule.workOut;
        var records = window.getRecords();
        var days    = getDaysInMonth(parseInt(selYear), selMonth);
        console.log('[record.js] days-in-month check → year:', selYear, 'month:', selMonth, '→ days:', days);

        // Clamp selDate
        if (parseInt(selDate) > days) selDate = String(days).padStart(2,'0');

        var filtered = records.filter(function(r) {
            return r.month === selMonth && (r.year || selYear) === selYear;
        }).sort(function(a, b) { return parseInt(a.date) - parseInt(b.date); });

        container.innerHTML = `
            <div class="rec-page">

                <!-- Year, Month & Date (tap → custom picker dialog) -->
                <div class="rec-row-3">
                    <div class="rec-field-wrap">
                        <label class="rec-label">Year</label>
                        <div id="rec-year" class="rec-input rec-select rec-picker-trigger" style="cursor:pointer;">${selYear}</div>
                    </div>
                    <div class="rec-field-wrap">
                        <label class="rec-label">Month</label>
                        <div id="rec-month" class="rec-input rec-select rec-picker-trigger" style="cursor:pointer;">${getMonthName(selMonth)}</div>
                    </div>
                    <div class="rec-field-wrap">
                        <label class="rec-label">Date</label>
                        <div id="rec-date" class="rec-input rec-select rec-picker-trigger" style="cursor:pointer;">${selDate}</div>
                    </div>
                </div>

                <!-- Work hr / Hourly Wage -->
                <div class="rec-row-2" style="margin-bottom:14px;">
                    <div class="rec-field-wrap">
                        <label class="rec-label">${window.t('rec_work_hr') || 'Work hr'}</label>
                        <input id="rec-workhour" type="number" min="0" step="0.01"
                            class="rec-input rec-workhour-display" placeholder="0.00"
                            value="${fs.workIn && fs.workOut ? '' : (rule.workHour || '')}"
                            readonly
                            title="${window.t('rule_readonly_tip') || 'Auto: Work Out − Work In − Lunch'}">
                    </div>
                    <div class="rec-field-wrap">
                        <label class="rec-label">${window.t('rec_per_hr') || 'Hourly Wage'}</label>
                        <input id="rec-perhour" type="number" min="0" step="1"
                            class="rec-input" placeholder="0"
                            value="${fs.perHour || ''}"
                            readonly title="${window.t('rule_readonly_tip') || 'Set in Settings › Record Rule'}">
                    </div>
                </div>

                <!-- Hourly OT / Night Shift Allowance -->
                <div class="rec-row-2" style="margin-bottom:16px;">
                    <div class="rec-field-wrap">
                        <label class="rec-label">${window.t('rec_ot_pay_hr') || 'Hourly OT'}</label>
                        <input id="rec-otpay" type="number" min="0" step="0.01"
                            class="rec-input rec-otpay-input" placeholder="0"
                            value="${fs.otPay || ''}"
                            readonly title="${window.t('rule_readonly_tip') || 'Set in Settings › Record Rule'}">
                    </div>
                    <div class="rec-field-wrap">
                        <label class="rec-label" style="font-size:11px;">${window.t('wc_night_allowance') || 'Night Shift Allowance'}</label>
                        <input id="rec-nsa" type="number" min="0" step="0.01"
                            class="rec-input" placeholder="0"
                            value="${fs.nsa || ''}"
                            readonly title="${window.t('rule_readonly_tip') || 'Set in Settings › Record Rule'}">
                    </div>
                </div>


                <!-- Work In / Work Out -->
                <div class="rec-work-time-row" id="rec-work-time-section">
                    <div class="rec-field-wrap">
                        <label class="rec-label">${window.t('rec_work_in') || 'Work In'}</label>
                        <input type="hidden" id="rec-workin" value="${fs.workIn || ''}">
                        <div id="rec-workin-trigger" class="rec-input rec-select rec-picker-trigger" style="cursor:pointer;">${fs.workIn || '--:--'}</div>
                    </div>
                    <div class="rec-field-wrap">
                        <label class="rec-label">${window.t('rec_work_out') || 'Work Out'}</label>
                        <input type="hidden" id="rec-workout" value="${fs.workOut || ''}">
                        <div id="rec-workout-trigger" class="rec-input rec-select rec-picker-trigger" style="cursor:pointer;">${fs.workOut || '--:--'}</div>
                    </div>
                </div>

                <!-- OT In / OT Out -->
                <div class="rec-row-2" id="rec-ot-time-section" style="margin-bottom:14px;">
                    <div class="rec-field-wrap">
                        <label class="rec-label">${window.t('rec_ot_in') || 'OT In'}</label>
                        <input type="hidden" id="rec-otin" value="${fs.otIn || ''}">
                        <div id="rec-otin-trigger" class="rec-input rec-select rec-picker-trigger" style="cursor:pointer;">${fs.otIn || '--:--'}</div>
                    </div>
                    <div class="rec-field-wrap">
                        <label class="rec-label">${window.t('rec_ot_out') || 'OT Out'}</label>
                        <input type="hidden" id="rec-otout" value="${fs.otOut || ''}">
                        <div id="rec-otout-trigger" class="rec-input rec-select rec-picker-trigger" style="cursor:pointer;">${fs.otOut || '--:--'}</div>
                    </div>
                </div>

                <!-- Note -->
                <div class="rec-field-wrap" style="margin-bottom:16px;">
                    <label class="rec-label">Note</label>
                    <input type="hidden" id="rec-note" value="${fs.note || ''}">
                    <div id="rec-note-trigger" class="rec-input rec-select rec-picker-trigger" style="cursor:pointer;">${noteLabel(fs.note)}</div>
                </div>

                <!-- Save -->
                <button id="rec-save-btn" class="rec-save-btn">${window.t('save') || 'Save'}</button>

                <!-- Detail Table -->
                <div class="rec-table-section">
                    <p class="rec-table-title">${window.t('rec_detail_table') || 'Detail Table'}</p>
                    <div class="rec-table-wrap">
                        <table class="rec-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Shift</th>
                                    <th>Wage</th>
                                    <th>OT</th>
                                    <th>${window.t('rec_nsa_abbr') || 'NSA'}</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filtered.length === 0
                                    ? '<tr><td colspan="7" class="rec-empty">' + (window.t('no_data') || 'No records') + '</td></tr>'
                                    : filtered.map(function(r) {
                                        var isSunday = r.note === 'sunday';
                                        var wage    = calcWage(r.workHour, r.perHour, r.note);
                                        var otTotal = (r.note === 'government_holiday' || r.note === 'sunday_ot' || isSunday) ? '0.00' : calcOtTotal(r.otIn, r.otOut, r.otPay);
                                        var nsaAmt  = isSunday ? '0.00' : calcNSA(r.workIn, r.nsa, r.note);
                                        var total   = isSunday ? '-' : (parseFloat(wage) + parseFloat(otTotal) + parseFloat(nsaAmt)).toFixed(2);
                                        // Shift column: sunday → badge, ကျန်တာ → Day/Night
                                        var shiftCell = isSunday
                                            ? '<span class="rec-badge-sunday">' + (window.t('note_sunday') || 'Sunday') + '</span>'
                                            : getShiftLabel(r.workIn);
                                        // Date column: weekday abbreviation + note/weekday mismatch warning
                                        var wdIdx     = getWeekdayIndex(r.year || selYear, r.month, r.date);
                                        var wdAbbr    = getWeekdayAbbr(wdIdx);
                                        var mismatch  = isNoteWeekdayMismatch(r.note, wdIdx);
                                        var dateCell  = r.date +
                                            '<span style="display:inline-block;margin-left:5px;font-size:10px;font-weight:600;color:' + (mismatch ? '#dc2626' : '#94a3b8') + ';"' +
                                            (mismatch ? ' title="' + (window.t('rec_weekday_mismatch_tip') || "Note doesn't match this date's weekday") + '"' : '') +
                                            '>' + wdAbbr + (mismatch ? ' ⚠️' : '') + '</span>';
                                        return '<tr class="rec-tr rec-tr-tap" data-id="' + r.id + '">' +
                                            '<td>' + dateCell + '</td>' +
                                            '<td>' + shiftCell + '</td>' +
                                            '<td>' + (isSunday ? '-' : wage) + '</td>' +
                                            '<td>' + (isSunday ? '-' : otTotal) + '</td>' +
                                            '<td>' + (isSunday ? '-' : nsaAmt) + '</td>' +
                                            '<td>' + total + '</td>' +
                                            '<td>' + getStatusLabel(r.note) + '</td>' +
                                        '</tr>';
                                    }).join('')
                                }
                            </tbody>
                        </table>
                    </div>
                    <p class="rec-edit-hint">${window.t('rec_tap_edit') || 'Tap a row to edit'}</p>
                </div>

            </div>
        `;

        // Persist form on input
        function persistForm() {
            saveFormState({
                workHour: document.getElementById('rec-workhour')?.value || '',
                perHour:  document.getElementById('rec-perhour')?.value  || '',
                otPay:    document.getElementById('rec-otpay')?.value    || '',
                nsa:      document.getElementById('rec-nsa')?.value      || '',
                workIn:   document.getElementById('rec-workin')?.value   || '',
                workOut:  document.getElementById('rec-workout')?.value  || '',
                otIn:     document.getElementById('rec-otin')?.value     || '',
                otOut:    document.getElementById('rec-otout')?.value    || '',
                note:     document.getElementById('rec-note')?.value     || ''
            });
        }

        ['rec-perhour','rec-otpay','rec-nsa','rec-workin','rec-workout','rec-otin','rec-otout','rec-note'].forEach(function(id) {
            document.getElementById(id)?.addEventListener('input',  persistForm);
            document.getElementById(id)?.addEventListener('change', persistForm);
        });

        // ── Work Hour auto-calc: (Work Out − Work In) − Lunch ─────────
        function calcAndSetWorkHour() {
            var wi  = document.getElementById('rec-workin')?.value;
            var wo  = document.getElementById('rec-workout')?.value;
            var el  = document.getElementById('rec-workhour');
            if (!el) return;
            if (!wi || !wo) { el.value = rule.workHour || ''; persistForm(); return; }
            var inM  = parseInt(wi.split(':')[0])  * 60 + parseInt(wi.split(':')[1]);
            var outM = parseInt(wo.split(':')[0])  * 60 + parseInt(wo.split(':')[1]);
            if (outM <= inM) outM += 24 * 60; // overnight
            var lunchMin = parseInt(rule.lunchMin || 0);
            var total    = Math.max(0, outM - inM - lunchMin);
            el.value = (total / 60).toFixed(2);
            persistForm();
        }
        document.getElementById('rec-workin')?.addEventListener('change',  calcAndSetWorkHour);
        document.getElementById('rec-workout')?.addEventListener('change', calcAndSetWorkHour);
        // initial calc if values already present
        if (document.getElementById('rec-workin')?.value && document.getElementById('rec-workout')?.value) {
            calcAndSetWorkHour();
        }

        // Work In / Work Out / OT In / OT Out — tap opens time picker dialog
        attachTimePicker('rec-workin-trigger',  'rec-workin',  window.t('rec_work_in')  || 'Work In');
        attachTimePicker('rec-workout-trigger', 'rec-workout', window.t('rec_work_out') || 'Work Out');
        attachTimePicker('rec-otin-trigger',    'rec-otin',    window.t('rec_ot_in')    || 'OT In');
        attachTimePicker('rec-otout-trigger',   'rec-otout',   window.t('rec_ot_out')   || 'OT Out');

        // Note change → toggle OT row visibility + wage multiplier badge
        function applyNoteMode() {
            var note = document.getElementById('rec-note')?.value || '';
            var otSection = document.getElementById('rec-ot-time-section');
            var hideOt = note === 'government_holiday' || note === 'sunday_ot' || note === 'sunday';
            if (otSection) {
                otSection.classList.toggle('rec-ot-row-hidden', hideOt);
            }
        }
        applyNoteMode(); // initial apply on render
        document.getElementById('rec-note')?.addEventListener('change', function() {
            persistForm();
            applyNoteMode();
        });

        // Note — tap opens list picker dialog
        attachNotePicker('rec-note-trigger', 'rec-note', function () { applyNoteMode(); });

        // Month → tap opens picker dialog
        document.getElementById('rec-month')?.addEventListener('click', function () {
            showRecordPickerDialog({
                title: window.t('rec_pick_month') || 'Month',
                items: [1,2,3,4,5,6,7,8,9,10,11,12].map(function (m) {
                    var mm = String(m).padStart(2, '0');
                    return { value: mm, label: getMonthName(mm) };
                }),
                selected: selMonth,
                onSave: function (val) { selMonth = val; render(); }
            });
        });

        // Year → tap opens picker dialog
        document.getElementById('rec-year')?.addEventListener('click', function () {
            showRecordPickerDialog({
                title: window.t('rec_pick_year') || 'Year',
                items: Array.from({ length: 21 }, function (_, i) { return i - 10; }).map(function (offset) {
                    var y = String(parseInt(selYear) + offset);
                    return { value: y, label: y };
                }),
                selected: selYear,
                onSave: function (val) { selYear = val; render(); }
            });
        });

        // Date → tap opens picker dialog
        document.getElementById('rec-date')?.addEventListener('click', function () {
            var daysNow = getDaysInMonth(parseInt(selYear), selMonth);
            showRecordPickerDialog({
                title: window.t('rec_pick_date') || 'Date',
                items: Array.from({ length: daysNow }, function (_, i) {
                    var dd = String(i + 1).padStart(2, '0');
                    return { value: dd, label: dd };
                }),
                selected: selDate,
                onSave: function (val) {
                    selDate = val;
                    var dateEl = document.getElementById('rec-date');
                    if (dateEl) dateEl.textContent = selDate;
                    // Holiday auto-detect
                    if (rule.holidayDetect !== false) {
                        var THAI_HOLIDAYS_2026 = [
                            '2026-01-01','2026-02-05','2026-04-06','2026-04-13','2026-04-14',
                            '2026-04-15','2026-05-01','2026-05-04','2026-06-03','2026-07-28',
                            '2026-08-12','2026-10-13','2026-10-23','2026-12-05','2026-12-10','2026-12-31'
                        ];
                        var key = selYear + '-' + selMonth + '-' + String(selDate).padStart(2, '0');
                        var noteEl = document.getElementById('rec-note');
                        if (noteEl && THAI_HOLIDAYS_2026.indexOf(key) !== -1 && !noteEl.value) {
                            noteEl.value = 'government_holiday';
                            var noteTrigEl = document.getElementById('rec-note-trigger');
                            if (noteTrigEl) noteTrigEl.textContent = noteLabel('government_holiday');
                            persistForm();
                            applyNoteMode();
                        }
                    }
                }
            });
        });

        // Save — form data stays
        document.getElementById('rec-save-btn')?.addEventListener('click', function() {
            var wh    = document.getElementById('rec-workhour')?.value.trim();
            var ph    = document.getElementById('rec-perhour')?.value.trim();
            var op    = document.getElementById('rec-otpay')?.value.trim();
            var nsa   = document.getElementById('rec-nsa')?.value.trim();
            var wi    = document.getElementById('rec-workin')?.value  || '';
            var wo    = document.getElementById('rec-workout')?.value || '';
            var otin  = document.getElementById('rec-otin')?.value;
            var otout = document.getElementById('rec-otout')?.value;
            var note  = document.getElementById('rec-note')?.value || '';

            if (!wh || !ph) {
                showRecordDialog({
                    type: 'alert',
                    title: window.t('rec_alert_title') || 'Required',
                    msg:   window.t('rec_alert_fill')  || 'Please fill Work hr and Per hr.',
                    okText: 'OK'
                });
                return;
            }

            // ── Sunday note consistency check (Save မလုပ်ခင် note box ကို force ပြင်ခိုင်းသည်) ──
            var actualWdIdx    = getWeekdayIndex(selYear, selMonth, selDate);
            var isActualSunday = actualWdIdx === 0;
            var hasTimesFilled = !!(wi || wo || otin || otout);

            // Case 1: ရက်စွဲက တကယ့် Sunday ဖြစ်နေပြီး note က Sunday/Sunday OT မဟုတ်ဘဲ
            // အချိန်တွေ (Work In/Out, OT In/Out) ဖြည့်ထားမိရင် — Sunday ဖြစ်ကြောင်း ပြပြီး
            // note box dialog ကို force ဖွင့်ပေးမည်
            if (isActualSunday && note !== 'sunday' && note !== 'sunday_ot' && hasTimesFilled) {
                showRecordDialog({
                    type: 'alert',
                    title: window.t('rec_sunday_detect_title') || 'Sunday',
                    msg:   window.t('rec_sunday_detect_msg')   || 'Selected date is a Sunday. Please select the Sunday note.',
                    okText: 'OK',
                    onConfirm: function () { document.getElementById('rec-note-trigger')?.click(); }
                });
                return;
            }

            // Case 2: ရက်စွဲက Sunday မဟုတ်တော့ဘဲ note box မှာ Sunday ရွေးထားတာ
            // မပြောင်းရသေးရင် — Save နှိပ်တာနဲ့ note box dialog ကို force ဖွင့်ပေးမည်
            if (!isActualSunday && note === 'sunday') {
                showRecordListPickerDialog({
                    title:    window.t('rec_note') || 'Note',
                    items:    getNoteOptions(),
                    selected: note,
                    onSave: function (val) {
                        var hidden = document.getElementById('rec-note');
                        if (hidden) {
                            hidden.value = val;
                            hidden.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        var t = document.getElementById('rec-note-trigger');
                        if (t) t.textContent = noteLabel(val);
                    }
                });
                return;
            }

            function doSave() {
                var noOt = note === 'government_holiday' || note === 'sunday_ot' || note === 'sunday';
                window.getRecords().push && window.saveRecords(
                    window.getRecords().concat([{
                        id:       Date.now(),
                        year:     selYear,
                        month:    selMonth,
                        date:     selDate,
                        workHour: wh,
                        perHour:  ph,
                        otPay:    op || '0',
                        nsa:      nsa || '0',
                        workIn:   wi,
                        workOut:  wo,
                        otIn:     noOt ? '' : otin,
                        otOut:    noOt ? '' : otout,
                        note:     note
                    }])
                );
                // Save ပြီးရင် Date field ကို နောက်ရက်တစ်ရက်ကို auto ပြောင်းပေးသည်
                // (လရဲ့နောက်ဆုံးရက်ဖြစ်ရင် နောက်လ 1 ရက်၊ ဒီဇင်ဘာဆိုရင် နောက်နှစ် ဇန်နဝါရီအထိ ရွှေ့ပေးသည်)
                var nextDate = parseInt(selDate) + 1;
                var daysInCurMonth = getDaysInMonth(parseInt(selYear), selMonth);
                if (nextDate > daysInCurMonth) {
                    nextDate = 1;
                    var nextMonth = parseInt(selMonth) + 1;
                    if (nextMonth > 12) {
                        nextMonth = 1;
                        selYear = String(parseInt(selYear) + 1);
                    }
                    selMonth = String(nextMonth).padStart(2, '0');
                }
                selDate = String(nextDate).padStart(2, '0');
                render();
                if (typeof window.patchNotifBadge === 'function') window.patchNotifBadge();
            }

            // Duplicate date warning
            if (rule.dupWarn !== false) {
                var dupExists = window.getRecords().some(function(r) {
                    return r.date === selDate && r.month === selMonth && (r.year || selYear) === selYear;
                });
                if (dupExists) {
                    showRecordDialog({
                        type: 'confirm',
                        title: window.t('rec_dup_title') || 'Duplicate Date',
                        msg:   window.t('rec_dup_msg')   || 'A record for this date already exists. Save anyway?',
                        yesText: window.t('exit_dialog_yes') || 'Yes',
                        noText:  window.t('exit_dialog_no')  || 'No',
                        onConfirm: function() {
                            if (note === 'sunday_ot') { checkSunday(); } else { doSave(); }
                        }
                    });
                    return;
                }
            }

            // Sunday OT — date က Sunday မဟုတ်ရင် warning ပြမယ်
            if (note === 'sunday_ot') {
                var checkDate = new Date(parseInt(selYear), parseInt(selMonth) - 1, parseInt(selDate));
                if (checkDate.getDay() !== 0) {
                    showRecordDialog({
                        type: 'confirm',
                        title: window.t('rec_sunday_warn_title') || 'Not a Sunday',
                        msg:   window.t('rec_sunday_warn')       || 'Selected date is not a Sunday. Continue anyway?',
                        yesText: window.t('exit_dialog_yes') || 'Yes',
                        noText:  window.t('exit_dialog_no')  || 'No',
                        onConfirm: function() { doSave(); }
                    });
                    return;
                }
            }

            doSave();
        });

        // Row tap → edit
        document.querySelectorAll('.rec-tr-tap').forEach(function(tr) {
            tr.addEventListener('click', function() {
                var id  = parseInt(tr.dataset.id);
                var rec = window.getRecords().find(function(r) { return r.id === id; });
                if (rec) openEditModal(rec);
            });
        });
    }

    render();
};
