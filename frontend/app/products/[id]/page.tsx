"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
};

const sampleProduct: Product = {
  id: 1,
  name: "Matcha Latte",
  price: 45000,
  imageUrl: null,
  stock: 20,
};

const toppings = ["Trân châu", "Kem"];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function money(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product>(sampleProduct);
  const [size, setSize] = useState<"S" | "M" | "L">("S");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState(2);
  const [added, setAdded] = useState(false);
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setApiMessage("");
    fetch(`${API_BASE_URL}/products/${params.id}`)
      .then((response) => {
        if (!response.ok) throw new Error(`API trả về lỗi ${response.status}`);
        return response.json() as Promise<Product>;
      })
      .then((data) => {
        if (!cancelled) {
          setProduct(data);
          setApiMessage("");
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setProduct(sampleProduct);
          setApiMessage(
            error instanceof Error ? error.message : "Không kết nối được API",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const sizeExtra = size === "M" ? 5000 : size === "L" ? 10000 : 0;
  const total = product.price + sizeExtra + selectedToppings.length * 10000;

  function toggleTopping(name: string) {
    setSelectedToppings((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );
    setAdded(false);
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#302a26]">
      <header className="border-b border-[#e9e4db]">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-6 md:px-12">
          <Link href="/" className="flex items-center gap-3 text-[25px] font-bold tracking-tight md:text-[30px]">
            <span className="text-[#365d49]" aria-hidden="true">♧</span>BrewLite
          </Link>
          <nav className="hidden items-center gap-10 text-[15px] md:flex">
            <Link href="/" className="font-semibold text-[#365d49]">Thực đơn</Link>
            <a href="#about" className="text-[#8d877f]">Về BrewLite</a>
            <a href="#contact" className="text-[#8d877f]">Liên hệ</a>
          </nav>
          <div className="flex items-center gap-5">
            <button className="text-2xl md:hidden" aria-label="Mở menu">☰</button>
            <button className="flex items-center gap-3 rounded-full bg-[#e5eddf] px-4 py-2 text-sm">
              <span aria-hidden="true">▣</span><span className="hidden md:inline">Giỏ hàng</span>
              <span className="rounded-full bg-[#365d49] px-2 py-1 text-xs text-white">{cartCount}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 pb-16 pt-8 md:px-12 md:pb-20 md:pt-9">
        <Link href="/" className="mb-6 inline-block text-sm text-[#8d877f]">← Thực đơn / Matcha / {product.name}</Link>
        {apiMessage && (
          <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
            Đang dùng dữ liệu xem trước vì chưa tải được sản phẩm từ API ({apiMessage}).
          </p>
        )}

        <div className="grid gap-7 md:grid-cols-[0.94fr_1.06fr] md:gap-16">
          <section>
            <div
              role="img"
              aria-label={product.name}
              className="aspect-[0.91] w-full rounded-2xl bg-cover bg-center md:aspect-[0.91]"
              style={{
                backgroundImage: product.imageUrl
                  ? `url("${product.imageUrl}")`
                  : 'url("https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=1200&q=85")',
              }}
            />
            <p className="mt-4 text-sm text-[#817b72]"><span className="mr-2 text-lg text-[#365d49]">♧</span>Matcha Nhật Bản · Pha mới mỗi ngày</p>
          </section>

          <section className="pt-0 md:pt-0">
            <p className="text-xs font-bold tracking-wide text-[#365d49]">MATCHA COLLECTION</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight md:mt-5 md:text-5xl">{product.name}</h1>
            <p className="mt-4 text-[15px] leading-6 text-[#8d877f] md:text-base">Matcha Nhật Bản thanh nhẹ hòa cùng sữa tươi dịu béo. Một chút tươi mát, đủ để ngày của bạn chậm lại.</p>
            <p className="mt-3 text-3xl font-bold text-[#365d49]">{money(product.price)}</p>

            <div className="mt-6 border-t border-[#e6e0d7] pt-6">
              <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Chọn size</h2><span className="text-xs text-[#8d877f]">Bắt buộc · Chọn 1</span></div>
              <div className="grid grid-cols-3 gap-3">
                {(["S", "M", "L"] as const).map((item) => {
                  const extra = item === "M" ? 5000 : item === "L" ? 10000 : 0;
                  const active = size === item;
                  return <button key={item} onClick={() => { setSize(item); setAdded(false); }} className={`min-h-[76px] rounded-2xl border-2 px-2 py-2 transition ${active ? "border-[#365d49] bg-[#e5eddf] text-[#365d49]" : "border-[#e9e4db] bg-white hover:border-[#9bb09e]"}`}>
                    <span className="block text-lg font-semibold">{item}{active ? " ✓" : ""}</span><span className="mt-1 block text-xs text-[#8d877f]">{extra ? `+${money(extra)}` : "Giá gốc"}</span>
                  </button>;
                })}
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Thêm topping</h2><span className="text-xs text-[#8d877f]">Không bắt buộc</span></div>
              <div className="space-y-3">
                {toppings.map((item) => <label key={item} className="flex min-h-[57px] cursor-pointer items-center gap-3 rounded-2xl border border-[#e9e4db] bg-white px-4">
                  <input type="checkbox" checked={selectedToppings.includes(item)} onChange={() => toggleTopping(item)} className="h-5 w-5 accent-[#365d49]" />
                  <span className="flex-1 text-sm">{item}</span><span className="text-sm text-[#8d877f]">+10.000đ</span>
                </label>)}
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between gap-2">
              <h2 className="font-semibold">Tổng tiền · 1 món</h2><p className="text-2xl font-bold text-[#365d49]">{money(total)}</p>
            </div>
            <button onClick={() => { setCartCount((count) => count + 1); setAdded(true); }} className="mt-4 min-h-14 w-full rounded-2xl bg-[#365d49] px-4 font-semibold text-white transition hover:bg-[#294a39]">
              {added ? "Đã thêm vào giỏ hàng ✓" : "Thêm vào giỏ hàng"}
            </button>
            <p className="mt-4 text-center text-xs text-[#8d877f]">Size {size}{selectedToppings.length ? ` · ${selectedToppings.join(", ")}` : " · Không thêm topping"}</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-[#e9e4db]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-6 py-5 text-xs text-[#8d877f] md:flex-row md:items-center md:justify-between md:px-12">
          <span>BrewLite — Một chút tươi, một ngày vui.</span><span>© 2026 BrewLite</span>
        </div>
      </footer>
    </div>
  );
}
