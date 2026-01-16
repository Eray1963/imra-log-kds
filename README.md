IMRA Lojistik Karar Destek Sistemi (KDS) - Backend API
Bu proje, Sunucu Tabanlı Programlama dersi bitirme ödevi kapsamında, gerçekçi bir lojistik yönetim problemini çözmek amacıyla Node.js (Express) kullanılarak MVC (Model-View-Controller) mimarisine uygun olarak geliştirilmiş bir RESTful API'dir.

1. Projenin Amacı ve Senaryo
IMRA Lojistik, geniş bir araç filosuna ve birden fazla depoya sahip bir firmadır. Bu sistemin amacı; araçların bakım durumlarını, yedek parça stoklarını ve depo doluluk oranlarını dijital ortamda yöneterek finans ve operasyon departmanlarına karar desteği sağlamaktır.

Özel İş Senaryoları:

Bakım Kontrolü: Operasyonel güvenliği sağlamak adına, sistemde "Bakımda" (Under Maintenance) olarak işaretlenmiş olan araçlar üzerinde güncelleme yapılmasına izin verilmez.

Kritik Stok Yönetimi: Yedek parça stok miktarı, belirlenen "minimum seviyenin" altına düşmüşse operasyonun durmaması için bu parçaların çıkış işlemleri kısıtlanır veya sistem uyarı döndürür.

Depo Kapasite Denetimi: Bir depodaki doluluk oranı %90'ın üzerine çıktığında sistem yeni parça girişine karşı uyarı verir.

2. Teknik Özellikler
Mimari: Katı MVC (Model-View-Controller) yapısı.

Çatı (Framework): Node.js / Express.js

Veritabanı: MySQL (mysql2 kütüphanesi ile)

Güvenlik: Şifreleme (bcrypt) ve Çevresel Değişken Yönetimi (.env)

Yardımcı Araçlar: Nodemon, CORS, API Response Standardizasyonu.

3. Kurulum ve Çalıştırma
Bağımlılıkları Yükleyin:

Bash

npm install

Ortam Değişkenlerini Ayarlayın: .env.example dosyasını .env olarak kopyalayın ve veritabanı bilgilerinizi girin:

Kod snippet'i

PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=sifreniz
DB_NAME=lojistik_kds


Veritabanını Hazırlayın: db/init.sql dosyasındaki sorguları MySQL üzerinde çalıştırarak tabloları oluşturun.


Sunucuyu Başlatın:

Bash

npm start



Modül,Metot,Endpoint,Açıklama
Araçlar,GET,/api/vehicles,Tüm araç listesi
,POST,/api/vehicles,Yeni araç ekleme
,PUT,/api/vehicles/:id,Araç güncelleme (Kural: Bakımdakiler güncellenemez)
,DELETE,/api/vehicles/:id,Araç silme

Yedek Parça,GET,/api/spare-parts,Tüm yedek parçaları listele
,POST,/api/spare-parts,Yeni parça ekleme
,PUT,/api/spare-parts/:id,Stok güncelleme (Kural: Min. stok kontrolü)
,DELETE,/api/spare-parts/:id,Parça kaydı silme

Depolar,GET,/api/warehouses,Depo doluluk oranlarını gör
,POST,/api/warehouses,Yeni depo tanımlama
,PUT,/api/warehouses/:id,Depo kapasite/bilgi güncelleme




5. Klasör Yapısı (MVC)
   
/controllers: İstekleri karşılayan ve iş kurallarını (business logic) uygulayan katman.

/models: Veritabanı sorgularının ve veri şemalarının bulunduğu katman.

/routers: API uç noktalarının (endpoints) tanımlandığı katman.

/utils: Hata yönetimi (errors.js) ve standart API yanıt formatı (response.js).

/config: Veritabanı bağlantı yapılandırması.

/db: SQL şemaları (init.sql).
