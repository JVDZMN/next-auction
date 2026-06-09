'use client'
import { useEffect } from 'react'

export function useReveal(selector = '.reveal, .reveal-left, .reveal-right, .reveal-scale') {
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    )
    document.querySelectorAll(selector).forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}
