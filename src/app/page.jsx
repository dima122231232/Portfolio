"use client";

import ThreeScene from "@/components/scenes/Hero/ThreeScene";
import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import "./home.css";
import About from "@/components/sections/About/About";
import Work from "@/components/sections/Work/Work";
import PcRoom from "@/components/scenes/Workspace/PcRoom";

export default function Home() {
    const page = useRef(null);
    const [heroReady, setHeroReady] =
        useState(false);
    const [pcRoomEnabled, setPcRoomEnabled] =
        useState(false);
    const [pcRoomReady, setPcRoomReady] =
        useState(false);

    const handleSceneLeave = () => {
        gsap.to(
            ".mesh-line:nth-child(1), .mesh-line:nth-child(2)",
            {
                scaleY: 1,
                duration: 1.5,
                ease: "none",
            }
        );

        gsap.to(".mesh-cross", {
            opacity: 1,
            duration: 1.5,
            delay: 0.5,
            ease: "none",
        });
        gsap.set(".Info-me", {
            opacity: 1
        });
    };

    const handleSceneEnterBack = () => {
        gsap.to(
            ".mesh-line:nth-child(1), .mesh-line:nth-child(2)",
            {
                scaleY: 0,
                duration: 0.5,
                ease: "none",
            }
        );

        gsap.to(".mesh-cross", {
            opacity: 0,
            duration: 0.5,
            ease: "none",
        });
        gsap.to(".Info-me", {
            opacity: 0,
            duration:.5
        });
    };

    const handleHeroReady = useCallback(() => {
        setHeroReady(true);
    }, []);

    const handlePcRoomReady = useCallback(
        (result) => {
            if (result?.status === "ready") {
                setPcRoomReady(true);
            }
        },
        []
    );

    useEffect(() => {
        if (heroReady) {
            setPcRoomEnabled(true);
        }
    }, [heroReady]);

    useGSAP(() => {}, { scope: page });

    return (
        <main ref={page}>
            <div className="global-mesh">
                <svg
                    className="mesh-svg"
                    width="100%"
                    height="100%"
                    viewBox="0 0 1440 800"
                    preserveAspectRatio="none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <line
                        className="mesh-line"
                        x1="479.5"
                        y1="800"
                        x2="479.5"
                        y2="0"
                    />
                    <line
                        className="mesh-line"
                        x1="959.5"
                        y1="800"
                        x2="959.5"
                        y2="0"
                    />

                    <g className="mesh-cross">
                        <line
                            x1="474"
                            y1="266.5"
                            x2="485"
                            y2="266.5"
                        />
                        <line
                            x1="479.5"
                            y1="261"
                            x2="479.5"
                            y2="272"
                        />
                    </g>

                    <g className="mesh-cross">
                        <line
                            x1="474"
                            y1="533.5"
                            x2="485"
                            y2="533.5"
                        />
                        <line
                            x1="479.5"
                            y1="528"
                            x2="479.5"
                            y2="539"
                        />
                    </g>

                    <g className="mesh-cross">
                        <line
                            x1="954"
                            y1="533.5"
                            x2="965"
                            y2="533.5"
                        />
                        <line
                            x1="959.5"
                            y1="528"
                            x2="959.5"
                            y2="539"
                        />
                    </g>

                    <g className="mesh-cross">
                        <line
                            x1="954"
                            y1="266.5"
                            x2="965"
                            y2="266.5"
                        />
                        <line
                            x1="959.5"
                            y1="261"
                            x2="959.5"
                            y2="272"
                        />
                    </g>
                </svg>
            </div>

            <div className="Bg__blur" />

            <ThreeScene
                onLeave={handleSceneLeave}
                onEnterBack={handleSceneEnterBack}
                onReady={handleHeroReady}
            />

            <div className="enterAnout" />
            <About />

            <PcRoom
                enabled={pcRoomEnabled}
                onReady={handlePcRoomReady}
            />

            <Work loadImages={pcRoomReady} />
        </main>
    );
}