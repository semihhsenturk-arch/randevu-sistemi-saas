/**
 * spa.js - Uzm. Dr. Yelda Yaren Şentürk | Instant Navigation
 * Bu dosya sayfalar arası geçişi sayfa yenilemeden (anlık) yapar.
 */

(function() {
    // SPA'nın aktif olması gereken ana kapsayıcı
    const CONTENT_SELECTOR = '.main-content';
    const LINK_SELECTOR = 'a[href$=".html"]';

    async function loadPage(url, pushState = true) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Sayfa yüklenemedi');
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            const newContent = doc.querySelector(CONTENT_SELECTOR);
            const currentContent = document.querySelector(CONTENT_SELECTOR);
            
            if (newContent && currentContent) {
                // Sayfa başlığını güncelle
                document.title = doc.title;
                
                // İçeriği değiştir
                currentContent.innerHTML = newContent.innerHTML;
                
                // Stilleri senkronize et (Sayfaya özgü stiller için)
                syncStyles(doc);

                // Body ID'sini güncelle (Sidebar aktiflik durumu için önemli)
                document.body.id = doc.body.id;
                
                // URL'yi güncelle
                if (pushState) {
                    window.history.pushState({ url }, '', url);
                }

                // Sidebar'daki aktif link durumunu güncelle
                updateSidebarActiveState();

                // Sayfaya özgü scriptleri çalıştır
                reinitializePageScripts(doc);
                
                // Sayfayı en üste kaydır
                window.scrollTo(0, 0);
            } else {
                // Eğer yapı farklıysa normal yönlendirme yap
                window.location.href = url;
            }
        } catch (error) {
            console.error('SPA Load Error:', error);
            window.location.href = url;
        }
    }

    function updateSidebarActiveState() {
        const bodyId = document.body.id;
        document.querySelectorAll('.nav-link').forEach(link => {
            const linkHref = link.getAttribute('href');
            // href ile body id eşleşmesini kontrol et (auth.js'deki injectSidebar mantığına paralel)
            const pageIdForLink = linkHref.replace('.html', '-page');
            if (linkHref === 'index.html' && bodyId === 'index-page') {
                link.classList.add('active');
            } else if (bodyId === pageIdForLink) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    function syncStyles(newDoc) {
        // Eski sayfaya özgü stilleri temizle
        document.querySelectorAll('style[data-spa-style]').forEach(s => s.remove());
        
        // Yeni sayfadaki tüm stilleri al
        const styles = newDoc.querySelectorAll('style');
        styles.forEach(oldStyle => {
            const newStyle = document.createElement('style');
            newStyle.textContent = oldStyle.textContent;
            newStyle.setAttribute('data-spa-style', 'true');
            document.head.appendChild(newStyle);
        });
    }

    function reinitializePageScripts(newDoc) {
        // 1. Lucide ikonlarını yenile
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // 2. Yeni dokümandaki inline scriptleri bul ve çalıştır
        const scripts = newDoc.querySelectorAll('script:not([src])');
        scripts.forEach(oldScript => {
            const newScript = document.createElement('script');
            // DOMContentLoaded olayını bekleyen scriptleri hemen çalışacak hale getir
            let content = oldScript.textContent;
            
            // Eğer script DOMContentLoaded bekliyorsa, içeriği çıkarıp doğrudan çalıştırabiliriz
            // Veya script çalıştıktan sonra manuel olarak init() çağırabiliriz
            newScript.textContent = content;
            newScript.setAttribute('data-spa-script', 'true');
            
            // Eski SPA scriptlerini temizle (opsiyonel ama temizlik iyidir)
            document.querySelectorAll('script[data-spa-script]').forEach(s => s.remove());
            
            document.body.appendChild(newScript);
            
            // Sayfada 'init' fonksiyonu varsa çalıştır (DOMContentLoaded yerine)
            setTimeout(() => {
                if (typeof window.init === 'function') {
                    window.init();
                }
            }, 10);
        });
    }

    // Tıklamaları yakala
    document.addEventListener('click', e => {
        const link = e.target.closest(LINK_SELECTOR);
        if (link && !link.target && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
            const url = link.getAttribute('href');
            // Sadece internal linkleri ve .html ile bitenleri SPA ile aç
            if (url && !url.startsWith('http') && !url.startsWith('#')) {
                e.preventDefault();
                loadPage(url);
            }
        }
    });

    // Back/Forward butonları
    window.addEventListener('popstate', e => {
        if (e.state && e.state.url) {
            loadPage(e.state.url, false);
        } else {
            // State yoksa (ilk yüklendiği sayfa gibi) normal yükle
            window.location.reload();
        }
    });

    // İlk yüklemede state ata
    if (!window.history.state) {
        window.history.replaceState({ url: window.location.pathname }, '', window.location.pathname);
    }

    console.log('SPA Engine Active');
})();
