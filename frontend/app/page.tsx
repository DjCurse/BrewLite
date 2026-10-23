"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
};

const API_URL = "http://localhost:3001/products";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F5EE] text-[#2B2B2B]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-black/5 px-5 py-4 md:px-8">
        <span className="text-xl font-bold md:text-2xl">🌱 BrewLite</span>
        <nav className="hidden gap-8 text-sm md:flex">
          <a className="font-semibold text-[#2F5D46]" href="#">Thực đơn</a>
          <a href="#">Về BrewLite</a>
          <a href="#">Liên hệ</a>
        </nav>
        <button className="rounded-full bg-[#DDE8D5] px-4 py-2 text-sm">
          Giỏ hàng
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6 md:px-8">
        {/* Menu BrewLite (tiêu đề của nhiệm vụ) */}
        <h1 className="sr-only">Menu BrewLite</h1>

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

        {/* Tiêu đề + tìm kiếm */}
        <section className="mt-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Hôm nay, bạn uống gì?</h2>
            <p className="mt-1 text-sm text-gray-500">
              Pha mới khi bạn đặt. Ngon theo cách bạn thích.
            </p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm món bạn yêu thích..."
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none md:w-80"
          />
        </section>

        {/* Nút lọc (giao diện, chưa lọc được vì bảng Product chưa có cột danh mục) */}
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {["Tất cả", "Trà sữa", "Matcha", "Cà phê", "Trà trái cây"].map(
            (c, i) => (
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