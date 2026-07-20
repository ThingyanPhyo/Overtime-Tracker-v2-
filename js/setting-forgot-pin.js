// setting-forgot-pin.js — Forgot PIN flow
window.openForgotPinFlow = function() {
    const gateRoot = document.getElementById('pin-gate-root');
    if (!gateRoot) return;

    const savedEmail = localStorage.getItem('ot_email') || '';

    function renderEmailStep(errorMsg) {
        errorMsg = errorMsg || '';
        gateRoot.innerHTML = `
            <div class="fpf-wrap">
                <div class="head-nav dark-mode">
                    <button id="fpf-back-btn" class="back-btn">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <div class="head-title">${window.t('fpf_reset_pin_title')}</div>
                    <div style="width:44px;"></div>
                </div>

                <div class="fpf-body">
                    <div class="fpf-icon-wrap">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#324247" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                    </div>
                    <p class="fpf-desc">${window.t('fpf_email_desc')}</p>

                    <input
                        type="email"
                        id="fpf-email-input"
                        class="fpf-input"
                        placeholder="example@email.com"
                        autocomplete="email"
                    >
                    <p class="fpf-error">${errorMsg}</p>

                    <button id="fpf-verify-btn" class="fpf-primary-btn fpf-btn-disabled" disabled style="background:#1a4e8f;">
                        ${window.t('fpf_verify_btn')}
                    </button>
                </div>
            </div>
        `;

        // Back — Account Recovery layout ပြန်သွား
        document.getElementById('fpf-back-btn')?.addEventListener('click', () => {
            const gr = document.getElementById('pin-gate-root');
            if (gr) gr.innerHTML = '';
            if (typeof window._fpfShowRecovery === 'function') window._fpfShowRecovery();
        });

        const input  = document.getElementById('fpf-email-input');
        const verBtn = document.getElementById('fpf-verify-btn');

        input?.addEventListener('input', function() {
            const hasVal = this.value.trim().length > 0;
            verBtn.disabled = !hasVal;
            verBtn.classList.toggle('fpf-btn-disabled', !hasVal);
        });

        verBtn?.addEventListener('click', () => {
            const val = input?.value.trim() || '';
            if (!val) return;

            // Spinner overlay — blur + spinner (View PIN pattern အတိုင်း)
            const blurOverlay = document.createElement('div');
            blurOverlay.id = 'fpf-blur-overlay';
            blurOverlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.65);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:100002;';
            blurOverlay.innerHTML =
                '<svg width="40" height="40" viewBox="0 0 44 44" style="animation:spinnerRotate 0.8s linear infinite;">' +
                    '<circle cx="22" cy="22" r="18" fill="none" stroke="#94a3b8" stroke-width="4" stroke-dasharray="90" stroke-dashoffset="60" stroke-linecap="round"/>' +
                '</svg>';
            document.body.appendChild(blurOverlay);

            setTimeout(() => {
                blurOverlay.remove();

                if (!savedEmail) {
                    showFpfErrorDialog(window.t('fpf_no_email'));
                    return;
                }

                if (val.toLowerCase() !== savedEmail.toLowerCase()) {
                    showFpfErrorDialog(window.t('fpf_email_mismatch'));
                    return;
                }

                // Email မှန်ကန် — success dialog ပြ၊ ပြီးမှ new PIN
                showFpfSuccessDialog();
            }, 1000);
        });
    }

    // Email verified success dialog — proceed to reset PIN
    function showFpfSuccessDialog() {
        const dlg = document.createElement('div');
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
                '<div class="dialog-title">' + window.t('fpf_verified_title') + '</div>' +
                '<div class="dialog-msg">' + window.t('fpf_verified_msg') + '</div>' +
                '<div class="dialog-divider"></div>' +
                '<div class="dialog-btn-row" style="justify-content:center;">' +
                    '<button id="fpf-success-start" class="dialog-btn dialog-btn-confirm" style="justify-content:center;gap:8px;">' +
                        '<span class="dialog-btn-label confirm">' + window.t('fpf_start_btn') + '</span>' +
                        '<div class="dialog-icon" style="background:#00a651;box-shadow:0 2px 6px rgba(0,166,81,0.25);">' +
                            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' +
                                '<polyline points="9 18 15 12 9 6"></polyline>' +
                            '</svg>' +
                        '</div>' +
                    '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(dlg);

        document.getElementById('fpf-success-start').addEventListener('click', () => {
            dlg.remove();
            renderNewPinStep();
        });
    }

    // New PIN set screen
    function renderNewPinStep() {
        var newPinTemp = '';
        var step = 'enter_new';

        function getLabel() {
            return step === 'enter_new' ? window.t('fpf_enter_new_pin') : window.t('fpf_confirm_new_pin');
        }

        function renderPin(errorMsg) {
            errorMsg = errorMsg || '';
            gateRoot.innerHTML = `
                <div class="fpf-wrap">
                    <div class="head-nav dark-mode">
                        <button id="fpf-newpin-back-btn" class="back-btn">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                        <div class="head-title">${window.t('fpf_new_pin_title')}</div>
                        <div style="width:44px;"></div>
                    </div>

                    <div style="flex:1;display:flex;flex-direction:column;align-items:center;padding-top:56px;">
                        <p style="font-size:16px;font-weight:600;color:#1a202c;margin:0 0 40px 0;letter-spacing:0.2px;">${getLabel()}</p>
                        <div id="fpf-new-dots" style="display:flex;gap:18px;margin-bottom:16px;">
                            ${[0,1,2,3,4,5].map(() => '<div class="fpf-new-dot"></div>').join('')}
                        </div>
                        <p style="font-size:13px;color:#e53e3e;min-height:18px;margin:0;text-align:center;padding:0 24px;">${errorMsg}</p>
                    </div>

                    <div id="fpf-new-keypad" class="fpf-otp-keypad">
                        ${['1','2','3','4','5','6','7','8','9','','0','DEL'].map(function(key, idx) {
                            var isEmpty = key === '';
                            var isDel = key === 'DEL';
                            var col = idx % 3;
                            var bRight = col < 2 ? 'border-right:1px solid #e2e8f0;' : '';
                            var bBottom = idx < 9 ? 'border-bottom:1px solid #e2e8f0;' : '';
                            return '<button class="fpf-otp-key" data-key="' + key + '" style="' + bRight + bBottom + 'pointer-events:' + (isEmpty?'none':'auto') + ';cursor:' + (isEmpty?'default':'pointer') + ';">' +
                                (isDel ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="#324247" stroke="none" style="display:block;"><path d="M22 3H7c-.55 0-1.05.28-1.35.72L1 12l4.65 8.28c.3.44.8.72 1.35.72H22c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.7 12.3a1 1 0 0 1-1.42 1.4L13 13.42l-2.88 2.88a1 1 0 1 1-1.42-1.42L11.58 12 8.7 9.12a1 1 0 1 1 1.42-1.42L13 10.58l2.88-2.88a1 1 0 0 1 1.42 1.42L14.42 12l2.88 2.88z"/></svg>' : key) +
                            '</button>';
                        }).join('')}
                    </div>
                </div>
            `;

            var currentPin = '';

            // Back — email step ပြန်သွား (enter_new step မှာသာ)
            document.getElementById('fpf-newpin-back-btn')?.addEventListener('click', function() {
                if (step === 'enter_new') {
                    renderEmailStep();
                } else {
                    // confirm step မှာ enter_new ပြန်သွား
                    newPinTemp = '';
                    step = 'enter_new';
                    renderPin();
                }
            });

            function updateDots() {
                gateRoot.querySelectorAll('.fpf-new-dot').forEach((dot, i) => {
                    dot.style.background = i < currentPin.length ? '#1a4e8f' : 'transparent';
                });
            }

            document.getElementById('fpf-new-keypad')?.addEventListener('click', function(e) {
                const btn = e.target.closest('.fpf-otp-key');
                if (!btn) return;
                const key = btn.dataset.key;
                if (!key) return;

                btn.style.background = '#e8f0fb';
                setTimeout(() => { btn.style.background = ''; }, 150);

                if (key === 'DEL') { currentPin = currentPin.slice(0, -1); updateDots(); return; }
                if (currentPin.length >= 6) return;
                currentPin += key;
                updateDots();

                if (currentPin.length === 6) {
                    const pinToProcess = currentPin;
                    currentPin = '';
                    updateDots();
                    setTimeout(() => {
                        if (step === 'enter_new') {
                            newPinTemp = pinToProcess;
                            step = 'confirm_new';
                            renderPin();
                        } else {
                            if (pinToProcess === newPinTemp) {
                                localStorage.setItem('app_pin', pinToProcess);
                                renderSuccessStep();
                            } else {
                                newPinTemp = '';
                                step = 'enter_new';
                                renderPin(window.t('fpf_pin_mismatch'));
                            }
                        }
                    }, 150);
                }
            });
        }
        renderPin();
    }

    // Success screen
    function renderSuccessStep() {
        gateRoot.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;background:#fff;gap:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
                <div style="width:64px;height:64px;border-radius:50%;background:#ebf8f0;display:flex;align-items:center;justify-content:center;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#38a169" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </div>
                <p style="font-size:16px;font-weight:600;color:#1a202c;margin:0;">${window.t('fpf_success_msg')}</p>
            </div>
        `;
        setTimeout(() => {
            sessionStorage.setItem('pin_unlocked', '1');
            const gr = document.getElementById('pin-gate-root');
            if (gr) gr.remove();
            const bottomNav = document.getElementById('main-bottom-nav');
            if (bottomNav) bottomNav.classList.remove('hidden', 'pre-hide');
            const savedTab = localStorage.getItem('ot_active_tab') || 'home';
            if (typeof window.switchTab === 'function') window.switchTab(savedTab);
        }, 1000);
    }

    // Error dialog — email verify failure (View PIN dialog pattern အတိုင်း)
    function showFpfErrorDialog(errorMsg) {
        const errDialog = document.createElement('div');
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
                '<div class="dialog-title">' + window.t('fpf_verify_failed') + '</div>' +
                '<div class="dialog-msg">' + errorMsg + '</div>' +
                '<div class="dialog-divider"></div>' +
                '<div class="dialog-btn-row" style="justify-content:center;">' +
                    '<button id="fpf-err-ok" class="dialog-btn dialog-btn-confirm" style="justify-content:center;gap:8px;">' +
                        '<div class="dialog-icon" style="background:#f97316;box-shadow:0 2px 6px rgba(249,115,22,0.25);">' +
                            '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">' +
                                '<polyline points="20 6 9 17 4 12"></polyline>' +
                            '</svg>' +
                        '</div>' +
                        '<span class="dialog-btn-label confirm">' + window.t('fpf_ok') + '</span>' +
                    '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(errDialog);

        document.getElementById('fpf-err-ok').addEventListener('click', () => {
            errDialog.remove();
            // input reset + focus
            const input = document.getElementById('fpf-email-input');
            if (input) { input.value = ''; input.style.borderColor = '#e53e3e'; input.focus(); }
        });
    }

    // Bridge: Account Recovery layout ပြန်ဖွင့်ဖို့ — pin.js showRecoveryLayout ကို expose မလုပ်ထားတာမို့
    // pin.js ထဲမှာ _fpfShowRecovery ကို set လုပ်ထားမည်
    renderEmailStep();
};
