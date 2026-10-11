# Arkadaşlık sistemini Firebase'de etkinleştirme

Yerel uzantı kodu hazırdır. Canlı Firebase kuralları bu çalışma sırasında okunmamış veya değiştirilmemiştir. Arkadaşlık modülü, `/social/config/version` değeri `1` olmadıkça etkinleşmez; mevcut giriş, oda, mesajlaşma ve görüntülü görüşme çalışmaya devam eder.

## Kurulum

1. Firebase Console → Realtime Database → Rules bölümündeki mevcut kuralları yedekleyin.
2. `social.rules.fragment.json` dosyasındaki `social` nesnesini mevcut dosyanın `rules` nesnesine ekleyin. Dosya bir **kural parçasıdır**; mevcut oda ve kullanıcı kurallarının yerine tamamını yapıştırmayın.
3. Kök veya `social` üstünde koşulsuz/geniş `.read` veya `.write` izni varsa önce mevcut oda yolları için eşdeğer, ayrı izinlere ayırın. Üstten verilen izin alt kurallarla geri alınamaz. Mevcut canlı kurallar görülmeden bu geçiş otomatik yapılamaz. Kullanıcıların diğer hesapların tamamını okumasını ve karşı tarafın onayı olmadan arkadaşlık yazmasını engellemek için bu gereklidir.
4. Rules Playground veya Firebase Emulator Suite ile aşağıdaki senaryoları doğrulayın, sonra kuralları yayınlayın.
5. Realtime Database → Data üzerinden `/social/config` yoluna `social.config.json` içeriğini (`{"version":1}`) ekleyin. Bu işaretçi yalnızca kurallar uygulandıktan sonra eklenmelidir.
6. Güncellenmiş uzantıyı iki ayrı Google hesabıyla yükleyip yeniden giriş yapın. Profil kaydı ilk girişte oluşturulur; arkadaş kodu `CC-<Firebase UID>` biçimindedir.

## Veri ve davranış

- `/social/profiles/<uid>` yalnızca görünen adı içerir. E-posta veya erişim anahtarı içermez. Kimliği doğrulanmış kullanıcılar bilinen kodla bu profili okuyabilir; sadece sahibi yazabilir.
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
