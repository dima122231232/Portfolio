"use client";

import { useEffect, useState } from "react";
import { ReactLenis, useLenis as useLenisInstance } from "lenis/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.config({
    ignoreMobileResize: true,
});

const LENIS_OPTIONS = {
    autoRaf: false,
    autoResize: true,
    autoToggle: true,

    smoothWheel: true,
    syncTouch: false,

    wheelMultiplier: 1,

    direction: "vertical",
    gestureDirection: "vertical",

    anchors: true,
    stopInertiaOnNavigate: true,

    respectReducedMotion: true,
    overscroll: true,
};

export const useLenis = useLenisInstance;

function useNativeTouchScroll() {
    const [isNativeTouchScroll, setIsNativeTouchScroll] =
        useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia(
            "(pointer: coarse), (max-width: 800px)"
        );

        const update = () => {
            setIsNativeTouchScroll(mediaQuery.matches);
        };

        update();

        mediaQuery.addEventListener?.("change", update);

        return () => {
            mediaQuery.removeEventListener?.("change", update);
        };
    }, []);

    return isNativeTouchScroll;
}

function LenisGSAPSync({ children }) {
    const lenis = useLenisInstance();

    useEffect(() => {
        if (!lenis) {
            return undefined;
        }

        const update = (time) => {
            lenis.raf(time * 1000);
        };

        const handleScroll = () => {
            ScrollTrigger.update();
        };

        lenis.on("scroll", handleScroll);

        gsap.ticker.add(update);
        gsap.ticker.lagSmoothing(0);

        const refreshFrame = requestAnimationFrame(() => {
            ScrollTrigger.refresh();
        });

        return () => {
            lenis.off("scroll", handleScroll);
            gsap.ticker.remove(update);
            cancelAnimationFrame(refreshFrame);
        };
    }, [lenis]);

    return children;
}

export default function LenisProvider({ children }) {
    const useNativeScroll = useNativeTouchScroll();

    /*
     * Touch / coarse-pointer devices use the browser's native scrolling.
     * This avoids adding a non-passive touchmove listener and an extra
     * animation loop to iOS/Android, while desktop keeps the full Lenis
     * + GSAP integration.
     */
    if (useNativeScroll) {
        return children;
    }

    return (
        <ReactLenis
            root
            options={LENIS_OPTIONS}
        >
            <LenisGSAPSync>{children}</LenisGSAPSync>
        </ReactLenis>
    );
}
