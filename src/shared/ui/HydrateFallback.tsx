export function HydrateFallback() {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200 }}>
            <span style={{ fontSize: 24, color: "#888" }}>⏳</span>
            <span style={{ marginTop: 8, color: "#888" }}>Cargando vista...</span>
        </div>
    );
}
