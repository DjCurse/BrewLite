"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCartStore } from "../store/useCartStore";
import { useCheckout } from "../../src/lib/checkout";

function money(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

export default function CartPage() {
  const { placeOrder, loading, error } = useCheckout();
  const { items, updateQty, removeFromCart, clearCart, getTotalItems, getTotalPrice } =
    useCartStore();

  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Kiểm tra token đăng nhập trong localStorage
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsLoggedIn(false);
    window.location.href = "/login";
  };

  const totalItems = mounted ? getTotalItems() : 0;
  const totalPrice = mounted ? getTotalPrice() : 0;

  async function handleProceedToCheckout() {
    if (items.length === 0) return;

    const token =
      typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    if (!token) {
      router.push("/login?redirect=/checkout");
    } else {
      router.push("/checkout");
    }
  }

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
            <Link href="/" className="text-[#8d877f] hover:text-[#302a26] transition">
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
            <Link
              href="/cart"
              className="flex items-center gap-2 rounded-full bg-[#365d49] px-3.5 py-2 text-sm font-medium text-white transition"
            >
              <span aria-hidden="true">▣</span>
              <span className="hidden md:inline">Giỏ hàng</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#365d49]">
                {totalItems}
              </span>
            </Link>

            {/* PHẦN KIỂM TRA ĐĂNG NHẬP / ĐĂNG XUẤT ĐỒNG BỘ VỚI PAGE CHÍNH */}
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
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 pb-16 pt-8 md:px-10 md:pb-20">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-[#8d877f] hover:text-[#365d49]">
              ← Tiếp tục chọn món
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Giỏ hàng của bạn
            </h1>
          </div>

          {mounted && items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm font-medium text-red-700 hover:underline"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {!mounted ? (
          <div className="rounded-3xl border border-[#e9e4db] bg-white p-10 text-center text-sm text-[#8d877f]">
            Đang tải giỏ hàng...
          </div>
        ) : items.length === 0 ? (
          /* TRẠNG THÁI GIỎ HÀNG TRỐNG */
          <div className="rounded-3xl border border-[#e9e4db] bg-white py-16 px-6 text-center">
            <p className="text-4xl">☕</p>
            <h2 className="mt-4 text-xl font-bold text-[#302a26]">
              Giỏ hàng đang trống
            </h2>
            <p className="mt-2 text-sm text-[#8d877f]">
              Bạn chưa chọn món đồ uống nào. Hãy ghé thực đơn chọn một ly thật tươi nhé!
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-2xl bg-[#365d49] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#294a39]"
            >
              Xem thực đơn ngay
            </Link>
          </div>
        ) : (
          /* DANH SÁCH MÓN & BẢNG TỔNG TIỀN */
          <div className="grid gap-8 lg:grid-cols-[1.55fr_0.85fr]">
            {/* Cột trái: Danh sách món trong giỏ */}
            <section className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex flex-col gap-4 rounded-3xl border border-[#e9e4db] bg-white p-4 sm:flex-row sm:items-center sm:justify-between md:p-5"
                >
                  <div className="flex items-center gap-4">
                    <Link
                      href={`/products/${item.productId}`}
                      className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#f3efe7]"
                    >
                      <div
                        role="img"
                        aria-label={item.name}
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url("${item.imageUrl}")` }}
                      />
                    </Link>

                    <div>
                      <Link href={`/products/${item.productId}`}>
                        <h3 className="text-lg font-bold text-[#302a26] hover:text-[#365d49]">
                          {item.name}
                        </h3>
                      </Link>
                      <p className="mt-1 text-xs font-medium text-[#5c564f]">
                        Size <span className="font-bold">{item.size}</span>
                        {item.toppings && item.toppings.length > 0
                          ? ` · Topping: ${item.toppings.join(", ")}`
                          : item.topping && item.topping !== "Không"
                          ? ` · Topping: ${item.topping}`
                          : " · Không thêm topping"}
                      </p>
                      <p className="mt-1 text-xs text-[#8d877f]">
                        Đơn giá: {money(item.unitPrice)} / ly
                      </p>
                    </div>
                  </div>

                  {/* Cụm điều chỉnh số lượng +/-, thành tiền và xóa */}
                  <div className="flex items-center justify-between border-t border-[#f0ece3] pt-3 sm:border-t-0 sm:pt-0 sm:gap-6">
                    <div className="flex items-center rounded-xl border border-[#e9e4db] bg-[#faf8f3]">
                      <button
                        type="button"
                        onClick={() => updateQty(item.cartItemId, item.qty - 1)}
                        className="h-9 w-9 text-lg font-bold text-[#302a26] transition hover:bg-[#e5eddf] rounded-l-xl"
                        aria-label="Giảm số lượng"
                      >
                        −
                      </button>
                      <span className="w-9 text-center text-sm font-semibold">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.cartItemId, item.qty + 1)}
                        className="h-9 w-9 text-lg font-bold text-[#302a26] transition hover:bg-[#e5eddf] rounded-r-xl"
                        aria-label="Tăng số lượng"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right min-w-[95px]">
                      <p className="text-base font-bold text-[#365d49]">
                        {money(item.lineTotal)}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="mt-1 text-xs text-[#8d877f] hover:text-red-600 transition"
                      >
                        Xóa món
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </section>

            {/* Cột phải: Tóm tắt đơn hàng & Nút Thanh toán */}
            <aside className="h-fit rounded-3xl border border-[#e9e4db] bg-white p-6">
              <h2 className="text-lg font-bold text-[#302a26]">
                Tóm tắt đơn hàng
              </h2>

              <div className="mt-4 space-y-3 border-b border-[#e9e4db] pb-4 text-sm">
                {items.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex items-start justify-between gap-2 text-[#5c564f]"
                  >
                    <span>
                      {item.name} ({item.size}) × {item.qty}
                    </span>
                    <span className="font-medium text-[#302a26]">
                      {money(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-base font-semibold text-[#302a26]">
                  Tổng cộng ({totalItems} món)
                </span>
                <span className="text-2xl font-bold text-[#365d49]">
                  {money(totalPrice)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleProceedToCheckout}
                disabled={loading}
                className="mt-6 min-h-14 w-full rounded-2xl bg-[#365d49] px-4 text-base font-semibold text-white transition hover:bg-[#294a39] disabled:opacity-60"
              >
                {loading ? "Đang xử lý..." : `Thanh toán (${money(totalPrice)})`}
              </button>
              {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}

              <Link
                href="/"
                className="mt-3 block w-full rounded-2xl border border-[#e9e4db] py-3 text-center text-sm font-semibold text-[#302a26] transition hover:bg-[#faf8f3]"
              >
                + Thêm sản phẩm khác
              </Link>

              <p className="mt-4 text-center text-xs text-[#8d877f]">
                Thanh toán không tiền mặt qua Ví điện tử hoặc Thẻ ngân hàng.
              </p>
            </aside>
          </div>
        )}
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