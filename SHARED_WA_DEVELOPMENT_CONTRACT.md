# Kontrak Development Shared WhatsApp Inbox

Versi: `1.0-development`  
Scope: kontrol chat dan kontrol koneksi WhatsApp untuk dashboard admin/supervisor  
Base URL lokal: `http://localhost:3000/api/v1`  
Socket.IO URL lokal: `http://localhost:3000`

Dokumen ini adalah kontrak untuk pembuatan tampilan web tahap development.
CRM, customer CRUD, notes, tags, media upload, quick replies, transaksi,
follow-up, dan reports belum termasuk dalam scope dokumen ini.

## 1. Prinsip integrasi

1. REST dipakai untuk membaca data dan menjalankan aksi bisnis.
2. Socket.IO dipakai untuk update realtime dari server.
3. Frontend tidak mengubah status chat secara lokal tanpa response REST.
4. Frontend boleh memakai optimistic UI untuk pesan keluar menggunakan
   `clientTempId`, tetapi harus mengganti item sementara dengan response REST
   atau event `message:new`.
5. Semua waktu dari backend adalah ISO 8601 UTC. Frontend mengubahnya ke
   timezone tampilan, misalnya `Asia/Jakarta`.
6. ID adalah string.
7. Tidak ada endpoint CRM yang boleh diasumsikan tersedia dari kontrak ini.

## 2. Development authentication

Pada development, backend dapat dijalankan tanpa login:

```env
NODE_ENV=development
DEV_AUTH_BYPASS=true
DEV_AUTH_USERNAME=admin.test
```

Backend akan memakai user dengan username `admin.test` untuk REST dan Socket.IO.
User tersebut harus sudah dibuat melalui seed:

```bash
npm run prisma:seed
```

Bypass hanya aktif jika `NODE_ENV=development`. Frontend tidak perlu mengirim
header `Authorization` atau token Socket.IO selama bypass aktif.

Untuk mode auth normal, REST memakai:

```http
Authorization: Bearer <accessToken>
```

Socket.IO memakai:

```ts
io("http://localhost:3000", {
  auth: { token: accessToken },
});
```

Jangan menyimpan `DEV_AUTH_BYPASS=true` pada environment production.

## 3. Format response

Response sukses:

```json
{
  "success": true,
  "data": {}
}
```

Response error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Pesan yang dapat ditampilkan di UI",
    "details": {}
  }
}
```

Frontend menampilkan `error.message`, sedangkan `error.code` dipakai untuk
menentukan aksi UI.

Error utama:

| HTTP | Code | Tindakan frontend |
|---:|---|---|
| 400 | `VALIDATION_ERROR` | Tampilkan error pada field |
| 401 | `UNAUTHORIZED` | Pada auth normal, refresh/login ulang |
| 403 | `FORBIDDEN` | Tampilkan notifikasi akses ditolak |
| 404 | `NOT_FOUND` | Hapus item dari state atau kembali ke inbox |
| 409 | `CONVERSATION_ALREADY_ASSIGNED` | Refresh detail dan list |
| 403 | `CONVERSATION_NOT_OWNED` | Minta user claim/takeover terlebih dahulu |
| 409 | `CONVERSATION_RESOLVED` | Tawarkan aksi reopen |
| 422 | `WA_NOT_READY` | Tampilkan status WhatsApp dan blokir kirim |
| 500 | `INTERNAL_ERROR` | Tampilkan retry dan log error |

## 4. Model data yang dipakai dashboard

### Conversation

```ts
type ConversationStatus = "unassigned" | "assigned" | "resolved";

interface Conversation {
  id: string;
  customerId: string;
  status: ConversationStatus;
  unreadCount: number;
  lastMessageAt: string | null;
  waitingSince: string | null;
  resolvedAt: string | null;
  resolvedById: string | null;
  createdAt: string;
  updatedAt: string;
  customer: Customer;
  assignments: Assignment[];
  messages?: Message[];
}
```

### Customer minimal

Customer hanya dipakai sebagai informasi pada chat. Fitur pengelolaannya
belum termasuk scope:

```ts
interface Customer {
  id: string;
  name: string;
  waNumber: string;
  email: string | null;
  company: string | null;
  address: string | null;
  prospectStatus: "new" | "follow_up" | "negotiation" | "won" | "lost";
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
}
```

`waNumber` dapat berupa identifier WhatsApp seperti `628...@c.us` atau
`...@lid`. Frontend tidak boleh memotong suffix tersebut.

### Assignment

```ts
interface Assignment {
  id: string;
  conversationId: string;
  userId: string;
  assignedAt: string;
  endedAt: string | null;
  endReason: string | null;
  user: {
    id: string;
    name: string;
    role?: "admin" | "supervisor" | "sales";
  };
}
```

Assignment aktif memiliki `endedAt: null`.

### Message

```ts
interface Message {
  id: string;
  conversationId: string;
  direction: "in" | "out";
  type: string;
  body: string;
  mediaUrl: string | null;
  source: "customer" | "web" | "phone";
  status: string;
  waMessageId: string | null;
  clientTempId: string | null;
  sentById: string | null;
  replyToId: string | null;
  createdAt: string;
  updatedAt: string;
  sentBy: { id: string; name: string } | null;
}
```

Untuk scope development ini, pengiriman yang didukung adalah pesan teks.

## 5. REST API koneksi WhatsApp

Prefix:

```text
/api/v1/whatsapp
```

Semua endpoint di bawah dapat dipanggil tanpa token jika development bypass
aktif. Dalam mode auth normal, hanya admin yang boleh menggunakannya.

### `GET /whatsapp/status`

Response:

```json
{
  "success": true,
  "data": {
    "state": "ready",
    "phoneNumber": "628123456789",
    "connectedAt": "2026-10-08T07:00:00.000Z"
  }
}
```

State:

```text
disconnected
authenticating
qr
ready
failed
```

### `POST /whatsapp/connect`

Memulai inisialisasi WhatsApp. Response langsung mengembalikan status saat ini;
QR dan status berikutnya dikirim melalui Socket.IO.

### `GET /whatsapp/qr`

Mengambil QR dalam bentuk string:

```json
{
  "success": true,
  "data": {
    "qr": "2@..."
  }
}
```

Jika QR belum tersedia, response adalah `404 WHATSAPP_QR_NOT_READY`.

### `GET /whatsapp/qr/image`

Mengembalikan binary PNG, bukan JSON. Gunakan sebagai `src` image melalui
endpoint proxy frontend atau ambil dengan `fetch` menjadi Blob.

### `POST /whatsapp/restart`

Logout lalu inisialisasi ulang client WhatsApp.

### `POST /whatsapp/logout`

Memutus koneksi dan menghapus session `LocalAuth`.

## 6. REST API inbox dan kontrol chat

Prefix:

```text
/api/v1/conversations
```

### `GET /conversations`

Query yang didukung:

| Query | Nilai |
|---|---|
| `scope` | `mine`, `queue`, `all` |
| `status` | `unassigned`, `assigned`, `resolved` |
| `assignedTo` | user ID |
| `search` | pencarian nama atau nomor |
| `page` | default `1` |
| `limit` | default `20`, maksimal `100` |

Default scope:

- admin/supervisor: `all`
- sales: `mine`

Response aktual:

```json
{
  "success": true,
  "data": {
    "items": [],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0
    }
  }
}
```

### `GET /conversations/:id`

Mengambil detail satu conversation, customer, assignment aktif, dan
`canReply`.

UI wajib memakai `canReply` sebagai indikator tambahan, tetapi backend tetap
menjadi sumber validasi utama.

### `GET /conversations/:id/messages`

Query:

```text
?limit=30
?before=<messageId>&limit=30
```

Response berupa array message. Urutan dari backend adalah terbaru ke terlama.
Frontend dapat membalik array untuk tampilan thread dari atas ke bawah.

### `POST /conversations/:id/messages`

Mengirim balasan teks melalui WhatsApp.

Request:

```json
{
  "body": "Halo, ada yang bisa kami bantu?",
  "clientTempId": "tmp-171234"
}
```

`body` wajib 1-10.000 karakter. `replyToMessageId` dapat dikirim jika UI
mendukung reply:

```json
{
  "body": "Baik, kami cek dulu.",
  "replyToMessageId": "message-id",
  "clientTempId": "tmp-172345"
}
```

Success: HTTP `201`, message disimpan dengan `direction: "out"` dan
`source: "web"`.

Syarat pengiriman:

1. Conversation ada.
2. Conversation belum resolved.
3. Sales adalah pemilik assignment aktif.
4. WhatsApp berstatus `ready`.

Admin/supervisor dapat membalas sesuai aturan backend saat ini.

### `POST /conversations/:id/claim`

Mengambil chat `unassigned` untuk user saat ini. Operasi bersifat atomik.
Jika user lain lebih dahulu mengambil, backend mengembalikan
`409 CONVERSATION_ALREADY_ASSIGNED`.

### `POST /conversations/:id/transfer`

Admin/supervisor dapat transfer chat. Pemilik chat juga dapat transfer sesuai
aturan backend.

Request ke user lain:

```json
{
  "toUserId": "user-id",
  "note": "Dialihkan karena perlu penanganan khusus"
}
```

Mengembalikan ke antrean:

```json
{
  "toUserId": null,
  "note": "Menunggu sales berikutnya"
}
```

### `POST /conversations/:id/takeover`

Admin/supervisor mengambil alih chat:

```json
{
  "reason": "Customer meminta supervisor"
}
```

### `POST /conversations/:id/release`

Pemilik atau admin/supervisor melepas chat ke antrean:

```json
{
  "reason": "Sales sedang tidak tersedia"
}
```

### `POST /conversations/:id/resolve`

Menutup chat:

```json
{
  "note": "Pertanyaan customer sudah selesai",
  "prospectStatus": "won"
}
```

Semua field body opsional.

### `POST /conversations/:id/reopen`

Membuka kembali chat resolved dan memasukkannya ke status `unassigned`.

### `POST /conversations/:id/read`

Menandai chat telah dibaca:

```json
{
  "lastMessageId": "message-id"
}
```

Saat ini backend mereset `unreadCount` conversation.

### `GET /conversations/:id/assignments`

Mengambil seluruh riwayat assignment untuk panel audit ringan di detail chat.

### `GET /conversations/stats/queue`

Response:

```json
{
  "success": true,
  "data": {
    "unassigned": 4,
    "assigned": 12,
    "oldestWaitingSeconds": 340
  }
}
```

## 7. Socket.IO realtime contract

Connect:

```ts
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: { token: accessToken },
  // Hapus auth saat DEV_AUTH_BYPASS aktif.
});
```

Error koneksi:

```ts
socket.on("connect_error", (error) => {
  // error.message dapat berupa "UNAUTHORIZED"
});
```

### Room otomatis

Server otomatis memasukkan socket ke:

```text
user:{userId}
role:{role}
queue                 // admin/supervisor
```

### Join conversation

```ts
socket.emit("conversation:join", conversationId, (result) => {
  if (!result.ok) {
    // FORBIDDEN atau INVALID_CONVERSATION_ID
  }
});
```

User hanya dapat join jika:

- admin/supervisor; atau
- menjadi assignment aktif conversation tersebut.

Keluar:

```ts
socket.emit("conversation:leave", conversationId, callback);
```

### Event server

#### `message:new`

```ts
{
  conversationId: string;
  data: Message;
}
```

Dikirim saat pesan customer masuk atau pesan web berhasil disimpan.

#### `conversation:new`

Dikirim ketika pesan masuk membuat conversation aktif baru.

#### `conversation:updated`

Dikirim saat isi/status ringkas conversation berubah, termasuk unread count
dan last message.

#### `conversation:assigned`

Dikirim setelah claim, transfer ke user, atau takeover.

#### `conversation:unassigned`

Dikirim setelah release atau transfer ke antrean.

#### `wa:status`

Payload adalah status WhatsApp seperti response `GET /whatsapp/status`.

#### `wa:qr`

```ts
{ qr: string }
```

QR hanya dikirim ke role admin dan supervisor.

#### `typing`

```ts
{
  conversationId: string;
  userId: string;
  typing: boolean;
}
```

Client mengirim:

```ts
socket.emit("typing:start", conversationId);
socket.emit("typing:stop", conversationId);
```

Event typing hanya diteruskan setelah socket join conversation tersebut.

## 8. Alur halaman web yang disarankan

### A. Halaman koneksi WhatsApp

1. Panggil `GET /whatsapp/status`.
2. Jika `disconnected` atau `failed`, tampilkan tombol **Connect**.
3. Saat tombol ditekan, panggil `POST /whatsapp/connect`.
4. Dengarkan `wa:qr`.
5. Render QR dari string menggunakan library QR frontend.
6. Dengarkan `wa:status`.
7. Jika state `ready`, tampilkan nomor dan tombol **Logout/Restart**.
8. Jika state `failed`, tampilkan `error` dan tombol restart.

### B. Halaman shared inbox

1. Panggil `GET /conversations?scope=all&status=assigned`.
2. Panggil `GET /conversations/stats/queue`.
3. Dengarkan `conversation:new`, `conversation:updated`,
   `conversation:assigned`, dan `conversation:unassigned`.
4. Update item list berdasarkan `conversationId`, jangan menggandakan item.
5. Untuk chat baru, tambahkan item ke list dan tampilkan unread badge.

### C. Panel detail chat

1. Panggil `GET /conversations/:id`.
2. Panggil `GET /conversations/:id/messages`.
3. Join room `conversation:{id}` melalui event `conversation:join`.
4. Dengarkan `message:new`.
5. Saat panel ditutup, kirim `conversation:leave`.
6. Saat panel dibuka atau user membaca pesan, panggil endpoint `/read`.

### D. Aksi admin

| Tombol UI | Endpoint |
|---|---|
| Claim | `POST /conversations/:id/claim` |
| Transfer | `POST /conversations/:id/transfer` |
| Takeover | `POST /conversations/:id/takeover` |
| Release | `POST /conversations/:id/release` |
| Resolve | `POST /conversations/:id/resolve` |
| Reopen | `POST /conversations/:id/reopen` |
| Mark read | `POST /conversations/:id/read` |
| Balas | `POST /conversations/:id/messages` |

Setelah setiap aksi, gunakan response REST sebagai state utama. Event Socket.IO
dipakai untuk memperbarui browser lain.

## 9. State UI yang wajib

Global:

```text
socket: connecting | connected | disconnected | error
whatsapp: disconnected | authenticating | qr | ready | failed
inboxLoading: boolean
queueStatsLoading: boolean
```

Per conversation:

```text
loading
unassigned
assigned
resolved
actionPending
canReply
```

Per message sementara:

```text
pending
sent
failed
```

Jika REST balasan gagal, hapus atau tandai optimistic message sebagai failed
dan tampilkan tombol retry pada UI. Endpoint retry belum termasuk kontrak ini;
frontend harus mengirim ulang dengan `POST /conversations/:id/messages`.

## 10. Di luar scope development ini

Endpoint berikut belum boleh dipakai frontend sebagai fitur yang selesai:

```text
POST /conversations/:id/messages/media
POST /messages/:id/retry
GET  /media/:id
CRUD /customers
CRUD /quick-replies
CRUD /notes
CRUD /tags
CRUD /transactions
CRUD /follow-ups
GET  /reports/*
GET  /activity-logs
```

Fitur tersebut dibuat setelah kontrol shared chat dan koneksi WhatsApp stabil.
