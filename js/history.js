// ==========================================
// history.js — History View
// window.views.history
// ==========================================

window.views.history = function(container) {

    // ── Helpers (shared logic) ─────────────────────────────────────────
    function calcWage(workHr, perHr, note) {
        var wh = parseFloat(workHr) || 0;
        var ph = parseFloat(perHr)  || 0;
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

    function calcOtHours(otIn, otOut) {
        if (!otIn || !otOut) return 0;
        var inM  = parseInt(otIn.split(':')[0])  * 60 + parseInt(otIn.split(':')[1]);
        var outM = parseInt(otOut.split(':')[0]) * 60 + parseInt(otOut.split(':')[1]);
        if (outM <= inM) outM += 24 * 60;
        return (outM - inM) / 60;
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

    function fmt(n) {
        return parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function getMonthName(m, short) {
        var isEn = window.currentLang !== 'th';
        var full_en  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        var short_en = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        var full_th  = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
        var short_th = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
        if (isEn) return (short ? short_en : full_en)[parseInt(m) - 1] || m;
        return (short ? short_th : full_th)[parseInt(m) - 1] || m;
    }

    // ── Group records by year+month ───────────────────────────────────
    function groupByMonth(records) {
        var groups = {};
        var now = new Date();
        records.forEach(function(r) {
            var y = r.year || String(now.getFullYear());
            var key = y + '-' + r.month;
            if (!groups[key]) groups[key] = { year: y, month: r.month, records: [] };
            groups[key].records.push(r);
        });
        // Sort newest first
        return Object.keys(groups).sort(function(a, b) {
            return b.localeCompare(a);
        }).map(function(k) { return groups[k]; });
    }

    // ── Compute month summary ─────────────────────────────────────────
    function computeMonthSummary(recs) {
        var grandTotal  = 0;
        var totalOtHrs  = 0;
        var totalNsa    = 0;
        var workDays    = recs.length;
        var sundayOtDays = 0;

        recs.forEach(function(r) {
            var wage     = calcWage(r.workHour, r.perHour, r.note);
            var isSunday = r.note === 'sunday';
            var isNoOt   = r.note === 'government_holiday' || r.note === 'sunday_ot' || isSunday;
            var ot       = isNoOt ? 0 : calcOtTotal(r.otIn, r.otOut, r.otPay);
            var nsa      = isSunday ? 0 : calcNSA(r.workIn, r.nsa, r.note);
            // sunday = 0 (record.js total column အတိုင်း)
            grandTotal  += isSunday ? 0 : (parseFloat(wage) + parseFloat(ot) + parseFloat(nsa));
            totalNsa    += nsa;
            // OT hours — noOt note မပါ + otIn/otOut နှစ်ခုလုံး ရှိမှသာ တွက်
            if (!isNoOt && r.otIn && r.otOut && r.otIn !== '' && r.otOut !== '') {
                totalOtHrs += calcOtHours(r.otIn, r.otOut);
            }
            if (r.note === 'sunday_ot') sundayOtDays++;
        });

        return {
            grandTotal:   grandTotal,
            totalNsa:     totalNsa,
            totalOtHrs:   totalOtHrs,
            workDays:     workDays,
            sundayOtDays: sundayOtDays
        };
    }

    // ── State ─────────────────────────────────────────────────────────
    var expandedKeys  = {};   // { 'yyyy-mm': true }
    var selectedKeys  = {};   // { 'yyyy-mm': true }
    var selectMode    = false;

    // ── Render ────────────────────────────────────────────────────────
    function render() {
        var records = window.getRecords();
        var months  = groupByMonth(records);

        container.innerHTML = '';

        // Inject styles once
        if (!document.getElementById('hist-style')) {
            var st = document.createElement('style');
            st.id  = 'hist-style';
            st.textContent = `
                .hist-page { padding: 8px 16px 48px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

                /* Toolbar */
                .hist-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 4px 0 12px 0;
                    min-height: 40px;
                }
                .hist-toolbar-left { display: flex; align-items: center; gap: 10px; }
                .hist-count {
                    font-size: 13px; color: #a0aec0; font-weight: 500;
                }
                .hist-btn {
                    padding: 7px 14px;
                    border-radius: 20px;
                    border: none;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    font-family: inherit;
                    -webkit-tap-highlight-color: transparent;
                    transition: opacity 0.15s;
                }
                .hist-btn:active { opacity: 0.7; }
                .hist-btn-select  { background: #ebf4ff; color: #1a4e8f; }
                .hist-btn-selall  { background: #e6fffa; color: #276749; }
                .hist-btn-cancel  { background: #f7f9fa; color: #718096; }
                .hist-btn-delete  { background: #fff5f5; color: #c53030; }
                .hist-btn-delete:disabled { opacity: 0.4; pointer-events: none; }

                /* Month Card */
                .hist-card {
                    background: #fff;
                    border-radius: 16px;
                    box-shadow: 0 1px 4px rgba(0,0,0,0.07);
                    margin-bottom: 12px;
                    overflow: hidden;
                    transition: box-shadow 0.15s;
                }
                .hist-card.hist-card-selected {
                    box-shadow: 0 0 0 2px #1a4e8f, 0 2px 8px rgba(26,78,143,0.12);
                }

                /* Card Header */
                .hist-card-head {
                    display: flex;
                    align-items: center;
                    padding: 16px 16px;
                    cursor: pointer;
                    -webkit-tap-highlight-color: transparent;
                    gap: 12px;
                }
                .hist-check {
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    border: 2px solid #e2e8f0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    transition: all 0.15s;
                }
                .hist-check.checked {
                    background: #1a4e8f;
                    border-color: #1a4e8f;
                }
                .hist-check svg { display: none; }
                .hist-check.checked svg { display: block; }

                .hist-card-month {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .hist-month-label {
                    font-size: 15px;
                    font-weight: 700;
                    color: #1a202c;
                }
                .hist-month-days {
                    font-size: 12px;
                    color: #a0aec0;
                    font-weight: 400;
                }
                .hist-card-total {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 3px;
                }
                .hist-total-amount {
                    font-size: 17px;
                    font-weight: 700;
                    color: #1a4e8f;
                }
                .hist-expand-icon {
                    margin-left: 6px;
                    transition: transform 0.25s cubic-bezier(0.16,1,0.3,1);
                    flex-shrink: 0;
                }
                .hist-expand-icon.open { transform: rotate(180deg); }

                /* Expand Body */
                .hist-expand-body {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.35s cubic-bezier(0.16,1,0.3,1);
                }
                .hist-expand-body.open {
                    max-height: 400px;
                }
                .hist-expand-inner {
                    border-top: 1px solid #f0f4f8;
                    padding: 14px 16px 16px 16px;
                    animation: histFadeIn 0.25s ease both;
                }
                @keyframes histFadeIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }

                /* Stats grid */
                .hist-stats-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr 1fr;
                    gap: 6px;
                    margin-bottom: 0;
                }
                .hist-stat-box {
                    background: #f7f9fa;
                    border-radius: 12px;
                    padding: 10px 6px 8px 6px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 3px;
                }
                .hist-stat-num {
                    font-size: 16px;
                    font-weight: 700;
                    color: #1a202c;
                    line-height: 1;
                }
                .hist-stat-lbl {
                    font-size: 9px;
                    color: #a0aec0;
                    font-weight: 600;
                    text-align: center;
                    text-transform: uppercase;
                    letter-spacing: 0.3px;
                }

                /* Empty */
                .hist-empty {
                    text-align: center;
                    padding: 60px 20px;
                    color: #a0aec0;
                    font-size: 14px;
                }
                .hist-empty-icon { font-size: 44px; margin-bottom: 14px; }
            `;
            document.head.appendChild(st);
        }

        var page = document.createElement('div');
        page.className = 'hist-page';

        // ── Toolbar ─────────────────────────────────────────────────
        var selCount = Object.keys(selectedKeys).length;
        var toolbar  = document.createElement('div');
        toolbar.className = 'hist-toolbar';

        if (!selectMode) {
            toolbar.innerHTML = `
                <span class="hist-count">${months.length} ${window.t('hist_months') || 'months'}</span>
                <button class="hist-btn hist-btn-select" id="hist-btn-select">
                    ${window.t('hist_select') || 'Select'}
                </button>
            `;
        } else {
            toolbar.innerHTML = `
                <div class="hist-toolbar-left">
                    <button class="hist-btn hist-btn-cancel" id="hist-btn-cancel">${window.t('hist_cancel') || 'Cancel'}</button>
                    <button class="hist-btn hist-btn-selall" id="hist-btn-selall">${window.t('hist_select_all') || 'All'}</button>
                </div>
                <button class="hist-btn hist-btn-delete" id="hist-btn-delete" ${selCount === 0 ? 'disabled' : ''}>
                    ${window.t('hist_delete') || 'Delete'} ${selCount > 0 ? '(' + selCount + ')' : ''}
                </button>
            `;
        }
        page.appendChild(toolbar);

        // ── Month Cards ──────────────────────────────────────────────
        if (months.length === 0) {
            var empty = document.createElement('div');
            empty.className = 'hist-empty';
            empty.innerHTML = '<div class="hist-empty-icon">🗂️</div><div>' + (window.t('no_data') || 'No records yet') + '</div>';
            page.appendChild(empty);
        } else {
            months.forEach(function(g) {
                var key     = g.year + '-' + g.month;
                var summary = computeMonthSummary(g.records);
                var isOpen  = !!expandedKeys[key];
                var isSel   = !!selectedKeys[key];

                var card = document.createElement('div');
                card.className = 'hist-card' + (isSel ? ' hist-card-selected' : '');
                card.setAttribute('data-key', key);

                var daysLabel = g.records.length + ' ' + (window.t('hist_days') || 'days');

                card.innerHTML = `
                    <div class="hist-card-head" id="head-${key}">
                        ${selectMode ? `
                        <div class="hist-check ${isSel ? 'checked' : ''}" id="chk-${key}">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>` : ''}
                        <div class="hist-card-month">
                            <span class="hist-month-label">${getMonthName(g.month)} ${g.year}</span>
                            <span class="hist-month-days">${daysLabel}</span>
                        </div>
                        <div class="hist-card-total">
                            <span class="hist-total-amount">฿${fmt(summary.grandTotal)}</span>
                        </div>
                        <svg class="hist-expand-icon ${isOpen ? 'open' : ''}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a0aec0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>

                    <div class="hist-expand-body ${isOpen ? 'open' : ''}" id="body-${key}">
                        <div class="hist-expand-inner">
                            <div class="hist-stats-grid">
                                <div class="hist-stat-box">
                                    <span class="hist-stat-num">${summary.totalOtHrs.toFixed(1)}</span>
                                    <span class="hist-stat-lbl">${window.t('hist_ot_hrs') || 'OT hrs'}</span>
                                </div>
                                <div class="hist-stat-box">
                                    <span class="hist-stat-num">${summary.workDays}</span>
                                    <span class="hist-stat-lbl">${window.t('hist_work_days') || 'Work Days'}</span>
                                </div>
                                <div class="hist-stat-box">
                                    <span class="hist-stat-num">${summary.sundayOtDays}</span>
                                    <span class="hist-stat-lbl">${window.t('hist_sun_ot') || 'Sun OT'}</span>
                                </div>
                                <div class="hist-stat-box">
                                    <span class="hist-stat-num">฿${fmt(summary.totalNsa)}</span>
                                    <span class="hist-stat-lbl">${window.t('rec_nsa_abbr') || 'NSA'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                page.appendChild(card);
            });
        }

        container.appendChild(page);

        // ── Event Bindings ───────────────────────────────────────────

        // Select / Cancel / Select All / Delete buttons
        document.getElementById('hist-btn-select')?.addEventListener('click', function() {
            selectMode = true;
            selectedKeys = {};
            render();
        });
        document.getElementById('hist-btn-cancel')?.addEventListener('click', function() {
            selectMode   = false;
            selectedKeys = {};
            render();
        });
        document.getElementById('hist-btn-selall')?.addEventListener('click', function() {
            var allSelected = Object.keys(selectedKeys).length === months.length;
            selectedKeys = {};
            if (!allSelected) {
                months.forEach(function(g) { selectedKeys[g.year + '-' + g.month] = true; });
            }
            render();
        });
        document.getElementById('hist-btn-delete')?.addEventListener('click', function() {
            var keysToDelete = Object.keys(selectedKeys);
            if (keysToDelete.length === 0) return;

            // Confirm dialog reuse
            if (typeof window.showExitConfirmationDialog === 'function') {
                // Build custom confirm using same overlay pattern
                var overlay = document.createElement('div');
                overlay.className = 'dialog-overlay';
                overlay.innerHTML = `
                    <div class="dialog-box">
                        <div class="dialog-title">${window.t('hist_delete_title') || 'Delete Records'}</div>
                        <div class="dialog-msg">${window.t('hist_delete_msg') || 'Delete selected months? This cannot be undone.'}</div>
                        <div class="dialog-divider"></div>
                        <div class="dialog-btn-row">
                            <button id="del-cancel" class="dialog-btn dialog-btn-cancel">
                                <div class="dialog-icon dialog-icon-cancel">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </div>
                                <span class="dialog-btn-label">${window.t('exit_dialog_no') || 'No'}</span>
                            </button>
                            <button id="del-confirm" class="dialog-btn dialog-btn-confirm">
                                <span class="dialog-btn-label confirm">${window.t('exit_dialog_yes') || 'Yes'}</span>
                                <div class="dialog-icon dialog-icon-delete">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14H6L5 6"></path><path d="M10 11v6M14 11v6"></path></svg>
                                </div>
                            </button>
                        </div>
                    </div>
                `;
                document.body.appendChild(overlay);
                overlay.querySelector('#del-cancel').addEventListener('click', function() { overlay.remove(); });
                overlay.querySelector('#del-confirm').addEventListener('click', function() {
                    overlay.remove();
                    var remaining = window.getRecords().filter(function(r) {
                        var now = new Date();
                        var y   = r.year || String(now.getFullYear());
                        var key = y + '-' + r.month;
                        return !selectedKeys[key];
                    });
                    window.saveRecords(remaining);
                    selectMode   = false;
                    selectedKeys = {};
                    expandedKeys = {};
                    render();
                });
            }
        });

        // Card tap — expand or select
        months.forEach(function(g) {
            var key  = g.year + '-' + g.month;
            var head = document.getElementById('head-' + key);
            if (!head) return;

            head.addEventListener('click', function() {
                if (selectMode) {
                    if (selectedKeys[key]) { delete selectedKeys[key]; }
                    else                   { selectedKeys[key] = true; }
                    render();
                } else {
                    if (expandedKeys[key]) { delete expandedKeys[key]; }
                    else                   { expandedKeys[key] = true; }
                    // Animate without full re-render
                    var body = document.getElementById('body-' + key);
                    var icon = head.querySelector('.hist-expand-icon');
                    if (body) body.classList.toggle('open', !!expandedKeys[key]);
                    if (icon) icon.classList.toggle('open', !!expandedKeys[key]);
                }
            });
        });
    }

    render();
};
