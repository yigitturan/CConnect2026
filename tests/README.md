# Yerel kontroller

Proje kökünden macOS JavaScriptCore ile her dosyayı ayrı çalıştırın:

```sh
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tests/social-model.test.js
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tests/social-session.test.js
/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc tests/room-regression.test.js
```

Bu testler taklit DOM/HTTP/Firebase kullanır. `social-model` manuel config kaydı olmadan başlangıcı, kısa kod çakışmalarını ve iki kimlikle arkadaşlık/engelleme/davet işlemlerini; `social-session` eşzamanlı token yenileme ve çıkış yarışını; `room-regression` başlangıç/oda/mesajlaşma ve kamera düğmesi bağlantılarını kontrol eder. Gerçek Firebase Rules ve gerçek WebRTC görüşmesi test edilmez. Canlı kurulum ve test matrisi `firebase/SOCIAL_SETUP.md` içindedir.

Kalıcı oturum kontrolü: `jsc tests/persistent-session.test.js` — yeniden açma, sessiz yenileme, ağ kesintisi, iptal edilen oturum ve çıkış sırasında kayıt yarışları.
