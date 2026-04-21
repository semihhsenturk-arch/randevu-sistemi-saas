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

    // 3. DATABASE OPERATIONS (Supabase Bridge with Caching)
    const CACHE_KEYS = {
        APPOINTMENTS: 'cache_appointments',
        PROFILES: 'cache_patient_profiles',
        INVENTORY: 'cache_inventory'
    };

    function getCache(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) { return null; }
    }

    function setCache(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {}
    }

    window.db = {
        async getAppointments() {
            if (!supabaseLocal) return [];
            
            // Return cache first for instant UI
            const cached = getCache(CACHE_KEYS.APPOINTMENTS);
            
            // Background fetch
            const fetchFresh = async () => {
                const { data, error } = await supabaseLocal
                    .from('appointments')
                    .select('*')
                    .order('tarih', { ascending: true })
                    .order('saat', { ascending: true });
                
                if (!error && data) {
                    const mapped = data.map(d => ({
                        id: d.id,
                        musteriAdi: d.musteri_adi,
                        telefon: d.telefon,
                        hizmetId: d.hizmet_id,
                        tarih: d.tarih,
                        saat: d.saat,
                        durum: d.durum,
                        notlar: d.notlar
                    }));
                    setCache(CACHE_KEYS.APPOINTMENTS, mapped);
                    // Notify listeners if data changed
                    window.dispatchEvent(new CustomEvent('db:appointments_updated', { detail: mapped }));
                    return mapped;
                }
                return cached || [];
            };

            const freshPromise = fetchFresh();
            return cached || await freshPromise;
        },

        async saveAppointment(apt) {
            if (!supabaseLocal) return null;
            
            try {
                const { data: { user } } = await supabaseLocal.auth.getUser();
                if (!user) throw new Error("Oturum kapatılmış, lütfen tekrar giriş yapın.");

                const payload = {
                    user_id: user.id,
                    musteri_adi: apt.musteriAdi,
                    telefon: apt.telefon,
                    hizmet_id: parseInt(apt.hizmetId) || 1,
                    tarih: apt.tarih,
                    saat: apt.saat,
                    durum: apt.durum,
                    notlar: apt.notlar
                };

                // ID varsa payload'a ekle (artık TEXT olduğu için kısıtlama yok)
                if (apt.id) {
                    payload.id = apt.id;
                }

                const { data, error } = await supabaseLocal
                    .from('appointments')
                    .upsert(payload, { onConflict: 'id' })
                    .select();

                if (error) throw error;
                
                // Update cache
                const cached = getCache(CACHE_KEYS.APPOINTMENTS) || [];
                const updatedApt = {
                    id: data[0].id,
                    musteriAdi: data[0].musteri_adi,
                    telefon: data[0].telefon,
                    hizmetId: data[0].hizmet_id,
                    tarih: data[0].tarih,
                    saat: data[0].saat,
                    durum: data[0].durum,
                    notlar: data[0].notlar
                };
                
                const idx = cached.findIndex(a => a.id === updatedApt.id);
                if (idx > -1) cached[idx] = updatedApt;
                else cached.push(updatedApt);
                setCache(CACHE_KEYS.APPOINTMENTS, cached);

                return updatedApt;
            } catch (err) {
                console.error("SaveAppointment Critical Error:", err);
                throw err;
            }
        },

        async deleteAppointment(id) {
            if (!supabaseLocal) return;
            const { error } = await supabaseLocal.from('appointments').delete().eq('id', id);
            if (error) throw error;
            
            // Update cache
            const cached = getCache(CACHE_KEYS.APPOINTMENTS) || [];
            const filtered = cached.filter(a => a.id !== id);
            setCache(CACHE_KEYS.APPOINTMENTS, filtered);
        },

        async getPatientProfiles() {
            if (!supabaseLocal) return {};
            const cached = getCache(CACHE_KEYS.PROFILES);

            const fetchFresh = async () => {
                const { data, error } = await supabaseLocal.from('patient_profiles').select('*');
                if (error) return cached || {};
                
                const profiles = {};
                data.forEach(p => {
                    profiles[p.patient_name] = {
                        meds: p.meds,
                        notesList: p.notes_list,
                        stockHistory: p.stock_history
                    };
                });
                setCache(CACHE_KEYS.PROFILES, profiles);
                window.dispatchEvent(new CustomEvent('db:profiles_updated', { detail: profiles }));
                return profiles;
            };

            const freshPromise = fetchFresh();
            return cached || await freshPromise;
        },

        async savePatientProfile(name, profile) {
            if (!supabaseLocal) return;
            const { data: { user } } = await supabaseLocal.auth.getUser();
            if (!user) return;

            const { data: existing } = await supabaseLocal.from('patient_profiles').select('id').eq('patient_name', name).maybeSingle();
            
            const payload = {
                user_id: user.id,
                patient_name: name,
                meds: profile.meds || [],
                notes_list: profile.notesList || [],
                stock_history: profile.stockHistory || []
            };

            if (existing) payload.id = existing.id;

            const { error } = await supabaseLocal.from('patient_profiles').upsert(payload, { onConflict: 'id' });
            if (!error) {
                const cached = getCache(CACHE_KEYS.PROFILES) || {};
                cached[name] = profile;
                setCache(CACHE_KEYS.PROFILES, cached);
            }
        },

        async getInventory() {
            if (!supabaseLocal) return { stock: {}, items: [] };
            const cached = getCache(CACHE_KEYS.INVENTORY);

            const fetchFresh = async () => {
                const { data, error } = await supabaseLocal.from('inventory').select('*');
                if (error) return cached || { stock: {}, items: [] };

                const stock = {};
                const items = data.map(d => {
                    stock[d.item_id] = parseFloat(d.quantity);
                    return {
                        id: d.item_id,
                        ad: d.name,
                        birim: d.unit,
                        kritik_stok: parseFloat(d.kritik_stok)
                    };
                });
                const result = { stock, items };
                setCache(CACHE_KEYS.INVENTORY, result);
                window.dispatchEvent(new CustomEvent('db:inventory_updated', { detail: result }));
                return result;
            };

            const freshPromise = fetchFresh();
            return cached || await freshPromise;
        },

        async saveInventoryItem(item, quantity) {
            if (!supabaseLocal) return;
            const { data: { user } } = await supabaseLocal.auth.getUser();
            if (!user) return;

            const { data: existing } = await supabaseLocal.from('inventory').select('id').eq('item_id', item.id).maybeSingle();
            
            const payload = {
                user_id: user.id,
                item_id: item.id,
                name: item.ad,
                unit: item.birim,
                quantity: quantity,
                kritik_stok: item.kritik_stok || 10
            };

            if (existing) payload.id = existing.id;

            const { error } = await supabaseLocal.from('inventory').upsert(payload, { onConflict: 'id' });
            if (!error) {
                const cached = getCache(CACHE_KEYS.INVENTORY) || { stock: {}, items: [] };
                cached.stock[item.id] = quantity;
                if (!cached.items.find(i => i.id === item.id)) {
                    cached.items.push(item);
                }
                setCache(CACHE_KEYS.INVENTORY, cached);
            }
        },

        async deleteInventoryItem(itemId) {
            if (!supabaseLocal) return;
            
            const { error } = await supabaseLocal
                .from('inventory')
                .delete()
                .eq('item_id', itemId);
                
            if (error) throw error;
            
            // Update cache
            const cached = getCache(CACHE_KEYS.INVENTORY);
            if (cached) {
                cached.items = cached.items.filter(i => i.id !== itemId);
                delete cached.stock[itemId];
                setCache(CACHE_KEYS.INVENTORY, cached);
            }
        }
    };

    // 4. MIGRATION LOGIC (One-time)
    async function runAutoMigration() {
        // v2 flag ensures it retries now that the schema is fixed
        const isMigrated = localStorage.getItem('supabase_migrated_v2') === 'true';
        if (isMigrated) return;

        console.log("Migration Starting (v2)...");
        
        try {
            // 1. Appointments
            const localApts = JSON.parse(localStorage.getItem('randevular') || '[]');
            if (localApts.length > 0) {
                for (const apt of localApts) {
                    try {
                        await window.db.saveAppointment(apt);
                    } catch (e) {
                        console.error("Migrating individual apt failed:", e);
                    }
                }
            }

            // 2. Profiles
            const localProfiles = JSON.parse(localStorage.getItem('hasta_profilleri') || '{}');
            for (const name in localProfiles) {
                try {
                    await window.db.savePatientProfile(name, localProfiles[name]);
                } catch (e) {
                    console.error("Migrating individual profile failed:", e);
                }
            }

            // 3. Inventory
            const localStock = JSON.parse(localStorage.getItem('klinik_stok') || '{}');
            const localItems = JSON.parse(localStorage.getItem('klinik_stok_tanimlari') || '[]');
            for (const item of localItems) {
                try {
                    const qty = localStock[item.id] || 0;
                    await window.db.saveInventoryItem(item, qty);
                } catch (e) {
                    console.error("Migrating individual stock failed:", e);
                }
            }

            localStorage.setItem('supabase_migrated_v2', 'true');
            console.log("Migration v2 Completed!");
        } catch (e) {
            console.error("Migration v2 Failed:", e);
        }
    }

    // 5. UI INJECTION (Always runs safely)
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

    // 6. BOOTSTRAP
    const bootstrap = async () => {
        try {
            initSupabase();
            injectSidebar();
            
            const { data: { session } } = await supabaseLocal.auth.getSession();
            if (session) {
                await runAutoMigration();
            }

            checkAuth();
            if (document.body.id === 'login-page') handleLogin();

            // Load SPA engine (Instant navigation)
            if (document.body.id !== 'login-page') {
                const spaScript = document.createElement('script');
                spaScript.src = 'spa.js';
                document.body.appendChild(spaScript);
            }
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
