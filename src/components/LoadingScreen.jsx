import { useState, useEffect } from 'react'
import './LoadingScreen.css'

export function LoadingScreen() {
    const [isLoading, setIsLoading] = useState(true)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        // Simulate loading progress
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setTimeout(() => setIsLoading(false), 300)
                    return 100
                }
                return prev + Math.random() * 15
            })
        }, 100)

        return () => clearInterval(interval)
    }, [])

    if (!isLoading) return null

    return (
        <div className={`loading-screen ${progress >= 100 ? 'fade-out' : ''}`}>
            <div className="loading-content">
                <div className="loading-logo">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                </div>
                <h1 className="loading-title">Shopiverse</h1>
                <p className="loading-subtitle">Loading virtual store experience...</p>

                <div className="loading-bar">
                    <div
                        className="loading-progress"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>

                <span className="loading-percent">{Math.round(Math.min(progress, 100))}%</span>
            </div>
        </div>
    )
}
