"use client";

import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="page-shell" style={{ minHeight: "100vh" }}>
      <div
        className="card fade-in"
        style={{ marginTop: "18vh", display: "grid", gap: 18 }}
      >
        <div>
          <p className="pill peach">Hello Asuka ✨</p>
          <h1 style={{ fontSize: "2.2rem", marginTop: 12 }}>
            Welcome back
          </h1>
          <p className="small-text" style={{ marginTop: 6 }}>
            Sign in to keep all your trips, wishes, and events in one cozy place.
          </p>
        </div>
        <label style={{ display: "grid", gap: 8 }}>
          Email
          <input placeholder="asuka@dreamy.com" type="email" />
        </label>
        <label style={{ display: "grid", gap: 8 }}>
          Password
          <input placeholder="••••••••" type="password" />
        </label>
        <Link href="/home">
          <button className="primary-btn">Go to home</button>
        </Link>
      </div>
    </main>
  );
}
