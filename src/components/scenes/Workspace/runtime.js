import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { PC_SCENE_CONFIG } from "./config";
import { disposeObject } from "../shared/dispose";
import { createAtmospherePass } from "../shared/atmosphere";
import {
    getPixelRatio,
    getRenderQuality,
} from "../shared/renderQuality";
import { mergeStaticMeshesAsync } from "../shared/mergeStaticMeshes";
import { scheduleIdleTask } from "@/lib/performance/idle";

function createRenderer(canvas, quality) {
    if (!canvas) {
        return null;
    }

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: quality.antialias,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        preserveDrawingBuffer: false,
    });

    renderer.setPixelRatio(
        getPixelRatio(quality.maxPixelRatio)
    );

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    renderer.toneMapping =
        PC_SCENE_CONFIG.renderer.toneMapping;

    renderer.toneMappingExposure =
        PC_SCENE_CONFIG.renderer.toneMappingExposure;

    const shadowsEnabled =
        PC_SCENE_CONFIG.renderer.shadows &&
        !quality.isMobile;

    renderer.shadowMap.enabled = shadowsEnabled;

    if (renderer.shadowMap.enabled) {
        renderer.shadowMap.type =
            THREE.PCFShadowMap;
    }

    return renderer;
}

function createScene() {
    const scene = new THREE.Scene();

    scene.background = new THREE.Color(
        PC_SCENE_CONFIG.background.color
    );

    return scene;
}

function getLayoutViewportSize() {
    const root = document.documentElement;

    return {
        width: Math.max(1, root.clientWidth || window.innerWidth),
        height: Math.max(1, root.clientHeight || window.innerHeight),
    };
}

function createCamera() {
    const {
        fov,
        near,
        far,
        position,
    } = PC_SCENE_CONFIG.camera;

    const { width, height } = getLayoutViewportSize();

    const camera = new THREE.PerspectiveCamera(
        fov,
        width / height,
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
    const light = new THREE.PointLight(
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

function configureModel(model, shadowsEnabled) {
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

        object.castShadow = shadowsEnabled;
        object.receiveShadow = shadowsEnabled;

        const materials = Array.isArray(
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
                material.map.anisotropy = 4;
            }

            const name = (
                material.name || ""
            ).toLowerCase();

            if (
                name.includes("screen") ||
                name.includes("monitor")
            ) {
                material.roughness = 0.2;
            } else if (name.includes("metal")) {
                material.roughness = 0.35;
            } else if (
                name.includes("mirror") ||
                name.includes("glass")
            ) {
                material.roughness = 0.08;
            } else {
                material.roughness = Math.max(
                    material.roughness,
                    0.65
                );
            }

            material.needsUpdate = true;
        });
    });

    return model;
}

function collectModelTextures(model) {
    const textures = new Set();
    const mapKeys = [
        "map",
        "normalMap",
        "roughnessMap",
        "metalnessMap",
        "aoMap",
        "emissiveMap",
        "alphaMap",
        "bumpMap",
        "clearcoatMap",
        "clearcoatNormalMap",
        "clearcoatRoughnessMap",
        "sheenColorMap",
        "sheenRoughnessMap",
        "transmissionMap",
        "thicknessMap",
        "iridescenceMap",
        "iridescenceThicknessMap",
        "specularColorMap",
        "specularIntensityMap",
    ];

    model.traverse((object) => {
        if (!object.isMesh) {
            return;
        }

        const materials = Array.isArray(
            object.material
        )
            ? object.material
            : [object.material];

        materials.forEach((material) => {
            mapKeys.forEach((key) => {
                const texture = material?.[key];

                if (texture?.isTexture) {
                    textures.add(texture);
                }
            });
        });
    });

    return Array.from(textures);
}

async function warmupRenderer(
    renderer,
    scene,
    camera,
    model,
    isMobile
) {
    const textures = collectModelTextures(model);

    const warmTextures = (deadline) => {
        const startedAt = performance.now();
        const sliceBudget = isMobile ? 2 : 3;

        for (const texture of textures) {
            if (texture.userData.__webglWarmed) {
                continue;
            }

            if (deadline &&
                typeof deadline.timeRemaining === "function" &&
                deadline.timeRemaining() <= 1) {
                break;
            }

            if (
                performance.now() - startedAt >=
                sliceBudget
            ) {
                break;
            }

            try {
                renderer.initTexture?.(texture);
                texture.userData.__webglWarmed = true;
            } catch {
                // Texture initialization is an optimization only.
            }
        }

        return textures.every(
            (texture) =>
                texture.userData.__webglWarmed
        );
    };

    while (!warmTextures(null)) {
        await new Promise((resolve) => {
            scheduleIdleTask(
                (deadline) => {
                    warmTextures(deadline);
                    resolve();
                },
                { timeout: 500 }
            );
        });
    }

    if (typeof renderer.compileAsync === "function") {
        try {
            await renderer.compileAsync(
                scene,
                camera
            );
        } catch {
            renderer.compile(scene, camera);
        }
    } else {
        renderer.compile(scene, camera);
    }
}

export function createFooterWebGLRuntime({
    canvas,
    section,
    onReady,
    onProgress,
}) {
    if (!canvas || !section) {
        return null;
    }

    let disposed = false;
    let isActive = false;
    let animationFrame = 0;
    let elapsedTime = 0;
    let previousTimestamp = null;
    let model = null;
    let mergeTask = null;
    let warmupCancel = () => {};
    let warmupPromise = Promise.resolve();

    const quality = getRenderQuality();
    const updateCallbacks = new Set();
    const scene = createScene();
    const camera = createCamera();
    const renderer = createRenderer(canvas, quality);

    if (!renderer) {
        return null;
    }

    const loadingManager = new THREE.LoadingManager();

    loadingManager.onProgress = (
        _url,
        itemsLoaded,
        itemsTotal
    ) => {
        const fileProgress =
            itemsTotal > 0
                ? itemsLoaded / itemsTotal
                : 0;

        // LoadingManager can discover nested GLTF textures later, so keep
        // the file-loading phase below the final ready state.
        onProgress?.(Math.min(fileProgress * 0.8, 0.8));
    };

    onProgress?.(0);

    const shadowsEnabled =
        PC_SCENE_CONFIG.renderer.shadows &&
        !quality.isMobile;

    scene.add(camera);

    const mainLight = createPointLight(
        PC_SCENE_CONFIG.lights.main
    );
    mainLight.castShadow = shadowsEnabled;

    if (shadowsEnabled) {
        mainLight.shadow.mapSize.set(
            quality.workspaceShadowMapSize,
            quality.workspaceShadowMapSize
        );
        mainLight.shadow.bias = -0.0004;
        mainLight.shadow.normalBias = 0.015;
    }
    scene.add(mainLight);

    const sunLight = createPointLight(
        PC_SCENE_CONFIG.lights.sun
    );
    sunLight.castShadow = shadowsEnabled;

    if (shadowsEnabled) {
        sunLight.shadow.mapSize.set(
            quality.workspaceShadowMapSize,
            quality.workspaceShadowMapSize
        );
        sunLight.shadow.bias = -0.0004;
        sunLight.shadow.normalBias = 0.015;
    }
    scene.add(sunLight);

    const skyLight = createPointLight(
        PC_SCENE_CONFIG.lights.sky
    );
    scene.add(skyLight);

    const crtLight = createPointLight(
        PC_SCENE_CONFIG.lights.crt
    );
    camera.add(crtLight);

    let composer = null;
    let renderPass = null;
    let bloomPass = null;
    let atmospherePass = null;
    let outputPass = null;

    if (!quality.isMobile) {
        const composerPixelRatio = getPixelRatio(
            quality.composerMaxPixelRatio
        );

        composer = new EffectComposer(renderer);
        composer.setPixelRatio(composerPixelRatio);

        renderPass = new RenderPass(
            scene,
            camera
        );

        const { width: initialWidth, height: initialHeight } =
            getLayoutViewportSize();

        bloomPass = new UnrealBloomPass(
            new THREE.Vector2(
                initialWidth,
                initialHeight
            ),
            PC_SCENE_CONFIG.bloom.strength,
            PC_SCENE_CONFIG.bloom.radius,
            PC_SCENE_CONFIG.bloom.threshold
        );

        atmospherePass = createAtmospherePass(
            PC_SCENE_CONFIG.atmosphere,
            false
        );

        outputPass = new OutputPass();

        composer.addPass(renderPass);
        composer.addPass(bloomPass);
        composer.addPass(atmospherePass);
        composer.addPass(outputPass);
    }

    const setActive = (active) => {
        isActive = Boolean(active);

        if (!isActive || document.hidden) {
            previousTimestamp = null;

            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = 0;
            }

            return;
        }

        if (!animationFrame) {
            animationFrame = requestAnimationFrame(render);
        }
    };

    const handleVisibilityChange = () => {
        setActive(isActive);
    };

    const loader = new GLTFLoader(
        loadingManager
    );

    loader.load(
        PC_SCENE_CONFIG.model.path,
        (gltf) => {
            if (disposed) {
                disposeObject(gltf.scene);
                return;
            }

            model = configureModel(
                gltf.scene,
                shadowsEnabled
            );
            scene.add(model);

            if (quality.isMobile) {
                mergeTask = {
                    promise: Promise.resolve(),
                    cancel() {},
                };
            } else {
                mergeTask = mergeStaticMeshesAsync(model, {
                    castShadow: shadowsEnabled,
                    receiveShadow: shadowsEnabled,
                });
            }

            if (quality.isMobile) {
                warmupPromise = Promise.resolve();
                warmupCancel = () => {};
            } else {
                let resolveWarmup;

                warmupPromise = new Promise((resolve) => {
                    resolveWarmup = resolve;
                });

                warmupCancel = scheduleIdleTask(
                    async () => {
                        try {
                            if (!disposed && model) {
                                await warmupRenderer(
                                    renderer,
                                    scene,
                                    camera,
                                    model,
                                    false
                                );
                            }
                        } catch (error) {
                            console.warn(
                                "Three.js: PcRoom warm-up skipped.",
                                error
                            );
                        } finally {
                            resolveWarmup?.();
                        }
                    },
                    { timeout: 2500 }
                );
            }

            Promise.all([
                mergeTask.promise,
                warmupPromise,
            ]).then(() => {
                if (disposed) {
                    return;
                }

                onProgress?.(1);

                onReady?.({
                    status: "ready",
                });
            });
        },
        undefined,
        (error) => {
            console.error(
                `Failed to load Three.js model: ${PC_SCENE_CONFIG.model.path}`,
                error
            );

            onProgress?.(1);

            onReady?.({
                status: "error",
                error,
            });
        }
    );

    loadingManager.onLoad = () => {
        onProgress?.(0.92);
    };

    const pointer = new THREE.Vector2();
    const targetRotation = {
        x: 0,
        y: 0,
    };
    const currentRotation = {
        x: 0,
        y: 0,
    };

    const handlePointerMove = (event) => {
        pointer.x =
            (event.clientX / window.innerWidth) * 2 -
            1;

        pointer.y = -(
            (event.clientY / window.innerHeight) *
                2 -
            1
        );

        targetRotation.x =
            -pointer.y * 0.12;
        targetRotation.y =
            pointer.x * 0.16;
    };

    const isTouchDevice = quality.isMobile;

    if (!isTouchDevice) {
        window.addEventListener(
            "pointermove",
            handlePointerMove
        );
    }

    let lastWidth = 0;
    let lastHeight = 0;

    const handleResize = () => {
        const width =
            section.clientWidth || getLayoutViewportSize().width;
        const height =
            section.clientHeight || getLayoutViewportSize().height;

        // The mobile browser can emit resize while its UI expands/collapses.
        // The section uses svh, so when its real layout size is unchanged there
        // is nothing to rebuild in the WebGL renderer.
        if (width === lastWidth && height === lastHeight) {
            return;
        }

        lastWidth = width;
        lastHeight = height;

        const nextPixelRatio = getPixelRatio(
            quality.maxPixelRatio
        );

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setPixelRatio(nextPixelRatio);
        renderer.setSize(width, height, false);

        if (composer) {
            const nextComposerPixelRatio = getPixelRatio(
                quality.composerMaxPixelRatio
            );

            composer.setPixelRatio(nextComposerPixelRatio);
            composer.setSize(width, height);

            bloomPass?.resolution.set(width, height);
        }
    };

    window.addEventListener(
        "resize",
        handleResize
    );

    document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
    );

    handleResize();

    function render(timestamp) {
        animationFrame = 0;

        if (
            disposed ||
            !isActive ||
            document.hidden
        ) {
            previousTimestamp = null;
            return;
        }

        if (previousTimestamp === null) {
            previousTimestamp = timestamp;
        }

        const delta = Math.min(
            (timestamp - previousTimestamp) / 1000,
            0.05
        );

        previousTimestamp = timestamp;
        elapsedTime += Math.max(delta, 0);

        currentRotation.x +=
            (targetRotation.x - currentRotation.x) *
            0.06;

        currentRotation.y +=
            (targetRotation.y - currentRotation.y) *
            0.004;

        camera.rotation.x = currentRotation.x;
        camera.rotation.y = currentRotation.y;

        if (quality.isMobile) {
            renderer.render(scene, camera);
        } else {
            atmospherePass.uniforms.uTime.value =
                elapsedTime;

            composer.render();
        }

        updateCallbacks.forEach((callback) => {
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
        });

        if (isActive && !document.hidden) {
            animationFrame = requestAnimationFrame(render);
        }
    }

    const initialRect =
        section.getBoundingClientRect();

    if (
        initialRect.bottom > -200 &&
        initialRect.top <
            (document.documentElement.clientHeight ||
                window.innerHeight) + 200 &&
        !document.hidden
    ) {
        setActive(true);
    }

    return {
        scene,
        camera,
        renderer,
        composer,
        setActive,

        get model() {
            return model;
        },

        registerUpdate(callback) {
            if (typeof callback !== "function") {
                return () => {};
            }

            updateCallbacks.add(callback);

            return () => {
                updateCallbacks.delete(callback);
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

            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );

            warmupCancel();
            mergeTask?.cancel?.();

            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = 0;
            }

            updateCallbacks.clear();

            disposeObject(model);

            composer?.dispose();
            bloomPass?.dispose();
            atmospherePass?.dispose();
            outputPass?.dispose();

            renderer.dispose();
            scene.clear();
        },
    };
}
