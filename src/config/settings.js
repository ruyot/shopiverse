/**
 * Settings Manager
 * Handles app-wide settings stored in localStorage
 */

const SETTINGS_KEY = 'shopiverse_settings'

const defaultSettings = {
    showHotspots: true,
    showNavigation: true,
    enableAntialiasing: true,
    progressiveLoading: true,
    disabledHotspots: {} // Track individual disabled hotspots by ID
}

export const getSettings = () => {
    try {
        const stored = localStorage.getItem(SETTINGS_KEY)
        return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings
    } catch (error) {
        console.error('Error loading settings:', error)
        return defaultSettings
    }
}

export const updateSettings = (newSettings) => {
    try {
        const current = getSettings()
        const updated = { ...current, ...newSettings }
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('settingsChanged', { detail: updated }))
        
        return updated
    } catch (error) {
        console.error('Error saving settings:', error)
        return getSettings()
    }
}

export const getSetting = (key) => {
    const settings = getSettings()
    return settings[key]
}

export const toggleSetting = (key) => {
    const current = getSetting(key)
    return updateSettings({ [key]: !current })
}
