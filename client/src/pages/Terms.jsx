// client/src/pages/Terms.jsx
import React from 'react';

export default function Terms() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <h1 className="text-4xl font-bold text-wax mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>Terms & Conditions</h1>

            <div className="space-y-6 text-gray-700 leading-relaxed">
                <section>
                    <h2 className="text-xl font-semibold text-wax mb-2">1. Introduction</h2>
                    <p>Welcome to Scentiva. By accessing our website and purchasing our products, you agree to be bound by these Terms and Conditions. Please read them carefully.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-wax mb-2">2. Products & Services</h2>
                    <p>We strive to display our products as accurately as possible. However, colors and scents may vary slightly from the images and descriptions on the website. All products are subject to availability.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-wax mb-2">3. Pricing & Payments</h2>
                    <p>All prices are listed in INR and include applicable taxes unless otherwise stated. We reserve the right to change prices at any time without notice. Payments are processed securely via our payment partners.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-wax mb-2">4. Shipping & Delivery</h2>
                    <p>We aim to process and ship orders within 2-4 business days. Delivery times may vary depending on your location. Scentiva is not responsible for delays caused by carrier issues or unforeseen circumstances.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-wax mb-2">5. Returns & Refunds</h2>
                    <p>If you are not satisfied with your purchase, please contact our support team within 7 days of delivery. Returns are accepted for unused and unopened items only.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-wax mb-2">6. User Accounts</h2>
                    <p>You are responsible for maintaining the confidentiality of your account credentials. Scentiva reserves the right to terminate accounts that violate our policies.</p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-wax mb-2">7. Contact Us</h2>
                    <p>If you have any questions regarding these Terms, please contact us at <a href="mailto:support@scentiva.local" className="text-flame hover:underline">support@scentiva.local</a>.</p>
                </section>
            </div>
        </div>
    );
}
