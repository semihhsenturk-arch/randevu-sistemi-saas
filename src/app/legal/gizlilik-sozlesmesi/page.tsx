export const metadata = {
  title: "Gizlilik Sözleşmesi | BiCalendo",
  description: "BiCalendo Klinik Yönetim Sistemi Gizlilik Sözleşmesi ve Veri Güvenliği Politikası",
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <div className="space-y-4 mb-12 border-b border-slate-100 pb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-0">
          Gizlilik Sözleşmesi
        </h1>
        <p className="text-slate-500 font-medium">
          Son Güncelleme: 2 Mayıs 2026
        </p>
      </div>

      <section className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">1. Giriş ve Taraflar</h2>
          <p className="text-slate-600 leading-relaxed">
            BiCalendo ("biz", "tarafımızca"), kliniklerin ve sağlık profesyonellerinin ("Kullanıcı") kullanımına sunulan bulut tabanlı bir yönetim platformudur. Bu Gizlilik Sözleşmesi, platform üzerinden toplanan bilgilerin nasıl kullanıldığını, saklandığını ve korunduğunu açıklamaktadır.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">2. Toplanan Bilgiler ve Toplama Yöntemleri</h2>
          <p className="text-slate-600 leading-relaxed">
            Hizmetlerimizi sunabilmek için aşağıdaki veri türlerini toplamaktayız:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li><strong>Kullanıcı (Klinik) Bilgileri:</strong> İsim, e-posta adresi, klinik adı, vergi numarası/TCKN ve fatura bilgileri.</li>
            <li><strong>Hasta Verileri:</strong> Platforma Kullanıcı tarafından girilen hasta kayıtları, randevu bilgileri, dijital onamlar ve tıbbi notlar. (BiCalendo bu veriler için yalnızca Veri İşleyen'dir.)</li>
            <li><strong>Ödeme Bilgileri:</strong> Kredi kartı bilgileri tarafımızca saklanmaz; bu veriler BDDK lisanslı güvenli ödeme aracımız (örn. İyzico) tarafından işlenir.</li>
            <li><strong>Trafik ve Log Verileri:</strong> 5651 sayılı Kanun gereğince tutulması zorunlu olan IP adresleri, erişim tarih/saat bilgileri ve platform içi sistem logları.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">3. Verilerin Kullanım Amacı</h2>
          <p className="text-slate-600 leading-relaxed">
            Toplanan bilgiler şu amaçlarla kullanılır:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Klinik yönetim hizmetlerinin (SaaS) sunulması ve kesintisiz sürdürülmesi.</li>
            <li>Randevu hatırlatmalarının (SMS, E-posta, WhatsApp) otomatik iletilmesi.</li>
            <li>Yasal yükümlülüklerin (fatura kesimi, trafik kaydı tutma) yerine getirilmesi.</li>
            <li>Platform güvenliğinin sağlanması, siber saldırıların tespiti ve engellenmesi.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">4. Veri Güvenliği ve Teknik Önlemler</h2>
          <p className="text-slate-600 leading-relaxed">
            Verileriniz endüstri standardı yöntemlerle korunmaktadır:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li><strong>Şifreleme:</strong> Tüm veriler aktarım sırasında (in-transit) güçlü SSL/TLS ve bekleme sırasında (at-rest) AES-256 standartları ile şifrelenir.</li>
            <li><strong>Mantıksal İzolasyon (RLS):</strong> Supabase altyapımızda bulunan Satır Bazlı Güvenlik (Row Level Security) ile her kliniğin verisi diğerlerinden izole edilmiştir. Hiçbir klinik başka bir kliniğin verisine erişemez.</li>
            <li><strong>Yedekleme:</strong> Olası felaket senaryolarına karşı verileriniz düzenli ve güvenli olarak yedeklenir.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">5. Veri Paylaşımı ve Yurtdışına Aktarım</h2>
          <p className="text-slate-600 leading-relaxed">
            BiCalendo, kullanıcı ve hasta verilerini üçüncü taraflara kesinlikle satmaz ve pazarlama amacıyla kullanmaz. Ancak altyapı mimarimizin (bulut sunucu sağlayıcıları, veritabanı servisleri) doğası gereği, veriler gerekli güvenlik standartlarını sağlayan yurt dışı merkezli sunucularda (örn. AB bölgesi) tutulabilmektedir. Kullanıcı, platformu kullanarak bu aktarımı kabul eder. Ayrıca mali yükümlülükler için e-fatura entegratörleri ve ödeme kuruluşları ile zorunlu veri paylaşımı yapılmaktadır.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">6. Hasta Açık Rızası Sorumluluğu</h2>
          <p className="text-slate-600 leading-relaxed">
            BiCalendo sistemine girilen hastalara ait kişisel ve sağlık verilerinin, ilgili hastalardan hukuka uygun biçimde Aydınlatılmış Onam ve Açık Rıza alınarak toplanması sorumluluğu tamamen Kullanıcı'ya (Kliniğe/Hekime) aittir. BiCalendo, bu verilerin hukuka aykırı toplanmasından doğacak ihlallerden sorumlu tutulamaz.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">7. İletişim</h2>
          <p className="text-slate-600 leading-relaxed">
            Gizlilik politikamız ve veri güvenliği uygulamalarımız hakkında detaylı bilgi veya talepleriniz için bizimle iletişime geçebilirsiniz: <strong>destek@bicalendo.com</strong>
          </p>
        </div>
      </section>
    </article>
  );
}
