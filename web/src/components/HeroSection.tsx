"use client";

import { useEffect, useRef, useState, startTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { getPath } from "@/lib/public-base-path";

const SLOGANS = [
  "将散落的数据碎片，重构为永恒的思念。",
  "从像素与字节中，唤醒熟悉的灵魂。",
  "在数据的海洋里，赋予灵魂第二次生命。",
  "我们无法阻挡生命的逝去，但我们可以拒绝记忆的消亡。",
];

const TYPING_INTERVAL = 90;   // ms per char while typing
const ERASING_INTERVAL = 30;  // ms per char while erasing
const PAUSE_DURATION = 3000;  // ms to hold completed sentence

type Phase = "typing" | "pausing" | "erasing";

function useTypewriter() {
  const [sloganIndex, setSloganIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const current = SLOGANS[sloganIndex];

    if (phase === "typing") {
      if (displayed.length < current.length) {
        timeoutRef.current = setTimeout(() => {
          setDisplayed(current.slice(0, displayed.length + 1));
        }, TYPING_INTERVAL);
      } else {
        timeoutRef.current = setTimeout(() => setPhase("pausing"), PAUSE_DURATION);
      }
    } else if (phase === "pausing") {
      timeoutRef.current = setTimeout(() => setPhase("erasing"), 0);
    } else if (phase === "erasing") {
      if (displayed.length > 0) {
        timeoutRef.current = setTimeout(() => {
          setDisplayed((prev) => prev.slice(0, -1));
        }, ERASING_INTERVAL);
      } else {
        startTransition(() => {
          setSloganIndex((i) => (i + 1) % SLOGANS.length);
          setPhase("typing");
        });
      }
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [displayed, phase, sloganIndex]);

  return displayed;
}

export default function HeroSection() {
  const displayed = useTypewriter();
  const [ctaVisible, setCtaVisible] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setCtaVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      // Force muted to true to satisfy autoplay policies
      videoRef.current.muted = true;
      videoRef.current.play().catch((err) => {
        console.error("Video autoplay failed:", err);
      });
    }
  }, []);

  return (
    <section className="relative h-dvh min-h-screen w-full overflow-hidden bg-black select-none cursor-default">
      {/* Background video */}
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src="/jellyfish.webm" type="video/webm" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      {/* Foreground */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        {/* Logo / Brand */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-thin tracking-[0.35em] text-white drop-shadow-lg
                     text-4xl sm:text-5xl md:text-6xl lg:text-7xl select-none cursor-default"
        >
          CYBERIMMO
        </motion.h1>

        {/* Divider line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 h-px w-24 bg-white/20 select-none cursor-default"
        />

        {/* Typewriter slogan */}
        <div className="mt-8 h-8 flex items-center justify-center select-none cursor-default">
          <p className="text-slate-300 font-light text-lg md:text-xl tracking-widest">
            {displayed}
            <span className="inline-block w-px h-5 bg-slate-300/70 ml-0.5 animate-pulse align-middle" />
          </p>
        </div>

        {/* CTA */}
        <AnimatePresence>
          {ctaVisible && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-12 flex flex-col items-center gap-6"
            >
              <Link
                href={getPath("/onboarding")}
                className="group inline-flex items-center gap-3 border border-white/20
                           px-8 py-3 text-sm font-light tracking-[0.2em] text-white/80
                           backdrop-blur-md transition-all duration-300
                           hover:bg-white/10 hover:text-white hover:border-white/40
                           hover:backdrop-blur-md select-none"
              >
                开始唤醒
                <span
                  className="opacity-40 transition-all duration-300 group-hover:opacity-80 group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>

              {/* Auth links */}
              <div className="flex items-center gap-2 text-xs tracking-widest text-white/30 select-none">
                <Link
                  href={getPath("/auth/login")}
                  className="transition-colors duration-200 hover:text-white/70"
                >
                  登录
                </Link>
                <span className="opacity-30">/</span>
                <Link
                  href={getPath("/auth/register")}
                  className="transition-colors duration-200 hover:text-white/70"
                >
                  注册
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
