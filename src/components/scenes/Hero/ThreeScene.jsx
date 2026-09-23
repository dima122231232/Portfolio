"use client";

import { useEffect, useRef } from "react";
import { createWebGLRuntime } from "@/components/scenes/Hero/runtime";
import "./ThreeScene.css";

export default function ThreeScene({
    onLeave,
    onEnterBack,
    onReady,
}) {
    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);
    const onLeaveRef = useRef(onLeave);
    const onEnterBackRef = useRef(onEnterBack);
    const onReadyRef = useRef(onReady);

    useEffect(() => {
        onLeaveRef.current = onLeave;
        onEnterBackRef.current = onEnterBack;
        onReadyRef.current = onReady;
    }, [onLeave, onEnterBack, onReady]);

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
