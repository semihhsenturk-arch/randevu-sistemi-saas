export const metadata = {
  title: "Mesafeli Satış Sözleşmesi | Dermofis",
  description: "Dermofis Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu",
};

export default function MesafeliSatisSozlesmesiPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <div className="space-y-4 mb-12 border-b border-slate-100 pb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-0">
          Mesafeli Satış Sözleşmesi ve Ön Bilgilendirme Formu
        </h1>
        <p className="text-slate-500 font-medium">
          Son Güncelleme: Eylül 2026
        </p>
      </div>

      <section className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">1. Taraflar</h2>
          <p className="text-slate-600 leading-relaxed">
            İşbu sözleşme, bir tarafta hizmeti sunan ("Satıcı/Hizmet Sağlayıcı" olarak anılacaktır) ile diğer tarafta hizmeti satın alan klinik/hekim ("Alıcı" olarak anılacaktır) arasında aşağıda belirtilen hüküm ve şartlar çerçevesinde elektronik ortamda onaylanarak yürürlüğe girmiştir.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">2. Sözleşmenin Konusu</h2>
          <p className="text-slate-600 leading-relaxed">
            İşbu sözleşmenin konusu, Alıcı'nın Satıcı'ya ait elektronik ortamda faaliyet gösteren Dermofis SaaS platformu üzerinden elektronik ortamda siparişini yaptığı ve ödemesini gerçekleştirdiği dijital hizmetin (Klinik Yönetim Yazılımı Aboneliği) satışı ve ifası ile ilgili olarak 6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği hükümleri gereğince tarafların hak ve yükümlülüklerinin saptanmasıdır.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">3. Hizmet Bedeli ve Ödeme Şartları</h2>
          <p className="text-slate-600 leading-relaxed">
            Hizmetin tüm vergiler dahil satış fiyatı ve ödeme koşulları (aylık/yıllık abonelik), sipariş ekranında ve Alıcı'ya gönderilen bilgilendirme e-postasında yer aldığı gibidir. Kredi kartı ile yapılan ödemelerde banka veya ödeme kuruluşu tarafından uygulanan komisyon, taksitlendirme farkı vb. ek bedeller tamamen Alıcı'nın bankası ile olan sözleşmesine bağlıdır.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">4. Cayma Hakkı ve İade İstisnaları</h2>
          <p className="text-slate-600 leading-relaxed">
            Mesafeli Sözleşmeler Yönetmeliği uyarınca; <strong>elektronik ortamda anında ifa edilen hizmetler ve tüketiciye anında teslim edilen gayrimaddi mallar cayma hakkının istisnaları arasındadır.</strong> İşbu sözleşmeye konu olan "Dermofis SaaS Aboneliği", dijital ortamda anında erişim sağlanan bir hizmet olduğundan yasal cayma hakkı bulunmamaktadır. Alıcı, ödeme işlemini gerçekleştirdiğinde hizmete anında erişim sağlayacağını ve cayma hakkını kaybedeceğini kabul, beyan ve taahhüt eder. Ancak Alıcı aboneliğini dilediği zaman iptal edebilir, bu durumda iptal bir sonraki fatura döneminden itibaren geçerli olur.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">5. Hizmetin Kullanımı ve Erişilebilirlik</h2>
          <p className="text-slate-600 leading-relaxed">
            Satıcı, mücbir sebepler, yasal düzenlemeler veya sistem bakımları dışında hizmetin %99 oranında kesintisiz (uptime) sunulması için gerekli teknik altyapıyı sağlar. Planlı bakım çalışmaları Alıcı'ya önceden e-posta yoluyla bildirilir. Alıcı, platformu hukuka, genel ahlaka ve Kullanım Koşulları'na uygun olarak kullanmayı taahhüt eder.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">6. Veri Güvenliği ve KVKK</h2>
          <p className="text-slate-600 leading-relaxed">
            Hizmet kapsamında işlenen kişisel veriler, Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca korunmaktadır. Alıcı, kendi hastalarına ait verileri platforma girerken KVKK uyarınca aydınlatma yapma ve gerekli rızaları alma yükümlülüğünün tamamen kendisine ait olduğunu kabul eder. Satıcı'nın veri işleyen sıfatıyla aldığı güvenlik önlemleri KVKK Aydınlatma Metninde detaylandırılmıştır.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">7. Yetkili Mahkeme</h2>
          <p className="text-slate-600 leading-relaxed">
            İşbu sözleşmeden doğabilecek her türlü ihtilafın çözümünde, Ticaret Bakanlığınca her yıl ilan edilen değere kadar Tüketici Hakem Heyetleri, söz konusu değerin üzerindeki ihtilaflarda ise Tüketici Mahkemeleri yetkilidir. Ticari nitelikteki işlemlerde İstanbul Çağlayan Mahkemeleri ve İcra Daireleri yetkilidir.
          </p>
        </div>
      </section>
    </article>
  );
}
