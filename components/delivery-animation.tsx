"use client"

import { useEffect, useRef } from "react"

export default function DeliveryAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Animation variables
    let animationFrameId: number
    let progress = 0
    const speed = 0.003

    // Create map image
    const mapImage = new Image()
    mapImage.crossOrigin = "anonymous"
    mapImage.src = "/placeholder.svg?height=400&width=600"

    // Create truck image
    const truckImage = new Image()
    truckImage.crossOrigin = "anonymous"
    truckImage.src = "/placeholder.svg?height=50&width=50"

    // Draw the animation
    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw map background
      ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height)

      // Draw route path
      ctx.beginPath()
      ctx.strokeStyle = "#2B015F"
      ctx.lineWidth = 4
      ctx.setLineDash([5, 5])
      ctx.moveTo(canvas.width * 0.2, canvas.height * 0.7)
      ctx.bezierCurveTo(
        canvas.width * 0.4,
        canvas.height * 0.3,
        canvas.width * 0.6,
        canvas.height * 0.8,
        canvas.width * 0.8,
        canvas.height * 0.3,
      )
      ctx.stroke()

      // Calculate current position on the path
      const t = progress % 1
      const x = bezierPoint(canvas.width * 0.2, canvas.width * 0.4, canvas.width * 0.6, canvas.width * 0.8, t)
      const y = bezierPoint(canvas.height * 0.7, canvas.height * 0.3, canvas.height * 0.8, canvas.height * 0.3, t)

      // Draw start point (pickup)
      ctx.fillStyle = "#FBC140"
      ctx.beginPath()
      ctx.arc(canvas.width * 0.2, canvas.height * 0.7, 10, 0, Math.PI * 2)
      ctx.fill()

      // Draw package icon at start
      ctx.fillStyle = "#2B015F"
      ctx.font = "bold 20px Arial"
      ctx.fillText("📦", canvas.width * 0.2 - 10, canvas.height * 0.7 - 20)

      // Draw end point (delivery)
      ctx.fillStyle = "#FBC140"
      ctx.beginPath()
      ctx.arc(canvas.width * 0.8, canvas.height * 0.3, 10, 0, Math.PI * 2)
      ctx.fill()

      // Draw location icon at end
      ctx.fillStyle = "#2B015F"
      ctx.font = "bold 20px Arial"
      ctx.fillText("📍", canvas.width * 0.8 - 10, canvas.height * 0.3 - 20)

      // Draw truck at current position
      ctx.drawImage(truckImage, x - 15, y - 15, 30, 30)

      // Update progress
      progress += speed

      // Request next frame
      animationFrameId = requestAnimationFrame(draw)
    }

    // Helper function for bezier curve point calculation
    function bezierPoint(p0: number, p1: number, p2: number, p3: number, t: number) {
      const oneMinusT = 1 - t
      return (
        Math.pow(oneMinusT, 3) * p0 +
        3 * Math.pow(oneMinusT, 2) * t * p1 +
        3 * oneMinusT * Math.pow(t, 2) * p2 +
        Math.pow(t, 3) * p3
      )
    }

    // Start animation when images are loaded
    Promise.all([
      new Promise((resolve) => {
        mapImage.onload = resolve
      }),
      new Promise((resolve) => {
        truckImage.onload = resolve
      }),
    ]).then(() => {
      draw()
    })

    // Handle window resize
    const handleResize = () => {
      if (canvas) {
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight
      }
    }
    window.addEventListener("resize", handleResize)

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="w-full h-full rounded-lg" aria-label="Animation de livraison en temps réel" />
  )
}
