// ==========================================
// pin.js — PIN Gate (Create & Verify)
// ==========================================

window.showPinScreen = function(mode, onSuccess) {
    var isCreate = mode === 'create';
    var step = isCreate ? 'enter_new' : 'verify';
    var newPinTemp = '';
    var failCount = 0;

    // Welcome screen → Create PIN ဖြစ်တဲ့ ပထမဆုံးအကြိမ် flow (app_pin မရှိသေးတဲ့အချိန်)
    // ဒီ flow မှာ home layout ကို အလျှင်း မမြင်ရအောင် reveal/push-up animation ကို skip မယ်
    // (Settings ထဲက Change PIN flow ကတော့ app_pin ရှိနေပြီးသား ဖြစ်တဲ့အတွက် ပုံမှန် home reveal ဆက်ပြမယ်)
    var isFreshInstallCreate = isCreate && !localStorage.getItem('app_pin');

    function getStepLabel() {
        if (step === 'verify')    return window.t('verify_pin_enter');
        if (step === 'enter_new') return window.t('create_pin_enter');
        return window.t('create_pin_confirm');
    }

    function exitApp() {
        if (navigator.app && navigator.app.exitApp) {
            navigator.app.exitApp();
        } else if (window.close) {
            window.close();
        } else {
            document.body.innerHTML = '';
        }
    }


    // ==========================================
    // Home layout push up / pull down (KPlus style)
    // ==========================================
    function _animateHomeLayout(direction) {
        var homeEl = document.getElementById('home-layout') ||
                     document.getElementById('main-content') ||
                     document.querySelector('.home-root') ||
                     document.querySelector('body > main') ||
                     document.querySelector('#app-root') ||
                     null;
        if (!homeEl) return;
        homeEl.style.transformOrigin = 'top center';
        homeEl.style.willChange = 'transform';
        if (direction === 'up') {
            homeEl.classList.remove('home-pull-down');
            void homeEl.offsetWidth;
            homeEl.classList.add('home-push-up');
        } else {
            homeEl.classList.remove('home-push-up');
            void homeEl.offsetWidth;
            homeEl.classList.add('home-pull-down');
            setTimeout(function() {
                homeEl.classList.remove('home-pull-down');
                homeEl.style.willChange = '';
                homeEl.style.transform = '';
                homeEl.style.borderRadius = '';
            }, 450);
        }
    }

        function render(errorMsg) {
        errorMsg = errorMsg || '';

        var gateRoot = document.getElementById('pin-gate-root');
        if (!gateRoot) return;

        // First render check — home layout animation တစ်ကြိမ်သာ
        var isFirstRender = !gateRoot.querySelector('#pin-inner-wrap');

        // Welcome → Create PIN ပထမဆုံး flow ဖြစ်ရင် home layout (nav/tab) ကို လုံးဝမမြင်ရအောင်
        // push-up reveal ကို skip ပြီး root ကို opaque white ထားမယ် (Welcome screen ကနေ
        // ဆက်စပ်နေသလို sub-layout တစ်ခုလို feel ရအောင်)
        gateRoot.classList.toggle('pin-gate-opaque', isFreshInstallCreate);
        if (isFirstRender && !isFreshInstallCreate) { _animateHomeLayout('up'); }

        // Error render (PIN မှား၊ mismatch) မှာ slide-up animation မပါစေဘဲ ချက်ချင်းပြမယ်
        var slideClass = (isFirstRender && !errorMsg) ? 'pin-slide-up' : '';

        gateRoot.innerHTML = `
            <style>
                .pin-key-circle:active { background:#f0fdfb !important; }
                .pin-key-circle.del-key:active .pin-del-tag { transform:scale(0.9); }
                .pin-dot-circle.filled { background:#2dd4bf !important; }
                @keyframes pinSlideUp   { from { transform:translateY(100%); } to { transform:translateY(0); } }
                @keyframes pinSlideDown { from { transform:translateY(0); }    to { transform:translateY(100vh); } }
                @keyframes pinSlideLeft { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(-100%); } }
                @keyframes homePushUp   { from { transform:translateY(0) scale(1); border-radius:0px; } to { transform:translateY(-7%) scale(0.92); border-radius:18px; } }
                @keyframes homePullDown { from { transform:translateY(-7%) scale(0.92); border-radius:18px; } to { transform:translateY(0) scale(1); border-radius:0px; } }
                .pin-slide-up   { animation: pinSlideUp   0.38s cubic-bezier(0.32,0.72,0,1) forwards; }
                .pin-slide-down { animation: pinSlideDown 0.42s cubic-bezier(0.32,0.72,0,1) forwards; }
                .pin-slide-left { animation: pinSlideLeft 0.42s cubic-bezier(0.32,0.72,0,1) forwards; }
                #pin-gate-root  { background: transparent !important; }
                #pin-gate-root.pin-gate-opaque {
                    background:
                        radial-gradient(120% 55% at 50% -8%, rgba(26,78,143,0.14) 0%, rgba(26,78,143,0) 62%),
                        linear-gradient(180deg, #f3f8fc 0%, #ffffff 55%) !important;
                }
                .home-push-up   { animation: homePushUp   0.38s cubic-bezier(0.32,0.72,0,1) forwards !important; overflow:hidden !important; transform-origin:top center !important; }
                .home-pull-down { animation: homePullDown 0.42s cubic-bezier(0.32,0.72,0,1) forwards !important; overflow:hidden !important; transform-origin:top center !important; }
            </style>
            <div id="pin-inner-wrap" class="${slideClass}" style="display:flex;flex-direction:column;width:100%;height:100%;background:radial-gradient(120% 55% at 50% -8%, rgba(26,78,143,0.14) 0%, rgba(26,78,143,0) 62%), linear-gradient(180deg, #f3f8fc 0%, #ffffff 55%);position:absolute;top:0;left:0;right:0;bottom:0;align-items:center;justify-content:center;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

                <!-- Decorative blurred brand-color blobs (soft depth, replaces flat white bg) -->
                <div style="position:absolute;top:-70px;right:-70px;width:230px;height:230px;border-radius:50%;background:radial-gradient(circle, rgba(26,78,143,0.10) 0%, rgba(26,78,143,0) 70%);pointer-events:none;"></div>
                <div style="position:absolute;bottom:-90px;left:-70px;width:270px;height:270px;border-radius:50%;background:radial-gradient(circle, rgba(45,212,191,0.10) 0%, rgba(45,212,191,0) 70%);pointer-events:none;"></div>

                <!-- X Exit button -->
                <button id="pin-exit-btn" style="position:absolute;top:16px;right:16px;width:44px;height:44px;border-radius:50%;background:transparent;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:10;-webkit-tap-highlight-color:transparent;">
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9aa5b4" stroke-width="2.2" stroke-linecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <!-- Center group -->
                <div style="display:flex;flex-direction:column;align-items:center;width:100%;height:100%;padding-top:80px;box-sizing:border-box;">

                    <!-- Top block: profile / name / label / dots / error -->
                    <div style="display:flex;flex-direction:column;align-items:center;width:100%;">

                        <!-- Profile -->
                        <div class="pin-profile-avatar" style="width:76px;height:76px;border-radius:50%;overflow:hidden;margin-bottom:12px;display:flex;align-items:center;justify-content:center;background:#f1f5f9;border:1.5px solid #e2e8f0;flex-shrink:0;">
                            ${(typeof window.getProfilePhoto === 'function' && window.getProfilePhoto())
                                ? '<img src="' + window.getProfilePhoto() + '" style="width:100%;height:100%;object-fit:cover;" alt="profile">'
                                : '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#9aa5b4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>'}
                        </div>

                        <!-- Name -->
                        ${localStorage.getItem('ot_username') ? '<p style="font-size:16px;font-weight:600;color:#1a202c;margin:0 0 20px 0;text-align:center;">' + localStorage.getItem('ot_username') + '</p>' : ''}

                        <!-- Label -->
                        <p style="font-size:14px;font-weight:500;color:#64748b;margin:0 0 14px 0;letter-spacing:0.1px;text-align:center;">${getStepLabel()}</p>

                        <!-- PIN Dots -->
                        <div id="pin-dots" style="display:flex;gap:16px;margin-bottom:4px;align-items:center;">
                            ${[0,1,2,3,4,5].map(function() {
                                return '<div class="pin-dot-circle" style="width:16px;height:16px;border-radius:50%;border:1px solid #2dd4bf;background:transparent;transition:background 0.12s;flex-shrink:0;"></div>';
                            }).join('')}
                        </div>

                        <!-- Error message -->
                        <p id="pin-error" style="font-size:13px;color:#e53e3e;min-height:14px;margin:0 0 0 0;text-align:center;padding:0 46px;">${errorMsg}</p>

                        <!-- Forgot PIN link - verify mode only -->
                        ` + (!isCreate ? '<button id="pin-forgot-link" style="color:#2dd4bf;font-size:15px;text-decoration:underline;cursor:pointer;background:none;border:none;padding:0;-webkit-tap-highlight-color:transparent;font-family:inherit;">' + (window.t('forgot_pin') || 'Forgot your PIN?') + '</button>' : '') + `
                    </div>

                    <!-- Bottom block: keypad (table-grid style) — pinned to the bottom of the screen -->
                    <div style="width:100%;margin-top:auto;padding-bottom:env(safe-area-inset-bottom, 18px);">

                        <!-- Keypad -->
                        <div id="pin-keypad" style="width:100%;display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #e5e9f0;">
                            ${['1','2','3','4','5','6','7','8','9','','0','DEL'].map(function(key, idx) {
                                var isEmpty = key === '';
                                var isDel   = key === 'DEL';
                                var col     = idx % 3;
                                var cellStyle = 'width:100%;height:72px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;user-select:none;font-family:inherit;background:#fff;border:none;border-bottom:1px solid #e5e9f0;' + (col < 2 ? 'border-right:1px solid #e5e9f0;' : '');

                                if (isEmpty) {
                                    return '<div style="' + cellStyle + '"></div>';
                                }

                                if (isDel) {
                                    return '<button class="pin-key-circle del-key" data-key="DEL" aria-label="Delete" style="' + cellStyle + 'padding:0;">' +
                                        '<span class="pin-del-tag" style="width:26px;height:16px;background:#2dd4bf;clip-path:polygon(24% 0%,100% 0%,100% 100%,24% 100%,0% 50%);display:flex;align-items:center;justify-content:center;transition:transform 0.1s;">' +
                                            '<svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
                                            '<line x1="18" y1="6" x2="6" y2="18"/>' +
                                            '<line x1="6" y1="6" x2="18" y2="18"/>' +
                                            '</svg>' +
                                        '</span>' +
                                        '</button>';
                                }

                                return '<button class="pin-key-circle" data-key="' + key + '" style="' + cellStyle + 'font-size:24px;font-weight:400;color:#2dd4bf;">' + key + '</button>';
                            }).join('')}
                        </div>

                    </div>
                </div>
            </div>
            </div>
        `;

        // Exit button — verify mode: home ပြ၊ create mode: welcome screen ပြန်သွား
        gateRoot.querySelector('#pin-exit-btn').addEventListener('click', function() {
            var wrap = gateRoot.querySelector('#pin-inner-wrap');
            function doExit() {
                if (!isCreate) {
                    if (typeof window._loadTabDirect === 'function') {
                        window._loadTabDirect('home');
                    }
                } else {
                    if (typeof window.showWelcomeScreen === 'function') {
                        window.showWelcomeScreen(function() {
                            window.showPinScreen('create', onSuccess);
                        });
                    } else {
                        exitApp();
                    }
                }
            }
            if (wrap) {
                wrap.classList.remove('pin-slide-up');
                wrap.classList.add('pin-slide-down');
                if (!isFreshInstallCreate) { _animateHomeLayout('down'); }
                setTimeout(doExit, 420);
            } else {
                doExit();
            }
        });

        // Forgot PIN
        var forgotBtn = gateRoot.querySelector('#pin-forgot-link');
        if (forgotBtn) {
            forgotBtn.addEventListener('click', function() {
                showRecoveryLayout();
            });
        }

        var currentPin = '';

        function updateDots() {
            gateRoot.querySelectorAll('.pin-dot-circle').forEach(function(dot, i) {
                if (i < currentPin.length) {
                    dot.classList.add('filled');
                } else {
                    dot.classList.remove('filled');
                }
            });
        }

        function shakeError() {
            var dotsEl = gateRoot.querySelector('#pin-dots');
            if (!dotsEl) return;
            dotsEl.style.transition = 'transform 0.05s';
            var seq = [6, -6, 5, -5, 3, -3, 0];
            var i = 0;
            var interval = setInterval(function() {
                dotsEl.style.transform = 'translateX(' + seq[i] + 'px)';
                i++;
                if (i >= seq.length) {
                    clearInterval(interval);
                    dotsEl.style.transform = 'translateX(0)';
                }
            }, 50);
        }

        function processPin(pin) {
            if (step === 'verify') {
                var saved = localStorage.getItem('app_pin');
                if (pin === saved) {
                    var wrap = gateRoot.querySelector('#pin-inner-wrap');
                    function doSuccess() {
                        if (typeof onSuccess === 'function') onSuccess();
                    }
                    if (wrap) {
                        // #pin-gate-root ရဲ့ background က transparent ဖြစ်နေလို့
                        // (verify mode မှာ pin-gate-opaque class မထည့်ထားလို့)
                        // pin-slide-left ဆွဲနေတုန်း အောက်က tab content က
                        // မြင်ရနေပြီးသားပါ။ ဒါကြောင့် slide မစခင် dashboard
                        // (target tab) ကို အောက်မှာ အရင်ပြောင်းပြီးမှ slide ကို
                        // စမယ် — မဟုတ်ရင် stale tab (home) က slide နေတုန်း
                        // ခဏပေါ်ပြီးမှ dashboard ကျနေတဲ့ flash ဖြစ်နေမယ်
                        window._skipGateRemoval = true;
                        doSuccess();

                        wrap.classList.remove('pin-slide-up');
                        wrap.classList.add('pin-slide-left');
                        // Exit button flow မှာလိုပဲ home layout push-up ကို
                        // ပြန် pull-down ပေးဖို့ လိုအပ်တယ် — မဟုတ်ရင် PIN အောင်မြင်
                        // ပြီးနောက် layout က shrink/rounded-corner အတိုင်း
                        // အမြဲတမ်း ကျန်နေပြီး bottom-nav/tab-body ကို clip လုပ်နေမယ်
                        if (!isFreshInstallCreate) { _animateHomeLayout('down'); }

                        // slide-left animation (0.42s) ပြီးမှ gate ကို ဖယ်မယ်
                        setTimeout(function() {
                            window._skipGateRemoval = false;
                            var gr = document.getElementById('pin-gate-root');
                            if (gr) gr.remove();
                        }, 420);
                    } else {
                        doSuccess();
                    }
                } else {
                    failCount++;
                    render(window.t('verify_pin_wrong'));
                    if (failCount >= 3) {
                        showLockoutDialog();
                    }
                }
            } else if (step === 'enter_new') {
                newPinTemp = pin;
                step = 'confirm_new';
                render();
            } else if (step === 'confirm_new') {
                if (pin === newPinTemp) {
                    localStorage.setItem('app_pin', pin);
                    showCreateEmailStep(onSuccess);
                } else {
                    newPinTemp = '';
                    step = 'enter_new';
                    render(window.t('create_pin_mismatch'));
                }
            }
        }

        var keypad = gateRoot.querySelector('#pin-keypad');
        if (keypad) {
            keypad.addEventListener('click', function(e) {
                var btn = e.target.closest('.pin-key-circle');
                if (!btn || btn.classList.contains('empty')) return;
                var key = btn.dataset.key;
                if (!key) return;

                if (key === 'DEL') {
                    currentPin = currentPin.slice(0, -1);
                    updateDots();
                    return;
                }
                if (currentPin.length >= 6) return;
                currentPin += key;
                updateDots();

                if (currentPin.length === 6) {
                    var toProcess = currentPin;
                    setTimeout(function() {
                        currentPin = '';
                        updateDots();
                        processPin(toProcess);
                    }, 200);
                }
            });
        }
    }

    // ==========================================
    // 🔒 Lockout Dialog — dialog-overlay/box pattern (exit dialog နဲ့တူ)
    // ==========================================
    function showLockoutDialog() {
        var overlay = document.createElement('div');
        overlay.className = 'dialog-overlay';
        overlay.id = 'pin-lockout-overlay';

        var seconds = 30;

        overlay.innerHTML =
            '<div class="dialog-box">' +
                '<div style="display:flex;justify-content:center;margin-bottom:4px;">' +
                    '<div style="width:52px;height:52px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;">' +
                        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.0" stroke-linecap="round" stroke-linejoin="round">' +
                            '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>' +
                            '<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' +
                        '</svg>' +
                    '</div>' +
                '</div>' +
                '<div class="dialog-title">' + (window.t('pin_lockout_title') || 'Too Many Attempts') + '</div>' +
                '<div class="dialog-msg">' + (window.t('pin_lockout_msg') || 'Incorrect PIN 3 times. Please wait before trying again.') + '</div>' +
                '<div id="pin-lockout-count" style="font-size:32px;font-weight:700;color:#94a3b8;text-align:center;margin:0 0 20px 0;font-variant-numeric:tabular-nums;letter-spacing:2px;">30</div>' +
                '<div class="dialog-divider"></div>' +
                '<div class="dialog-btn-row">' +
                    '<button class="dialog-btn dialog-btn-cancel" id="pin-lockout-cancel">' +
                        '<div class="dialog-icon dialog-icon-cancel">' +
                            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">' +
                                '<line x1="18" y1="6" x2="6" y2="18"></line>' +
                                '<line x1="6" y1="6" x2="18" y2="18"></line>' +
                            '</svg>' +
                        '</div>' +
                        '<span class="dialog-btn-label">' + (window.t('cancel') || 'Cancel') + '</span>' +
                    '</button>' +
                    '<button class="dialog-btn dialog-btn-confirm" id="pin-lockout-ok" disabled style="justify-content:center;gap:8px;opacity:0.4;">' +
                        '<div class="dialog-icon" id="pin-lockout-ok-icon" style="background:#94a3b8;box-shadow:none;">' +
                            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">' +
                                '<polyline points="20 6 9 17 4 12"></polyline>' +
                            '</svg>' +
                        '</div>' +
                        '<span class="dialog-btn-label confirm">' + (window.t('pin_lockout_ok') || 'OK') + '</span>' +
                    '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var keypad    = document.getElementById('pin-keypad');
        if (keypad) keypad.style.pointerEvents = 'none';

        var countEl   = document.getElementById('pin-lockout-count');
        var okBtn     = document.getElementById('pin-lockout-ok');
        var okIcon    = document.getElementById('pin-lockout-ok-icon');
        var cancelBtn = document.getElementById('pin-lockout-cancel');

        // နှစ်ခုလုံး countdown မပြည့်မချင်း disable
        if (cancelBtn) { cancelBtn.disabled = true; cancelBtn.style.opacity = '0.4'; }

        var timer = setInterval(function() {
            seconds--;
            if (countEl) countEl.textContent = seconds;
            if (seconds <= 0) {
                clearInterval(timer);
                if (okBtn)     { okBtn.disabled = false; okBtn.style.opacity = '1'; }
                if (okIcon)    { okIcon.style.background = '#00a651'; okIcon.style.boxShadow = '0 2px 6px rgba(0,166,81,0.25)'; }
                if (cancelBtn) { cancelBtn.disabled = false; cancelBtn.style.opacity = '1'; }
            }
        }, 1000);

        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                clearInterval(timer);
                overlay.remove();
                failCount = 0;
                var kp = document.getElementById('pin-keypad');
                if (kp) kp.style.pointerEvents = '';
            });
        }

        okBtn.addEventListener('click', function() {
            clearInterval(timer);
            overlay.remove();
            failCount = 0;
            var kp = document.getElementById('pin-keypad');
            if (kp) kp.style.pointerEvents = '';
            showRecoveryLayout();
        });
    }

    // ==========================================
    // 🛟 Recovery Options Sub-layout
    // ==========================================
    function showRecoveryLayout() {
        // setting-forgot-pin.js ၏ back button ကသုံးနိုင်အောင် expose
        window._fpfShowRecovery = showRecoveryLayout;

        var layout = document.createElement('div');
        layout.className = 'pin-recovery-layout';
        layout.id = 'pin-recovery-layout';

        layout.innerHTML =
            '<div class="sub-head">' +
                '<div class="head-nav dark-mode" style="height:65px;border-radius:0 0 16px 16px;">' +
                    '<button id="pin-recovery-back-btn" class="back-btn" style="-webkit-tap-highlight-color:transparent;">' +
                        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">' +
                            '<polyline points="15 18 9 12 15 6"></polyline>' +
                        '</svg>' +
                    '</button>' +
                    '<div id="pin-recovery-title" style="flex:1;text-align:center;color:#fff;font-size:17px;font-weight:700;letter-spacing:0.3px;">' + (window.t('pin_recovery_title') || 'Account Recovery') + '</div>' +
                    '<div style="width:44px;"></div>' +
                '</div>' +
            '</div>' +
            '<div class="pin-recovery-body">' +
                '<p class="pin-recovery-desc">' + (window.t('pin_recovery_desc') || 'Choose how you would like to recover access to your account.') + '</p>' +

                // Option 1 — Forgot PIN
                '<div class="pin-recovery-option" id="pin-rec-forgot">' +
                    '<div class="pin-recovery-option-icon">' +
                        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                            '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>' +
                            '<path d="M7 11V7a5 5 0 0 1 9.9-1"></path>' +
                            '<line x1="12" y1="16" x2="12" y2="16.01"></line>' +
                        '</svg>' +
                    '</div>' +
                    '<div class="pin-recovery-option-text">' +
                        '<p class="pin-recovery-option-title">' + (window.t('pin_rec_forgot_title') || 'Forgot PIN') + '</p>' +
                        '<p class="pin-recovery-option-sub">' + (window.t('pin_rec_forgot_sub') || 'Verify email and set a new PIN') + '</p>' +
                    '</div>' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
                '</div>' +

                // Option 2 — Reset App
                '<div class="pin-recovery-option" id="pin-rec-reset">' +
                    '<div class="pin-recovery-option-icon">' +
                        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                            '<polyline points="3 6 5 6 21 6"></polyline>' +
                            '<path d="M19 6l-1 14H6L5 6"></path>' +
                            '<path d="M10 11v6"></path><path d="M14 11v6"></path>' +
                            '<path d="M9 6V4h6v2"></path>' +
                        '</svg>' +
                    '</div>' +
                    '<div class="pin-recovery-option-text">' +
                        '<p class="pin-recovery-option-title">' + (window.t('pin_rec_reset_title') || 'Reset App') + '</p>' +
                        '<p class="pin-recovery-option-sub">' + (window.t('pin_rec_reset_sub') || 'Erase all data and start fresh') + '</p>' +
                    '</div>' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
                '</div>' +

                // Option 3 — View PIN
                '<div class="pin-recovery-option" id="pin-rec-view">' +
                    '<div class="pin-recovery-option-icon">' +
                        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                            '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>' +
                            '<circle cx="12" cy="12" r="3"></circle>' +
                        '</svg>' +
                    '</div>' +
                    '<div class="pin-recovery-option-text">' +
                        '<p class="pin-recovery-option-title">' + (window.t('pin_rec_view_title') || 'View Current PIN') + '</p>' +
                        '<p class="pin-recovery-option-sub">' + (window.t('pin_rec_view_sub') || 'Verify email to reveal your PIN') + '</p>' +
                    '</div>' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
                '</div>' +

            '</div>';

        document.body.appendChild(layout);

        document.getElementById('pin-recovery-back-btn').addEventListener('click', function() {
            layout.remove();
            render();
        });

        document.getElementById('pin-rec-forgot').addEventListener('click', function() {
            layout.remove();
            if (typeof window.openForgotPinFlow === 'function') window.openForgotPinFlow();
        });

        document.getElementById('pin-rec-reset').addEventListener('click', function() {
            showResetConfirmDialog(layout);
        });

        document.getElementById('pin-rec-view').addEventListener('click', function() {
            showViewPinEmailStep(layout);
        });
    }

    // ==========================================
    // 🗑️ Reset App Confirm — dialog-overlay/box (exit dialog pattern)
    // ==========================================
    function showResetConfirmDialog(recoveryLayout) {
        var confirmOverlay = document.createElement('div');
        confirmOverlay.className = 'dialog-overlay';
        confirmOverlay.id = 'pin-reset-dialog';
        confirmOverlay.style.zIndex = '100000';

        confirmOverlay.innerHTML =
            '<div class="dialog-box">' +
                '<div style="display:flex;justify-content:center;margin-bottom:4px;">' +
                    '<div style="width:52px;height:52px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;">' +
                        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                            '<polyline points="3 6 5 6 21 6"></polyline>' +
                            '<path d="M19 6l-1 14H6L5 6"></path>' +
                            '<path d="M10 11v6"></path><path d="M14 11v6"></path>' +
                            '<path d="M9 6V4h6v2"></path>' +
                        '</svg>' +
                    '</div>' +
                '</div>' +
                '<div class="dialog-title">' + (window.t('pin_reset_title') || 'Reset App?') + '</div>' +
                '<div class="dialog-msg">' + (window.t('pin_reset_msg') || 'This will permanently erase ALL data including records, settings and PIN. This cannot be undone.') + '</div>' +
                '<div class="dialog-divider"></div>' +
                '<div class="dialog-btn-row">' +
                    '<button id="pin-reset-cancel" class="dialog-btn dialog-btn-cancel">' +
                        '<div class="dialog-icon dialog-icon-cancel">' +
                            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">' +
                                '<line x1="18" y1="6" x2="6" y2="18"></line>' +
                                '<line x1="6" y1="6" x2="18" y2="18"></line>' +
                            '</svg>' +
                        '</div>' +
                        '<span class="dialog-btn-label">' + (window.t('cancel') || 'Cancel') + '</span>' +
                    '</button>' +
                    '<button id="pin-reset-confirm" class="dialog-btn dialog-btn-confirm">' +
                        '<span class="dialog-btn-label confirm">' + (window.t('pin_reset_confirm') || 'Erase All') + '</span>' +
                        '<div class="dialog-icon dialog-icon-delete">' +
                            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
                                '<polyline points="3 6 5 6 21 6"></polyline>' +
                                '<path d="M19 6l-1 14H6L5 6"></path>' +
                                '<path d="M9 6V4h6v2"></path>' +
                            '</svg>' +
                        '</div>' +
                    '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(confirmOverlay);

        document.getElementById('pin-reset-cancel').addEventListener('click', function() {
            confirmOverlay.remove();
        });

        document.getElementById('pin-reset-confirm').addEventListener('click', function() {
            localStorage.clear();
            sessionStorage.clear();
            confirmOverlay.remove();
            if (recoveryLayout) recoveryLayout.remove();
            var gateRoot = document.getElementById('pin-gate-root');
            if (gateRoot) gateRoot.remove();
            window.location.reload();
        });
    }

    // ==========================================
    // 👁️ View PIN — Email Verify Step
    // ==========================================
    function showViewPinEmailStep(recoveryLayout) {
        var titleEl = recoveryLayout.querySelector('#pin-recovery-title');
        if (titleEl) titleEl.textContent = window.t('pin_rec_view_title');

        var body = recoveryLayout.querySelector('.pin-recovery-body');
        if (!body) return;

        // Back → options list ပြန်
        var backBtn = recoveryLayout.querySelector('#pin-recovery-back-btn');
        if (backBtn) {
            var newBack = backBtn.cloneNode(true);
            backBtn.parentNode.replaceChild(newBack, backBtn);
            newBack.addEventListener('click', function() {
                recoveryLayout.remove();
                showRecoveryLayout();
            });
        }


        body.innerHTML =
            '<p class="pin-recovery-desc">' + window.t('pin_view_email_desc') + '</p>' +
            '<input id="pin-view-email-input" type="email" placeholder="example@email.com" autocomplete="email" ' +
                'style="width:100%;box-sizing:border-box;padding:14px 16px;font-size:15px;border:1.5px solid #e2e8f0;border-radius:12px;outline:none;color:#1a202c;background:#fff;font-family:inherit;margin-bottom:6px;">' +
            '<p id="pin-view-email-err" style="font-size:13px;color:#e53e3e;min-height:18px;margin:4px 0 16px 0;text-align:center;"></p>' +
            '<button id="pin-view-verify-btn" ' +
                'style="width:100%;padding:15px;border:none;border-radius:12px;background:#1a4e8f;font-size:15px;font-weight:600;color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent;font-family:inherit;">' +
                window.t('pin_view_verify_btn') +
            '</button>' +
            '<div id="pin-reveal-area" style="display:none;margin-top:16px;"></div>';

        document.getElementById('pin-view-verify-btn').addEventListener('click', function() {
            var input      = document.getElementById('pin-view-email-input');
            var errEl      = document.getElementById('pin-view-email-err');
            var val        = (input ? input.value : '').trim().toLowerCase();
            var savedEmail = (localStorage.getItem('ot_email') || '').trim().toLowerCase();
            var savedPin   = localStorage.getItem('app_pin') || '';

            // Empty check — spinner မပေါ်ခင် စစ်
            if (!val) {
                if (errEl) errEl.textContent = window.t('forgot_pin_empty');
                if (input) input.style.borderColor = '#e53e3e';
                return;
            }

            // Clear error, reset border
            if (errEl) errEl.textContent = '';
            if (input) input.style.borderColor = '#e2e8f0';

            // Blur + spinner overlay — full screen over recovery layout
            var blurOverlay = document.createElement('div');
            blurOverlay.id = 'pin-view-blur';
            blurOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.65);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:100002;';
            blurOverlay.innerHTML =
                '<svg width="40" height="40" viewBox="0 0 44 44" style="animation:spinnerRotate 0.8s linear infinite;">' +
                    '<circle cx="22" cy="22" r="18" fill="none" stroke="#94a3b8" stroke-width="4" stroke-dasharray="90" stroke-dashoffset="60" stroke-linecap="round"/>' +
                '</svg>';
            document.body.appendChild(blurOverlay);

            setTimeout(function() {
                blurOverlay.remove();

                // ── No email saved
                if (!savedEmail) {
                    showViewPinErrorDialog(window.t('forgot_pin_no_saved'));
                    return;
                }
                // ── Mismatch
                if (val !== savedEmail) {
                    showViewPinErrorDialog(window.t('forgot_pin_mismatch'));
                    return;
                }

                // ── Match → success dialog ပြ၊ ပြီးမှ reveal
                showViewPinSuccessDialog(savedPin);
            }, 1000);
        });
    }

    // Email verified success dialog — proceed to reveal PIN
    function showViewPinSuccessDialog(savedPin) {
        var dlg = document.createElement('div');
        dlg.className = 'dialog-overlay';
        dlg.style.zIndex = '100003';

        dlg.innerHTML =
            '<div class="dialog-box">' +
                '<div style="display:flex;justify-content:center;margin-bottom:4px;">' +
                    '<div style="width:52px;height:52px;border-radius:50%;background:#ebf8f0;display:flex;align-items:center;justify-content:center;">' +
                        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38a169" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
                            '<polyline points="20 6 9 17 4 12"></polyline>' +
                        '</svg>' +
                    '</div>' +
                '</div>' +
                '<div class="dialog-title">' + window.t('pin_view_verified_title') + '</div>' +
                '<div class="dialog-msg">' + window.t('pin_view_verified_msg') + '</div>' +
                '<div class="dialog-divider"></div>' +
                '<div class="dialog-btn-row" style="justify-content:center;">' +
                    '<button id="pin-view-success-start" class="dialog-btn dialog-btn-confirm" style="justify-content:center;gap:8px;">' +
                        '<span class="dialog-btn-label confirm">' + window.t('pin_start_btn') + '</span>' +
                        '<div class="dialog-icon" style="background:#00a651;box-shadow:0 2px 6px rgba(0,166,81,0.25);">' +
                            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
                                '<polyline points="9 18 15 12 9 6"></polyline>' +
                            '</svg>' +
                        '</div>' +
                    '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(dlg);

        document.getElementById('pin-view-success-start').addEventListener('click', function() {
            dlg.remove();

            var verifyBtn = document.getElementById('pin-view-verify-btn');
            if (verifyBtn) verifyBtn.style.display = 'none';

            var revealArea = document.getElementById('pin-reveal-area');
                if (revealArea) {
                    revealArea.style.display = 'block';
                    revealArea.innerHTML =
                        '<div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;padding:20px;text-align:center;">' +
                            '<p style="font-size:12px;color:#94a3b8;font-weight:600;margin:0 0 10px 0;letter-spacing:0.5px;text-transform:uppercase;">' + window.t('pin_reveal_label') + '</p>' +
                            '<p id="pin-reveal-digits" style="font-size:34px;font-weight:700;letter-spacing:12px;color:#1a202c;margin:0 0 16px 0;font-variant-numeric:tabular-nums;">' + savedPin + '</p>' +
                            '<button id="pin-reveal-copy-btn" ' +
                                'style="display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border:1.5px solid #cbd5e1;border-radius:10px;background:transparent;color:#64748b;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;-webkit-tap-highlight-color:transparent;">' +
                                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
                                    '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>' +
                                    '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>' +
                                '</svg>' +
                                '<span id="pin-copy-label">' + window.t('pin_copy_btn') + '</span>' +
                            '</button>' +
                        '</div>';

                    document.getElementById('pin-reveal-copy-btn').addEventListener('click', function() {
                        var label = document.getElementById('pin-copy-label');
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(savedPin).then(function() {
                                if (label) label.textContent = window.t('pin_copied');
                                setTimeout(function() { if (label) label.textContent = window.t('pin_copy_btn'); }, 2000);
                            });
                        } else {
                            var ta = document.createElement('textarea');
                            ta.value = savedPin;
                            ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0;';
                            document.body.appendChild(ta);
                            ta.select();
                            document.execCommand('copy');
                            document.body.removeChild(ta);
                            if (label) label.textContent = window.t('pin_copied');
                            setTimeout(function() { if (label) label.textContent = window.t('pin_copy_btn'); }, 2000);
                        }
                    });
                }
        });
    }

    // Error dialog — View PIN verify failure
    function showViewPinErrorDialog(errorMsg) {
        var errDialog = document.createElement('div');
        errDialog.className = 'dialog-overlay';
        errDialog.style.zIndex = '100003';

        errDialog.innerHTML =
            '<div class="dialog-box">' +
                '<div style="display:flex;justify-content:center;margin-bottom:4px;">' +
                    '<div style="width:52px;height:52px;border-radius:50%;background:#f1f5f9;display:flex;align-items:center;justify-content:center;">' +
                        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                            '<circle cx="12" cy="12" r="10"></circle>' +
                            '<line x1="12" y1="8" x2="12" y2="12"></line>' +
                            '<line x1="12" y1="16" x2="12.01" y2="16"></line>' +
                        '</svg>' +
                    '</div>' +
                '</div>' +
                '<div class="dialog-title">' + window.t('pin_view_error_title') + '</div>' +
                '<div class="dialog-msg">' + errorMsg + '</div>' +
                '<div class="dialog-divider"></div>' +
                '<div class="dialog-btn-row" style="justify-content:center;">' +
                    '<button id="pin-view-err-ok" class="dialog-btn dialog-btn-confirm" style="justify-content:center;gap:8px;">' +
                        '<div class="dialog-icon" style="background:#94a3b8;box-shadow:none;">' +
                            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">' +
                                '<polyline points="20 6 9 17 4 12"></polyline>' +
                            '</svg>' +
                        '</div>' +
                        '<span class="dialog-btn-label confirm">' + window.t('pin_lockout_ok') + '</span>' +
                    '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(errDialog);

        document.getElementById('pin-view-err-ok').addEventListener('click', function() {
            errDialog.remove();
            // Retry — input reset
            var input = document.getElementById('pin-view-email-input');
            if (input) { input.value = ''; input.style.borderColor = '#e53e3e'; input.focus(); }
        });
    }

    // ==========================================
    // 📧 Create Email Step — PIN create ပြီးနောက်
    // ==========================================
    function showCreateEmailStep(onSuccess) {
        var gateRoot = document.getElementById('pin-gate-root');
        if (!gateRoot) { if (typeof onSuccess === 'function') onSuccess(); return; }

        var existingEmail = localStorage.getItem('ot_email') || '';

        gateRoot.innerHTML =
            '<div class="sub-layout" id="pin-email-sub">' +
                '<div class="sub-head">' +
                    '<div style="position:relative;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:32px 16px 28px;background:#324247;border-radius:0 0 16px 16px;">' +
                        '<div style="width:68px;height:68px;border-radius:50%;background:rgba(255,255,255,0.12);border:2px solid rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;margin-bottom:14px;">' +
                            '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
                                '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>' +
                                '<polyline points="22,6 12,13 2,6"></polyline>' +
                            '</svg>' +
                        '</div>' +
                        '<span style="font-size:17px;font-weight:700;color:#ffffff;letter-spacing:0.2px;">' + window.t('create_email_title') + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="sub-body" style="padding:28px 20px 24px 20px;display:flex;flex-direction:column;align-items:center;">' +
                    '<p style="font-size:14px;color:var(--color-text-secondary);text-align:center;line-height:1.65;margin:0 4px 28px 4px;">' +
                        window.t('create_email_desc') +
                    '</p>' +
                    '<div style="width:100%;max-width:360px;">' +
                        '<div style="position:relative;">' +
                            '<span style="position:absolute;top:50%;left:14px;transform:translateY(-50%);pointer-events:none;">' +
                                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
                                    '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>' +
                                    '<polyline points="22,6 12,13 2,6"></polyline>' +
                                '</svg>' +
                            '</span>' +
                            '<input id="pin-email-input" type="email" autocomplete="email" ' +
                                'placeholder="' + (window.t('create_email_placeholder') || 'example@email.com') + '" ' +
                                'value="' + existingEmail.replace(/"/g, '&quot;') + '" ' +
                                'style="width:100%;box-sizing:border-box;padding:14px 16px 14px 40px;font-size:15px;border:1.5px solid var(--color-border);border-radius:12px;outline:none;color:var(--color-text-primary);background:var(--color-surface);font-family:inherit;-webkit-tap-highlight-color:transparent;">' +
                        '</div>' +
                        '<p id="pin-email-err" style="font-size:13px;color:#e53e3e;min-height:18px;margin:6px 0 0 4px;"></p>' +
                    '</div>' +
                    '<div style="width:100%;max-width:360px;margin-top:16px;">' +
                        '<button id="pin-email-confirm-btn" ' +
                            'style="width:100%;padding:15px;border:none;border-radius:12px;background:#324247;font-size:15px;font-weight:600;color:#ffffff;cursor:pointer;-webkit-tap-highlight-color:transparent;font-family:inherit;letter-spacing:0.2px;">' +
                            window.t('create_email_confirm') +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        var inputEl = document.getElementById('pin-email-input');
        if (inputEl) {
            inputEl.addEventListener('focus', function() { this.style.borderColor = '#324247'; });
            inputEl.addEventListener('blur',  function() { this.style.borderColor = 'var(--color-border)'; });
            inputEl.addEventListener('input', function() {
                var errEl = document.getElementById('pin-email-err');
                if (errEl) errEl.textContent = '';
                this.style.borderColor = '#324247';
            });
        }

        document.getElementById('pin-email-confirm-btn').addEventListener('click', function() {
            var val   = (document.getElementById('pin-email-input').value || '').trim();
            var errEl = document.getElementById('pin-email-err');
            var inp   = document.getElementById('pin-email-input');

            if (!val) {
                if (errEl) errEl.textContent = window.t('forgot_pin_empty');
                if (inp)   inp.style.borderColor = '#e53e3e';
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
                if (errEl) errEl.textContent = window.t('create_email_invalid');
                if (inp)   inp.style.borderColor = '#e53e3e';
                return;
            }

            localStorage.setItem('ot_email', val);

            // spinner keyframe (once)
            if (!document.getElementById('pin-spinner-style')) {
                var st = document.createElement('style');
                st.id  = 'pin-spinner-style';
                st.textContent = '@keyframes pinSpinnerRot { to { transform: rotate(360deg); } }';
                document.head.appendChild(st);
            }

            var btn = document.getElementById('pin-email-confirm-btn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML =
                    '<span style="display:inline-flex;align-items:center;gap:8px;justify-content:center;">' +
                        '<svg width="18" height="18" viewBox="0 0 44 44" style="animation:pinSpinnerRot 0.8s linear infinite;">' +
                            '<circle cx="22" cy="22" r="16" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="4" stroke-dasharray="80" stroke-dashoffset="50" stroke-linecap="round"/>' +
                        '</svg>' +
                    '</span>';
            }

            setTimeout(function() {
                if (btn) {
                    btn.innerHTML =
                        '<span style="display:inline-flex;align-items:center;gap:8px;justify-content:center;">' +
                            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">' +
                                '<polyline points="20 6 9 17 4 12"></polyline>' +
                            '</svg>' +
                        '</span>';
                }
                setTimeout(function() {
                    if (typeof onSuccess === 'function') onSuccess();
                }, 450);
            }, 700);
        });
    }

    render();

};
