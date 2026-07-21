// ==========================================
// welcome.js — First-Launch Welcome Screen
// ပထမဆုံးအကြိမ် app ဖွင့်ချိန် (PIN မဖန်တီးခင်) ပြမည့် layout
// K PLUS-style cloud/white background + Overtime Tracker branding
// Usage: window.showWelcomeScreen(function() { window.showPinScreen('create', onSuccess); });
// ==========================================

window.showWelcomeScreen = function(onContinue) {

    function ensureRoot() {
        var root = document.getElementById('pin-gate-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'pin-gate-root';
            root.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;background:#ffffff;';
            document.body.appendChild(root);
        }
        return root;
    }

    function setLang(lang) {
        window.currentLang = lang;
        localStorage.setItem('ot_tracker_lang', lang);
        render();
    }

    function render() {
        var root = ensureRoot();
        var lang = window.currentLang || 'en';

        root.innerHTML = `
            <style>
                #welcome-wrap {
                    position:absolute; inset:0; display:flex; flex-direction:column;
                    overflow:hidden; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
                    background:#ffffff;
                }
                @keyframes wlFadeUp   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
                @keyframes wlBtnIn    { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
                .wl-fade     { animation: wlFadeUp 0.5s ease both; }
                .wl-btn-in   { animation: wlBtnIn 0.5s ease 0.15s both; }
                .wl-lang-link {
                    border:none; background:transparent; font-size:14px; font-weight:600;
                    padding:4px 2px; cursor:pointer; -webkit-tap-highlight-color:transparent;
                    font-family:inherit; color:#94a3b8; transition:color .15s;
                }
                .wl-lang-link.active { color:#2dd4bf; }
                .wl-lang-sep { color:#cbd5e1; font-size:13px; padding:0 8px; }
                .wl-start-btn:active { transform:scale(0.97); }
            </style>

            <div id="welcome-wrap">

                <!-- Cloud sky header -->
                <div style="position:relative;flex:0 0 auto;height:200px;overflow:hidden;
                    background:linear-gradient(180deg,#bfe7ec 0%,#d9f0f1 55%,#ffffff 100%);">
                    <svg viewBox="0 0 400 120" preserveAspectRatio="none" style="position:absolute;bottom:-1px;left:0;width:100%;height:90px;">
                        <path d="M0,40 C40,10 80,55 120,30 C160,5 200,45 240,25 C280,5 330,50 400,20 L400,120 L0,120 Z" fill="#ffffff"></path>
                    </svg>
                    <div style="position:absolute;top:30px;left:-20px;width:90px;height:46px;border-radius:50%;background:rgba(255,255,255,0.4);"></div>
                    <div style="position:absolute;top:14px;left:55px;width:110px;height:58px;border-radius:50%;background:rgba(255,255,255,0.5);"></div>
                    <div style="position:absolute;top:38px;left:160px;width:85px;height:42px;border-radius:50%;background:rgba(255,255,255,0.35);"></div>
                    <div style="position:absolute;top:18px;left:215px;width:105px;height:55px;border-radius:50%;background:rgba(255,255,255,0.45);"></div>

                    <!-- Language Toggle -->
                    <div style="position:absolute;top:20px;right:22px;display:flex;align-items:center;z-index:5;">
                        <button id="wl-lang-th" class="wl-lang-link ${lang === 'th' ? 'active' : ''}">ไทย</button>
                        <span class="wl-lang-sep">|</span>
                        <button id="wl-lang-en" class="wl-lang-link ${lang === 'en' ? 'active' : ''}">English</button>
                    </div>
                </div>

                <!-- Content -->
                <div class="wl-fade" style="flex:1;padding:34px 30px 0;display:flex;flex-direction:column;">

                    <!-- Overtime Tracker logo mark -->
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:34px;">
                        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#324247" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="9"></circle>
                            <polyline points="12 7 12 12 15.5 14"></polyline>
                        </svg>
                        <div style="font-size:26px;font-weight:800;color:#324247;letter-spacing:-0.3px;line-height:1;">
                            ${window.t('about_app_name')}
                        </div>
                    </div>

                    <h1 style="font-size:24px;font-weight:700;color:#1a202c;margin:0 0 14px 0;line-height:1.4;">${window.t('welcome_title')}</h1>
                    <p style="font-size:15px;color:#64748b;margin:0;line-height:1.65;max-width:300px;">${window.t('welcome_subtitle')}</p>
                </div>

                <!-- Enter Button (corner, circular arrow) -->
                <div class="wl-btn-in" style="flex:0 0 auto;display:flex;justify-content:flex-end;align-items:center;gap:10px;padding:8px 28px 26px;">
                    <span style="font-size:15px;font-weight:600;color:#324247;">${window.t('welcome_enter_btn')}</span>
                    <button id="wl-start-btn" class="wl-start-btn" style="width:46px;height:46px;border:none;border-radius:50%;
                        background:linear-gradient(135deg,#2bb89a,#1f7a68);
                        display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent;
                        font-family:inherit;box-shadow:0 8px 20px rgba(31,122,104,0.35);flex-shrink:0;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                            <polyline points="12 5 19 12 12 19"></polyline>
                        </svg>
                    </button>
                </div>

            </div>
        `;

        // Language toggle
        document.getElementById('wl-lang-th').addEventListener('click', function() {
            if ((window.currentLang || 'en') !== 'th') setLang('th');
        });
        document.getElementById('wl-lang-en').addEventListener('click', function() {
            if ((window.currentLang || 'en') !== 'en') setLang('en');
        });

        // Enter → PIN/Email flow ဆက်သွားရန်
        document.getElementById('wl-start-btn').addEventListener('click', function() {
            var wrap = root.querySelector('#welcome-wrap');
            if (wrap) {
                wrap.style.transition = 'opacity 0.28s ease, transform 0.32s cubic-bezier(0.4,0,0.2,1)';
                wrap.style.opacity = '0';
                wrap.style.transform = 'scale(0.97)';
            }
            setTimeout(function() {
                if (typeof onContinue === 'function') onContinue();
            }, 260);
        });
    }

    render();
};
