import { Atom } from "effect/reactivity";

export type Theme = "system" | "light" | "dark";

const read = (): Theme => {
  try {
    const saved = localStorage.getItem("theme");
    return saved === "light" || saved === "dark" ? saved : "system";
  } catch {
    return "system";
  }
};

const apply = (theme: Theme) => {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
  try {
    if (theme === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", theme);
  } catch {
    // Storage can be unavailable (private mode); the theme still applies.
  }
};

/**
 * The user's colour scheme choice. `index.html` applies the saved value before
 * first paint; writing this atom updates `<html data-theme>` and storage.
 */
export const themeAtom = Atom.writable(
  () => read(),
  (ctx, theme: Theme) => {
    apply(theme);
    ctx.setSelf(theme);
  },
).pipe(Atom.keepAlive);
