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
3. Depo doluluk oranı %90’ın üzerindeyse kapasite artırımı önerisi üretilir.
