"use client"

import { useEffect, useRef } from "react"

export function DynamicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Floating orbs - increased visibility
    const orbs = [
      { x: 0.15, y: 0.25, radius: 400, speedX: 0.0004, speedY: 0.0003, color: 'rgba(249, 115, 22,' }, // Orange
      { x: 0.75, y: 0.15, radius: 350, speedX: -0.0003, speedY: 0.0004, color: 'rgba(236, 72, 153,' }, // Pink
      { x: 0.45, y: 0.65, radius: 450, speedX: 0.00035, speedY: -0.00025, color: 'rgba(6, 182, 212,' }, // Cyan
      { x: 0.85, y: 0.75, radius: 300, speedX: -0.0004, speedY: -0.0003, color: 'rgba(139, 92, 246,' }, // Purple
    ]

    // Floating particles
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
    }))

    const animate = () => {
      time += 0.01

      // Clear with dark background
      ctx.fillStyle = 'rgb(2, 6, 23)' // slate-950
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw gradient mesh
      const gradient = ctx.createRadialGradient(
        canvas.width * 0.5 + Math.sin(time * 0.5) * 200,
        canvas.height * 0.5 + Math.cos(time * 0.3) * 100,
        0,
        canvas.width * 0.5,
        canvas.height * 0.5,
        canvas.width * 0.8
      )
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.3)')
      gradient.addColorStop(0.5, 'rgba(15, 23, 42, 0.1)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw animated orbs
      orbs.forEach((orb, i) => {
        orb.x += orb.speedX
        orb.y += orb.speedY

        // Bounce off edges
        if (orb.x < 0 || orb.x > 1) orb.speedX *= -1
        if (orb.y < 0 || orb.y > 1) orb.speedY *= -1

        const pulse = Math.sin(time * 2 + i) * 0.3 + 0.7
        const x = orb.x * canvas.width
        const y = orb.y * canvas.height
        const radius = orb.radius * pulse

        // Draw glow - much more visible
        const orbGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        orbGradient.addColorStop(0, orb.color + '0.25)')
        orbGradient.addColorStop(0.4, orb.color + '0.12)')
        orbGradient.addColorStop(0.7, orb.color + '0.05)')
        orbGradient.addColorStop(1, orb.color + '0)')

        ctx.fillStyle = orbGradient
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw grid lines
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.03)'
      ctx.lineWidth = 1
      const gridSize = 60

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Draw particles
      particles.forEach((p) => {
        p.x += p.speedX
        p.y += p.speedY

        // Wrap around
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        // Twinkle
        const twinkle = Math.sin(time * 3 + p.x * 0.01) * 0.3 + 0.7

        ctx.fillStyle = `rgba(249, 115, 22, ${p.opacity * twinkle})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      suppressHydrationWarning
    />
  )
}
