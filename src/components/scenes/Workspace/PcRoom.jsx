"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import { createFooterWebGLRuntime } from "@/components/scenes/Workspace/runtime";
import "./PcRoom.css";

gsap.registerPlugin(ScrollTrigger);

export default function PcRoom() {
    const section = useRef(null);
    const canvas = useRef(null);

    useEffect(() => {
        if (
            !section.current ||
            !canvas.current
        ) {
            return undefined;
        }

        const runtime =
            createFooterWebGLRuntime({
                canvas: canvas.current,
                section: section.current,
            });

        const canvasTween = gsap.to(
            canvas.current,
            {
                y: "50svh",
                ease: "none",
                scrollTrigger: {
                    trigger: section.current,
                    start: "top bottom",
                    end: `+=${window.innerHeight * 2.35}`,
                    scrub: true,
                    invalidateOnRefresh: true,
                },
            }
        );

        return () => {
            canvasTween.scrollTrigger?.kill();
            canvasTween.kill();
            runtime?.destroy();
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
            <p>Good work doesn't need to be complicated. It just needs a clear idea, good execution, and attention to detail</p>
        </section>
    );
}