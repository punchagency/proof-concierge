interface SearchProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function Search({ className, style }: SearchProps) {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 25 25"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      <path
        d="M21.1166 21.1637L16.7766 16.8237"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16.7735 5.50696C19.8977 8.63115 19.8977 13.6965 16.7735 16.8207C13.6494 19.9449 8.58403 19.9449 5.45984 16.8207C2.33565 13.6965 2.33565 8.63115 5.45984 5.50696C8.58403 2.38277 13.6494 2.38277 16.7735 5.50696"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
} 