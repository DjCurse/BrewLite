"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SubmitEvent } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type AuthResponse = { access_token?: string; message?: string | string[] };

function getErrorMessage(body: AuthResponse, fallback: string) {
  if (Array.isArray(body.message)) return body.message.join(" ");
  return body.message || fallback;
}

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            { email: email.trim(), password },
          ),
        },
      );
      const body = (await response.json().catch(() => ({}))) as AuthResponse;

      if (!response.ok) {
        const fallback = isRegister
          ? "Đăng ký thất bại. Vui lòng kiểm tra thông tin và thử lại."
          : response.status === 401 || response.status === 403
            ? "Email hoặc mật khẩu không chính xác. Vui lòng thử lại."
            : "Đăng nhập thất bại. Vui lòng thử lại.";
        const message = getErrorMessage(body, fallback);
        throw new Error(message.toLowerCase() === "unauthorized" ? fallback : message);
      }

      if (isRegister) {
        setIsRegister(false);
        setPassword("");
        setError("");
        return;
      }

      if (!body.access_token) {
        throw new Error("API đăng nhập không trả về access_token.");
      }

      localStorage.setItem("access_token", body.access_token);
      const requestedRedirect = new URLSearchParams(window.location.search).get("redirect");
      const redirect = requestedRedirect?.startsWith("/") && !requestedRedirect.startsWith("//")
        ? requestedRedirect
        : "/";
      router.replace(redirect);
    } catch (submitError) {
      setError(
        submitError instanceof TypeError
          ? "Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend rồi thử lại."
          : submitError instanceof Error
            ? submitError.message
            : "Đăng nhập thất bại. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function switchMode() {
    setIsRegister((current) => !current);
    setError("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf8f3] px-5 py-10 text-[#302a26]">
      <section className="w-full max-w-md rounded-3xl border border-[#e9e4db] bg-white p-7 shadow-sm sm:p-10">
        <Link href="/" className="text-2xl font-bold tracking-tight text-[#365d49]">
          BrewLite
        </Link>
        <p className="mt-7 text-sm font-semibold uppercase tracking-widest text-[#8d877f]">
          Chào mừng bạn
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          {isRegister ? "Tạo tài khoản" : "Đăng nhập"}
        </h1>
        <p className="mt-2 text-sm text-[#777168]">
          {isRegister
            ? "Đăng ký để lưu lại những món uống yêu thích."
            : "Đăng nhập để tiếp tục đặt món tại BrewLite."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-[#e9e4db] px-4 py-3 outline-none transition focus:border-[#365d49]"
              placeholder="ban@email.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium">Mật khẩu</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[#e9e4db] px-4 py-3 outline-none transition focus:border-[#365d49]"
              placeholder="Ít nhất 6 ký tự"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-[#365d49] px-4 py-3.5 font-semibold text-white transition hover:bg-[#294a39] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Đang xử lý..." : isRegister ? "Đăng ký" : "Đăng nhập"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#777168]">
          {isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"}{" "}
          <button type="button" onClick={switchMode} className="font-semibold text-[#365d49] hover:underline">
            {isRegister ? "Đăng nhập" : "Đăng ký ngay"}
          </button>
        </p>
        <Link href="/" className="mt-6 block text-center text-sm text-[#8d877f] hover:text-[#365d49]">
          ← Quay lại thực đơn
        </Link>
      </section>
    </main>
  );
}
