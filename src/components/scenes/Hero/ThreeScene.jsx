"use client";

import { useEffect, useRef } from "react";
import { createWebGLRuntime } from "@/components/scenes/Hero/runtime";
import "./ThreeScene.css";

export default function ThreeScene({ onLeave, onEnterBack }) {
    const canvasRef = useRef(null);
    const wrapperRef = useRef(null);
    const onLeaveRef = useRef(onLeave);
    const onEnterBackRef = useRef(onEnterBack);

    useEffect(() => {
        onLeaveRef.current = onLeave;
        onEnterBackRef.current = onEnterBack;
    }, [onLeave, onEnterBack]);

    useEffect(() => {
        if (!canvasRef.current || !wrapperRef.current) return undefined;

        const runtime = createWebGLRuntime({
            canvas: canvasRef.current,
            wrapper: wrapperRef.current,
            onLeave: () => onLeaveRef.current?.(),
            onEnterBack: () => onEnterBackRef.current?.(),
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
