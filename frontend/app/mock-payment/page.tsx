"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function money(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function MockPaymentContent() {
  const searchParams = useSearchParams();
  const amount = parseInt(searchParams.get("amount") || "0", 10);
  const orderId = parseInt(searchParams.get("orderId") || "0", 10);
  const token = searchParams.get("token") || "";
  const idem = searchParams.get("idem") || "";
  const promo = searchParams.get("promo") || "";

  const [isPaying, setIsPaying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setIsPaying(true);
    setError("");

    try {
      // Bắn API thanh toán trực tiếp về Backend NestJS từ thiết bị điện thoại
      const res = await fetch(`${API_BASE_URL}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": idem,
        },
        body: JSON.stringify({
          orderId,
          method: "QR_CODE",
          promoCode: promo || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message.join(" ") : data.message || "Thanh toán thất bại"
        );
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPaying(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f4f4] p-4 text-[#333]">
        <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-600">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-green-700">Thanh toán thành công!</h1>
          <p className="mt-2 text-gray-500">
            Bạn có thể đóng tab này. Màn hình máy tính sẽ tự động chuyển hướng trong giây lát.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f4f4] p-4 text-[#333]">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-[#A50064] p-6 text-center text-white">
          <h1 className="text-2xl font-bold tracking-wider">CỔNG THANH TOÁN</h1>
          <p className="mt-1 text-sm opacity-80">Giao diện giả lập đồ án BrewLite</p>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center border-b border-gray-100 pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl">☕</div>
            <h2 className="mt-4 text-lg font-semibold">Thanh toán hóa đơn #{orderId}</h2>
            <p className="mt-2 text-3xl font-bold text-[#A50064]">{money(amount)}</p>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <div className="mt-8 space-y-3">
            <button
              onClick={handleConfirm}
              disabled={isPaying}
              className="w-full rounded-xl bg-[#A50064] py-3.5 font-bold text-white transition hover:bg-[#80004c] disabled:opacity-50"
            >
              {isPaying ? "Đang xử lý..." : `Xác nhận chuyển ${money(amount)}`}
            </button>
            <button
              onClick={() => window.close()}
              className="w-full rounded-xl border border-gray-200 bg-white py-3.5 font-semibold text-gray-600 transition hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MockPaymentPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Đang tải...</div>}>
      <MockPaymentContent />
    </Suspense>
  );
}