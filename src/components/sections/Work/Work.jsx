"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Work.css";

gsap.registerPlugin(ScrollTrigger);

const CURVE_CONFIG = {
    desktop: {
        depth: 125,
        rotation: 15,
        duration: 0.01,
        ease: "none",
    },
    mobile: {
        depth:65,
        rotation: 20,
        duration: 0.01,
        ease: "none",
    },
};

const WORK_ITEMS = [
    ["1.png", "Travis Scott fan website", "Fan Travis Scott", "2024", "1200 / 675"],
    ["2.png", "DeSIRE website", "DeSIRE", "2026", "1200 / 675"],
    ["3.png", "Chapter Three website", "Chapter Three", "2023", "1200 / 675"],
    ["4.png", "Fly a. a. website", "Fly a. a.", "2024", "1200 / 675"],
    ["5.png", "Europlanet website", "Europlanet", "2025", "1200 / 675"],
    ["6.png", "Java Matcha website", "Java Matcha", "2024", "1200 / 675"],
    ["7.png", "Fullest wellness website", "Fullest", "2026", "1200 / 675"],
    ["8.png", "Tech DEV website", "Tech DEV", "2026", "1200 / 675"],
    ["9.png", "Personal portfolio website", "Portfolio (OLD)", "2024", "1200 / 675"],
    ["10.png", "Evgeni Kozyhov portfolio website", "Evgeni Kozyhov", "2022", "1200 / 1000"],
    ["11.png", "Portfolio website", "Portfolio (NOT me)", "2026", "1200 / 675"],
    ["12.png", "AXION website", "AXION", "2026", "1200 / 1000"],
];

export default function Work({ loadImages = false }) {
    const section = useRef(null);

    useGSAP(() => {
        const root = section.current;

        if (!root) {
            return undefined;
        }

        const cells = gsap.utils.toArray(
            ".Work__cell",
            root
        );

        if (!cells.length) {
            return undefined;
        }

        const getCurveConfig = () => {
            return window.innerWidth < 800
                ? CURVE_CONFIG.mobile
                : CURVE_CONFIG.desktop;
        };

        const config = getCurveConfig();

        const items = cells.map((cell) => ({
            element: cell,
            top: 0,
            height: 0,
            z: gsap.quickTo(cell, "z", {
                duration: config.duration,
                ease: config.ease,
            }),
            rotationX: gsap.quickTo(cell, "rotationX", {
                duration: config.duration,
                ease: config.ease,
            }),
        }));

        let scheduled = false;

        const refreshMeasurements = () => {
            const sectionRect =
                root.getBoundingClientRect();

            items.forEach((item) => {
                gsap.set(item.element, {
                    clearProps: "transform",
                });

                const rect =
                    item.element.getBoundingClientRect();

                item.top =
                    rect.top - sectionRect.top;
                item.height = rect.height;
            });
        };

        const updateCurveNow = () => {
            scheduled = false;

            const config = getCurveConfig();

            const sectionRect =
                root.getBoundingClientRect();

            const centerY =
                window.innerHeight * 0.5;

            const halfHeight =
                centerY || 1;

            items.forEach((item) => {
                const itemCenterY =
                    sectionRect.top +
                    item.top +
                    item.height * 0.25;

                const normalized =
                    gsap.utils.clamp(
                        -1,
                        1,
                        (itemCenterY - centerY) /
                            halfHeight
                    );

                const distance =
                    Math.abs(normalized);

                const depth =
                    distance *
                    distance *
                    config.depth;

                const rotation =
                    normalized *
                    config.rotation;

                item.z(depth);
                item.rotationX(rotation);
            });
        };

        const updateCurve = () => {
            if (scheduled) {
                return;
            }

            scheduled = true;

            requestAnimationFrame(
                updateCurveNow
            );
        };

        refreshMeasurements();
        updateCurveNow();

        const scrollTrigger =
            ScrollTrigger.create({
                trigger: root,
                start: "top bottom",
                end: "bottom top",
                invalidateOnRefresh: true,
                onUpdate: updateCurve,
                onRefresh: () => {
                    refreshMeasurements();
                    updateCurveNow();
                },
            });

        const resizeObserver =
            new ResizeObserver(() => {
                refreshMeasurements();
                updateCurve();
                ScrollTrigger.refresh();
            });

        resizeObserver.observe(root);

        window.addEventListener(
            "resize",
            updateCurve,
            { passive: true }
        );

        return () => {
            resizeObserver.disconnect();
            scrollTrigger.kill();

            window.removeEventListener(
                "resize",
                updateCurve
            );
        };
    }, {
        scope: section,
        dependencies: [loadImages],
    });

    return (
        <section className="Work" ref={section}>
            <div className="Work__source">
                <div className="Work__intro">
                    <h2>MY BEST WORK</h2>
                    <p>
                        A collection of projects created entirely by me. Unfortunately, most of my strongest work was developed collaboratively and remains confidential due to NDA agreements. Has developed more than 50 websites
                    </p>
                </div>

                <div className="Work__wrapper">
                    {WORK_ITEMS.map(
                        ([file, alt, title, year, ratio]) => (
                            <div
                                className="Work__cell"
                                key={file}
                            >
                                <img
                                    src={
                                        loadImages
                                            ? `/img/work/${file}`
                                            : undefined
                                    }
                                    alt={alt}
                                    loading="lazy"
                                    decoding="async"
                                    style={{
                                        aspectRatio: ratio,
                                    }}
                                />

                                <div>
                                    <span>{title}</span>
                                    <span>{year}</span>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </section>
    );
}