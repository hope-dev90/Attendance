export default function Footer() {
  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 16,
      fontSize: 10,
      fontWeight: 700,
      color: '#94a3b8',
      letterSpacing: '0.05em',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      pointerEvents: 'none',
      zIndex: 50,
      userSelect: 'none',
    }}>
      Maintained by Team Éclat
    </div>
  );
}
