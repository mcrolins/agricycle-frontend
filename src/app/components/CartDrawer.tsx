"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, absUrl } from "@/app/lib/api";
import type { Cart } from "@/app/lib/types";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen]);

  async function fetchCart() {
    setLoading(true);
    try {
      const data = await apiFetch<Cart>("/api/requests/cart/");
      setCart(data);
    } catch (e) {
      console.error("Failed to fetch cart:", e);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const items = cart?.items || [];
  const totalPrice = cart?.total_price || 0;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[320px] bg-white shadow-lg animate-slide-left flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <h2 className="text-lg font-bold text-[var(--foreground)]">Cart</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-slate-500">
              Loading...
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-slate-500">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-lg bg-slate-50 p-2"
                >
                  <div className="h-12 w-12 shrink-0 rounded bg-slate-200 overflow-hidden">
                    {item.listing_image ? (
                      <img
                        src={absUrl(item.listing_image)}
                        alt={item.listing_title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[8px] text-slate-400">
                        No Img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="line-clamp-1 text-xs font-semibold text-[var(--foreground)]">
                      {item.listing_title}
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      {item.quantity} {item.listing_unit}
                    </p>
                    <p className="text-xs font-bold text-[var(--accent)]">
                      KES {Number(item.listing_price || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-[var(--line)] bg-white p-3 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal ({items.length} items)</span>
              <span className="font-bold">
                KES {Number(totalPrice).toLocaleString()}
              </span>
            </div>
            <Link
              href="/cart"
              onClick={onClose}
              className="block w-full rounded-full bg-[var(--brand)] py-3 text-center font-bold text-white shadow-sm hover:bg-[var(--brand-strong)] transition-colors"
            >
              View Cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
