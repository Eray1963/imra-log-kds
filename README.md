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

## 6. ER Diyagramı
*(ER Diyagramı görseli proje klasöründeki .png dosyasındadır)*
