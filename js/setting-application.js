// ==========================================
// setting-application.js — Language + Holiday + Data entry
// Sub-layout animation pattern ကို record-menu.js ရဲ့ openRecSubLayout()
// (recSubIn/recSubOut) အတိုင်း တိုက်ရိုက်ကူးသုံးထားသည် — render callback
// ကထုတ်ပေးတဲ့ content ကို class-wrap လုပ်ပြီး <style> ထဲမှာ keyframe ကို
// embed လုပ်ထားလို့ render ဖြစ်တာနဲ့ entrance animation အလိုအလျောက် run
// သွားသည် (JS reflow-trick မလိုအပ်တော့ပါ)
// ==========================================
(function() {

function applyDarkHeadNav()  { window._settingHelpers?.applyDarkHeadNav(); }
function removeDarkHeadNav() { window._settingHelpers?.removeDarkHeadNav(); }
function replaceBackBtnSvg() { window._settingHelpers?.replaceBackBtnSvg(); }

function openLanguageSubLayout() {
    if (typeof window.openSubLayout !== 'function') return;
    const isEn = window.currentLang === 'en';
    const isTh = window.currentLang === 'th';

    window.openSubLayout(window.t('lang_menu_item'), () => `
        <div class="app-sub-fade">
        <div class="list-wrapper setting-list-wrapper">
            <div class="lang-row">
                <span class="menu-row-label">${window.t('lang_select_lbl')}</span>
                <div class="lang-btn-group">
                    <span id="click-btn-th" class="lang-btn ${isTh ? 'lang-btn-active' : ''}">ไทย</span>
                    <span class="lang-btn-divider">|</span>
                    <span id="click-btn-en" class="lang-btn ${isEn ? 'lang-btn-active' : ''}">Eng</span>
                </div>
            </div>
            <div class="menu-row setting-menu-row" id="open-holiday-from-lang">
                <div class="menu-row-left">
                    <div class="menu-row-text-wrap">
                        <span class="menu-row-label">${window.t('menu_holiday')}</span>
                        <span class="menu-row-sub">${window.t('menu_holiday_sub')}</span>
                    </div>
                </div>
                <span class="arrow-right">›</span>
            </div>
            <div class="menu-row setting-menu-row" id="open-data-from-lang">
                <div class="menu-row-left">
                    <div class="menu-row-text-wrap">
                        <span class="menu-row-label">${window.t('data_section_title') || 'Data Management'}</span>
                        <span class="menu-row-sub">${window.t('data_menu_sub') || 'Backup · Restore · Reset'}</span>
                    </div>
                </div>
                <span class="arrow-right">›</span>
            </div>
            <div class="menu-row setting-menu-row" id="open-slip-album-from-lang">
                <div class="menu-row-left">
                    <div class="menu-row-text-wrap">
                        <span class="menu-row-label">${window.t('slip_album_title') || 'Slip Album'}</span>
                        <span class="menu-row-sub">${window.t('slip_album_sub') || 'Saved payslips by month'}</span>
                    </div>
                </div>
                <span class="arrow-right">›</span>
            </div>
        </div>
        </div>
        <style>@keyframes appSubIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .app-sub-fade{animation:appSubIn 0.2s ease-out;}
        @keyframes appSubOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(30px)}}</style>`);

    replaceBackBtnSvg();

    const changeLang = (lang) => {
        localStorage.setItem('ot_tracker_lang', lang);
        window.currentLang = lang;
        if (typeof window.renderI18nLabels === 'function') window.renderI18nLabels();
        const titleEl = document.getElementById('sub-layout-title') || document.querySelector('.sub-layout .head-title');
        if (titleEl) titleEl.textContent = window.t('lang_menu_item');
        if (window._settingHelpers?.renderMainSetting) window._settingHelpers.renderMainSetting();
        openLanguageSubLayout();
    };

    document.getElementById('click-btn-th')?.addEventListener('click', () => changeLang('th'));
    document.getElementById('click-btn-en')?.addEventListener('click', () => changeLang('en'));
    document.getElementById('open-holiday-from-lang')?.addEventListener('click', () => {
        const fadeEl = document.querySelector('.app-sub-fade');
        if (fadeEl) {
            fadeEl.style.animation = 'appSubOut 0.18s ease-in forwards';
            setTimeout(() => window.openHolidaySubLayout?.(), 180);
        } else {
            window.openHolidaySubLayout?.();
        }
    });
    document.getElementById('open-data-from-lang')?.addEventListener('click', () => {
        const fadeEl = document.querySelector('.app-sub-fade');
        if (fadeEl) {
            fadeEl.style.animation = 'appSubOut 0.18s ease-in forwards';
            setTimeout(() => window.openSettingData?.(), 180);
        } else {
            window.openSettingData?.();
        }
    });
    document.getElementById('open-slip-album-from-lang')?.addEventListener('click', () => {
        const fadeEl = document.querySelector('.app-sub-fade');
        if (fadeEl) {
            fadeEl.style.animation = 'appSubOut 0.18s ease-in forwards';
            setTimeout(() => window.openSlipAlbumSubLayout?.(), 180);
        } else {
            window.openSlipAlbumSubLayout?.();
        }
    });
}

window.openHolidaySubLayout = function(viewYear) {
    if (typeof window.openSubLayout !== 'function') return;

    var isEn = window.currentLang === 'en';
    var dayEN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    var dayTH = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
    var monEN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var monTH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

    // home.js ရဲ့ multi-year template system (window.buildHolidays) ကိုပဲ
    // ပြန်သုံးထားသည် — holiday system ၂ ခု ကွဲမနေတော့ဘဲ source တစ်ခုတည်းသာ
    var currentYear = new Date().getFullYear();
    var year = parseInt(viewYear) || currentYear;
    var hasSharedSource = typeof window.buildHolidays === 'function';
    var HOLIDAYS = hasSharedSource ? window.buildHolidays(year) : [];

    window.openSubLayout(window.t('holiday_title'), function() {
        var rows = HOLIDAYS.map(function(h) {
            var d   = new Date(h.date);
            var ds  = isEn ? dayEN[d.getDay()]+' '+d.getDate()+' '+monEN[d.getMonth()]
                           : dayTH[d.getDay()]+' '+d.getDate()+' '+monTH[d.getMonth()];
            var col = d.getDay()===0 ? '#e53e3e' : d.getDay()===6 ? '#3182ce' : '#4a5568';
            return '<div class="holiday-row">' +
                '<div class="holiday-date-badge" style="color:'+col+';">'+ds+'</div>' +
                '<div class="holiday-name">'+(isEn ? h.en : h.th)+'</div>' +
            '</div>';
        }).join('');

        var noDataMsg = !hasSharedSource
            ? '<p style="padding:20px;text-align:center;color:#a0aec0;font-size:13px;">' +
                (window.t('export_not_ready') || 'Please open the Home tab once, then try again.') +
              '</p>'
            : '';

        return '<div class="holiday-sub-fade">' +
        '<div class="sub-body holiday-sub-wrap">' +
            '<div class="holiday-year-bar">' +
                '<button id="holiday-year-prev" class="holiday-year-arrow" aria-label="prev year">‹</button>' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a4e8f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<rect x="3" y="4" width="18" height="18" rx="2"></rect>' +
                    '<line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>' +
                '</svg>' +
                '<span>'+window.t('holiday_year')+' '+year+'</span>' +
                '<span class="holiday-total-badge">'+HOLIDAYS.length+' '+window.t('holiday_days')+'</span>' +
                '<button id="holiday-year-next" class="holiday-year-arrow" aria-label="next year">›</button>' +
            '</div>' +
            noDataMsg +
            '<div class="holiday-list">'+rows+'</div>' +
        '</div>' +
        '</div>' +
        '<style>' +
            '@keyframes holidaySubIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}' +
            '.holiday-sub-fade{animation:holidaySubIn 0.2s ease-out;}' +
            '@keyframes holidaySubOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(30px)}}' +
            '.holiday-year-arrow{background:none;border:none;font-size:20px;font-weight:700;color:#1a4e8f;padding:0 8px;cursor:pointer;line-height:1;}' +
        '</style>';
    });

    replaceBackBtnSvg();
    applyDarkHeadNav();

    // Year ‹ › — animation မလို (sub-layout ထဲကိုယ်တိုင် ပြန်ခေါ်ရုံ)
    document.getElementById('holiday-year-prev')?.addEventListener('click', function() {
        window.openHolidaySubLayout(year - 1);
    });
    document.getElementById('holiday-year-next')?.addEventListener('click', function() {
        window.openHolidaySubLayout(year + 1);
    });

    // Back button ကို clone+replace လုပ်ပြီး default listener (Main setting ကို သွားစေတဲ့) အားလုံးကို ဖယ်ရှားပါ
    const backBtn = document.getElementById('sub-back-btn')
        || document.querySelector('.sub-layout .back-btn')
        || document.querySelector('.head-nav .back-btn');
    if (backBtn) {
        const freshBackBtn = backBtn.cloneNode(true);
        backBtn.parentNode.replaceChild(freshBackBtn, backBtn);
        freshBackBtn.addEventListener('click', () => {
            const fadeEl = document.querySelector('.holiday-sub-fade');
            if (fadeEl) fadeEl.style.animation = 'holidaySubOut 0.18s ease-in forwards';
            setTimeout(() => {
                removeDarkHeadNav();
                openLanguageSubLayout();
            }, 180);
        }, { once: true });
    }
};

// ── Slip Album — Export Data ကနေ "Save to Slip Album" လုပ်ထားတဲ့ slip image
// တွေကို လအလိုက် browse/view/delete လုပ်နိုင်သည် ──
window.openSlipAlbumSubLayout = function(viewYear, viewMonth, fromExport) {
    if (typeof window.openSubLayout !== 'function') return;

    var now   = new Date();
    var year  = parseInt(viewYear)  || now.getFullYear();
    var month = viewMonth || String(now.getMonth() + 1).padStart(2, '0');
    var isEn  = window.currentLang !== 'th';
    var monEN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var monTH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    var mLabel = (isEn ? monEN : monTH)[parseInt(month) - 1];

    var slips = typeof window.getSlipAlbumMonth === 'function'
        ? window.getSlipAlbumMonth(String(year), month)
        : [];

    var thumbsHTML = slips.map(function(s) {
        var badge = s.type === 'pdf' ? 'PDF' : 'Excel';
        var badgeColor = s.type === 'pdf' ? '#e53e3e' : '#38a169';
        var dateStr = new Date(s.createdAt).toLocaleDateString();
        return '<div class="slip-thumb-card" data-id="' + s.id + '">' +
            '<img src="' + s.dataUrl + '" class="slip-thumb-img" />' +
            '<div class="slip-thumb-foot">' +
                '<span class="slip-thumb-badge" style="background:' + badgeColor + ';">' + badge + '</span>' +
                '<span class="slip-thumb-date">' + dateStr + '</span>' +
                '<button class="slip-thumb-del" data-id="' + s.id + '">×</button>' +
            '</div>' +
        '</div>';
    }).join('');

    window.openSubLayout(window.t('slip_album_title') || 'Slip Album', function() {
        return '<div class="slip-album-fade">' +
        '<div class="sub-body slip-album-wrap">' +
            '<div class="slip-album-month-bar">' +
                '<button id="slip-album-prev" class="holiday-year-arrow">‹</button>' +
                '<span>' + mLabel + ' ' + year + '</span>' +
                '<button id="slip-album-next" class="holiday-year-arrow">›</button>' +
            '</div>' +
            (slips.length > 0
                ? '<div class="slip-thumb-grid">' + thumbsHTML + '</div>'
                : '<p class="slip-album-empty">' + (window.t('slip_album_empty') || 'No slips saved for this month') + '</p>') +
        '</div>' +
        '</div>' +
        '<style>' +
            '@keyframes slipAlbumIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}' +
            '.slip-album-fade{animation:slipAlbumIn 0.2s ease-out;}' +
            '@keyframes slipAlbumOut{from{opacity:1;transform:translateX(0)}to{opacity:0;transform:translateX(30px)}}' +
            '.slip-album-month-bar{display:flex;align-items:center;justify-content:center;gap:16px;padding:14px 0;font-size:14px;font-weight:700;color:#1a202c;}' +
            '.slip-album-empty{text-align:center;color:#a0aec0;font-size:13px;padding:40px 20px;}' +
            '.slip-thumb-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 16px 20px;}' +
            '.slip-thumb-card{border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#fff;}' +
            '.slip-thumb-img{width:100%;display:block;cursor:pointer;background:#f7f9fa;}' +
            '.slip-thumb-foot{display:flex;align-items:center;gap:6px;padding:7px 8px;}' +
            '.slip-thumb-badge{font-size:9px;font-weight:800;color:#fff;padding:2px 6px;border-radius:5px;}' +
            '.slip-thumb-date{font-size:9.5px;color:#a0aec0;flex:1;}' +
            '.slip-thumb-del{background:none;border:none;color:#c0392b;font-size:16px;font-weight:700;cursor:pointer;padding:0 4px;line-height:1;}' +
        '</style>';
    });

    replaceBackBtnSvg();
    applyDarkHeadNav();

    // Month ‹ › — animation မလို
    document.getElementById('slip-album-prev')?.addEventListener('click', function() {
        var m = parseInt(month) - 1, y = year;
        if (m < 1) { m = 12; y--; }
        window.openSlipAlbumSubLayout(y, String(m).padStart(2,'0'), fromExport);
    });
    document.getElementById('slip-album-next')?.addEventListener('click', function() {
        var m = parseInt(month) + 1, y = year;
        if (m > 12) { m = 1; y++; }
        window.openSlipAlbumSubLayout(y, String(m).padStart(2,'0'), fromExport);
    });

    // Thumbnail tap → full-size view (simple lightbox overlay)
    document.querySelectorAll('.slip-thumb-img').forEach(function(img) {
        img.addEventListener('click', function() {
            var overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;z-index:999998;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:20px;';
            overlay.innerHTML = '<img src="' + img.src + '" style="max-width:100%;max-height:100%;border-radius:8px;" />';
            overlay.addEventListener('click', function() { overlay.remove(); });
            document.body.appendChild(overlay);
        });
    });

    // Delete slip
    document.querySelectorAll('.slip-thumb-del').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            var id = parseInt(btn.getAttribute('data-id'));
            if (typeof window.deleteSlipFromAlbum === 'function') {
                window.deleteSlipFromAlbum(String(year), month, id);
            }
            window.openSlipAlbumSubLayout(year, month, fromExport);
        });
    });

    // Back button — Export ကနေ ဖွင့်ခဲ့ရင် Export ကို ပြန်၊ Application menu
    // ကနေ ဖွင့်ခဲ့ရင် Application menu ကို ပြန်သွားရန်
    const backBtn = document.getElementById('sub-back-btn')
        || document.querySelector('.sub-layout .back-btn')
        || document.querySelector('.head-nav .back-btn');
    if (backBtn) {
        const freshBackBtn = backBtn.cloneNode(true);
        backBtn.parentNode.replaceChild(freshBackBtn, backBtn);
        freshBackBtn.addEventListener('click', () => {
            const fadeEl = document.querySelector('.slip-album-fade');
            if (fadeEl) fadeEl.style.animation = 'slipAlbumOut 0.18s ease-in forwards';
            setTimeout(() => {
                removeDarkHeadNav();
                if (fromExport && typeof window.openSettingExport === 'function') {
                    window.openSettingExport();
                } else {
                    openLanguageSubLayout();
                }
            }, 180);
        }, { once: true });
    }
};

window.openSettingApplication = openLanguageSubLayout;

})();
