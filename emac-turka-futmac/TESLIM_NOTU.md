# FUTMAC Teslim Notu

## Bu sürümde tamamlananlar

- Haber ve köşe yazıları için taslak kaydetme, doğrudan yayınlama, ileri tarihli yayın planlama ve onaylı yayından kaldırma akışları ayrıldı.
- Yayındaki içerik düzenlenirken yanlışlıkla taslağa dönmesi engellendi.
- Haber görsellerine erişilebilir açıklama alanı ve yükleme durum mesajları eklendi.
- Admin paneline takım, kategori ve kullanıcı yetkileri bölümleri eklendi.
- Yeni kategoriler için `kategori.html` ortak liste sayfası ve yönetilebilir menü görünürlüğü hazırlandı.
- Takım adı, yönetici, kısa kod, arma, sıralama ve aktif/pasif durumu yönetilebilir hâle getirildi.
- Viewer, editör ve admin rolleri arayüzde ayrıldı; editörlere lig ve yetki araçları gösterilmiyor.
- Fikstür, puan durumu, yazar, takım ve kategori yazma politikaları yalnızca admin rolüne indirildi.
- Kullanılan takımların silinmesi ve sistem kategorilerinin kaldırılması veritabanı kısıtlarıyla engellendi.
- Son admin hesabının yetkisinin kaldırılmasını önleyen veritabanı tetikleyicisi eklendi.
- Storage yazma politikası güvenli klasör ve JPG/PNG/WebP uzantılarıyla sınırlandırıldı.
- JSON yedeği haberlerle birlikte kategori, yazar, takım, fikstür ve puan durumunu kapsayacak şekilde genişletildi; kullanıcı profilleri yedeğe dahil edilmedi.
- Parola yenileme formu yalnızca geçerli Supabase oturumu doğrulandıktan sonra açılıyor.
- Yeni şema uygulanmadan mevcut canlı haber kaydetme akışının bozulmaması için geriye uyumluluk korundu.

## Test sonucu

- 32 HTML sayfası
- 6 ekran genişliği: 320, 375, 390, 768, 1024 ve 1440 piksel
- Toplam responsive tarama: 192 sayfa/görünüm
- Kırık yerel bağlantı: 0
- Yatay taşma: 0
- JavaScript sözdizimi ve konsol hatası: 0
- Admin rolünde takım, kategori, fikstür, puan durumu ve yayın işlemleri: başarılı
- Editör rolünde admin araçlarının gizlenmesi: başarılı
- Zamanlanmış yayın, yayındaki içeriği düzenleme ve yayından kaldırma: başarılı
- Eski ve yeni Supabase şeması için haber kayıt sözleşmesi: başarılı
- Geçerli ve geçersiz parola yenileme bağlantısı durumları: başarılı
- RLS, son-admin, sistem-kategori, takım-silme ve Storage politika kontrolleri: başarılı statik doğrulama

## Canlı Supabase için kalan tek seferlik işlem

Canlı projede `articles` ve `categories` tabloları çalışıyor; `authors`, `league_teams`, `standings` ve `fixtures` tabloları henüz oluşturulmamış durumda. Bu nedenle `assets/js/supabase-config.js` içindeki `leagueManagementEnabled` değeri güvenli biçimde `false` tutulmuştur.

Lig yönetimini açmak için:

1. Supabase SQL Editor içinde `supabase/migrations/002_league_management.sql` dosyasının tamamını çalıştırın.
2. Dört yeni tablonun oluştuğunu doğrulayın.
3. Auth URL Configuration bölümünde `sifre-yenile.html` adresinin Redirect URLs listesinde olduğunu doğrulayın.
4. Ardından `leagueManagementEnabled` değerini `true` yapıp siteyi yeniden yayınlayın.

Bu işlem yapılana kadar canlı haber yayınlama çalışmaya devam eder; fikstür, puan durumu, yazar ve takım sayfaları sabit örnek verileri kullanır.
