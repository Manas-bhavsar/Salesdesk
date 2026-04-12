export type AppTheme = "light" | "dark"

export const THEME_STORAGE_KEY = "sd_theme"

export function getStoredTheme(): AppTheme | null {
  if (typeof window === "undefined") return null

  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === "light" || stored === "dark" ? stored : null
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") return

  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(theme)
  root.style.colorScheme = theme
}

export function setStoredTheme(theme: AppTheme) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}
