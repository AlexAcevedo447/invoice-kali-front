import "./DeferredComponentFallback.css";

interface DeferredComponentFallbackProps {
    fullscreen?: boolean;
}

export function DeferredComponentFallback({ fullscreen }: DeferredComponentFallbackProps) {
    return (
        <div
            className={`deferred-fallback${fullscreen ? " deferred-fallback--fullscreen" : ""}`}
            role="status"
            aria-live="polite"
            aria-busy="true"
        >
            <div className="deferred-fallback__animation" aria-hidden="true">
                <div className="deferred-fallback__orb" />
            </div>
            <span className="deferred-fallback__text">Cargando…</span>
        </div>
    );
}
