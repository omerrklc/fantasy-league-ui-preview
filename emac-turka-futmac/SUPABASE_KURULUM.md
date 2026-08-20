# Supabase kurulum rehberi

1. Supabase üzerinde yeni bir proje oluşturun.
2. SQL Editor bölümünde `supabase/migrations/001_initial.sql` dosyasının tamamını çalıştırın.
3. Authentication > Users bölümünden yönetici kullanıcısını oluşturun.
4. SQL Editor içinde aşağıdaki komutu, kullanıcının e-posta adresini değiştirerek çalıştırın:

```sql
update public.profiles
set role = 'admin', display_name = 'Site Yöneticisi'
where id = (select id from auth.users where email = 'yonetici@example.com');
```

5. Storage bölümünde `futmac-media` adında **public** bir bucket oluşturun. Dosya boyutu sınırını 5 MB; izin verilen türleri `image/jpeg`, `image/png`, `image/webp` olarak ayarlayın.
6. Project Settings > API bölümünden proje URL’sini ve **publishable key** (eski projelerde `anon` key) değerini alın.
7. `assets/js/supabase-config.js` dosyasında `enabled` değerini `true` yapın; URL ve public anahtarı ilgili alanlara girin.
8. Siteyi VS Code Live Server ile açın ve `admin.html` üzerinden gerçek kullanıcıyla giriş yapın.

## Güvenlik notları

- `service_role` anahtarını hiçbir frontend dosyasına yazmayın ve GitHub’a yüklemeyin.
- Tarayıcıdaki public anahtar tek başına yazma yetkisi vermez. Yetki SQL dosyasındaki Row Level Security kurallarıyla kontrol edilir.
- Yeni kullanıcılar otomatik olarak `viewer` olur. Editör veya admin rolü ayrıca veritabanından verilmelidir.
- Canlıya geçmeden önce Auth ayarlarından e-posta doğrulama ve parola politikasını kontrol edin.

Supabase yapılandırılmadığında site ve admin paneli yerel demo modunda çalışmaya devam eder.
