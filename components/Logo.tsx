interface Props {
  variant?: 'black' | 'white';
  className?: string;
}

export default function Logo({ variant = 'black', className = 'h-8' }: Props) {
  const src = variant === 'white' ? '/images/logo-white.svg' : '/images/logo-black.svg';
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Autigo" className={className} />
  );
}
