"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  description?: string;
  category?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

// Dữ liệu chuẩn theo thiết kế Figma (dùng làm fallback khi chưa bật Backend
// đồng thời bổ sung ảnh/mô tả nếu trong Database đang để imageUrl: null)
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

// Hàm tự động bổ sung ảnh, mô tả và phân loại cho dữ liệu trả về từ Backend (vốn chỉ có name, price, imageUrl: null)
function enrichProductMeta(item: Product, index: number): Product {
  const lower = item.name.toLowerCase();
  let matched = fallbackProducts[index % fallbackProducts.length];

  if (lower.includes("trà sữa")) {
    matched = fallbackProducts[0];
  } else if (lower.includes("matcha") || lower.includes("bạc xỉu")) {
    matched = fallbackProducts[1];
  } else if (lower.includes("cà phê")) {
    matched = fallbackProducts[2];
  } else if (lower.includes("trà đào") || lower.includes("trái cây")) {
    matched = fallbackProducts[3];
  }

  return {
    ...item,
    imageUrl: item.imageUrl || matched.imageUrl,
    description:
      item.description ||
      (lower.includes("bạc xỉu")
        ? "Sữa tươi ngọt béo hòa quyện chút cà phê thơm"
        : matched.description),
    category:
      item.category ||
      (lower.includes("bạc xỉu") ? "Cà phê" : matched.category),
  };
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiMessage, setApiMessage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount] = useState(2);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setApiMessage("");

    fetch(`${API_BASE_URL}/products`)
      .then((response) => {
        if (!response.ok) throw new Error(`API trả về lỗi ${response.status}`);
        return response.json() as Promise<Product[]>;
      })
      .then((data) => {
        if (!cancelled) {
          if (Array.isArray(data) && data.length > 0) {
            setProducts(data.map((item, idx) => enrichProductMeta(item, idx)));
          } else {
            setProducts([]);
          }
          setApiMessage("");
          setIsLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setProducts(fallbackProducts);
          setApiMessage(
            error instanceof Error ? error.message : "Không kết nối được API"
          );
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Lọc sản phẩm theo Danh mục và Ô tìm kiếm
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

          <div className="flex items-center gap-4">
            <button className="text-2xl md:hidden" aria-label="Mở menu">
              ☰
            </button>
            <Link
              href="/cart"
              className="flex items-center gap-2.5 rounded-full bg-[#e5eddf] px-4 py-2 text-sm font-medium transition hover:bg-[#d8e5cf]"
            >
              <span aria-hidden="true">▣</span>
              <span className="hidden md:inline">Giỏ hàng</span>
              <span className="rounded-full bg-[#365d49] px-2 py-0.5 text-xs font-semibold text-white">
                {cartCount}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 pb-16 pt-6 md:px-10 md:pb-20 md:pt-8">
        {/* Thông báo nếu chưa bật Backend */}
        {apiMessage && (
          <p className="mb-5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-sm text-amber-900">
            Đang hiển thị menu mẫu vì chưa kết nối được Backend API ({apiMessage}). Hãy chạy <code>npm run start:dev</code> ở thư mục <code>backend</code> để lấy dữ liệu thật.
          </p>
        )}

        {/* HERO BANNER */}
        <section className="overflow-hidden rounded-[28px] bg-[#e5eddf] grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center p-7 sm:p-10 md:p-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#365d49]">
              TƯƠI MỚI MỖI NGÀY
            </p>
            <h1 className="mt-3 text-4xl font-bold leading-[1.12] tracking-tight text-[#302a26] sm:text-5xl md:text-[54px]">
              Sip Fresh,
              <br />
              Live Better
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#6e6a63] md:text-[15px]">
              Một ly yêu thích, một ngày nhẹ tênh. Chọn vị ngon của riêng bạn.
            </p>
          </div>

          <div
            role="img"
            aria-label="Đồ uống tươi mát tại BrewLite"
            className="min-h-[240px] sm:min-h-[300px] md:min-h-[340px] w-full bg-cover bg-center"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=1400&q=85")',
            }}
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

            {/* Ô tìm kiếm */}
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

          {/* Các nút lọc danh mục (Pills) */}
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

          {/* Thanh đếm số lượng món */}
          <div className="mt-6 flex items-center justify-between text-xs text-[#8d877f] md:text-sm">
            <span>{filteredProducts.length} món ngon dành cho bạn</span>
            <span>Gợi ý từ BrewLite ↓</span>
          </div>
        </section>

        {/* PRODUCT GRID (3 trạng thái: Loading, Empty, Data) */}
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
                onClick={() => {
                  setSelectedCategory("Tất cả");
                  setSearchQuery("");
                }}
                className="mt-4 rounded-full bg-[#365d49] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#294a39]"
              >
                Xem tất cả món
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
              {filteredProducts.map((item) => (
                <div
                  key={item.id}
                  className="group flex flex-col rounded-3xl border border-[#e9e4db] bg-white p-3.5 transition hover:shadow-md md:p-4"
                >
                  <Link
                    href={`/products/${item.id}`}
                    className="overflow-hidden rounded-2xl bg-[#f3efe7]"
                  >
                    <div
                      role="img"
                      aria-label={item.name}
                      className="aspect-square w-full bg-cover bg-center transition duration-300 group-hover:scale-105"
                      style={{
                        backgroundImage: `url("${item.imageUrl}")`,
                      }}
                    />
                  </Link>

                  <div className="mt-3.5 flex flex-1 flex-col">
                    <Link href={`/products/${item.id}`}>
                      <h3 className="text-base font-bold text-[#302a26] group-hover:text-[#365d49] md:text-lg line-clamp-1">
                        {item.name}
                      </h3>
                    </Link>

                    <p className="mt-1 hidden text-xs text-[#8d877f] md:line-clamp-1 md:block">
                      {item.description}
                    </p>

                    <p className="mt-1.5 text-base font-bold text-[#365d49] md:mt-2.5 md:text-xl">
                      {money(item.price)}
                    </p>

                    <Link
                      href={`/products/${item.id}`}
                      className="mt-3 block w-full rounded-xl border border-[#e9e4db] bg-white py-2 text-center text-xs font-semibold text-[#302a26] transition hover:border-[#365d49] hover:bg-[#e5eddf] hover:text-[#365d49] md:mt-4 md:py-2.5 md:text-sm"
                    >
                      Chọn món
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#e9e4db]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-2 px-5 py-5 text-xs text-[#8d877f] md:flex-row md:items-center md:justify-between md:px-10">
          <span>BrewLite — Một chút tươi, một ngày vui.</span>
          <span>© 2026 BrewLite</span>
        </div>
      </footer>
    </div>
  );
}