"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type OrderItemDto = {
  id: number;
  productId: number;
  size: string;
  qty: number;
  lineTotal: number;
  product?: { name: string };
};

type OrderDto = {
  id: number;
  status: string;
  total: number;
  createdAt: string;
  items?: OrderItemDto[];
};

function money(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const confirmedId = searchParams.get("confirmedId");
  const confirmedStatus = searchParams.get("status") ?? "PAID";
  const confirmedTotal = Number(searchParams.get("total") ?? 0);
  const earnedPoints = Number(searchParams.get("points") ?? 0);

  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setLoading(false);
      setError("Vui lòng đăng nhập để xem lịch sử đơn hàng.");
      return;
    }

    fetch(`${API_BASE_URL}/orders/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Không tải được lịch sử đơn (${res.status})`);
        return res.json() as Promise<OrderDto[]>;
      })
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Lỗi kết nối máy chủ");
        setLoading(false);
      });
  }, []);

  return (
    <main className="mx-auto w-full max-w-[1000px] flex-1 px-5 py-10 md:px-10">
      {/* Khung xác nhận đơn hàng vừa đặt (Wireframe số 5) */}
      {confirmedId && (
        <section className="mb-10 rounded-3xl border-2 border-[#365d49] bg-[#e5eddf]/60 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#365d49] text-2xl text-white">
            ✓
          </div>
          <h1 className="mt-4 text-3xl font-bold text-[#302a26]">
            Đặt hàng thành công
          </h1>
          <p className="mt-2 text-sm text-[#5c564f]">
            Mời bạn tới quầy nhận đồ uống khi trạng thái chuyển sang READY.
          </p>

          <div className="mx-auto mt-6 flex max-w-md flex-col gap-2 rounded-2xl bg-white p-5 text-sm shadow-sm">
            <div className="flex justify-between">
              <span className="text-[#8d877f]">Mã đơn:</span>
              <span className="font-bold text-[#302a26]">#{confirmedId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8d877f]">Trạng thái:</span>
              <span className="rounded-full bg-[#365d49] px-3 py-0.5 text-xs font-bold text-white">
                {confirmedStatus}
              </span>
            </div>
            {confirmedTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-[#8d877f]">Đã thanh toán:</span>
                <span className="font-bold text-[#365d49]">{money(confirmedTotal)}</span>
              </div>
            )}
            {earnedPoints > 0 && (
              <div className="flex justify-between border-t border-[#e9e4db] pt-2 text-[#365d49]">
                <span>Điểm thưởng tích lũy (Loyalty):</span>
                <span className="font-bold">+{earnedPoints} điểm</span>
              </div>
            )}
          </div>

          <Link
            href="/"
            className="mt-6 inline-block rounded-2xl bg-[#365d49] px-6 py-3 text-sm font-semibold text-white hover:bg-[#294a39]"
          >
            Về trang chủ
          </Link>
        </section>
      )}

      {/* Danh sách lịch sử đơn hàng (GET /orders/me - Task 9) */}
      <section>
        <h2 className="text-2xl font-bold">Lịch sử đơn hàng của tôi</h2>
        {loading ? (
          <p className="mt-4 text-sm text-[#8d877f]">Đang tải lịch sử đơn hàng...</p>
        ) : error ? (
          <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{error}</p>
        ) : orders.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-[#e9e4db] bg-white p-8 text-center text-sm text-[#8d877f]">
            Bạn chưa có đơn hàng nào.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e9e4db] bg-white p-5 sm:flex-row sm:items-center"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold">Đơn #{order.id}</span>
                    <span className="rounded-full bg-[#e5eddf] px-3 py-0.5 text-xs font-bold text-[#365d49]">
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#8d877f]">
                    Thời gian: {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-[#365d49]">{money(order.total)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function OrdersPage() {
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("access_token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setIsLoggedIn(false);
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#302a26] flex flex-col">
      <header className="border-b border-[#e9e4db]">
        <div className="mx-auto flex h-[76px] max-w-[1000px] items-center justify-between px-5 md:px-10">
          <Link href="/" className="text-[24px] font-bold tracking-tight text-[#365d49]">
            ♧ BrewLite
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm font-medium text-[#8d877f] hover:text-[#365d49]">
              ← Quay lại thực đơn
            </Link>

            {/* Đồng bộ trạng thái Đăng nhập / Đăng xuất */}
            {mounted && (
              isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-red-50 border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                >
                  Đăng xuất
                </button>
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

      <Suspense fallback={<p className="p-10 text-center text-sm">Đang tải...</p>}>
        <OrdersContent />
      </Suspense>
    </div>
  );
}