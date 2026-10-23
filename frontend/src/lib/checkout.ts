"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "http://localhost:3001";
export const TOKEN_KEY = "access_token"; // phải trùng với key Trâm lưu ở trang đăng nhập

export type CheckoutItem = { productId: number; size: string; qty: number };

export function useCheckout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function placeOrder(items: CheckoutItem[]) {
    setError("");

    // 1. Chưa đăng nhập -> chuyển sang /login
    let token: string | null = null;
    try {
      token = localStorage.getItem(TOKEN_KEY);
    } catch {}
    if (!token) {
      router.push("/login");
      return null;
    }

    if (items.length === 0) {
      setError("Giỏ hàng đang trống");
      return null;
    }

    // 2. Đã đăng nhập -> gọi POST /orders kèm Bearer token
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      if (res.status === 401) {
        // token hết hạn hoặc sai -> đăng nhập lại
        localStorage.removeItem(TOKEN_KEY);
        router.push("/login");
        return null;
      }
      if (!res.ok) throw new Error("Đặt đơn thất bại");

      return await res.json(); // đơn PENDING, có id (mã đơn)
    } catch {
      setError("Không đặt được đơn, vui lòng thử lại.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { placeOrder, loading, error };
}