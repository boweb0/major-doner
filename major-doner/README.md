# Major Döner

Major Döner için tanıtım sitesi, QR menü ve yönetim paneli. Üçü aynı adreste çalışır, birbirine karışmaz.

| Adres | Ne gösterir |
|---|---|
| `/` | Tanıtım sitesi: ateş ve kor sahnesi, dönen şiş, kayan şerit, boy seçici, sipariş adımları, hakkımızda, galeri, iletişim, konum. Üründe fiyat yoktur. |
| `/menu` | QR menü. QR kod bu sayfayı açar. Arama, kampanya vitrini, boy seçimi, sepet. Her üründe WhatsApp ile sipariş ve Ara butonu. |
| `/admin` | Yönetim paneli. |

Sitede menü ürünleri ve fiyatlar görünmez. Ziyaretçi "Menüyü Gör" düğmesine basınca menü sayfası açılır.

### Menüde müşteri neler yapabilir

- Menüde arama yapar (ürün adı, içerik, kategori).
- Dürümde boyunu seçer, fiyat ve WhatsApp mesajı boya göre değişir.
- Üründeki **Sipariş ver** düğmesi o ürünü tek mesajla WhatsApp'a taşır, telefon düğmesi doğrudan arar.
- Sepet simgesiyle birden çok ürün ekler. Sepette adet değiştirir, not yazar (örn. soğansız) ve tüm siparişi tek WhatsApp mesajı olarak gönderir. Sepet sayfa yenilenince korunur.
- Aktif kampanyalar menünün en üstünde vitrin olarak görünür.

## Çalıştırma

Node 18 veya üstü gerekir. Paket kurulumu yoktur.

```bash
ADMIN_PASSWORD="güçlü-bir-şifre" node server.js
```

Tarayıcıda `http://localhost:3000` açılır. Panel: `http://localhost:3000/admin`.

Panel şifresi `ADMIN_PASSWORD` ile belirlenir. Tanımlamazsanız varsayılan `Major123` olur ve açılışta uyarı yazılır. Canlıya almadan önce mutlaka değiştirin. Panelin "Yedek ve güvenlik" bölümünden de değiştirilebilir.

| Değişken | Anlamı | Varsayılan |
|---|---|---|
| `PORT` | Port | `3000` |
| `ADMIN_PASSWORD` | İlk panel şifresi | `Major123` |
| `DATA_DIR` | Menü ve ayar dosyası klasörü | `./data` |
| `UPLOAD_DIR` | Yüklenen fotoğraflar | `./uploads` |

## Panelden yönetilenler

- **Genel:** site adı, slogan, logo, ana görsel, duyuru şeridi.
- **Görünüm:** site renkleri ve yazı stili. Hem siteye hem menüye uygulanır.
- **Menü ve ürünler:** kategori ekle, çıkar, sırala. Ürün ekle, düzenle, kopyala, sil, gizle, "tükendi" yap. Boya göre ya da tek fiyat. Ürün fotoğrafı. Toplu fiyat güncelleme (yüzde, yuvarlama ile).
- **Kampanyalar:** ürüne elle kampanyalı fiyat, ya da tarih aralıklı yüzde veya TL indirim kampanyası. Kampanyalı ürünlerde eski fiyat üstü çizili görünür.
- **Hakkımızda ve galeri:** metinler, öne çıkanlar, fotoğraf galerisi.
- **İletişim ve konum:** telefon, WhatsApp, adres, çalışma saatleri, harita linki ve gömme kodu, Instagram.
- **QR kod:** menü adresinden QR üretir, PNG indirir.
- **Yedek ve güvenlik:** JSON yedek alma ve yükleme, şifre değiştirme, sıfırlama.

Harita için panelde Google Haritalar bağlantısını yapıştırın. Boş bırakılırsa "Haritada aç" düğmesi adresten arama yapar.

## Yayına alma

Veri sunucuda saklandığı için kalıcı disk gerekir. Üç klasör kalıcı olmalıdır: `data/` ve `uploads/`.

- **Sanal sunucu (VPS):** `node server.js` komutunu `pm2` ya da `systemd` ile çalıştırın, önüne Nginx veya Caddy ile HTTPS koyun.
- **Docker:** `docker build -t major-doner .` sonra `docker run -p 3000:3000 -e ADMIN_PASSWORD=... -v md-data:/app/data -v md-up:/app/uploads major-doner`
- **Render, Railway, Fly.io gibi servisler:** başlangıç komutu `node server.js`. Servise kalıcı disk (volume) bağlayın ve `DATA_DIR`, `UPLOAD_DIR` değişkenlerini o diske yönlendirin. Diski bağlamazsanız yeniden başlatmada panelden yapılan değişiklikler silinir.
- **Yalnızca statik barındırma (GitHub Pages, Netlify):** site ve menü çalışır, ancak panelden yapılan değişiklikler sadece o tarayıcıda saklanır ve müşteriler görmez. Gerçek kullanım için sunucu gerekir.

HTTPS şarttır. Panel şifresi ve oturum anahtarı düz HTTP üzerinden gitmemelidir.

## QR kod

1. Siteyi yayına alın.
2. Panelde "QR kod" bölümünü açın, menü adresini kontrol edin (`https://alanadiniz.com/menu`).
3. PNG indirip yazdırın. Basmadan önce telefonla tarayarak deneyin.

## Güvenlik notları

- Şifre sunucuda `scrypt` ile özetlenir, giriş denemeleri sınırlıdır (10 dakikada 8 yanlış).
- Panel oturumu 12 saat sürer, sunucu yeniden başlayınca kapanır.
- Yükleme yalnızca JPG, PNG ve WebP kabul eder, dosya içeriği kontrol edilir.
- Veri her kayıtta `data/site.json` dosyasına yazılır, bir önceki sürüm `data/site.prev.json` olarak kalır.

## Dosya yapısı

```
index.html        Tanıtım sitesi
menu.html         QR menü
admin.html        Yönetim paneli
server.js         Sunucu (bağımlılık yok)
assets/core.js    Ortak veri, fiyat ve tema kodu, varsayılan menü, ikonlar
assets/base.css   Ortak stil
assets/qr.js      QR kod üretici (Kazuhiko Arase, MIT)
assets/img/       Logo ve fotoğraflar
data/             Canlı veri (repoya girmez)
uploads/          Panelden yüklenen görseller (repoya girmez)
```

Varsayılan menü ve fiyatlar `assets/core.js` içindeki `DEFAULTS` bölümündedir. Sunucuda panelden ilk kayıt yapıldıktan sonra `data/site.json` esas alınır.

## Yazı tipleri

Başlıklar için Alfa Slab One, metinler için Barlow ve Barlow Condensed, el yazısı için Yellowtail, logo yazısı için Cinzel kullanılır. Hepsi Google Fonts'tan yüklenir, sunucunun internete erişmesi gerekmez ama ziyaretçinin tarayıcısı Google Fonts'a erişebilmelidir. Erişim yoksa sistem yazı tipine düşer ve site yine çalışır.

## Notlar

- Ürün fotoğrafı yüklenmemiş ürünlerde marka renklerinde bir çizim görünür. Gerçek fotoğrafları panelden ürün düzenleme ekranından ekleyin.
- `assets/img/foto-durum.jpg` ve `foto-patates.jpg` broşürdeki yemek görselinden kırpılmıştır. Daha iyi bir fotoğraf çekildiğinde panelden değiştirin.
- Çalışma saatleri boş gelir, panelden ekleyin.


## Son eklenenler

- **Gerçekçi dönen döner:** `assets/doner.js` tavuk döner dokusunu kodla üretir, silindire sarıp döndürür (görüntü dosyası gerekmez). Ana sayfada tek döner vardır. Yönetim panelinde *Ana sayfa → Sağdaki görsel* ile logo ya da görselsiz seçilebilir.
- **Ana sayfa sekmesi:** kayan şerit, boy seçici, 3 adımla sipariş (adım ekle/sil/sırala), kampanya bölümü başlığı, menü çağrısı, alt bilgi ve menü sayfası yazıları panelden düzenlenir. Başlıklarda `*kelime*` vurgu yapar.
- **Kampanyalar:** ad, fotoğraf, kampanya fiyatı ve üstü çizili eski fiyat girilebilir. Ana sayfada kampanya kartı, menüde kartın üzerinden WhatsApp siparişi ve sepete ekleme vardır.
- **Kampanyalı ürün:** ürün düzenlerken *Kampanyalı fiyat uygula* ile örn. 300 ₺ çizili, 250 ₺ yeni fiyat olur (canlı önizleme gösterilir).
- **Logo büyütme:** üstteki logoya tıklayınca tam logo büyür, Esc ya da dokunuşla kapanır.
- **Kaydet düğmesi:** Panelde yapılan değişiklikler (ürün, kategori, kampanya, yazılar) altta çıkan **Kaydet** düğmesine basılınca siteye yazılır. Kaydedilmemiş değişiklik varsa çubuk sarıya döner. Ctrl+S de çalışır.
- **Önizleme kaydı:** Claude önizlemesinde panel ve site ortak veritabanını kullanır (`window.claude` db). Kendi sunucunuzda `server.js` veriyi `data/site.json` dosyasına yazar. Statik barındırmada (sunucusuz) tarayıcı depolamasına düşer.
