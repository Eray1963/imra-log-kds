# IMRA Lojistik Karar Destek Sistemi (KDS)

Bu proje, İMRA Lojistik finans departmanında filo (çekici + dorse), yedek parça stokları ve depo kapasite kararlarını desteklemek amacıyla geliştirilen bir Karar Destek Sistemi’nin sunucu tarafını temsil etmektedir.

## Özellikler

- MVC mimarisi
- RESTful API
- CRUD işlemleri
- İş kuralları entegrasyonu

## Kurulum

1. Bağımlılıkları yükleyin:
   ```
   npm install
   ```

2. .env dosyasını .env.example'dan kopyalayın ve veritabanı bilgilerini doldurun.

3. Veritabanını oluşturun ve tabloları ekleyin:
   ```
   mysql -u root -p < db/init.sql
   ```

4. Sunucuyu başlatın:
   ```
   npm start
   ```

## API Endpoints

### Vehicles
- GET /api/vehicles
- GET /api/vehicles/:id
- POST /api/vehicles
- PUT /api/vehicles/:id
- DELETE /api/vehicles/:id

### Stocks
- GET /api/stocks
- GET /api/stocks/:id
- POST /api/stocks
- PUT /api/stocks/:id
- DELETE /api/stocks/:id

### Warehouses
- GET /api/warehouses
- GET /api/warehouses/:id
- POST /api/warehouses

## İş Kuralları

1. Bakımda olan bir araç güncellenemez.
2. Yedek parça stok miktarı minimum seviyenin altındaysa güncellenemez.
# IMRA Lojistik Karar Destek Sistemi (KDS)

Bu proje, Sunucu Tabanlı Programlama dersi için geliştirilen bir Karar Destek Sistemi'nin backend kısmıdır. MVC mimarisi ve RESTful API prensipleri kullanılarak tasarlanmıştır.

## Senaryo Tanımı

IMRA Lojistik firması filo yönetimi, yedek parça stokları ve depo kapasite kararlarını desteklemektedir. Sistem araçları, yedek parçaları ve depo doluluk oranlarını yönetir.

## Özellikler

- MVC mimarisi
- RESTful API
- CRUD işlemleri
- İş kuralları entegrasyonu

## Kurulum Adımları

1. Bağımlılıkları yükleyin:
   ```
   npm install
   ```

2. .env dosyasını .env.example'dan kopyalayın ve veritabanı bilgilerini doldurun.

3. Veritabanını oluşturun ve tabloları ekleyin (phpMyAdmin üzerinden mevcut DB'yi kullanın).

4. Sunucuyu başlatın:
   ```
   npm start
   ```

## API Endpoint Listesi

### Vehicles
- GET /api/vehicles
- GET /api/vehicles/:id
- POST /api/vehicles
- PUT /api/vehicles/:id
- DELETE /api/vehicles/:id

### Spare Parts
- GET /api/spare-parts
- GET /api/spare-parts/:id
- POST /api/spare-parts
- PUT /api/spare-parts/:id
- DELETE /api/spare-parts/:id

### Warehouses
- GET /api/warehouses
- GET /api/warehouses/:id
- POST /api/warehouses
- PUT /api/warehouses/:id
- DELETE /api/warehouses/:id

## İş Kuralları

1. Yedek parça stok seviyesi minimumun altındaysa sipariş oluşturulamaz.
2. Kapasite %90 üzerindeyse depo silinemez.

## ER Diyagramı

[ER Diyagramı](er_diagram.png) (PNG/PDF olarak ekleyin)

## MVC Yapısı

- **Routes**: Sadece endpoint tanımları
- **Controllers**: Request/Response yönetimi ve iş kuralları
- **Models**: MySQL sorguları ve CRUD işlemleri
- **Config**: Veritabanı bağlantısı
