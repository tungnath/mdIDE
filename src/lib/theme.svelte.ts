export type Theme = "light" | "dark";

function initialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

class ThemeStore {
  current = $state<Theme>(initialTheme());

  toggle() {
    this.current = this.current === "dark" ? "light" : "dark";
  }
}

export const theme = new ThemeStore();

export function applyTheme(value: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", value);
  localStorage.setItem("theme", value);
}
