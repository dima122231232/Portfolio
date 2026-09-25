"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { createFooterWebGLRuntime } from "@/components/scenes/Workspace/runtime";
import "./PcRoom.css";

gsap.registerPlugin(ScrollTrigger);

export default function PcRoom({ onReady, onProgress }) {
    const section = useRef(null);
    const canvas = useRef(null);
    const onReadyRef = useRef(onReady);
    const onProgressRef = useRef(onProgress);

    useEffect(() => {
        onReadyRef.current = onReady;
        onProgressRef.current = onProgress;
    }, [onReady, onProgress]);

    useEffect(() => {
        if (!section.current || !canvas.current) {
            return undefined;
        }

        const runtime = createFooterWebGLRuntime({
            canvas: canvas.current,
            section: section.current,
            onReady: (result) => {
                onReadyRef.current?.(result);
            },
            onProgress: (value) => {
                onProgressRef.current?.(value);
            },
        });

        if (!runtime) {
            return undefined;
        }

        const visibilityObserver =
            new IntersectionObserver(
                ([entry]) => {
                    runtime.setActive(
                        entry.isIntersecting &&
                        !document.hidden
                    );
                },
                {
                    root: null,
                    rootMargin: "3200px 0px",
                    threshold: 0,
                }
            );

        visibilityObserver.observe(
            section.current
        );

        const isMobile =
            window.matchMedia(
                "(max-width: 799px)"
            ).matches;

        const startY = isMobile
            ? "-20svh"
            : "-35vh";

        const endY = isMobile
            ? "20svh"
            : "35vh";

        const canvasTween =
            gsap.fromTo(
                canvas.current,
                {
                    y: startY,
                },
                {
                    y: endY,
                    ease: "none",
                    scrollTrigger: {
                        trigger:
                            section.current,
                        start: "top bottom",
                        end: () => {
                            const height =
                                section.current
                                    ?.offsetHeight ||
                                window.innerHeight;

                            return `+=${height * 2}`;
                        },
                        scrub: true,
                        invalidateOnRefresh: true,
                    },
                }
            );

        requestAnimationFrame(() => {
            ScrollTrigger.refresh();
        });

        return () => {
            visibilityObserver.disconnect();

            canvasTween.scrollTrigger?.kill();
            canvasTween.kill();

            runtime.destroy();
        };
    }, []);

    return (
        <section
            ref={section}
            className="PcScene"
        >
            <canvas
                ref={canvas}
                className="PcScene__canvas"
            />

            <p>
                Good work doesn't need to be
                complicated. It just needs a clear
                idea, good execution, and attention
                to detail
            </p>
        </section>
    );
}