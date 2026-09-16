"use client";

import React, { useEffect, useRef } from "react";
import { setupCurvedEffect } from "@/lib/effects/curvedEffect";
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";
import "./Work.css";

gsap.registerPlugin(ScrollTrigger);

export default function Work() {
    const section = useRef(null);

    useEffect(() => {
        if (!section.current) return undefined;

        const curvedCleanup = setupCurvedEffect(section.current);

        const backgroundTrigger = ScrollTrigger.create({
            trigger: section.current,
            start: "top 20%",
            end: "bottom 0%",
            onEnter: () => {
                // gsap.to("body", {
                //     backgroundColor: "#010101",
                //     duration: .5,
                //     ease: "none",
                // });
                // gsap.to(":root", {
                //     "--base-200": "#010101",
                //     "--base-0": "#fff",
                //     duration: .5,
                //     ease: "none",
                // });
            },
            onLeaveBack: () => {
                // gsap.to("body", {
                //     backgroundColor: "#fff",
                //     duration: .35,
                //     ease: "none",
                // }),
                // gsap.to(":root", {
                //     "--base-200": "#fff",
                //     "--base-0": "#000",
                //     duration: .35,
                //     ease: "none",
                // });
            }
        });

        return () => {
            curvedCleanup?.();
            backgroundTrigger.kill();
            // gsap.to("body", {
            //     backgroundColor: "#fff",
            //     duration: 0.3,
            // });
        };
    }, []);

    return (
        <section className="Work" ref={section}>
            <div className="Work__source" data-curved-effect-source>
                <div className="Work__intro" data-curved-effect-section>
                    <h2>MY BEST WORK</h2>
                    <p>
                        A collection of projects created entirely by me. Unfortunately, most of my strongest work was developed collaboratively and remains confidential due to NDA agreements. Has developed more than 50 websites
                    </p>
                </div>

                <div className="Work__wrapper" data-curved-effect-section>
                    <div className="Work__cell" data-curved-effect-cell>
                        <img src="/img/work/1.png" alt="Travis Scott fan website" />
                        <div>
                            <span>Fan Travis Scott</span>
                            <span>2024</span>
                        </div>
                    </div>

                    <div className="Work__cell" data-curved-effect-cell>
                        <img src="/img/work/2.png" alt="DeSIRE website" />
                        <div>
                            <span>DeSIRE</span>
                            <span>2026</span>
                        </div>
                    </div>

                    <div className="Work__cell" data-curved-effect-cell>
                        <img src="/img/work/3.png" alt="Chapter Three website" />
                        <div>
                            <span>Chapter Three</span>
                            <span>2023</span>
                        </div>
                    </div>

                    <div className="Work__cell" data-curved-effect-cell>
                        <img src="/img/work/4.png" alt="Fly a. a. website" />
                        <div>
                            <span>Fly a. a.</span>
                            <span>2024</span>
                        </div>
                    </div>

                    <div className="Work__cell" data-curved-effect-cell>
                        <img src="/img/work/5.png" alt="Europlanet website" />
                        <div>
                            <span>Europlanet</span>
                            <span>2025</span>
                        </div>
                    </div>

                    <div className="Work__cell" data-curved-effect-cell>
                        <img src="/img/work/6.png" alt="Java Matcha website" />
                        <div>
                            <span>Java Matcha</span>
                            <span>2024</span>
                        </div>
                    </div>

                    <div className="Work__cell" data-curved-effect-cell>
                        <img src="/img/work/7.png" alt="Fullest wellness website" />
                        <div>
                            <span>Fullest</span>
                            <span>2026</span>
                        </div>
                    </div>

                    <div className="Work__cell" data-curved-effect-cell>
                        <img src="/img/work/8.png" alt="Tech DEV website" />
                        <div>
                            <span>Tech DEV</span>
                            <span>2026</span>
                        </div>
                    </div>

                    <div className="Work__cell" data-curved-effect-cell>
                        <img src="/img/work/9.png" alt="Personal portfolio website" />
                        <div>
                            <span>Portfolio (OLD)</span>
                            <span>2024</span>
                        </div>
                    </div>

                    <div className="Work__cell" data-curved-effect-cell>
                        <img src="/img/work/10.png" alt="Evgeni Kozyhov portfolio website" />
                        <div>
                            <span>Evgeni Kozyhov</span>
                            <span>2023</span>
                        </div>
                    </div>

                    <div className="Work__cell" data-curved-effect-cell>
                        <img src="/img/work/11.png" alt="Portfolio website" />
                        <div>
                            <span>Portfolio (NOT me)</span>
                            <span>2026</span>
                        </div>
                    </div>

                    <div className="Work__cell" data-curved-effect-cell>
                        <img src="/img/work/12.png" alt="AXION website" />
                        <div>
                            <span>AXION</span>
                            <span>2026</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}