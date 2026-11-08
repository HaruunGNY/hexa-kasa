# Hexa Kasa – Para Yönetimi

Telefona uygulama gibi kurulabilen (PWA), internetsiz çalışan, **reklamsız** kişisel bütçe ve harcama takibi.
Sunucu yok: **tüm veriler sadece senin cihazında** saklanır.

Geliştiren: [Hexaforge](https://hexaforge.com.tr/)

## Özellikler
- **Gelir / Gider / Transfer** kaydı (tutar alanında `1.250,50` veya `100+250` gibi hesap yapılabilir)
- **Kategoriler ve alt kategoriler** (Yemek → Restoran, Faturalar → Elektrik…). İşlem eklerken "+ Yeni" ile anında kategori / alt kategori eklenebilir; Ayarlar'dan simge, isim ve sıra düzenlenir
- **Sık kullanılanlar**: işlem ekranında ☆ ile kısayol kaydet, sonra tek dokunuşla doldur
- **Ay başlangıç günü**: maaş 15'inde yatıyorsa ay 15'inden başlar
- **Günlük, Takvim ve Aylık** görünüm; sağa-sola kaydırarak dönem değiştirme
- **İstatistik**: haftalık / aylık / yıllık; kategori pasta grafiği, alt kategori dağılımı, trend grafiği
- **Bütçe**: kategori bazlı aylık limit, kalan tutar, günlük harcanabilir miktar
- **Hesaplar**: Nakit, Banka, Kredi Kartı vb. bakiyeler, varlık / borç özeti
- **Tekrarlayan işlem** (haftalık / aylık / yıllık – kira, abonelik vb.)
- **Arama**, koyu tema
- **Excel'e aktarma** (.xlsx: İşlemler, Aylık Özet, Hesaplar sayfaları)
- **Yedekleme**: tam yedek al / geri yükle (.json)

## Kurulum (GitHub Pages)
1. Bu repoyu GitHub'a yükle.
2. Repo → **Settings → Pages** → *Source*: `Deploy from a branch`, *Branch*: `main` / `(root)` → **Save**.
3. 1-2 dakika sonra uygulama `https://KULLANICI_ADI.github.io/REPO_ADI/` adresinde yayında olur.

## Telefona kurma
- **Android (Chrome):** Adresi aç → **⋮ menü → "Uygulamayı yükle"** (veya "Ana ekrana ekle").
- **iPhone (Safari):** Paylaş → **Ana Ekrana Ekle**.

Ana ekranda **Hexa Kasa** ikonu oluşur; internet olmadan da açılır.

## Verilerin güvenliği
- Veriler cihazın tarayıcı depolamasında tutulur. Tarayıcının **site verilerini temizlemek** veya uygulamayı kaldırmak verileri siler.
- Bu yüzden ara sıra **Ayarlar → Tam yedek al** ile yedek indirip Drive vb. bir yere koy. Yeni cihazda **Yedekten geri yükle** ile her şey geri gelir.

## Güncelleme
Kodu değiştirip `git push` yapmak yeterli. Uygulama bir sonraki açılışta (internet varken) yeni sürümü alır; kayıtlı veriler silinmez.
