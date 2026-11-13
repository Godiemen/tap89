'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Minus, Plus, ShoppingBag, TicketPercent, Trash2 } from 'lucide-react';
import {
  useApp,
  productById,
  cartSubtotal,
  storeById,
  money,
} from '@sipdash/core';
import { cn, productPhoto } from '../../src/design';

export default function Cart() {
  const cart = useApp((s) => s.cart);
  const cartStoreId = useApp((s) => s.cartStoreId);
  const setCartQty = useApp((s) => s.setCartQty);
  const clearCart = useApp((s) => s.clearCart);
  const promoCode = useApp((s) => s.promoCode);
  const applyPromo = useApp((s) => s.applyPromo);
  const removePromo = useApp((s) => s.removePromo);

  const [code, setCode] = useState('');
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; message: string } | null>(null);

  const store = cartStoreId ? storeById(cartStoreId) : null;
  const subtotal = cartSubtotal(cart);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  return (
    <main className="bg-cream px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-3xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-grape">
          {store ? store.name : 'Your cart'}
        </p>
        <div className="flex items-end justify-between">
          <h1 className="font-display text-5xl uppercase tracking-tight md:text-6xl">Your cart</h1>
          {cartCount > 0 && (
            <button onClick={clearCart} className="flex items-center gap-1.5 text-xs font-bold text-mist hover:text-wine">
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>

        {cartCount === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <ShoppingBag size={42} strokeWidth={1.3} className="mb-4 text-grape" />
            <h3 className="text-xl font-bold">Your bar is empty</h3>
            <p className="mt-2 max-w-xs text-sm text-mist">Add a few bottles and we&apos;ll get things moving.</p>
            <Link
              href="/"
              className="mt-8 flex h-14 items-center gap-3 bg-ink px-8 font-bold text-white transition hover:bg-grape"
            >
              Browse shops <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-10 space-y-5">
              {cart.map((c) => {
                const p = productById(c.productId);
                if (!p) return null;
                return (
                  <div key={c.productId} className="flex gap-4 border-b border-black/10 pb-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={productPhoto(p)} alt="" className="size-20 bg-white object-cover" />
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between gap-3">
                        <h3 className="text-sm font-bold">{p.name}</h3>
                        <span className="text-sm font-bold">{money(p.price * c.qty)}</span>
                      </div>
                      <p className="text-xs text-mist">
                        {p.brand} · {p.size}
                      </p>
                      <div className="flex w-fit items-center gap-3 rounded-full border border-black/15 bg-white p-1">
                        <button
                          onClick={() => setCartQty(c.productId, c.qty - 1)}
                          className="grid size-7 place-items-center rounded-full hover:bg-stone"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="min-w-3 text-center text-xs font-bold">{c.qty}</span>
                        <button
                          onClick={() => setCartQty(c.productId, c.qty + 1)}
                          className="grid size-7 place-items-center rounded-full bg-ink text-white"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* promo */}
            <div className="mt-8">
              {promoCode ? (
                <div className="flex items-center justify-between border border-gold bg-gold/20 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <TicketPercent size={16} className="text-grape" /> {promoCode} applied
                  </span>
                  <button onClick={removePromo} className="text-xs font-bold underline underline-offset-2">
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="Promo code — try FIRSTSIP"
                      className="h-12 flex-1 border border-black/15 bg-white px-4 text-sm font-bold outline-none ring-grape focus:ring-2"
                    />
                    <button
                      onClick={() => code.trim() && setPromoMsg(applyPromo(code.trim()))}
                      className="h-12 bg-ink px-5 text-sm font-bold text-white transition hover:bg-grape"
                    >
                      Apply
                    </button>
                  </div>
                  {promoMsg && (
                    <p className={cn('mt-2 text-xs font-bold', promoMsg.ok ? 'text-grape' : 'text-wine')}>
                      {promoMsg.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* summary */}
            <div className="mt-8 border-t border-black/10 pt-5">
              <div className="mb-4 flex justify-between font-bold">
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <Link
                href="/checkout"
                className="flex h-14 w-full items-center justify-between bg-grape px-5 font-bold text-white transition hover:bg-ink"
              >
                Go to checkout <span>{money(subtotal)}</span>
              </Link>
              <p className="mt-3 text-center text-[11px] text-mist">
                Taxes and fees calculated at checkout · ID required
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
