"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Work2.css";
import Cloud from "@/components/visuals/Cloud/Cloud";

gsap.registerPlugin(ScrollTrigger);

export default function Work2() {
    const section = useRef(null);

    useGSAP(() => {
        const q = gsap.utils.selector(section);

        gsap.fromTo(
            q(".Work__cell-inner"),
            {
                clipPath: "inset(50% 0 50% 0)",
            },
            {
                clipPath: "inset(0% 0 0% 0)",
                ease: "none",
                stagger: {
                    each: 0.175,
                    from: "end",
                },
                scrollTrigger: {
                    trigger: q(".Work__wrapper"),
                    start: "top bottom",
                    end: `+=${window.innerHeight}`,
                    scrub: true,
                },
            }
        );
    }, { scope: section });

    return (
        <section className="Work" ref={section}>
            <div className="Work__bg">
                {Array.from({ length: 8 }).map((_, index) => (
                    <div className="Work__cell" key={index}>
                        <div className="Work__cell-inner"></div>
                    </div>
                ))}
            </div>

            <div className="Work__wrapper">
                <Cloud/>
            </div>
        </section>
    );
}