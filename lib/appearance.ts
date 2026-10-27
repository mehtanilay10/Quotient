import { APPEARANCE_COOKIE_KEY, PREFERENCES_STORAGE_KEY } from "@/lib/storageKeys";

/**
 * The appearance-only subset of `UserPreferences`. This is mirrored into a
 * cookie so the root layout can apply it *before* first paint, instead of
 * waiting for the database fetch and visibly re-flowing (zooming) the page.
 */
export type AppearancePreferences = {
  fontSize: string | null;
  codeFontSize: string | null;
  density: string | null;
  reducedMotion: boolean;
};

type AppearanceSource = Partial<{
  fontSize: unknown;
  codeFontSize: unknown;
  density: unknown;
  reducedMotion: unknown;
}>;

const FONT_SIZES = ["sm", "md", "lg", "xl"] as const;
const CODE_FONT_SIZES = ["sm", "md", "lg"] as const;
const DENSITIES = ["comfortable", "compact"] as const;

export const APPEARANCE_CLASSES = [
  "font-size-sm",
  "font-size-md",
  "font-size-lg",
  "font-size-xl",
  "font-size-code-sm",
  "font-size-code-md",
  "font-size-code-lg",
  "density-comfortable",
  "density-compact",
  "reduced-motion",
] as const;

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  fontSize: null,
  codeFontSize: null,
  density: null,
  reducedMotion: false,
};

function pick(value: unknown, allowed: readonly string[]): string | null {
  return typeof value === "string" && allowed.includes(value) ? value : null;
}

/**
 * Coerces arbitrary data (cookie / localStorage / database) into values we
 * know how to turn into class names. Unknown values fall back to defaults.
 */
export function toAppearance(source: AppearanceSource | null | undefined): AppearancePreferences {
  return {
    fontSize: pick(source?.fontSize, FONT_SIZES),
    codeFontSize: pick(source?.codeFontSize, CODE_FONT_SIZES),
    density: pick(source?.density, DENSITIES),
    reducedMotion: source?.reducedMotion === true,
  };
}

export function getAppearanceClasses(source: AppearanceSource): string[] {
  const prefs = toAppearance(source);
  const classes = [`font-size-${prefs.fontSize ?? "md"}`];
  if (prefs.codeFontSize) {
    classes.push(`font-size-code-${prefs.codeFontSize}`);
  }
  if (prefs.density) {
    classes.push(`density-${prefs.density}`);
  }
  if (prefs.reducedMotion) {
    classes.push("reduced-motion");
  }
  return classes;
}

export function applyAppearanceClasses(classes: readonly string[]): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  APPEARANCE_CLASSES.forEach((cls) => root.classList.remove(cls));
  classes.forEach((cls) => root.classList.add(cls));
}

function readCookieRaw(): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator) === APPEARANCE_COOKIE_KEY) {
      return part.slice(separator + 1);
    }
  }
  return null;
}

export function readAppearanceCookie(): AppearancePreferences | null {
  const raw = readCookieRaw();
  if (!raw) return null;
  try {
    return toAppearance(JSON.parse(decodeURIComponent(raw)) as AppearanceSource);
  } catch {
    return null;
  }
}

export function readAppearanceFromStorage(): AppearancePreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return null;
    return toAppearance(JSON.parse(raw) as AppearanceSource);
  } catch {
    return null;
  }
}

/**
 * Best guess at the user's appearance before their preferences finish loading:
 * the cookie mirror first (authoritative while signed in), then the logged-out
 * localStorage copy.
 */
export function getBootstrappedAppearance(): AppearancePreferences | null {
  return readAppearanceCookie() ?? readAppearanceFromStorage();
}

export function writeAppearanceCookie(source: AppearanceSource): void {
  if (typeof document === "undefined") return;
  try {
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    const value = encodeURIComponent(JSON.stringify(toAppearance(source)));
    document.cookie = `${APPEARANCE_COOKIE_KEY}=${value}; path=/; max-age=31536000; samesite=lax${secure}`;
  } catch {
    // Cookies can be unavailable (privacy modes, sandboxed iframes); the
    // provider still applies preferences for the current page.
  }
}

/**
 * Blocking script injected into `<head>`. It applies the cookie mirror (or the
 * logged-out localStorage copy) before the first paint so a saved larger font
 * size never briefly renders at the default size.
 */
export function getAppearanceBootstrapScript(): string {
  return `(function(){try{
var key=${JSON.stringify(APPEARANCE_COOKIE_KEY)},store=${JSON.stringify(PREFERENCES_STORAGE_KEY)};
var raw=null,cookie=document.cookie.split("; ");
for(var i=0;i<cookie.length;i++){var part=cookie[i],at=part.indexOf("=");
if(at>-1&&part.slice(0,at)===key){raw=decodeURIComponent(part.slice(at+1));break;}}
if(!raw){raw=window.localStorage.getItem(store);}
if(!raw){return;}
var p=JSON.parse(raw)||{},font=["sm","md","lg","xl"],code=["sm","md","lg"],density=["comfortable","compact"];
var classes=["font-size-"+(font.indexOf(p.fontSize)>-1?p.fontSize:"md")];
if(code.indexOf(p.codeFontSize)>-1){classes.push("font-size-code-"+p.codeFontSize);}
if(density.indexOf(p.density)>-1){classes.push("density-"+p.density);}
if(p.reducedMotion===true){classes.push("reduced-motion");}
var root=document.documentElement,all=${JSON.stringify(APPEARANCE_CLASSES)};
for(var r=0;r<all.length;r++){root.classList.remove(all[r]);}
for(var c=0;c<classes.length;c++){root.classList.add(classes[c]);}
}catch(e){}})();`;
}
