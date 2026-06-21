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
          6698 Sayılı Kişisel Verilerin Korunması Kanunu Kapsamında
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
          <h2 className="text-xl font-bold text-slate-900">4. İlgili Kişinin Hakları (Madde 11)</h2>
          <p className="text-slate-600 leading-relaxed">
            KVKK’nın 11. maddesi uyarınca veri sahipleri şu haklara sahiptir:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Kişisel verilerinin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme.</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme.</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme.</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme, silinmesini veya yok edilmesini talep etme.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">5. Başvuru ve İletişim</h2>
          <p className="text-slate-600 leading-relaxed">
            Haklarınızı kullanmak için taleplerinizi kimliğinizi tevsik edici belgelerle birlikte <strong>kvkk@bicalendo.com</strong> adresine iletebilirsiniz. Başvurularınız kanuni süre olan en geç 30 gün içinde yanıtlanacaktır. (Not: Hastaların kendi verilerine ilişkin taleplerini doğrudan hizmet aldıkları kliniğe/hekime iletmeleri gerekmektedir).
          </p>
        </div>
      </section>
    </article>
  );
}
