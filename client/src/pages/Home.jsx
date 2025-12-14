// client/src/pages/Home.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import ProductCard from "../components/ProductCard";
import Carousel from "../components/Carousel";
import { FiMail } from "react-icons/fi";
import { normalizeMediaUrl, getPlaceholder } from "../utils/media";
import { toast } from "react-hot-toast";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [catLoading, setCatLoading] = useState(true);
  const [error, setError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [newsletterMsg, setNewsletterMsg] = useState(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const isCancel = (err) =>
      !err ? false : err?.code === "ERR_CANCELED" || err?.name === "CanceledError" || err?.name === "AbortError";

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get("/products?limit=6&sort=newest", {
          signal: controller.signal,
        });
        if (!mounted) return;
        setProducts(data.products || data || []);
      } catch (err) {
        // ignore canceled/abort errors (user navigated away / component unmounted)
        if (isCancel(err)) {
          console.debug("Products fetch canceled");
          return;
        }
        console.error("Failed to load products", err);
        if (!mounted) return;
        const msg = err?.response?.data?.message || "Failed to load products";
        setError(msg);
        toast.error(msg);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        setCatLoading(true);
        const { data } = await api.get("/categories", { signal: controller.signal });
        if (!mounted) return;
        setCats(data || []);
      } catch (err) {
        if (isCancel(err)) {
          console.debug("Categories fetch canceled");
          return;
        }
        console.error("Failed to load categories", err);
        if (!mounted) return;
        toast.error(err?.response?.data?.message || "Failed to load categories");
      } finally {
        if (mounted) setCatLoading(false);
      }
    };

    fetchProducts();
    fetchCategories();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  const normalizeRaw = (raw) =>
    // normalizeMediaUrl can accept url string or object depending on your helpers
    normalizeMediaUrl(raw) || normalizeMediaUrl(getPlaceholder("image"));

  const slides = useMemo(() => {
    if (products && products.length >= 3) {
      return products.slice(0, 3).map((p) => {
        // support different image shapes (object or string)
        const first = p.images?.[0];
        const rawImage =
          (first && (first.url || first.filename || first.path)) || first || null;
        return {
          id: p._id || p.id,
          title: p.title,
          subtitle: p.brand || "",
          image: normalizeRaw(rawImage),
          ctaText: "Shop now",
          ctaLink: `/product/${p._id || p.id}`,
        };
      });
    }

    // fallback slides (normalized)
    return [
      {
        id: "h1",
        title: "Warm scents, thoughtful gifts",
        subtitle: "Hand-poured candles, premium perfumes & curated gift sets",
        image: normalizeRaw("/placeholder.png"),
        ctaText: "Browse collections",
        ctaLink: "/products",
      },
      {
        id: "h2",
        title: "New arrivals every week",
        subtitle: "Fresh fragrances for every mood",
        image: normalizeRaw("/placeholder.png"),
        ctaText: "See new",
        ctaLink: "/products?sort=newest",
      },
      {
        id: "h3",
        title: "Gift-wrap + Personal notes",
        subtitle: "Make it personal — complimentary on orders over ₹999",
        image: normalizeRaw("/placeholder.png"),
        ctaText: "Start gifting",
        ctaLink: "/products",
      },
    ];
  }, [products]);

  return (
    <div className="space-y-12">
      {/* HERO - full-bleed using Carousel component */}
      <section className="w-full">
        <div className="relative h-[480px] overflow-hidden">
          {/* Carousel */}
          <div className="absolute inset-0 z-10">
            <Carousel slides={slides} autoplay={4500} debug={false} heightClass="h-[480px]" />
          </div>

          {/* Warm overlay + gradient */}
          <div
            className="absolute inset-0 z-20 bg-gradient-to-r
            from-[rgba(139,94,60,0.55)]
            via-[rgba(224,122,95,0.25)]
            to-[rgba(142,124,195,0.12)]
            pointer-events-none"
          />

          {/* Note: no static text block — hero visuals handled by Carousel */}
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="max-w-screen-2xl mx-auto px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-wax">Shop by Category</h2>
          <Link to="/products" className="text-sm text-flame hover:underline">
            View all
          </Link>
        </div>

        <div className="mt-4">
          {catLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-cream rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {(cats && cats.length
                ? cats
                : [
                    { _id: "c1", name: "Candles" },
                    { _id: "c2", name: "Gift Sets" },
                    { _id: "c3", name: "Perfumes" },
                    { _id: "c4", name: "Home Fragrance" },
                    { _id: "c5", name: "Bath & Body" },
                    { _id: "c6", name: "Accessories" },
                  ]
              ).map((cat) => (
                <Link
                  key={cat._id || cat.name}
                  to={`/products?category=${encodeURIComponent(cat._id || cat.name)}`}
                  className="flex items-center justify-center p-3 bg-white border rounded-lg hover:shadow transition card-cosset"
                  aria-label={`Browse ${cat.name}`}
                >
                  <div className="text-sm font-medium text-textmuted">{cat.name}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* NEW & FEATURED */}
      <section className="max-w-screen-2xl mx-auto px-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-wax">New & Featured</h2>
            <p className="text-sm text-textmuted">Hand-picked pieces for cozy moments</p>
          </div>
          <Link to="/products" className="text-sm text-flame hover:underline">
            View all products
          </Link>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4 bg-white rounded-lg shadow animate-pulse h-56" />
              ))}
            </div>
          ) : error ? (
            <div className="text-red-500 mt-4">{error}</div>
          ) : products.length === 0 ? (
            <div className="text-textmuted mt-4">No products found. Visit Products page.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-4">
              {products.map((p) => (
                <ProductCard key={p._id || p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* NEWSLETTER / CTA */}
      <section className="max-w-screen-2xl mx-auto px-6">
        <div className="rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4 card-cosset">
          <div className="flex items-center gap-3">
            <FiMail className="text-perfume" />
            <div>
              <h3 className="text-lg font-semibold text-wax">Join our newsletter</h3>
              <p className="text-sm text-textmuted">Get exclusive deals, scent drops & gifting tips — no spam.</p>
            </div>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const email = e.target.email?.value;
              if (!email) {
                toast.error("Please enter a valid email");
                return;
              }

              setSubmitting(true);
              setNewsletterMsg(null);

              try {
                const promise = api.post("/newsletter/subscribe", { email });
                const res = await toast.promise(promise, {
                  loading: "Subscribing…",
                  success: (d) => d?.data?.message || "Subscribed!",
                  error: (err) => err?.response?.data?.message || "Failed to subscribe",
                });

                const data = res?.data || (res && res.data) || {};
                setNewsletterMsg(data.message || "Subscribed!");
                e.target.reset();
              } catch (err) {
                console.error("Subscribe failed", err);
                setNewsletterMsg(err?.response?.data?.message || "Failed to subscribe. Please try again.");
              } finally {
                setSubmitting(false);
              }
            }}
            className="w-full sm:w-auto flex gap-2"
            aria-label="Subscribe to newsletter"
          >
            <input
              name="email"
              required
              type="email"
              placeholder="Your email"
              className="px-4 py-2 border rounded-md w-full sm:w-64"
              aria-label="Email address"
            />
            <button className="btn-primary" disabled={submitting}>
              {submitting ? "Subscribing..." : "Subscribe"}
            </button>
          </form>

          {newsletterMsg && <p className="text-xs text-textmuted mt-1 sm:mt-0">{newsletterMsg}</p>}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-cream border-t mt-8">
        <div className="max-w-screen-2xl mx-auto px-6 py-8 grid md:grid-cols-3 gap-6">
          <div>
            <div className="text-xl font-semibold text-wax">Scentiva</div>
            <p className="text-sm text-textmuted mt-2">Hand-poured candles, luxe perfumes & thoughtful gifts.</p>
          </div>

          <div className="text-sm text-textmuted">
            <h4 className="font-semibold mb-2">Help</h4>
            <ul className="space-y-1">
              <li>
                <Link to="/products" className="hover:underline">
                  Products
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:underline">
                  Cart
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:underline">
                  Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2 text-sm">Contact</h4>
            <div className="text-sm text-textmuted">support@Scentiva.local</div>
            <div className="text-sm text-textmuted mt-2">© {new Date().getFullYear()} Scentiva</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
