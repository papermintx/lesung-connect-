# Dokumentasi Lengkap Fitur Chat

Dokumen ini adalah panduan penggunaan fitur chat WhatsApp pada
`lesung-connect-backend`. Fitur ini menyediakan:

- Inbox conversation dari WhatsApp.
- Penyimpanan riwayat pesan di PostgreSQL.
- Pengiriman dan penerimaan pesan text.
- Pengiriman dan penerimaan gambar serta berkas.
- Update realtime menggunakan Socket.IO.
- Status pesan `sent`, `delivered`, `read`, dan `failed`.
- Assignment chat ke sales.
- Typing indicator.
- Pagination riwayat pesan.

---

## 1. Gambaran arsitektur

```text
Customer WhatsApp
        |
        v
whatsapp-web.js
        |
        v
WhatsAppService
        |
        +--> PostgreSQL: Customer, Conversation, Message
        |
        +--> Media storage: storage/media atau object storage
        |
        v
RealtimeEventBus
        |
        v
Socket.IO
        |
        v
Web frontend sales/admin/supervisor
```

Socket.IO hanya digunakan untuk memberitahukan perubahan secara realtime.
Sumber data utama tetap database. Karena itu, frontend harus mengambil riwayat
dari database ketika halaman dibuka dan melakukan reload data setelah reconnect.

### Alur pesan masuk

1. WhatsApp mengirim event `message`.
2. Backend membaca nomor, nama, isi pesan, dan media jika tersedia.
3. Customer dibuat atau diperbarui berdasarkan `waNumber`.
4. Conversation aktif dicari atau dibuat.
5. Message disimpan ke PostgreSQL.
6. Gambar disimpan ke media storage.
7. `message:new` dikirim melalui Socket.IO.
8. `conversation:new`, `conversation:updated`, atau `conversation:changed`
   dikirim untuk memperbarui inbox.

### Alur pesan keluar

1. Frontend mengirim data melalui REST atau Socket.IO.
2. Backend memvalidasi payload dan hak akses user.
3. Backend mengirim text atau gambar ke WhatsApp.
4. Message disimpan ke PostgreSQL.
5. `message:new` dikirim ke client.
6. WhatsApp mengirim ACK.
7. Status pesan diperbarui dan dikirim melalui `message:status`.

---

## 2. Menjalankan backend

Install dependency:

```powershell
npm install
```

Siapkan `.env` berdasarkan `.env.example`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/lesung_connect
JWT_ACCESS_SECRET=ganti-dengan-secret-minimal-32-karakter
JWT_REFRESH_SECRET=ganti-dengan-secret-berbeda-minimal-32-karakter
PORT=3000
NODE_ENV=development

WWEBJS_SESSION_PATH=.wwebjs_auth
PUPPETEER_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe

DEV_AUTH_BYPASS=false
DEV_AUTH_USERNAME=admin.test

MEDIA_STORAGE_PATH=storage/media
MEDIA_PUBLIC_PATH=/media
MEDIA_MAX_BYTES=16777216
```

Jalankan migration dan seed:

```powershell
npm run prisma:migrate
npm run prisma:seed
```

Jalankan server:

```powershell
npm run dev
```

Server HTTP dan Socket.IO berjalan pada port yang sama:

```text
http://localhost:3000
```

Health check:

```http
GET /health
```

---

## 3. Model database

Model utama pada `prisma/schema.prisma`:

### Customer

Menyimpan identitas customer WhatsApp.

| Kolom | Keterangan |
|---|---|
| `id` | ID customer |
| `name` | Nama customer |
| `waNumber` | Nomor WhatsApp unik |
| `prospectStatus` | Status prospek |

### Conversation

Mewakili satu inbox chat customer.

| Kolom | Keterangan |
|---|---|
| `id` | ID conversation |
| `customerId` | Relasi ke customer |
| `status` | `unassigned`, `assigned`, atau `resolved` |
| `unreadCount` | Jumlah pesan belum dibaca |
| `lastMessageAt` | Waktu pesan terakhir |
| `waitingSince` | Waktu mulai menunggu assignment |

### ConversationAssignment

Menyimpan histori assignment chat ke user.

| Kolom | Keterangan |
|---|---|
| `conversationId` | Conversation terkait |
| `userId` | Sales/admin/supervisor penerima |
| `assignedAt` | Waktu assignment |
| `endedAt` | Waktu assignment selesai |
| `endReason` | Alasan selesai |

### Message

Menyimpan seluruh riwayat pesan masuk dan keluar.

| Kolom | Keterangan |
|---|---|
| `id` | ID pesan internal |
| `conversationId` | Conversation terkait |
| `direction` | `in` atau `out` |
| `type` | `text`, `image`, atau `document` |
| `body` | Isi text atau caption gambar |
| `mediaUrl` | URL media jika ada |
| `source` | `web`, `phone`, atau `customer` |
| `status` | `pending`, `sent`, `delivered`, `read`, `failed` |
| `waMessageId` | ID pesan WhatsApp unik |
| `clientTempId` | ID sementara dari frontend |
| `sentById` | User pengirim jika pesan dari web |
| `replyToId` | Relasi ke pesan yang dibalas |
| `createdAt` | Waktu dibuat |

### Apakah gambar disimpan di database?

Tidak sebagai binary atau base64. Database hanya menyimpan metadata:

- `type = "image"`
- caption di `body`
- lokasi file di `mediaUrl`
- status, ukuran/identitas file bila ditambahkan
- relasi conversation dan pengirim

File gambar saat ini disimpan di:

```text
storage/media
```

Untuk production, sebaiknya gunakan S3, MinIO, Cloudflare R2, Azure Blob, atau
object storage lain. Storage lokal dapat hilang jika server atau container
diganti.

---

## 4. Autentikasi

### REST

Kirim access token pada header:

```http
Authorization: Bearer <access-token>
```

### Socket.IO

Kirim token pada handshake:

```ts
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: accessToken,
  },
});
```

Jika token invalid, Socket.IO akan gagal connect dengan error
`UNAUTHORIZED`.

---

## 5. REST API conversation

Semua endpoint berikut memerlukan autentikasi.

### Daftar conversation

```http
GET /api/v1/conversations?scope=mine&status=assigned&page=1&limit=20
```

Parameter:

| Parameter | Nilai |
|---|---|
| `scope` | `mine`, `queue`, `all` |
| `status` | `unassigned`, `assigned`, `resolved` |
| `assignedTo` | ID user |
| `search` | Nama atau nomor WhatsApp |
| `page` | Nomor halaman |
| `limit` | 1 sampai 100 |

Default scope untuk sales adalah `mine`. Admin dan supervisor dapat memakai
scope `all`.

### Detail conversation

```http
GET /api/v1/conversations/:conversationId
```

### Ambil riwayat pesan

```http
GET /api/v1/conversations/:conversationId/messages?limit=50
```

Pagination pesan lama:

```http
GET /api/v1/conversations/:conversationId/messages?before=<messageId>&limit=50
```

Response berisi array message dari database. Pesan diurutkan dari yang terbaru.

### Queue statistics

```http
GET /api/v1/conversations/stats/queue
```

Contoh response:

```json
{
  "success": true,
  "data": {
    "unassigned": 4,
    "assigned": 12,
    "oldestWaitingSeconds": 180
  }
}
```

### Assignment

```http
POST /api/v1/conversations/:conversationId/claim
POST /api/v1/conversations/:conversationId/takeover
POST /api/v1/conversations/:conversationId/release
POST /api/v1/conversations/:conversationId/transfer
GET  /api/v1/conversations/:conversationId/assignments
```

Payload transfer:

```json
{
  "toUserId": "user-id",
  "note": "Dialihkan ke sales produk A"
}
```

Gunakan `toUserId: null` untuk mengembalikan conversation ke queue.

### Resolve dan reopen

```http
POST /api/v1/conversations/:conversationId/resolve
POST /api/v1/conversations/:conversationId/reopen
```

Payload resolve:

```json
{
  "note": "Customer sudah berhasil dihubungi",
  "prospectStatus": "follow_up"
}
```

### Tandai sudah dibaca

```http
POST /api/v1/conversations/:conversationId/read
```

Payload:

```json
{
  "lastMessageId": "message-id"
}
```

---

## 6. Mengirim pesan text

### REST request

```http
POST /api/v1/conversations/:conversationId/messages
Content-Type: application/json
Authorization: Bearer <access-token>
```

```json
{
  "type": "text",
  "body": "Halo, apakah produknya masih tersedia?",
  "clientTempId": "temp-123",
  "replyToMessageId": "message-id-optional"
}
```

`body` wajib diisi untuk pesan text. Jika `type` tidak dikirim, nilainya
default ke `text`.

### Contoh JavaScript

```ts
const response = await fetch(
  `${API_ORIGIN}/api/v1/conversations/${conversationId}/messages`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      type: "text",
      body: "Halo",
      clientTempId: crypto.randomUUID(),
    }),
  },
);

const result = await response.json();
```

---

## 7. Mengirim pesan gambar

Gambar dikirim sebagai base64. Base64 dapat berupa raw base64 atau data URL.

Format gambar yang diterima:

- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

Berkas dapat dikirim dengan `type: "document"`. Format yang didukung saat ini
adalah PDF, ZIP, Microsoft Word/Office Open XML, dan text plain:

```json
{
  "type": "document",
  "body": "Dokumen penawaran",
  "mediaBase64": "JVBERi0xLjQK...",
  "mediaMimeType": "application/pdf",
  "mediaFileName": "penawaran.pdf"
}
```

Batas decoded image default adalah 16 MiB:

```env
MEDIA_MAX_BYTES=16777216
```

### REST request gambar

```http
POST /api/v1/conversations/:conversationId/messages
Content-Type: application/json
Authorization: Bearer <access-token>
```

```json
{
  "type": "image",
  "body": "Ini foto produknya",
  "mediaBase64": "iVBORw0KGgoAAAANSUhEUgAA...",
  "mediaMimeType": "image/png",
  "mediaFileName": "produk.png",
  "clientTempId": "temp-image-123"
}
```

Contoh data URL:

```json
{
  "type": "image",
  "body": "Caption opsional",
  "mediaBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
  "mediaMimeType": "image/jpeg",
  "mediaFileName": "foto.jpg"
}
```

`body` boleh dikosongkan untuk gambar tanpa caption.

### Mengubah File menjadi base64

```ts
async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary);
}

const mediaBase64 = await fileToBase64(file);

socket.emit("conversation:send", {
  conversationId,
  type: "image",
  body: "Foto produk",
  mediaBase64,
  mediaMimeType: file.type,
  mediaFileName: file.name,
}, callback);
```

Untuk file besar, gunakan object storage dan signed upload URL pada production.
Base64 menambah ukuran payload sekitar 33%.

---

## 8. URL media dan tampilan gambar

Response pesan gambar:

```json
{
  "id": "message-id",
  "conversationId": "conversation-id",
  "direction": "out",
  "type": "image",
  "body": "Caption opsional",
  "mediaUrl": "/media/7b1-image.jpg",
  "source": "web",
  "status": "sent",
  "createdAt": "2026-10-09T03:00:00.000Z"
}
```

Jika `mediaUrl` relatif:

```ts
const imageUrl = `${API_ORIGIN}${message.mediaUrl}`;
```

Contoh React:

```tsx
{message.type === "image" && message.mediaUrl ? (
  <img
    src={`${API_ORIGIN}${message.mediaUrl}`}
    alt={message.body ?? "Gambar"}
    loading="lazy"
  />
) : null}
```

Endpoint media lokal:

```text
GET /media/<file-name>
```

---

## 9. API Socket.IO

Semua command menggunakan callback ACK dengan format:

```ts
{ ok: true, data: unknown }
```

atau:

```ts
{ ok: false, error: string }
```

### Daftar conversation

```ts
socket.emit("conversation:list", {
  scope: "mine",
  status: "assigned",
  page: 1,
  limit: 20,
}, callback);
```

### Statistik queue

```ts
socket.emit("conversation:stats", callback);
```

### Detail dan riwayat

```ts
socket.emit("conversation:detail", conversationId, callback);

socket.emit("conversation:messages", {
  conversationId,
  limit: 50,
}, callback);
```

Pagination:

```ts
socket.emit("conversation:messages", {
  conversationId,
  before: oldestMessageId,
  limit: 50,
}, callback);
```

### Kirim text

```ts
socket.emit("conversation:send", {
  conversationId,
  type: "text",
  body: "Halo",
  clientTempId: "temp-123",
}, callback);
```

### Kirim gambar

```ts
socket.emit("conversation:send", {
  conversationId,
  type: "image",
  body: "Foto produk",
  mediaBase64,
  mediaMimeType: "image/jpeg",
  mediaFileName: "produk.jpg",
}, callback);
```

### Operasi conversation

```ts
socket.emit("conversation:claim", conversationId, callback);
socket.emit("conversation:takeover", conversationId, callback);
socket.emit("conversation:release", conversationId, callback);

socket.emit("conversation:transfer", {
  conversationId,
  toUserId,
  note: "Dialihkan",
}, callback);

socket.emit("conversation:resolve", {
  conversationId,
  prospectStatus: "follow_up",
}, callback);

socket.emit("conversation:reopen", conversationId, callback);
socket.emit("conversation:assignments", conversationId, callback);
socket.emit("conversation:read", {
  conversationId,
  lastMessageId,
}, callback);
```

### Join dan leave room

```ts
socket.emit("conversation:join", conversationId, callback);
socket.emit("conversation:leave", conversationId, callback);
```

Sales hanya dapat join conversation yang sedang menjadi assignment-nya. Admin
dan supervisor dapat join conversation yang tersedia bagi mereka.

---

## 10. Event realtime dari server

### `message:new`

Dikirim saat pesan baru berhasil disimpan:

```ts
socket.on("message:new", ({ conversationId, data }) => {
  // Deduplicate menggunakan data.id.
  // Tambahkan pesan ke conversation yang sedang dibuka.
});
```

### Event conversation

```ts
socket.on("conversation:new", ({ data }) => {
  addConversation(data);
});

socket.on("conversation:changed", ({ data }) => {
  upsertConversation(data);
});

socket.on("conversation:updated", ({ data }) => {
  upsertConversation(data);
});

socket.on("conversation:assigned", ({ data }) => {
  upsertConversation(data);
});

socket.on("conversation:unassigned", ({ data }) => {
  upsertConversation(data);
});
```

Gunakan `conversation:changed` untuk memperbarui inbox ketika conversation baru
atau pesan baru mengubah `lastMessageAt` dan `unreadCount`.

### `message:status`

Dikirim ketika ACK WhatsApp mengubah status pesan keluar:

```ts
socket.on("message:status", ({ conversationId, data }) => {
  replaceMessage(conversationId, data.id, data);
});
```

Mapping status:

| Status | Arti |
|---|---|
| `sent` | WhatsApp menerima pesan dari backend |
| `delivered` | Pesan sampai ke device tujuan |
| `read` | Pesan telah dibaca |
| `failed` | Pengiriman gagal |

### `message:read`

Dikirim ketika user menandai conversation sebagai sudah dibaca:

```ts
socket.on("message:read", ({ conversationId, data }) => {
  // data.count berisi jumlah message yang diubah.
  // data.readBy berisi user yang menandai pesan.
});
```

### Typing

```ts
socket.emit("typing:start", conversationId);
socket.emit("typing:stop", conversationId);

socket.on("typing", ({ conversationId, userId, typing }) => {
  setTyping(conversationId, userId, typing);
});
```

### Status WhatsApp

Gunakan REST sebagai pemeriksaan sumber kebenaran koneksi WhatsApp:

```http
GET /api/v1/whatsapp/status
Authorization: Bearer <accessToken>
```

Backend memanggil `Client.getState()` dari `whatsapp-web.js`, bukan hanya
membaca state cache. Chat dianggap siap hanya jika response mengandung:

```json
{
  "state": "ready",
  "whatsappState": "CONNECTED",
  "ready": true
}
```

Panggil endpoint ini setelah `POST /api/v1/whatsapp/connect` dan sebelum
mengaktifkan UI pengiriman pesan. Setelah itu Socket.IO digunakan untuk
memantau perubahan melalui event `wa:status`. Socket.IO tidak membuat atau
menggantikan client WhatsApp; lifecycle tetap mengikuti event resmi
`whatsapp-web.js` (`qr`, `authenticated`, `ready`, `auth_failure`, dan
`disconnected`).

Kontrol koneksi WhatsApp dapat dilakukan melalui Socket.IO. Command koneksi
hanya boleh dipanggil oleh role `admin`, sama seperti endpoint HTTP saat ini.
`supervisor` dapat menerima event status dan QR, tetapi tidak dapat menjalankan
connect/logout/restart.

```ts
socket.emit("whatsapp:status", null, (response) => {
  if (response.ok) console.log(response.data);
});

socket.emit("whatsapp:connect", null, (response) => {
  if (!response.ok) console.error(response.error);
});

socket.emit("whatsapp:qr", null, (response) => {
  if (response.ok) renderQr(response.data.qr);
});

socket.emit("whatsapp:logout", null, (response) => {
  if (!response.ok) console.error(response.error);
});

socket.emit("whatsapp:restart", null, (response) => {
  if (!response.ok) console.error(response.error);
});
```

Semua command menggunakan format ACK:

```json
{ "ok": true, "data": { "state": "ready" } }
```

atau:

```json
{ "ok": false, "error": "FORBIDDEN" }
```

Event status dikirim realtime kepada admin dan supervisor:

```ts
socket.on("wa:qr", ({ qr }) => {
  renderQr(qr);
});

socket.on("wa:status", (status) => {
  // Gunakan status.ready === true sebelum mengaktifkan pengiriman pesan.
  updateWhatsAppStatus(status);
});
```

Saat Socket.IO berhasil terhubung, backend mengirim snapshot `wa:status`
terbaru kepada socket tersebut. Dengan begitu frontend tidak perlu menebak
status WhatsApp dari status Socket.IO.

Urutan penggunaan pertama kali:

1. Admin connect ke Socket.IO.
2. Admin memanggil `whatsapp:connect`.
3. Backend mengirim `wa:status` dengan state `authenticating`.
4. Jika QR diperlukan, backend mengirim `wa:qr` dan state `qr`.
5. Frontend menampilkan QR.
6. Setelah scan, backend mengirim status `authenticating`, lalu `ready`.

Tidak perlu memanggil endpoint HTTP `/api/v1/whatsapp/connect`, `/qr`,
`/logout`, atau `/restart` jika frontend memakai command Socket.IO ini.

### Status koneksi realtime

Setelah autentikasi Socket.IO berhasil, backend mengirim:

```ts
socket.on("realtime:status", (status) => {
  // status.state === "connected"
});
```

Frontend juga dapat menguji koneksi:

```ts
socket.emit("realtime:ping", (response) => {
  if (response.ok) console.log("Realtime aktif", response.data.serverTime);
});

socket.on("connect", () => setRealtimeState("connected"));
socket.on("disconnect", () => setRealtimeState("disconnected"));
socket.on("connect_error", () => setRealtimeState("error"));
```

---

## 11. Pola implementasi frontend yang disarankan

### Saat aplikasi dibuka

1. Connect Socket.IO.
2. Ambil daftar conversation dari database.
3. Register seluruh listener realtime.
4. Jika Socket.IO reconnect, ambil ulang daftar conversation.

### Saat conversation dibuka

1. Emit `conversation:join`.
2. Ambil riwayat melalui `conversation:messages`.
3. Render pesan dari database.
4. Setelah pesan terlihat, emit `conversation:read`.

### Saat pesan baru diterima

1. Cari conversation berdasarkan `conversationId`.
2. Jika pesan belum ada berdasarkan `data.id`, tambahkan ke state.
3. Jika conversation tidak sedang dibuka, naikkan badge unread.
4. Update preview pesan terakhir.

### Saat mengirim pesan

1. Buat `clientTempId`.
2. Tampilkan status sementara `pending` jika diinginkan.
3. Kirim `conversation:send`.
4. Ganti pesan sementara dengan response database.
5. Dengarkan `message:status` untuk status WhatsApp.

Contoh deduplication:

```ts
function addMessage(message: Message) {
  setMessages((current) => {
    if (current.some((item) => item.id === message.id)) return current;
    return [...current, message];
  });
}
```

---

## 12. Error yang umum

### `WA_NOT_READY`

WhatsApp belum terhubung atau belum berstatus `ready`.

Solusi:

1. Cek `GET /api/v1/whatsapp/status`.
2. Jalankan `POST /api/v1/whatsapp/connect`.
3. Ambil QR melalui `GET /api/v1/whatsapp/qr`.
4. Scan QR dari WhatsApp.

### `CONVERSATION_RESOLVED`

Conversation sudah selesai. Reopen conversation sebelum membalas.

### `CONVERSATION_NOT_OWNED`

Sales bukan pemilik assignment conversation tersebut.

### `UNSUPPORTED_MEDIA_TYPE`

MIME type gambar bukan JPEG, PNG, WEBP, atau GIF.

### `MEDIA_TOO_LARGE`

Ukuran gambar melebihi `MEDIA_MAX_BYTES`.

### Pesan tersimpan tetapi tidak muncul di web

Periksa:

1. Frontend sudah connect dengan token yang benar.
2. Frontend sudah memasang listener `message:new`.
3. Frontend melakukan `conversation:join`.
4. Frontend tidak melakukan duplicate filtering berdasarkan `clientTempId`
   secara keliru.
5. Browser tidak memblokir URL `/media`.
6. Server dan frontend memakai host/port yang benar.
7. Setelah reconnect, frontend mengambil ulang data dari database.

### Riwayat kosong

Periksa:

1. `conversationId` benar.
2. Endpoint dipanggil dengan access token.
3. Data tersedia di tabel `messages`.
4. Query pagination tidak menggunakan `before` yang salah.
5. Migration dan `DATABASE_URL` mengarah ke database yang benar.

---

## 13. Production dan keamanan

### Storage

Storage lokal hanya direkomendasikan untuk development. Production sebaiknya:

1. Upload gambar ke S3/MinIO/R2/Azure Blob.
2. Simpan object key atau URL di `mediaUrl`.
3. Gunakan bucket private jika gambar sensitif.
4. Berikan signed URL dengan masa berlaku terbatas.
5. Aktifkan backup dan lifecycle policy.

Implementasi storage dipisahkan di `src/lib/media.ts`, sehingga dapat diganti
tanpa mengubah kontrak message dan event Socket.IO.

### Upload

Disarankan menambahkan:

- rate limit upload per user;
- validasi magic bytes, bukan hanya MIME type;
- antivirus/content scanning;
- pembatasan dimensi gambar;
- normalisasi nama file;
- audit log;
- penghapusan media saat data dihapus sesuai retention policy.

### Socket.IO scale-out

Jika backend dijalankan lebih dari satu instance, gunakan Socket.IO Redis adapter
atau adapter message broker lain. EventEmitter lokal hanya bekerja di satu proses.

### Reconnect

Socket.IO tidak menjamin client menerima event yang terjadi saat disconnect.
Setelah reconnect, frontend wajib:

1. mengambil ulang daftar conversation;
2. mengambil ulang riwayat conversation yang sedang terbuka;
3. melakukan deduplication berdasarkan `Message.id`.

---

## 14. Checklist pengujian fitur

- [ ] WhatsApp berstatus `ready`.
- [ ] Customer mengirim pesan text.
- [ ] Message masuk tersimpan di database.
- [ ] Conversation baru muncul di inbox.
- [ ] `message:new` diterima browser.
- [ ] Riwayat dapat diambil dari REST.
- [ ] Riwayat dapat diambil dari Socket.IO.
- [ ] Sales dapat mengirim pesan text.
- [ ] Status berubah dari `sent` ke `delivered` atau `read`.
- [ ] Customer mengirim gambar.
- [ ] Gambar masuk tersimpan di media storage.
- [ ] Message gambar tersimpan dengan `type = image`.
- [ ] `mediaUrl` dapat dibuka browser.
- [ ] Sales dapat mengirim gambar.
- [ ] Caption gambar tersimpan.
- [ ] Conversation dapat ditandai read.
- [ ] Reconnect melakukan reload dari database.
- [ ] Pesan WhatsApp duplikat tidak membuat record ganda.

---

## 15. File implementasi terkait

- `src/modules/conversations/service.ts`  
  Logika conversation, penyimpanan message, riwayat, read, assignment, dan
  event realtime.

- `src/modules/conversations/controller.ts`  
  Handler REST untuk conversation dan pengiriman pesan.

- `src/modules/conversations/schema.ts`  
  Validasi payload text dan image.

- `src/modules/whatsapp/service.ts`  
  Koneksi WhatsApp, menerima pesan, mengirim text/gambar, dan menerima ACK.

- `src/realtime/socket.ts`  
  Autentikasi Socket.IO, command realtime, room, dan broadcast event.

- `src/realtime/events.ts`  
  Event bus internal backend.

- `src/lib/media.ts`  
  Validasi, decode base64, dan penyimpanan media.

- `src/app.ts`  
  Static route untuk `/media`.

- `prisma/schema.prisma`  
  Model database dan relasi chat.

---

## 16. Debugging koneksi dan request

Backend mencetak log JSON untuk membantu mencari masalah ketika frontend
Socket.IO hanya menampilkan `connecting`.

### Log HTTP

Setiap request HTTP menghasilkan dua log:

```text
HTTP request started
HTTP request completed
```

Informasi yang dicatat:

- method
- path
- IP
- status code
- durasi request

Body request, token, base64 gambar, dan isi chat tidak dicatat.

### Log Socket.IO

Lifecycle Socket.IO yang dicatat:

- `Socket handshake received`
- `Socket handshake authenticated`
- `Socket handshake rejected`
- `Socket connected`
- `Socket request received`
- `Socket event sent`
- `Socket disconnected`
- `Socket error`
- `Socket Engine.IO connection error`

Contoh log:

```json
{
  "timestamp": "2026-10-09T03:40:00.000Z",
  "level": "INFO",
  "message": "Socket handshake authenticated",
  "context": {
    "socketId": "abc123",
    "transport": "polling",
    "userId": "user-id",
    "role": "admin"
  }
}
```

Untuk request event, backend hanya mencatat nama event dan nama key payload,
bukan isi payload:

```json
{
  "message": "Socket request received",
  "context": {
    "event": "conversation:messages",
    "argumentCount": 2,
    "argumentKeys": ["conversationId", "limit"]
  }
}
```

### Cara mendiagnosis frontend stuck `connecting`

1. Jalankan backend:

   ```powershell
   npm run dev
   ```

2. Buka halaman web dan cari log `Socket handshake received`.
3. Jika tidak ada log tersebut, frontend tidak mencapai backend. Periksa URL,
   port, path Socket.IO, proxy, dan CORS.
4. Jika muncul `Socket handshake rejected`, periksa:
   - token ada di `auth.token`;
   - token belum expired;
   - role dan user masih aktif;
   - frontend tidak hanya mengirim token sebagai query string.
5. Jika muncul `Socket connected`, koneksi backend sudah berhasil.
6. Setelah itu cari `Socket request received` untuk memastikan event frontend
   benar-benar dikirim.
7. Jika ada `Socket event sent`, backend sudah mengirim response/event ke client.
8. Jika koneksi putus, periksa `Socket disconnected` dan field `reason`.

Contoh koneksi frontend yang benar:

```ts
const socket = io("http://localhost:3000", {
  auth: {
    token: accessToken,
  },
  transports: ["polling", "websocket"],
});

socket.on("connect", () => {
  console.log("Socket connected", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Socket connect error", error.message);
});

socket.on("disconnect", (reason) => {
  console.warn("Socket disconnected", reason);
});
```

Jangan memaksa `transports: ["websocket"]` sebelum koneksi polling terbukti
berhasil. Gunakan default `polling` lalu upgrade otomatis ke WebSocket, atau
gunakan konfigurasi `["polling", "websocket"]` seperti contoh di atas.

### Troubleshooting timeout `server tidak terhubung`

Endpoint Engine.IO dapat diuji langsung:

```text
http://localhost:3000/socket.io/?EIO=4&transport=polling
```

Jika backend hidup, response awal berisi `sid`, `upgrades`, `pingInterval`,
dan `pingTimeout`.

Gunakan konfigurasi client berikut. Jangan hanya menggunakan `websocket`:

```ts
const socket = io("http://localhost:3000", {
  path: "/socket.io",
  auth: {
    token: accessToken,
  },
  transports: ["polling", "websocket"],
  upgrade: true,
  timeout: 15000,
  reconnection: true,
  reconnectionAttempts: Infinity,
});
```

Jika memakai `transports: ["websocket"]`, browser harus berhasil melakukan
WebSocket handshake langsung. Pada development, proxy, antivirus, HTTPS/HTTP
campuran, atau konfigurasi server sering menutup transport tersebut dan
menghasilkan `transport close`. Polling-first menghindari masalah ini.

Log server yang perlu dicari:

```text
Socket Engine.IO request received
Socket handshake received
Socket handshake authenticated
Socket connected
```

Interpretasi:

- Hanya `Socket Engine.IO request received`: transport sampai ke backend,
  tetapi handshake Socket.IO belum selesai.
- `Socket handshake rejected`: token tidak ada, expired, invalid, atau user
  tidak aktif.
- Tidak ada log sama sekali: URL, port, path, proxy, atau jaringan frontend
  salah.
- `Socket connected` lalu `transport close`: periksa proxy dan jangan memaksa
  WebSocket-only.

Pastikan `accessToken` adalah token hasil `POST /api/v1/auth/login`, bukan
`refreshToken`, bukan password, dan bukan JWT secret. Jika `DEV_AUTH_BYPASS=false`,
token wajib dikirim pada `auth.token`.

Token dapat dikirim sebagai JWT murni:

```ts
auth: { token: accessToken }
```

Backend juga menerima format berikut, tetapi format JWT murni lebih disarankan:

```ts
auth: { token: `Bearer ${accessToken}` }
```

Log diagnosis autentikasi:

- `Socket auth token missing`: client tidak mengirim token.
- `Socket JWT verification failed`: token expired, rusak, atau secret berbeda.
- `Socket JWT claims invalid`: claim `sub`, `role`, atau `sid` tidak valid.
- `Socket user rejected`: user tidak ada, nonaktif, atau role token berbeda
  dari database.
- `Socket connected`: handshake Socket.IO selesai.
