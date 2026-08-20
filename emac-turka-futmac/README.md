# FUTMAC - E-Mac Turka'nın Spor Gazetesi

Kurulum gerektirmeyen, responsive bir fantazi futbol haber sitesi prototipidir.

## Açma

1. Bu klasörü VS Code ile açın.
2. `index.html` dosyasını tarayıcıda açın veya Live Server ile çalıştırın.

## Sayfalar

- `index.html`: Futbol haberleri, örnek puan durumu ve köşe yazarları
- `haber.html`: Ayrıntılı sezon açılış haberi
- `yazi-eray.html`: Eray'ın "Haftanın Taktik Analizi" köşe yazısı
- `yazi-butce.html`: Furkan Katılmış'ın "Bütçe Savaşı Başlıyor" köşe yazısı
- `yazi-berkay.html`: Berkay Minkara'nın "Ligin Güncel Durumu" köşe yazısı
- `kurallar.html`: PDF'deki 7 kısım ve 19 maddenin sadeleştirilmiş özeti
- `arsiv.html`: Filtrelenebilir haber arşivi ve geniş puan tablosu

## Yerel dosyalar

- Logo: `assets/images/logo/`
- Yazar fotoğrafları: `assets/images/yazarlar/`
- Futbol görselleri: `assets/images/futbol-*.svg`
- Resmî mevzuat: `assets/docs/E-Mac_Turka_Fantazi_2026-2027_Lig_Mevzuati.pdf`

Puan tablosundaki değerler prototip amaçlıdır. Mevzuat sayfası hızlı başvuru özetidir; uyuşmazlık halinde PDF metni esas alınır.

## Köşe yazarı fotoğrafını değiştirme

En kolay yöntem, yeni fotoğrafı aynı dosya adıyla `assets/images/yazarlar/` klasörüne kopyalayıp mevcut dosyanın üzerine yazmaktır:

- Furkan Katılmış ana fotoğrafı: `furkan-katilmis-2.png`
- Furkan Katılmış ikinci fotoğrafı: `furkan-katilmis.png`
- Eray fotoğrafı: `eray.png`
- Berkay Minkara fotoğrafı: `berkay-minkara.jpg`

Fotoğrafların vesikalık oranında, tercihen 240 x 300 piksel veya daha büyük PNG/JPG olması önerilir. Dosya adı değişirse ilgili HTML sayfasındaki `src="assets/images/yazarlar/..."` değerini de yeni ada göre değiştirin.
