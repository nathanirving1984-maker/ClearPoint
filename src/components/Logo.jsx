export default function Logo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="2" y="2" width="52" height="52" rx="14" fill="#185FA5" />
      <path d="M17 32 L28 20 L39 32" stroke="#E6F1FB" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="28" cy="34.5" r="3.4" fill="#E6F1FB" />
    </svg>
  );
}
