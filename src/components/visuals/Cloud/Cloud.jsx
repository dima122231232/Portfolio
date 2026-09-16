"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import "./Cloud.css";

const CONFIG = {
    count: 70,
    radius: 1,
    jitter: 0.12,

    size: 100,
    sizeVariance: 0.35,

    autoRotate: true,
    spinY: 0.018,
    spinX: 0.004,

    floatAmount: 0.04,
    floatSpeed: 0.25,

    camera: 3.2,
    focalLength: 1000,

    fog: 1.5,
    minOpacity: 0.05,

    grayscale: 0,
    contrast: 1,
    brightness: 1,

    background: "#78170F",

    blur: false,
    blurMax: 4,

    maxImageSize: 1200,
    maxDpr: 2,

    dragSensitivity: 0.001,
    dragClampX: 1.15,

    inertiaDuration: 1.2,
    inertiaMultiplier: 0.9,
    inertiaEase: "power3.out",
    maxVelocity: 0.15,

    velocitySmoothing: 0.35,
};

const IMAGE_SOURCES = [
    "/img/cloud/image-01.jpg",
    "/img/cloud/image-02.jpg",
    "/img/cloud/image-03.jpg",
    "/img/cloud/image-04.jpg",
    "/img/cloud/image-05.jpg",
    "/img/cloud/image-06.jpg",
    "/img/cloud/image-07.jpg",
    "/img/cloud/image-08.jpg",

];

const CENTER_TEXT = "My Work";
const TEXT_MAX_WIDTH = 470;

export default function Cloud() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext("2d", {
            alpha: false,
            desynchronized: true,
        });

        if (!ctx) return;

        const state = {
            width: 0,
            height: 0,
            time: 0,
            lastTime: 0,

            rotation: {
                x: 0,
                y: 0,
            },

            velocity: {
                x: 0,
                y: 0,
            },

            pointer: {
                active: false,
                lastX: 0,
                lastY: 0,
            },
        };

        const sources = [];
        const tiles = [];
        const items = [];

        let resizeObserver = null;
        let inertiaTween = null;

        const inertia = {
            x: 0,
            y: 0,
        };

        const clamp = (value, min, max) => {
            return Math.min(Math.max(value, min), max);
        };

        const hash = (value) => {
            const x =
                Math.sin(
                    value * 12.9898 +
                        11 * 78.233
                ) * 43758.5453123;

            return x - Math.floor(x);
        };

        const createPlaceholder = (index) => {
            const ratios = [
                [300, 400],
                [400, 300],
                [360, 360],
                [280, 420],
                [480, 270],
                [300, 400],
                [240, 427],
                [360, 360],
            ];

            const [
                placeholderWidth,
                placeholderHeight,
            ] = ratios[index % ratios.length];

            const placeholder =
                document.createElement("canvas");

            placeholder.width = placeholderWidth;
            placeholder.height = placeholderHeight;

            const placeholderContext =
                placeholder.getContext("2d");

            const gradient =
                placeholderContext.createLinearGradient(
                    0,
                    0,
                    placeholderWidth,
                    placeholderHeight
                );

            gradient.addColorStop(0, "#ffffff");
            gradient.addColorStop(1, "#d6d6d6");

            placeholderContext.fillStyle = gradient;

            placeholderContext.fillRect(
                0,
                0,
                placeholderWidth,
                placeholderHeight
            );

            const minSize = Math.min(
                placeholderWidth,
                placeholderHeight
            );

            placeholderContext.fillStyle =
                "rgba(30, 30, 34, .65)";

            placeholderContext.save();

            placeholderContext.translate(
                placeholderWidth / 2,
                placeholderHeight / 2
            );

            placeholderContext.rotate(
                index * 0.7
            );

            if (index % 3 === 0) {
                placeholderContext.beginPath();

                placeholderContext.arc(
                    0,
                    0,
                    minSize * 0.21,
                    0,
                    Math.PI * 2
                );

                placeholderContext.fill();
            } else if (index % 3 === 1) {
                placeholderContext.fillRect(
                    -minSize * 0.19,
                    -minSize * 0.19,
                    minSize * 0.38,
                    minSize * 0.38
                );
            } else {
                placeholderContext.beginPath();

                for (let i = 0; i < 12; i++) {
                    const angle =
                        (i / 12) *
                        Math.PI *
                        2;

                    const pointRadius =
                        i % 2
                            ? minSize * 0.09
                            : minSize * 0.25;

                    const x =
                        Math.cos(angle) *
                        pointRadius;

                    const y =
                        Math.sin(angle) *
                        pointRadius;

                    if (i === 0) {
                        placeholderContext.moveTo(
                            x,
                            y
                        );
                    } else {
                        placeholderContext.lineTo(
                            x,
                            y
                        );
                    }
                }

                placeholderContext.closePath();
                placeholderContext.fill();
            }

            placeholderContext.restore();

            return {
                raw: placeholder,
            };
        };

        const createPlaceholders = () => {
            return Array.from(
                { length: 8 },
                (_, index) =>
                    createPlaceholder(index)
            );
        };

        const processImage = (source) => {
            const raw = source.raw;

            const sourceWidth =
                raw.width || raw.naturalWidth;

            const sourceHeight =
                raw.height || raw.naturalHeight;

            const scale = Math.min(
                1,
                CONFIG.maxImageSize /
                    Math.max(
                        sourceWidth,
                        sourceHeight
                    )
            );

            if (scale >= 1) {
                return raw;
            }

            const processedCanvas =
                document.createElement("canvas");

            processedCanvas.width = Math.max(
                1,
                Math.round(
                    sourceWidth * scale
                )
            );

            processedCanvas.height = Math.max(
                1,
                Math.round(
                    sourceHeight * scale
                )
            );

            const processedContext =
                processedCanvas.getContext("2d");

            processedContext.imageSmoothingEnabled = true;
            processedContext.imageSmoothingQuality = "high";

            if (
                CONFIG.grayscale !== 0 ||
                CONFIG.contrast !== 1 ||
                CONFIG.brightness !== 1
            ) {
                processedContext.filter =
                    `grayscale(${(
                        CONFIG.grayscale * 100
                    ).toFixed(0)}%) ` +
                    `contrast(${CONFIG.contrast.toFixed(
                        2
                    )}) ` +
                    `brightness(${CONFIG.brightness.toFixed(
                        2
                    )})`;
            }

            processedContext.drawImage(
                raw,
                0,
                0,
                processedCanvas.width,
                processedCanvas.height
            );

            return processedCanvas;
        };

        const loadImages = async () => {
            if (!IMAGE_SOURCES.length) {
                return createPlaceholders();
            }

            const loadedImages =
                await Promise.all(
                    IMAGE_SOURCES.map(
                        (source) =>
                            new Promise(
                                (resolve) => {
                                    const image =
                                        new Image();

                                    image.decoding =
                                        "async";

                                    image.onload =
                                        () => {
                                            resolve({
                                                raw: image,
                                            });
                                        };

                                    image.onerror =
                                        () => {
                                            resolve(
                                                null
                                            );
                                        };

                                    image.src =
                                        source;
                                }
                            )
                    )
                );

            const validImages =
                loadedImages.filter(Boolean);

            if (!validImages.length) {
                return createPlaceholders();
            }

            return validImages;
        };

        const createSphere = () => {
            const amount = Math.max(
                1,
                Math.round(CONFIG.count)
            );

            items.length = 0;

            const goldenAngle =
                Math.PI *
                (3 - Math.sqrt(5));

            for (let i = 0; i < amount; i++) {
                const y =
                    amount > 1
                        ? 1 -
                          (i /
                              (amount - 1)) *
                              2
                        : 0;

                const sphereRadius =
                    Math.sqrt(
                        Math.max(
                            0,
                            1 - y * y
                        )
                    );

                const angle =
                    goldenAngle * i;

                let x =
                    Math.cos(angle) *
                    sphereRadius;

                let z =
                    Math.sin(angle) *
                    sphereRadius;

                x +=
                    (hash(i * 7.7 + 10) -
                        0.5) *
                    CONFIG.jitter;

                let finalY =
                    y +
                    (hash(i * 9.3 + 20) -
                        0.5) *
                        CONFIG.jitter;

                z +=
                    (hash(i * 11.9 + 30) -
                        0.5) *
                    CONFIG.jitter;

                const length = Math.sqrt(
                    x * x +
                        finalY * finalY +
                        z * z
                );

                x /= length;
                finalY /= length;
                z /= length;

                const imageIndex =
                    Math.floor(
                        hash(
                            i * 47.13 +
                                19.7
                        ) *
                            tiles.length
                    );

                items.push({
                    x,
                    y: finalY,
                    z,

                    imageIndex,

                    phase:
                        hash(i * 13.7) *
                        Math.PI *
                        2,

                    scale:
                        1 +
                        (hash(i * 17.3) -
                            0.5) *
                            0.7,

                    // tilt:
                    //     (hash(i * 19.1) -
                    //         0.5) *
                    //     16,
                    tilt: 0,
                });
            }
        };

        const resize = () => {
            const dpr = Math.min(
                window.devicePixelRatio || 1,
                CONFIG.maxDpr
            );

            state.width =
                canvas.clientWidth;

            state.height =
                canvas.clientHeight;

            canvas.width = Math.round(
                state.width * dpr
            );

            canvas.height = Math.round(
                state.height * dpr
            );

            ctx.setTransform(
                dpr,
                0,
                0,
                dpr,
                0,
                0
            );

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
        };

        const getTextStyles = () => {
            const rootStyles =
                getComputedStyle(
                    document.documentElement
                );

            const fontFamily =
                rootStyles
                    .getPropertyValue(
                        "--font-head"
                    )
                    .trim() ||
                "sans-serif";

            const textColor =
                rootStyles
                    .getPropertyValue(
                        "--base-200"
                    )
                    .trim() ||
                "#fff";

            const rootFontSize =
                parseFloat(
                    rootStyles.fontSize
                ) || 16;

            return {
                fontFamily,
                textColor,
                fontSize:
                    rootFontSize * 2.5,
            };
        };

        const drawCenterText = () => {
            const {
                fontFamily,
                textColor,
                fontSize,
            } = getTextStyles();

            const lineHeight =
                fontSize * 1.1;

            ctx.save();

            ctx.globalAlpha = 1;
            ctx.filter = "none";

            ctx.fillStyle = textColor;

            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.font =
                `200 ${fontSize}px ${fontFamily}`;

            const letterSpacing =
                fontSize * -0.03;

            const measure = (text) => {
                if (!text.length) {
                    return 0;
                }

                return (
                    ctx.measureText(text)
                        .width +
                    letterSpacing *
                        (text.length - 1)
                );
            };

            const words =
                CENTER_TEXT.split(" ");

            const lines = [];

            let current = "";

            for (const word of words) {
                const test = current
                    ? `${current} ${word}`
                    : word;

                if (
                    measure(test) >
                        TEXT_MAX_WIDTH &&
                    current
                ) {
                    lines.push(current);
                    current = word;
                } else {
                    current = test;
                }
            }

            if (current) {
                lines.push(current);
            }

            const totalHeight =
                lines.length * lineHeight;

            const startY =
                state.height / 2 -
                totalHeight / 2 +
                lineHeight / 2;

            lines.forEach(
                (line, index) => {
                    const characters =
                        Array.from(line);

                    const widths =
                        characters.map(
                            (character) =>
                                ctx.measureText(
                                    character
                                ).width
                        );

                    const totalWidth =
                        widths.reduce(
                            (sum, width) =>
                                sum + width,
                            0
                        ) +
                        letterSpacing *
                            Math.max(
                                characters.length -
                                    1,
                                0
                            );

                    let x =
                        state.width / 2 -
                        totalWidth / 2;

                    characters.forEach(
                        (
                            character,
                            characterIndex
                        ) => {
                            const characterWidth =
                                widths[
                                    characterIndex
                                ];

                            ctx.fillText(
                                character,
                                x +
                                    characterWidth /
                                        2,
                                startY +
                                    index *
                                        lineHeight
                            );

                            x +=
                                characterWidth +
                                letterSpacing;
                        }
                    );
                }
            );

            ctx.restore();
        };

        const updateRotation = (delta) => {
            if (state.pointer.active) {
                return;
            }

            state.rotation.y +=
                state.velocity.y * delta;

            state.rotation.x +=
                state.velocity.x * delta;

            if (CONFIG.autoRotate) {
                state.rotation.y +=
                    CONFIG.spinY *
                    delta *
                    Math.PI *
                    2;

                state.rotation.x +=
                    CONFIG.spinX *
                    delta *
                    Math.PI *
                    2;
            }

            state.rotation.x = clamp(
                state.rotation.x,
                -CONFIG.dragClampX,
                CONFIG.dragClampX
            );
        };

        const render = () => {
            ctx.fillStyle =
                CONFIG.background;

            ctx.fillRect(
                0,
                0,
                state.width,
                state.height
            );

            if (!tiles.length) {
                return;
            }

            const centerX =
                state.width / 2;

            const centerY =
                state.height / 2;

            const cosY = Math.cos(
                state.rotation.y
            );

            const sinY = Math.sin(
                state.rotation.y
            );

            const cosX = Math.cos(
                state.rotation.x
            );

            const sinX = Math.sin(
                state.rotation.x
            );

            const renderList = [];

            for (
                let i = 0;
                i < items.length;
                i++
            ) {
                const item = items[i];

                const floatX =
                    Math.sin(
                        state.time *
                            CONFIG.floatSpeed +
                            item.phase
                    ) *
                    CONFIG.floatAmount;

                const floatY =
                    Math.cos(
                        state.time *
                            CONFIG.floatSpeed *
                            0.83 +
                            item.phase *
                                1.7
                    ) *
                    CONFIG.floatAmount;

                const x =
                    (item.x + floatX) *
                    CONFIG.radius;

                const y =
                    (item.y + floatY) *
                    CONFIG.radius;

                const z =
                    item.z *
                    CONFIG.radius;

                const rotatedX =
                    x * cosY -
                    z * sinY;

                const rotatedZ =
                    x * sinY +
                    z * cosY;

                const finalY =
                    y * cosX -
                    rotatedZ * sinX;

                const finalZ =
                    y * sinX +
                    rotatedZ * cosX;

                const cameraZ =
                    finalZ +
                    CONFIG.camera;

                if (cameraZ <= 0.05) {
                    continue;
                }

                const scale =
                    CONFIG.focalLength /
                    cameraZ /
                    1000;

                renderList.push({
                    item,

                    x:
                        centerX +
                        rotatedX *
                            scale *
                            1000,

                    y:
                        centerY +
                        finalY *
                            scale *
                            1000,

                    scale,
                    z: cameraZ,
                });
            }

            renderList.sort(
                (a, b) =>
                    b.z - a.z
            );

            const near =
                CONFIG.camera -
                CONFIG.radius;

            const far =
                CONFIG.camera +
                CONFIG.radius;

            const depthRange =
                Math.max(
                    far - near,
                    0.0001
                );

            const textDepth =
                CONFIG.camera;

            let textDrawn = false;

            for (
                let i = 0;
                i < renderList.length;
                i++
            ) {
                const renderItem =
                    renderList[i];

                if (
                    !textDrawn &&
                    renderItem.z <=
                        textDepth
                ) {
                    drawCenterText();
                    textDrawn = true;
                }

                const item =
                    renderItem.item;

                const tile =
                    tiles[
                        item.imageIndex %
                            tiles.length
                    ];

                if (!tile) {
                    continue;
                }

                const depth =
                    Math.min(
                        1,
                        Math.max(
                            0,
                            (renderItem.z -
                                near) /
                                depthRange
                        )
                    );

                let opacity =
                    1 -
                    CONFIG.fog * depth;

                opacity = Math.max(
                    opacity,
                    CONFIG.minOpacity
                );

                if (opacity <= 0.004) {
                    continue;
                }

                const sizeMultiplier =
                    1 +
                    item.scale *
                        CONFIG.sizeVariance;

                const baseSize =
                    CONFIG.size *
                    sizeMultiplier *
                    renderItem.scale;

                const aspectRatio =
                    tile.width /
                    tile.height;

                const tileWidth =
                    baseSize *
                    Math.sqrt(
                        aspectRatio
                    );

                const tileHeight =
                    baseSize /
                    Math.sqrt(
                        aspectRatio
                    );

                ctx.save();

                ctx.globalAlpha =
                    opacity;

                if (
                    CONFIG.blur &&
                    CONFIG.blurMax > 0.05
                ) {
                    const blurAmount =
                        depth *
                        CONFIG.blurMax;

                    ctx.filter =
                        blurAmount > 0.15
                            ? `blur(${blurAmount.toFixed(
                                  2
                              )}px)`
                            : "none";
                }

                ctx.translate(
                    renderItem.x,
                    renderItem.y
                );

                ctx.rotate(
                    item.tilt *
                        Math.PI /
                        180
                );

                ctx.drawImage(
                    tile,
                    -tileWidth / 2,
                    -tileHeight / 2,
                    tileWidth,
                    tileHeight
                );

                ctx.restore();
            }

            if (!textDrawn) {
                drawCenterText();
            }

            ctx.globalAlpha = 1;
            ctx.filter = "none";
        };

        const onPointerDown = (event) => {
            inertiaTween?.kill();
            inertiaTween = null;

            state.velocity.x = 0;
            state.velocity.y = 0;

            state.pointer.active = true;

            state.pointer.lastX =
                event.clientX;

            state.pointer.lastY =
                event.clientY;

            canvas.setPointerCapture(
                event.pointerId
            );

            canvas.classList.add(
                "is-dragging"
            );
        };

        const onPointerMove = (event) => {
            if (
                !state.pointer.active
            ) {
                return;
            }

            const deltaX =
                event.clientX -
                state.pointer.lastX;

            const deltaY =
                event.clientY -
                state.pointer.lastY;

            state.pointer.lastX =
                event.clientX;

            state.pointer.lastY =
                event.clientY;

            state.rotation.y +=
                deltaX *
                CONFIG.dragSensitivity;

            state.rotation.x +=
                deltaY *
                CONFIG.dragSensitivity;

            state.rotation.x = clamp(
                state.rotation.x,
                -CONFIG.dragClampX,
                CONFIG.dragClampX
            );

            const targetVelocityY =
                clamp(
                    deltaX *
                        CONFIG.dragSensitivity *
                        CONFIG.inertiaMultiplier,
                    -CONFIG.maxVelocity,
                    CONFIG.maxVelocity
                );

            const targetVelocityX =
                clamp(
                    deltaY *
                        CONFIG.dragSensitivity *
                        CONFIG.inertiaMultiplier,
                    -CONFIG.maxVelocity,
                    CONFIG.maxVelocity
                );

            state.velocity.y +=
                (targetVelocityY -
                    state.velocity.y) *
                CONFIG.velocitySmoothing;

            state.velocity.x +=
                (targetVelocityX -
                    state.velocity.x) *
                CONFIG.velocitySmoothing;

            event.preventDefault();
        };

        const onPointerUp = (event) => {
            if (
                !state.pointer.active
            ) {
                return;
            }

            state.pointer.active = false;

            canvas.classList.remove(
                "is-dragging"
            );

            try {
                canvas.releasePointerCapture(
                    event.pointerId
                );
            } catch {}

            inertia.x =
                state.velocity.x;

            inertia.y =
                state.velocity.y;

            inertiaTween = gsap.to(
                inertia,
                {
                    x: 0,
                    y: 0,

                    duration:
                        CONFIG.inertiaDuration,

                    ease:
                        CONFIG.inertiaEase,

                    overwrite: true,

                    onUpdate: () => {
                        state.velocity.x =
                            inertia.x;

                        state.velocity.y =
                            inertia.y;
                    },

                    onComplete: () => {
                        state.velocity.x = 0;
                        state.velocity.y = 0;

                        inertiaTween = null;
                    },
                }
            );
        };

        const onPointerCancel = (event) => {
            if (
                state.pointer.active
            ) {
                onPointerUp(event);
            }
        };

        const tick = (currentTime) => {
            if (!state.lastTime) {
                state.lastTime =
                    currentTime;

                return;
            }

            const delta = Math.min(
                currentTime -
                    state.lastTime,
                0.05
            );

            state.lastTime =
                currentTime;

            state.time += delta;

            updateRotation(delta);
            render();
        };

        const initialize = async () => {
            const loadedSources =
                await loadImages();

            sources.push(
                ...loadedSources
            );

            tiles.push(
                ...sources.map(
                    processImage
                )
            );

            createSphere();

            resize();
            render();
        };

        canvas.addEventListener(
            "pointerdown",
            onPointerDown
        );

        canvas.addEventListener(
            "pointermove",
            onPointerMove,
            {
                passive: false,
            }
        );

        canvas.addEventListener(
            "pointerup",
            onPointerUp
        );

        canvas.addEventListener(
            "pointercancel",
            onPointerCancel
        );

        resizeObserver =
            new ResizeObserver(resize);

        resizeObserver.observe(canvas);

        gsap.ticker.add(tick);

        initialize();

        return () => {
            inertiaTween?.kill();

            gsap.ticker.remove(tick);

            resizeObserver?.disconnect();

            canvas.removeEventListener(
                "pointerdown",
                onPointerDown
            );

            canvas.removeEventListener(
                "pointermove",
                onPointerMove
            );

            canvas.removeEventListener(
                "pointerup",
                onPointerUp
            );

            canvas.removeEventListener(
                "pointercancel",
                onPointerCancel
            );
        };
    }, []);

    return (
        <div className="cloud">
            <canvas
                ref={canvasRef}
                className="cloud__canvas"
            />
        </div>
    );
}