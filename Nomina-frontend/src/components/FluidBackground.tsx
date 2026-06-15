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
            ? "bg-[#c87941]/20"
            : forcedLight
              ? "bg-[#c87941]/10"
              : "bg-[#c87941]/10 dark:bg-[#c87941]/20")
        }
      />
      <div
        className={
          "absolute top-24 -right-24 h-[28rem] w-[28rem] rounded-full blur-3xl " +
          (forcedDark
            ? "bg-[#3d4a66]/20"
            : forcedLight
              ? "bg-[#3d4a66]/12"
              : "bg-[#3d4a66]/12 dark:bg-[#3d4a66]/20")
        }
      />
      <div
        className={
          "absolute bottom-[-10rem] left-1/3 h-[30rem] w-[30rem] rounded-full blur-3xl " +
          (forcedDark
            ? "bg-[#c87941]/12"
            : forcedLight
              ? "bg-[#c87941]/8"
              : "bg-[#c87941]/8 dark:bg-[#c87941]/12")
        }
      />

      {/* Voile / gradient de base */}
      {forcedDark ? <div className="absolute inset-0 bg-gradient-to-b from-[#1a1815] via-transparent to-[#1a1815]" /> : null}
      {forcedLight ? <div className="absolute inset-0 bg-gradient-to-b from-[#f6f3ec] via-[#f6f3ec] to-[#f6f3ec]" /> : null}
      {!forcedDark && !forcedLight ? (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-[#f6f3ec] via-[#f6f3ec] to-[#f6f3ec] dark:hidden" />
          <div className="absolute inset-0 hidden dark:block bg-gradient-to-b from-[#1a1815] via-transparent to-[#1a1815]" />
        </>
      ) : null}
    </div>
  );
}
