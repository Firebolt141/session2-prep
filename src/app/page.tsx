"use client";

import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="page-shell" style={{ minHeight: "100vh" }}>
      <div
        className="card fade-in"
        style={{
          marginTop: "18vh",
          display: "grid",
          gap: 18,
          textAlign: "center",
        }}
      >
        <div>
          <p className="pill peach" style={{ justifyContent: "center" }}>
            Hello Asuka ✨
          </p>
          <h1 style={{ fontSize: "2.4rem", marginTop: 16 }}>
            Let&#39;s plan something cute
          </h1>
          <p className="small-text" style={{ marginTop: 6 }}>
            Sign in to keep all your trips, wishes, and events in one cozy place.
          </p>
        </div>
        <Link href="/home">
          <button className="primary-btn">Let&#39;s go 🌸</button>
        </Link>
      </div>
    </main>
  );
}
