export const metadata = {
  title: "İptal ve İade Koşulları | Dermofis",
  description: "Dermofis İptal ve İade Politikası",
};

export default function IadePolitikasiPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <div className="space-y-4 mb-12 border-b border-slate-100 pb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-0">
          İptal ve İade Koşulları
        </h1>
        <p className="text-slate-500 font-medium">
          Son Güncelleme: Eylül 2026
        </p>
      </div>

      <section className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">1. Cayma Hakkının İstisnaları</h2>
          <p className="text-slate-600 leading-relaxed">
            Dermofis tarafından sunulan Klinik Yönetim Sistemi hizmeti, 6502 Sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği madde 15/1-ğ bendi uyarınca "Elektronik ortamda anında ifa edilen hizmetler veya tüketiciye anında teslim edilen gayrimaddi mallar" kapsamındadır. Bu sebeple, abonelik başlatıldıktan ve hizmet kullanımı açıldıktan sonra kullanıcıların cayma hakkı bulunmamaktadır ve ücret iadesi yapılamaz.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">2. Abonelik İptali</h2>
          <p className="text-slate-600 leading-relaxed">
            Kullanıcılar (Alıcılar), Dermofis aboneliklerini diledikleri zaman hesap ayarları menüsünden veya destek ekibine e-posta göndererek iptal edebilirler. Abonelik iptal talebi alındığında, kullanıcının hesabı mevcut fatura döneminin sonuna kadar (aylık veya yıllık ödenmiş süre boyunca) aktif kalmaya devam eder. Dönem sonunda ise hesap pasif hale getirilir ve bir sonraki dönem için otomatik yenileme (tahsilat) yapılmaz.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">3. İade Talepleri ve Özel Durumlar</h2>
          <p className="text-slate-600 leading-relaxed">
            Hizmet doğası gereği ücret iadesine tabi olmamakla birlikte, sistemimizden kaynaklanan ve 48 saatten uzun süren erişim kesintilerinde (mücbir sebepler hariç) kullanıcılarımızın mağduriyetini gidermek adına destek ekibimiz duruma göre oransal iade veya abonelik süresi uzatımı yapma hakkını saklı tutar.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">4. İptal Halinde Verilerin Durumu</h2>
          <p className="text-slate-600 leading-relaxed">
            Aboneliği iptal edilen veya süresi dolan hesaplara ait veriler, KVKK ve ilgili sağlık mevzuatlarına uygun olarak sistemlerimizde yasal saklama süreleri boyunca güvenle muhafaza edilir. Kullanıcı, dilerse hesabını tamamen sildirme (Unutulma Hakkı) talebinde bulunabilir, bu durumda tüm veriler geri döndürülemez şekilde anonimleştirilir veya silinir.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">5. İletişim</h2>
          <p className="text-slate-600 leading-relaxed">
            İptal ve iade süreçleriyle ilgili her türlü sorunuz için destek@dermofis.com adresinden bizimle iletişime geçebilirsiniz.
          </p>
        </div>
      </section>
    </article>
  );
}
