import React from "react";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-24 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">Help & Support</h1>
        <p className="mt-2 text-lg text-neutral-600">Find information about AgriCycle and answers to frequently asked questions.</p>
      </div>

      {/* About Us Section */}
      <section className="space-y-4 rounded-2xl bg-gradient-to-br from-[var(--brand-soft)] to-emerald-50 p-6 md:p-8 border border-[var(--brand)]">
        <div>
          <h2 className="text-2xl font-bold text-[var(--brand-strong)]">About AgriCycle</h2>
          <p className="mt-2 text-slate-700 leading-relaxed">
            AgriCycle is a modern agricultural marketplace platform designed to connect farmers, buyers, contractors, and agricultural processors. Our mission is to create a seamless ecosystem where agricultural products and services can be traded efficiently and transparently.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mt-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-[var(--brand)] mb-2">🌾</div>
            <h3 className="font-bold text-slate-900">For Farmers</h3>
            <p className="text-sm text-slate-600 mt-1">List and sell fresh produce, animal products, and farm waste to interested buyers.</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-cyan-600 mb-2">🛒</div>
            <h3 className="font-bold text-slate-900">For Buyers</h3>
            <p className="text-sm text-slate-600 mt-1">Browse and purchase quality agricultural products directly from trusted farmers.</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-3xl font-bold text-amber-600 mb-2">🚜</div>
            <h3 className="font-bold text-slate-900">For Contractors</h3>
            <p className="text-sm text-slate-600 mt-1">Rent equipment and tools to farmers, and purchase agricultural inputs and waste.</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--brand)]/20">
          <h3 className="font-bold text-slate-900 mb-2">Key Features</h3>
          <ul className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            <li className="flex gap-2">
              <span className="text-[var(--brand)]">✓</span> <strong>5 Categories:</strong> Fresh Produce, Animal Products, Farm Waste, Agri Inputs, Equipment
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--brand)]">✓</span> <strong>Equipment Rental:</strong> Daily, weekly, or monthly rental periods
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--brand)]">✓</span> <strong>Shopping Cart:</strong> Add items and checkout seamlessly
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--brand)]">✓</span> <strong>Bid System:</strong> Make and negotiate offers with sellers
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--brand)]">✓</span> <strong>Search & Filter:</strong> Find exactly what you need by category or location
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--brand)]">✓</span> <strong>Secure Trading:</strong> Connect with verified users safely
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-neutral-900">How AgriCycle Works</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-neutral-900">For Farmers</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex gap-2">
                <span className="text-blue-500">•</span> <strong>Create Listings:</strong> Navigate to "New Listing" to offer your products. Add details like quantity, category, and location.
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500">•</span> <strong>Review Requests:</strong> Buyers will send requests. Review them in your dashboard.
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500">•</span> <strong>Accept Offers:</strong> Accept requests that meet your expectations to finalize the trade.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-neutral-900">For Buyers & Contractors</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex gap-2">
                <span className="text-emerald-500">•</span> <strong>Browse Listings:</strong> Search the marketplace by category, location, or keyword.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500">•</span> <strong>Add to Cart or Make Offers:</strong> Either add items to cart for quick checkout or negotiate prices with farmers.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500">•</span> <strong>Track Orders:</strong> Monitor your orders and communicate with sellers.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-neutral-900">Frequently Asked Questions</h2>
        <div className="divide-y rounded-2xl border bg-white shadow-sm">
          
          <details className="group p-6" open>
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-neutral-900 marker:content-none">
              What are the 5 product categories?
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <p className="mt-4 text-sm text-neutral-600">
              AgriCycle features 5 main categories:
              <br/>
              <strong>1. Fresh Produce:</strong> Fruits, vegetables, grains, and crops
              <br/>
              <strong>2. Animal Produce:</strong> Eggs, dairy, meat, and animal byproducts
              <br/>
              <strong>3. Farm Waste:</strong> Crop residues, manure, and organic waste
              <br/>
              <strong>4. Agricultural Inputs:</strong> Seeds, fertilizers, pesticides, and tools
              <br/>
              <strong>5. Equipment:</strong> Machinery and tools available for rent or sale
            </p>
          </details>

          <details className="group p-6">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-neutral-900 marker:content-none">
              How do I contact a buyer or seller?
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <p className="mt-4 text-sm text-neutral-600">
              Once a request or order is accepted, contact information for both parties becomes available on the order details page. You can also send messages directly through the platform to communicate about the transaction and coordinate logistics.
            </p>
          </details>

          <details className="group p-6">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-neutral-900 marker:content-none">
              Can I negotiate the price?
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <p className="mt-4 text-sm text-neutral-600">
              Yes! You can use the "Negotiate Offer" feature to propose a custom price and quantity when interested in a listing. Farmers can review your offer and decide whether to accept, reject, or counter your bid.
            </p>
          </details>

          <details className="group p-6">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-neutral-900 marker:content-none">
              What is the Shopping Cart feature?
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <p className="mt-4 text-sm text-neutral-600">
              The Shopping Cart allows you to add multiple products and checkout all at once. Simply click "Add to Cart" on any listing, review your cart, adjust quantities if needed, and proceed to checkout. This creates order requests for all items simultaneously.
            </p>
          </details>

          <details className="group p-6">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-neutral-900 marker:content-none">
              How does equipment rental work?
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <p className="mt-4 text-sm text-neutral-600">
              Contractors can list equipment for rental by specifying the rental period (per day, week, or month), condition (new, used, refurbished), and rental price. Renters can browse available equipment and place rental requests through the same bidding system.
            </p>
          </details>

          <details className="group p-6">
            <summary className="flex cursor-pointer items-center justify-between font-semibold text-neutral-900 marker:content-none">
              Are there any fees for using AgriCycle?
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <p className="mt-4 text-sm text-neutral-600">
              Currently, AgriCycle is free to use for all farmers, buyers, and contractors to connect and trade agricultural products and services.
            </p>
          </details>

        </div>
      </section>
    </div>
  );
}
