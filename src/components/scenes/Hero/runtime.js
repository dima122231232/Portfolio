import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCENE_CONFIG } from "./config";
import {
    createParticleSystem,
    createParticleVolumeHelper,
    updateParticleSystem,
} from "./particles";
import { disposeObject } from "../shared/dispose";
import {
    createAtmospherePass,
} from "../shared/atmosphere";
import {
    getPixelRatio,
    getRenderQuality,
} from "../shared/renderQuality";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    // Mobile browser UI can change the visual viewport height while the
    // layout viewport stays the same. Ignore those transient height changes
    // so ScrollTrigger does not rebuild scroll positions while the user scrolls.
    ScrollTrigger.config({
        ignoreMobileResize: true,
    });
}

function getLayoutViewportSize() {
    const root = document.documentElement;

    return {
        width: Math.max(1, root.clientWidth || window.innerWidth),
        height: Math.max(1, root.clientHeight || window.innerHeight),
    };
}

function createRenderer(canvas, quality) {
    const canvasElement =
        canvas?.current ??
        canvas?.querySelector?.("canvas") ??
        canvas;

    if (
        !canvasElement ||
        typeof canvasElement.getContext !== "function"
    ) {
        console.error(
            "Three.js: createRenderer expected an HTMLCanvasElement, a React ref to canvas, or an element containing a canvas."
        );

        return null;
    }

    const renderer = new THREE.WebGLRenderer({
        canvas: canvasElement,
        antialias: quality.antialias,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        preserveDrawingBuffer: false,
    });

    renderer.setPixelRatio(
        getPixelRatio(quality.maxPixelRatio)
    );

    const { width, height } = getLayoutViewportSize();

    renderer.setSize(
        width,
        height,
        false
    );

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    renderer.toneMapping =
        SCENE_CONFIG.renderer.toneMapping;

    renderer.toneMappingExposure =
        SCENE_CONFIG.renderer.toneMappingExposure;

    renderer.shadowMap.enabled =
        SCENE_CONFIG.renderer.shadows;

    if (renderer.shadowMap.enabled) {
        renderer.shadowMap.type =
            THREE.PCFShadowMap;
    }

    return renderer;
}

function createScene() {
    const scene = new THREE.Scene();
    const background = new THREE.Color(
        SCENE_CONFIG.background.color
    );

    scene.background = background;
    scene.fog = new THREE.FogExp2(
        background,
        SCENE_CONFIG.background.fogDensity
    );

    return scene;
}

function createCamera() {
    const {
        fov,
        near,
        far,
        position,
    } = SCENE_CONFIG.camera;

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

function createPhoto(manager, onLoad) {
    const textureLoader = new THREE.TextureLoader(
        manager
    );

    textureLoader.load(
        SCENE_CONFIG.photo.path,
        (texture) => {
            texture.colorSpace =
                THREE.SRGBColorSpace;
            texture.anisotropy = 4;

            const aspect =
                texture.image.width /
                texture.image.height;
            const height =
                SCENE_CONFIG.photo.height;
            const width = height * aspect;

            const geometry = new THREE.PlaneGeometry(
                width,
                height
            );

            const material =
                new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    opacity:
                        SCENE_CONFIG.photo.opacity,
                    alphaTest: 0.01,
                    side: THREE.FrontSide,
                    depthWrite: true,
                });

            const photo = new THREE.Mesh(
                geometry,
                material
            );

            photo.position.set(
                SCENE_CONFIG.photo.position.x,
                SCENE_CONFIG.photo.position.y,
                SCENE_CONFIG.photo.position.z
            );

            photo.name = "ThreeScenePhoto";
            onLoad(photo);
        },
        undefined,
        (error) => {
            console.error(
                `Failed to load photo: ${SCENE_CONFIG.photo.path}`,
                error
            );
        }
    );
}

function createPhotoGlow(photo) {
    const material =
        new THREE.MeshBasicMaterial({
            color: 0xffd9a8,
            transparent: true,
            opacity:
                SCENE_CONFIG.photo.glow.opacity,
            side: THREE.FrontSide,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        });

    const geometry = photo.geometry.clone();
    const glow = new THREE.Mesh(
        geometry,
        material
    );

    glow.position.copy(photo.position);

    const glowScale =
        SCENE_CONFIG.photo.glow.scale;

    if (glowScale) {
        glow.scale.set(
            glowScale,
            glowScale,
            1
        );
    }

    glow.name = "ThreeScenePhotoGlow";
    return glow;
}

function createText() {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
        return null;
    }

    const {
        content,
        fontSize,
        fontWeight,
        color,
    } = SCENE_CONFIG.text;

    const fontFamily =
        getComputedStyle(
            document.documentElement
        )
            .getPropertyValue("--font-main")
            .trim();

    const font = `${fontWeight} ${fontSize}px ${fontFamily || "sans-serif"}`;

    context.font = font;

    const padding = 8;
    const metrics = context.measureText(content);

    canvas.width = Math.ceil(
        metrics.width + padding * 2
    );
    canvas.height = Math.ceil(
        fontSize * 1.5 + padding * 2
    );

    context.font = font;
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(
        content,
        canvas.width / 2,
        canvas.height / 2
    );

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
        depthWrite: false,
        depthTest: false,
    });

    const text = new THREE.Sprite(material);
    const scale = 0.00018;

    text.scale.set(
        canvas.width * scale,
        canvas.height * scale,
        1
    );

    text.position.set(
        SCENE_CONFIG.text.position.x,
        SCENE_CONFIG.text.position.y,
        SCENE_CONFIG.text.position.z
    );

    text.name = "ThreeSceneText";
    return text;
}

function disposePhoto(photo) {
    if (!photo) return;

    const material = photo.material;
    material?.map?.dispose?.();
    material?.dispose?.();
    photo.geometry?.dispose?.();
}

function disposePhotoGlow(glow) {
    if (!glow) return;

    glow.material?.dispose?.();
    glow.geometry?.dispose?.();
}

function disposeText(text) {
    if (!text) return;

    text.material?.map?.dispose?.();
    text.material?.dispose?.();
}

function configureModel(model) {
    model.position.set(
        SCENE_CONFIG.model.position.x,
        SCENE_CONFIG.model.position.y,
        SCENE_CONFIG.model.position.z
    );

    model.traverse((object) => {
        if (!object.isMesh) return;

        object.castShadow =
            SCENE_CONFIG.renderer.shadows;
        object.receiveShadow =
            SCENE_CONFIG.renderer.shadows;

        const materials = Array.isArray(
            object.material
        )
            ? object.material
            : [object.material];

        materials.forEach((material) => {
            if (!material) return;

            if (material.transparent) {
                material.depthWrite = false;
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

export function createWebGLRuntime({
    canvas,
    wrapper,
    onLeave,
    onEnterBack,
    onReady,
    onProgress,
}) {
    if (!canvas || !wrapper) {
        return null;
    }

    let disposed = false;
    let isActive = true;
    let animationFrame = 0;
    let elapsedTime = 0;
    let previousTimestamp = null;

    let model = null;
    let photo = null;
    let photoGlow = null;
    let text = null;

    const quality = getRenderQuality();
    const layers = new Set();
    const scene = createScene();
    const photoScene = new THREE.Scene();
    const heroGroup = new THREE.Group();
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

        // LoadingManager may discover nested GLTF resources after the
        // first file finishes, so do not let one early file look like 100%.
        onProgress?.(Math.min(fileProgress * 0.8, 0.8));
    };

    onProgress?.(0);

    let readyNotified = false;

    const notifyReady = (result) => {
        if (readyNotified || disposed) {
            return;
        }

        readyNotified = true;

        if (result?.status === "ready") {
            onProgress?.(1);
        }

        onReady?.(result);
    };

    renderer.autoClear = false;

    scene.add(heroGroup);
    scene.add(camera);

    const mainLight = createPointLight(
        SCENE_CONFIG.lights.main
    );
    heroGroup.add(mainLight);

    const sunLight = createPointLight(
        SCENE_CONFIG.lights.sun
    );
    heroGroup.add(sunLight);

    const coreLight = createPointLight(
        SCENE_CONFIG.lights.core
    );
    camera.add(coreLight);

    const pixelRatio = getPixelRatio(
        quality.maxPixelRatio
    );

    const particleSystem = createParticleSystem(
        pixelRatio
    );
    heroGroup.add(particleSystem);

    const particleVolumeHelper =
        createParticleVolumeHelper();

    if (particleVolumeHelper) {
        heroGroup.add(particleVolumeHelper);
    }

    const composer = new EffectComposer(renderer);
    const composerPixelRatio = getPixelRatio(
        quality.composerMaxPixelRatio
    );
    composer.setPixelRatio(composerPixelRatio);

    const renderPass = new RenderPass(
        scene,
        camera
    );

    const { width: initialWidth, height: initialHeight } =
        getLayoutViewportSize();

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(
            initialWidth,
            initialHeight
        ),
        SCENE_CONFIG.bloom.strength,
        SCENE_CONFIG.bloom.radius,
        SCENE_CONFIG.bloom.threshold
    );

    const atmospherePass = createAtmospherePass(
        SCENE_CONFIG.atmosphere,
        quality.isMobile
    );

    const outputPass = new OutputPass();

    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(atmospherePass);
    composer.addPass(outputPass);

    createPhoto(loadingManager, (loadedPhoto) => {
        if (disposed) {
            disposePhoto(loadedPhoto);
            return;
        }

        photo = loadedPhoto;
        photoScene.add(photo);

        photoGlow = createPhotoGlow(photo);
        scene.add(photoGlow);

        text = createText();
        if (text) {
            photoScene.add(text);
        }
    });

    const baseCameraRotation = {
        x: camera.rotation.x,
        y: camera.rotation.y,
    };

    const baseCameraPosition = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z,
    };

    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();

    const coreDefaultColor = new THREE.Color(
        SCENE_CONFIG.lights.core.color
    );
    const coreHoverColor = new THREE.Color(
        0xba55d3
    );

    let isPhotoHovered = false;
    let lastLayoutWidth = 0;
    let lastLayoutHeight = 0;

    const updatePointer = (event) => {
        pointer.set(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(
                (event.clientY / window.innerHeight) *
                    2 -
                1
            )
        );

        gsap.to(camera.rotation, {
            x:
                baseCameraRotation.x +
                pointer.y *
                    SCENE_CONFIG.interaction.pointer.rotationX,
            y:
                baseCameraRotation.y -
                pointer.x *
                    SCENE_CONFIG.interaction.pointer.rotationY,
            duration:
                SCENE_CONFIG.interaction.pointer.duration,
            ease:
                SCENE_CONFIG.interaction.pointer.ease,
            overwrite: true,
        });
    };

    const updatePhotoHover = (event) => {
        if (!photo) return;

        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(
                (event.clientY / window.innerHeight) *
                    2 -
                1
            )
        );

        raycaster.setFromCamera(mouse, camera);

        const hovered =
            raycaster.intersectObject(
                photo,
                false
            ).length > 0;

        if (hovered === isPhotoHovered) {
            return;
        }

        isPhotoHovered = hovered;

        gsap.to(coreLight.color, {
            r: hovered
                ? coreHoverColor.r
                : coreDefaultColor.r,
            g: hovered
                ? coreHoverColor.g
                : coreDefaultColor.g,
            b: hovered
                ? coreHoverColor.b
                : coreDefaultColor.b,
            duration: 0.8,
            ease: "power2.out",
            overwrite: true,
        });
    };

    const handleResize = () => {
        const { width, height } = getLayoutViewportSize();

        // Ignore resize events caused only by the mobile browser UI.
        // Rebuild the WebGL/ScrollTrigger geometry only when the actual
        // layout viewport changed (e.g. width/orientation/desktop resize).
        if (
            width === lastLayoutWidth &&
            height === lastLayoutHeight
        ) {
            return;
        }

        lastLayoutWidth = width;
        lastLayoutHeight = height;

        const nextPixelRatio = getPixelRatio(
            quality.maxPixelRatio
        );
        const nextComposerPixelRatio = getPixelRatio(
            quality.composerMaxPixelRatio
        );

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setPixelRatio(nextPixelRatio);
        renderer.setSize(width, height, false);

        composer.setPixelRatio(nextComposerPixelRatio);
        composer.setSize(width, height);

        bloomPass.resolution.set(width, height);
        atmospherePass.uniforms.uGrain.value =
            SCENE_CONFIG.atmosphere.grain;

        particleSystem.userData.setPixelRatio?.(
            nextPixelRatio
        );

        layers.forEach((layer) => {
            layer.resize?.(width, height);
        });

        ScrollTrigger.refresh();
    };

    const registerLayer = (layer) => {
        layers.add(layer);

        return () => {
            layers.delete(layer);
        };
    };

    const setActive = (active) => {
        isActive = active;

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
        SCENE_CONFIG.model.path,
        (gltf) => {
            if (disposed) {
                disposeObject(gltf.scene);
                return;
            }

            model = configureModel(gltf.scene);
            heroGroup.add(model);
        },
        undefined,
        (error) => {
            console.error(
                `Failed to load Three.js model: ${SCENE_CONFIG.model.path}`,
                error
            );

            notifyReady({
                status: "error",
                error,
            });
        }
    );

    loadingManager.onLoad = () => {
        onProgress?.(0.92);

        notifyReady({
            status: "ready",
        });
    };

    const isTouchDevice = quality.isMobile;

    if (!isTouchDevice) {
        window.addEventListener(
            "pointermove",
            updatePointer
        );
        window.addEventListener(
            "pointermove",
            updatePhotoHover
        );
    }

    window.addEventListener(
        "resize",
        handleResize
    );

    document.addEventListener(
        "visibilitychange",
        handleVisibilityChange
    );

    const scrollHeightMultiplier =
        window.innerWidth < 800 ? 3.5 : 1;
    
    const scrollTween = gsap.to(
        camera.position,
        {
            z:
                baseCameraPosition.z +
                SCENE_CONFIG.interaction.scroll.cameraZ,
            ease: "none",
            scrollTrigger: {
                trigger: wrapper,
                start: "top top",
                end: () => {
                    const { height } = getLayoutViewportSize();
                    return `+=${ 
                        height * scrollHeightMultiplier *
                        SCENE_CONFIG.interaction.scroll.endMultiplier
                    }px`;
                },
                scrub:
                    SCENE_CONFIG.interaction.scroll.scrub,
                invalidateOnRefresh: true,
                onLeave: () => {
                    setActive(false);

                    gsap.to(".webgl-section", {
                        opacity: 0,
                        duration: .45,
                        ease: "none",
                    });

                    onLeave?.();
                },
                onEnterBack: () => {
                    setActive(true);

                    gsap.to(".webgl-section", {
                        opacity: 1,
                        duration: .25,
                        ease: "none",
                    });

                    onEnterBack?.();
                },
            },
        }
    );

    handleResize();

    const render = (timestamp) => {
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

        updateParticleSystem(
            particleSystem,
            elapsedTime
        );

        layers.forEach((layer) => {
            layer.update?.(elapsedTime);
        });

        atmospherePass.uniforms.uTime.value =
            elapsedTime;

        renderer.setRenderTarget(null);
        composer.render();
        renderer.clearDepth();

        if (photo || text) {
            renderer.render(
                photoScene,
                camera
            );
        }

        layers.forEach((layer) => {
            if (!layer.scene || !layer.camera) {
                return;
            }

            renderer.render(
                layer.scene,
                layer.camera
            );
        });

        if (isActive && !document.hidden) {
            animationFrame = requestAnimationFrame(render);
        }
    };

    if (!document.hidden) {
        animationFrame = requestAnimationFrame(render);
    }

    return {
        registerLayer,
        setActive,
        scene,
        camera,
        renderer,
        composer,

        destroy() {
            if (disposed) {
                return;
            }

            disposed = true;

            if (!isTouchDevice) {
                window.removeEventListener(
                    "pointermove",
                    updatePointer
                );
                window.removeEventListener(
                    "pointermove",
                    updatePhotoHover
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

            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = 0;
            }

            scrollTween.scrollTrigger?.kill();
            scrollTween.kill();

            gsap.killTweensOf(camera.rotation);
            gsap.killTweensOf(camera.position);
            gsap.killTweensOf(coreLight.color);

            if (photo) {
                gsap.killTweensOf(photo.position);
            }

            if (photoGlow) {
                gsap.killTweensOf(photoGlow.position);
            }

            if (text) {
                gsap.killTweensOf(text.position);
            }

            disposeObject(model);
            disposeObject(particleSystem);
            disposeObject(particleVolumeHelper);
            disposePhoto(photo);
            disposePhotoGlow(photoGlow);
            disposeText(text);

            composer.dispose();
            bloomPass.dispose();
            atmospherePass.dispose();

            coreLight.dispose();
            sunLight.dispose();
            mainLight.dispose();

            renderer.dispose();

            scene.clear();
            photoScene.clear();
            layers.clear();
        },
    };
}
