export const metadata = {
  title: "KVKK Aydınlatma Metni | BiCalendar",
  description: "BiCalendar Kişisel Verilerin Korunması Kanunu (KVKK) Hakkında Aydınlatma Metni",
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
          <h2 className="text-xl font-bold text-slate-900">1. Veri Sorumlusu</h2>
          <p className="text-slate-600 leading-relaxed">
            BiCalendar olarak, 6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca, kişisel verilerinizi aşağıda açıklanan kapsamda işlemekteyiz.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">2. İşlenen Kişisel Verileriniz ve İşleme Amaçları</h2>
          <p className="text-slate-600 leading-relaxed">
            Platformumuza kayıt olurken ve hizmetlerimizi kullanırken işlenen kişisel verileriniz (kimlik, iletişim, işlem güvenliği verileri), aşağıdaki amaçlarla sınırlı olarak işlenmektedir:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Sözleşme süreçlerinin yürütülmesi ve hizmetlerin ifası.</li>
            <li>Randevu ve klinik süreçlerinin dijital ortamda takibi.</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi.</li>
            <li>Müşteri ilişkileri yönetimi ve destek süreçleri.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">3. Kişisel Verilerin Aktarılması</h2>
          <p className="text-slate-600 leading-relaxed">
            Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi doğrultusunda; iş ortaklarımıza, tedarikçilerimize (sunucu hizmeti sağlayıcıları vb.) ve kanunen yetkili kamu kurumlarına aktarılabilmektedir.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">4. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h2>
          <p className="text-slate-600 leading-relaxed">
            Kişisel verileriniz, platformumuz üzerinden elektronik ortamda; "sözleşmenin kurulması ve ifası", "hukuki yükümlülüklerin yerine getirilmesi" ve "ilgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfaatleri" hukuki sebeplerine dayalı olarak toplanmaktadır.
          </p>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">5. İlgili Kişinin Hakları (Madde 11)</h2>
          <p className="text-slate-600 leading-relaxed">
            KVKK’nın 11. maddesi uyarınca veri sahipleri şu haklara sahiptir:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>Kişisel verilerinin işlenip işlenmediğini öğrenme.</li>
            <li>Kişisel verileri işlenmişse buna ilişkin bilgi talep etme.</li>
            <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme.</li>
            <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme.</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme.</li>
            <li>Verilerin silinmesini veya yok edilmesini isteme.</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">6. Başvuru</h2>
          <p className="text-slate-600 leading-relaxed">
            Haklarınızı kullanmak için taleplerinizi <strong>kvkk@bicalendar.com</strong> adresine iletebilirsiniz. Başvurularınız kanuni süre olan 30 gün içinde yanıtlanacaktır.
          </p>
        </div>
      </section>
    </article>
  );
}
