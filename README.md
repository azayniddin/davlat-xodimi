# 🏛 Davlat Xodimlari Davomat va Sog'lom Turmush Tarzi Monitoringi Axborot Tizimi

O'zbekiston Respublikasi davlat organlari va tashkilotlari (vazirliklar, qo'mitalar, agentliklar, hokimliklar) xodimlari uchun yagona avtomatlashtirilgan davomat va sog'lom turmush tarzi monitoring axborot tizimi.

---

## 🌟 Asosiy Xususiyatlar va Imkoniyatlar

### 1. 📍 Aldashdan Himoyalangan GPS Geofencing Davomati (300 metr radius)
- Xodim brauzeri orqali uning jonli GPS geolokatsiyasi aniqlanadi.
- Matematik **Haversine formulasi** asosida idora koordinatalari bilan oraliq masofa metrlarda hisoblanadi.
- **Qat'iy xavfsizlik qoidasi:** Agar xodim ish joyidan **300 metrdan** uzoqda bo'lsa, tizim "Ishga keldim" va "Ishdan ketdim" tugmalarini bloklaydi va xodim alday olmaydi.
- Ishga kelish vaqti, kechikkanlik holati (09:00 dan keyin) va GPS masofasi tizimda qayd etiladi.

### 2. 🏃 Sog'lom Turmush Tarzi va Sport Monitoringi
- **200 metr yugurish / piyoda faollik:** Kunlik 200m yugurish me'yori qayd etiladi.
- **Suv ichish me'yori:** Kunlik 2 litr (har biri 250 ml bo'lgan 8 ta interaktiv stakan vizual animatsiyasi bilan).
- **Ertalabki badantarbiya:** 5-10 daqiqalik yengil jismoniy mashqlarni bajarilganini belgilash.
- **Qo'shimcha sport mashg'uloti:** Turnik, fitnes, futbol, mini-futbol, suzish va boshqa sport mashg'ulotlari turi va davomiyligi.
- **Salomatlik indeksi (Score):** 0% dan 100% gacha bo'lgan kunlik salomatlik reytingi.

### 3. 👨‍💼 Boshliq (Admin) Boshqaruv Paneli
- **Tezkor tahliliy ko'rsatkichlar:** Jami xodimlar, bugun kelganlar soni va qatnashuv foizi, kechikkanlar, kelmaganlar, 200m yugurganlar va badantarbiya qilganlar soni.
- **To'liq xodimlar monitoring jadvali:**
  - Xodimning F.I.O (Ism, Familiya, Otasining ismi)
  - Telefon raqami
  - Lavozimi va Bo'limi
  - Ertalab soat nechada kelgani, GPS masofasi, ketish vaqti
  - 200m yugurgani, yengil mashqlar bajargani, ichgan suvi miqdori
- **Tezkor qidiruv va bo'limlar bo'yicha saralash.**
- **Excel / CSV formatida hisobotlarni eksport qilish.**
- **Yangi xodimlarni tizimga qo'shish va tahrirlash.**
- **Tashkilot GPS lokatsiyasi va 300 metr radiusini sozlash:** Boshliq xaritadagi koordinatalarni kiritishi yoki 1 tugma bilan ("📍 Joylashuvimni olish") o'zining turgan joyini idora koordinatasi qilib belgilashi mumkin.

---

## 🔑 Sinov Uchun Boshlang'ich Login Ma'lumotlari

Tizim ishga tushganda avtomatik quyidagi foydalanuvchilar bilan initsializatsiya qilinadi:

| Rol | F.I.O | Telefon raqam | Parol | Lavozim |
| :--- | :--- | :--- | :--- | :--- |
| **Boshliq (Admin)** | Rahimov Jamshid Anvarovich | `+998901234567` | `admin123` | Departament boshlig'i |
| **Xodim 1** | Karimov Jasur Bahodirovich | `+998909876543` | `xodim123` | Bosh mutaxassis (IT) |
| **Xodim 2** | Toshmatova Nilufar Alisherovna | `+998911112233` | `xodim123` | Yetakchi mutaxassis (HR) |
| **Xodim 3** | Aliyev Sardor Rustamovich | `+998933334455` | `xodim123` | Katta auditor (Moliya) |
| **Xodim 4** | Saidova Dildora Otabekovna | `+998977778899` | `xodim123` | Matbuot kotibi |

---

## 🛠 Texnologiyalar

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Backend:** Node.js, Express, JWT (JSON Web Tokens), Bcrypt.js, REST API.
- **Geolokatsiya:** W3C Geolocation API, Haversine Great-Circle Distance Algorithm.
- **Backend API (Jonli):** `https://xodim.up.railway.app/api`
- **Deploy:** Frontend 👉 **Vercel**, Backend 👉 **Railway (`https://xodim.up.railway.app`)**.

---

## 🚀 Mahalliy Kompyuterda Ishga Tushirish (Local Setup)

### 1. Backendni ishga tushirish:
```bash
cd backend
npm install
npm run seed     # Namunaviy ma'lumotlarni yuklash
npm run start    # Server: http://localhost:5050
```

### 2. Frontendni ishga tushirish:
```bash
cd frontend
npm install
npm run dev      # Frontend: http://localhost:5173
```

---

## ☁️ Bulutga Deploy Qilish (Deploy to Railway & Vercel)

### 🚂 1. Backendni Railway-ga Deploy qilish:
1. [railway.app](https://railway.app) ga kiring va GitHub profilingiz orqali tizimga kiring.
2. **"New Project"** -> **"Deploy from GitHub repo"** tugmasini bosing va ushbu repozitoriyani tanlang.
3. Loyiha sozlamalarida (Settings):
   - **Root Directory:** `/backend` deb belgilang.
4. **Variables (Muhit o'zgaruvchilari):**
   - `PORT`: `5050`
   - `JWT_SECRET`: `davlat_xodimi_maxfiy_kalit_2026`
5. Deploy muvaffaqiyatli yakunlangach, Railway sizga URL beradi (masalan: `https://davlat-xodimi-backend.up.railway.app`).

### ▲ 2. Frontendni Vercel-ga Deploy qilish:
1. [vercel.com](https://vercel.com) ga kiring.
2. **"Add New Project"** -> GitHub orqali ushbu repozitoriyani tanlang.
3. Sozlamalar:
   - **Root Directory:** `frontend` deb tanlang.
   - **Framework Preset:** Vite
4. **Environment Variables:**
   - `VITE_API_URL`: Sizning Railway backend manzilingiz (masalan: `https://davlat-xodimi-backend.up.railway.app/api`).
5. **Deploy** tugmasini bosing!
