import React from 'react';
import { useAuthSessionStore } from "../../../app/state/authSessionStore";
import logoUrl from "@/assets/logo.jpeg";

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
    const logout = useAuthSessionStore(s => s.actions.logout);
    const email = useAuthSessionStore(s => s.email);

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#F9FAFB", fontFamily: "Inter, -apple-system, sans-serif" }}>
            {/* Topbar */}
            <header style={{ height: "64px", backgroundColor: "#ffffff", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem", position: "sticky", top: 0, zIndex: 10 }}>
                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ height: "36px", borderRadius: "6px", display: "flex", alignItems: "center", overflow: "hidden", border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                        <img src={logoUrl} alt="KALIDEV Logo" style={{ height: "100%", width: "auto", objectFit: "contain" }} />
                    </div>
                </div>

                {/* Right side (User & Logout) */}
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#F5F3FF", border: "1px solid #DDD6FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <i className="pi pi-user" style={{ color: "#3B82F6", fontSize: "0.9rem" }}></i>
                        </div>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#374151" }}>{email || "Mi Cuenta"}</span>
                    </div>
                    <div style={{ width: "1px", height: "24px", backgroundColor: "#E5E7EB" }}></div>
                    <button
                        onClick={logout}
                        style={{
                            background: "none",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            color: "#6B7280",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "6px",
                            transition: "all 0.15s ease"
                        }}
                        onMouseOver={e => { e.currentTarget.style.color = "#DC2626"; e.currentTarget.style.backgroundColor = "#FEF2F2"; }}
                        onMouseOut={e => { e.currentTarget.style.color = "#6B7280"; e.currentTarget.style.backgroundColor = "transparent"; }}
                    >
                        <i className="pi pi-sign-out" style={{ fontSize: "0.85rem" }}></i>
                        Cerrar sesión
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {children}
            </main>
        </div>
    );
};
