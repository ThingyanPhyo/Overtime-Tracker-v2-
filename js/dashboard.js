// ==========================================
// dashboard.js — Banking/Analytics Dashboard View
// window.views.banking — replaces Analytics Center
// ==========================================

window.views.dashboard = function (container) {

    // ── Helpers (same logic as record.js) ─────────────────────────────

    function calcWage(workHr, perHr, note) {
        var wh = parseFloat(workHr) || 0;
        var ph = parseFloat(perHr)  || 0;
        var n  = (note || '').trim();
        if (n === 'sunday_ot')          return wh * ph * 2;
        if (n === 'government_holiday') return wh * ph * 1;
        return wh * ph;
    }

    function calcOtTotal(otIn, otOut, otPay) {
        if (!otIn || !otOut || !otPay) return 0;
        var inP  = otIn.split(':').map(Number);
        var outP = otOut.split(':').map(Number);
        var inM  = inP[0]  * 60 + inP[1];
        var outM = outP[0] * 60 + outP[1];
        if (outM <= inM) outM += 24 * 60;
        return ((outM - inM) / 60) * (parseFloat(otPay) || 0);
    }

    // Night Shift Allowance — record.js ရဲ့ window.calcRecordNSA/isRecordNightShift
    // logic အတိုင်း (Work In 18:00–05:59 ဖြစ်မှသာ rate ကို ထည့်တွက်)
    function isNightShift(workIn) {
        if (!workIn) return false;
        var hr = parseInt(workIn.split(':')[0]);
        return hr >= 18 || hr < 6;
    }
    function calcNSA(workIn, nsaRate, note) {
        if (note === 'sunday') return 0;
        var rate = parseFloat(nsaRate) || 0;
        if (!rate) return 0;
        return isNightShift(workIn) ? rate : 0;
    }

    function fmt(n) { return parseFloat(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

    function getMonthName(m, short) {
        var isEn = window.currentLang !== 'th';
        var full_en = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        var short_en = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var full_th = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
        var short_th = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
        if (isEn) return (short ? short_en : full_en)[parseInt(m) - 1] || m;
        return (short ? short_th : full_th)[parseInt(m) - 1] || m;
    }

    function getDowName(dayIndex) {
        var en = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        var th = ['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'];
        return (window.currentLang !== 'th' ? en : th)[dayIndex] || '';
    }

    function getNoteLabel(note) {
        var map = {
            normal_ot:          window.t('note_normal_ot')  || 'Normal OT',
            weekend_ot:         window.t('note_weekend_ot') || 'Weekend OT',
            sunday_ot:          window.t('note_sunday_ot')  || 'Sunday OT',
            government_holiday: window.t('note_gov_holiday')|| 'Gov Holiday',
            holiday_ot:         window.t('note_holiday_ot') || 'Holiday OT',
            night_shift:        window.t('note_night_shift')|| 'Night Shift',
            other:              window.t('note_other')       || 'Other'
        };
        return map[note] || note || '—';
    }

    var now       = new Date();
    var selYear   = String(now.getFullYear());
    var selMonth  = String(now.getMonth() + 1).padStart(2, '0');

    // ── Thai holidays lookup ────────────────────────────────────────────
    var THAI_HOLIDAYS_2026 = [
        '2026-01-01','2026-02-05','2026-04-06','2026-04-13','2026-04-14',
        '2026-04-15','2026-05-01','2026-05-04','2026-06-03','2026-07-28',
        '2026-08-12','2026-10-13','2026-10-23','2026-12-05','2026-12-10','2026-12-31'
    ];
    function isThaiHoliday(year, month, date) {
        var key = year + '-' + month + '-' + String(date).padStart(2,'0');
        return THAI_HOLIDAYS_2026.indexOf(key) !== -1;
    }

    // ── Compute monthly stats ──────────────────────────────────────────
    function computeStats(records, year, month) {
        var filtered = records.filter(function(r) {
            return r.month === month && (r.year || String(now.getFullYear())) === year;
        });

        var totalWage   = 0;
        var totalOt     = 0;
        var totalNsa    = 0; // Night Shift Allowance — သီးခြားစာရင်း
        var totalDays   = filtered.filter(function(r) {
            return r.note !== 'sunday' && r.note !== 'sunday_ot';
        }).length;
        var otDays      = 0;
        var noteCount   = {};
        var dailyTotals = [];

        // ── Payslip split ─────────────────────────────────────
        // Card 1: date 1–15, Wage only (no sunday, no sunday_ot, no gov_holiday)
        var card1     = 0;
        // Card 2: Wage(16–end) + Normal OT(1–end) + Sunday OT wage(1–end, sunday_ot only) + NSA(1–end)
        var card2Wage      = 0; // 16–end wage (not sunday/sunday_ot/gov_holiday)
        var card2OtAll     = 0; // 1–end Normal OT (not sunday/sunday_ot/gov_holiday)
        var card2SundayOt  = 0; // 1–end sunday_ot wage only
        var card2Nsa       = 0; // NSA — လတစ်ခုလုံး (Card 1 က NSA လုံးဝမပြသလို့ ဒီနေရာမှာ စုပေါင်းထည့်ရသည်)

        filtered.forEach(function(r) {
            var wage    = calcWage(r.workHour, r.perHour, r.note);
            var isSundayOt  = r.note === 'sunday_ot';
            var isSunday    = r.note === 'sunday';
            var isGovHol    = r.note === 'government_holiday';
            // OT: same as record.js total column — sunday_ot/sunday/gov_holiday get 0 OT
            var ot      = (isSundayOt || isSunday || isGovHol) ? 0 : calcOtTotal(r.otIn, r.otOut, r.otPay);
            // NSA — Night Shift Allowance (record.js Total column logic အတိုင်း)
            var nsa     = isSunday ? 0 : calcNSA(r.workIn, r.nsa, r.note);
            // total: same as record.js total column — sunday gets 0, others get wage+ot+nsa
            var total   = isSunday ? 0 : (parseFloat(wage) + parseFloat(ot) + parseFloat(nsa));
            var dateNum = parseInt(r.date);

            // grandTotal uses record.js total column logic (sunday=0)
            totalWage += isSunday ? 0 : parseFloat(wage);
            totalOt   += ot;
            totalNsa  += nsa;
            if (ot > 0) otDays++;

            noteCount[r.note] = (noteCount[r.note] || 0) + 1;
            dailyTotals.push({ date: dateNum, wage: wage, ot: ot, nsa: nsa, total: total, note: r.note, record: r });

            // Card 1: 1–15, Wage only (not sunday_ot, not sunday, not gov_holiday)
            if (dateNum >= 1 && dateNum <= 15) {
                if (!isSundayOt && !isSunday && !isGovHol) {
                    card1     += wage;
                }
            }

            // Card 2 — Wage: 16–end, not sunday_ot, not sunday, not gov_holiday
            if (dateNum >= 16) {
                if (!isSundayOt && !isSunday && !isGovHol) {
                    card2Wage += wage;
                }
            }
            // Card 2 — NSA: လတစ်ခုလုံး (1–end) ပေါင်းထည့်သည် — Card 1 က Wage
            // ချည်းသက်သက်ပြပြီး NSA လုံးဝမပြသလို့၊ ဒီနေရာမှာ မထည့်ရင် NSA ပျောက်သွားမည်
            card2Nsa += nsa;
            // Card 2 — Normal OT: 1–end, excluding sunday_ot / sunday / gov_holiday
            card2OtAll += ot;
            // Card 2 — Sunday OT wage: sunday_ot note only (not sunday)
            if (isSundayOt) {
                card2SundayOt += wage;
            }
        });

        dailyTotals.sort(function(a, b) { return a.date - b.date; });

        return {
            filtered:     filtered,
            totalWage:    totalWage,
            totalOt:      totalOt,
            totalNsa:     totalNsa,
            grandTotal:   totalWage + totalOt + totalNsa,
            totalDays:    totalDays,
            otDays:       otDays,
            noteCount:    noteCount,
            dailyTotals:  dailyTotals,
            card1:        card1,
            card2:        card2Wage + card2OtAll + card2SundayOt + card2Nsa,
            card2Wage:    card2Wage,
            card2OtAll:   card2OtAll,
            card2SundayOt: card2SundayOt,
            card2Nsa:     card2Nsa
        };
    }

    // ── Compute year summary (all 12 months) ──────────────────────────
    function computeYearStats(records, year) {
        var months = [];
        for (var m = 1; m <= 12; m++) {
            var mm    = String(m).padStart(2,'0');
            var stats = computeStats(records, year, mm);
            months.push({ month: mm, label: getMonthName(mm, true), stats: stats });
        }
        return months;
    }

    // ── Bar chart SVG ─────────────────────────────────────────────────
    function renderBarChart(monthlyData, highlightMonth) {
        var W = 320, H = 90, barW = 16, gap = (W - 12 * barW) / 13;
        var maxVal = Math.max.apply(null, monthlyData.map(function(d) { return d.stats.grandTotal; })) || 1;

        var bars = monthlyData.map(function(d, i) {
            var x      = gap + i * (barW + gap);
            var ratio  = d.stats.grandTotal / maxVal;
            var bh     = Math.max(ratio * (H - 22), d.stats.grandTotal > 0 ? 4 : 1);
            var y      = H - 14 - bh;
            var active = d.month === highlightMonth;
            var color  = active ? '#1a4e8f' : (d.stats.grandTotal > 0 ? '#90b4e0' : '#e2e8f0');
            return (
                '<rect x="' + x + '" y="' + y + '" width="' + barW + '" height="' + bh +
                '" rx="3" fill="' + color + '" data-month="' + d.month + '" class="dash-bar" style="cursor:pointer;transition:fill 0.2s"/>' +
                '<text x="' + (x + barW / 2) + '" y="' + (H - 1) + '" text-anchor="middle" font-size="8" fill="' + (active ? '#1a4e8f' : '#a0aec0') + '" font-weight="' + (active ? '700' : '400') + '">' + d.label + '</text>'
            );
        }).join('');

        return '<svg width="100%" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet">' + bars + '</svg>';
    }

    // ── Note breakdown pills ──────────────────────────────────────────
    function renderNotePills(noteCount) {
        var entries = Object.keys(noteCount).filter(function(k) { return noteCount[k] > 0; });
        if (!entries.length) return '<span style="color:#a0aec0;font-size:13px;">—</span>';
        var colors = {
            normal_ot:          '#3182ce',
            weekend_ot:         '#805ad5',
            sunday_ot:          '#e53e3e',
            government_holiday: '#dd6b20',
            holiday_ot:         '#d69e2e',
            night_shift:        '#2d3748',
            other:              '#718096'
        };
        return entries.map(function(k) {
            var c = colors[k] || '#718096';
            return '<span style="display:inline-flex;align-items:center;gap:4px;background:' + c + '18;color:' + c + ';border:1px solid ' + c + '30;border-radius:20px;padding:3px 9px;font-size:11px;font-weight:600;margin:2px;">' +
                getNoteLabel(k) + ' <span style="background:' + c + ';color:#fff;border-radius:10px;padding:0 5px;font-size:10px;">' + noteCount[k] + '</span></span>';
        }).join('');
    }

    // ── Holiday detect for upcoming ──────────────────────────────────
    function getUpcomingHolidays() {
        var upcoming = [];
        var today    = new Date();
        var names = {
            '2026-01-01': "New Year's Day",      '2026-02-05': 'Makha Bucha Day',
            '2026-04-06': 'Chakri Memorial Day', '2026-04-13': 'Songkran Festival',
            '2026-04-14': 'Songkran Festival',   '2026-04-15': 'Songkran Festival',
            '2026-05-01': 'National Labour Day', '2026-05-04': 'Coronation Day',
            '2026-06-03': "Queen Suthida's Birthday", '2026-07-28': "King's Birthday",
            '2026-08-12': "Mother's Day",        '2026-10-13': 'King Bhumibol Day',
            '2026-10-23': 'Chulalongkorn Day',   '2026-12-05': "Father's Day",
            '2026-12-10': 'Constitution Day',    '2026-12-31': "New Year's Eve"
        };
        if (window.currentLang !== 'en') {
            Object.assign(names, {
                '2026-01-01': 'วันขึ้นปีใหม่',       '2026-02-05': 'วันมาฆบูชา',
                '2026-04-06': 'วันจักรี',              '2026-04-13': 'วันสงกรานต์',
                '2026-04-14': 'วันสงกรานต์',           '2026-04-15': 'วันสงกรานต์',
                '2026-05-01': 'วันแรงงานแห่งชาติ',    '2026-05-04': 'วันฉัตรมงคล',
                '2026-06-03': 'วันเฉลิมพระชนมพรรษาสมเด็จพระราชินี',
                '2026-07-28': 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว',
                '2026-08-12': 'วันแม่แห่งชาติ',       '2026-10-13': 'วันนวมินทรมหาราช',
                '2026-10-23': 'วันปิยมหาราช',          '2026-12-05': 'วันพ่อแห่งชาติ',
                '2026-12-10': 'วันรัฐธรรมนูญ',         '2026-12-31': 'วันสิ้นปี'
            });
        }
        THAI_HOLIDAYS_2026.forEach(function(dateStr) {
            var d = new Date(dateStr);
            if (d >= today) upcoming.push({ dateStr: dateStr, date: d, name: names[dateStr] || dateStr });
        });
        upcoming.sort(function(a, b) { return a.date - b.date; });
        return upcoming.slice(0, 3);
    }

    // ── Main Render ───────────────────────────────────────────────────
    function render() {
        var records     = window.getRecords();
        var monthStats  = computeStats(records, selYear, selMonth);
        var yearData    = computeYearStats(records, selYear);
        var barChart    = renderBarChart(yearData, selMonth);
        var notePills   = renderNotePills(monthStats.noteCount);
        var upcoming    = getUpcomingHolidays();
        var hasRecords  = records.length > 0;

        // Year options
        var years = [];
        var minY  = parseInt(selYear) - 2;
        for (var y = minY; y <= parseInt(selYear) + 1; y++) years.push(String(y));

        container.innerHTML = `
        <div class="dash-page">

            <!-- ① Year / Month selectors -->
            <div class="dash-selectors">
                <select id="dash-year" class="dash-sel">
                    ${years.map(function(y) {
                        return '<option value="' + y + '"' + (y === selYear ? ' selected' : '') + '>' + y + '</option>';
                    }).join('')}
                </select>
                <select id="dash-month" class="dash-sel">
                    ${[1,2,3,4,5,6,7,8,9,10,11,12].map(function(m) {
                        var mm = String(m).padStart(2,'0');
                        return '<option value="' + mm + '"' + (mm === selMonth ? ' selected' : '') + '>' + getMonthName(mm) + '</option>';
                    }).join('')}
                </select>
            </div>

            <!-- ② Summary Cards -->
            <div class="dash-cards">
                <div class="dash-card dash-card-main" id="dash-grand-total-card" style="cursor:pointer;-webkit-tap-highlight-color:transparent;">
                    <div class="dash-card-label">${window.t('dash_grand_total') || 'Grand Total'}</div>
                    <div class="dash-card-value">฿${fmt(monthStats.grandTotal)}</div>
                    <div class="dash-card-sub" style="display:flex;align-items:center;justify-content:space-between;">
                        <span>${getMonthName(selMonth)} ${selYear}</span>
                        <span style="font-size:11px;opacity:0.65;">${window.t('dash_view_history') || 'View History ›'}</span>
                    </div>
                </div>

                <!-- Payslip Split Cards -->
                <div class="dash-card-row">

                    <!-- Card 1: 1–15 Wage only -->
                    <div class="dash-card dash-card-split dash-card-split-1">
                        <div class="dash-split-badge">${window.t('dash_split1_range') || '1 – 15'}</div>
                        <div class="dash-split-value">฿${fmt(monthStats.card1)}</div>
                        <div class="dash-split-desc">${window.t('dash_wage') || 'Wage'}</div>
                    </div>

                    <!-- Card 2: 16–end Wage + full OT + Sunday OT + NSA -->
                    <div class="dash-card dash-card-split dash-card-split-2">
                        <div class="dash-split-badge">${window.t('dash_split2_range') || '16 – End'}</div>
                        <div class="dash-split-value">฿${fmt(monthStats.card2)}</div>
                        <div class="dash-split-detail" style="display:flex;flex-wrap:wrap;gap:2px 10px;">
                            <span style="white-space:nowrap;">${window.t('dash_wage') || 'Wage'} ฿${fmt(monthStats.card2Wage)}</span>
                            <span style="white-space:nowrap;">${window.t('dash_ot') || 'OT'} ฿${fmt(monthStats.card2OtAll)}</span>
                            <span style="white-space:nowrap;">${window.t('dash_sunday_ot') || 'Sun OT'} ฿${fmt(monthStats.card2SundayOt)}</span>
                            <span style="white-space:nowrap;">${window.t('rec_nsa_abbr') || 'NSA'} ฿${fmt(monthStats.card2Nsa)}</span>
                        </div>
                    </div>

                </div>

                <div class="dash-card-row">
                    <div class="dash-card dash-card-sm">
                        <div class="dash-card-label">${window.t('dash_wage') || 'Wage'}</div>
                        <div class="dash-card-value-sm">฿${fmt(monthStats.totalWage)}</div>
                    </div>
                    <div class="dash-card dash-card-sm">
                        <div class="dash-card-label">${window.t('dash_ot') || 'OT Pay'}</div>
                        <div class="dash-card-value-sm">฿${fmt(monthStats.totalOt)}</div>
                    </div>
                </div>
                <div class="dash-card-row">
                    <div class="dash-card dash-card-sm" style="flex:1;">
                        <div class="dash-card-label">${window.t('wc_night_allowance') || 'Night Shift Allowance'}</div>
                        <div class="dash-card-value-sm">฿${fmt(monthStats.totalNsa)}</div>
                    </div>
                </div>
            </div>

            <!-- ③ Stats row -->
            <div class="dash-stats-row">
                <div class="dash-stat">
                    <span class="dash-stat-num">${monthStats.totalDays}</span>
                    <span class="dash-stat-lbl">${window.t('dash_work_days') || 'Work Days'}</span>
                </div>
                <div class="dash-stat-divider"></div>
                <div class="dash-stat">
                    <span class="dash-stat-num">${monthStats.otDays}</span>
                    <span class="dash-stat-lbl">${window.t('dash_ot_days') || 'OT Days'}</span>
                </div>
                <div class="dash-stat-divider"></div>
                <div class="dash-stat">
                    <span class="dash-stat-num">${monthStats.totalDays > 0 ? fmt(monthStats.grandTotal / monthStats.totalDays) : '0.00'}</span>
                    <span class="dash-stat-lbl">${window.t('dash_avg_day') || 'Avg/Day'}</span>
                </div>
            </div>

            <!-- ④ Bar chart — year overview -->
            <div class="dash-section">
                <div class="dash-section-title">${window.t('dash_year_overview') || selYear + ' Overview'}</div>
                <div class="dash-chart-wrap" id="dash-chart-wrap">
                    ${barChart}
                </div>
            </div>

            <!-- ⑤ Note breakdown -->
            <div class="dash-section">
                <div class="dash-section-title">${window.t('dash_note_breakdown') || 'Shift Types'}</div>
                <div class="dash-pills">
                    ${monthStats.totalDays > 0 ? notePills : '<span style="color:#a0aec0;font-size:13px;">' + (window.t('no_data') || 'No data') + '</span>'}
                </div>
            </div>

            <!-- ⑥ Daily breakdown list -->
            ${monthStats.dailyTotals.length > 0 ? `
            <div class="dash-section">
                <div class="dash-section-title">${window.t('dash_daily_detail') || 'Daily Detail'}</div>
                <div class="dash-daily-list">
                    ${monthStats.dailyTotals.map(function(d) {
                        var isHol = isThaiHoliday(selYear, selMonth, d.date);
                        var dow   = new Date(parseInt(selYear), parseInt(selMonth) - 1, d.date).getDay();
                        var dateColor = dow === 0 ? '#e53e3e' : dow === 6 ? '#3182ce' : '#2d3748';                        return '<div class="dash-daily-row">' +
                            '<div class="dash-daily-left">' +
                                '<span class="dash-daily-date" style="color:' + dateColor + ';">' + String(d.date).padStart(2,'0') + '</span>' +
                                (isHol ? '<span class="dash-hol-dot" title="Holiday"></span>' : '') +
                                '<span class="dash-daily-note">' + getNoteLabel(d.note) + '</span>' +
                            '</div>' +
                            '<div class="dash-daily-right">' +
                                '<span class="dash-daily-total">฿' + fmt(d.total) + '</span>' +
                                (d.ot > 0 ? '<span class="dash-daily-ot">+OT ฿' + fmt(d.ot) + '</span>' : '') +
                                (d.nsa > 0 ? '<span class="dash-daily-ot" style="background:#feebc8;color:#9c4221;">+NSA ฿' + fmt(d.nsa) + '</span>' : '') +
                            '</div>' +
                        '</div>';
                    }).join('')}
                </div>
            </div>` : ''}

            <!-- ⑦ Upcoming holidays -->
            <div class="dash-section">
                <div class="dash-section-title">${window.t('dash_upcoming_holidays') || 'Upcoming Holidays'}</div>
                ${upcoming.length > 0 ? upcoming.map(function(h) {
                    var d   = h.date;
                    var dow = getDowName(d.getDay());
                    var mon = getMonthName(String(d.getMonth() + 1).padStart(2,'0'), true);
                    return '<div class="dash-holiday-row">' +
                        '<div class="dash-holiday-badge">' +
                            '<span class="dash-holiday-day">' + String(d.getDate()).padStart(2,'0') + '</span>' +
                            '<span class="dash-holiday-mon">' + mon + '</span>' +
                        '</div>' +
                        '<div class="dash-holiday-info">' +
                            '<span class="dash-holiday-name">' + h.name + '</span>' +
                            '<span class="dash-holiday-dow">' + dow + '</span>' +
                        '</div>' +
                    '</div>';
                }).join('') : '<span style="color:#a0aec0;font-size:13px;">—</span>'}
            </div>

            <!-- ⑧ No data state -->
            ${!hasRecords ? '<div class="dash-empty"><div class="dash-empty-icon">📊</div><div class="dash-empty-txt">' + (window.t('no_data') || 'No records yet') + '</div></div>' : ''}

        </div>

        <style>
        .dash-page { padding: 4px 0 40px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

        /* Selectors */
        .dash-selectors { display:flex; gap:8px; padding: 0 16px 12px 16px; }
        .dash-sel { flex:1; background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:9px 10px; font-size:14px; color:#2d3748; font-weight:500; outline:none; -webkit-appearance:none; }

        /* Cards */
        .dash-cards { padding: 0 16px 4px 16px; display:flex; flex-direction:column; gap:8px; }
        .dash-card { background:#fff; border-radius:16px; padding:18px 20px; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
        .dash-card-main { background: linear-gradient(135deg, #1a4e8f 0%, #2563a8 100%); }
        .dash-card-main .dash-card-label { color:rgba(255,255,255,0.75); font-size:12px; font-weight:500; margin-bottom:4px; }
        .dash-card-main .dash-card-value { color:#fff; font-size:28px; font-weight:700; letter-spacing:-0.5px; line-height:1.1; }
        .dash-card-main .dash-card-sub   { color:rgba(255,255,255,0.6); font-size:12px; margin-top:4px; }
        .dash-card-row  { display:flex; gap:8px; }
        .dash-card-sm   { flex:1; }
        .dash-card-label   { color:#718096; font-size:12px; font-weight:500; margin-bottom:3px; }
        .dash-card-value-sm { color:#1a202c; font-size:18px; font-weight:700; }

        /* Stats row */
        .dash-stats-row { display:flex; align-items:center; justify-content:space-around; background:#fff; margin: 8px 16px; border-radius:14px; padding:14px 0; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
        .dash-stat { display:flex; flex-direction:column; align-items:center; gap:3px; flex:1; }
        .dash-stat-num  { font-size:17px; font-weight:700; color:#1a202c; }
        .dash-stat-lbl  { font-size:11px; color:#a0aec0; font-weight:500; text-align:center; }
        .dash-stat-divider { width:1px; height:32px; background:#e2e8f0; }

        /* Sections */
        .dash-section { margin: 8px 16px 0 16px; background:#fff; border-radius:16px; padding:16px; box-shadow:0 1px 4px rgba(0,0,0,0.06); }
        .dash-section-title { font-size:13px; font-weight:700; color:#4a5568; margin-bottom:12px; text-transform:uppercase; letter-spacing:0.5px; }

        /* Chart */
        .dash-chart-wrap { width:100%; touch-action:pan-y; }
        .dash-bar:active { opacity:0.7; }

        /* Pills */
        .dash-pills { display:flex; flex-wrap:wrap; gap:0; }

        /* Daily list */
        .dash-daily-list { display:flex; flex-direction:column; gap:0; }
        .dash-daily-row  { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f0f4f8; }
        .dash-daily-row:last-child { border-bottom:none; }
        .dash-daily-left  { display:flex; align-items:center; gap:8px; }
        .dash-daily-date  { font-size:16px; font-weight:700; min-width:24px; }
        .dash-hol-dot     { width:6px; height:6px; border-radius:50%; background:#dd6b20; flex-shrink:0; }
        .dash-daily-note  { font-size:12px; color:#718096; }
        .dash-daily-right { display:flex; flex-direction:column; align-items:flex-end; gap:2px; }
        .dash-daily-total { font-size:14px; font-weight:700; color:#1a202c; }
        .dash-daily-ot    { font-size:11px; color:#3182ce; font-weight:500; }

        /* Holiday rows */
        .dash-holiday-row  { display:flex; align-items:center; gap:12px; padding:8px 0; border-bottom:1px solid #f0f4f8; }
        .dash-holiday-row:last-child { border-bottom:none; }
        .dash-holiday-badge { display:flex; flex-direction:column; align-items:center; background:#ebf4ff; border-radius:10px; padding:6px 10px; min-width:44px; }
        .dash-holiday-day  { font-size:16px; font-weight:700; color:#1a4e8f; line-height:1.1; }
        .dash-holiday-mon  { font-size:10px; color:#4a90d9; font-weight:600; text-transform:uppercase; }
        .dash-holiday-info { display:flex; flex-direction:column; gap:2px; flex:1; }
        .dash-holiday-name { font-size:13px; font-weight:600; color:#2d3748; line-height:1.3; }
        .dash-holiday-dow  { font-size:11px; color:#a0aec0; }

        /* Empty state */
        .dash-empty { text-align:center; padding:40px 20px; }
        .dash-empty-icon { font-size:40px; margin-bottom:12px; }
        .dash-empty-txt  { color:#a0aec0; font-size:14px; }
        </style>
        `;

        // ── Bar tap → change month ──────────────────────────────────
        container.querySelectorAll('.dash-bar').forEach(function(bar) {
            bar.addEventListener('click', function() {
                selMonth = bar.getAttribute('data-month');
                document.getElementById('dash-month').value = selMonth;
                render();
            });
        });

        // ── Selectors ──────────────────────────────────────────────
        document.getElementById('dash-year')?.addEventListener('change', function() {
            selYear = this.value;
            render();
        });
        document.getElementById('dash-month')?.addEventListener('change', function() {
            selMonth = this.value;
            render();
        });

        // ── Grand Total card → History tab ─────────────────────────
        document.getElementById('dash-grand-total-card')?.addEventListener('click', function() {
            if (typeof window.switchTab === 'function') window.switchTab('history');
        });
    }

    render();
};
