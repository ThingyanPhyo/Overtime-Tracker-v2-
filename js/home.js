// ==========================================
// home.js — Home View (Daily Workflow)
// window.views.home — PIN gate မပါ
// ==========================================

window.views.home = function(container) {

    // ── Helpers ────────────────────────────────────────────────────────
    function calcWage(workHr, perHr, note) {
        var wh = parseFloat(workHr) || 0, ph = parseFloat(perHr) || 0;
        if (note === 'sunday_ot')          return wh * ph * 2;
        if (note === 'government_holiday') return wh * ph;
        return wh * ph;
    }
    function calcOtTotal(otIn, otOut, otPay) {
        if (!otIn || !otOut || !otPay) return 0;
        var inM  = parseInt(otIn.split(':')[0])  * 60 + parseInt(otIn.split(':')[1]);
        var outM = parseInt(otOut.split(':')[0]) * 60 + parseInt(otOut.split(':')[1]);
        if (outM <= inM) outM += 24 * 60;
        return ((outM - inM) / 60) * (parseFloat(otPay) || 0);
    }
    // Night Shift Allowance — record.js ရဲ့ window.calcRecordNSA logic အတိုင်း
    function calcNSA(workIn, nsaRate, note) {
        if (note === 'sunday') return 0;
        var rate = parseFloat(nsaRate) || 0;
        if (!rate) return 0;
        var hr = workIn ? parseInt(workIn.split(':')[0]) : NaN;
        return (hr >= 18 || hr < 6) ? rate : 0;
    }
    // OT hours (not currency) — Goal Tracker ring အတွက်
    function calcOtHours(otIn, otOut) {
        if (!otIn || !otOut) return 0;
        var inM  = parseInt(otIn.split(':')[0])  * 60 + parseInt(otIn.split(':')[1]);
        var outM = parseInt(otOut.split(':')[0]) * 60 + parseInt(otOut.split(':')[1]);
        if (outM <= inM) outM += 24 * 60;
        return (outM - inM) / 60;
    }

    // ── Monthly OT Goal (user-set target hours, stored per device) ──
    var OT_GOAL_KEY = 'ot_goal_hours';
    function _getOtGoalHours(autoFallback) {
        var v = parseFloat(localStorage.getItem(OT_GOAL_KEY));
        return (v && v > 0) ? v : autoFallback;
    }
    function _setOtGoalHours(hrs) {
        localStorage.setItem(OT_GOAL_KEY, String(hrs));
    }

    // ── Daily logging streak — consecutive calendar days (ending today
    // or yesterday) that have at least one record ──
    function _computeLoggingStreak(records) {
        var dateSet = {};
        (records || []).forEach(function(r) {
            var y = r.year || '';
            var key = y + '-' + String(r.month).padStart(2,'0') + '-' + String(r.date).padStart(2,'0');
            dateSet[key] = true;
        });
        var cursor = new Date();
        // Bugun record မရှိသေးရင် မနေ့ကနေ streak စတွက် (today ကို မရှိသေးလို့ streak ဖျက်မထား)
        var todayKey = cursor.getFullYear() + '-' + String(cursor.getMonth()+1).padStart(2,'0') + '-' + String(cursor.getDate()).padStart(2,'0');
        if (!dateSet[todayKey]) cursor.setDate(cursor.getDate() - 1);
        var streak = 0;
        while (true) {
            var key = cursor.getFullYear() + '-' + String(cursor.getMonth()+1).padStart(2,'0') + '-' + String(cursor.getDate()).padStart(2,'0');
            if (!dateSet[key]) break;
            streak++;
            cursor.setDate(cursor.getDate() - 1);
        }
        return streak;
    }

    function getMonthName(m, short) {
        var isEn    = window.currentLang !== 'th';
        var fen     = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        var sen     = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var fth     = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
        var sth     = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
        if (isEn) return (short ? sen : fen)[parseInt(m) - 1] || m;
        return (short ? sth : fth)[parseInt(m) - 1] || m;
    }
    function getNoteLabel(note) {
        var map = {
            normal_ot:          window.t('note_normal_ot')   || 'Normal OT',
            weekend_ot:         window.t('note_weekend_ot')  || 'Weekend OT',
            sunday_ot:          window.t('note_sunday_ot')   || 'Sunday OT',
            government_holiday: window.t('note_gov_holiday') || 'Gov Holiday',
            holiday_ot:         window.t('note_holiday_ot')  || 'Holiday OT',
            night_shift:        window.t('note_night_shift') || 'Night Shift',
            other:              window.t('note_other')        || 'Other'
        };
        return map[note] || note || '—';
    }
    function getNoteColor(note) {
        var map = { normal_ot:'#3182ce', weekend_ot:'#805ad5', sunday_ot:'#e53e3e', government_holiday:'#dd6b20', holiday_ot:'#d69e2e', night_shift:'#2d3748', other:'#718096' };
        return map[note] || '#718096';
    }

    // ── Date / Time ────────────────────────────────────────────────────
    var now      = new Date();
    var nowYear  = String(now.getFullYear());
    var nowMonth = String(now.getMonth() + 1).padStart(2, '0');
    var today    = String(now.getDate()).padStart(2, '0');
    var hour     = now.getHours();

    function getGreeting() {
        if (window.currentLang === 'th') {
            if (hour < 12) return 'อรุณสวัสดิ์';
            if (hour < 17) return 'สวัสดีตอนบ่าย';
            if (hour < 21) return 'สวัสดีตอนเย็น';
            return 'สวัสดีตอนดึก';
        }
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        if (hour < 21) return 'Good Evening';
        return 'Good Night';
    }

    function getGreetingEmoji() {
        if (hour < 6)  return '🌙';
        if (hour < 12) return '🌤️';
        if (hour < 17) return '☀️';
        if (hour < 21) return '🌇';
        return '🌙';
    }

    function getDayName() {
        var en = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
        var th = ['วันอาทิตย์','วันจันทร์','วันอังคาร','วันพุธ','วันพฤหัสบดี','วันศุกร์','วันเสาร์'];
        return (window.currentLang === 'th' ? th : en)[now.getDay()];
    }

    // ── Thai holidays (multi-year) ─────────────────────────────────────
    var HOLIDAY_TEMPLATES = [
        { mm:'01', dd:'01', en:"New Year's Day",           th:'วันขึ้นปีใหม่' },
        { mm:'04', dd:'06', en:'Chakri Memorial Day',      th:'วันจักรี' },
        { mm:'04', dd:'13', en:'Songkran Festival',        th:'วันสงกรานต์' },
        { mm:'04', dd:'14', en:'Songkran Festival',        th:'วันสงกรานต์' },
        { mm:'04', dd:'15', en:'Songkran Festival',        th:'วันสงกรานต์' },
        { mm:'05', dd:'01', en:'National Labour Day',      th:'วันแรงงานแห่งชาติ' },
        { mm:'05', dd:'04', en:'Coronation Day',           th:'วันฉัตรมงคล' },
        { mm:'06', dd:'03', en:"Queen Suthida's Birthday", th:'วันเฉลิมพระชนมพรรษาสมเด็จพระราชินี' },
        { mm:'07', dd:'28', en:"King's Birthday",          th:'วันเฉลิมพระชนมพรรษาฯ' },
        { mm:'08', dd:'12', en:"Mother's Day",             th:'วันแม่แห่งชาติ' },
        { mm:'10', dd:'13', en:'King Bhumibol Memorial',   th:'วันนวมินทรมหาราช' },
        { mm:'10', dd:'23', en:'Chulalongkorn Day',        th:'วันปิยมหาราช' },
        { mm:'12', dd:'05', en:"Father's Day",             th:'วันพ่อแห่งชาติ' },
        { mm:'12', dd:'10', en:'Constitution Day',         th:'วันรัฐธรรมนูญ' },
        { mm:'12', dd:'31', en:"New Year's Eve",           th:'วันสิ้นปี' },
    ];
    // Makha Bucha (lunar — approximate fixed dates per year)
    var LUNAR_HOLIDAYS = {
        2025: [{ mm:'02', dd:'12', en:'Makha Bucha Day', th:'วันมาฆบูชา' }],
        2026: [{ mm:'02', dd:'05', en:'Makha Bucha Day', th:'วันมาฆบูชา' }],
        2027: [{ mm:'02', dd:'23', en:'Makha Bucha Day', th:'วันมาฆบูชา' }],
        2028: [{ mm:'02', dd:'13', en:'Makha Bucha Day', th:'วันมาฆบูชา' }],
    };
    function buildHolidays(year) {
        var y = String(year);
        var list = HOLIDAY_TEMPLATES.map(function(h) {
            return { date: y + '-' + h.mm + '-' + h.dd, en: h.en, th: h.th };
        });
        var lunar = LUNAR_HOLIDAYS[year] || [];
        lunar.forEach(function(h) {
            list.push({ date: y + '-' + h.mm + '-' + h.dd, en: h.en, th: h.th });
        });
        list.sort(function(a, b) { return a.date < b.date ? -1 : 1; });
        return list;
    }
    // Build for current year + next year so Dec→Jan cross-over works
    var HOLIDAYS = buildHolidays(now.getFullYear()).concat(buildHolidays(now.getFullYear() + 1));

    // setting-application.js ရဲ့ Holiday Calendar page ကလည်း ဒီ template system
    // တစ်ခုတည်းကိုပဲ ပြန်သုံးနိုင်အောင် window ပေါ် expose ထားသည်
    // (holiday system ၂ ခု ကွဲနေတာကို ရှောင်ရှားရန်)
    window.buildHolidays = buildHolidays;

    function getNextHoliday() {
        var todayD = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        for (var i = 0; i < HOLIDAYS.length; i++) {
            var h = HOLIDAYS[i];
            var d = new Date(h.date);
            if (d >= todayD) {
                var diff = Math.round((d - todayD) / 86400000);
                return { name: window.currentLang === 'th' ? h.th : h.en, diff: diff, d: d, month: String(d.getMonth() + 1).padStart(2,'0') };
            }
        }
        return null;
    }

    // ── Render ─────────────────────────────────────────────────────────
    function render() {
        var records  = window.getRecords();
        var monthRecs = records.filter(function(r) {
            return r.month === nowMonth && (r.year || nowYear) === nowYear;
        });

        var todayRec = monthRecs.find(function(r) { return r.date === today; });
        var todayLogged = !!todayRec;

        // This month work days count
        var workDays = monthRecs.length;

        // ── Goal Tracker — logging streak + monthly OT-hours progress ──
        var loggingStreak = _computeLoggingStreak(records);
        var monthOtHours  = 0;
        var loggedOtDaysThisMonth = 0;
        monthRecs.forEach(function(r) {
            var noOt = r.note === 'government_holiday' || r.note === 'sunday_ot' || r.note === 'sunday';
            if (!noOt) {
                var _h = calcOtHours(r.otIn, r.otOut);
                monthOtHours += _h;
                if (_h > 0) loggedOtDaysThisMonth++;
            }
        });
        // လပေါ်မူတည်ပြီး Sunday ပိတ်ရက်တွေ နှုတ်ပြီး working days ရေတွက်သည်
        // (Goal ကို user ကိုယ်တိုင် မသတ်မှတ်ရသေးရင် ဒီ working-day count ပေါ် အခြေခံပြီး
        // လက်ရှိ pace (logged OT days ရဲ့ ပျမ်းမျှ OT hr/day) ကို တစ်လလုံးအတွက် မှန်းချက်ထုတ်ပေးသည်)
        var workingDaysThisMonth = 0;
        var _daysInThisMo = new Date(parseInt(nowYear), parseInt(nowMonth), 0).getDate();
        for (var _wdi = 1; _wdi <= _daysInThisMo; _wdi++) {
            if (new Date(parseInt(nowYear), parseInt(nowMonth) - 1, _wdi).getDay() !== 0) workingDaysThisMonth++;
        }
        var autoGoalHours = loggedOtDaysThisMonth > 0
            ? Math.round((monthOtHours / loggedOtDaysThisMonth) * workingDaysThisMonth)
            : 60; // pace data မရှိသေးရင် (ဒီလ OT တစ်ရက်မှ မမှတ်ရသေးရင်) fallback
        var otGoalHours = _getOtGoalHours(autoGoalHours);
        var goalPct = otGoalHours > 0 ? Math.min(100, Math.round((monthOtHours / otGoalHours) * 100)) : 0;
        var RING_R = 30, RING_C = 2 * Math.PI * RING_R;
        var ringOffset = RING_C - (goalPct / 100) * RING_C;

        // Next holiday
        var nextHol = getNextHoliday();

        // ── Missing Days summary (above Goal Tracker) — ငွေ/အချိန် မပြဘဲ
        // Record မထည့်ရသေးတဲ့ ရက်အရေအတွက်နဲ့ ဘယ်ရက်တွေလဲဆိုတာကိုပဲ ပြသည်
        // (ယနေ့အထိ ကျော်လွန်ပြီးသား ရက်တွေကိုပဲ တွက်သည် — မလာသေးတဲ့ နောင်ရက်များကို မတွက်)
        var recByDate = {};
        monthRecs.forEach(function(r) { recByDate[String(r.date).padStart(2,'0')] = r; });
        var missingDates = [];
        for (var _d = 1; _d <= now.getDate(); _d++) {
            var _ds = String(_d).padStart(2,'0');
            if (!recByDate[_ds]) missingDates.push(_d);
        }
        var missingCount = missingDates.length;

        // Today total (for logged state)
        var todayTotal = 0;
        if (todayRec) {
            var wage = calcWage(todayRec.workHour, todayRec.perHour, todayRec.note);
            var noOt = todayRec.note === 'government_holiday' || todayRec.note === 'sunday_ot' || todayRec.note === 'sunday';
            var todayNsa = todayRec.note === 'sunday' ? 0 : calcNSA(todayRec.workIn, todayRec.nsa, todayRec.note);
            todayTotal = todayRec.note === 'sunday' ? 0 : wage + (noOt ? 0 : calcOtTotal(todayRec.otIn, todayRec.otOut, todayRec.otPay)) + todayNsa;
        }

        // Inject styles once
        if (!document.getElementById('home-style')) {
            var st = document.createElement('style');
            st.id = 'home-style';
            st.textContent = `
                .home-wrap {
                    display: flex;
                    flex-direction: column;
                    padding: 4px 0 40px 0;
                    gap: 12px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                /* ── Missing Days summary (above Goal Tracker) ── */
                .home-missing-card {
                    margin: 0 16px;
                    background: #f7f9fa;
                    border-radius: 16px;
                    padding: 14px 18px;
                }
                .home-missing-datehead {
                    font-size: 11.5px;
                    font-weight: 700;
                    color: #4a5568;
                    margin-bottom: 8px;
                }
                .home-missing-head {
                    display: flex;
                    align-items: baseline;
                    gap: 6px;
                }
                .home-missing-count { font-size: 22px; font-weight: 800; color: #c0392b; }
                .home-missing-count.zero { color: #2f6b3f; }
                .home-missing-label { font-size: 12px; color: #718096; font-weight: 600; }
                .home-missing-dates {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 10px;
                }
                .home-missing-chip {
                    font-size: 11.5px;
                    font-weight: 700;
                    color: #c0392b;
                    background: #fdecea;
                    padding: 4px 9px;
                    border-radius: 8px;
                }
                .home-missing-allgood {
                    font-size: 12px;
                    color: #2f6b3f;
                    font-weight: 600;
                    margin-top: 4px;
                }

                /* ── Today card ── */
                .home-today-card {
                    background: #fff;
                    border-radius: 10px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.07);
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                    margin: 0 16px;
                }
                .home-today-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .home-today-status {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .home-status-dot {
                    width: 12px; height: 12px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                .home-status-dot.on  {
                    background: #38a169;
                    box-shadow: 0 0 0 4px #c6f6d5;
                }
                .home-status-dot.off {
                    background: #e2e8f0;
                    box-shadow: 0 0 0 4px #f7f9fa;
                }
                .home-today-label { font-size: 15px; font-weight: 700; color: #1a202c; }
                .home-today-date-badge {
                    font-size: 12px; color: #a0aec0; font-weight: 500;
                    background: #f7f9fa; border-radius: 8px; padding: 3px 8px;
                }

                /* Logged state detail */
                .home-today-detail {
                    background: #f7f9fa;
                    border-radius: 12px;
                    padding: 12px 14px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .home-today-detail-left { display: flex; flex-direction: column; gap: 4px; }
                .home-today-note-badge {
                    display: inline-flex;
                    align-items: center;
                    font-size: 12px;
                    font-weight: 600;
                    padding: 3px 10px;
                    border-radius: 20px;
                    align-self: flex-start;
                }
                .home-today-times { font-size: 12px; color: #718096; }

                /* Not logged CTA */
                .home-today-cta {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #f7f9fa;
                    border-radius: 12px;
                    padding: 12px 14px;
                }
                .home-today-cta-icon {
                    width: 36px; height: 36px;
                    border-radius: 50%;
                    background: #1a4e8f;
                    display: flex; align-items: center; justify-content: center;
                    flex-shrink: 0;
                }
                .home-today-cta-text { display: flex; flex-direction: column; gap: 2px; }
                .home-today-cta-main { font-size: 14px; font-weight: 600; color: #1a202c; }
                .home-today-cta-sub  { font-size: 12px; color: #a0aec0; }

                /* ── Quick menu ── */
                .home-quick-wrap {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .home-quick-title {
                    font-size: 12px;
                    font-weight: 700;
                    color: #a0aec0;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    padding: 0 16px;
                }
                .home-quick-scroll {
                    display: flex;
                    flex-direction: row;
                    gap: 0;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    scroll-snap-type: x mandatory;
                    scrollbar-width: none;
                    background: #fff;
                    border-radius: 10px;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
                    padding: 16px 8px 14px 8px;
                    margin: 0 16px;
                }
                .home-quick-scroll::-webkit-scrollbar { display: none; }
                .home-quick-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    padding: 0 14px;
                    flex-shrink: 0;
                    scroll-snap-align: start;
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                    transition: opacity 0.15s;
                    min-width: 64px;
                }
                .home-quick-item:active { opacity: 0.5; }
                .home-quick-icon {
                    width: 52px; height: 52px;
                    border-radius: 50%;
                    border: 1.5px solid #e2e8f0;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }
                .home-quick-label {
                    font-size: 11px;
                    font-weight: 600;
                    color: #4a5568;
                    text-align: center;
                    line-height: 1.3;
                    white-space: nowrap;
                }
                .home-quick-divider {
                    width: 1px;
                    background: #f0f4f8;
                    margin: 8px 2px;
                    align-self: stretch;
                    flex-shrink: 0;
                }

                /* ── Holiday chip ── */
                .home-holiday-chip {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    background: #fff;
                    border-radius: 10px;
                    padding: 12px 14px;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.06);
                    margin: 0 16px;
                }
                .home-hol-icon {
                    font-size: 20px;
                    flex-shrink: 0;
                }
                .home-hol-info { display: flex; flex-direction: column; gap: 1px; flex: 1; }
                .home-hol-label { font-size: 11px; color: #a0aec0; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; }
                .home-hol-name  { font-size: 13px; font-weight: 600; color: #1a202c; }
                .home-holiday-chip .home-hol-count {
                    font-size: 12px; font-weight: 700;
                    padding: 3px 10px;
                    border-radius: 20px;
                    background: #ebf4ff;
                    color: #1a4e8f;
                    flex-shrink: 0;
                }
                .home-holiday-chip .home-hol-count.today-chip  { background: #c6f6d5; color: #276749; }
                .home-holiday-chip .home-hol-count.soon-chip   { background: #fef3c7; color: #b7791f; }

                /* Month days count badge (legacy — kept, unused by new glance card) */
                .home-month-badge {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 16px;
                }
                .home-month-badge-label { font-size: 13px; color: #718096; }
                .home-month-badge-val   { font-size: 13px; font-weight: 700; color: #1a4e8f; }

                /* ── Goal Tracker (Concept D) ── */
                .home-streak-row {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0 20px;
                }
                .home-streak-flame { font-size: 15px; }
                .home-streak-text { font-size: 12.5px; font-weight: 700; color: #2f6b3f; }
                .home-streak-text b { color: #1c2620; }

                .home-goal-card {
                    margin: 0 16px;
                    background: #fff;
                    border-radius: 20px;
                    padding: 18px 20px;
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                }
                .home-goal-ring-wrap { position: relative; width: 72px; height: 72px; flex: 0 0 auto; }
                .home-goal-ring-wrap svg { transform: rotate(-90deg); }
                .home-goal-ring-center {
                    position: absolute; inset: 0;
                    display: flex; flex-direction: column;
                    align-items: center; justify-content: center;
                }
                .home-goal-ring-pct { font-size: 14px; font-weight: 800; color: #1c2620; }
                .home-goal-ring-of  { font-size: 7.5px; color: #8a9a8f; font-weight: 600; }
                .home-goal-info-title {
                    font-size: 10.5px; font-weight: 700; color: #8a9a8f;
                    text-transform: uppercase; letter-spacing: .5px;
                }
                .home-goal-info-val { font-size: 18px; font-weight: 800; color: #1c2620; margin: 3px 0 2px; }
                .home-goal-info-sub { font-size: 10.5px; color: #a0aec0; }
            `;
            document.head.appendChild(st);
        }

        // ── Build HTML ─────────────────────────────────────────────────
        var noteColor = todayRec ? getNoteColor(todayRec.note) : '#718096';

        var todayDetailHTML = '';
        if (todayLogged) {
            var isTodaySunday = todayRec.note === 'sunday';
            var timeStr = '';
            if (!isTodaySunday) {
                if (todayRec.workIn && todayRec.workOut) {
                    timeStr = todayRec.workIn + ' → ' + todayRec.workOut;
                } else if (todayRec.workIn) {
                    timeStr = (window.t('rec_work_in') || 'In') + ': ' + todayRec.workIn;
                }
            }
            todayDetailHTML = `
                <div class="home-today-detail">
                    <div class="home-today-detail-left">
                        <span class="home-today-note-badge"
                            style="background:${noteColor}18;color:${noteColor};">
                            ${getNoteLabel(todayRec.note)}
                        </span>
                        ${timeStr ? '<span class="home-today-times">' + timeStr + '</span>' : ''}
                    </div>
                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">
                        ${(!isTodaySunday && todayRec.workHour) ? '<span style="font-size:13px;color:#a0aec0;">' + todayRec.workHour + ' hr</span>' : ''}
                        ${(!isTodaySunday && todayTotal > 0) ? '<span style="font-size:15px;font-weight:700;color:#1a4e8f;">฿' + parseFloat(todayTotal).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) + '</span>' : ''}
                    </div>
                </div>`;
        } else {
            todayDetailHTML = `
                <div class="home-today-cta" id="home-cta-record">
                    <div class="home-today-cta-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                    </div>
                    <div class="home-today-cta-text">
                        <span class="home-today-cta-main">${window.t('home_log_ot') || 'Log Overtime'}</span>
                        <span class="home-today-cta-sub">${window.t('home_today_tap') || "Tap to record today's OT"}</span>
                    </div>
                </div>`;
        }

        var holidayHTML = '';
        if (nextHol) {
            var chipClass = nextHol.diff === 0 ? 'today-chip' : nextHol.diff <= 3 ? 'soon-chip' : '';
            var countLabel = nextHol.diff === 0
                ? (window.t('home_today') || 'Today!')
                : nextHol.diff === 1
                    ? (window.t('home_tomorrow') || 'Tomorrow')
                    : nextHol.diff + ' ' + (window.t('home_days_away') || 'days');
            holidayHTML = `
                <div class="home-holiday-chip">
                    <span class="home-hol-icon">🇹🇭</span>
                    <div class="home-hol-info">
                        <span class="home-hol-label">${window.t('home_next_holiday') || 'Next Holiday'}</span>
                        <span class="home-hol-name">${nextHol.name}</span>
                    </div>
                    <span class="home-hol-count ${chipClass}">${countLabel}</span>
                </div>`;
        }

        // ── Export helpers ─────────────────────────────────────────────
        function fmt2(n) { return parseFloat(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}); }

        function doExport(type) {
            var allRecords = window.getRecords();
            if (!allRecords || allRecords.length === 0) {
                showToast(window.t('home_export_no_data') || 'No records to export');
                return;
            }
            var isEn = window.currentLang !== 'th';
            var mnames    = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            var mnames_sh = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            var mth_th    = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
            var mth_th_sh = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

            // ── Collect distinct year-month combos from records ──────────
            var comboSet = {};
            allRecords.forEach(function(r) {
                var y = r.year || String(now.getFullYear());
                var m = r.month;
                if (y && m) comboSet[y + '-' + m] = { y: y, m: m };
            });
            var combos = Object.values(comboSet).sort(function(a, b) {
                return (b.y + b.m).localeCompare(a.y + a.m);
            });

            // ── Month Picker Dialog ──────────────────────────────────────
            var pickerOverlay = document.createElement('div');
            pickerOverlay.className = 'dialog-overlay';
            pickerOverlay.style.zIndex = '99000';

            var optionsHTML = combos.map(function(c) {
                var mIdx = parseInt(c.m) - 1;
                var mLabel = isEn ? mnames[mIdx] : mth_th[mIdx];
                var count = allRecords.filter(function(r) {
                    return (r.year || String(now.getFullYear())) === c.y && r.month === c.m;
                }).length;
                return '<button class="home-export-month-btn" data-y="' + c.y + '" data-m="' + c.m + '" style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:13px 16px;border:2px solid transparent;background:#f7f9fa;border-radius:12px;cursor:pointer;font-family:inherit;-webkit-tap-highlight-color:transparent;margin-bottom:8px;transition:all 0.15s;">' +
                    '<div style="display:flex;align-items:center;gap:10px;">' +
                        '<div class="month-btn-check" style="width:20px;height:20px;border-radius:50%;border:2px solid #cbd5e0;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.15s;"></div>' +
                        '<span style="font-size:14px;font-weight:600;color:#1a202c;">' + mLabel + ' ' + c.y + '</span>' +
                    '</div>' +
                    '<span style="font-size:12px;color:#a0aec0;font-weight:500;">' + count + ' ' + window.t('export_records') + '</span>' +
                '</button>';
            }).join('');

            pickerOverlay.innerHTML =
                '<div class="dialog-box" style="max-height:80vh;overflow:hidden;display:flex;flex-direction:column;">' +
                    '<div class="dialog-title" style="margin-bottom:4px;">' + window.t('export_select_month') + '</div>' +
                    '<div class="dialog-msg" style="margin-bottom:12px;">' +
                        (type === 'pdf' ? '📄 PDF' : '📊 Excel') + ' — ' +
                        window.t('export_choose_desc') +
                    '</div>' +
                    '<div style="overflow-y:auto;max-height:260px;padding:0 2px;">' + optionsHTML + '</div>' +
                    '<div class="dialog-divider" style="margin-top:8px;"></div>' +
                    '<div class="dialog-btn-row" style="display:flex;justify-content:space-between;gap:10px;">' +
                        '<button id="home-export-cancel" class="dialog-btn dialog-btn-cancel">' +
                            '<div class="dialog-icon dialog-icon-cancel">' +
                                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
                            '</div>' +
                            '<span class="dialog-btn-label">' + window.t('cancel') + '</span>' +
                        '</button>' +
                        '<button id="home-export-download" class="dialog-btn dialog-btn-confirm" disabled style="opacity:0.35;pointer-events:none;">' +
                            '<div class="dialog-icon" style="background:#1a4e8f;box-shadow:0 2px 6px rgba(26,78,143,0.25);">' +
                                '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' +
                            '</div>' +
                            '<span class="dialog-btn-label confirm">' + window.t('export_download_btn') + '</span>' +
                        '</button>' +
                    '</div>' +
                '</div>';

            document.body.appendChild(pickerOverlay);

            var selectedY = null, selectedM = null;
            var dlBtn = document.getElementById('home-export-download');

            pickerOverlay.querySelectorAll('.home-export-month-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    // Deselect all
                    pickerOverlay.querySelectorAll('.home-export-month-btn').forEach(function(b) {
                        b.style.background    = '#f7f9fa';
                        b.style.borderColor   = 'transparent';
                        var chk = b.querySelector('.month-btn-check');
                        chk.style.background  = '#fff';
                        chk.style.borderColor = '#cbd5e0';
                        chk.innerHTML         = '';
                    });
                    // Select this
                    btn.style.background  = '#eef3fb';
                    btn.style.borderColor = '#1a4e8f';
                    var chk = btn.querySelector('.month-btn-check');
                    chk.style.background  = '#1a4e8f';
                    chk.style.borderColor = '#1a4e8f';
                    chk.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

                    selectedY = btn.dataset.y;
                    selectedM = btn.dataset.m;

                    // Enable download btn
                    dlBtn.disabled = false;
                    dlBtn.style.opacity       = '1';
                    dlBtn.style.pointerEvents = 'auto';
                });
                btn.addEventListener('mouseenter', function() { if (btn.style.borderColor !== 'rgb(26, 78, 143)') btn.style.background = '#edf2f7'; });
                btn.addEventListener('mouseleave', function() { if (btn.style.borderColor !== 'rgb(26, 78, 143)') btn.style.background = '#f7f9fa'; });
            });

            document.getElementById('home-export-cancel').addEventListener('click', function() {
                pickerOverlay.remove();
            });

            dlBtn.addEventListener('click', function() {
                if (!selectedY || !selectedM) return;
                pickerOverlay.remove();
                try {
                    _runExport(type, selectedY, selectedM);
                } catch (e) {
                    showToast(window.currentLang === 'th' ? 'ส่งออกไม่สำเร็จ' : 'Export failed — please try again');
                }
            });
        }

        function _runExport(type, nowY, nowM) {
            var records = window.getRecords();
            var isEn = window.currentLang !== 'th';
            var mnames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            var mth_th = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
            var mLabel = isEn ? mnames[parseInt(nowM)-1] : mth_th[parseInt(nowM)-1];

            function _calcWage(wh, ph, note) {
                wh = parseFloat(wh)||0; ph = parseFloat(ph)||0;
                if (note === 'sunday_ot')          return wh * ph * 2;
                if (note === 'government_holiday') return wh * ph;
                if (note === 'sunday')             return 0;
                return wh * ph;
            }
            // Canvas ဆွဲရန်အတွက် သီးခြား Helper function 
            function generateSlipCanvas(filteredRecords) {
                var rowH  = 36, headerH = 120, footerH = 60;
                var W     = 640, H = headerH + filteredRecords.length * rowH + footerH + 20;
                var canvas = document.createElement('canvas');
                canvas.width  = W;
                canvas.height = H;
                var ctx = canvas.getContext('2d');

                // Background
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, W, H);

                // Header bar
                ctx.fillStyle = '#1a4e8f';
                ctx.fillRect(0, 0, W, headerH - 20);

                // Title
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 22px -apple-system, sans-serif';
                ctx.fillText('Overtime Tracker', 30, 36);
                ctx.font = '14px -apple-system, sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.fillText(mLabel + ' ' + nowY, 30, 58);
                ctx.fillText((type === 'pdf' ? 'Payslip Report' : 'Export Excel Data'), 30, 78);

                // Type badge
                ctx.fillStyle = type === 'pdf' ? '#e53e3e' : '#38a169';
                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(W - 100, 20, 70, 26, 6);
                } else {
                    ctx.rect(W - 100, 20, 70, 26);
                }
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px -apple-system, sans-serif';
                ctx.fillText(type === 'pdf' ? 'PDF' : 'EXCEL', W - 85, 37);

                // Column headers
                var cols = { date:30, note:90, workHr:260, wage:340, ot:430, total:530 };
                var y = headerH + 4;
                ctx.fillStyle = '#f7f9fa';
                ctx.fillRect(0, y - 18, W, rowH);
                ctx.fillStyle = '#718096';
                ctx.font = 'bold 11px -apple-system, sans-serif';
                ['Date','Type','Work Hr','Wage','OT Pay','Total'].forEach(function(h,i) {
                    var x = [cols.date, cols.note, cols.workHr, cols.wage, cols.ot, cols.total][i];
                    ctx.fillText(h, x, y);
                });

                // Rows
                var grandTotal = 0;
                filteredRecords.forEach(function(r, idx) {
                    y += rowH;
                    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f7faff';
                    ctx.fillRect(0, y - 22, W, rowH);

                    var wage = _calcWage(r.workHour, r.perHour, r.note);
                    var noOt = r.note === 'government_holiday' || r.note === 'sunday_ot';
                    var ot   = noOt ? 0 : _calcOt(r.otIn, r.otOut, r.otPay);
                    var tot  = wage + ot;
                    grandTotal += tot;

                    ctx.fillStyle = '#1a202c';
                    ctx.font = '13px -apple-system, sans-serif';
                    ctx.fillText(String(r.date).padStart(2,'0'), cols.date, y);
                    ctx.fillText(getNoteLabel(r.note).substring(0,12), cols.note, y);
                    ctx.fillText(r.workHour || '—', cols.workHr, y);
                    ctx.fillText('฿' + fmt2(wage), cols.wage, y);
                    ctx.fillText(ot > 0 ? '฿' + fmt2(ot) : '—', cols.ot, y);
                    ctx.font = 'bold 13px -apple-system, sans-serif';
                    ctx.fillText('฿' + fmt2(tot), cols.total, y);
                });

                // Footer total
                y += rowH;
                ctx.fillStyle = '#1a4e8f';
                ctx.fillRect(0, y - 22, W, rowH + 4);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 14px -apple-system, sans-serif';
                ctx.fillText(isEn ? 'Grand Total' : 'รวมทั้งหมด', cols.date, y);
                ctx.fillText('฿' + fmt2(grandTotal), cols.total, y);

                // Bottom note
                ctx.fillStyle = '#a0aec0';
                ctx.font = '11px -apple-system, sans-serif';
                ctx.fillText('Generated: ' + new Date().toLocaleDateString(), 30, y + 34);

                return canvas;
            }

            function _calcOt(otIn, otOut, otPay) {
                if (!otIn || !otOut || !otPay) return 0;
                var inM  = parseInt(otIn.split(':')[0])*60  + parseInt(otIn.split(':')[1]);
                var outM = parseInt(otOut.split(':')[0])*60 + parseInt(otOut.split(':')[1]);
                if (outM <= inM) outM += 1440;
                return ((outM - inM) / 60) * (parseFloat(otPay)||0);
            }
            function _noteLabel(note) { return getNoteLabel(note); }

            var filtered = records
                .filter(function(r){ return r.month === nowM && (r.year||nowY) === nowY; })
                .sort(function(a,b){ return parseInt(a.date) - parseInt(b.date); });

            var rows = filtered.map(function(r) {
                var isSunday = r.note === 'sunday';
                var wage = _calcWage(r.workHour, r.perHour, r.note);
                var noOt = r.note === 'government_holiday' || r.note === 'sunday_ot' || isSunday;
                var ot   = noOt ? 0 : _calcOt(r.otIn, r.otOut, r.otPay);
                var tot  = isSunday ? 0 : wage + ot;
                return {
                    date:     String(r.date).padStart(2,'0') + ' ' + mLabel + ' ' + nowY,
                    note:     _noteLabel(r.note),
                    workIn:   isSunday ? '—' : (r.workIn  || '—'),
                    workOut:  isSunday ? '—' : (r.workOut || '—'),
                    otIn:     isSunday ? '—' : (r.otIn    || '—'),
                    otOut:    isSunday ? '—' : (r.otOut   || '—'),
                    workHour: isSunday ? '—' : (r.workHour|| '—'),
                    perHour:  isSunday ? '—' : (r.perHour || '—'),
                    wage:     isSunday ? '—' : parseFloat(wage).toFixed(2),
                    otPay:    isSunday ? '—' : parseFloat(ot).toFixed(2),
                    total:    isSunday ? '—' : parseFloat(tot).toFixed(2),
                    grandNum: isSunday ? 0 : tot
                };
            });

            var grandTotal = rows.reduce(function(s,r){ return s + r.grandNum; }, 0);
            var filename   = 'OT_' + nowY + '_' + nowM;

            if (type === 'excel') {
                var header = ['Date','Type','Work In','Work Out','OT In','OT Out','Work Hr','Per Hr','Wage','OT Pay','Total'];
                var csvRows = [header.join(',')];
                rows.forEach(function(r) {
                    csvRows.push([
                        r.date, r.note,
                        r.workIn, r.workOut, r.otIn, r.otOut,
                        r.workHour, r.perHour, r.wage, r.otPay, r.total
                    ].map(function(v){ return '"' + String(v).replace(/"/g,'""') + '"'; }).join(','));
                });
                csvRows.push(['','','','','','','','','Grand Total','', parseFloat(grandTotal).toFixed(2)].join(','));
                var csvContent = '\uFEFF' + csvRows.join('\r\n');
                var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                _triggerDownload(blob, filename + '.csv');
                showToast('📊 ' + (isEn ? 'Excel saved!' : 'บันทึก Excel แล้ว!'));
            } else {
                function _buildPdf() {
                    var jsPDF = window.jspdf && window.jspdf.jsPDF;
                    if (!jsPDF) { showToast('PDF library not loaded'); return; }
                    var doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
                    var W = doc.internal.pageSize.getWidth();
                    var pageH = doc.internal.pageSize.getHeight();
                    var margin = 14, y = margin;

                    doc.setFillColor(26, 78, 143);
                    doc.roundedRect(margin, y, W - margin*2, 22, 3, 3, 'F');
                    doc.setTextColor(255,255,255);
                    doc.setFontSize(13); doc.setFont('helvetica','bold');
                    doc.text('Overtime Tracker — Payslip', margin + 5, y + 8);
                    doc.setFontSize(9); doc.setFont('helvetica','normal');
                    doc.text(mLabel + ' ' + nowY, margin + 5, y + 15);
                    doc.text('Generated: ' + new Date().toLocaleDateString(), W - margin - 48, y + 8);
                    y += 28;

                    var cols = [
                        {label:'Date',w:22},{label:'Type',w:22},{label:'Work In/Out',w:30},
                        {label:'OT In/Out',w:30},{label:'Wk Hr',w:14},{label:'Wage',w:20},
                        {label:'OT',w:18},{label:'Total',w:20}
                    ];
                    var rowH = 8, tableW = cols.reduce(function(s,c){return s+c.w;},0);
                    var startX = (W - tableW) / 2;

                    doc.setFillColor(240,244,248);
                    doc.rect(startX, y, tableW, rowH, 'F');
                    doc.setTextColor(71,85,105); doc.setFontSize(7.5); doc.setFont('helvetica','bold');
                    var cx = startX;
                    cols.forEach(function(c){ doc.text(c.label, cx+2, y+5.5); cx += c.w; });
                    y += rowH;

                    rows.forEach(function(r, idx) {
                        if (y + rowH > pageH - 20) { doc.addPage(); y = margin; }
                        if (idx % 2 === 1) { doc.setFillColor(247,250,255); doc.rect(startX, y, tableW, rowH, 'F'); }
                        doc.setTextColor(26,32,44); doc.setFontSize(7); doc.setFont('helvetica','normal');
                        cx = startX;
                        var wio = r.workIn === '—' ? '—' : r.workIn + '–' + r.workOut;
                        var oio = r.otIn   === '—' ? '—' : r.otIn  + '–' + r.otOut;
                        [r.date, r.note, wio, oio, r.workHour, r.wage, r.otPay, r.total].forEach(function(v,i){
                            doc.text(String(v), cx+2, y+5.5); cx += cols[i].w;
                        });
                        y += rowH;
                    });

                    if (y + rowH > pageH - 20) { doc.addPage(); y = margin; }
                    doc.setFillColor(26,78,143); doc.rect(startX, y, tableW, rowH, 'F');
                    doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont('helvetica','bold');
                    doc.text('Grand Total', startX+2, y+5.5);
                    doc.text(parseFloat(grandTotal).toFixed(2), startX+tableW-18, y+5.5);

                    var pdfBlob = doc.output('blob');
                    _triggerDownload(pdfBlob, filename + '.pdf');
                    showToast('📄 ' + (isEn ? 'PDF saved!' : 'บันทึก PDF แล้ว!'));
                }

                if (window.jspdf && window.jspdf.jsPDF) {
                    try {
                        _buildPdf();
                    } catch (e) {
                        showToast(isEn ? 'PDF export failed — please try again' : 'ส่งออก PDF ไม่สำเร็จ — ลองใหม่อีกครั้ง');
                    }
                } else {
                    showToast(isEn ? 'Loading PDF engine…' : 'กำลังโหลด…');
                    var script = document.createElement('script');
                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                    // script.onload ကနေ async ခေါ်တာမို့ dlBtn click handler ရဲ့ ပြင်ပ
                    // try/catch က ဒီထဲက error ကို လုံးဝ မဖမ်းနိုင်ပါ (silent fail ဖြစ်ခဲ့ရတဲ့
                    // root cause) — ဒီနေရာမှာ ကိုယ်တိုင် try/catch ခံပေးရသည်
                    script.onload  = function() {
                        try {
                            _buildPdf();
                        } catch (e) {
                            showToast(isEn ? 'PDF export failed — please try again' : 'ส่งออก PDF ไม่สำเร็จ — ลองใหม่อีกครั้ง');
                        }
                    };
                    script.onerror = function() { showToast(isEn ? 'PDF library failed to load — check your internet connection' : 'โหลดไลบรารี PDF ไม่สำเร็จ — ตรวจสอบอินเทอร์เน็ต'); };
                    document.head.appendChild(script);
                }
            }
        }

        function _triggerDownload(blob, filename) {
            // ── Mobile share sheet (iOS / Android) ───────────────────────
            // TrebEdit/WebView ကဲ့သို့ browser တချို့မှာ navigator.share/canShare
            // ရှိပုံပေါ်ပေမဲ့ file ပါတဲ့ share ကို မ support လုပ်ရင် canShare() က
            // error throw လုပ်တတ်ပါတယ် (false ပြန်မယ့်အစား) — try/catch မထားရင်
            // download လုံးဝ မထွက်တော့ဘဲ "Quick Action အလုပ်မလုပ်ဘူး" ဖြစ်နေခဲ့တာပါ
            try {
                if (navigator.share && navigator.canShare) {
                    var file = new File([blob], filename, { type: blob.type });
                    if (navigator.canShare({ files: [file] })) {
                        navigator.share({ files: [file], title: filename })
                            .catch(function(err) {
                                if (err && err.name !== 'AbortError') { _fallbackDownload(blob, filename); }
                            });
                        return;
                    }
                }
            } catch (e) {
                // share API ကနေ error တက်ခဲ့ရင် fallback download ကို ဆက်သုံးမယ်
            }
            _fallbackDownload(blob, filename);
        }

        function _fallbackDownload(blob, filename) {
            try {
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(function() {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 500);
            } catch (e) {
                showToast(window.currentLang === 'th' ? 'ดาวน์โหลดไม่สำเร็จ' : 'Download failed — please try again');
            }
        }

        function showToast(msg) {
            var old = document.getElementById('home-toast');
            if (old) old.remove();
            var t = document.createElement('div');
            t.id = 'home-toast';
            t.textContent = msg;
            t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#1a202c;color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;font-weight:600;z-index:9999;opacity:0;transition:opacity 0.2s;pointer-events:none;white-space:nowrap;';
            document.body.appendChild(t);
            requestAnimationFrame(function() { t.style.opacity = '1'; });
            setTimeout(function() {
                t.style.opacity = '0';
                setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
            }, 2500);
        }

        // ── PIN gate wrapper ──────────────────────────────────────────
        function withPin(action) {
            if (sessionStorage.getItem('pin_unlocked') === '1') {
                action();
                return;
            }
            if (!localStorage.getItem('app_pin')) {
                action();
                return;
            }
            var bottomNav = document.getElementById('main-bottom-nav');
            if (bottomNav) bottomNav.classList.add('hidden');

            var gateRoot = document.getElementById('pin-gate-root');
            if (!gateRoot) {
                gateRoot = document.createElement('div');
                gateRoot.id = 'pin-gate-root';
                gateRoot.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100vh;z-index:9100;background:#fff;display:flex;flex-direction:column;';
                document.body.appendChild(gateRoot);
            }

            if (typeof window.showPinScreen === 'function') {
                window.showPinScreen('verify', function() {
                    sessionStorage.setItem('pin_unlocked', '1');
                    var el = document.getElementById('pin-gate-root');
                    if (el) el.remove();
                    if (bottomNav) bottomNav.classList.remove('hidden');
                    action();
                });
            }
        }

        // setting-export.js ကလည်း ဒီ export logic တစ်ခုတည်းကိုပဲ ပြန်သုံးနိုင်အောင်
        // window ပေါ် expose ထားသည် (render() ခေါ်တိုင်း အသစ်ပြန် assign ဖြစ်သည်)
        window.doExport   = doExport;
        window._runExport = _runExport;
        window.withPin    = withPin;
        window.showToast  = showToast;

        var quickItems = [
            {
                id:    'qm-export-pdf',
                label: window.t('home_qm_pdf') || 'Export PDF',
                icon:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
                action: function() {
                    withPin(function() {
                        window._pendingAfterSettingLoad = function() {
                            if (typeof window.openExportDetailView === 'function') {
                                window.openExportDetailView('pdf', null, null, true);
                            } else {
                                doExport('pdf'); // fallback
                            }
                            window._pendingAfterSettingLoad = null;
                        };
                        window.switchTab('setting');
                    });
                }
            },
            {
                id:    'qm-export-excel',
                label: window.t('home_qm_excel') || 'Export Excel',
                icon:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"></rect><line x1="2" y1="9" x2="22" y2="9"></line><line x1="2" y1="15" x2="22" y2="15"></line><line x1="8" y1="9" x2="8" y2="21"></line><line x1="14" y1="9" x2="14" y2="21"></line></svg>`,
                action: function() {
                    withPin(function() {
                        window._pendingAfterSettingLoad = function() {
                            if (typeof window.openExportDetailView === 'function') {
                                window.openExportDetailView('excel', null, null, true);
                            } else {
                                doExport('excel'); // fallback
                            }
                            window._pendingAfterSettingLoad = null;
                        };
                        window.switchTab('setting');
                    });
                }
            },
            {
                id:    'qm-holiday',
                label: window.t('menu_holiday') || 'Holiday',
                icon:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4a5568" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><circle cx="8" cy="15" r="1" fill="#4a5568"></circle><circle cx="12" cy="15" r="1" fill="#4a5568"></circle><circle cx="16" cy="15" r="1" fill="#4a5568"></circle></svg>`,
                action: function() {
                    withPin(function() {
                        window._pendingAfterSettingLoad = function() {
                            if (typeof window.openHolidaySubLayout === 'function') {
                                window.openHolidaySubLayout();
                            }
                            window._pendingAfterSettingLoad = null;
                        };
                        window.switchTab('setting');
                    });
                }
            }
        ];

        var wrap = document.createElement('div');
        wrap.className = 'home-wrap';
        wrap.innerHTML = `
            <div class="home-today-card">
                <div class="home-today-top">
                    <div class="home-today-status">
                        <div class="home-status-dot ${todayLogged ? 'on' : 'off'}"></div>
                        <span class="home-today-label">
                            ${todayLogged
                                ? (window.t('home_today_logged') || 'Today Logged')
                                : (window.t('home_today_none')   || 'No Record Today')}
                        </span>
                    </div>
                    <span class="home-today-date-badge">${today} ${getMonthName(nowMonth, true)}</span>
                </div>
                ${todayDetailHTML}
            </div>

            <div class="home-missing-card">
                <div class="home-missing-datehead">${getDayName()}, ${getMonthName(nowMonth, true)} ${now.getDate()}</div>
                <div class="home-missing-head">
                    <span class="home-missing-count${missingCount === 0 ? ' zero' : ''}">${missingCount}</span>
                    <span class="home-missing-label">${window.t('home_days_missing') || 'days missing this month'}</span>
                </div>
                ${missingCount > 0
                    ? '<div class="home-missing-dates">' + missingDates.map(function(d) {
                        return '<span class="home-missing-chip">' + d + ' ' + getMonthName(nowMonth, true) + '</span>';
                    }).join('') + '</div>'
                    : '<div class="home-missing-allgood">✓ ' + (window.t('home_all_caught_up') || "You're all caught up!") + '</div>'}
            </div>

            <div class="home-streak-row">
                <span class="home-streak-flame">🔥</span>
                <span class="home-streak-text">${loggingStreak > 0
                    ? '<b>' + loggingStreak + '-' + (window.t('home_day_short') || 'day') + '</b> ' + (window.t('home_streak_msg') || 'logging streak — keep it going!')
                    : (window.t('home_streak_start') || 'Log today to start a streak!')}</span>
            </div>

            <div class="home-goal-card" id="home-goal-card">
                <div class="home-goal-ring-wrap">
                    <svg width="72" height="72" viewBox="0 0 72 72">
                        <circle cx="36" cy="36" r="30" fill="none" stroke="#eef1ec" stroke-width="7"/>
                        <circle cx="36" cy="36" r="30" fill="none" stroke="#2f6b3f" stroke-width="7"
                            stroke-linecap="round" stroke-dasharray="${RING_C.toFixed(1)}" stroke-dashoffset="${ringOffset.toFixed(1)}"/>
                    </svg>
                    <div class="home-goal-ring-center">
                        <span class="home-goal-ring-pct">${goalPct}%</span>
                        <span class="home-goal-ring-of">${window.t('home_goal_of') || 'OF GOAL'}</span>
                    </div>
                </div>
                <div>
                    <div class="home-goal-info-title">${window.t('home_ot_goal') || 'Monthly OT Goal'}</div>
                    <div class="home-goal-info-val">${monthOtHours.toFixed(1)} / ${otGoalHours}h</div>
                    <div class="home-goal-info-sub">${window.t('home_goal_tap') || 'Tap to change your goal'}</div>
                </div>
            </div>

            <div class="home-quick-wrap">
                <span class="home-quick-title">${window.t('home_quick_actions') || 'Quick Actions'}</span>
                <div class="home-quick-scroll">
                    ${quickItems.map(function(q) {
                        if (q.sep) return '<div class="home-quick-divider"></div>';
                        return `<div class="home-quick-item" id="${q.id}">
                            <div class="home-quick-icon">${q.icon}</div>
                            <span class="home-quick-label">${q.label}</span>
                        </div>`;
                    }).join('')}
                </div>
            </div>

            ${holidayHTML}
        `;

        container.innerHTML = '';
        container.appendChild(wrap);

        // Greeting text (icon မပါ) ကို app.js ရဲ့ header avatar ဘေးမှာ ထားမယ်
        // (renderGlobalHeader က header ကို tab ပြောင်းတိုင်း အသစ်ပြန်ဆွဲလို့ — Home ကနေ
        // တခြား tab ကို ပြောင်းလိုက်ရင် ဒီစာသားလည်း အလိုအလျောက် ပျောက်သွားမယ်)
        var greetSlot = document.getElementById('header-greeting-slot');
        if (greetSlot) {
            greetSlot.textContent = getGreeting();
        }

        // ── Events ────────────────────────────────────────────────────
        document.getElementById('home-cta-record')?.addEventListener('click', function() {
            if (typeof window.switchTab === 'function') window.switchTab('record');
        });

        document.getElementById('home-goal-card')?.addEventListener('click', function() {
            var overlay = document.createElement('div');
            overlay.className = 'dialog-overlay';
            overlay.style.zIndex = '99000';
            overlay.innerHTML =
                '<div class="dialog-box">' +
                    '<div class="dialog-title">' + (window.t('home_ot_goal') || 'Monthly OT Goal') + '</div>' +
                    '<div class="dialog-msg" style="margin-bottom:12px;">' +
                        (window.t('home_goal_edit_desc') || 'Set your target OT hours for this month.') +
                    '</div>' +
                    '<input id="home-goal-input" type="number" min="1" step="1" value="' + otGoalHours + '" ' +
                        'style="width:100%;padding:12px 14px;border:1.5px solid #e2e8f0;border-radius:12px;font-size:16px;text-align:center;color:#1a202c;margin-bottom:14px;box-sizing:border-box;outline:none;">' +
                    '<div class="dialog-divider"></div>' +
                    '<div class="dialog-btn-row" style="display:flex;justify-content:space-between;gap:10px;">' +
                        '<button id="home-goal-cancel" class="dialog-btn dialog-btn-cancel">' +
                            '<div class="dialog-icon dialog-icon-cancel">' +
                                '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
                            '</div>' +
                            '<span class="dialog-btn-label">' + (window.t('cancel') || 'Cancel') + '</span>' +
                        '</button>' +
                        '<button id="home-goal-save" class="dialog-btn dialog-btn-confirm">' +
                            '<div class="dialog-icon" style="background:#2f6b3f;box-shadow:0 2px 6px rgba(47,107,63,0.25);">' +
                                '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' +
                            '</div>' +
                            '<span class="dialog-btn-label confirm">' + (window.t('save') || 'Save') + '</span>' +
                        '</button>' +
                    '</div>' +
                '</div>';
            document.body.appendChild(overlay);

            document.getElementById('home-goal-cancel').addEventListener('click', function() { overlay.remove(); });
            document.getElementById('home-goal-save').addEventListener('click', function() {
                var v = parseFloat(document.getElementById('home-goal-input').value);
                if (v && v > 0) _setOtGoalHours(v);
                overlay.remove();
                render();
            });
        });

        quickItems.forEach(function(q) {
            if (q.sep) return;
            document.getElementById(q.id)?.addEventListener('click', function() {
                if (typeof q.action === 'function') q.action();
            });
        });
    }

    render();
};
