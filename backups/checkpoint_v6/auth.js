/**
 * auth.js - Uzm. Dr. Yelda Yaren Şentürk | Güvenli Giriş Sistemi
 * [MODERN VE DAYANIKLI SÜRÜM]
 * Bu dosya artık bir modül değildir, standart script olarak yüklenmelidir.
 */

(function() {
    const SUPABASE_URL = 'https://wtiitrsfrbdclackwaqv.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0aWl0cnNmcmJkY2xhY2t3YXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNzIyODAsImV4cCI6MjA5MTg0ODI4MH0.J8_g5m_zepTCrXYKptFG67OxsIPXiNumgSso9urY8_k';

    let supabaseLocal = null;

    // 1. SUPABASE INITIALIZATION
    function initSupabase() {
        if (typeof supabase !== 'undefined') {
            supabaseLocal = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            return true;
        }
        console.error("Supabase kütüphanesi yüklenemedi!");
        return false;
    }

    // 2. AUTH ACTIONS
    window.logout = async function () {
        if (supabaseLocal) {
            await supabaseLocal.auth.signOut();
            window.location.replace('login.html');
        }
    };

    async function checkAuth() {
        if (!supabaseLocal && !initSupabase()) return;

        const bodyId = document.body.id;
        const isLoginPage = bodyId === 'login-page';
        const hasSessionHint = localStorage.getItem('sb-wtiitrsfrbdclackwaqv-auth-token') !== null;

        // Reactive Auth listener
        supabaseLocal.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT' && !isLoginPage) {
                window.location.replace('login.html');
            }
            if (event === 'SIGNED_IN' && isLoginPage) {
                window.location.replace('index.html');
            }
        });

        try {
            const { data: { session } } = await supabaseLocal.auth.getSession();
            if (!session && !isLoginPage && !hasSessionHint) {
                window.location.replace('login.html');
            } else if (session && isLoginPage) {
                window.location.replace('index.html');
            }
        } catch (e) {
            console.error("Auth Error:", e);
        }
    }

    // 3. UI INJECTION (Always runs safely)
    function injectSidebar() {
        const placeholder = document.getElementById('sidebar-placeholder');
        if (!placeholder) return;

        const bodyId = document.body.id;
        const menuItems = [
            { id: 'index-page', href: 'index.html', label: 'Randevu Takvimi', icon: 'calendar-days' },
            { id: 'patients-page', href: 'hasta-listesi.html', label: 'Hasta Listesi', icon: 'contact' },
            { id: 'stock-page', href: 'stok-yonetimi.html', label: 'Stok Yönetimi', icon: 'warehouse' },
            { id: 'dashboard-page', href: 'dashboard.html', label: 'Analiz', icon: 'chart-pie' }
        ];

        let html = `
            <nav class="app-sidebar">
                <div class="sidebar-brand">
                    <div class="brand-label">KLİNİK YÖNETİMİ</div>
                    <div class="brand-title">DR. YELDA YAREN<br>ŞENTÜRK</div>
                </div>
                <ul class="nav-menu">
        `;

        menuItems.forEach(item => {
            const isActive = bodyId === item.id ? 'active' : '';
            html += `
                <li class="nav-item">
                    <a href="${item.href}" class="nav-link ${isActive}">
                        <i data-lucide="${item.icon}"></i>
                        <span>${item.label}</span>
                    </a>
                </li>
            `;
        });

        html += `
                </ul>
                <div class="sidebar-footer" style="display: flex; gap: 8px; padding-top: 20px;">
                    <button class="footer-btn support-btn" id="sidebar-support">
                        <i data-lucide="help-circle"></i>
                        <span>Destek</span>
                    </button>
                    <button class="footer-btn logout-btn" id="sidebar-logout">
                        <i data-lucide="log-out"></i>
                        <span>Çıkış</span>
                    </button>
                </div>
            </nav>
        `;

        placeholder.innerHTML = html;
        
        // Çıkış butonunu bağla
        const logoutBtn = document.getElementById('sidebar-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                window.logout();
            });
        }

        // Destek butonunu bağla (İstenirse özel işlem eklenebilir)
        const supportBtn = document.getElementById('sidebar-support');
        if (supportBtn) {
            supportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Destek işlemi buraya gelebilir
            });
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function handleLogin() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const btn = document.getElementById('loginBtn');
            const errorMessage = document.getElementById('errorMessage');
            const errorText = document.getElementById('errorText');

            if (btn.classList.contains('loading')) return;
            btn.classList.add('loading');
            errorMessage.classList.remove('show');

            if (!supabaseLocal && !initSupabase()) return;

            const { error } = await supabaseLocal.auth.signInWithPassword({ email, password });
            if (error) {
                btn.classList.remove('loading');
                errorText.textContent = 'Hata: ' + error.message;
                errorMessage.classList.add('show');
            } else {
                window.location.replace('index.html');
            }
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // 4. BOOTSTRAP
    const bootstrap = () => {
        try {
            initSupabase();
            injectSidebar();
            checkAuth();
            if (document.body.id === 'login-page') handleLogin();
        } catch (e) {
            console.error("Bootstrap Error:", e);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }

})();
