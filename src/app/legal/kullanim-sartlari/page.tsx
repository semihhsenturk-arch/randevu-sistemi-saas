export const metadata = {
  title: "Kullanım Şartları | BiCalendo",
  description: "BiCalendo Klinik Yönetim Sistemi Kullanım Şartları ve Hizmet Koşulları",
};

export default function TermsPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <div className="space-y-4 mb-12 border-b border-slate-100 pb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-0">
          Kullanım Şartları
        </h1>
        <p className="text-slate-500 font-medium">
          BiCalendo Hizmet Koşulları ve B2B Sözleşmesi
        </p>
      </div>

      <section className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">1. Kabul ve Kapsam</h2>
          <p className="text-slate-600 leading-relaxed">
            BiCalendo ("Platform") web sitesine erişerek veya hizmetlerini kullanarak, bu Kullanım Şartları'nı, Gizlilik Politikamızı ve KVKK Aydınlatma Metni'ni kabul etmiş sayılırsınız. Platform, münhasıran sağlık profesyonelleri, doktorlar ve kliniklerin ("Kullanıcı") ticari/mesleki kullanımı için (B2B) tasarlanmıştır.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">2. Hizmet Tanımı ve Tıbbi Sorumluluk Reddi (Disclaimer)</h2>
          <p className="text-slate-600 leading-relaxed">
            BiCalendo, randevu takibi, dijital onam, hasta kayıtları ve klinik finansal yönetimini kolaylaştıran bir "yazılım aracıdır". 
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>BiCalendo bir tıbbi cihaz veya teşhis aracı değildir.</li>
            <li>Platform üzerinden sağlanan analizler, uyarılar veya veriler hiçbir şekilde tıbbi tavsiye yerine geçmez.</li>
            <li>Tıbbi teşhis, tedavi planlaması ve hastalara yönelik her türlü tıbbi eylem tamamen Kullanıcı'nın (Hekim/Klinik) kendi mesleki sorumluluğundadır. BiCalendo olası yanlış teşhis veya malpraktis vakalarından hiçbir koşulda sorumlu tutulamaz.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">3. Kullanıcı (Klinik) Sorumlulukları ve KVKK Yükümlülüğü</h2>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Kullanıcı, hesap şifrelerinin güvenliğinden ve sistemdeki personel yetkilendirmelerinden kendisi sorumludur.</li>
            <li><strong>KVKK Kapsamında:</strong> Platforma girilen hastaların "Özel Nitelikli Kişisel Verileri" (sağlık verileri) için ilgili hastalardan Aydınlatma Metni sunulması ve Kanun'a uygun şekilde <strong>Açık Rıza</strong> alınması tamamen Kullanıcının yükümlülüğündedir. BiCalendo yalnızca altyapı sağlayıcısı (Veri İşleyen) konumundadır.</li>
            <li>Platformun reverse-engineering (tersine mühendislik) yapılması, kaynak kodlarının kopyalanması veya sisteme zarar verecek siber faaliyetlerde bulunulması kesinlikle yasaktır ve yasal işlem sebebidir.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">4. Abonelik, Ödemeler ve Ticari Şartlar</h2>
          <p className="text-slate-600 leading-relaxed">
            BiCalendo, seçilen pakete göre aylık veya yıllık abonelik modeliyle çalışır. Hizmet ticari (B2B) bir yazılım hizmeti (SaaS) olduğundan:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Abonelik yenilemeleri iptal edilmediği sürece otomatik gerçekleşir.</li>
            <li>İptal talepleri bir sonraki fatura döneminden itibaren geçerli olur. Kullanılmayan günler için kısmi ücret iadesi yapılmaz.</li>
            <li>Ticari kullanıma tabi olduğundan, 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında tanımlanan genel iade ve cayma hakları ticari işletmeler (Klinikler) için geçerli değildir.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">5. Fikri Mülkiyet Hakları</h2>
          <p className="text-slate-600 leading-relaxed">
            Platformun arayüz tasarımı, algoritmaları, yazılım kodları, "FaceMap" dahil tüm konseptleri ve BiCalendo markası telif hakları ve sınai mülkiyet kanunları ile korunmaktadır. Önceden yazılı izin alınmaksızın kopyalanamaz, çoğaltılamaz veya rakip bir ürün oluşturmak amacıyla kullanılamaz.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">6. Hizmet Seviyesi (SLA) ve Sorumluluğun Sınırlandırılması</h2>
          <p className="text-slate-600 leading-relaxed">
            Platform, endüstri standartlarında en yüksek "Uptime" (kesintisiz çalışma) oranını hedeflemekle birlikte, hizmetin %100 kesintisiz veya hatasız olacağını garanti etmez. Planlı bakımlar veya mücbir sebeplerden (ör. global sunucu çökmeleri) kaynaklı veri erişim kesintilerinden veya olası ticari/gelir kayıplarından BiCalendo sorumlu tutulamaz.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">7. Yürürlük ve Değişiklikler</h2>
          <p className="text-slate-600 leading-relaxed">
            BiCalendo, bu kullanım şartlarını yasal düzenlemeler veya ürün güncellemeleri doğrultusunda dilediği zaman değiştirme hakkını saklı tutar. Değişiklikler platform üzerinde yayınlandığı andan itibaren yürürlüğe girer. İhtilaf halinde Türkiye Cumhuriyeti Kanunları ve İstanbul Mahkemeleri yetkilidir.
          </p>
        </div>
      </section>
    </article>
  );
}
