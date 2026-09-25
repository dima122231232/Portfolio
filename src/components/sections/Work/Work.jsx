"use client";

import React, { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useLenis } from "@/components/providers/LenisProvider";
import "./Work.css";
import { WORK_ITEMS } from "./workData";

const CURVE_CONFIG = {
    desktop: {
        bendStart: 0.001,
        maxAngle: 12.5,
        perspective: 5000,
    },

    mobile: {
        bendStart: 0.001,
        maxAngle: 14.5,
        perspective: 1200,
    },
};


export default function Work({ loadImages = true, onImagesProgress }) {
    const section = useRef(null);
    const lenis = useLenis();
    const onImagesProgressRef = useRef(onImagesProgress);

    useEffect(() => {
        onImagesProgressRef.current = onImagesProgress;
    }, [onImagesProgress]);

    useEffect(() => {
        if (!loadImages) {
            return undefined;
        }

        const root = section.current;

        if (!root) {
            return undefined;
        }

        const images = Array.from(
            root.querySelectorAll("img[data-work-image]")
        );

        if (!images.length) {
            onImagesProgressRef.current?.(1);
            return undefined;
        }

        let completed = 0;
        let destroyed = false;
        const settled = new WeakSet();
        const handlers = new Map();

        const reportComplete = (image) => {
            if (
                destroyed ||
                settled.has(image)
            ) {
                return;
            }

            settled.add(image);
            completed += 1;

            onImagesProgressRef.current?.(
                completed / images.length
            );
        };

        const finishFromEvent = (image) => {
            if (
                destroyed ||
                settled.has(image)
            ) {
                return;
            }

            const decodePromise =
                typeof image.decode === "function"
                    ? image.decode()
                    : Promise.resolve();

            Promise.resolve(decodePromise)
                .catch(() => {})
                .finally(() => {
                    reportComplete(image);
                });
        };

        onImagesProgressRef.current?.(0);

        images.forEach((image) => {
            const handleLoad = () => {
                finishFromEvent(image);
            };

            const handleError = () => {
                // A failed image is treated as complete so the global
                // preloader can never get stuck on one broken asset.
                reportComplete(image);
            };

            handlers.set(image, {
                handleLoad,
                handleError,
            });

            image.addEventListener(
                "load",
                handleLoad,
                { passive: true }
            );

            image.addEventListener(
                "error",
                handleError,
                { passive: true }
            );

            if (image.complete) {
                if (image.naturalWidth > 0) {
                    finishFromEvent(image);
                } else {
                    reportComplete(image);
                }
            }
        });

        return () => {
            destroyed = true;

            handlers.forEach(
                ({ handleLoad, handleError }, image) => {
                    image.removeEventListener(
                        "load",
                        handleLoad
                    );

                    image.removeEventListener(
                        "error",
                        handleError
                    );
                }
            );

            handlers.clear();
        };
    }, [loadImages]);

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
                                    loading={
                                        loadImages
                                            ? "eager"
                                            : "lazy"
                                    }
                                    decoding="async"
                                    data-work-image="true"
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
