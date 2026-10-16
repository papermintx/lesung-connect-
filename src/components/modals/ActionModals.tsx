import { useState } from "react"
import {
  ArrowRightLeft,
  ShieldAlert,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DUMMY_USERS } from "@/data/mockData"
import type { Conversation, User } from "@/types/inbox"

type TransferModalProps = {
  conversation: Conversation
  currentUser?: User
  onClose: () => void
  onConfirm: (targetUserId: string | null, note: string) => void
}

export function TransferModal({
  conversation,
  onClose,
  onConfirm,
}: TransferModalProps) {
  const [targetUserId, setTargetUserId] = useState<string>("")
  const [note, setNote] = useState("")

  // Available sales for transfer (filter out current assignee)
  const availableUsers = Object.values(DUMMY_USERS).filter(
    (u) => u.name !== conversation.assignee,
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm(targetUserId === "queue" ? null : targetUserId, note)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <ArrowRightLeft className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Transfer Percakapan</h3>
              <p className="text-xs text-muted-foreground">
                Pindahkan chat {conversation.customer.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground">
              Pindahkan Ke
            </label>
            <select
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              required
              className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="" disabled>
                -- Pilih Sales / Antrean --
              </option>
              <option value="queue">📥 Kembalikan ke Antrean (Unassigned)</option>
              <optgroup label="Daftar Sales & Tim">
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role.toUpperCase()} - {user.title})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">
              Catatan Pengalihan (Opsional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Butuh penanganan khusus terkait proposal teknis..."
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={!targetUserId}>
              Konfirmasi Transfer
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

type TakeoverModalProps = {
  conversation: Conversation
  currentUser: User
  onClose: () => void
  onConfirm: (reason: string) => void
}

export function TakeoverModal({
  conversation,
  currentUser,
  onClose,
  onConfirm,
}: TakeoverModalProps) {
  const [reason, setReason] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm(reason)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border bg-background p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Takeover Percakapan</h3>
              <p className="text-xs text-muted-foreground">
                Ambil alih dari {conversation.assignee ?? "sales"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-3 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
          Sebagai <strong>{currentUser.role.toUpperCase()}</strong>, Anda akan
          mengambil alih kepemilikan chat ini langsung ke akun Anda.
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground">
              Alasan Takeover
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Customer meminta berbicara dengan supervisor / eskalasi..."
              rows={3}
              required
              className="mt-1.5 w-full rounded-lg border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={!reason.trim()}>
              Ambil Alih Sekarang
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
