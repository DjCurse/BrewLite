"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCartStore } from "../store/useCartStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function money(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, getTotalItems, getTotalPrice } = useCartStore();

  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [method, setMethod] = useState<"WALLET" | "CARD">("WALLET");
  const [promoCode, setPromoCode] = useState("");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    setMounted(true);
    // Sinh sẵn Idempotency-Key duy nhất cho phiên thanh toán này (Task 10.2)
    setIdempotencyKey(`idem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);
    if (!token) {
      router.replace("/login?redirect=/checkout");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsLoggedIn(false);
    window.location.href = "/login";
  };

  const totalItems = mounted ? getTotalItems() : 0;
  const subtotal = mounted ? getTotalPrice() : 0;

  // Ước tính giảm giá trên UI (khớp với loyalty-promo.helper.ts ở Backend)
  const normalizedPromo = promoCode.trim().toUpperCase();
  let estimatedDiscount = 0;
  if (normalizedPromo === "FREESHIP" && subtotal >= 50000) {
    estimatedDiscount = 15000;
  } else if (normalizedPromo === "BREWLITE10" && subtotal >= 40000) {
    estimatedDiscount = Math.min(20000, Math.round(subtotal * 0.1));
  } else if (normalizedPromo === "SGU2026" && subtotal >= 30000) {
    estimatedDiscount = 10000;
  }
  const finalEstimatedTotal = Math.max(0, subtotal - estimatedDiscount);

  async function handleConfirmPayment() {
    if (items.length === 0) return;
    setErrorMsg("");
    setIsSubmitting(true);

    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login?redirect=/checkout");
      return;
    }

    try {
      let currentOrderId = pendingOrderId;

      // Bước 1: Nếu chưa có đơn PENDING thì gọi POST /orders để tạo đơn (Task 6)
      if (!currentOrderId) {
        const orderRes = await fetch(`${API_BASE_URL}/orders`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: items.map((item) => ({
              productId: item.productId,
              size: item.size, 
              topping: item.topping || (Array.isArray(item.toppings) ? item.toppings.join(", ") : null),
              qty: item.qty ?? 1,
              lineTotal: item.lineTotal,
            })),
          }),
        });

        const orderData = await orderRes.json().catch(() => ({}));
        if (!orderRes.ok) {
          throw new Error(
            Array.isArray(orderData.message)
              ? orderData.message.join(" ")
              : orderData.message || "Không thể tạo đơn hàng.",
          );
        }
        currentOrderId = orderData.order ? orderData.order.id : orderData.id;
        setPendingOrderId(currentOrderId);
      }

      // Bước 2: Gọi POST /payments kèm Idempotency-Key (Task 8 & Task 10)
      const paymentRes = await fetch(`${API_BASE_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          orderId: currentOrderId,
          method,
          promoCode: normalizedPromo || undefined,
          simulateFailure,
        }),
      });

      const paymentData = await paymentRes.json().catch(() => ({}));
      if (!paymentRes.ok) {
        throw new Error(
          Array.isArray(paymentData.message)
            ? paymentData.message.join(" ")
            : paymentData.message || "Thanh toán không thành công.",
        );
      }

      // Kiểm tra nếu cổng thanh toán trả về trạng thái PAYMENT_FAILED (US-05)
      if (paymentData.orderStatus === "PAYMENT_FAILED") {
        setIdempotencyKey(`idem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
        setErrorMsg(
          `Đơn hàng #${currentOrderId} đang ở trạng thái PAYMENT_FAILED (Thanh toán lỗi). Giỏ hàng của bạn vẫn được giữ nguyên — bạn có thể tắt chế độ giả lập lỗi và bấm xác nhận lại!`,
        );
        return;
      }

      // Thanh toán thành công (PAID) -> Xóa giỏ hàng và chuyển sang màn hình Xác nhận
      const paidTotal = paymentData.pricing?.finalTotal ?? finalEstimatedTotal;
      const earnedPoints = paymentData.loyalty?.earnedPoints ?? Math.floor(paidTotal / 10000);
      clearCart();
      router.push(
        `/orders?confirmedId=${currentOrderId}&status=${paymentData.orderStatus ?? "PAID"}&total=${paidTotal}&points=${earnedPoints}`,
      );
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Không thể kết nối máy chủ thanh toán.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#302a26] flex flex-col">
      <header className="border-b border-[#e9e4db]">
        <div className="mx-auto flex h-[76px] max-w-[1100px] items-center justify-between px-5 md:px-10">
          <Link href="/" className="text-[24px] font-bold tracking-tight text-[#365d49]">
            ♧ BrewLite
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/cart" className="text-sm font-medium text-[#8d877f] hover:text-[#365d49]">
              ← Quay lại giỏ hàng
            </Link>

            {/* PHẦN KIỂM TRA ĐĂNG NHẬP / ĐĂNG XUẤT ĐỒNG BỘ */}
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
                <Link
                  href="/login"
                  className="rounded-full bg-[#365d49] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#294a39]"
                >
                  Đăng nhập
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 py-8 md:px-10">
        <h1 className="text-3xl font-bold tracking-tight">Thanh toán không tiền mặt</h1>
        <p className="mt-1 text-sm text-[#8d877f]">
          Chọn phương thức Ví điện tử hoặc Thẻ ngân hàng để hoàn tất đơn hàng.
        </p>

        {!mounted ? (
          <p className="mt-8 text-sm text-[#8d877f]">Đang tải thông tin thanh toán...</p>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-[#e9e4db] bg-white p-10 text-center">
            <p className="font-semibold">Giỏ hàng trống, không có đơn cần thanh toán.</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-xl bg-[#365d49] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Về thực đơn
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
            {/* Cột trái: Phương thức thanh toán & Khuyến mãi */}
            <section className="space-y-6">
              <div className="rounded-3xl border border-[#e9e4db] bg-white p-6">
                <h2 className="text-lg font-bold">1. Chọn phương thức thanh toán</h2>
                <div className="mt-4 space-y-3">
                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition ${
                      method === "WALLET"
                        ? "border-[#365d49] bg-[#e5eddf]/60"
                        : "border-[#e9e4db] bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={method === "WALLET"}
                      onChange={() => setMethod("WALLET")}
                      className="h-4 w-4 accent-[#365d49]"
                    />
                    <div>
                      <p className="font-semibold">Ví điện tử (MoMo / VNPay)</p>
                      <p className="text-xs text-[#8d877f]">
                        Thanh toán tức thì không dùng tiền mặt
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition ${
                      method === "CARD"
                        ? "border-[#365d49] bg-[#e5eddf]/60"
                        : "border-[#e9e4db] bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={method === "CARD"}
                      onChange={() => setMethod("CARD")}
                      className="h-4 w-4 accent-[#365d49]"
                    />
                    <div>
                      <p className="font-semibold">Thẻ ngân hàng (ATM / Visa / Master)</p>
                      <p className="text-xs text-[#8d877f]">
                        Cổng thanh toán thẻ bảo mật Idempotent
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e9e4db] bg-white p-6">
                <h2 className="text-lg font-bold">2. Mã khuyến mãi & Điểm thưởng (Task 10.4)</h2>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Nhập SGU2026, BREWLITE10 hoặc FREESHIP"
                    className="flex-1 rounded-xl border border-[#e9e4db] px-4 py-2.5 text-sm uppercase outline-none focus:border-[#365d49]"
                  />
                </div>
                <p className="mt-2 text-xs text-[#8d877f]">
                  Gợi ý mã hợp lệ: <b>SGU2026</b> (giảm 10k đơn từ 30k), <b>BREWLITE10</b> (giảm 10% đơn từ 40k), <b>FREESHIP</b> (giảm 15k đơn từ 50k).
                </p>
              </div>

              {/* Công tắc hỗ trợ Demo kịch bản lỗi thanh toán US-05 */}
              <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-5">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="h-4 w-4 accent-amber-700"
                  />
                  <span className="text-sm font-semibold text-amber-950">
                    [Chế độ Demo US-05] Giả lập cổng thanh toán bị lỗi (PAYMENT_FAILED)
                  </span>
                </label>
                <p className="mt-1 pl-7 text-xs text-amber-800">
                  Khi bật tùy chọn này, đơn hàng sẽ chuyển sang trạng thái <b>PAYMENT_FAILED</b> và giỏ hàng được giữ nguyên để demo cho giảng viên.
                </p>
              </div>
            </section>

            {/* Cột phải: Tóm tắt & Xác nhận trả */}
            <aside className="h-fit rounded-3xl border border-[#e9e4db] bg-white p-6">
              <h2 className="text-lg font-bold">Đơn hàng ({totalItems} món)</h2>
              <div className="mt-4 space-y-2.5 border-b border-[#e9e4db] pb-4 text-sm">
                {items.map((item) => (
                  <div key={item.cartItemId} className="flex justify-between">
                    <span className="text-[#5c564f]">
                      {item.name} ({item.size}) × {item.qty}
                    </span>
                    <span className="font-semibold">{money(item.lineTotal)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between text-[#5c564f]">
                  <span>Tạm tính</span>
                  <span>{money(subtotal)}</span>
                </div>
                {estimatedDiscount > 0 && (
                  <div className="flex justify-between text-[#365d49] font-medium">
                    <span>Giảm giá ({normalizedPromo})</span>
                    <span>-{money(estimatedDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#e9e4db] pt-3 text-lg font-bold">
                  <span>Tổng thanh toán</span>
                  <span className="text-[#365d49]">{money(finalEstimatedTotal)}</span>
                </div>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs leading-5 text-red-800"
                >
                  {errorMsg}
                </div>
              )}

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmPayment}
                className="mt-6 min-h-14 w-full rounded-2xl bg-[#365d49] px-4 font-semibold text-white transition hover:bg-[#294a39] disabled:opacity-60"
              >
                {isSubmitting ? "Đang xử lý giao dịch..." : "Xác nhận trả"}
              </button>

              <p className="mt-3 text-center text-[11px] text-[#8d877f]">
                Idempotency-Key: <code>{idempotencyKey}</code>
              </p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}