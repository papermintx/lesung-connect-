# LesungConnect — WhatsApp Shared Inbox

<p align="center">
  <img src="src/assets/hero.png" alt="LesungConnect Banner" width="700" style="border-radius: 12px; max-width: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.1);" />
</p>

<p align="center">
  <strong>Solusi Modern WhatsApp Shared Inbox Multi-Agent untuk Tim Sales & Customer Service</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.x-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.x-646cff?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwindcss" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Design-shadcn%2Fui-black" alt="shadcn/ui" />
  <img src="https://img.shields.io/badge/Realtime-Socket.IO-010101?logo=socketdotio" alt="Socket.IO" />
</p>

---

## 📌 Ringkasan Proyek

**LesungConnect** adalah aplikasi web **WhatsApp Shared Inbox** yang dirancang untuk memungkinkan satu nomor WhatsApp resmi bisnis digunakan bersama oleh banyak agen (Sales / Tim Support) secara terpusat, transparan, dan adil.

### 💡 Konsep Utama: Murni WA Sharing (Bukan CRM Berat)
LesungConnect berfokus murni pada **Shared Inbox & Handlership**:
- ❌ **Tidak ada tahapan CRM** seperti *Negosiasi, Won, Lost, Follow-up*, atau funnel penjualan yang memperumit antarmuka.
- ❌ **Tidak ada mekanisme tiket "Selesai / Resolved"** yang menutup percakapan WhatsApp pelanggan.
- ✅ **Fokus 100% pada Status Kepemilikan (*Siapa yang Menangani*)**:
  - **Belum Ditangani (Antrean)**: Pesan baru masuk ke antrean bersama.
  - **Ditangani oleh Anda**: Chat aktif yang Anda pegang dan bisa langsung dibalas.
  - **Ditangani oleh [Nama Sales]**: Chat yang sedang aktif dipegang oleh rekan tim (mode lihat saja / view-only untuk sales lain).
  - **Transfer & Takeover**: Penugasan fleksibel antar agen dengan catatan pengalihan serta hak intervensi Supervisor/Admin.

---

## 🌟 Fitur Utama

### 1. Antrean & Pembagian Kerja Terpusat
- **Alur Antrean Adil**: Pesan WhatsApp dari customer masuk ke status **Belum Ditangani**. Siapa pun agen yang sedang bertugas dapat mengklaim (*Claim*) chat tersebut.
- **Locking Balasan (Anti Tabrakan Balasan)**: Saat chat diklaim oleh seorang sales, sales lain hanya memiliki akses *view-only* sehingga customer tidak menerima balasan ganda dari dua orang berbeda.
- **Transfer Antar Tim**: Sales dapat memindahkan chat ke rekan sales lain disertai catatan konteks (*handoff note*).
- **Takeover Supervisor/Admin**: Admin dan Supervisor memiliki kewenangan mengambil alih chat jika diperlukan eskalasi.
- **Lepas ke Antrean**: Agen dapat mengembalikan chat ke antrean jika berada di luar cakupan tugasnya.

### 2. Role-Based Access Control (RBAC)
| Kemampuan | Admin | Supervisor | Sales |
| :--- | :---: | :---: | :---: |
| Akses Shared Inbox | ✅ | ✅ | ✅ |
| Filter "Chat Saya" & "Semua" | ✅ | ✅ | ✅ |
| Ambil Chat dari Antrean (*Claim*) | ✅ | ✅ | ✅ |
| Balas Chat yang Ditangani Sendiri | ✅ | ✅ | ✅ |
| Balas Chat Sales Lain | ✅ | ✅ | ❌ *(View-only)* |
| Transfer Percakapan | ✅ | ✅ | ✅ *(Milik Sendiri)* |
| Takeover Percakapan Sales Lain | ✅ | ✅ | ❌ |
| Kontrol Sesi WhatsApp (QR Code / Disconnect) | ✅ | ✅ | ❌ |
| Pengawasan Antrean Realtime (Queue Stats) | ✅ | ✅ | ❌ |

### 3. Pengalaman Pengguna & Komponen UI (shadcn/ui)
- **Draggable Resizable Divider**: Pembatas daftar chat dan ruang pesan dapat ditarik (*resize*) mulai dari `260px` hingga `520px` (default `340px`), dengan fitur reset otomatis via klik ganda dan tersimpan di `localStorage`.
- **Indikator Kepemilikan Jelas**:
  - 🟠 *Badge Amber* dengan titik kedip untuk chat **Belum Ditangani**.
  - 🟢 *Badge Emerald* untuk chat yang **Ditangani Anda**.
  - 🔵 *Badge Biru* untuk chat yang **Ditangani Rekan Tim**.
- **Kartu Penanggung Jawab Chat**: Panel ringkas di sisi kanan customer yang menampilkan avatar penanggung jawab, nama, peran, dan tombol cepat aksi (Transfer / Lepas / Ambil Chat).
- **Simulasi Pesan Realtime & Mock Store**: Dilengkapi generator pesan dummy, auto-reply simulator, dan siklus centang pesan (*pending* ➔ *sent* ➔ *delivered* ➔ *read*).
- **1-Click Test Persona Switcher**: Kemudahan menguji perpindahan peran Admin, Supervisor, dan Sales langsung dari header aplikasi.

---

## 🏗️ Rekomendasi Arsitektur Backend

```
                 ┌────────────────────────────────────────────────┐
                 │          WhatsApp Official / Gateway           │
                 │   (Baileys / WhatsApp Cloud API / WPPConnect)  │
                 └───────────────────────┬────────────────────────┘
                                         │ Webhook / Baileys Events
                                         ▼
                 ┌────────────────────────────────────────────────┐
                 │       Backend Service (Node.js / Go)           │
                 │  - REST API Engine (Express / Fastify / Nest)  │
                 │  - Socket.IO Server (Real-time Broadcast)      │
                 │  - Auth & RBAC Middleware                      │
                 │  - Queue & Assignment Manager                  │
                 └───────┬───────────────────────────────┬────────┘
                         │                               │
        Database Queries │              Real-time Events │ (WebSocket)
                         ▼                               ▼
                 ┌───────────────┐              ┌─────────────────┐
                 │  PostgreSQL   │              │  LesungConnect  │
                 │  / Redis Pub  │              │  Frontend (SPA) │
                 └───────────────┘              └─────────────────┘
```

---

## 📡 Rekomendasi Kontrak API (API Contract Specification)

Berikut adalah spesifikasi kontrak API RESTful dan WebSocket yang direkomendasikan untuk menghubungkan frontend LesungConnect dengan backend produksi:

### 1. Standar Amplop Respons (Standard Response Envelope)

Semua endpoint RESTful mengembalikan JSON dengan struktur konsisten:

#### Respons Berhasil (`200`, `201`):
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 120,
    "page": 1,
    "limit": 30
  }
}
```

#### Respons Gagal (`400`, `401`, `403`, `404`, `500`):
```json
{
  "success": false,
  "error": {
    "code": "CONVERSATION_ALREADY_ASSIGNED",
    "message": "Chat ini sudah diambil oleh sales lain."
  }
}
```

---

### 2. Autentikasi (`/api/v1/auth`)

#### `POST /api/v1/auth/login`
Autentikasi akun pengguna dengan username dan password.
- **Request Body**:
  ```json
  {
    "username": "sales.rina",
    "password": "PasswordRahasia123!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "d8a1c7...",
      "user": {
        "id": "usr-sales-1",
        "username": "sales.rina",
        "name": "Rina Pratama",
        "role": "sales",
        "title": "Account Executive",
        "email": "rina@lesung.id",
        "initials": "RP",
        "avatarBg": "bg-emerald-600 text-white",
        "canControlWhatsApp": false
      }
    }
  }
  ```

#### `POST /api/v1/auth/refresh`
Memperbarui access token yang kedaluwarsa menggunakan refresh token.
- **Request Body**: `{ "refreshToken": "..." }`
- **Response `200 OK`**: `{ "accessToken": "...", "refreshToken": "..." }`

#### `GET /api/v1/auth/me`
Mengambil profil pengguna yang sedang login berdasarkan `Bearer Token`.

---

### 3. Percakapan & Antrean (`/api/v1/conversations`)

#### `GET /api/v1/conversations`
Mengambil daftar percakapan aktif berdasarkan scope filter.
- **Query Parameters**:
  - `scope` *(string)*: `all` | `mine` | `unassigned`
  - `search` *(string, opsional)*: Pencarian nama pelanggan, nomor WA, atau isi pesan terakhir.
  - `page` *(number)*: Halaman data (default: `1`).
  - `limit` *(number)*: Jumlah data per halaman (default: `30`).
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "conv-101",
          "customer": {
            "id": "cust-1",
            "name": "Budi Santoso",
            "waNumber": "6281234567890@c.us",
            "company": "PT Maju Bersama",
            "email": "budi@majubersama.co.id",
            "address": "Jakarta Barat"
          },
          "preview": "Halo min, mau tanya info layanan terbaru...",
          "lastMessageAt": "2026-10-16T13:45:00Z",
          "unreadCount": 2,
          "status": "assigned",
          "assignee": "Rina Pratama",
          "assigneeId": "usr-sales-1",
          "assigneeRole": "sales",
          "waitingSince": null,
          "tags": ["Corporate", "Inquiry"],
          "assignments": [
            {
              "id": "asg-01",
              "userId": "usr-sales-1",
              "assignedAt": "2026-10-16T10:00:00Z",
              "endedAt": null,
              "endReason": null,
              "user": {
                "id": "usr-sales-1",
                "name": "Rina Pratama",
                "role": "sales"
              }
            }
          ]
        }
      ]
    },
    "meta": { "total": 1, "page": 1, "limit": 30 }
  }
  ```

#### `POST /api/v1/conversations/:id/claim`
Mengambil kepemilikan percakapan dari antrean (`unassigned` ➔ `assigned`).
- **Authorization**: Diperlukan (`Bearer Token`).
- **Response `200 OK`**: Mengembalikan objek percakapan yang telah diperbarui dengan `assignee` user login.

#### `POST /api/v1/conversations/:id/transfer`
Memindahkan chat ke agen lain atau mengembalikan ke antrean bersama.
- **Request Body**:
  ```json
  {
    "targetUserId": "usr-sales-2",
    "note": "Customer minta asistensi spesifikasi teknis tambahan."
  }
  ```
- *Catatan*: Jika `targetUserId` bernilai `null` atau `"queue"`, chat akan dikembalikan ke status `unassigned`.

#### `POST /api/v1/conversations/:id/release`
Melepas percakapan kembali ke antrean `unassigned`.
- **Request Body**:
  ```json
  {
    "note": "Dilepas kembali ke antrean umum."
  }
  ```

#### `POST /api/v1/conversations/:id/takeover` *(Admin & Supervisor Only)*
Mengambil alih paksa chat yang sedang dipegang oleh agen lain.
- **Request Body**:
  ```json
  {
    "reason": "Eskalasi darurat atas permintaan pelanggan."
  }
  ```

#### `POST /api/v1/conversations/:id/read`
Menandai pesan-pesan dalam percakapan telah dibaca oleh tim.
- **Request Body**:
  ```json
  {
    "lastMessageId": "msg-999"
  }
  ```

#### `GET /api/v1/conversations/stats/queue`
Statistik antrean real-time untuk pemantauan supervisor.
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": {
      "unassigned": 3,
      "assigned": 12,
      "oldestWaitingSeconds": 145
    }
  }
  ```

---

### 4. Pesan WhatsApp (`/api/v1/conversations/:id/messages`)

#### `GET /api/v1/conversations/:id/messages`
Mengambil riwayat pesan percakapan (mendukung cursor pagination).
- **Query Parameters**:
  - `limit` *(number)*: Jumlah pesan (default: `50`).
  - `before` *(string, opsional)*: Message ID untuk mengambil pesan terdahulu (*infinite scroll* ke atas).
- **Response `200 OK`**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "msg-101",
        "conversationId": "conv-101",
        "direction": "in",
        "type": "text",
        "body": "Halo, apakah stok paket corporate masih ada?",
        "mediaUrl": null,
        "status": "read",
        "createdAt": "2026-10-16T13:40:00Z",
        "sentBy": null,
        "replyToId": null
      },
      {
        "id": "msg-102",
        "conversationId": "conv-101",
        "direction": "out",
        "type": "text",
        "body": "Halo Kak Budi, paket masih tersedia ya. Bisa kami bantu dengan proposal resminya?",
        "mediaUrl": null,
        "status": "delivered",
        "createdAt": "2026-10-16T13:42:00Z",
        "sentById": "usr-sales-1",
        "sentBy": "Rina Pratama",
        "replyToId": "msg-101"
      }
    ]
  }
  ```

#### `POST /api/v1/conversations/:id/messages`
Mengirim pesan WhatsApp keluar ke pelanggan.
- **Validasi Keamanan**: Backend wajib menolak kirim pesan (`403 Forbidden`) jika pengirim adalah sales yang **bukan** penanggung jawab aktif percakapan.
- **Request Body**:
  ```json
  {
    "type": "text",
    "body": "Pesan balasan resmi...",
    "clientTempId": "temp-1729080000000",
    "replyToMessageId": "msg-101"
  }
  ```
- **Response `201 Created`**: Mengembalikan objek pesan dengan status `"pending"` atau `"sent"`.

---

### 5. Status Koneksi WhatsApp (`/api/v1/whatsapp`) *(Admin/Supervisor Only)*

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/v1/whatsapp/status` | Mengecek status koneksi (`connected`, `connecting`, `qr_ready`, `disconnected`). |
| `GET` | `/api/v1/whatsapp/qr` | Mengambil QR string atau base64 gambar QR untuk dipindai aplikasi WhatsApp di HP. |
| `POST` | `/api/v1/whatsapp/reconnect` | Meminta gateway WhatsApp mencoba inisialisasi ulang soket koneksi. |
| `POST` | `/api/v1/whatsapp/disconnect` | Memutus sesi login nomor WhatsApp dari server. |

---

### 6. Kontrak Real-time (WebSocket / Socket.IO Events)

Frontend menggunakan Socket.IO pada path `/socket.io` dengan autentikasi `token`.

#### Client ➔ Server Events
| Event Name | Payload | Deskripsi |
| :--- | :--- | :--- |
| `join:conversation` | `{ "conversationId": "conv-101" }` | Masuk ke room percakapan untuk menerima stream pesan langsung. |
| `leave:conversation`| `{ "conversationId": "conv-101" }` | Keluar dari room percakapan saat beralih chat. |
| `typing:start` | `{ "conversationId": "conv-101" }` | Memberitahu tim bahwa agen sedang mengetik balasan. |
| `typing:stop` | `{ "conversationId": "conv-101" }` | Berhenti mengetik. |

#### Server ➔ Client Events
| Event Name | Payload | Deskripsi |
| :--- | :--- | :--- |
| `conversation:created` | `BackendConversation` | Ada chat pelanggan baru masuk ke antrean umum. |
| `conversation:assigned` | `{ "conversationId": "...", "assignee": { "id": "...", "name": "..." } }` | Chat berhasil diklaim atau ditugaskan. |
| `conversation:transferred`| `{ "conversationId": "...", "from": "...", "to": "...", "note": "..." }` | Chat dipindahkan ke agen lain atau antrean. |
| `conversation:released` | `{ "conversationId": "..." }` | Chat dilepas kembali ke antrean umum. |
| `message:received` | `BackendMessage` | Pesan masuk baru dari WhatsApp pelanggan. |
| `message:sent` | `BackendMessage` | Pesan keluar yang sukses dikirim oleh tim. |
| `message:status_updated` | `{ "messageId": "...", "status": "sent" \| "delivered" \| "read" }` | Pembaruan tanda centang pesan WhatsApp. |
| `whatsapp:status` | `{ "status": "connected" \| "qr_ready" \| "disconnected", "qr": "..." }` | Perubahan status koneksi gateway WA. |

---

## 🗄️ Contoh Skema Database (PostgreSQL / Relational)

```sql
-- 1. Users & Roles
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'sales', -- 'admin', 'supervisor', 'sales'
    title VARCHAR(100),
    email VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Customers
CREATE TABLE customers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    wa_number VARCHAR(50) UNIQUE NOT NULL,
    company VARCHAR(150),
    email VARCHAR(150),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Conversations (Queue & Handlership)
CREATE TABLE conversations (
    id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) NOT NULL REFERENCES customers(id),
    status VARCHAR(20) NOT NULL DEFAULT 'unassigned', -- 'unassigned', 'assigned'
    current_assignee_id VARCHAR(64) REFERENCES users(id),
    last_message_at TIMESTAMP WITH TIME ZONE,
    waiting_since TIMESTAMP WITH TIME ZONE,
    unread_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Assignment History (Audit Trail)
CREATE TABLE conversation_assignments (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    end_reason TEXT
);

-- 5. Messages
CREATE TABLE messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    direction VARCHAR(5) NOT NULL, -- 'in', 'out'
    type VARCHAR(20) NOT NULL DEFAULT 'text', -- 'text', 'image', 'document'
    body TEXT,
    media_url TEXT,
    status VARCHAR(20) DEFAULT 'sent', -- 'pending', 'sent', 'delivered', 'read', 'failed'
    sent_by_id VARCHAR(64) REFERENCES users(id),
    reply_to_id VARCHAR(64) REFERENCES messages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🚀 Memulai Proyek Secara Lokal

### Prasyarat
- Node.js versi 18+ atau 20+
- npm atau pnpm / yarn

### Instalasi & Menjalankan Dev Server
```bash
# 1. Klon repositori
git clone https://github.com/papermintx/lesung-connect-.git
cd lesung-connect-

# 2. Instal dependensi
npm install

# 3. Jalankan server pengembangan Vite
npm run dev
```

Buka peramban Anda di `http://localhost:5173`.

### 🧪 Akun Uji Coba Cepat (Test Personas)

Aplikasi dilengkapi tombol 1-klik di halaman login dan dropdown switch role di header:

| Akun | Role | Password | Tugas Utama |
| :--- | :--- | :--- | :--- |
| `admin.test` | **ADMIN** | Bebas / 1-Klik | Akses penuh seluruh chat, takeover, transfer, kontrol koneksi WhatsApp QR. |
| `supervisor.test` | **SUPERVISOR** | Bebas / 1-Klik | Monitoring metrik antrean, takeover chat sales lain, evaluasi respon tim. |
| `sales1.test` | **SALES** *(Rina Pratama)* | Bebas / 1-Klik | Mengelola chat miliknya, klaim dari antrean, transfer chat. |
| `sales2.test` | **SALES** *(Bagas Saputra)* | Bebas / 1-Klik | Memverifikasi isolasi hak balas dan kolaborasi antrean. |

### Build Produksi
```bash
npm run build
```
Hasil kompilasi akan berada di folder `/dist` dan siap di-deploy ke hosting static mana pun (Vercel, Netlify, Cloudflare Pages, Firebase Hosting, Nginx).

---

## 📄 Lisensi
Hak Cipta © 2026 **LesungConnect**. Dilindungi undang-undang.
