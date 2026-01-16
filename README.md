# IMRA Lojistik Karar Destek Sistemi (KDS) - Backend API

Bu proje, **Sunucu Tabanlı Programlama** dersi kapsamında, gerçekçi bir lojistik yönetim problemi üzerine kurgulanmış; Node.js ve Express.js kullanılarak **katı MVC mimarisine** uygun geliştirilmiş bir RESTful API tasarımıdır.

## 1. Proje Açıklaması ve Amacı
Sistem, bir lojistik firmasının araç filosunu, yedek parça stoklarını ve depo kapasitelerini yönetmesini sağlar. Amacı, operasyonel verileri düzenlemek ve kritik eşiklerde sistemsel engellemeler yaparak karar destek mekanizması oluşturmaktır.

## 2. Senaryo Tanımı ve İş Kuralları
Proje kapsamında aşağıdaki 2 zorunlu özel iş kuralı (business rules) backend tarafında kodlanmıştır:

* **Senaryo 1 (Araç Bakım Engeli):** Durumu veritabanında `Maintenance` (Bakımda) olarak işaretlenmiş bir aracın verileri güncellenemez. Bakımdaki araç operasyon dışı sayıldığı için üzerinde değişiklik yapılması sistem tarafından engellenir. (Dosya: `controllers/VehicleController.js`)
* **Senaryo 2 (Kritik Stok Kontrolü):** Yedek parça stok çıkışı yapılırken, miktar 0'ın altına düşemez. Ayrıca güncel stok miktarı parça bazlı tanımlanan `min_level` değerinin altına düşerse işlem gerçekleştirilir fakat API yanıtında "Kritik Stok Seviyesi" uyarısı döndürülür. (Dosya: `controllers/StockController.js`)

## 3. Kurulum Adımları
1.  Bağımlılıkları yükleyin: `npm install`
2.  `.env.example` dosyasını `.env` adıyla kopyalayın ve MySQL bilgilerinizi girin.
3.  `db/init.sql` içindeki sorguları çalıştırarak veritabanı şemasını oluşturun.
4.  Sunucuyu başlatın: `npm start` (Nodemon ile çalışır).

## 4. API Endpoint Listesi
| Modül | Metot | Endpoint | İşlev |
| :--- | :--- | :--- | :--- |
| **Vehicles** | GET | `/api/vehicles` | Tüm araçları listeler |
| | POST | `/api/vehicles` | Yeni araç ekler |
| | PUT | `/api/vehicles/:id` | Aracı günceller (**Kural 1 Uygulanır**) |
| | DELETE | `/api/vehicles/:id` | Aracı siler |
| **Stocks** | GET | `/api/stocks` | Tüm stokları/parçaları listeler |
| | PUT | `/api/stocks/:id` | Stok miktarını günceller (**Kural 2 Uygulanır**) |
| **Warehouses**| GET | `/api/warehouses` | Depo durumlarını listeler |

## 5. Proje Yapısı (MVC)
* **controllers/**: İş mantığı ve request/response yönetimi.
* **models/**: Veri modeli ve SQL sorguları.
* **routers/**: REST uç noktaları (endpoints).
* **utils/**: Standart API response ve hata yönetimi sınıfları.
* **config/db.js**: Veritabanı bağlantı konfigürasyonu.

<<<<<<< HEAD
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

/db: SQL şemaları (init.sql)....

=======
## 6. ER Diyagramı
*(ER Diyagramı görseli proje klasöründeki .png dosyasındadır)*
>>>>>>> 713e57af25fc1006c071531cee4ece6b00d9ebd8
