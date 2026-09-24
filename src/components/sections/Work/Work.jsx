"use client";

import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useLenis } from "@/components/providers/LenisProvider";
import "./Work.css";

const CURVE_CONFIG = {
    desktop: {
        bendStart: 0.001,
        maxAngle: 14.5,
        perspective: 1500,
    },

    mobile: {
        bendStart: 0.001,
        maxAngle: 14.5,
        perspective: 1800,
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
    const lenis = useLenis();

    useGSAP(
        () => {
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
                const isMobile =
                    window.matchMedia(
                        "(max-width: 800px)"
                    ).matches;

                return isMobile
                    ? CURVE_CONFIG.mobile
                    : CURVE_CONFIG.desktop;
            };

            const items = cells.map((cell) => ({
                element: cell,
                top: 0,
                height: 0,
            }));

            let frameRequested = false;
            let destroyed = false;

            const getViewportHeight = () => {
                if (
                    window.visualViewport &&
                    window.visualViewport.height
                ) {
                    return window.visualViewport.height;
                }

                return window.innerHeight;
            };

            const refreshMeasurements = () => {
                if (destroyed) {
                    return;
                }

                const sectionRect =
                    root.getBoundingClientRect();

                items.forEach((item) => {
                    const element = item.element;

                    // Убираем старую трансформацию,
                    // чтобы получить реальные размеры элемента.
                    element.style.transform = "none";

                    const rect =
                        element.getBoundingClientRect();

                    item.top =
                        rect.top -
                        sectionRect.top;

                    item.height =
                        rect.height;
                });
            };

            const updateCurve = () => {
                frameRequested = false;

                if (destroyed) {
                    return;
                }

                const config = getConfig();

                const sectionRect =
                    root.getBoundingClientRect();

                const viewportHeight =
                    getViewportHeight();

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

                const maxAngleRad =
                    config.maxAngle *
                    (Math.PI / 180);

                const sinMaxAngle =
                    Math.sin(maxAngleRad);

                const radius =
                    maxArcDistance /
                    sinMaxAngle;

                items.forEach((item) => {
                    const itemCenterY =
                        sectionRect.top +
                        item.top +
                        item.height * 0.5;

                    const distanceFromCenter =
                        itemCenterY -
                        viewportCenter;

                    const absoluteDistance =
                        Math.abs(
                            distanceFromCenter
                        );

                    const effectiveDistance =
                        Math.min(
                            maxArcDistance,
                            Math.max(
                                0,
                                absoluteDistance -
                                    bendStart
                            )
                        );

                    const ratio =
                        Math.min(
                            1,
                            Math.max(
                                0,
                                effectiveDistance /
                                    radius
                            )
                        );

                    const angle =
                        Math.asin(ratio);

                    const signedAngle =
                        Math.sign(
                            distanceFromCenter
                        ) * angle;

                    const z =
                        radius *
                        (1 - Math.cos(angle));

                    const rotation =
                        signedAngle *
                        (180 / Math.PI);

                    /*
                     * ВАЖНО:
                     * Не используем gsap.quickSetter("z")
                     * и rotationX отдельно.
                     *
                     * Одним transform это намного
                     * стабильнее на мобильных браузерах.
                     *
                     * perspective() находится прямо
                     * внутри transform, поэтому эффект
                     * не зависит от корректности
                     * 3D-контекста родителя.
                     */
                    item.element.style.transform =
                        `perspective(${config.perspective}px) ` +
                        `translate3d(0, 0, ${z}px) ` +
                        `rotateX(${rotation}deg)`;
                });
            };

            const requestCurveUpdate = () => {
                if (
                    frameRequested ||
                    destroyed
                ) {
                    return;
                }

                frameRequested = true;

                requestAnimationFrame(
                    updateCurve
                );
            };

            const refreshAndUpdate = () => {
                refreshMeasurements();
                requestCurveUpdate();
            };

            /*
             * Первый расчёт.
             *
             * Делаем два RAF:
             * 1. ждём layout
             * 2. ждём браузерный paint/layout после него
             *
             * Это особенно полезно на мобильных,
             * когда viewport и изображения
             * устанавливаются не сразу.
             */
            const firstFrame =
                requestAnimationFrame(() => {
                    const secondFrame =
                        requestAnimationFrame(() => {
                            refreshMeasurements();
                            updateCurve();
                        });

                    cleanupRafs.push(
                        secondFrame
                    );
                });

            const cleanupRafs = [firstFrame];

            /*
             * Обычный browser scroll.
             *
             * Работает независимо от ScrollTrigger.
             */
            window.addEventListener(
                "scroll",
                requestCurveUpdate,
                {
                    passive: true,
                }
            );

            /*
             * Lenis scroll.
             *
             * Это нужно для твоего проекта,
             * потому что desktop и Android
             * могут использовать smooth scrolling.
             */
            if (lenis) {
                lenis.on(
                    "scroll",
                    requestCurveUpdate
                );
            }

            /*
             * Resize браузера.
             */
            window.addEventListener(
                "resize",
                refreshAndUpdate,
                {
                    passive: true,
                }
            );

            /*
             * Отдельно следим за visualViewport.
             *
             * На телефонах его высота меняется,
             * когда появляется/исчезает адресная
             * строка браузера.
             */
            const visualViewport =
                window.visualViewport;

            if (visualViewport) {
                visualViewport.addEventListener(
                    "resize",
                    refreshAndUpdate,
                    {
                        passive: true,
                    }
                );

                visualViewport.addEventListener(
                    "scroll",
                    requestCurveUpdate,
                    {
                        passive: true,
                    }
                );
            }

            /*
             * Следим за изменениями размеров
             * самого Work и его элементов.
             */
            const resizeObserver =
                new ResizeObserver(() => {
                    refreshAndUpdate();
                });

            resizeObserver.observe(root);

            items.forEach((item) => {
                resizeObserver.observe(
                    item.element
                );
            });

            /*
             * Дополнительно обновляем эффект,
             * когда изображения реально загрузились.
             *
             * На мобильных lazy-load может происходить
             * значительно позже первого рендера.
             */
            const images =
                root.querySelectorAll("img");

            const handleImageLoad = () => {
                refreshAndUpdate();
            };

            images.forEach((image) => {
                image.addEventListener(
                    "load",
                    handleImageLoad,
                    {
                        passive: true,
                    }
                );
            });

            return () => {
                destroyed = true;

                cleanupRafs.forEach(
                    (rafId) => {
                        cancelAnimationFrame(
                            rafId
                        );
                    }
                );

                window.removeEventListener(
                    "scroll",
                    requestCurveUpdate
                );

                window.removeEventListener(
                    "resize",
                    refreshAndUpdate
                );

                if (visualViewport) {
                    visualViewport.removeEventListener(
                        "resize",
                        refreshAndUpdate
                    );

                    visualViewport.removeEventListener(
                        "scroll",
                        requestCurveUpdate
                    );
                }

                if (lenis) {
                    lenis.off(
                        "scroll",
                        requestCurveUpdate
                    );
                }

                images.forEach((image) => {
                    image.removeEventListener(
                        "load",
                        handleImageLoad
                    );
                });

                resizeObserver.disconnect();

                /*
                 * Полностью убираем transform
                 * при размонтировании.
                 */
                items.forEach((item) => {
                    item.element.style.transform =
                        "";
                });
            };
        },
        {
            scope: section,
            dependencies: [
                loadImages,
                lenis,
            ],
        }
    );

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
                        ([
                            file,
                            alt,
                            title,
                            year,
                            ratio,
                        ]) => (
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
