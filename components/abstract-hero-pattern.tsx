"use client"

import { useEffect, useRef } from "react"

export default function AbstractHeroPattern() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Colors
    const primaryColor = "#2B015F" // Mauve
    const secondaryColor = "#FBC140" // Jaune

    // Draw pattern
    const drawPattern = () => {
      // Background
      ctx.fillStyle = primaryColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw geometric shapes
      const size = Math.min(canvas.width, canvas.height) / 10

      // Draw circles
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * canvas.width
        const y = Math.random() * canvas.height
        const radius = Math.random() * size + 10

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = i % 2 === 0 ? secondaryColor : "#FFFFFF"
        ctx.globalAlpha = Math.random() * 0.2 + 0.1
        ctx.fill()
      }

      // Draw lines
      ctx.globalAlpha = 0.2
      for (let i = 0; i < 15; i++) {
        const x1 = Math.random() * canvas.width
        const y1 = Math.random() * canvas.height
        const x2 = Math.random() * canvas.width
        const y2 = Math.random() * canvas.height

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.strokeStyle = i % 2 === 0 ? secondaryColor : "#FFFFFF"
        ctx.lineWidth = Math.random() * 3 + 1
        ctx.stroke()
      }
    }

    // Draw initial pattern
    drawPattern()

    // Handle window resize
    const handleResize = () => {
      if (canvas) {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
        drawPattern()
      }
    }

    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" />
}
