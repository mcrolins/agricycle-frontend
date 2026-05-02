import React from "react";

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-24 md:p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">Help & Support</h1>
        <p className="mt-2 text-lg text-neutral-600">Find user guides and answers to frequently asked questions.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-neutral-900">User Guide</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-neutral-900">For Farmers</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex gap-2">
                <span className="text-blue-500">•</span> <strong>Create Listings:</strong> Navigate to "New Listing" to offer agricultural waste. Add details like quantity and location.
              </li>
              <li className="flex gap-2">
                <span className="text-blue-500">•</span> <strong>Review Requests:</strong> Processors will send requests to buy your waste. Review them in your dashboard.
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
            <h3 className="mb-2 text-lg font-bold text-neutral-900">For Processors</h3>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li className="flex gap-2">
                <span className="text-emerald-500">•</span> <strong>Browse Listings:</strong> Search the marketplace for available agricultural waste.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500">•</span> <strong>Send Requests:</strong> Make offers on listings, specifying the quantity you need and your proposed price.
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-500">•</span> <strong>Track Orders:</strong> Monitor the status of your requests under "My Requests".
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
              What is considered a "waste category"?
              <span className="transition group-open:rotate-180">
                <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
              </span>
            </summary>
            <p className="mt-4 text-sm text-neutral-600">
              A waste category refers to the specific type of agricultural byproduct you are listing or requesting. Common examples include crop residue (like maize stalks or wheat straw), animal waste (such as cow dung or poultry manure), and processing by-products (like coffee husks or rice bran). Being specific helps buyers find exactly what they need.
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
              Once a request is accepted by the farmer, contact information for both parties will become available on the order details page to facilitate communication and coordinate logistics.
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
              Yes, processors can propose a custom price when submitting a request for a listing. Farmers can then review these competitive bids and accept the most suitable offer.
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
              Currently, AgriCycle is free to use for both farmers and processors to connect and trade agricultural waste.
            </p>
          </details>

        </div>
      </section>
    </div>
  );
}
