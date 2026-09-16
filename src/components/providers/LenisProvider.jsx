

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const LenisContext = createContext(null);

export const useLenis = () => useContext(LenisContext);

export default function LenisProvider({ children }) {
  const [lenis, setLenis] = useState(null);

  useEffect(() => {
    const ua = navigator.userAgent;

    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isAndroid = /Android/.test(ua);
    const isTouch = "ontouchstart" in window;

    const options = {
      autoRaf: false,

      duration: 1.2,

      easing: isTouch
        ? (t) => 1 - Math.pow(1 - t, 5)
        : (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),

      smoothWheel: true,

      smoothTouch: isIOS ? false : true,
      syncTouch: isIOS ? false : true,

      touchMultiplier: isAndroid ? 1.2 : 1,

      wheelMultiplier: 1,

      anchors: true,
    };

    const instance = new Lenis(options);

    setLenis(instance);

    instance.on("scroll", ScrollTrigger.update);

    const update = (time) => {
      instance.raf(time * 1000);
    };

    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop(value) {
        if (arguments.length) {
          instance.scrollTo(value, {
            immediate: true,
          });
        }

        return instance.scroll;
      },

      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
    });

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(update);

      instance.destroy();

      setLenis(null);
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
