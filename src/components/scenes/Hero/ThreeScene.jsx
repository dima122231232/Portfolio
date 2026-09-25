"use client";

import { useEffect, useRef } from "react";
import { createWebGLRuntime } from "@/components/scenes/Hero/runtime";
import "./ThreeScene.css";

export default function ThreeScene({
    onLeave,
    onEnterBack,
    onReady,
    onProgress,
}) {
    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);
    const onLeaveRef = useRef(onLeave);
    const onEnterBackRef = useRef(onEnterBack);
    const onReadyRef = useRef(onReady);
    const onProgressRef = useRef(onProgress);

    useEffect(() => {
        onLeaveRef.current = onLeave;
        onEnterBackRef.current = onEnterBack;
        onReadyRef.current = onReady;
        onProgressRef.current = onProgress;
    }, [onLeave, onEnterBack, onReady, onProgress]);

    useEffect(() => {
        if (!canvasRef.current || !wrapperRef.current) {
            return undefined;
        }

        const runtime = createWebGLRuntime({
            canvas: canvasRef.current,
            wrapper: wrapperRef.current,
            onLeave: () => onLeaveRef.current?.(),
            onEnterBack: () => onEnterBackRef.current?.(),
            onReady: (result) =>
                onReadyRef.current?.(result),
            onProgress: (value) =>
                onProgressRef.current?.(value),
        });

        return () => {
            runtime?.destroy();
        };
    }, []);

    return (
        <section className="webgl-section">
            <div ref={wrapperRef} className="webgl-wrapper">
                <canvas ref={canvasRef} className="webgl" />
            </div>
        </section>
    );
}
