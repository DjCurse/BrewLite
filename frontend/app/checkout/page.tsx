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
  const [method, setMethod] = useState<"WALLET" | "CARD" | "QR_CODE">("WALLET");
  const [promoCode, setPromoCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  
  // Trạng thái cho luồng QR Code
  const [qrGenerated, setQrGenerated] = useState(false);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    setMounted(true);
    setIdempotencyKey(`idem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);
    if (!token) router.replace("/login?redirect=/checkout");
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsLoggedIn(false);
    window.location.href = "/login";
  };

  const totalItems = mounted ? getTotalItems() : 0;
  const subtotal = mounted ? getTotalPrice() : 0;
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

  // --- LOGIC 1: HÀM TẠO MÃ QR ---
  async function handleGenerateQR() {
    setIsGeneratingQr(true);
    setErrorMsg("");
    const token = localStorage.getItem("access_token");

    try {
      let currentOrderId = pendingOrderId;
      // Nếu chưa có đơn PENDING, tạo đơn mới
      if (!currentOrderId) {
        const orderRes = await fetch(`${API_BASE_URL}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.message || "Lỗi tạo đơn hàng.");
        currentOrderId = orderData.id || orderData.order.id;
        setPendingOrderId(currentOrderId);
      }

      // Ép URL đẩy đủ cho điện thoại quét
      const domain = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${domain}/mock-payment?orderId=${currentOrderId}&amount=${finalEstimatedTotal}&token=${token}&idem=${idempotencyKey}&promo=${normalizedPromo}`;
      setQrUrl(url);
      setQrGenerated(true);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsGeneratingQr(false);
    }
  }

  // --- LOGIC 2: ĐỒNG BỘ CROSS-DEVICE (SHORT POLLING) ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    // Chỉ bật quét khi đang ở tab QR Code và mã QR đã được tạo
    if (method === "QR_CODE" && qrGenerated && pendingOrderId) {
      const token = localStorage.getItem("access_token");
      
      interval = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/orders/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok && Array.isArray(data)) {
            // Tìm đơn hàng hiện tại trong danh sách
            const currentOrder = data.find((o: any) => o.id === pendingOrderId);
            // Nếu điện thoại đã thanh toán làm API chuyển status -> PAID
            if (currentOrder && currentOrder.status === "PAID") {
              clearInterval(interval);
              const earnedPoints = Math.floor(currentOrder.total / 10000);
              clearCart();
              // Chuyển máy tính sang trang thành công!
              router.push(
                `/orders?confirmedId=${currentOrder.id}&status=PAID&total=${currentOrder.total}&points=${earnedPoints}`
              );
            }
          }
        } catch (e) {
          // Bỏ qua lỗi mạng chập chờn khi polling
        }
      }, 3000); // Cứ 3 giây quét 1 lần
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [method, qrGenerated, pendingOrderId, router]);

  // --- LOGIC 3: HÀM THANH TOÁN BÌNH THƯỜNG (Cho Nút Xác Nhận) ---
  async function handleConfirmPayment() {
    if (items.length === 0) return;
    setErrorMsg("");
    setIsSubmitting(true);
    const token = localStorage.getItem("access_token");

    try {
      let currentOrderId = pendingOrderId;
      if (!currentOrderId) {
        const orderRes = await fetch(`${API_BASE_URL}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
        const orderData = await orderRes.json();
        if (!orderRes.ok) throw new Error(orderData.message || "Không thể tạo đơn hàng.");
        currentOrderId = orderData.id || orderData.order.id;
        setPendingOrderId(currentOrderId);
      }

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
        }),
      });

      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) throw new Error(paymentData.message || "Thanh toán thất bại.");

      const paidTotal = paymentData.pricing?.finalTotal ?? finalEstimatedTotal;
      const earnedPoints = paymentData.loyalty?.earnedPoints ?? Math.floor(paidTotal / 10000);
      clearCart();
      router.push(`/orders?confirmedId=${currentOrderId}&status=PAID&total=${paidTotal}&points=${earnedPoints}`);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#302a26] flex flex-col">
      <header className="border-b border-[#e9e4db]">
        <div className="mx-auto flex h-[76px] max-w-[1100px] items-center justify-between px-5 md:px-10">
          <Link href="/" className="text-[24px] font-bold tracking-tight text-[#365d49]">♧ BrewLite</Link>
          <div className="flex items-center gap-3">
            <Link href="/cart" className="text-sm font-medium text-[#8d877f] hover:text-[#365d49]">
              ← Quay lại giỏ hàng
            </Link>
            {mounted && (
              isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <Link href="/orders" className="hidden sm:inline-block rounded-full border border-[#365d49] px-3 py-1.5 text-xs font-semibold text-[#365d49] transition hover:bg-[#365d49] hover:text-white">
                    Lịch sử đơn
                  </Link>
                  <button onClick={handleLogout} className="rounded-full bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100">
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <Link href="/login" className="rounded-full bg-[#365d49] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#294a39]">
                  Đăng nhập
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-5 py-8 md:px-10">
        <h1 className="text-3xl font-bold tracking-tight">Thanh toán không tiền mặt</h1>
        <p className="mt-1 text-sm text-[#8d877f]">Chọn phương thức Ví điện tử hoặc Thẻ ngân hàng để hoàn tất đơn.</p>

        {!mounted ? (
          <p className="mt-8 text-sm text-[#8d877f]">Đang tải thông tin thanh toán...</p>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-[#e9e4db] bg-white p-10 text-center">
            <p className="font-semibold">Giỏ hàng trống.</p>
            <Link href="/" className="mt-4 inline-block rounded-xl bg-[#365d49] px-5 py-2.5 text-sm font-semibold text-white">Về thực đơn</Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-[#e9e4db] bg-white p-6">
                <h2 className="text-lg font-bold">1. Chọn phương thức thanh toán</h2>
                <div className="mt-4 space-y-3">
                  <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition ${method === "WALLET" ? "border-[#365d49] bg-[#e5eddf]/60" : "border-[#e9e4db] bg-white"}`}>
                    <input type="radio" checked={method === "WALLET"} onChange={() => setMethod("WALLET")} className="h-4 w-4 accent-[#365d49]" />
                    <div><p className="font-semibold">Ví điện tử (MoMo / VNPay)</p><p className="text-xs text-[#8d877f]">Thanh toán tức thì</p></div>
                  </label>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition ${method === "CARD" ? "border-[#365d49] bg-[#e5eddf]/60" : "border-[#e9e4db] bg-white"}`}>
                    <input type="radio" checked={method === "CARD"} onChange={() => setMethod("CARD")} className="h-4 w-4 accent-[#365d49]" />
                    <div><p className="font-semibold">Thẻ ngân hàng (ATM / Visa)</p><p className="text-xs text-[#8d877f]">Cổng thẻ bảo mật</p></div>
                  </label> 
                  <label className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 transition ${method === "QR_CODE" ? "border-[#365d49] bg-[#e5eddf]/60" : "border-[#e9e4db] bg-white"}`}>
                    <input type="radio" checked={method === "QR_CODE"} onChange={() => { setMethod("QR_CODE"); setQrGenerated(false); }} className="h-4 w-4 accent-[#365d49]" />
                    <div><p className="font-semibold">Quét mã QR (Đồng bộ đa thiết bị)</p><p className="text-xs text-[#8d877f]">Hỗ trợ quét qua camera điện thoại</p></div>
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-[#e9e4db] bg-white p-6">
                <h2 className="text-lg font-bold">2. Mã khuyến mãi (Task 10.4)</h2>
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => { setPromoCode(e.target.value); setQrGenerated(false); }}
                    disabled={qrGenerated}
                    placeholder="Nhập SGU2026, BREWLITE10..."
                    className="flex-1 rounded-xl border border-[#e9e4db] px-4 py-2.5 text-sm uppercase outline-none focus:border-[#365d49] disabled:opacity-50"
                  />
                </div>
              </div>
            </section>

            <aside className="h-fit rounded-3xl border border-[#e9e4db] bg-white p-6">
              <h2 className="text-lg font-bold">Đơn hàng ({totalItems} món)</h2>
              <div className="mt-4 space-y-2.5 border-b border-[#e9e4db] pb-4 text-sm">
                {items.map((item) => (
                  <div key={item.cartItemId} className="flex justify-between">
                    <span className="text-[#5c564f]">{item.name} × {item.qty}</span>
                    <span className="font-semibold">{money(item.lineTotal)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 text-sm border-b border-[#e9e4db] pb-4">
                <div className="flex justify-between text-[#5c564f]"><span>Tạm tính</span><span>{money(subtotal)}</span></div>
                {estimatedDiscount > 0 && <div className="flex justify-between text-[#365d49] font-medium"><span>Giảm giá</span><span>-{money(estimatedDiscount)}</span></div>}
                <div className="flex justify-between pt-2 text-lg font-bold"><span>Tổng thanh toán</span><span className="text-[#365d49]">{money(finalEstimatedTotal)}</span></div>
              </div>

              {errorMsg && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">{errorMsg}</div>} 
              
              {/* VÙNG XỬ LÝ NÚT THANH TOÁN HOẶC QR CODE */}
              {method === "QR_CODE" ? (
                <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#365d49] bg-[#f0f5ed] p-5 text-center">
                  {!qrGenerated ? (
                    <>
                      <p className="mb-4 text-sm text-[#365d49]">Vui lòng chốt mã giảm giá trước khi tạo QR.</p>
                      <button onClick={handleGenerateQR} disabled={isGeneratingQr} className="rounded-xl bg-[#365d49] px-6 py-2.5 font-semibold text-white transition hover:bg-[#294a39] disabled:opacity-60">
                        {isGeneratingQr ? "Đang khởi tạo..." : "Tạo mã QR để quét"}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="mb-3 text-sm font-bold text-[#365d49]">Đang chờ thanh toán...</p>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`} alt="QR" className="h-[150px] w-[150px] rounded-lg mix-blend-multiply" />
                      
                      {typeof window !== "undefined" && window.location.hostname === "localhost" && (
                        <a href={qrUrl} target="_blank" rel="noopener noreferrer" className="mt-3 text-[13px] font-medium text-blue-600 underline hover:text-blue-800">
                          [Dev] Giả lập click để thanh toán
                        </a>
                      )}
                      
                      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#8d877f]">
                        <span className="h-3 w-3 animate-ping rounded-full bg-[#365d49] opacity-75"></span>
                        Hệ thống đang tự động lắng nghe giao dịch
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button type="button" disabled={isSubmitting} onClick={handleConfirmPayment} className="mt-6 min-h-14 w-full rounded-2xl bg-[#365d49] px-4 font-semibold text-white transition hover:bg-[#294a39] disabled:opacity-60">
                  {isSubmitting ? "Đang xử lý giao dịch..." : "Xác nhận trả"}
                </button>
              )}

              <p className="mt-3 text-center text-[11px] text-[#8d877f]">Idempotency: <code>{idempotencyKey}</code></p>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}