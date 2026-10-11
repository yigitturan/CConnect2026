# Arkadaşlık sistemini Firebase'de etkinleştirme

Yerel uzantı kodu hazırdır. Canlı Firebase kuralları bu çalışma sırasında okunmamış veya değiştirilmemiştir. Arkadaşlık modülü giriş sonrasında profilini ve kısa kodunu otomatik kaydeder. `/social/config/version` kaydı gerekmez; önceki zorunlu kontrol kaldırılmıştır.

## Kurulum

1. Firebase Console → Realtime Database → Rules bölümündeki mevcut kuralları yedekleyin.
2. Mevcut kurallar yalnızca kökte `now < 2203718400000` ile tüm okumaları/yazmaları açan paylaşılan kurallarsa, `database.rules.json` dosyasının **tamamını** Rules alanına yapıştırın. Bu dosya mevcut uygulamanın kullandığı yedi eski veri yolu için aynı zaman koşulunu korur ve `social` alanına ayrı kurallar ekler.
3. Başka uygulamaların kullandığı ek veri yolları varsa bu tam dosyaya onlar için gerekli izinleri de ekleyin. `database.rules.json` yalnızca bu projede kullanılan veri yollarını kapsar. Kökten genel izin tekrar eklemeyin: alt arkadaşlık kurallarını etkisiz bırakır.
4. Rules Playground veya Firebase Emulator Suite ile aşağıdaki senaryoları doğrulayın, sonra Publish ile yayınlayın.
5. `chrome://extensions` üzerinden uzantıyı yeniden yükleyin; yeni Firebase sunucu izinleri için Chrome izin sorarsa kabul edin. Çıkış yapıp tekrar Google girişi yapın.
6. İki ayrı Google hesabıyla deneyin. Profil ve kısa kod ilk girişte otomatik oluşturulur. Arkadaş kodu `CC-XXXXXXXX` (8 karakter) biçimindedir. Her iki kullanıcı da güncellenmiş sürümle en az bir kez giriş yapmalıdır.

`social.rules.fragment.json` mevcut farklı bir kural yapısına birleştirmek için ayrıca korunur. `social.config.json` eski sürümden kalan isteğe bağlı kayıttır; artık etkinleştirme şartı değildir.

## Veri ve davranış

- `/social/profiles/<uid>` yalnızca görünen adı içerir. E-posta veya erişim anahtarı içermez. Kimliği doğrulanmış kullanıcılar bilinen kodla bu profili okuyabilir; sadece sahibi yazabilir.
- `/social/codes/<8 karakter>` kısa kodu kalıcı Firebase UID ile eşleştirir. Kod ve profil aynı atomik işlemde yazılır; mevcut kodun sahibi değiştirilemez. Aynı kod doluysa yeni aday denenir. Eski arkadaşlık kayıtlarının UID anahtarları değişmez.
- `/social/accounts/<uid>/requests/<sender>` gelen arkadaşlık istekleridir.
- `/social/accounts/<uid>/friends/<peer>` karşılıklı kabul edilen arkadaşlıklardır. Kabul tek çok-yollu PATCH isteğiyle her iki tarafa yazılır ve bekleyen istek silinir.
- `/social/accounts/<uid>/blocks/<peer>` engellenen kişilerdir. Engelleme arkadaşlığı ve iki yöndeki istekleri kaldırır. Engeli kaldırmak arkadaşlığı geri getirmez.
- `/social/accounts/<uid>/invitations/<sender>` gelen oda davetleridir. Gönderici başına bir davet saklanır. Davet 10 dakika geçerlidir; kabul sırasında arkadaşlık, engeller ve süre yeniden kontrol edilir. Engelleme veya arkadaşlıktan çıkarma sonrası eski davetler görüntülenmez ve kabul edilemez.
- Bir odaya giren kullanıcı arkadaş listesindeki Video invite / Chat invite düğmesiyle o odayı paylaşır. Kabul eden kişi manuel oda koduyla girişte kullanılan aynı `joinRoom` işleviyle katılır. Kamera/mikrofon mevcut başlat düğmesiyle açılır.
- Bildirimler Cconnect paneli açık ve kullanıcı giriş yapmışken 5 saniyede bir kontrol edilir. Panel kapalıyken sistem bildirimi gönderilmez. Bekleyen istek ve geçerli davetler yeniden girişte gösterilir.
- Oturum anahtarları yalnızca bellekte tutulur, arkadaşlık veritabanına veya localStorage'a yazılmaz. Firebase ID token gerektiğinde refresh token ile yenilenir. Çıkışta istekler ve kontrol zamanlayıcısı geçersizleşir.

## Firebase'de gerekli doğrulamalar

- A isteği B'ye gönderebilir; A kendisine istek gönderemez; üçüncü kişi C A/B adına yazamaz.
- B gelen isteği kabul edebilir; A kendi isteğini kabul edip arkadaşlık oluşturamaz; istek olmadan arkadaşlık yazılamaz.
- Kabulde iki arkadaş kaydı ve istek silme tek atomik işlem olarak geçer; kabul tekrarı reddedilir.
- A veya B arkadaşlığı iki taraftan kaldırabilir. Üçüncü kişi kaldıramaz.
- B A'yı engellediğinde A yeni istek veya davet gönderemez. Engeli sadece B kaldırabilir.
- Davet yalnızca karşılıklı arkadaşlar arasında, mevcut bir oda ve geçerli süreyle yazılabilir. Alıcı gönderici alanını değiştiremez; daveti silebilir.
- Hesabın istek/davet/engellenenler listesi sadece sahibince okunabilir. Başka bir kullanıcı yalnızca kendisiyle ilgili gerekli tekil kaydı okuyabilir.
- Çıkış yapmış kullanıcılar social verisini okuyamaz/yazamaz.

Yerel testler işlev akışlarını taklit Firebase ile kontrol eder; gerçek Firebase Rules doğrulamasının veya iki hesaplı Chrome testinin yerine geçmez.

Referanslar: [REST kimlik doğrulama](https://firebase.google.com/docs/database/rest/auth), [Auth token yenileme](https://firebase.google.com/docs/reference/rest/auth), [güvenlik kurallarının kapsamı](https://firebase.google.com/docs/database/security/core-syntax).

Kısa kod güncellemesinde `profiles/$uid/friendCode` ve `codes/$code` kuralları da yayınlanmalıdır. Config kaydı eklemek gerekli değildir ve güvenlik kurallarının yerine geçmez.
