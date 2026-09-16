import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { PC_SCENE_CONFIG } from "./config";
import { disposeObject } from "../shared/dispose";

const ATMOSPHERE_SHADER = {
    uniforms: {
        tDiffuse: {
            value: null,
        },

        uTime: {
            value: 0,
        },

        uGrain: {
            value:
                PC_SCENE_CONFIG
                    .atmosphere
                    .grain,
        },

        uScanline: {
            value:
                PC_SCENE_CONFIG
                    .atmosphere
                    .scanline,
        },

        uVignette: {
            value:
                PC_SCENE_CONFIG
                    .atmosphere
                    .vignette,
        },

        uChromatic: {
            value:
                PC_SCENE_CONFIG
                    .atmosphere
                    .chromatic,
        },
    },

    vertexShader: `
        varying vec2 vUv;

        void main() {
            vUv = uv;

            gl_Position =
                projectionMatrix *
                modelViewMatrix *
                vec4(position, 1.0);
        }
    `,

    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float uTime;
        uniform float uGrain;
        uniform float uScanline;
        uniform float uVignette;
        uniform float uChromatic;

        varying vec2 vUv;

        float random(vec2 p) {
            return fract(
                sin(
                    dot(
                        p,
                        vec2(
                            12.9898,
                            78.233
                        )
                    )
                ) *
                43758.5453
            );
        }

        void main() {
            vec2 uv = vUv;

            float r =
                texture2D(
                    tDiffuse,
                    uv +
                    vec2(
                        uChromatic,
                        0.0
                    )
                ).r;

            float g =
                texture2D(
                    tDiffuse,
                    uv
                ).g;

            float b =
                texture2D(
                    tDiffuse,
                    uv -
                    vec2(
                        uChromatic,
                        0.0
                    )
                ).b;

            vec3 color =
                vec3(
                    r,
                    g,
                    b
                );

            float noise =
                random(
                    uv * 900.0 +
                    uTime
                );

            color +=
                (
                    noise - .5
                ) *
                uGrain;

            float scan =
                sin(
                    uv.y * 900.0
                ) *
                .5 +
                .5;

            color *=
                1.0 -
                scan *
                uScanline;

            vec2 centered =
                uv -
                .5;

            float vignette =
                smoothstep(
                    .15,
                    .8,
                    dot(
                        centered,
                        centered
                    )
                );

            color *=
                1.0 -
                vignette *
                uVignette;

            gl_FragColor =
                vec4(
                    color,
                    1.0
                );
        }
    `,
};

function createRenderer(canvas) {
    if (!canvas) {
        return null;
    }

    const renderer =
        new THREE.WebGLRenderer({
            canvas,
            antialias:
                PC_SCENE_CONFIG
                    .renderer
                    .antialias,
            alpha: false,
            powerPreference:
                "high-performance",
        });

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            PC_SCENE_CONFIG
                .renderer
                .maxPixelRatio
        )
    );

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    renderer.toneMapping =
        PC_SCENE_CONFIG
            .renderer
            .toneMapping;

    renderer.toneMappingExposure =
        PC_SCENE_CONFIG
            .renderer
            .toneMappingExposure;

    renderer.shadowMap.enabled =
        PC_SCENE_CONFIG
            .renderer
            .shadows;

    renderer.shadowMap.type =
        THREE.PCFShadowMap;

    return renderer;
}

function createScene() {
    const scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(
            PC_SCENE_CONFIG
                .background
                .color
        );

    return scene;
}

function createCamera() {
    const {
        fov,
        near,
        far,
        position,
    } = PC_SCENE_CONFIG.camera;

    const camera =
        new THREE.PerspectiveCamera(
            fov,
            window.innerWidth /
                window.innerHeight,
            near,
            far
        );

    camera.position.set(
        position.x,
        position.y,
        position.z
    );

    return camera;
}

function createPointLight(config) {
    const light =
        new THREE.PointLight(
            config.color,
            config.intensity,
            config.distance
        );

    light.position.set(
        config.position.x,
        config.position.y,
        config.position.z
    );

    return light;
}

function configureModel(model) {
    const {
        position,
        rotation,
    } = PC_SCENE_CONFIG.model;

    model.position.set(
        position.x,
        position.y,
        position.z
    );

    model.rotation.set(
        rotation.x,
        rotation.y,
        rotation.z
    );

    model.traverse((object) => {
        if (!object.isMesh) {
            return;
        }

        object.castShadow =
            PC_SCENE_CONFIG
                .renderer
                .shadows;

        object.receiveShadow =
            PC_SCENE_CONFIG
                .renderer
                .shadows;

        const materials =
            Array.isArray(
                object.material
            )
                ? object.material
                : [object.material];

        materials.forEach((material) => {
            if (!material) {
                return;
            }

            if (material.map) {
                material.map.colorSpace =
                    THREE.SRGBColorSpace;

                material.map.anisotropy =
                    4;
            }

            const name =
                material.name.toLowerCase();

            if (
                name.includes("screen") ||
                name.includes("monitor")
            ) {
                material.roughness =
                    .2;
            } else if (
                name.includes("metal")
            ) {
                material.roughness =
                    .35;
            } else if (
                name.includes("mirror") ||
                name.includes("glass")
            ) {
                material.roughness =
                    .08;
            } else {
                material.roughness =
                    Math.max(
                        material.roughness,
                        .65
                    );
            }

            material.needsUpdate =
                true;
        });
    });

    return model;
}

export function createFooterWebGLRuntime({
    canvas,
    section,
}) {
    if (
        !canvas ||
        !section
    ) {
        return null;
    }

    let disposed = false;
    let animationFrame = 0;
    let model = null;

    const updateCallbacks =
        new Set();

    const scene =
        createScene();

    const camera =
        createCamera();

    const renderer =
        createRenderer(canvas);

    if (!renderer) {
        return null;
    }

    scene.add(camera);

    const mainLight =
        createPointLight(
            PC_SCENE_CONFIG
                .lights
                .main
        );

    mainLight.castShadow =
        true;

    mainLight.shadow.mapSize.set(
        1024,
        1024
    );

    mainLight.shadow.bias =
        -.0004;

    mainLight.shadow.normalBias =
        .015;

    scene.add(mainLight);

    const sunLight =
        createPointLight(
            PC_SCENE_CONFIG
                .lights
                .sun
        );

    sunLight.castShadow =
        true;

    sunLight.shadow.mapSize.set(
        1024,
        1024
    );

    sunLight.shadow.bias =
        -.0004;

    sunLight.shadow.normalBias =
        .015;

    scene.add(sunLight);

    const skyLight =
        createPointLight(
            PC_SCENE_CONFIG
                .lights
                .sky
        );

    scene.add(skyLight);

    const crtLight =
        createPointLight(
            PC_SCENE_CONFIG
                .lights
                .crt
        );

    camera.add(crtLight);

    const composer =
        new EffectComposer(
            renderer
        );

    const pixelRatio =
        Math.min(
            window.devicePixelRatio,
            PC_SCENE_CONFIG
                .renderer
                .maxPixelRatio
        );

    composer.setPixelRatio(
        pixelRatio
    );

    const renderPass =
        new RenderPass(
            scene,
            camera
        );

    composer.addPass(
        renderPass
    );

    const bloomPass =
        new UnrealBloomPass(
            new THREE.Vector2(
                window.innerWidth,
                window.innerHeight
            ),

            PC_SCENE_CONFIG
                .bloom
                .strength,

            PC_SCENE_CONFIG
                .bloom
                .radius,

            PC_SCENE_CONFIG
                .bloom
                .threshold
        );

    composer.addPass(
        bloomPass
    );

    const atmospherePass =
        new ShaderPass(
            ATMOSPHERE_SHADER
        );

    composer.addPass(
        atmospherePass
    );

    const outputPass =
        new OutputPass();

    composer.addPass(
        outputPass
    );

    const loader =
        new GLTFLoader();

    loader.load(
        PC_SCENE_CONFIG
            .model
            .path,

        (gltf) => {
            if (disposed) {
                disposeObject(
                    gltf.scene
                );

                return;
            }

            model =
                configureModel(
                    gltf.scene
                );

            scene.add(model);
        },

        undefined,

        (error) => {
            console.error(
                `Failed to load Three.js model: ${PC_SCENE_CONFIG.model.path}`,
                error
            );
        }
    );

    const pointer =
        new THREE.Vector2();

    const targetRotation = {
        x: 0,
        y: 0,
    };

    const currentRotation = {
        x: 0,
        y: 0,
    };

    const handlePointerMove =
        (event) => {
            pointer.x =
                (
                    event.clientX /
                    window.innerWidth
                ) *
                    2 -
                1;

            pointer.y =
                -(
                    (
                        event.clientY /
                        window.innerHeight
                    ) *
                        2 -
                    1
                );

            targetRotation.x =
                -pointer.y *
                .12;

            targetRotation.y =
                pointer.x *
                .16;
        };

    const isTouchDevice =
        window.matchMedia("(pointer: coarse)").matches;

    if (!isTouchDevice) {
        window.addEventListener(
            "pointermove",
            handlePointerMove
        );
    }

    const handleResize =
        () => {
            const width =
                section.clientWidth ||
                window.innerWidth;

            const height =
                section.clientHeight ||
                window.innerHeight;

            const nextPixelRatio =
                Math.min(
                    window.devicePixelRatio,
                    PC_SCENE_CONFIG
                        .renderer
                        .maxPixelRatio
                );

            camera.aspect =
                width / height;

            camera.updateProjectionMatrix();

            renderer.setPixelRatio(
                nextPixelRatio
            );

            renderer.setSize(
                width,
                height,
                false
            );

            composer.setPixelRatio(
                nextPixelRatio
            );

            composer.setSize(
                width,
                height
            );

            bloomPass.resolution.set(
                width,
                height
            );
        };

    window.addEventListener(
        "resize",
        handleResize
    );

    handleResize();

    const timer =
        new THREE.Timer();

    timer.connect(document);

    const render =
        (timestamp) => {
            if (disposed) {
                return;
            }

            timer.update(
                timestamp
            );

            currentRotation.x +=
                (
                    targetRotation.x -
                    currentRotation.x
                ) *
                .004;

            currentRotation.y +=
                (
                    targetRotation.y -
                    currentRotation.y
                ) *
                .002;

            camera.rotation.x =
                currentRotation.x;

            camera.rotation.y =
                currentRotation.y;

            const elapsedTime =
                timer.getElapsed();

            atmospherePass
                .uniforms
                .uTime
                .value =
                elapsedTime;

            composer.render();

            updateCallbacks.forEach(
                (callback) => {
                    callback({
                        scene,
                        camera,
                        renderer,
                        composer,
                        model,
                        mainLight,
                        sunLight,
                        skyLight,
                        crtLight,
                    });
                }
            );

            animationFrame =
                requestAnimationFrame(
                    render
                );
        };

    animationFrame =
        requestAnimationFrame(
            render
        );

    return {
        scene,
        camera,
        renderer,
        composer,

        get model() {
            return model;
        },

        registerUpdate(callback) {
            if (
                typeof callback !==
                "function"
            ) {
                return () => {};
            }

            updateCallbacks.add(
                callback
            );

            return () => {
                updateCallbacks.delete(
                    callback
                );
            };
        },

        destroy() {
            if (disposed) {
                return;
            }

            disposed = true;

            if (!isTouchDevice) {
                window.removeEventListener(
                    "pointermove",
                    handlePointerMove
                );
            }

            window.removeEventListener(
                "resize",
                handleResize
            );

            cancelAnimationFrame(
                animationFrame
            );

            timer.dispose();

            updateCallbacks.clear();

            disposeObject(
                model
            );

            composer.dispose();

            bloomPass.dispose();

            atmospherePass.dispose();

            outputPass.dispose();

            renderer.dispose();

            scene.clear();
        },
    };
}