export const metadata = {
  title: "Gizlilik Sözleşmesi | BiCalendar",
  description: "BiCalendar Klinik Yönetim Sistemi Gizlilik Sözleşmesi ve Veri Güvenliği Politikası",
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
          <h2 className="text-xl font-bold text-slate-900">1. Giriş</h2>
          <p className="text-slate-600 leading-relaxed">
            BiCalendar ("biz", "tarafımızca"), kullanıcılarımızın gizliliğine ve verilerinin güvenliğine en yüksek önemi vermektedir. Bu Gizlilik Sözleşmesi, BiCalendar Klinik Yönetim Sistemi platformu üzerinden toplanan bilgilerin nasıl kullanıldığını, saklandığını ve korunduğunu açıklamaktadır.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">2. Toplanan Bilgiler</h2>
          <p className="text-slate-600 leading-relaxed">
            Hizmetlerimizi sunabilmek için aşağıdaki veri türlerini toplamaktayız:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li><strong>Kullanıcı Bilgileri:</strong> İsim, e-posta adresi, klinik adı, telefon numarası.</li>
            <li><strong>Hasta Verileri:</strong> Platforma girdiğiniz hasta kayıtları, randevu bilgileri ve tıbbi notlar.</li>
            <li><strong>Ödeme Bilgileri:</strong> Kredi kartı bilgileri tarafımızca saklanmaz; bu veriler güvenli ödeme aracımız (Iyzico) tarafından işlenir.</li>
            <li><strong>Kullanım Verileri:</strong> IP adresi, tarayıcı tipi, platform içi etkileşimler.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">3. Verilerin Kullanım Amacı</h2>
          <p className="text-slate-600 leading-relaxed">
            Toplanan bilgiler şu amaçlarla kullanılır:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Klinik yönetim hizmetlerinin sunulması ve sürdürülmesi.</li>
            <li>Randevu hatırlatmalarının ve bildirimlerin iletilmesi.</li>
            <li>Hesap güvenliğinin sağlanması ve teknik destek sunulması.</li>
            <li>Hizmetlerimizin iyileştirilmesi ve analizlerin yapılması.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">4. Veri Güvenliği ve Teknik Önlemler</h2>
          <p className="text-slate-600 leading-relaxed">
            Verileriniz endüstri standardı yöntemlerle korunmaktadır:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li><strong>Şifreleme:</strong> Tüm veriler aktarım sırasında SSL/TLS ve bekleme sırasında (at rest) AES-256 protokolleri ile şifrelenir.</li>
            <li><strong>Erişim Kontrolü:</strong> Verilere erişim sadece yetkili personel ile sınırlıdır ve her erişim loglanır.</li>
            <li><strong>Yedekleme:</strong> Verileriniz olası kayıplara karşı günlük olarak yedeklenir.</li>
            <li><strong>İzleme:</strong> Şüpheli aktiviteler ve yetkisiz erişim denemeleri 7/24 otomatik sistemlerle izlenir.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">5. Veri Paylaşımı</h2>
          <p className="text-slate-600 leading-relaxed">
            BiCalendar, kullanıcı ve hasta verilerini üçüncü taraflara satmaz. Ancak, hizmetin ifası için zorunlu olan durumlarda (örneğin ödeme işlemleri için Iyzico, SMS gönderimi için aracı kurumlar) ilgili veriler paydaşlarla paylaşılabilir.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">6. Çerezler (Cookies)</h2>
          <p className="text-slate-600 leading-relaxed">
            Platform deneyiminizi iyileştirmek için çerezler kullanmaktayız. Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz; ancak bu durum platformun bazı özelliklerinin çalışmasını etkileyebilir.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">7. İletişim</h2>
          <p className="text-slate-600 leading-relaxed">
            Gizlilik politikamızla ilgili sorularınız için bizimle iletişime geçebilirsiniz: <strong>destek@bicalendar.com</strong>
          </p>
        </div>
      </section>
    </article>
  );
}
