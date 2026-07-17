import logoImg from "../assets/logo.png";

export default function Logo({ size = "md", showWordmark = true, className = "" }) {
  const dims = { sm: 28, md: 36, lg: 56 }[size] || 36;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src={logoImg}
        alt="LunaFlow"
        width={dims}
        height={dims}
        className="rounded-full object-cover"
        style={{ width: dims, height: dims }}
      />
      {showWordmark && (
        <span className="font-display text-xl font-semibold text-wine">
          LunaFlow
        </span>
      )}
    </div>
  );
}
