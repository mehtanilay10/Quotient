"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Search,
  LogOut,
  User,
  Settings2,
  Keyboard,
  Bookmark,
  StickyNote,
  BarChart3,
  AlertTriangle,
  CloudOff,
  ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { PWAInstallButton } from "@/components/ui/PWAInstallButton";
import { SearchSuggestions } from "@/components/ui/SearchSuggestions";
import { SearchErrorBoundary } from "@/components/ui/SearchErrorBoundary";
import { cn } from "@/lib/utils";
import {
  openKeyboardShortcutsHelp,
  registerShortcut,
  unregisterShortcut,
} from "@/hooks/useKeyboardShortcuts";
import { useSession, signOut } from "next-auth/react";

export interface NavbarSection {
  label: string;
  href: string;
  count: number;
}

export interface NavbarCategory {
  key: string;
  label: string;
  icon: string;
  sections: NavbarSection[];
}

interface NavbarProps {
  /** Categories (with their Courses / Problems / Cheat Sheets sections), computed server-side from content. */
  categories: NavbarCategory[];
}

export function Navbar({ categories }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  const handleSearch = (q: string) => {
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setMobileOpen(false);
    setSearchMode(false);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    // Lock body scroll while the mobile menu is open so background content
    // doesn't scroll behind the menu, and give the menu its own scroll area.
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!searchMode) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchMode(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [searchMode]);

  useEffect(() => {
    registerShortcut("/", "Focus search", () => {
      if (!searchMode) setSearchMode(true);
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
    // Unregister on unmount / re-register so a stale handler (which could call
    // setState on an unmounted component) is never left in the global registry.
    return () => unregisterShortcut("/");
  }, [searchMode]);

  // Focus the search input whenever search mode turns on, so opening search via
  // the navbar button lands the caret in the field ready to type.
  useEffect(() => {
    if (!searchMode) return;
    // The input is rendered in the same commit; wait a frame so the ref is set.
    const id = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [searchMode]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!openCategory) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target as Node)) {
        setOpenCategory(null);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenCategory(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openCategory]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  const isCategoryActive = (key: string) => pathname.startsWith(`/${key}/`);

  const userProfile = (
    <>
      {isLoggedIn && session?.user ? (
        <div className="relative" ref={userMenuRef}>
          <button
            ref={userButtonRef}
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-md p-1.5 text-fg-muted transition-colors hover:bg-canvas-subtle hover:text-fg-default"
            aria-label="User menu"
            aria-expanded={userMenuOpen}
          >
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <User className="h-5 w-5" aria-hidden="true" />
            )}
            <span className="hidden text-sm font-medium sm:block">{session.user.name}</span>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-canvas-overlay shadow-lg py-1">
              <div className="border-b border-border px-4 py-2">
                <p className="truncate text-sm font-medium text-fg-default">{session.user.name}</p>
                <p className="truncate text-xs text-fg-muted">{session.user.email}</p>
              </div>
              <Link
                href="/user/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-fg-default hover:bg-canvas-subtle"
                onClick={() => setUserMenuOpen(false)}
              >
                <User className="h-4 w-4" aria-hidden="true" />
                Profile
              </Link>
              <Link
                href="/user/personalization"
                className="flex items-center gap-2 px-4 py-2 text-sm text-fg-default hover:bg-canvas-subtle"
                onClick={() => setUserMenuOpen(false)}
              >
                <Settings2 className="h-4 w-4" aria-hidden="true" />
                Personalization
              </Link>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  userButtonRef.current?.focus();
                  openKeyboardShortcutsHelp();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-fg-default hover:bg-canvas-subtle"
                aria-haspopup="dialog"
              >
                <Keyboard className="h-4 w-4" aria-hidden="true" />
                Keyboard shortcuts
              </button>
              <div className="my-1 border-t border-border" />
              <Link
                href="/user/progress"
                className="flex items-center gap-2 px-4 py-2 text-sm text-fg-default hover:bg-canvas-subtle"
                onClick={() => setUserMenuOpen(false)}
              >
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                Progress Dashboard
              </Link>
              <Link
                href="/user/bookmarks"
                className="flex items-center gap-2 px-4 py-2 text-sm text-fg-default hover:bg-canvas-subtle"
                onClick={() => setUserMenuOpen(false)}
              >
                <Bookmark className="h-4 w-4" aria-hidden="true" />
                Bookmarks
              </Link>
              <Link
                href="/user/notes"
                className="flex items-center gap-2 px-4 py-2 text-sm text-fg-default hover:bg-canvas-subtle"
                onClick={() => setUserMenuOpen(false)}
              >
                <StickyNote className="h-4 w-4" aria-hidden="true" />
                Notes
              </Link>
              <Link
                href="/user/offline"
                className="flex items-center gap-2 px-4 py-2 text-sm text-fg-default hover:bg-canvas-subtle"
                onClick={() => setUserMenuOpen(false)}
              >
                <CloudOff className="h-4 w-4" aria-hidden="true" />
                Saved offline
              </Link>
              <div className="my-1 border-t border-border" />
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  handleSignOut();
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-fg-muted hover:bg-canvas-subtle hover:text-fg-default"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link
          href="/login"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:bg-canvas-subtle hover:text-fg-default"
        >
          Sign in
        </Link>
      )}
    </>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-200",
        scrolled
          ? "border-b border-border bg-canvas/75 backdrop-blur-xl shadow-md"
          : "border-b border-border bg-canvas/95 shadow-sm"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-fg-default hover:text-accent-fg transition-colors"
        >
          <Logo className="w-8 h-8" />
          <span className="text-base">Quotient</span>
        </Link>

        {searchMode ? (
          <div className="hidden flex-1 items-center justify-center xl:flex">
            <div className="relative w-full max-w-2xl transition-all duration-300 ease-in-out">
              <SearchErrorBoundary>
                <SearchSuggestions
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={setSearchQuery}
                  onSearch={handleSearch}
                  placeholder="Search lessons, modules, topics..."
                  size="md"
                />
              </SearchErrorBoundary>
            </div>
            <button
              type="button"
              onClick={() => setSearchMode(false)}
              className="ml-3 flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-canvas-subtle hover:text-fg-default"
              aria-label="Close search"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
          </div>
        ) : (
          <nav
            className="hidden items-center gap-0.5 xl:flex"
            aria-label="Main navigation"
            ref={categoryMenuRef}
          >
            {/* Category dropdowns */}
            {categories.map((cat) => {
              const isOpen = openCategory === cat.key;
              const isActive = isCategoryActive(cat.key);
              return (
                <div key={cat.key} className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenCategory(isOpen ? null : cat.key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                      isActive || isOpen
                        ? "bg-accent-subtle text-accent-fg"
                        : "text-fg-muted hover:bg-canvas-subtle hover:text-fg-default"
                    )}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                  >
                    <span aria-hidden="true">{cat.icon}</span>
                    <span className="whitespace-nowrap">{cat.label}</span>
                    <ChevronDown
                      className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <div className="absolute left-0 top-full mt-2 w-60 rounded-lg border border-border bg-canvas-overlay shadow-lg py-1 z-50">
                      {cat.sections.map((section) => (
                        <Link
                          key={section.href}
                          href={section.href}
                          className={cn(
                            "flex items-center justify-between px-4 py-2 text-sm transition-colors",
                            pathname.startsWith(section.href)
                              ? "bg-accent-subtle text-accent-fg"
                              : "text-fg-default hover:bg-canvas-subtle hover:text-fg-default"
                          )}
                          onClick={() => setOpenCategory(null)}
                        >
                          <span className="font-medium">{section.label}</span>
                          <span className="text-xs text-fg-subtle">{section.count}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={() => setSearchMode(true)}
              className="ml-2 flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:bg-canvas-subtle hover:text-fg-default"
              aria-label="Open search"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <span className="hidden lg:inline">Search</span>
            </button>
          </nav>
        )}

        <div className="flex items-center gap-1">
          {userProfile}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="rounded-md p-2 text-fg-muted transition-colors hover:bg-canvas-subtle hover:text-fg-default xl:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav"
          className="xl:hidden animate-slide-up border-t border-border bg-canvas-subtle max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain"
        >
          <nav className="flex flex-col gap-1 px-4 py-3" aria-label="Mobile navigation">
            <PWAInstallButton className="mb-2" />
            <SearchErrorBoundary>
              <SearchSuggestions
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                placeholder="Search lessons, modules, topics..."
                className="mb-2"
                size="sm"
              />
            </SearchErrorBoundary>
            {/* Mobile category accordion */}
            <div className="space-y-2">
              {categories.map((cat) => {
                const isExpanded = mobileCategoryOpen === cat.key;
                return (
                  <div
                    key={cat.key}
                    className="border border-border rounded-lg overflow-hidden bg-canvas"
                  >
                    <button
                      type="button"
                      onClick={() => setMobileCategoryOpen(isExpanded ? null : cat.key)}
                      className={cn(
                        "flex w-full items-center gap-2 px-3 py-2 font-semibold transition-colors",
                        isCategoryActive(cat.key)
                          ? "text-accent-fg"
                          : "text-fg-default hover:bg-canvas-subtle"
                      )}
                      aria-expanded={isExpanded}
                    >
                      <span className="text-lg" aria-hidden="true">
                        {cat.icon}
                      </span>
                      <span>{cat.label}</span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 ml-auto text-fg-muted transition-transform",
                          isExpanded && "rotate-180"
                        )}
                        aria-hidden="true"
                      />
                    </button>
                    {isExpanded && (
                      <ul className="border-t border-border">
                        {cat.sections.map((section) => (
                          <li key={section.href}>
                            <Link
                              href={section.href}
                              className="flex items-center justify-between px-6 py-2 text-sm text-fg-muted hover:bg-canvas-subtle hover:text-fg-default"
                              onClick={() => setMobileOpen(false)}
                            >
                              <span>{section.label}</span>
                              <span className="text-xs text-fg-subtle">{section.count}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
