interface ProgressiveBlurProps {
  className?: string;
  direction?: "left" | "right";
  blurIntensity?: number;
}

export const ProgressiveBlur = ({ className, direction = "left" }: ProgressiveBlurProps) => {
  const gradient = direction === "left" 
    ? 'linear-gradient(to right, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)'
    : 'linear-gradient(to left, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 100%)';
    
  return (
    <div className={className} style={{
      background: gradient,
      maskImage: 'linear-gradient(to bottom, black, black)' // mask shouldn't be needed if background is gradient, but keeping simple
    }}></div>
  );
};
