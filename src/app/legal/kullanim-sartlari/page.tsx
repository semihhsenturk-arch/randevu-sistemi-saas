export const metadata = {
  title: "Kullanım Şartları | BiCalendar",
  description: "BiCalendar Klinik Yönetim Sistemi Kullanım Şartları ve Hizmet Koşulları",
};

export default function TermsPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <div className="space-y-4 mb-12 border-b border-slate-100 pb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-0">
          Kullanım Şartları
        </h1>
        <p className="text-slate-500 font-medium">
          BiCalendar Hizmet Koşulları
        </p>
      </div>

      <section className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">1. Kabul ve Kapsam</h2>
          <p className="text-slate-600 leading-relaxed">
            BiCalendar ("Platform") web sitesine erişerek veya hizmetlerini kullanarak, bu Kullanım Şartları'nı, Gizlilik Politikamızı ve ilgili tüm yasal düzenlemeleri kabul etmiş sayılırsınız. Şartları kabul etmiyorsanız, lütfen hizmetleri kullanmayınız.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">2. Hizmet Tanımı</h2>
          <p className="text-slate-600 leading-relaxed">
            BiCalendar, sağlık profesyonellerine ve kliniklere yönelik bir randevu takip, hasta kayıt ve klinik yönetim yazılımıdır. Platform "Olduğu Gibi" (As-Is) esasıyla sunulmaktadır.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">3. Kullanıcı Sorumlulukları</h2>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Hesap bilgilerinin gizliliğini korumak kullanıcının sorumluluğundadır.</li>
            <li>Platform üzerinden girilen hasta verilerinin doğruluğu ve yasalara uygunluğu kullanıcıya aittir.</li>
            <li>Platformun kötüye kullanımı, sisteme zarar verecek faaliyetler yasaktır.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">4. Üyelik, Ödemeler ve İade Koşulları</h2>
          <p className="text-slate-600 leading-relaxed">
            BiCalendar, seçilen pakete göre aylık veya yıllık abonelik modeliyle çalışır. 
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Ödemeler Iyzico aracılığıyla güvenli bir şekilde alınır.</li>
            <li>İptal talepleri bir sonraki fatura döneminden itibaren geçerli olur. Mevcut dönem için kısmi iade yapılmaz.</li>
            <li>Hizmetimiz dijital bir yazılım (SaaS) olduğu için, 6502 sayılı Tüketicinin Korunması Hakkında Kanun uyarınca "anında ifa edilen hizmetler" kapsamındadır ve cayma hakkı istisnasına tabidir. Ancak kullanıcı memnuniyeti adına ilk 7 gün içindeki teknik sorunlarda iade talepleri değerlendirilir.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">5. Fikri Mülkiyet Hakları</h2>
          <p className="text-slate-600 leading-relaxed">
            Platformun tasarımı, yazılım kodları, logoları ve tüm içerikleri BiCalendar'a aittir ve telif hakları ile korunmaktadır. Önceden yazılı izin alınmaksızın kopyalanamaz veya dağıtılamaz.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">6. Hizmet Kesintileri ve Sorumluluk</h2>
          <p className="text-slate-600 leading-relaxed">
            Teknik bakım veya beklenmedik sunucu sorunları nedeniyle oluşabilecek kısa süreli kesintilerden BiCalendar sorumlu tutulamaz. Veri kaybını önlemek için sistemimiz düzenli yedekleme yapmaktadır ancak kullanıcıların da kendi verilerini arşivlemesi önerilir.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">7. Değişiklikler</h2>
          <p className="text-slate-600 leading-relaxed">
            BiCalendar, bu şartları dilediği zaman güncelleme hakkını saklı tutar. Değişiklikler platform üzerinde yayınlandığı andan itibaren geçerlilik kazanır.
          </p>
        </div>
      </section>
    </article>
  );
}
