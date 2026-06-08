"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { absUrl, apiFetch } from "@/app/lib/api";
import type { Cart, OrderRequest } from "@/app/lib/types";

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutErr, setCheckoutErr] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, []);

  async function fetchCart() {
    try {
      const data = await apiFetch<Cart>("/api/requests/cart/");
      setCart(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function updateQuantity(id: number, quantity: number) {
    if (quantity < 1) return removeItem(id);
    try {
      const data = await apiFetch<Cart>(`/api/requests/cart/items/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });
      setCart(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function removeItem(id: number) {
    try {
      const data = await apiFetch<Cart>(`/api/requests/cart/items/${id}/remove/`, {
        method: "DELETE",
      });
      setCart(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCheckout() {
    setCheckingOut(true);
    setCheckoutErr(null);
    try {
      const response = await apiFetch<{ success: boolean; orders_created: number; orders: OrderRequest[] }>(
        "/api/requests/cart/checkout/",
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      );
      
      if (response.success && response.orders_created > 0) {
        // Redirect to orders page
        router.push("/orders/my");
      } else {
        setCheckoutErr("Failed to create orders. Please try again.");
      }
    } catch (e) {
      setCheckoutErr(e instanceof Error ? e.message : "Checkout failed. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading cart...</div>;
  }

  const items = cart?.items || [];

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-[var(--surface-strong)] pb-20">
      <div className="bg-white px-4 py-4 shadow-sm">
        <h1 className="text-xl font-bold text-[var(--foreground)]">My Cart</h1>
        <p className="text-sm text-slate-500">{items.length} items</p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
          <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-2">Your cart is empty</h2>
          <p className="text-slate-500 text-sm mb-6">Browse our marketplace to find fresh produce and equipment.</p>
          <Link href="/listings" className="rounded-full bg-[var(--accent)] px-8 py-3 font-bold text-white shadow-sm hover:bg-[var(--accent-strong)]">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-2">
          {items.map((item) => (
            <div key={item.id} className="flex bg-white p-3 rounded-lg shadow-sm gap-3">
              <div className="h-20 w-20 shrink-0 rounded bg-slate-100 overflow-hidden">
                {item.listing_image ? (
                  <img src={absUrl(item.listing_image)} alt={item.listing_title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">No Image</div>
                )}
              </div>
              
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between">
                  <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-[var(--foreground)]">
                    {item.listing_title}
                  </h3>
                  <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  </button>
                </div>
                
                <p className="mt-1 text-[11px] font-medium text-slate-500">{item.listing_category}</p>
                
                <div className="mt-auto flex items-end justify-between">
                  <p className="text-sm font-bold text-[var(--accent)]">
                    KES {Number(item.listing_price || 0).toLocaleString()}
                  </p>
                  
                  <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-slate-50 px-1">
                    <button 
                      onClick={() => updateQuantity(item.id, Number(item.quantity) - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
                    >
                      -
                    </button>
                    <span className="min-w-4 text-center text-xs font-semibold">{Number(item.quantity)}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-4 bg-white p-4 rounded-lg shadow-sm">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-slate-500">Subtotal</span>
              <span className="font-semibold">KES {Number(cart?.total_price || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-[var(--foreground)] border-t border-[var(--line)] pt-2 mb-4">
              <span>Total</span>
              <span className="text-[var(--accent)]">KES {Number(cart?.total_price || 0).toLocaleString()}</span>
            </div>
            
            <button 
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full rounded-full bg-[var(--brand)] py-3 font-bold text-white shadow-sm hover:bg-[var(--brand-strong)] transition-colors disabled:opacity-50"
            >
              {checkingOut ? "Processing..." : "Proceed to Checkout"}
            </button>
            {checkoutErr && (
              <div className="text-red-600 text-sm font-semibold text-center mt-2">
                {checkoutErr}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
