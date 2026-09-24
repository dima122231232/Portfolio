"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { createFooterWebGLRuntime } from "@/components/scenes/Workspace/runtime";
import "./PcRoom.css";

gsap.registerPlugin(ScrollTrigger);

export default function PcRoom({ onReady }) {
    const section = useRef(null);
    const canvas = useRef(null);
    const onReadyRef = useRef(onReady);

    useEffect(() => {
        onReadyRef.current = onReady;
    }, [onReady]);

    useEffect(() => {
        if (!section.current || !canvas.current) {
            return undefined;
        }

        const runtime = createFooterWebGLRuntime({
            canvas: canvas.current,
            section: section.current,
            onReady: (result) => onReadyRef.current?.(result),
        });

        if (!runtime) {
            return undefined;
        }

        const visibilityObserver = new IntersectionObserver(
            ([entry]) => {
                runtime.setActive(
                    entry.isIntersecting && !document.hidden
                );
            },
            {
                root: null,
                rootMargin: "3200px 0px",
                threshold: 0,
            }
        );

        visibilityObserver.observe(section.current);

        const canvasTween = gsap.to(canvas.current, {
            y: window.matchMedia("(max-width: 799px)").matches
                ? "2svh"
                : "35svh",
            ease: "none",
            scrollTrigger: {
                trigger: section.current,
                start: "top bottom",
                end: () => {
                    const viewportHeight =
                        document.documentElement.clientHeight ||
                        window.innerHeight;
                    return `+=${viewportHeight * 2}`;
                },
                scrub: true,
                invalidateOnRefresh: true,
            },
        });

        return () => {
            visibilityObserver.disconnect();
            canvasTween.scrollTrigger?.kill();
            canvasTween.kill();
            runtime.destroy();
        };
    }, []);

    return (
        <section ref={section} className="PcScene">
            <canvas ref={canvas} className="PcScene__canvas" />
            <p>
                Good work doesn't need to be complicated. It just needs a clear idea, good execution, and attention to detail
            </p>
        </section>
    );
}