"use client"

import { useEffect, useRef } from "react"

export default function AbstractHeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Colors
    const primaryColor = "#2B015F" // Mauve
    const secondaryColor = "#FBC140" // Jaune
    const accentColor = "#FFFFFF" // Blanc

    // Animation variables
    let animationFrameId: number
    let time = 0
    const speed = 0.0002 // Réduire la vitesse (était 0.0005)

    // Draw shapes
    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Fill background with primary color
      ctx.fillStyle = primaryColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw abstract shapes
      drawWaves(ctx, canvas.width, canvas.height, time, secondaryColor, 0.4)
      drawCircles(ctx, canvas.width, canvas.height, time, secondaryColor, accentColor)
      drawLines(ctx, canvas.width, canvas.height, time, secondaryColor, accentColor)

      // Ajouter les éléments de livraison
      drawDeliveryElements(ctx, canvas.width, canvas.height, time, secondaryColor)

      // Update time
      time += speed

      // Request next frame
      animationFrameId = requestAnimationFrame(draw)
    }

    // Start animation
    draw()

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
}

// Draw wavy patterns
function drawWaves(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  color: string,
  opacity: number,
) {
  const amplitude = height * 0.08 // Réduire légèrement l'amplitude
  const frequency = 0.005 // Réduire la fréquence pour des vagues plus larges
  const waveCount = 3

  ctx.globalAlpha = opacity
  ctx.fillStyle = color

  for (let w = 0; w < waveCount; w++) {
    ctx.beginPath()

    const waveOffset = w * (height / waveCount)
    const waveSpeed = time * (0.5 + w * 0.1) // Ralentir la vitesse des vagues

    ctx.moveTo(0, height)

    for (let x = 0; x < width; x += 5) {
      // Points plus rapprochés pour des courbes plus lisses
      const y = height - waveOffset - Math.sin(x * frequency + waveSpeed) * amplitude - (w * height) / waveCount
      ctx.lineTo(x, y)
    }

    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fill()
  }

  ctx.globalAlpha = 1
}

// Draw floating circles
function drawCircles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  color1: string,
  color2: string,
) {
  const circleCount = 12 // Réduire le nombre de cercles

  for (let i = 0; i < circleCount; i++) {
    const size = Math.random() * 60 + 30 // Cercles légèrement plus grands

    // Mouvement plus lent et plus prévisible
    const x = (Math.sin(time * (0.05 + i * 0.02) + i) * 0.5 + 0.5) * width
    const y = (Math.cos(time * (0.05 + i * 0.02) + i * 2) * 0.5 + 0.5) * height

    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fillStyle = i % 2 === 0 ? color1 : color2
    ctx.globalAlpha = 0.12 // Opacité plus faible
    ctx.fill()
  }

  ctx.globalAlpha = 1
}

// Draw diagonal lines
function drawLines(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  color1: string,
  color2: string,
) {
  const lineCount = 10
  const lineWidth = 2

  for (let i = 0; i < lineCount; i++) {
    const offset = (i / lineCount) * width + ((time * 100) % width)

    ctx.beginPath()
    ctx.moveTo(offset, 0)
    ctx.lineTo(offset - height, height)
    ctx.lineWidth = lineWidth
    ctx.strokeStyle = i % 2 === 0 ? color1 : color2
    ctx.globalAlpha = 0.2
    ctx.stroke()
  }

  ctx.globalAlpha = 1
}

// Ajoutez une nouvelle fonction pour dessiner des éléments qui suggèrent la livraison
function drawDeliveryElements(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  color: string,
) {
  // Dessiner quelques "routes" ou chemins
  ctx.globalAlpha = 0.15
  ctx.strokeStyle = color
  ctx.lineWidth = 3

  // Chemin principal qui traverse l'écran
  ctx.beginPath()
  const startX = width * 0.1
  const startY = height * 0.7
  const endX = width * 0.9
  const endY = height * 0.3

  // Point de contrôle pour la courbe de Bézier
  const cp1x = width * 0.4
  const cp1y = height * 0.2
  const cp2x = width * 0.6
  const cp2y = height * 0.8

  ctx.moveTo(startX, startY)
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY)
  ctx.stroke()

  // Dessiner un "véhicule" qui se déplace le long du chemin
  const t = (time * 0.05) % 1 // Paramètre qui varie de 0 à 1 lentement

  // Calculer la position sur la courbe de Bézier
  const vehicleX =
    Math.pow(1 - t, 3) * startX +
    3 * Math.pow(1 - t, 2) * t * cp1x +
    3 * (1 - t) * Math.pow(t, 2) * cp2x +
    Math.pow(t, 3) * endX

  const vehicleY =
    Math.pow(1 - t, 3) * startY +
    3 * Math.pow(1 - t, 2) * t * cp1y +
    3 * (1 - t) * Math.pow(t, 2) * cp2y +
    Math.pow(t, 3) * endY

  // Dessiner le "véhicule"
  ctx.globalAlpha = 0.8
  ctx.fillStyle = "#FFFFFF"
  ctx.beginPath()
  ctx.arc(vehicleX, vehicleY, 8, 0, Math.PI * 2)
  ctx.fill()

  // Dessiner un halo autour du véhicule
  const gradient = ctx.createRadialGradient(vehicleX, vehicleY, 0, vehicleX, vehicleY, 30)
  gradient.addColorStop(0, "rgba(251, 193, 64, 0.6)")
  gradient.addColorStop(1, "rgba(251, 193, 64, 0)")

  ctx.globalAlpha = 0.4
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(vehicleX, vehicleY, 30, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalAlpha = 1
}
