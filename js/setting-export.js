// ==========================================
// setting-export.js — Export Data
// ==========================================
(function() {

function applyDarkHeadNav()  { window._settingHelpers?.applyDarkHeadNav(); }
function removeDarkHeadNav() { window._settingHelpers?.removeDarkHeadNav(); }
function replaceBackBtnSvg() { window._settingHelpers?.replaceBackBtnSvg(); }

function openExportSubLayout() {
    if (typeof window.openSubLayout !== 'function') return;

    window.openSubLayout(window.t('export_title'), function() {
        return `
            <div class="sub-body export-sub-wrap">
                <div class="export-card" id="export-pdf-btn">
                    <div class="export-card-icon export-icon-pdf">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </div>
                    <div class="export-card-text">
                        <span class="export-card-title">${window.t('export_pdf_title')}</span>
                        <span class="export-card-sub">${window.t('export_pdf_sub')}</span>
                    </div>
                </div>

                <div class="export-card" id="export-excel-btn">
                    <div class="export-card-icon export-icon-excel">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="3" y1="15" x2="21" y2="15"></line>
                            <line x1="9" y1="9" x2="9" y2="21"></line>
                            <line x1="15" y1="9" x2="15" y2="21"></line>
                        </svg>
                    </div>
                    <div class="export-card-text">
                        <span class="export-card-title">${window.t('export_excel_title')}</span>
                        <span class="export-card-sub">${window.t('export_excel_sub')}</span>
                    </div>
                </div>

                <p class="export-note">${window.t('export_note')}</p>
            </div>`;
    });

    replaceBackBtnSvg();
    applyDarkHeadNav();
    const backBtn = document.getElementById('sub-back-btn')
        || document.querySelector('.sub-layout .back-btn')
        || document.querySelector('.head-nav .back-btn');
    backBtn?.addEventListener('click', removeDarkHeadNav, { once: true });

    // home.js ရဲ့ working export logic ကိုပဲ ပြန်သုံးထားသည် — Coming Soon stub
    // အစား Sub-layout detail/preview view ဖွင့်ပြီးမှ Head Nav ရဲ့ download icon
    // ကို နှိပ်မှသာ download ဖြစ်စေရန်
    document.getElementById('export-pdf-btn')?.addEventListener('click', function() { openExportDetailView('pdf'); });
    document.getElementById('export-excel-btn')?.addEventListener('click', function() { openExportDetailView('excel'); });
}

// ── Export Detail/Preview View ──────────────────────────────────
// Month/Year ရွေးပြီး ဒီလ record တွေရဲ့ Wage/OT/NSA/Total preview ကို
// ကြည့်ရှုနိုင်ပြီး Head Nav ရဲ့ download icon ကို နှိပ်မှသာ
// PDF/Excel file ကို တကယ် download ချမည်
function openExportDetailView(type, viewYear, viewMonth, fromHome) {
    if (typeof window.openSubLayout !== 'function') return;

    var now      = new Date();
    var year     = viewYear  || String(now.getFullYear());
    var month    = viewMonth || String(now.getMonth() + 1).padStart(2, '0');
    var isEn     = window.currentLang !== 'th';
    var monEN    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var monTH    = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    var mLabel   = (isEn ? monEN : monTH)[parseInt(month) - 1];

    var allRecords = typeof window.getRecords === 'function' ? window.getRecords() : [];
    var records = allRecords.filter(function(r) {
        return String(r.month).padStart(2,'0') === month && (r.year || String(now.getFullYear())) === year;
    }).sort(function(a,b) { return parseInt(a.date) - parseInt(b.date); });

    var canCalc = typeof window.calcRecordWage === 'function'
        && typeof window.calcRecordOtTotal === 'function'
        && typeof window.calcRecordNSA === 'function';

    var grandTotal = 0;
    var rowData = [];
    var rowsHTML = records.map(function(r) {
        var isSunday = r.note === 'sunday';
        var wage  = canCalc ? window.calcRecordWage(r.workHour, r.perHour, r.note) : '0.00';
        var ot    = (!canCalc || r.note === 'government_holiday' || r.note === 'sunday_ot' || isSunday) ? '0.00' : window.calcRecordOtTotal(r.otIn, r.otOut, r.otPay);
        var nsa   = (!canCalc || isSunday) ? '0.00' : window.calcRecordNSA(r.workIn, r.nsa, r.note);
        var total = isSunday ? 0 : (parseFloat(wage) + parseFloat(ot) + parseFloat(nsa));
        grandTotal += total;
        rowData.push({ date: r.date, wage: parseFloat(wage), ot: parseFloat(ot), nsa: parseFloat(nsa), total: total });
        return '<div class="export-preview-row">' +
            '<span class="epr-date">' + r.date + '</span>' +
            '<span class="epr-wage">' + parseFloat(wage).toFixed(2) + '</span>' +
            '<span class="epr-ot">' + parseFloat(ot).toFixed(2) + '</span>' +
            '<span class="epr-nsa">' + parseFloat(nsa).toFixed(2) + '</span>' +
            '<span class="epr-total">' + total.toFixed(2) + '</span>' +
        '</div>';
    }).join('');

    var title = type === 'pdf' ? window.t('export_pdf_title') : window.t('export_excel_title');

    window.openSubLayout(title, function() {
        return '<div class="export-detail-fade">' +
        '<div class="sub-body export-detail-wrap">' +
            '<div class="export-detail-month-bar">' +
                '<button id="export-detail-prev" class="export-detail-arrow">‹</button>' +
                '<span>' + mLabel + ' ' + year + '</span>' +
                '<button id="export-detail-next" class="export-detail-arrow">›</button>' +
            '</div>' +
            '<div class="export-detail-total-card">' +
                '<span class="edt-lbl">' + (window.t('export_grand_total') || 'Grand Total') + '</span>' +
                '<span class="edt-val">฿' + grandTotal.toFixed(2) + '</span>' +
            '</div>' +
            '<div class="export-detail-table">' +
                '<div class="export-preview-row export-preview-head">' +
                    '<span>' + (window.t('export_col_date') || 'Date') + '</span>' +
                    '<span>' + (window.t('export_col_wage') || 'Wage') + '</span>' +
                    '<span>' + (window.t('export_col_ot') || 'OT') + '</span>' +
                    '<span>NSA</span>' +
                    '<span>' + (window.t('export_col_total') || 'Total') + '</span>' +
                '</div>' +
                (rowsHTML || '<p class="export-detail-empty">' + (window.t('export_no_records') || 'No records this month') + '</p>') +
            '</div>' +
            (records.length > 0
                ? '<button id="export-save-slip-btn" class="export-save-slip-btn">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>' +
                    '<span>' + (window.t('export_save_slip') || 'Save to Slip Album') + '</span>' +
                  '</button>'
                : '') +
        '</div>' +
        '</div>' +
        '<style>' +
            '@keyframes exportDetailIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}' +
            '.export-detail-fade{animation:exportDetailIn 0.2s ease-out;}' +
            '@keyframes exportDetailOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(30px)}}' +
            '.export-detail-month-bar{display:flex;align-items:center;justify-content:center;gap:16px;padding:14px 0;font-size:14px;font-weight:700;color:#1a202c;}' +
            '.export-detail-arrow{background:none;border:none;font-size:22px;font-weight:700;color:#1a4e8f;padding:0 10px;cursor:pointer;line-height:1;}' +
            '.export-save-slip-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:calc(100% - 32px);margin:16px 16px 20px;padding:13px;border:none;border-radius:12px;background:#1a4e8f;color:#fff;font-size:13.5px;font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent;}' +
            '.export-detail-total-card{margin:0 16px 14px;background:#1a4e8f;border-radius:14px;padding:16px 18px;display:flex;justify-content:space-between;align-items:center;}' +
            '.edt-lbl{color:rgba(255,255,255,0.7);font-size:12px;font-weight:600;}' +
            '.edt-val{color:#fff;font-size:20px;font-weight:800;}' +
            '.export-detail-table{margin:0 16px;}' +
            '.export-preview-row{display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;gap:4px;padding:9px 4px;font-size:11px;color:#2d3748;border-bottom:1px solid #edf2f7;text-align:right;}' +
            '.export-preview-row span:first-child{text-align:left;}' +
            '.export-preview-head{font-weight:700;color:#a0aec0;font-size:9.5px;text-transform:uppercase;border-bottom:1.5px solid #e2e8f0;}' +
            '.export-detail-empty{text-align:center;color:#a0aec0;font-size:13px;padding:24px 0;}' +
        '</style>';
    });

    replaceBackBtnSvg();
    applyDarkHeadNav();

    // ── Head Nav ရဲ့ ညာဘက်ခြမ်းမှာ Download icon ထည့်မည် ──
    var headNav = document.querySelector('.head-nav');
    if (headNav) {
        var dlBtn = document.createElement('button');
        dlBtn.id = 'export-detail-download-btn';
        dlBtn.setAttribute('aria-label', 'download');
        dlBtn.style.cssText = 'background:none;border:none;margin-left:auto;padding:6px;cursor:pointer;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;';
        dlBtn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>' +
            '<polyline points="7 10 12 15 17 10"></polyline>' +
            '<line x1="12" y1="15" x2="12" y2="3"></line>' +
        '</svg>';
        headNav.appendChild(dlBtn);
        dlBtn.addEventListener('click', function() {
            if (typeof window._runExport !== 'function') {
                window.showToast?.(window.t('export_not_ready') || 'Please open the Home tab once, then try again.');
                return;
            }
            var doTheExport = function() { window._runExport(type, year, month); };
            if (typeof window.withPin === 'function') { window.withPin(doTheExport); } else { doTheExport(); }
        });
    }

    // ── Month switcher — animation မလို (ဒီ view ကိုယ်တိုင် ပြန်ခေါ်ရုံ) ──
    document.getElementById('export-detail-prev')?.addEventListener('click', function() {
        var m = parseInt(month) - 1, y = parseInt(year);
        if (m < 1) { m = 12; y--; }
        openExportDetailView(type, String(y), String(m).padStart(2,'0'), fromHome);
    });
    document.getElementById('export-detail-next')?.addEventListener('click', function() {
        var m = parseInt(month) + 1, y = parseInt(year);
        if (m > 12) { m = 1; y++; }
        openExportDetailView(type, String(y), String(m).padStart(2,'0'), fromHome);
    });

    // ── Back button — Home ကနေ ဖွင့်ခဲ့ရင် Home tab ကိုပြန်၊ Settings ကနေ
    // ဖွင့်ခဲ့ရင် Export list page ကို ပြန်သွားရန် (default listener ဖယ်ရှား) ──
    var backBtn = document.getElementById('sub-back-btn')
        || document.querySelector('.sub-layout .back-btn')
        || document.querySelector('.head-nav .back-btn');
    if (backBtn) {
        var freshBackBtn = backBtn.cloneNode(true);
        backBtn.parentNode.replaceChild(freshBackBtn, backBtn);
        freshBackBtn.addEventListener('click', function() {
            var fadeEl = document.querySelector('.export-detail-fade');
            if (fadeEl) fadeEl.style.animation = 'exportDetailOut 0.18s ease-in forwards';
            setTimeout(function() {
                removeDarkHeadNav();
                if (fromHome) {
                    if (typeof window.switchTab === 'function') window.switchTab('home');
                } else {
                    openExportSubLayout();
                }
            }, 180);
        }, { once: true });
    }

    // ── Save to Slip Album ──
    document.getElementById('export-save-slip-btn')?.addEventListener('click', function() {
        var canvas = buildSlipCanvas(type, year, month, mLabel, rowData, grandTotal);
        var dataUrl = canvas.toDataURL('image/png');
        window.saveSlipToAlbum(year, month, type, dataUrl);
        window.showToast?.(window.t('export_slip_saved') || 'Saved to Slip Album');
    });
}

// home.js ရဲ့ Quick Actions ကလည်း ဒီ Sub-layout preview view တစ်ခုတည်းကိုပဲ
// ပြန်သုံးနိုင်အောင် window ပေါ် expose ထားသည်
window.openExportDetailView = openExportDetailView;

// ── Slip Canvas — payslip ပုံစံ image တစ်ခု ဆွဲထုတ်သည် ──
function buildSlipCanvas(type, year, month, mLabel, rowData, grandTotal) {
    var rowH = 32, headerH = 110, footerH = 56;
    var W = 600, H = headerH + Math.max(rowData.length, 1) * rowH + footerH + 20;
    var canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#1a4e8f';
    ctx.fillRect(0, 0, W, headerH - 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px -apple-system, sans-serif';
    ctx.fillText('Overtime Tracker', 26, 34);
    ctx.font = '13px -apple-system, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(mLabel + ' ' + year, 26, 54);
    ctx.fillText(type === 'pdf' ? 'Payslip Report' : 'Export Records', 26, 72);

    var cols = { date: 26, wage: 220, ot: 330, nsa: 430, total: 520 };
    var y = headerH + 4;
    ctx.fillStyle = '#f7f9fa';
    ctx.fillRect(0, y - 16, W, rowH);
    ctx.fillStyle = '#718096';
    ctx.font = 'bold 10px -apple-system, sans-serif';
    ['Date','Wage','OT','NSA','Total'].forEach(function(h, i) {
        ctx.fillText(h, [cols.date, cols.wage, cols.ot, cols.nsa, cols.total][i], y);
    });

    rowData.forEach(function(r, idx) {
        y += rowH;
        ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f7faff';
        ctx.fillRect(0, y - 20, W, rowH);
        ctx.fillStyle = '#1a202c';
        ctx.font = '12px -apple-system, sans-serif';
        ctx.fillText(String(r.date).padStart(2,'0') + ' ' + mLabel.slice(0,3), cols.date, y);
        ctx.fillText('฿' + r.wage.toFixed(2), cols.wage, y);
        ctx.fillText('฿' + r.ot.toFixed(2), cols.ot, y);
        ctx.fillText('฿' + r.nsa.toFixed(2), cols.nsa, y);
        ctx.font = 'bold 12px -apple-system, sans-serif';
        ctx.fillText('฿' + r.total.toFixed(2), cols.total, y);
    });
    if (rowData.length === 0) {
        y += rowH;
        ctx.fillStyle = '#a0aec0';
        ctx.font = '12px -apple-system, sans-serif';
        ctx.fillText(window.t('export_no_records') || 'No records this month', cols.date, y);
    }

    y += rowH;
    ctx.fillStyle = '#1a4e8f';
    ctx.fillRect(0, y - 20, W, rowH + 4);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px -apple-system, sans-serif';
    ctx.fillText(window.t('export_grand_total') || 'Grand Total', cols.date, y);
    ctx.fillText('฿' + grandTotal.toFixed(2), cols.total, y);

    ctx.fillStyle = '#a0aec0';
    ctx.font = '10px -apple-system, sans-serif';
    ctx.fillText((window.t('export_slip_generated') || 'Generated') + ': ' + new Date().toLocaleDateString(), 26, y + 30);

    return canvas;
}

// ── Slip Album storage (localStorage, month အလိုက် စုစည်းသိမ်းသည်) ──
// key: "YYYY-MM" → [{ id, type, createdAt, dataUrl }, ...]
// setting-application.js ရဲ့ Slip Album menu ကလည်း ဒီ helper တွေကိုပဲ ပြန်သုံးသည်
window.saveSlipToAlbum = function(year, month, type, dataUrl) {
    var key = year + '-' + month;
    var album = JSON.parse(localStorage.getItem('slip_album') || '{}');
    var list = album[key] || [];
    // လအတွက် type တူတဲ့ slip ဟောင်း ရှိရင် အသစ်နဲ့ အစားထိုးမည် (album ထဲ ပုံထပ်ကုံးမနေအောင်)
    list = list.filter(function(s) { return s.type !== type; });
    list.push({ id: Date.now(), type: type, createdAt: Date.now(), dataUrl: dataUrl });
    album[key] = list;
    localStorage.setItem('slip_album', JSON.stringify(album));
};
window.getSlipAlbumMonth = function(year, month) {
    var album = JSON.parse(localStorage.getItem('slip_album') || '{}');
    return album[year + '-' + month] || [];
};
window.deleteSlipFromAlbum = function(year, month, slipId) {
    var key = year + '-' + month;
    var album = JSON.parse(localStorage.getItem('slip_album') || '{}');
    if (!album[key]) return;
    album[key] = album[key].filter(function(s) { return s.id !== slipId; });
    if (album[key].length === 0) delete album[key];
    localStorage.setItem('slip_album', JSON.stringify(album));
};

window.openSettingExport = openExportSubLayout;

})();
