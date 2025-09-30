import Link from 'next/link';

const Logo = () => {
  return (
    <Link
      href="/"
      className="text-2xl font-bold italic hover:tracking-wide duration-300"
    >
      DJDB
    </Link>
  );
}

export default Logo