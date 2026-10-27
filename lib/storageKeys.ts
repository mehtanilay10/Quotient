/**
 * Canonical `localStorage` / `sessionStorage` key names.
 *
 * Prefixed `quotient_*` so storage keys are namespaced to this app.
 */

export const PROGRESS_STORAGE_KEY = 'quotient_progress';
export const BOOKMARKS_STORAGE_KEY = 'quotient_bookmarks';
export const THEME_STORAGE_KEY = 'quotient_theme';
export const PREFERENCES_STORAGE_KEY = 'quotient_preferences';
/**
 * Cookie mirror of the appearance preferences. It is read by a blocking script
 * in the root layout so the correct font size is applied before the first paint
 * instead of after the database preferences load.
 */
export const APPEARANCE_COOKIE_KEY = 'quotient_appearance';
export const LAST_PATH_STORAGE_KEY = 'quotient_last_path';
export const PROMPT_SHOWN_STORAGE_KEY = 'quotient_prompt_shown';
