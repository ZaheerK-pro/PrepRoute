import { Link } from 'react-router-dom';

interface BrandLogoProps {
  to?: string;
  className?: string;
}

export function BrandLogo({ to = '/dashboard', className = '' }: BrandLogoProps) {
  const img = (
    <img src="/mark.png" alt="PrepRoute" className={`brand-logo ${className}`} />
  );

  if (to === '') {
    return img;
  }

  return (
    <Link to={to} className="brand-logo-link">
      {img}
    </Link>
  );
}
