"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type ControlledGifProps = Readonly<{
  alternativeText: string;
  animationPath: string;
  height: number;
  posterPath: string;
  title?: string;
  width: number;
}>;

const subscribeToHydration = () => () => {};

export function ControlledGif({
  alternativeText,
  animationPath,
  height,
  posterPath,
  title,
  width,
}: ControlledGifProps) {
  const interactive = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [playing, setPlaying] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stopForReducedMotion = (event: MediaQueryListEvent) => {
      if (event.matches) setPlaying(false);
    };
    reducedMotion.addEventListener("change", stopForReducedMotion);
    return () =>
      reducedMotion.removeEventListener("change", stopForReducedMotion);
  }, []);

  return (
    <span
      aria-label={`GIF demonstration: ${alternativeText}`}
      className="content-media content-media--gif"
      role="group"
    >
      {posterFailed ? (
        <span
          aria-label={alternativeText}
          className="content-media__fallback"
          role="img"
        >
          Image unavailable: {alternativeText}
        </span>
      ) : (
        // The unoptimized element is intentional: playback must preserve GIF frames.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={alternativeText}
          decoding="async"
          height={height}
          loading="lazy"
          onError={() => {
            if (playing) setPlaying(false);
            else setPosterFailed(true);
          }}
          src={playing ? animationPath : posterPath}
          title={title}
          width={width}
        />
      )}
      {interactive ? (
        <span className="content-media__controls">
          <button
            aria-pressed={playing}
            disabled={posterFailed}
            onClick={() => setPlaying((current) => !current)}
            type="button"
          >
            {playing ? "Stop animation" : "Play animation"}
          </button>
          <span aria-live="polite" className="sr-only">
            {playing ? "Animation playing." : "Static poster displayed."}
          </span>
        </span>
      ) : null}
    </span>
  );
}
