"use client";

import { useEffect, useRef } from "react";
import { useLenis } from "@/components/providers/LenisProvider";
import gsap from "gsap";
import "./Preloader.css";

export default function Preloader({ progress = 0 }) {
    const root = useRef(null);
    const percent = useRef(null);
    const bar = useRef(null);
    const proxy = useRef({ value: 0 });
    const lenis = useLenis();
    const isClosing = useRef(false);

    useEffect(() => {
        const element = root.current;

        if (!element) {
            return undefined;
        }

        document.body.classList.add("preloader-active");
        lenis?.stop?.();

        gsap.set(element, {
            autoAlpha: 1,
            pointerEvents: "auto",
        });

        gsap.set(bar.current, {
            scaleX: 0,
            transformOrigin: "left center",
        });

        const renderProgress = () => {
            const value = Math.round(
                proxy.current.value
            );

            if (percent.current) {
                percent.current.textContent = `${value}%`;
            }

            if (bar.current) {
                gsap.set(bar.current, {
                    scaleX: value / 100,
                });
            }
        };

        renderProgress();

        return () => {
            document.body.classList.remove(
                "preloader-active"
            );

            gsap.killTweensOf(proxy.current);
            gsap.killTweensOf(element);

            lenis?.start?.();
        };
    }, [lenis]);

    useEffect(() => {
        const element = root.current;

        if (
            !element ||
            isClosing.current
        ) {
            return undefined;
        }

        const target = Math.min(
            100,
            Math.max(0, progress * 100)
        );

        gsap.killTweensOf(proxy.current);

        gsap.to(proxy.current, {
            value: target,
            duration: 0.35,
            ease: "power2.out",
            overwrite: true,

            onUpdate: () => {
                const value = Math.round(
                    proxy.current.value
                );

                if (percent.current) {
                    percent.current.textContent =
                        `${value}%`;
                }

                if (bar.current) {
                    gsap.set(bar.current, {
                        scaleX: value / 100,
                    });
                }
            },

            onComplete: () => {
                if (
                    target < 100 ||
                    isClosing.current
                ) {
                    return;
                }

                isClosing.current = true;

                const exitDuration = 500;

                const timeline = gsap.timeline({
                    defaults: {
                        ease: "power2.inOut",
                    },

                    onComplete: () => {
                        document.body.classList.remove(
                            "preloader-active"
                        );

                        lenis?.start?.();

                        window.dispatchEvent(
                            new CustomEvent(
                                "preloader:complete"
                            )
                        );
                    },
                });

                /*
                 * В этот момент начинается финальное
                 * исчезновение Preloader.
                 *
                 * Другие компоненты получают:
                 *
                 * endAt  → точное время окончания
                 * duration → длительность fade
                 */
                timeline.call(() => {
                    const endAt =
                        performance.now() +
                        exitDuration;

                    window.dispatchEvent(
                        new CustomEvent(
                            "preloader:exit",
                            {
                                detail: {
                                    endAt,
                                    duration:
                                        exitDuration,
                                },
                            }
                        )
                    );
                });

                timeline
                    .to(
                        proxy.current,
                        {
                            value: 100,
                            duration: 0.15,

                            onUpdate: () => {
                                if (percent.current) {
                                    percent.current.textContent =
                                        "100%";
                                }

                                if (bar.current) {
                                    gsap.set(
                                        bar.current,
                                        {
                                            scaleX: 1,
                                        }
                                    );
                                }
                            },
                        }
                    )
                    .to(element, {
                        autoAlpha: 0,
                        duration:
                            exitDuration / 1000,
                        ease: "power2.out",
                    })
                    .set(element, {
                        pointerEvents: "none",
                    });
            },
        });

        return () => {
            gsap.killTweensOf(proxy.current);
        };
    }, [progress, lenis]);

    return (
        <div
            ref={root}
            className="Preloader"
            aria-hidden="true"
        >
            <div className="Preloader__content">
                <span
                    ref={percent}
                    className="Preloader__percent"
                >
                    0%
                </span>

                <div
                    className="Preloader__track"
                    aria-hidden="true"
                >
                    <span
                        ref={bar}
                        className="Preloader__bar"
                    />
                </div>
            </div>
        </div>
    );
}