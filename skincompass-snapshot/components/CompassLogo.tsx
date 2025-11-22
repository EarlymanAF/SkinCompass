// components/CompassLogo.tsx
type Props = {
  size?: number;            // Pixelgröße
  ringColor?: string;       // Außenring
  northColor?: string;      // obere (Nord) Spitze
  southColor?: string;      // untere (Süd) Spitze
};

export default function CompassLogo({
  size = 40,
  ringColor = "#333333",
  northColor = "#e63946",
  southColor = "#1d1f21",
}: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label="SkinCompass Logo"
      role="img"
      className="block"
    >
      {/* äußerer Ring */}
      <circle cx="50" cy="50" r="45" stroke={ringColor} strokeWidth="6" fill="none" />

      {/* Nadel: Grundstellung = 45° (Nordost); Hover = 135° */}
      <g
        id="needle"
        className="origin-center transition-transform duration-500 rotate-[45deg] group-hover:rotate-[135deg]"
      >
        {/* Oberes Dreieck (rot) — Spitze nach oben */}
        <polygon points="50,10 60,50 50,50 40,50" fill={northColor} />
        {/* Unteres Dreieck (dunkel) — Spitze nach unten */}
        <polygon points="50,90 60,50 50,50 40,50" fill={southColor} />
      </g>

      {/* Mittel-Pin */}
      <circle cx="50" cy="50" r="4.5" fill={ringColor} />
    </svg>
  );
}