// ==========================================
// ၁။ Core Data Layer Functions
// ==========================================
window.getRecords = function() { return JSON.parse(localStorage.getItem('ot_records_v2')) || []; };
window.saveRecords = function(records) { localStorage.setItem('ot_records_v2', JSON.stringify(records)); };
window.views = {};

// ==========================================
// 📍 Tab re-entry animation — back ခလုတ်နှိပ်ပြီး sub-layout ကနေ
// tab ပြန်ဝင်တဲ့အခါ (left → right) ညင်ညင်သာသာ ဆွဲသွင်းသလိုမျိုး
// slide-in ဖြစ်စေရန် keyframe ကို document တစ်ခုလုံးအတွက် တစ်ကြိမ်တည်း inject
// ==========================================
(function () {
    if (document.getElementById('tab-slide-in-style')) return;
    var styleEl = document.createElement('style');
    styleEl.id = 'tab-slide-in-style';
    styleEl.textContent = '@keyframes tabSlideIn{from{opacity:0;transform:translateX(-16px)}to{opacity:1;transform:translateX(0)}}';
    document.head.appendChild(styleEl);
})();

/**
 * 📍 head-nav / bottom-nav / tab-body စတဲ့ element(s) ကို tabSlideIn
 * animation ဖြင့် (reflow trick နဲ့) ခေါ်တိုင်း ပြန်ဆွဲပေးသည့် helper —
 * sub-layout (openSubLayout, record-menu.js, notification panel) တွေရဲ့
 * back button ကနေ ပြန်ထွက်တဲ့အခါသာ ခေါ်သုံးရန်
 */
window._playTabSlideIn = function (elements) {
    elements.forEach(function (el) {
        if (!el) return;
        el.style.animation = 'none';
        void el.offsetWidth;
        el.style.animation = 'tabSlideIn 0.25s ease-out';
    });
};

// ==========================================
// 📍 PIN success re-entry animation — pin.js က PIN အောင်မြင်ပြီး
// (pin-slide-left နဲ့) ဘယ်ဘက်ကို ဆွဲထွက်တဲ့အခါ head-nav/bottom-nav/
// tab-body အားလုံးလည်း အဲ့ဒီ direction အတိုင်း ညာဘက်ကနေ ဘယ်ဘက်ကို
// ညင်ညင်သာသာ ဆွဲသွင်းသလို ဝင်လာအောင် (record-menu.js ရဲ့ recSubIn
// pattern — opacity + translateX, ease-out — ကို ကိုးကားထားသည်)
// ==========================================
(function () {
    if (document.getElementById('nav-slide-down-style')) return;
    var styleEl = document.createElement('style');
    styleEl.id = 'nav-slide-down-style';
    styleEl.textContent = '@keyframes navSlideLeftIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}';
    document.head.appendChild(styleEl);
})();

/**
 * 📍 head-nav / bottom-nav / tab-body စတဲ့ element(s) ကို navSlideLeftIn
 * animation ဖြင့် (reflow trick နဲ့) ခေါ်တိုင်း ပြန်ဆွဲပေးသည့် helper —
 * PIN အောင်မြင်မှသာ (_loadTabDirect) ခေါ်သုံးရန်
 */
window._playNavSlideDown = function (elements) {
    elements.forEach(function (el) {
        if (!el) return;
        el.style.animation = 'none';
    });
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            elements.forEach(function (el) {
                if (!el) return;
                el.style.animation = 'navSlideLeftIn 0.32s ease-out';
            });
        });
    });
};

// ==========================================
// ၂။ Global Functions (Error ကင်းစေရန် အပေါ်ဆုံးတွင် ကြေညာထားခြင်း)
// ==========================================
window.renderI18nLabels = function() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = window.t(key);
    });
};

/**
 * 📍 Global Head Navigation (Main Header)
 */
window.renderGlobalHeader = function(tabName) {
    const contentView = document.getElementById('content-view');
    if (!contentView) return;

    const oldHeader = contentView.querySelector('.custom-dashboard-header');
    if (oldHeader) oldHeader.remove();

    const headerHTML = `
        <div class="custom-dashboard-header" style="display: flex; justify-content: space-between; align-items: center; padding:5px 10px 4px 10px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <div class="profile-avatar-wrap">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d3748" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <span id="header-greeting-slot" style="font-size:13px;font-weight:600;color:#4a5568;"></span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 12px;">
                <div id="app-notif-btn" style="position: relative; cursor: pointer; padding: 2px; display: flex; align-items: center; justify-content: center; -webkit-tap-highlight-color: transparent; user-select: none;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                </div>
                <div id="app-power-exit-btn" style="cursor: pointer; padding: 2px; display: flex; align-items: center; justify-content: center; -webkit-tap-highlight-color: transparent; user-select: none;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                        <line x1="12" y1="2" x2="12" y2="12"></line>
                    </svg>
                </div>
            </div>
        </div>
        <div id="dynamic-view-body" class="view-body" style="padding: 10px 16px 16px 16px; flex: 1; overflow-y: auto;"></div>
    `;

    contentView.innerHTML = headerHTML;

    // Sticky header scroll shadow
    const viewBody = contentView.querySelector('#dynamic-view-body');
    const header   = contentView.querySelector('.custom-dashboard-header');
    if (viewBody && header) {
        viewBody.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', viewBody.scrollTop > 4);
        }, { passive: true });
    }

    const powerBtn = document.getElementById('app-power-exit-btn');
    if (powerBtn) {
        powerBtn.addEventListener('click', () => {
            window.showExitConfirmationDialog();
        });
    }

    const notifBtn = document.getElementById('app-notif-btn');
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            window.showDailyDetailPanel();
        });
    }
};

// ==========================================
// 🔔 Notification Badge System
// ==========================================

var NOTIF_READ_KEY = 'notif_read_'; // prefix — "notif_read_YYYY-MM" မှာ read count သိမ်း

// ── Per-record viewed tracking ──
// Key: "notif_viewed_YYYY-MM"  →  JSON array of viewed date strings (e.g. ["01","05","12"])
var NOTIF_VIEWED_KEY = 'notif_viewed_'; // prefix

function _notifViewedSetKey() {
    var n = new Date();
    return NOTIF_VIEWED_KEY + String(n.getFullYear()) + '-' + String(n.getMonth() + 1).padStart(2, '0');
}

function _notifGetViewedDates() {
    try { return JSON.parse(localStorage.getItem(_notifViewedSetKey())) || []; }
    catch(e) { return []; }
}

function _notifMarkRecordViewed(dateStr) {
    var viewed = _notifGetViewedDates();
    if (viewed.indexOf(dateStr) === -1) {
        viewed.push(dateStr);
        localStorage.setItem(_notifViewedSetKey(), JSON.stringify(viewed));
    }
}

function _notifIsRecordViewed(dateStr) {
    return _notifGetViewedDates().indexOf(dateStr) !== -1;
}

/** လက်ရှိ YYYY-MM */
function _notifCurrentYM() {
    var n = new Date();
    return String(n.getFullYear()) + '-' + String(n.getMonth() + 1).padStart(2, '0');
}

/** ဒီ month ရဲ့ total records count */
function _notifTotalCount() {
    var n = new Date();
    var y = String(n.getFullYear());
    var m = String(n.getMonth() + 1).padStart(2, '0');
    var recs = window.getRecords ? window.getRecords() : [];
    return recs.filter(function(r) {
        return String(r.month).padStart(2,'0') === m && (r.year || y) === y;
    }).length;
}

/** Last read count ယူ (ယခင် month ဆိုရင် 0 ပြန်ပေး — auto clear) */
function _notifReadCount() {
    var ym  = _notifCurrentYM();
    var raw = localStorage.getItem(NOTIF_READ_KEY + ym);
    return raw ? parseInt(raw) || 0 : 0;
}

/** Panel ပိတ်တာနဲ့ read count = total count သိမ်း */
function _notifMarkRead() {
    var ym    = _notifCurrentYM();
    var total = _notifTotalCount();
    localStorage.setItem(NOTIF_READ_KEY + ym, String(total));
    // ယခင် month key တွေ clean up
    Object.keys(localStorage).forEach(function(k) {
        if (k.indexOf('notif_read_') === 0 && k !== NOTIF_READ_KEY + ym) {
            localStorage.removeItem(k);
        }
    });
}

/** Unread count = total records that have NOT been individually viewed */
function _notifUnreadCount() {
    var n = new Date();
    var y = String(n.getFullYear());
    var m = String(n.getMonth() + 1).padStart(2, '0');
    var recs = window.getRecords ? window.getRecords() : [];
    var monthRecs = recs.filter(function(r) {
        return String(r.month).padStart(2,'0') === m && (r.year || y) === y;
    });
    var viewed = _notifGetViewedDates();
    var unread = monthRecs.filter(function(r) {
        return viewed.indexOf(String(r.date).padStart(2,'0')) === -1;
    }).length;
    console.log('[notif-badge] current y-m:', y + '-' + m, '| records this month:', monthRecs.length, '| viewed dates:', viewed, '| unread:', unread);
    return unread > 0 ? unread : 0;
}

/** Badge DOM update */
window.patchNotifBadge = function() {
    var btn = document.getElementById('app-notif-btn');
    if (!btn) return;

    var oldBadge = btn.querySelector('.notif-badge');
    if (oldBadge) oldBadge.remove();

    var unread = _notifUnreadCount();
    if (unread > 0) {
        var badge = document.createElement('span');
        badge.className = 'notif-badge';
        badge.style.cssText = [
            'position:absolute;top:0px;right:0px;',
            'min-width:16px;height:16px;',
            'background:#e53e3e;color:#fff;',
            'border-radius:8px;border:1.5px solid #fff;',
            'font-size:9px;font-weight:700;line-height:1;',
            'display:flex;align-items:center;justify-content:center;',
            'padding:0 3px;pointer-events:none;'
        ].join('');
        badge.textContent = unread > 99 ? '99+' : String(unread);
        btn.appendChild(badge);
    }
};

/**
 * 🔔 Daily Detail Panel — လက်ရှိ month records အားလုံး card ပြမည်
 */
window.showDailyDetailPanel = function() {
    var old = document.getElementById('notif-panel-overlay');
    if (old) { old.remove(); return; }

    var now    = new Date();
    var todayY = String(now.getFullYear());
    var todayM = String(now.getMonth() + 1).padStart(2, '0');
    var todayD = String(now.getDate()).padStart(2, '0');

    var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // ── လက်ရှိ month records အားလုံး၊ date ကြီးစဉ်အလိုက် sort ──
    var allRecs  = window.getRecords ? window.getRecords() : [];
    var monthRecs = allRecs.filter(function(r) {
        return String(r.month).padStart(2,'0') === todayM && (r.year || todayY) === todayY;
    }).sort(function(a, b) { return parseInt(b.date) - parseInt(a.date); }); // နောက်ဆုံးနှစ်ဆုံး

    // ── helpers ──
    function calcW(wh, ph, note) {
        var w = parseFloat(wh) || 0, p = parseFloat(ph) || 0;
        if (note === 'sunday_ot')          return (w * p * 2).toFixed(2);
        if (note === 'government_holiday') return (w * p).toFixed(2);
        if (note === 'sunday')             return '0.00';
        return (w * p).toFixed(2);
    }
    function calcOT(otIn, otOut, otPay) {
        if (!otIn || !otOut || !otPay) return '0.00';
        var ip = otIn.split(':').map(Number), op = otOut.split(':').map(Number);
        var im = ip[0]*60+ip[1], om = op[0]*60+op[1];
        if (om <= im) om += 1440;
        return ((om - im) / 60 * (parseFloat(otPay) || 0)).toFixed(2);
    }
    // Night Shift Allowance — record.js ရဲ့ window.calcRecordNSA logic အတိုင်း
    function calcNSA(workIn, nsaRate, note) {
        if (note === 'sunday') return '0.00';
        var rate = parseFloat(nsaRate) || 0;
        if (!rate) return '0.00';
        var hr = workIn ? parseInt(workIn.split(':')[0]) : NaN;
        return (hr >= 18 || hr < 6) ? rate.toFixed(2) : '0.00';
    }
    function shiftLabel(workIn) {
        if (!workIn) return '';
        var hr = parseInt(workIn.split(':')[0]);
        return (hr >= 18 || hr < 6)
            ? '<span style="background:#1e293b;color:#e2e8f0;font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;margin-left:6px;">🌙 ' + (window.t ? window.t('shift_night') || 'Night' : 'Night') + '</span>'
            : '<span style="background:#fef9c3;color:#92400e;font-size:10px;font-weight:600;padding:2px 7px;border-radius:4px;margin-left:6px;">☀️ ' + (window.t ? window.t('shift_day') || 'Day' : 'Day') + '</span>';
    }
    function noteLabel(note) {
        var map = {
            normal_ot:          window.t ? window.t('note_normal_ot')   || 'Normal OT'    : 'Normal OT',
            weekend_ot:         window.t ? window.t('note_weekend_ot')  || 'Weekend OT'   : 'Weekend OT',
            sunday_ot:          window.t ? window.t('note_sunday_ot')   || 'Sunday OT'    : 'Sunday OT',
            sunday:             window.t ? window.t('note_sunday')      || 'Sunday'       : 'Sunday',
            government_holiday: window.t ? window.t('note_gov_holiday') || 'Gov Holiday'  : 'Gov Holiday',
            holiday_ot:         window.t ? window.t('note_holiday_ot')  || 'Holiday OT'   : 'Holiday OT',
            night_shift:        window.t ? window.t('note_night_shift') || 'Night Shift'  : 'Night Shift',
            other:              window.t ? window.t('note_other')       || 'Other'        : 'Other'
        };
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
        var lbl   = map[note] || note || '—';
        var style = styleMap[note] || 'background:#f1f5f9;color:#475569;';
        return note
            ? '<span style="' + style + 'font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;">' + lbl + '</span>'
            : '<span style="color:#94a3b8;">—</span>';
    }

    // ── card per record (click only, no accordion) ──
    function buildCard(r, idx) {
        var isSunday = r.note === 'sunday';
        var dd       = String(r.date).padStart(2,'0');
        var wage     = calcW(r.workHour, r.perHour, r.note);
        var ot       = (r.note === 'government_holiday' || r.note === 'sunday_ot' || isSunday)
                        ? '0.00' : calcOT(r.otIn, r.otOut, r.otPay);
        var nsa      = isSunday ? '0.00' : calcNSA(r.workIn, r.nsa, r.note);
        var total    = isSunday ? '—' : (parseFloat(wage) + parseFloat(ot) + parseFloat(nsa)).toFixed(2);
        var isToday  = dd === todayD;
        var dateText = dd + ' ' + monthNames[parseInt(todayM)-1] + ' ' + todayY;

        var isViewed = _notifIsRecordViewed(dd);

        // Unviewed → highlight style; Viewed → normal style
        var cardBg     = isViewed ? '#ffffff'                    : '#eef6ff';
        var cardBorder = isViewed ? '1px solid #f0f4f8'          : '1.5px solid #3b82f6';
        var cardShadow = isViewed ? '0 2px 8px rgba(0,0,0,0.06)': '0 2px 12px rgba(59,130,246,0.15)';

        var unviewedDot = isViewed
            ? ''
            : '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;'
              + 'background:#3b82f6;margin-right:5px;flex-shrink:0;vertical-align:middle;"></span>';

        var todayBadge = isToday
            ? '<span style="font-size:9px;background:#e53e3e;color:#fff;border-radius:4px;padding:1px 5px;margin-left:5px;font-weight:700;vertical-align:middle;">Today</span>'
            : '';

        var arrowColor = isViewed ? '#cbd5e0' : '#3b82f6';
        var arrowIcon  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="' + arrowColor + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="9 18 15 12 9 6"></polyline></svg>';

        return '<div class="notif-card-header" data-idx="' + idx + '" data-dd="' + dd + '" '
            + 'style="background:' + cardBg + ';border-radius:14px;margin-bottom:10px;'
            + 'box-shadow:' + cardShadow + ';border:' + cardBorder + ';'
            + 'display:flex;justify-content:space-between;align-items:center;'
            + 'padding:13px 16px;cursor:pointer;-webkit-tap-highlight-color:transparent;gap:8px;">'
            +   '<div style="display:flex;flex-direction:column;gap:3px;flex:1;min-width:0;">'
            +     '<div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;">'
            +       unviewedDot
            +       '<span style="font-size:13px;font-weight:700;color:#1a202c;">' + dateText + '</span>'
            +       todayBadge
            +       (isSunday ? '' : shiftLabel(r.workIn))
            +     '</div>'
            +     '<div style="display:flex;align-items:center;gap:6px;margin-top:1px;">'
            +       noteLabel(r.note)
            +       '<span style="font-size:11px;color:#94a3b8;">' + (isSunday ? '—' : 'Total: ' + total) + '</span>'
            +     '</div>'
            +   '</div>'
            +   arrowIcon
            + '</div>';
    }

    var titleText = window.t ? (window.t('dash_daily_detail') || 'Daily Detail') : 'Daily Detail';
    var subTitle  = monthNames[parseInt(todayM)-1] + ' ' + todayY
                    + ' · ' + monthRecs.length + ' record' + (monthRecs.length !== 1 ? 's' : '');

    var overlay = document.createElement('div');
    overlay.id  = 'notif-panel-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:8500;background:#fff;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;';

    overlay.innerHTML =
        '<div class="sub-head">'
        +   '<div class="head-nav dark-mode cp-head-nav">'
        +     '<button id="notif-panel-back" class="back-btn cp-back-btn" style="-webkit-tap-highlight-color:transparent;">'
        +       '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><polyline points="15 18 9 12 15 6"></polyline></svg>'
        +     '</button>'
        +     '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;">'
        +       '<div class="head-title cp-head-title" style="margin:0;">' + titleText + '</div>'
        +       '<div style="font-size:11px;color:rgba(255,255,255,0.65);margin-top:2px;">' + subTitle + '</div>'
        +     '</div>'
        +     '<div style="width:44px;"></div>'
        +   '</div>'
        + '</div>'
        + '<div class="sub-body" style="flex:1;overflow-y:auto;padding:16px 14px 32px;background:#f0f4f8;">'
        +   (monthRecs.length === 0
              ? '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60%;gap:12px;color:#94a3b8;">'
              +   '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e0" stroke-width="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>'
              +   '<p style="font-size:14px;margin:0;">' + (window.t ? window.t('no_data') || 'No records' : 'No records') + '</p>'
              + '</div>'
              : monthRecs.map(function(r, i) { return buildCard(r, i); }).join('')
            )
        + '</div>'
        + '<style>@keyframes notifSubIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}#notif-panel-overlay{animation:notifSubIn 0.2s ease-out;}'
        + '@keyframes notifSubOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(30px)}}</style>';

    document.body.appendChild(overlay);
    document.getElementById('notif-panel-back').addEventListener('click', function() {
        _notifMarkRead();
        window.patchNotifBadge();
        overlay.remove();
    });

    // ── card click — event delegation ──
    overlay.addEventListener('click', function(e) {
        var hdr = e.target.closest('.notif-card-header');
        if (!hdr) return;

        var idx = parseInt(hdr.dataset.idx);
        var rec = monthRecs[idx];
        if (!rec) return;

        var pinSaved    = localStorage.getItem('app_pin');
        var pinVerified = sessionStorage.getItem('pin_verified') === '1';

        function openDetail() {
            // Mark as viewed & update card style immediately
            var dd = hdr.dataset.dd;
            _notifMarkRecordViewed(dd);
            hdr.style.background    = '#ffffff';
            hdr.style.border        = '1px solid #f0f4f8';
            hdr.style.boxShadow     = '0 2px 8px rgba(0,0,0,0.06)';
            // Remove blue dot
            var dot = hdr.querySelector('span[style*="border-radius:50%"]');
            if (dot) dot.remove();
            // Reset arrow color
            var arrow = hdr.querySelector('svg');
            if (arrow) arrow.setAttribute('stroke', '#cbd5e0');
            // Update badge
            window.patchNotifBadge();

            showRecordDetail(rec);
        }

        if (pinSaved && !pinVerified && typeof window.showPinScreen === 'function') {
            var existingGate = document.getElementById('pin-gate-root');
            if (!existingGate) {
                var gate = document.createElement('div');
                gate.id = 'pin-gate-root';
                gate.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9000;background:#fff;';
                document.body.appendChild(gate);
            }
            window.showPinScreen('verify', function() {
                var gate = document.getElementById('pin-gate-root');
                if (gate) gate.remove();
                sessionStorage.setItem('pin_verified', '1');
                openDetail();
            });
        } else {
            openDetail();
        }
    });

    // ── detail sub layout ──
    function showRecordDetail(r) {
        var isSunday = r.note === 'sunday';
        var dd       = String(r.date).padStart(2, '0');
        var dateText = dd + ' ' + monthNames[parseInt(todayM)-1] + ' ' + todayY;
        var wage     = calcW(r.workHour, r.perHour, r.note);
        var ot       = (r.note === 'government_holiday' || r.note === 'sunday_ot' || isSunday)
                        ? '0.00' : calcOT(r.otIn, r.otOut, r.otPay);
        var nsa      = isSunday ? '0.00' : calcNSA(r.workIn, r.nsa, r.note);
        var total    = isSunday ? '—' : (parseFloat(wage) + parseFloat(ot) + parseFloat(nsa)).toFixed(2);
        var wInOut   = isSunday ? '—' : (r.workIn ? r.workIn + ' – ' + (r.workOut || '?') : '—');
        var otInOut  = isSunday ? '—' : (r.otIn   ? r.otIn  + ' – ' + (r.otOut  || '?')  : '—');
        var otPayVal = isSunday ? '—' : (r.otPay  ? r.otPay : '—');

        function drow(label, value) {
            return '<div style="display:flex;justify-content:space-between;align-items:center;'
                 + 'padding:14px 0;border-bottom:1px solid #f1f5f9;">'
                 + '<span style="font-size:14px;color:#64748b;">' + label + '</span>'
                 + '<span style="font-size:14px;font-weight:600;color:#1a202c;">' + value + '</span>'
                 + '</div>';
        }

        var det = document.createElement('div');
        det.id  = 'notif-detail-overlay';
        det.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:8600;'
                          + 'background:#fff;display:flex;flex-direction:column;'
                          + 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;'
                          + 'animation:notifSubIn 0.2s ease-out;';

        det.innerHTML =
            '<div class="sub-head">'
            +   '<div class="head-nav dark-mode" style="height:65px;border-radius:0 0 16px 16px;">'
            +     '<button id="notif-detail-back" class="back-btn" style="-webkit-tap-highlight-color:transparent;">'
            +       '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff"'
            +       ' stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">'
            +       '<polyline points="15 18 9 12 15 6"></polyline></svg>'
            +     '</button>'
            +     '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;">'
            +       '<div style="font-size:17px;font-weight:700;color:#fff;">' + dateText + '</div>'
            +       '<div style="font-size:11px;color:rgba(255,255,255,0.65);margin-top:2px;">' + noteLabel(r.note) + '</div>'
            +     '</div>'
            +     '<div style="width:44px;"></div>'
            +   '</div>'
            + '</div>'
            + '<div style="flex:1;overflow-y:auto;padding:20px 16px 40px;">'
            +   drow(window.t ? window.t('rec_work_in')  || 'Work In/Out' : 'Work In/Out',  wInOut)
            +   drow(window.t ? window.t('rec_ot_in')    || 'OT In/Out'   : 'OT In/Out',    otInOut)
            +   drow(window.t ? window.t('rec_work_hr')  || 'Work hr'     : 'Work hr',      isSunday ? '—' : (r.workHour || '—'))
            +   drow(window.t ? window.t('rec_per_hr')   || 'Hourly Wage' : 'Hourly Wage',  isSunday ? '—' : (r.perHour  || '—'))
            +   drow(window.t ? window.t('rec_ot_pay_hr')   || 'Hourly OT'   : 'Hourly OT',   otPayVal)
            +   drow(window.t ? window.t('wc_night_allowance') || 'Night Shift Allowance' : 'Night Shift Allowance', isSunday ? '—' : (r.nsa || '—'))
            +   drow('Wage',  isSunday ? '—' : wage)
            +   drow('OT',    isSunday ? '—' : ot)
            +   drow(window.t ? window.t('rec_nsa_abbr') || 'NSA' : 'NSA', isSunday ? '—' : nsa)
            +   '<div style="display:flex;justify-content:space-between;align-items:center;padding:16px 0;">'
            +     '<span style="font-size:15px;font-weight:700;color:#1a202c;">Total</span>'
            +     '<span style="font-size:16px;font-weight:800;color:#10b981;">' + total + '</span>'
            +   '</div>'
            +   (r.remark ? '<div style="margin-top:8px;padding:12px 14px;background:#f8fafc;border-radius:10px;'
            +     'font-size:13px;color:#475569;">' + r.remark + '</div>' : '')
            + '</div>';

        document.body.appendChild(det);

        document.getElementById('notif-detail-back').addEventListener('click', function() {
            det.style.animation = 'notifSubOut 0.18s ease-in forwards';
            setTimeout(function() {
                det.remove();
            }, 180);
        });
    }
};

/**
 * 📍 Exit Dialog
 */
window.showExitConfirmationDialog = function() {
    const oldDialog = document.getElementById('custom-exit-dialog-overlay');
    if (oldDialog) oldDialog.remove();

    const titleText = window.t('exit_dialog_title') || 'Exit Application';
    const msgText = window.t('exit_dialog_msg') || 'Are you sure you want to exit?';
    const yesText = window.t('exit_dialog_yes') || 'Yes';
    const noText = window.t('exit_dialog_no') || 'No';

    const dialogOverlay = document.createElement('div');
    dialogOverlay.id = 'custom-exit-dialog-overlay';
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
                <button id="exit-dialog-cancel" class="dialog-btn dialog-btn-cancel">
                    <div class="dialog-icon dialog-icon-cancel">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </div>
                    <span class="dialog-btn-label">${noText}</span>
                </button>
                <button id="exit-dialog-confirm" class="dialog-btn dialog-btn-confirm">
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

    document.getElementById('exit-dialog-cancel').addEventListener('click', () => {
        dialogOverlay.remove();
    });

    document.getElementById('exit-dialog-confirm').addEventListener('click', () => {
        localStorage.removeItem('ot_active_tab');
        if (navigator.app && navigator.app.exitApp) {
            navigator.app.exitApp();
        } else if (window.close) {
            window.close();
        } else {
            dialogOverlay.remove();
            alert("App Exit triggered! (Platform exit signal sent)");
        }
    });
};

/**
 * 📍 Sub Layout open လုပ်ပေးသည့် Function
 */
window.openSubLayout = function(titleKey, renderBodyCallback) {
    const contentView = document.getElementById('content-view');
    const bottomNav = document.getElementById('main-bottom-nav');
    
    if (!contentView || !bottomNav) return;

    bottomNav.classList.add('hidden');
    contentView.classList.add('sub-layout-active');
    
    contentView.innerHTML = `
        <div class="head-nav">
            <button class="back-btn" id="sub-back-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>
            <div class="head-title">${window.t(titleKey)}</div>
        </div>
        <div class="view-body">
            ${renderBodyCallback()}
        </div>
        <style>
            @keyframes subSlideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
            @keyframes subSlideOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(30px)}}
        </style>
    `;

    // setting-personal.js ရဲ့ pattern အတိုင်း — Head Navigation ပါ view-body
    // နဲ့အတူ တစ်ပြိုင်နက်တည်း fade-in ဝင်ခိုင်းရန် (contentView ကိုယ်တိုင် ကို
    // animate လုပ်လိုက်တာမို့ .head-nav/.view-body နှစ်ခုလုံး တွဲပါသွားသည်)
    // — classList က call တိုင်း ဆက်ရှိနေတာမို့ reflow-trick ဖြင့် ပြန်ဆွဲပေးရသည်
    contentView.style.animation = 'none';
    void contentView.offsetWidth;
    contentView.style.animation = 'subSlideIn 0.2s ease-out';

    document.getElementById('sub-back-btn').addEventListener('click', () => {
        contentView.style.animation = 'subSlideOut 0.18s ease-in forwards';
        setTimeout(() => {
            contentView.style.animation = '';
            bottomNav.classList.remove('hidden', 'hide-nav');
            contentView.classList.remove('sub-layout-active');
            _loadTab._fromBack = true;
            _loadTab('setting');
        }, 180);
    });
};

// ==========================================
// 📍 PIN Gate — Internal Helpers
// ==========================================

/** Tab content တိုက်ရိုက် load လုပ်ပေးသည် */
function _loadTab(tabName) {
    const bottomNav = document.getElementById('main-bottom-nav');

    // sub-layout ရဲ့ back button ကနေ ခေါ်လာတာလား စစ်ဆေး (animation ကို
    // ဒီ case မှာသာ ပြစေရန် — tab bar ကို တိုက်ရိုက်နှိပ်တဲ့ switch မှာ မပြ)
    const fromBack = !!_loadTab._fromBack;
    _loadTab._fromBack = false;

    // pin gate ဖယ် — pin.js က slide-left animation ပြနေတုန်း ဆိုရင်
    // (window._skipGateRemoval) content ကို အောက်မှာ အရင်ပြောင်းချင်ပြီး
    // gate ကိုတော့ slide ပြီးမှသာ pin.js ကိုယ်တိုင် ဖယ်ပေးမှာမို့ ဒီမှာ မဖယ်သေးပါ
    const gateRoot = document.getElementById('pin-gate-root');
    if (gateRoot && !window._skipGateRemoval) gateRoot.remove();

    // sub-layout ဖြစ်နေရင် ဖယ်
    const contentView = document.getElementById('content-view');
    if (contentView) contentView.classList.remove('sub-layout-active');

    // nav show — _loadTabDirect ကနေ ခေါ်ရင် delay နဲ့ handle လုပ်ထားပြီ၊
    // တိုက်ရိုက် _loadTab ခေါ်တဲ့ case (switchTab, startup) ကိုသာ ဒီမှာ show
    if (!_loadTab._fromPin) {
        bottomNav.classList.remove('hidden', 'pre-hide', 'hide-nav');
    }
    _loadTab._fromPin = false;

    // nav active — CSS class တစ်ခုတည်းသုံး၊ inline style လုံးဝမသုံး
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
    if (activeItem) activeItem.classList.add('active');

    // app-container data-tab
    const appContainer = document.querySelector('.app-container');
    if (appContainer) appContainer.setAttribute('data-tab', tabName);

    // content render
    window.renderGlobalHeader(tabName);
    const targetBodyContainer = document.getElementById('dynamic-view-body');
    if (window.views[tabName] && targetBodyContainer) {
        window.views[tabName](targetBodyContainer);
    }

    // sub-layout ကနေ back နှိပ်ပြီး ပြန်ဝင်တဲ့အခါသာ head-nav/bottom-nav/
    // tab-body အားလုံး ညင်ညင်သာသာ slide-in ဝင်အောင် ပြ (reflow trick နဲ့
    // ခေါ်တိုင်း ပြန်ဆွဲစေရန်)
    if (fromBack) {
        const headerEl = document.querySelector('.custom-dashboard-header');
        window._playTabSlideIn([headerEl, bottomNav, targetBodyContainer]);
    }

    localStorage.setItem('ot_active_tab', tabName);
    sessionStorage.setItem('pin_verified', '1');
}

// pin.js မှ _loadTab တိုက်ရိုက်ခေါ်နိုင်ရန် expose
// PIN အောင်မြင်ပြီး pin-slide-down ပြီးတဲ့အချိန် (420ms) မှာသာ
// head-nav/bottom-nav/tab-body အားလုံး slide-down ဖြင့် အတူတကွ ပေါ်လာမယ်
window._loadTabDirect = function(tab) {
    const bottomNav = document.getElementById('main-bottom-nav');

    // Nav ကို ချက်ချင်း reveal (pin.js ကိုယ်တိုင် pin-slide-down 420ms
    // ပြီးမှသာ ဒီ function ကို ခေါ်တာမို့ ထပ်စောင့်စရာမလိုတော့ပါ)
    if (bottomNav) {
        bottomNav.style.transition = 'none';
        bottomNav.classList.remove('hidden', 'pre-hide', 'hide-nav');
        requestAnimationFrame(function() {
            bottomNav.style.transition = '';
        });
    }

    _loadTab._fromPin = true;
    _loadTab(tab);

    const headerEl = document.querySelector('.custom-dashboard-header');
    const bodyEl   = document.getElementById('dynamic-view-body');
    if (window._playNavSlideDown) window._playNavSlideDown([headerEl, bottomNav, bodyEl]);
};

/** PIN gate overlay ကို ပြပေးသည် */
function _showPinGate(mode, onSuccess) {
    const bottomNav = document.getElementById('main-bottom-nav');
    if (bottomNav) bottomNav.classList.add('hidden');

    let gateRoot = document.getElementById('pin-gate-root');
    if (!gateRoot) {
        gateRoot = document.createElement('div');
        gateRoot.id = 'pin-gate-root';
        gateRoot.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100vh;z-index:9000;background:#fff;display:flex;flex-direction:column;';
        document.body.appendChild(gateRoot);
    }

    if (typeof window.showPinScreen === 'function') {
        window.showPinScreen(mode, onSuccess);
    }
}

// ==========================================
// 📍 switchTab — PIN Gate ပါသော Tab Switch
// ==========================================
window.switchTab = function(tabName) {
    const bottomNav = document.getElementById('main-bottom-nav');
    const contentView = document.getElementById('content-view');

    if (!bottomNav || !contentView) return;

    // home tab — PIN gate မလိုဘူး
    if (tabName === 'home') {
        _loadTab(tabName);
        return;
    }

    // session မှာ unlock ရှိပြီးသားဆိုရင် တိုက်ရိုက်ဖွင့်
    if (sessionStorage.getItem('pin_unlocked') === '1') {
        _loadTab(tabName);
        return;
    }

    // PIN မရှိသေး — Welcome layout ပြပြီးမှ PIN create flow
    if (!localStorage.getItem('app_pin')) {
        const bottomNav = document.getElementById('main-bottom-nav');
        if (bottomNav) bottomNav.classList.add('hidden');

        let gateRoot = document.getElementById('pin-gate-root');
        if (!gateRoot) {
            gateRoot = document.createElement('div');
            gateRoot.id = 'pin-gate-root';
            gateRoot.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100vh;z-index:9000;background:#fff;display:flex;flex-direction:column;';
            document.body.appendChild(gateRoot);
        }

        const goToPinCreate = function() {
            if (typeof window.showPinScreen === 'function') {
                window.showPinScreen('create', function() {
                    sessionStorage.setItem('pin_unlocked', '1');
                    _loadTabDirect(tabName);
                });
            }
        };

        if (typeof window.showWelcomeScreen === 'function') {
            window.showWelcomeScreen(goToPinCreate);
        } else {
            // welcome.js မ load ရသေးရင် PIN create ကို တိုက်ရိုက်ဆက်
            goToPinCreate();
        }
        return;
    }

    // PIN ရှိပြီ — verify
    _showPinGate('verify', function() {
        sessionStorage.setItem('pin_unlocked', '1');
        _loadTabDirect(tabName);
    });
};

// ==========================================
// ၃။ App Lifecycle (စတင်ပွင့်ချိန် လုပ်ဆောင်ချက်)
// ==========================================
// ── Privacy Screen (Security setting) ────────────────────────────────
// App ကို background ကို ပို့လိုက်ရင် (recent-apps preview) wage data
// မမြင်ရအောင် overlay တစ်ခု ချက်ချင်းဖုံးပေးမည် — Security page ရဲ့
// "Privacy Screen" toggle ဖြင့် on/off ချိန်ညှိနိုင်သည် (default: ON)
(function() {
    var privacyOverlay = null;
    function ensurePrivacyOverlay() {
        if (privacyOverlay) return privacyOverlay;
        privacyOverlay = document.createElement('div');
        privacyOverlay.id = 'privacy-screen-overlay';
        privacyOverlay.style.cssText =
            'position:fixed;inset:0;z-index:999999;background:#1a4e8f;' +
            'display:none;align-items:center;justify-content:center;' +
            'flex-direction:column;gap:12px;';
        privacyOverlay.innerHTML =
            '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>' +
                '<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' +
            '</svg>' +
            '<span style="color:#fff;font-size:14px;font-weight:600;">Overtime Tracker</span>';
        document.body.appendChild(privacyOverlay);
        return privacyOverlay;
    }
    document.addEventListener('visibilitychange', function() {
        var enabled = localStorage.getItem('privacy_screen_enabled') !== '0'; // default ON
        if (!enabled) return;
        var ov = ensurePrivacyOverlay();
        ov.style.display = document.visibilityState === 'hidden' ? 'flex' : 'none';
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    const navItems = document.querySelectorAll('.nav-item');

    // PIN screen flash မဖြစ်အောင် bottom nav ကို transition မပါဘဲ ချက်ချင်း hide
    const bottomNavEl = document.getElementById('main-bottom-nav');
    if (bottomNavEl) bottomNavEl.classList.add('pre-hide', 'hidden');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            window.switchTab(item.getAttribute('data-tab'));
        });
    });

    window.renderI18nLabels();

    // Startup logic:
    // - sessionStorage 'app_session' ရှိ = refresh → saved tab ဆက်ပြ
    // - မရှိ = fresh open (exit ပြီး ပြန်ဝင်) → home ပဲပြ
    const isRefresh = sessionStorage.getItem('app_session') === '1';
    sessionStorage.setItem('app_session', '1');

    if (isRefresh) {
        const savedTab = localStorage.getItem('ot_active_tab') || 'home';
        // home ကို အရင် pre-load မလုပ်တော့ — savedTab ဟာ PIN လိုအပ်တဲ့
        // tab ဆိုရင် home ခဏပေါ်ပြီးမှ PIN gate လာတာကို ရှောင်ရန်
        window.switchTab(savedTab);
    } else {
        // Fresh open — home ပဲပြ
        _loadTab('home');
    }
});

// ==========================================
// ၄။ 📸 Profile Photo — Upload, Compress & Persist
// ==========================================

window.compressProfileImage = function(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const MAX = 300;
            let w = img.width, h = img.height;
            if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
            else       { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }

            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');

            ctx.beginPath();
            ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(img, 0, 0, w, h);

            callback(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

window.getProfilePhoto = function() {
    return localStorage.getItem('ot_profile_photo') || null;
};

window.saveProfilePhoto = function(base64) {
    localStorage.setItem('ot_profile_photo', base64);
};

window.patchProfileAvatar = function() {
    const wrapper = document.querySelector('.profile-avatar-wrap');
    if (!wrapper) return;

    const photo = window.getProfilePhoto();
    if (photo) {
        wrapper.innerHTML = `<img id="profile-avatar-img"
            src="${photo}"
            class="profile-avatar-img"
            alt="profile">`;
    } else {
        wrapper.id = 'profile-avatar-img';
    }

    let fileInput = document.getElementById('profile-photo-input');
    if (!fileInput) {
        fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.id   = 'profile-photo-input';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);

        fileInput.addEventListener('change', function() {
            const file = this.files[0];
            if (!file) return;
            window.compressProfileImage(file, function(base64) {
                window.saveProfilePhoto(base64);
                window.patchProfileAvatar();
            });
            this.value = '';
        });
    }

    const trigger = document.getElementById('profile-avatar-img') || wrapper;
    trigger.addEventListener('click', () => fileInput.click());
};

// renderGlobalHeader ကို monkey-patch
(function() {
    const _original = window.renderGlobalHeader;
    window.renderGlobalHeader = function(tabName) {
        _original(tabName);
        window.patchProfileAvatar();
        window.patchNotifBadge();
    };
})();

// ==========================================
// 📍 Hardware / Gesture Back Button Trap
// ==========================================
// Apk (WebView wrapper — Median/GoNative/AppMySite စသည်) ထဲမှာ back
// လုပ်တိုင်း webView.canGoBack() ကို native ကနေ စစ်ပြီး history မရှိရင်
// activity ကို ချက်ချင်း finish() ခေါ်ပစ်လိုက်တာမို့ (app တစ်ခုလုံးထွက်)
// — history.pushState/popstate ဖြင့် "guard" state တစ်ခု အမြဲရှိနေအောင်
// ထားပြီး၊ ဒီ popstate event ကိုသာ ကျွန်တော်တို့ကိုယ်တိုင် ကိုင်တွယ်မည်
// (sub-layout ဆိုရင် back ကို sub-back-btn ဆီပို့၊ main tab ဆိုရင် exit
// dialog ပြ)
(function initBackButtonTrap() {
    function pushGuard() {
        history.pushState({ potBackGuard: true }, '', location.href);
    }
    pushGuard(); // boot အချိန်မှာ တစ်ခါ prime လုပ်

    window.addEventListener('popstate', function () {
        pushGuard(); // trap ကို ချက်ချင်း ပြန် re-arm (နောက် back တစ်ခါအတွက်)

        // 1) exit dialog ပွင့်နေရင် ပိတ်လိုက် (No ကိုနှိပ်သလို)
        const exitDialog = document.getElementById('custom-exit-dialog-overlay');
        if (exitDialog) { exitDialog.remove(); return; }

        // 2) sub-layout ထဲမှာနေရင် sub-back-btn ကို trigger လုပ် (app မထွက်)
        const contentView = document.getElementById('content-view');
        if (contentView && contentView.classList.contains('sub-layout-active')) {
            const backBtn = document.getElementById('sub-back-btn');
            if (backBtn) { backBtn.click(); return; }
        }

        // 3) main tab ပေါ်ရောက်နေမှသာ exit dialog ပြ
        if (window.showExitConfirmationDialog) window.showExitConfirmationDialog();
    });
})();
;