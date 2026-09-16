import * as THREE from "three";

export const PC_SCENE_CONFIG = {
    camera: {
        fov: 45,
        near: 0.1,
        far: 100,

        position: {
            x: 0,
            y: 0,
            z: 0,
        },
    },

    renderer: {
        antialias: true,
        maxPixelRatio: 2,
        shadows: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
    },

    background: {
        color: 0xfff4d2,
    },

    model: {
        path: "/3d model/cave_rocks.glb",

        position: {
            x: -1,
            y: -1.5,
            z: -9,
        },

        rotation: {
            x: .05,
            y: -.8,
            z: 0,
        },
    },

    lights: {
        main: {
            color: 0xffffff,
            intensity: 100,
            distance: 100,

            position: {
                x: 5,
                y: 5,
                z: 10,
            },
        },

        sun: {
            color: 0xffd59d,
            intensity: 8,
            distance: 10,

            position: {
                x: -2,
                y: 4,
                z: -3,
            },
        },

        sky: {
            color: 0xaacbff,
            intensity: 1,
            distance: 8,

            position: {
                x: 2,
                y: 3,
                z: -2,
            },
        },

        crt: {
            color: 0x4167ff,
            intensity: .35,
            distance: 2,

            position: {
                x: -.45,
                y: .8,
                z: -.2,
            },
        },
    },

    atmosphere: {
        grain: .018,
        scanline: .008,
        vignette: .28,
        chromatic: .0008,
    },

    bloom: {
        strength: .28,
        radius: .17,
        threshold: .18,
    },
};