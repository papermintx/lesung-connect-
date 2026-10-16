import { useRef, useState } from "react"
import { GripVertical } from "lucide-react"

type ResizableDividerProps = {
  currentWidth: number
  onResize: (newWidth: number) => void
  minWidth?: number
  maxWidth?: number
  defaultWidth?: number
  className?: string
}

export function ResizableDivider({
  currentWidth,
  onResize,
  minWidth = 260,
  maxWidth = 520,
  defaultWidth = 340,
  className = "",
}: ResizableDividerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef(0)
  const startWidthRef = useRef(currentWidth)

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    setIsDragging(true)
    startXRef.current = e.clientX
    startWidthRef.current = currentWidth

    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    function handleMouseMove(moveEvent: MouseEvent) {
      const deltaX = moveEvent.clientX - startXRef.current
      const nextWidth = Math.min(
        maxWidth,
        Math.max(minWidth, startWidthRef.current + deltaX),
      )
      onResize(nextWidth)
    }

    function handleMouseUp() {
      setIsDragging(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
  }

  function handleTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 1) return
    setIsDragging(true)
    startXRef.current = e.touches[0].clientX
    startWidthRef.current = currentWidth

    function handleTouchMove(moveEvent: TouchEvent) {
      if (moveEvent.touches.length !== 1) return
      const deltaX = moveEvent.touches[0].clientX - startXRef.current
      const nextWidth = Math.min(
        maxWidth,
        Math.max(minWidth, startWidthRef.current + deltaX),
      )
      onResize(nextWidth)
    }

    function handleTouchEnd() {
      setIsDragging(false)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)
    }

    window.addEventListener("touchmove", handleTouchMove)
    window.addEventListener("touchend", handleTouchEnd)
  }

  function handleDoubleClick() {
    onResize(defaultWidth)
  }

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      title="Tarik untuk mengubah lebar daftar chat (Klik 2x untuk reset)"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onDoubleClick={handleDoubleClick}
      className={`group relative hidden md:flex w-2 shrink-0 cursor-col-resize items-center justify-center bg-transparent transition-colors hover:bg-primary/20 active:bg-primary/30 ${
        isDragging ? "bg-primary/30" : ""
      } ${className}`}
    >
      {/* Visual separator line */}
      <div
        className={`h-full w-px bg-border transition-colors group-hover:bg-primary/50 ${
          isDragging ? "bg-primary" : ""
        }`}
      />

      {/* Grip handle in the center */}
      <div
        className={`absolute flex h-7 w-3 items-center justify-center rounded-sm border border-border bg-background shadow-xs transition-transform group-hover:scale-110 group-hover:border-primary/50 ${
          isDragging ? "border-primary scale-110 shadow-sm" : ""
        }`}
      >
        <GripVertical className="size-2.5 text-muted-foreground group-hover:text-primary" />
      </div>
    </div>
  )
}
