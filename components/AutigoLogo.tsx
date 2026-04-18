interface Props {
  className?: string;
}

export default function AutigoLogo({ className = 'h-24 sm:h-28' }: Props) {
  return (
    <svg
      viewBox="0 0 380 130"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
      aria-label="Autigo"
    >
      <text fontWeight="700" fontSize="92" letterSpacing="-10">
        <tspan x="5" y="90" fill="#4E92F5">A</tspan>
        <tspan y="90" fill="#E8620A">u</tspan>
        <tspan y="90" fill="#F4B400">t</tspan>
        <tspan y="90" fill="#92c522">i</tspan>
        <tspan y="90" fill="#4E92F5">g</tspan>
        <tspan y="90" fill="#E8620A">o</tspan>
      </text>
    </svg>
  );
}
