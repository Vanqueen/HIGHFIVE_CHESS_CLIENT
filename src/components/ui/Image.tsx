interface Props {
  src: string;
  alt: string;
  className?: string; // On utilise className pour Tailwind
}

export default function CustomImage({ src, alt, className }: Props) {
  return (
    <div className={className} style={{ position: "relative" }}>
      <img
        src={src}
        alt={alt}
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-110 ${className ?? ""}`}
        sizes="(max-width: 768px) 100vw, 33vw"
      />
    </div>
  );
}
