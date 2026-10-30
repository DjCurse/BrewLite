"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "./store/useCartStore";

type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const fallbackProducts: Product[] = [
  {
    id: 1,
    name: "Trà sữa trân châu",
    price: 39000,
    imageUrl:
      "https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=85",
    stock: 25,
    description: "Trà thơm, sữa béo, trân châu dẻo",
    category: "Trà sữa",
  },
  {
    id: 2,
    name: "Matcha Latte",
    price: 45000,
    imageUrl:
      "https://images.unsplash.com/photo-1515823064-d6e0c04616a7?auto=format&fit=crop&w=800&q=85",
    stock: 20,
    description: "Matcha Nhật Bản, sữa tươi dịu béo",
    category: "Matcha",
  },
  {
    id: 3,
    name: "Cà phê sữa đá",
    price: 29000,
    imageUrl:
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=85",
    stock: 20,
    description: "Đậm vị cà phê, ngọt dịu sữa đặc",
    category: "Cà phê",
  },
  {
    id: 4,
    name: "Trà đào cam sả",
    price: 35000,
    imageUrl:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=85",
    stock: 12,
    description: "Trà thanh mát, đào và cam tươi",
    category: "Trà trái cây",
  },
];

const categories = ["Tất cả", "Trà sữa", "Matcha", "Cà phê", "Trà trái cây"];

function money(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function enrichProductMeta(item: Product, index: number): Product {
  const lower = item.name.toLowerCase();
  let matched = fallbackProducts[index % fallbackProducts.length];
  let customImageUrl = null;

  if (lower.includes("trà sữa")) {
    matched = fallbackProducts[0];
  } else if (lower.includes("matcha")) {
    matched = fallbackProducts[1];
  } else if (lower.includes("cà phê")) {
    matched = fallbackProducts[2];
  } else if (lower.includes("trà đào") || lower.includes("trái cây")) {
    matched = fallbackProducts[3];
  } else if (lower.includes("bạc xỉu")) {
    customImageUrl = "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=800&q=85";
  }

  const isBacXiu = lower.includes("bạc xỉu");

  return {
    ...item,
    imageUrl: item.imageUrl || customImageUrl || matched.imageUrl,
    description:
      item.description ||
      (isBacXiu
        ? "Sữa tươi ngọt béo hòa quyện chút cà phê thơm"
        : matched.description),
    category: item.category || (isBacXiu ? "Cà phê" : matched.category),
  };
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiMessage, setApiMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const totalItems = useCartStore((state) => state.getTotalItems());

  useEffect(() => {
    setMounted(true);
    // Kiểm tra token trong localStorage xem đã đăng nhập chưa
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsLoggedIn(false);
    window.location.href = "/login";
  };

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter((item) => {
    const matchCategory =
      selectedCategory === "Tất cả" || item.category === selectedCategory;
    const matchSearch = item.name
      .toLowerCase()
      .includes(searchQuery.trim().toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#302a26] flex flex-col">
      {/* HEADER */}
      <header className="border-b border-[#e9e4db]">
        <div className="mx-auto flex h-[76px] max-w-[1280px] items-center justify-between px-5 md:px-10">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-[24px] font-bold tracking-tight md:text-[28px]"
          >
            <span className="text-[#365d49]" aria-hidden="true">
              ♧
            </span>
            BrewLite
          </Link>

          <nav className="hidden items-center gap-10 text-[15px] md:flex">
            <Link href="/" className="font-semibold text-[#365d49]">
              Thực đơn
            </Link>
            <a href="#about" className="text-[#8d877f] hover:text-[#302a26] transition">
              Về BrewLite
            </a>
            <a href="#contact" className="text-[#8d877f] hover:text-[#302a26] transition">
              Liên hệ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button className="text-2xl md:hidden" aria-label="Mở menu">
              ☰
            </button>

            {/* Giỏ hàng */}
            <Link
              href="/cart"
              className="flex items-center gap-2 rounded-full bg-[#e5eddf] px-3.5 py-2 text-sm font-medium transition hover:bg-[#d8e5cf]"
            >
              <span aria-hidden="true">▣</span>
              <span className="hidden md:inline">Giỏ hàng</span>
              <span className="rounded-full bg-[#365d49] px-2 py-0.5 text-xs font-semibold text-white">
                {mounted ? totalItems : 0}
              </span>
            </Link>

            {/* PHẦN KIỂM TRA ĐĂNG NHẬP / ĐĂNG XUẤT */}
            {mounted && (
              isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/orders"
                    className="hidden sm:inline-block rounded-full border border-[#365d49] px-3 py-1.5 text-xs font-semibold text-[#365d49] transition hover:bg-[#365d49] hover:text-white"
                  >
                    Lịch sử đơn
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="rounded-full bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="rounded-full bg-[#365d49] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#294a39] md:text-sm"
                  >
                    Đăng nhập
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 pb-16 pt-6 md:px-10 md:pb-20 md:pt-8">
        {apiMessage && (
          <p className="mb-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-900">
            Đang hiển thị menu mẫu vì chưa kết nối được Backend API ({apiMessage}). Hãy chạy <code>npm run start:dev</code> ở thư mục <code>backend</code> để lấy dữ liệu thật.
          </p>
        )}

        {/* Hero */}
        <section className="overflow-hidden rounded-3xl bg-[#DDE8D5] md:grid md:grid-cols-2">
          <div className="p-6 md:p-12">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#2F5D46]">
              Tươi mới mỗi ngày
            </p>
            <h2 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              Sip Fresh,
              <br />
              Live Better
            </h2>
            <p className="mt-4 text-sm text-gray-600">
              Một ly yêu thích, một ngày nhẹ tênh. Chọn vị ngon của riêng bạn.
            </p>
          </div>
          {/* Xuất ảnh hero từ Figma, lưu vào frontend/public/hero.jpg */}
          <img
            src="/hero.jpg"
            alt="BrewLite"
            className="h-56 w-full object-cover md:h-full"
          />
        </section>

        {/* FILTER & SEARCH SECTION */}
        <section className="mt-10 md:mt-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-[32px]">
                Hôm nay, bạn uống gì?
              </h2>
              <p className="mt-1 text-sm text-[#8d877f]">
                Pha mới khi bạn đặt. Ngon theo cách bạn thích.
              </p>
            </div>

            <div className="relative w-full md:w-[340px]">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#8d877f]">
                🔍
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm món bạn yêu thích..."
                className="w-full rounded-full border border-[#e9e4db] bg-white py-2.5 pl-10 pr-4 text-sm text-[#302a26] placeholder-[#9c968e] outline-none transition focus:border-[#365d49]"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition md:text-sm ${
                    active
                      ? "bg-[#365d49] text-white"
                      : "border border-[#e9e4db] bg-white text-[#5c564f] hover:border-[#9bb09e]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between text-xs text-[#8d877f] md:text-sm">
            <span>{filteredProducts.length} món ngon dành cho bạn</span>
            <span>Gợi ý từ BrewLite ↓</span>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm món bạn yêu thích..."
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none md:w-80"
          />
        </section>

        {/* PRODUCT GRID */}
        <section className="mt-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {[1, 2, 3, 4].map((skeleton) => (
                <div
                  key={skeleton}
                  className="rounded-3xl border border-[#e9e4db] bg-white p-3.5 md:p-4 animate-pulse"
                >
                  <div className="aspect-square w-full rounded-2xl bg-[#efeae1]" />
                  <div className="mt-4 h-5 w-3/4 rounded bg-[#efeae1]" />
                  <div className="mt-2 h-4 w-full rounded bg-[#efeae1]" />
                  <div className="mt-3 h-6 w-1/2 rounded bg-[#efeae1]" />
                  <div className="mt-4 h-10 w-full rounded-xl bg-[#efeae1]" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-[#e9e4db] bg-white py-16 text-center">
              <p className="text-lg font-semibold text-[#302a26]">
                Không tìm thấy món đồ uống phù hợp
              </p>
              <p className="mt-1 text-sm text-[#8d877f]">
                Bạn thử chọn danh mục khác hoặc tìm với từ khóa khác nhé.
              </p>
              <button
                key={c}
                className={`rounded-full border px-4 py-2 ${
                  i === 0
                    ? "border-[#2F5D46] bg-[#2F5D46] text-white"
                    : "border-black/10 bg-white"
                }`}
              >
                {c}
              </button>
            )
          )}
        </div>

        {/* Danh sách món */}
        {loading && <p className="mt-10 text-center">Đang tải menu...</p>}
        {error && (
          <p className="mt-10 text-center text-red-600">
            Không kết nối được máy chủ.
          </p>
        )}
        {!loading && !error && filtered.length === 0 && (
          <p className="mt-10 text-center">Hiện tại hết món</p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <p className="mt-6 text-xs text-gray-500">
              {filtered.length} món ngon dành cho bạn
            </p>
            <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
              {filtered.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm"
                >
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="aspect-square w-full rounded-xl object-cover"
                  />
                  <h3 className="mt-3 text-sm font-semibold">{p.name}</h3>
                  <p className="mt-1 font-bold text-[#2F5D46]">
                    {Number(p.price).toLocaleString("vi-VN")}đ
                  </p>
                  <Link
                    href={`/products/${p.id}`}
                    className="mt-3 block rounded-lg border border-black/10 py-2 text-center text-sm"
                  >
                    Chọn món
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="mt-12 border-t border-black/5 px-5 py-6 text-xs text-gray-500 md:px-8">
        BrewLite — Một chút tươi, một ngày vui. © 2026 BrewLite
      </footer>
    </div>
  );
}