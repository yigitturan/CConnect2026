# CConnect2026

Chrome sidepanel uzantısı: görüntülü görüşme, mesajlaşma, ortak notlar, üç tema ve arkadaşlık/oda daveti sistemi.

## Yerel kullanım

1. Chrome'da `chrome://extensions` sayfasında geliştirici modunu açın.
2. Paketlenmemiş uzantı yükle seçeneğiyle bu klasörü seçin.
3. Uzantının yan panelini açıp Google hesabıyla giriş yapın.

Derleme veya paket kurulumu gerekmez. Video senkronizasyonu kaldırılmıştır.

## Arkadaşlık kurulumu

Arkadaşlık ve davet özelliklerinin canlı çalışması için [Firebase kurulum adımlarını](firebase/SOCIAL_SETUP.md) uygulayın. Canlı Firebase kuralları bu proje hazırlanırken değiştirilmemiştir.

## Yapı ve kontroller

- [Modül yapısı](MODULAR_STRUCTURE.md)
- [Yerel testler](tests/README.md)

Testler taklit DOM/Firebase ile çalışır. Gerçek Chrome'da iki hesaplı görüntülü görüşme ve canlı Firebase Rules doğrulaması ayrıca yapılmalıdır.
