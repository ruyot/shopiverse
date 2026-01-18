const API_BASE = 'http://localhost:5000/api'
const SHARP_API_URL = import.meta.env.VITE_SHARP_API_URL || ''

function resolveSharpEndpoint() {
    if (!SHARP_API_URL) {
        throw new Error('Sharp API URL not configured. Add VITE_SHARP_API_URL to your .env file.')
    }
    const trimmed = SHARP_API_URL.replace(/\/+$/, '')
    try {
        const parsed = new URL(trimmed)
        if (parsed.pathname && parsed.pathname !== '/' && parsed.pathname.endsWith('/generate')) {
            return trimmed
        }
        if (parsed.hostname.endsWith('.modal.run') && parsed.pathname === '/') {
            return trimmed
        }
    } catch (error) {
        if (trimmed.endsWith('/generate')) return trimmed
    }
    return `${trimmed}/generate`
}

function base64ToBytes(base64) {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i)
    }
    return bytes
}

export async function generatePlyFromImageBase64(imageBase64) {
    if (!imageBase64) {
        throw new Error('Missing image base64 payload for Sharp API.')
    }

    const endpoint = resolveSharpEndpoint()
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64 })
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Sharp API failed: ${response.status} - ${errorText}`)
    }

    const payload = await response.json()
    if (!payload?.success || !payload?.ply_base64) {
        throw new Error(payload?.error || 'Sharp API returned an invalid response.')
    }

    return payload.ply_base64
}

export async function uploadPlyToServer(plyBase64, filename) {
    if (!plyBase64) {
        throw new Error('Missing PLY payload to upload.')
    }

    const resolvedName = filename?.endsWith('.ply') ? filename : `${filename || 'scene'}.ply`
    const bytes = base64ToBytes(plyBase64)
    const blob = new Blob([bytes], { type: 'application/octet-stream' })
    const file = new File([blob], resolvedName, { type: 'application/octet-stream' })
    const formData = new FormData()
    formData.append('file', file, resolvedName)

    const response = await fetch(`${API_BASE}/upload-ply`, {
        method: 'POST',
        body: formData
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`PLY upload failed: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    return result.path
}
