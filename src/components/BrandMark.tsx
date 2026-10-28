export function BrandMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z" stroke="#E2A63B" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M16 10.5h1.5a2 2 0 0 1 0 4H16" stroke="#E2A63B" strokeWidth="1.6" />
      <ellipse cx="10.5" cy="20" rx="7" ry="1.4" fill="#ECEDE6" />
      <path d="M8 3.5c0 1-1 1-1 2M11 3c0 1-1 1-1 2" stroke="#ECEDE6" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
