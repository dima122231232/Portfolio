"use client";

import { useEffect, useRef } from "react";
import { createWebGLRuntime } from "@/components/scenes/Hero/runtime";
import gsap from "gsap";
import "./ThreeScene.css";

export default function ThreeScene({
    onLeave,
    onEnterBack,
    onReady,
    onProgress,
}) {
    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);

    const onLeaveRef = useRef(onLeave);
    const onEnterBackRef = useRef(onEnterBack);
    const onReadyRef = useRef(onReady);
    const onProgressRef = useRef(onProgress);

    const PRELOADER_OFFSET = 0;

    useEffect(() => {
        onLeaveRef.current = onLeave;
        onEnterBackRef.current = onEnterBack;
        onReadyRef.current = onReady;
        onProgressRef.current = onProgress;
    }, [
        onLeave,
        onEnterBack,
        onReady,
        onProgress,
    ]);

    useEffect(() => {
        if (
            !canvasRef.current ||
            !wrapperRef.current
        ) {
            return undefined;
        }

        /*
         * ==========================================
         * PRELOADER → HERO ANIMATION
         * ==========================================
         */

        const handlePreloaderExit = (event) => {
            /*
             * Анимация нужна только на телефонах.
             */
            if (
                !window.matchMedia(
                    "(max-width: 800px)"
                ).matches
            ) {
                return;
            }

            const title =
                wrapperRef.current?.querySelector(
                    ".Hero__title"
                );

            if (!title) {
                return;
            }

            const endAt =
                event.detail?.endAt;

            if (!endAt) {
                return;
            }
            
            const delay =
                Math.max(
                    0,
                    endAt -
                        performance.now() -
                        PRELOADER_OFFSET
                ) / 1000;

            gsap.killTweensOf(title);

            gsap.delayedCall(
                delay,
                () => {
                    gsap.fromTo(
                        title,
                        {
                            clipPath:
                                "inset(100% 0% 0% 0%)",
                        },
                        {
                            clipPath:
                                "inset(0% 0% 0% 0%)",
                            duration: 1.2,
                            ease: "power4.out",
                            overwrite: true,
                        }
                    );
                }
            );
        };

        window.addEventListener(
            "preloader:exit",
            handlePreloaderExit
        );

        /*
         * ==========================================
         * WEBGL RUNTIME
         * ==========================================
         */

        const runtime = createWebGLRuntime({
            canvas: canvasRef.current,
            wrapper: wrapperRef.current,

            onLeave: () =>
                onLeaveRef.current?.(),

            onEnterBack: () =>
                onEnterBackRef.current?.(),

            onReady: (result) =>
                onReadyRef.current?.(result),

            onProgress: (value) =>
                onProgressRef.current?.(value),
        });

        return () => {
            window.removeEventListener(
                "preloader:exit",
                handlePreloaderExit
            );

            const title =
                wrapperRef.current?.querySelector(
                    ".Hero__title"
                );

            if (title) {
                gsap.killTweensOf(title);
            }

            runtime?.destroy();
        };
    }, []);

    return (
        <section className="webgl-section">
            <div
                ref={wrapperRef}
                className="webgl-wrapper"
            >
                <canvas
                    ref={canvasRef}
                    className="webgl"
                />

                <h1 className="Hero__title">
                    Web Designer & Dev
                </h1>
            </div>
        </section>
    );
}