export type Theme = "light" | "dark";
export type DesignSet = "harbor" | "sage";

function initialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function initialDesignSet(): DesignSet {
  if (typeof window === "undefined") return "harbor";
  const stored = localStorage.getItem("designSet");
  return stored === "sage" ? "sage" : "harbor";
}

class ThemeStore {
  current = $state<Theme>(initialTheme());
  designSet = $state<DesignSet>(initialDesignSet());

  toggle() {
    this.current = this.current === "dark" ? "light" : "dark";
  }

  toggleDesignSet() {
    this.designSet = this.designSet === "harbor" ? "sage" : "harbor";
  }
}

export const theme = new ThemeStore();

export function applyTheme(value: Theme, designSet: DesignSet) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = value;
  document.documentElement.dataset.set = designSet;
  localStorage.setItem("theme", value);
  localStorage.setItem("designSet", designSet);
}
