type FluidBackgroundProps = {
  variant?: "light" | "dark" | "auto";
};

export function FluidBackground({ variant = "auto" }: FluidBackgroundProps) {
  const forcedLight = variant === "light";
  const forcedDark = variant === "dark";

  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Orbes */}
      <div
        className={
          "absolute -top-24 -left-24 h-96 w-96 rounded-full blur-3xl " +
          (forcedDark
            ? "bg-[#7b3ff2]/25"
            : forcedLight
              ? "bg-[#7b3ff2]/12"
              : "bg-[#7b3ff2]/12 dark:bg-[#7b3ff2]/25")
        }
      />
      <div
        className={
          "absolute top-24 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl " +
          (forcedDark
            ? "bg-[#e8b4f0]/20"
            : forcedLight
              ? "bg-[#e8b4f0]/14"
              : "bg-[#e8b4f0]/14 dark:bg-[#e8b4f0]/20")
        }
      />
      <div
        className={
          "absolute bottom-[-10rem] left-1/3 h-[30rem] w-[30rem] rounded-full blur-3xl " +
          (forcedDark
            ? "bg-[#a67be8]/18"
            : forcedLight
              ? "bg-[#a67be8]/12"
              : "bg-[#a67be8]/12 dark:bg-[#a67be8]/18")
        }
      />

      {/* Voile / gradient de base */}
      {forcedDark ? <div className="absolute inset-0 bg-gradient-to-b from-[#1a0f33] via-transparent to-[#1a0f33]" /> : null}
      {forcedLight ? <div className="absolute inset-0 bg-gradient-to-b from-[#f8f6fc] via-white to-[#f8f6fc]" /> : null}
      {!forcedDark && !forcedLight ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#f8f6fc] via-white to-[#f8f6fc] dark:hidden" />
          <div className="absolute inset-0 hidden dark:block bg-gradient-to-b from-[#1a0f33] via-transparent to-[#1a0f33]" />
        </>
      ) : null}
    </div>
  );
}
