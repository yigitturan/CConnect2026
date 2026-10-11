sim# Sidepanel modül yapısı

`sidepanel.html` uzantının mevcut giriş sayfasıdır. Firebase betiklerini ve ortak `styles.css` dosyasını yükler; ekran bölümleri için yer tutucuları içerir.

`sidepanel.js` başlangıç dosyasıdır. Önce paket içindeki HTML parçalarını yükler, sonra DOM elemanlarını bağlar ve uygulamayı başlatır. Derleme adımı veya yeni bağımlılık gerekmez.

## Arayüz

`partials/sidepanel/` içinde `login.html`, `header.html`, `navigation.html`, `rooms.html`, `video-call.html`, `chat.html`, `loading.html` ve `notifications.html` bulunur. Mevcut eleman kimlikleri, sınıflar ve iç içe yapı korunmuştur. Bir ekranı değiştirmek için ilgili parçayı düzenleyin.

## JavaScript

`js/sidepanel/` altındaki modüller:

- `render.js`: Paket içindeki HTML parçalarını yükler.
- `state.js`: Modüllerin paylaştığı uygulama ve özellik durumları.
- `elements.js`: HTML yerleştirildikten sonra DOM referanslarını toplar.
- `firebase.js`, `background.js`: Firebase kurulumu ve service worker iletişimi.
- `utils.js`, `validation.js`: Ortak yardımcılar ve form doğrulama.
- `auth.js`, `email-verification.js`: Mevcut giriş ve doğrulama işlevleri.
- `navigation.js`, `rooms.js`: Sekmeler ve oda oluşturma/katılma/ayrılma.
- `chat.js`, `webrtc.js`, `shared-notes.js`: Mesajlaşma, görüntülü görüşme ve ortak not.
- `lifecycle.js`, `startup.js`, `recovery.js`: Temizlik, başlangıç ve kurtarma.
- `debug.js`, `application.js`: Durum bilgisi, mevcut konsol API'si ve uygulama başlatma.

Yerel ES modülleri kullanılır. Özellikler arasındaki mevcut karşılıklı çağrılar import/export ile korunur; uygulama yalnızca HTML parçaları yüklendikten sonra başlatılır. `window.videoSyncApp` adı mevcut konsol API'si ile uyumluluk için korunmuştur; video senkronizasyonu özelliği içermez.

Önceki tek dosyada iki kez tanımlanan `waitForEmailDelivery` işlevinin etkin olan son sürümü korunmuştur. Doğrulama durumu sıfırlanırken ortak nesnenin referansı korunur.

`manifest.json`, `service-worker.js`, Firebase SDK dosyaları ve `styles.css` bu düzenlemede değiştirilmemiştir.

## Kontrol

Chrome'da `chrome://extensions` sayfasından uzantıyı yeniden yükleyin. Google girişi, her iki oda türünü oluşturma/katılma/ayrılma, mesaj gönderme, ortak not ve iki cihaz arasında kamera/mikrofon görüşmesini kontrol edin. JavaScript modül yükleme ve taklit DOM/Firebase ile akış kontrolleri yapılmıştır; gerçek Chrome ve iki cihazlı WebRTC testi ayrıca gerekir.

Arkadaşlık başlatması `/social/config/version` kaydına bağlı değildir. Firebase sunucularına HTTP erişimi manifest `host_permissions` alanındadır. Kullanıcının paylaştığı kök zaman izinlerini bu projenin mevcut veri yollarında koruyan tam kural dosyası `firebase/database.rules.json` dosyasıdır; arkadaşlık kuralları bunun `social` bölümünde yer alır.
