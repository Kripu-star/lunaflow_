import waveImg from "../assets/wave-background.png";

export default function WaveBackground({ className = "" }) {
  return (
    <img
      src={waveImg}
      alt=""
      className={`absolute bottom-0 left-0 w-full object-cover pointer-events-none ${className}`}
    />
  );
}
