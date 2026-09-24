"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Work.css";

gsap.registerPlugin(ScrollTrigger);

const CURVE_CONFIG = {
    desktop: {
        bendStart: 0.001,
        maxAngle: 14.5,
    },
    mobile: {
        bendStart: 0.001,
        maxAngle: 14.5,
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
    ["10.png", "a. a.", "a. a.", "2026", "1200 / 675"],
    ["11.png", "Utopic game studio", "Utopic", "2026", "1200 / 675"],
    ["12.png", "Nocode ddc", "Nocode ddc", "2022", "1200 / 675"],
    ["13.png", "Evgeni Kozyhov portfolio website", "Evgeni Kozyhov", "2022", "1200 / 1000"],
    ["14.png", "Portfolio website", "Portfolio (NOT me)", "2026", "1200 / 675"],
    ["15.png", "AXION website", "AXION", "2026", "1200 / 1000"],
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

        const getConfig = () => {
            return window.innerWidth < 800
                ? CURVE_CONFIG.mobile
                : CURVE_CONFIG.desktop;
        };

        const items = cells.map((cell) => ({
            element: cell,
            top: 0,
            height: 0,
            setZ: gsap.quickSetter(
                cell,
                "z",
                "px"
            ),
            setRotation: gsap.quickSetter(
                cell,
                "rotationX",
                "deg"
            ),
        }));

        let frameRequested = false;

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
                    rect.top -
                    sectionRect.top;

                item.height =
                    rect.height;
            });
        };

        const updateCurve = () => {
            frameRequested = false;

            const config = getConfig();

            const sectionRect =
                root.getBoundingClientRect();

            const viewportHeight =
                document.documentElement.clientHeight ||
                window.innerHeight;

            const viewportCenter =
                viewportHeight * 0.5;

            const halfViewport =
                viewportHeight * 0.5;

            const bendStart =
                viewportHeight *
                config.bendStart;

            const maxArcDistance =
                Math.max(
                    1,
                    halfViewport -
                        bendStart
                );

            const maxAngle =
                config.maxAngle *
                (Math.PI / 180);

            /**
             * Real cylinder radius.
             *
             * y = R * sin(angle)
             *
             * Поэтому на максимальном
             * расстоянии:
             *
             * R = y / sin(angle)
             */
            const radius =
                maxArcDistance /
                Math.sin(maxAngle);

            items.forEach((item) => {
                const itemCenterY =
                    sectionRect.top +
                    item.top +
                    item.height * 0.5;

                /**
                 * Signed distance from
                 * the exact viewport center.
                 */
                const distanceFromCenter =
                    itemCenterY -
                    viewportCenter;

                const absoluteDistance =
                    Math.abs(
                        distanceFromCenter
                    );

                /**
                 * Flat center zone.
                 */
                const effectiveDistance =
                    gsap.utils.clamp(
                        0,
                        maxArcDistance,
                        absoluteDistance -
                            bendStart
                    );

                /**
                 * Convert vertical
                 * position to exact
                 * cylindrical angle.
                 *
                 * This is the important
                 * difference from the
                 * previous version.
                 */
                const angle =
                    Math.asin(
                        effectiveDistance /
                            radius
                    );

                const signedAngle =
                    Math.sign(
                        distanceFromCenter
                    ) *
                    angle;

                /**
                 * Exact depth of the
                 * cylindrical surface.
                 */
                const z =
                    radius *
                    (
                        1 -
                        Math.cos(angle)
                    );

                /**
                 * Convert radians
                 * to degrees.
                 */
                const rotation =
                    signedAngle *
                    (180 / Math.PI);

                item.setZ(z);
                item.setRotation(
                    rotation
                );
            });
        };

        const requestCurveUpdate = () => {
            if (frameRequested) {
                return;
            }

            frameRequested = true;

            requestAnimationFrame(
                updateCurve
            );
        };

        refreshMeasurements();
        updateCurve();

        const scrollTrigger =
            ScrollTrigger.create({
                trigger: root,
                start: "top bottom",
                end: "bottom top",
                invalidateOnRefresh: true,
                onUpdate:
                    requestCurveUpdate,
                onRefresh: () => {
                    refreshMeasurements();
                    updateCurve();
                },
            });

        const resizeObserver =
            new ResizeObserver(() => {
                refreshMeasurements();
                updateCurve();
            });

        resizeObserver.observe(root);

        window.addEventListener(
            "resize",
            requestCurveUpdate,
            {
                passive: true,
            }
        );

        return () => {
            resizeObserver.disconnect();
            scrollTrigger.kill();

            window.removeEventListener(
                "resize",
                requestCurveUpdate
            );
        };
    }, {
        scope: section,
        dependencies: [loadImages],
    });

    return (
        <section
            className="Work"
            ref={section}
        >
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
                                        aspectRatio:
                                            ratio,
                                    }}
                                />

                                <div>
                                    <span>
                                        {title}
                                    </span>

                                    <span>
                                        {year}
                                    </span>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </section>
    );
}