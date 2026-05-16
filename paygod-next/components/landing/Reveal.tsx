import * as React from "react";

export const Reveal: React.FC<React.HTMLAttributes<HTMLDivElement> & { delay?: number }> = ({
  children,
  delay = 0,
  className = "",
  style,
  ...props
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  // Default to visible so SSR / no-IO environments still render content.
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    setVisible(false);
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </div>
  );
};
