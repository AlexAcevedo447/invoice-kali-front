import { Navigate } from "react-router-dom";
import { useAuthSessionStore } from "../../../../app/state/authSessionStore";
import type { AuthSessionState } from "../../../../app/state/authSessionStore";
import { LoginForm } from "../forms/LoginForm";
import { resolveHomeRoute } from "@app/routing/access";
import logoUrl from "@/assets/logo.jpeg";

export const LoginPage = () => {
    const hasHydrated = useAuthSessionStore((s: AuthSessionState) => s.hasHydrated);
    const status = useAuthSessionStore((s: AuthSessionState) => s.status);
    const roles = useAuthSessionStore((s: AuthSessionState) => s.roles);
    const permissions = useAuthSessionStore((s: AuthSessionState) => s.permissions);

    if (!hasHydrated) {
        return (
            <main className="flex align-items-center justify-content-center min-h-screen" style={{ backgroundColor: "#F0F9FF" }}>
                <i className="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
            </main>
        );
    }

    if (status === "authenticated") {
        const homeRoute = resolveHomeRoute(roles, permissions);
        if (homeRoute) {
            return <Navigate to={homeRoute} replace />;
        }

        return <main className="flex align-items-center justify-content-center min-h-screen">Tu usuario no tiene permisos asignados para ingresar.</main>;
    }

    return (
        <main className="flex min-h-screen" style={{ backgroundColor: "#ffffff", fontFamily: "Inter, -apple-system, sans-serif" }}>
            {/* Left Side - Banner */}
            <div className="hidden lg:flex flex-column justify-content-center align-items-start p-8" style={{ width: "50%", background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)", position: "relative", overflow: "hidden" }}>
                {/* Decorative background elements */}
                <div style={{ position: "absolute", top: "-10%", right: "-10%", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)" }}></div>
                <div style={{ position: "absolute", bottom: "-10%", left: "-10%", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%)" }}></div>
                
                <div style={{ position: "relative", zIndex: 1, maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}>
                    <div className="flex align-items-center mb-6 text-white">
                        <div className="flex align-items-center justify-content-center w-3rem h-3rem border-round-lg bg-white mr-3 overflow-hidden">
                            <img src={logoUrl} alt="InvoiceKali Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <span className="text-4xl font-bold tracking-tight">InvoiceKali</span>
                    </div>
                    <h1 className="text-5xl font-bold text-white mb-4 line-height-2" style={{ letterSpacing: "-0.02em" }}>
                        La plataforma que impulsa el crecimiento de tu negocio
                    </h1>
                    <p className="text-xl text-white mb-6 line-height-3" style={{ opacity: 0.9 }}>
                        Automatiza tu facturación, mantén tus cuentas al día y toma decisiones basadas en datos reales.
                    </p>
                    
                    <div className="flex align-items-center mt-6 p-4 border-round-xl" style={{ backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
                        <div className="flex -space-x-2 mr-4">
                            <div className="w-2rem h-2rem border-circle bg-white flex align-items-center justify-content-center border-2 border-primary" style={{ zIndex: 3 }}><i className="pi pi-user text-primary text-xs"></i></div>
                            <div className="w-2rem h-2rem border-circle bg-gray-200 flex align-items-center justify-content-center border-2 border-primary" style={{ zIndex: 2, marginLeft: "-0.5rem" }}><i className="pi pi-user text-gray-500 text-xs"></i></div>
                            <div className="w-2rem h-2rem border-circle bg-gray-300 flex align-items-center justify-content-center border-2 border-primary" style={{ zIndex: 1, marginLeft: "-0.5rem" }}><i className="pi pi-user text-gray-600 text-xs"></i></div>
                        </div>
                        <span className="text-white font-medium" style={{ opacity: 0.9 }}>Tus facturas a un Click</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-6 flex flex-column align-items-center justify-content-center p-4 lg:p-8 relative">
                {/* Mobile Logo */}
                <div className="lg:hidden flex align-items-center mb-6 absolute top-0 mt-6">
                    <div className="flex align-items-center justify-content-center w-3rem h-3rem border-round-lg mr-3 shadow-1 overflow-hidden" style={{ backgroundColor: "white" }}>
                        <img src={logoUrl} alt="InvoiceKali Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <span className="text-3xl font-bold text-gray-900 tracking-tight">InvoiceKali</span>
                </div>

                <div className="w-full" style={{ maxWidth: "400px" }}>
                    <div className="mb-6">
                        <h2 className="text-3xl font-bold text-gray-900 m-0 mb-2 tracking-tight">Inicio de sesión</h2>
                        <p className="text-gray-600 m-0 text-base">
                            ¿Aún no tienes una cuenta? <a href="#" className="font-semibold transition-colors" style={{ color: "#0066FF", textDecoration: "none" }} onMouseOver={e => e.currentTarget.style.color = "#2563EB"} onMouseOut={e => e.currentTarget.style.color = "#0066FF"}>Créala aquí</a>
                        </p>
                    </div>

                    <LoginForm />
                </div>
            </div>
        </main>
    );
};
