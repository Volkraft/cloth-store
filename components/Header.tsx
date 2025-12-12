"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag, User, Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCart } from "../context/cart-context";
import { useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { state } = useCart();
  const cartCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const isAdmin = session?.user?.role === "ADMIN";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative">
      
      {/* Main header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Menu + Navigation */}
            <div className="flex items-center gap-6">
              {/* Hamburger menu */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-gray-800 hover:text-black transition-colors"
                aria-label="Menu"
              >
                <Menu size={24} />
              </button>

              {/* Navigation links */}
              <nav className="hidden md:flex items-center gap-6 ">
                <Link
                  href="/"
                  className={`text-md font-medium transition-colors ${
                    pathname === "/" 
                      ? "text-black" 
                      : "text-gray-700 hover:text-black"
                  }`}
                >
                  Home
                </Link>
                <Link
                  href="/"
                  className="text-md font-medium text-gray-700 hover:text-black transition-colors"
                >
                  Collections
                </Link>
                <Link
                  href="/"
                  className="text-md font-medium text-gray-700 hover:text-black transition-colors"
                >
                  New
                </Link>
              </nav>
            </div>

            {/* Center: Logo */}
            <Link 
              href="/" 
              className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center"
            >
              <div className="w-10 h-10 rounded-sm flex items-center justify-center">
                <img src="/logo.svg" alt="Logo" width={50} height={50} />
              </div>
            </Link>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Wishlist */}
              <button
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                aria-label="Wishlist"
              >
                <Heart size={18} />
              </button>

              {/* Cart */}
              <Link
                href="/cart"
                className="flex items-center gap-2 rounded-full bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors"
              >
                <span>Cart</span>
                <ShoppingBag size={16} />
                {cartCount > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-800">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Profile */}
              {status === "loading" ? (
                <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
              ) : session ? (
                <Link
                  href={isAdmin ? "/admin" : "/profile"}
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                  title={session.user?.name || session.user?.email || "Профиль"}
                >
                  <User size={18} />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                  title="Войти"
                >
                  <User size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
          <nav className="px-4 py-4 space-y-3">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className={`block text-sm font-medium py-2 ${
                pathname === "/" 
                  ? "text-black" 
                  : "text-gray-700"
              }`}
            >
              Home
            </Link>
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 py-2"
            >
              Collections
            </Link>
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium text-gray-700 py-2"
            >
              New
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

