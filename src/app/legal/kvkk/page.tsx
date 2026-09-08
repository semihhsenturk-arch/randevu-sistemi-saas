export const metadata = {
  title: "KVKK Aydınlatma Metni | BiCalendo",
  description: "BiCalendo Kişisel Verilerin Korunması Kanunu (KVKK) Hakkında Aydınlatma Metni",
};

export default function KVKKPage() {
  return (
    <article className="prose prose-slate max-w-none">
      <div className="space-y-4 mb-12 border-b border-slate-100 pb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-0">
          KVKK Aydınlatma Metni
        </h1>
        <p className="text-slate-500 font-medium">
          6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında (Son Güncelleme: Eylül 2026)
        </p>
      </div>

      <section className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">1. Veri Sorumlusu ve Veri İşleyen Ayrımı</h2>
          <p className="text-slate-600 leading-relaxed">
            BiCalendo olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca iki farklı hukuki statüde faaliyet göstermekteyiz:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li><strong>Klinik/Hekim Verileri İçin (Veri Sorumlusu):</strong> Platformumuza üye olan hekimlerin ve klinik yetkililerinin üyelik, iletişim ve fatura bilgilerinin işlenmesinde BiCalendo "Veri Sorumlusu"dur.</li>
            <li><strong>Hasta Verileri İçin (Veri İşleyen):</strong> Kliniklerin platforma kaydettiği hastalarına ait kişisel ve özel nitelikli (sağlık) kişisel verilerin işlenmesinde ve saklanmasında BiCalendo, ilgili kliniğin/hekimin talimatları doğrultusunda hareket eden "Veri İşleyen" konumundadır. Bu verilerin KVKK'ya uygun olarak toplanması ve hastalardan <strong>Açık Rıza</strong> alınması sorumluluğu tamamen platformu kullanan Kliniğe/Hekime aittir.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">2. İşlenen Kişisel Verileriniz ve İşleme Amaçları</h2>
          <p className="text-slate-600 leading-relaxed">
            Veri Sorumlusu sıfatıyla tarafımızca işlenen verileriniz (Klinik Kullanıcıları) aşağıdaki amaçlarla işlenmektedir:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Üyelik sözleşmesinin kurulması, platformun kullandırılması ve faturalandırma (KVKK md. 5/2-c).</li>
            <li>İletişim faaliyetlerinin ve teknik destek hizmetlerinin yürütülmesi.</li>
            <li>5651 sayılı İnternet Ortamında Yapılan Yayınların Düzenlenmesi Hakkında Kanun uyarınca trafik kayıtlarının (IP adresi, log kayıtları) tutulması (KVKK md. 5/2-ç).</li>
            <li>Platform güvenliğinin sağlanması ve yasal yükümlülüklerin ifası.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">3. Kişisel Verilerin Aktarılması</h2>
          <p className="text-slate-600 leading-relaxed">
            Kişisel verileriniz; kanuni yükümlülüklerimizin yerine getirilmesi amacıyla yetkili kamu kurum ve kuruluşlarıyla, finansal süreçlerin yürütülmesi için ödeme kuruluşlarıyla (örn. İyzico) ve altyapı hizmeti aldığımız bulut sunucu sağlayıcılarıyla (gerekli gizlilik ve güvenlik taahhütleri alınarak) paylaşılmaktadır. Platformun kullandığı bulut sunucularının (ör. Supabase, AWS) yurt dışında bulunması halinde, verileriniz KVKK md. 9 kapsamında yurt dışına aktarılabilmektedir.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">4. Veri Güvenliği Önlemlerimiz</h2>
          <p className="text-slate-600 leading-relaxed">
            Veri işleyen sıfatıyla altyapımızda barındırılan verilerin KVKK Madde 12 uyarınca hukuka aykırı erişilmesini önlemek amacıyla alınan idari ve teknik tedbirler şunlardır:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li><strong>Mantıksal İzolasyon (RLS):</strong> Platformdaki her kliniğin verisi Satır Bazlı Güvenlik (Row Level Security) mimarisiyle birbirlerinden fiziksel ve mantıksal olarak izole edilmiştir.</li>
            <li><strong>Şifreleme:</strong> T.C. Kimlik Numarası, İletişim Bilgileri ve Tıbbi Notlar gibi Özel Nitelikli Kişisel Veriler AES-256 standardında şifrelenerek veritabanında (at-rest) korunmaktadır.</li>
            <li><strong>İz Kayıtları (Audit Logs):</strong> Veritabanında yapılan tüm değişiklikler (ekleme, silme, güncelleme) hangi kullanıcı tarafından yapıldığı ile birlikte kalıcı olarak loglanmaktadır.</li>
            <li><strong>Saldırı Koruması:</strong> API uç noktalarımız Hız Sınırlandırma (Rate Limiting) sistemleriyle DDoS ve Bot saldırılarına karşı koruma altındadır.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">5. Veri Saklama Süreleri ve İmha Politikası</h2>
          <p className="text-slate-600 leading-relaxed">
            Kişisel verileriniz, işlenme amacının gerektirdiği süre boyunca saklanmaktadır. Veri kategorilerine göre saklama süreleri şu şekildedir:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li><strong>Hasta Sağlık Verileri:</strong> Son tedavi tarihinden itibaren 10 yıl (Tıbbi kayıt saklama yükümlülüğü — Hasta Hakları Yönetmeliği md. 21).</li>
            <li><strong>Klinik Üyelik Verileri:</strong> Üyelik sonlandırılmasından itibaren 5 yıl (Türk Borçlar Kanunu genel zamanaşımı).</li>
            <li><strong>Ödeme Kayıtları:</strong> İşlem tarihinden itibaren 10 yıl (Vergi Usul Kanunu md. 253).</li>
            <li><strong>Erişim ve İz Kayıtları:</strong> 2 yıl (5651 sayılı Kanun md. 5).</li>
          </ul>
          <p className="text-slate-600 leading-relaxed">
            Saklama süresi dolan veriler, periyodik imha süreçleri kapsamında silinmekte veya anonim hale getirilmektedir.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">6. Yurt Dışına Veri Aktarımı</h2>
          <p className="text-slate-600 leading-relaxed">
            Platformun altyapı hizmeti aldığı Supabase, Amazon Web Services (AWS) gibi hizmet sağlayıcılarının sunucuları yurt dışında (ABD ve AB bölgeleri) konumlanmaktadır. Bu aktarımlar aşağıdaki hukuki çerçevede gerçekleştirilmektedir:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li><strong>Veri İşleyen Sözleşmesi (DPA):</strong> Her bir altyapı sağlayıcısıyla KVKK md. 12 ve GDPR uyumlu Veri İşleme Sözleşmesi (Data Processing Agreement) imzalanmıştır.</li>
            <li><strong>KVKK Kurulu Taahhütname:</strong> KVKK md. 9/2-b kapsamında, yeterli koruma bulunmayan ülkelere aktarım için taahhütname başvurusu yapılmıştır.</li>
            <li><strong>Teknik Güvenlik:</strong> Aktarılan veriler transit ve dinlenme halinde (in-transit ve at-rest) AES-256 standardında şifrelenmektedir.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">7. İlgili Kişinin Hakları (Madde 11)</h2>
          <p className="text-slate-600 leading-relaxed">
            KVKK&apos;nın 11. maddesi uyarınca veri sahipleri şu haklara sahiptir:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Kişisel verilerinin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme.</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme.</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme.</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme.</li>
            <li><strong>Silinmesini, yok edilmesini veya anonim hale getirilmesini talep etme (Unutulma Hakkı — md. 7).</strong></li>
            <li><strong>Açık rızasını geri çekme hakkı.</strong> Rıza geri çekilmesi halinde, geri çekilme öncesinde yapılan veri işleme faaliyetlerinin hukuka uygunluğu korunur.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">8. Başvuru ve İletişim</h2>
          <p className="text-slate-600 leading-relaxed">
            Haklarınızı kullanmak için taleplerinizi kimliğinizi tevsik edici belgelerle birlikte <strong>kvkk@bicalendo.com</strong> adresine iletebilirsiniz. Başvurularınız kanuni süre olan en geç 30 gün içinde yanıtlanacaktır. (Not: Hastaların kendi verilerine ilişkin taleplerini doğrudan hizmet aldıkları kliniğe/hekime iletmeleri gerekmektedir).
          </p>
        </div>
      </section>
    </article>
  );
}
