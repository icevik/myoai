# Chatbot Sistemi Frontend

Bu proje, Yeditepe Üniversitesi öğrencileri için geliştirilmiş bir chatbot sisteminin frontend uygulamasıdır.

## Özellikler

- Kullanıcı kimlik doğrulama (giriş/kayıt)
- Ders bazlı chatbot desteği
- Admin paneli ile kullanıcı ve ders yönetimi
- Profil yönetimi
- Konuşma geçmişi

## Başlangıç

### Gereksinimler

- Node.js (v14 veya üzeri)
- npm veya yarn

### Kurulum

1. Projeyi klonlayın:
```bash
git clone <repo-url>
cd chatbot-system/frontend
```

2. Bağımlılıkları yükleyin:
```bash
npm install
# veya
yarn install
```

3. Geliştirme sunucusunu başlatın:
```bash
npm start
# veya
yarn start
```

Uygulama varsayılan olarak [http://localhost:3000](http://localhost:3000) adresinde çalışacaktır.

### Yapılandırma

Backend API adresini değiştirmek için, ilgili axios çağrılarındaki base URL'i güncelleyin.

## Kullanılan Teknolojiler

- React.js
- Material-UI
- React Router
- Axios
- Context API

## Klasör Yapısı

```
src/
  ├── components/        # UI bileşenleri
  │   ├── admin/        # Admin paneli bileşenleri
  │   ├── auth/         # Kimlik doğrulama bileşenleri
  │   ├── dashboard/    # Ana dashboard bileşenleri
  │   ├── profile/      # Profil bileşenleri
  │   └── routing/      # Özel route bileşenleri
  ├── context/          # Context API tanımlamaları
  ├── App.js            # Ana uygulama bileşeni
  └── index.js          # Giriş noktası
```

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.
