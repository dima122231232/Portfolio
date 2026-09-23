import * as THREE from "three";

export const SCENE_CONFIG = {
    camera: {
        fov: 45,
        near: 0.1,
        far: 100,
        position: {
            x: 0,
            y: 0,
            z: 1,
        },
    },

    renderer: {
        antialias: true,
        maxPixelRatio: 2,
        shadows: false,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1,
    },

    background: {
        color: 0xfffcd6,
        fogDensity: 0,
    },

    lights: {
        main: {
            type: "point",
            color: 0xffffff,
            intensity: 100,
            distance: 100,
            position: {
                x: 5,
                y: 5,
                z: 10,
            },
        },

        core: {
            type: "point",
            color: 0x385dff,
            intensity: 25,
            distance: 10,
            position: {
                x: 0,
                y: 0,
                z: -1,
            },
        },

        sun: {
            type: "point",
            color: 0xffd59d,
            intensity: 7,
            distance: 10,
            position: {
                x: -2,
                y: 4,
                z: -3,
            },
        },
    },

    interaction: {
        pointer: {
            rotationX: 0.22,
            rotationY: 0.32,
            duration: 1.2,
            ease: "power2.out",
        },

        scroll: {
            cameraZ: -5.5,
            scrub: 1,
            endMultiplier: 1,
        },
    },

    model: {
        path: "/3d model/1.glb",
        position: {
            x: 0,
            y: 0,
            z: 1,
        },
    },

    photo: {
        path: "/img/main-photo.png",

        position: {
            x: 0,
            y: -.165,
            z: .45,
        },

        height: .015,

        glow: {
            opacity: 0,
        },

        opacity: 1,
        transparent: true,
    },

    text: {
        content: "",

        position: {
            x: 0,
            y: .2,
            z: .45,
        },

        fontSize: 38,
        fontWeight: 700,
        color: "#ffffff",
    },

    particleVolume: {
        debug: true,

        position: {
            x: 0,
            y: 0,
            z: -2,
        },

        width: 4,
        height: 1.8,
        depth: 4,
    },

    particles: {
        far: {
            count: 500,
            size: 0.05,
            opacity: 0.5,
            speed: 0.045,
            drift: 0.12,
            color: 0xfff0d0,
            edgeBias: 0.25,
        },

        mid: {
            count: 50,
            size: 0.11,
            opacity: 0.4,
            speed: 0.125,
            drift: 0.18,
            color: 0xffb36b,
            edgeBias: 0.35,
        },

        near: {
            count: 200,
            size: 0.24,
            opacity: 0.3,
            speed: 0.15,
            drift: 0.24,
            color: 0xffd7a3,
            edgeBias: 0.55,
        },
    },

    surface: {
        roughness: .08,
        grain: .025,
    },

    atmosphere: {
        grain: .025,
        scanline: .025,
        vignette: .28,
        chromatic: .0008,
    },

    bloom: {
        strength: .48,
        radius: .82,
        threshold: .68,
    },
};