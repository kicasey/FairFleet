'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';
import {
  Plane,
  Search,
  Map,
  Bookmark,
  Menu,
  X,
  Lightbulb,
} from 'lucide-react';
import SearchBox from './SearchBox';

interface SearchSummary {
  from: string;
  to: string;
  date: string;
  passengers: string;
  cabin: string;
  bags: string;
}

interface NavbarProps {
  searchSummary?: SearchSummary;
}

const navLinks = [
  { href: '/search', label: 'Search', icon: Search },
  { href: '/explore', label: 'Explore', icon: Map },
  { href: '/tips', label: 'Travel Tips', icon: Lightbulb },
  { href: '/profile', label: 'Saved', icon: Bookmark },
];

export default function Navbar({ searchSummary }: Readonly<NavbarProps>) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isSignedIn } = useAuth();

  return (
    <nav className="sticky top-0 z-50 bg-paper border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Plane className="h-6 w-6 text-brand-teal" strokeWidth={2.5} />
            <span className="gradient-logo font-display font-black text-[26px] leading-none tracking-[-0.04em]">
              FairFleet
            </span>
          </Link>

          {/* Compact search bar (results page) */}
          {searchSummary && (
            <div className="hidden lg:block ml-6 flex-1 max-w-xl">
              <SearchBox
                compact
                initialFrom={searchSummary.from || undefined}
                initialTo={searchSummary.to || undefined}
                initialDate={searchSummary.date || undefined}
              />
            </div>
          )}

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 ml-auto mr-4">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (pathname === '/' && href === '/search');
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm transition-colors font-body ${
                    active
                      ? 'text-brand-purple font-semibold bg-brand-light-purple'
                      : 'text-muted hover:text-ink hover:bg-off'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Auth buttons (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="rounded-full bg-brand-blue px-5 py-1.5 text-sm font-display font-bold tracking-[0.04em] text-white hover:bg-brand-dark-blue transition-colors shadow-cta">
                  Log In
                </button>
              </SignInButton>
            ) : (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'w-9 h-9',
                  },
                }}
              />
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden rounded-lg p-2 text-muted hover:bg-off transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-paper px-4 pb-4 pt-2">
          {searchSummary && (
            <div className="mb-3">
              <SearchBox
                compact
                initialFrom={searchSummary.from || undefined}
                initialTo={searchSummary.to || undefined}
                initialDate={searchSummary.date || undefined}
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-body transition-colors ${
                    active
                      ? 'text-brand-purple font-semibold bg-brand-light-purple'
                      : 'text-muted hover:text-ink hover:bg-off'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="flex items-center justify-center rounded-full bg-brand-blue px-5 py-2 text-sm font-display font-bold text-white hover:bg-brand-dark-blue transition-colors shadow-cta">
                  Log In
                </button>
              </SignInButton>
            ) : (
              <div className="flex items-center justify-center">
                <UserButton />
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
