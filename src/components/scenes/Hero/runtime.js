import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SCENE_CONFIG } from "./config";
import {
    createParticleSystem,
    createParticleVolumeHelper,
    updateParticleSystem
} from "./particles";
import { disposeObject } from "../shared/dispose";

gsap.registerPlugin(ScrollTrigger);

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
                SCENE_CONFIG
                    .atmosphere
                    .grain,
        },

        uScanline: {
            value:
                SCENE_CONFIG
                    .atmosphere
                    .scanline,
        },

        uVignette: {
            value:
                SCENE_CONFIG
                    .atmosphere
                    .vignette,
        },

        uChromatic: {
            value:
                SCENE_CONFIG
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

    canvas = canvasElement;

    const contextAttributes = {
        alpha: false,
        antialias:
            SCENE_CONFIG
                .renderer
                .antialias,
        depth: true,
        stencil: false,
        preserveDrawingBuffer: false,
        powerPreference: "high-performance",
    };

    let context =
        canvas.getContext("webgl2");

    if (!context) {
        context =
            canvas.getContext(
                "webgl",
                contextAttributes
            );
    }

    if (!context) {
        console.error(
            "Three.js: WebGL is not available."
        );

        return null;
    }

    const renderer =
        new THREE.WebGLRenderer({
            canvas,
            context,
            antialias:
                SCENE_CONFIG
                    .renderer
                    .antialias,
        });

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            SCENE_CONFIG
                .renderer
                .maxPixelRatio
        )
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight,
        false
    );

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    renderer.toneMapping =
        SCENE_CONFIG
            .renderer
            .toneMapping;

    renderer.toneMappingExposure =
        SCENE_CONFIG
            .renderer
            .toneMappingExposure;

    if (
        SCENE_CONFIG
            .renderer
            .shadows
    ) {
        renderer.shadowMap.enabled =
            true;

        renderer.shadowMap.type =
            THREE.PCFShadowMap;
    }

    return renderer;
}

function createScene() {
    const scene =
        new THREE.Scene();

    const background =
        new THREE.Color(
            SCENE_CONFIG
                .background
                .color
        );

    scene.background =
        background;

    scene.fog =
        new THREE.FogExp2(
            background,
            SCENE_CONFIG
                .background
                .fogDensity
        );

    return scene;
}

function createCamera() {
    const {
        fov,
        near,
        far,
        position
    } = SCENE_CONFIG.camera;

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

function createPhotoScene() {
    return new THREE.Scene();
}

function createPhoto(onLoad) {
    const textureLoader =
        new THREE.TextureLoader();

    textureLoader.load(
        SCENE_CONFIG.photo.path,

        (texture) => {
            texture.colorSpace =
                THREE.SRGBColorSpace;

            texture.anisotropy = 4;

            const imageWidth =
                texture.image.width;

            const imageHeight =
                texture.image.height;

            const aspect =
                imageWidth /
                imageHeight;

            const height =
                SCENE_CONFIG
                    .photo
                    .height;

            const width =
                height * aspect;

            const geometry =
                new THREE.PlaneGeometry(
                    width,
                    height
                );

            const material =
                new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true,
                    opacity:
                        SCENE_CONFIG
                            .photo
                            .opacity,
                    alphaTest: .01,
                    side:
                        THREE.FrontSide,
                    depthWrite: true,
                });

            const photo =
                new THREE.Mesh(
                    geometry,
                    material
                );

            photo.position.set(
                SCENE_CONFIG
                    .photo
                    .position
                    .x,

                SCENE_CONFIG
                    .photo
                    .position
                    .y,

                SCENE_CONFIG
                    .photo
                    .position
                    .z
            );

            photo.name =
                "ThreeScenePhoto";

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
                SCENE_CONFIG
                    .photo
                    .glow
                    .opacity,
            side:
                THREE.FrontSide,
            depthWrite: false,
            blending:
                THREE.AdditiveBlending,
        });

    const geometry =
        photo.geometry.clone();

    const glow =
        new THREE.Mesh(
            geometry,
            material
        );

    glow.position.copy(
        photo.position
    );

    const glowScale =
        SCENE_CONFIG
            .photo
            .glow
            .scale;

    if (glowScale) {
        glow.scale.set(
            glowScale,
            glowScale,
            1
        );
    }

    glow.name =
        "ThreeScenePhotoGlow";

    return glow;
}

function createText() {
    const canvas =
        document.createElement(
            "canvas"
        );

    const context =
        canvas.getContext("2d");

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
            .getPropertyValue(
                "--font-main"
            )
            .trim();

    const font =
        `${fontWeight} ${fontSize}px ${fontFamily || "sans-serif"}`;

    context.font = font;

    const padding = 8;

    const metrics =
        context.measureText(
            content
        );

    canvas.width =
        Math.ceil(
            metrics.width +
            padding * 2
        );

    canvas.height =
        Math.ceil(
            fontSize * 1.5 +
            padding * 2
        );

    context.font = font;
    context.fillStyle = color;
    context.textAlign = "center";
    context.textBaseline =
        "middle";

    context.fillText(
        content,
        canvas.width / 2,
        canvas.height / 2
    );

    const texture =
        new THREE.CanvasTexture(
            canvas
        );

    texture.colorSpace =
        THREE.SRGBColorSpace;

    texture.minFilter =
        THREE.LinearFilter;

    texture.magFilter =
        THREE.LinearFilter;

    const material =
        new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 1,
            depthWrite: false,
            depthTest: false,
        });

    const text =
        new THREE.Sprite(
            material
        );

    const scale =
        .00018;

    text.scale.set(
        canvas.width * scale,
        canvas.height * scale,
        1
    );

    text.position.set(
        SCENE_CONFIG
            .text
            .position
            .x,

        SCENE_CONFIG
            .text
            .position
            .y,

        SCENE_CONFIG
            .text
            .position
            .z
    );

    text.name =
        "ThreeSceneText";

    return text;
}

function disposePhoto(photo) {
    if (!photo) return;

    const material =
        photo.material;

    if (material?.map) {
        material.map.dispose();
    }

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
    model.position.set(
        SCENE_CONFIG
            .model
            .position
            .x,

        SCENE_CONFIG
            .model
            .position
            .y,

        SCENE_CONFIG
            .model
            .position
            .z
    );

    model.traverse(
        (object) => {
            if (!object.isMesh) return;

            object.castShadow =
                SCENE_CONFIG
                    .renderer
                    .shadows;

            object.receiveShadow =
                SCENE_CONFIG
                    .renderer
                    .shadows;

            const materials =
                Array.isArray(
                    object.material
                )
                    ? object.material
                    : [object.material];

            materials.forEach(
                (material) => {
                    if (!material) return;

                    if (
                        material.transparent
                    ) {
                        material.depthWrite =
                            false;
                    }

                    if (material.map) {
                        material.map.colorSpace =
                            THREE.SRGBColorSpace;

                        material.map.anisotropy =
                            4;
                    }

                    const name =
                        material.name
                            .toLowerCase();

                    if (
                        name.includes(
                            "screen"
                        ) ||
                        name.includes(
                            "monitor"
                        )
                    ) {
                        material.roughness =
                            .2;
                    } else if (
                        name.includes(
                            "metal"
                        )
                    ) {
                        material.roughness =
                            .35;
                    } else if (
                        name.includes(
                            "mirror"
                        ) ||
                        name.includes(
                            "glass"
                        )
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
                }
            );
        }
    );

    return model;
}

export function createWebGLRuntime({
    canvas,
    wrapper,
    onLeave,
    onEnterBack
}) {
    if (!canvas || !wrapper) {
        return null;
    }

    let disposed = false;

    let model = null;
    let photo = null;
    let photoGlow = null;
    let text = null;

    let animationFrame = 0;

    const layers =
        new Set();

    const scene =
        createScene();

    const photoScene =
        createPhotoScene();

    const heroGroup =
        new THREE.Group();

    const camera =
        createCamera();

    const renderer =
        createRenderer(canvas);

    if (!renderer) {
        return null;
    }

    renderer.autoClear = false;

    scene.add(heroGroup);
    scene.add(camera);

    const mainLight =
        createPointLight(
            SCENE_CONFIG
                .lights
                .main
        );

    heroGroup.add(
        mainLight
    );

    const sunLight =
        createPointLight(
            SCENE_CONFIG
                .lights
                .sun
        );

    heroGroup.add(
        sunLight
    );

    const coreLight =
        createPointLight(
            SCENE_CONFIG
                .lights
                .core
        );

    camera.add(
        coreLight
    );

    const particleSystem =
        createParticleSystem();

    heroGroup.add(
        particleSystem
    );

    const particleVolumeHelper =
        createParticleVolumeHelper();

    if (particleVolumeHelper) {
        heroGroup.add(
            particleVolumeHelper
        );
    }

    const composer =
        new EffectComposer(
            renderer
        );

    const pixelRatio =
        Math.min(
            window.devicePixelRatio,
            SCENE_CONFIG
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

    const bloomPass =
        new UnrealBloomPass(
            new THREE.Vector2(
                window.innerWidth,
                window.innerHeight
            ),

            SCENE_CONFIG
                .bloom
                .strength,

            SCENE_CONFIG
                .bloom
                .radius,

            SCENE_CONFIG
                .bloom
                .threshold
        );

    const atmospherePass =
        new ShaderPass(
            ATMOSPHERE_SHADER
        );

    const outputPass =
        new OutputPass();

    composer.addPass(
        renderPass
    );

    composer.addPass(
        bloomPass
    );

    composer.addPass(
        atmospherePass
    );

    composer.addPass(
        outputPass
    );

    createPhoto(
        (loadedPhoto) => {
            if (disposed) {
                disposePhoto(
                    loadedPhoto
                );

                return;
            }

            photo =
                loadedPhoto;

            photoScene.add(
                photo
            );

            photoGlow =
                createPhotoGlow(
                    photo
                );

            scene.add(
                photoGlow
            );

            text =
                createText();

            photoScene.add(
                text
            );
        }
    );

    const baseCameraRotation = {
        x:
            camera.rotation.x,

        y:
            camera.rotation.y,
    };

    const baseCameraPosition = {
        x:
            camera.position.x,

        y:
            camera.position.y,

        z:
            camera.position.z,
    };

    const pointer =
        new THREE.Vector2();

    const raycaster =
        new THREE.Raycaster();

    const coreDefaultColor =
        new THREE.Color(
            SCENE_CONFIG
                .lights
                .core
                .color
        );

    const coreHoverColor =
        new THREE.Color(
            0xBA55D3
        );

    let isPhotoHovered =
        false;

    const updatePointer =
        (event) => {
            pointer.set(
                (
                    event.clientX /
                    window.innerWidth
                ) *
                2 -
                1,

                -(
                    (
                        event.clientY /
                        window.innerHeight
                    ) *
                    2 -
                    1
                )
            );

            gsap.to(
                camera.rotation,
                {
                    x:
                        baseCameraRotation.x +
                        pointer.y *
                        SCENE_CONFIG
                            .interaction
                            .pointer
                            .rotationX,

                    y:
                        baseCameraRotation.y -
                        pointer.x *
                        SCENE_CONFIG
                            .interaction
                            .pointer
                            .rotationY,

                    duration:
                        SCENE_CONFIG
                            .interaction
                            .pointer
                            .duration,

                    ease:
                        SCENE_CONFIG
                            .interaction
                            .pointer
                            .ease,

                    overwrite: true,
                }
            );
        };

    const updatePhotoHover =
        (event) => {
            if (!photo) return;

            const mouse =
                new THREE.Vector2();

            mouse.x =
                (
                    event.clientX /
                    window.innerWidth
                ) *
                2 -
                1;

            mouse.y =
                -(
                    (
                        event.clientY /
                        window.innerHeight
                    ) *
                    2 -
                    1
                );

            raycaster.setFromCamera(
                mouse,
                camera
            );

            const intersects =
                raycaster.intersectObject(
                    photo,
                    false
                );

            const hovered =
                intersects.length > 0;

            if (
                hovered ===
                isPhotoHovered
            ) {
                return;
            }

            isPhotoHovered =
                hovered;

            gsap.to(
                coreLight.color,
                {
                    r:
                        hovered
                            ? coreHoverColor.r
                            : coreDefaultColor.r,

                    g:
                        hovered
                            ? coreHoverColor.g
                            : coreDefaultColor.g,

                    b:
                        hovered
                            ? coreHoverColor.b
                            : coreDefaultColor.b,

                    duration: .8,

                    ease: "power2.out",

                    overwrite: true,
                }
            );
        };

    const handleResize =
        () => {
            const width =
                window.innerWidth;

            const height =
                window.innerHeight;

            const nextPixelRatio =
                Math.min(
                    window.devicePixelRatio,
                    SCENE_CONFIG
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

            atmospherePass
                .uniforms
                .uGrain
                .value =
                SCENE_CONFIG
                    .atmosphere
                    .grain;

            layers.forEach(
                (layer) => {
                    layer.resize?.(
                        width,
                        height
                    );
                }
            );

            ScrollTrigger.refresh();
        };

    const registerLayer =
        (layer) => {
            layers.add(layer);

            return () =>
                layers.delete(
                    layer
                );
        };

    const loader =
        new GLTFLoader();

    loader.load(
        SCENE_CONFIG
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

            heroGroup.add(
                model
            );
        },

        undefined,

        (error) => {
            console.error(
                `Failed to load Three.js model: ${SCENE_CONFIG.model.path}`,
                error
            );
        }
    );

    const isTouchDevice =
        window.matchMedia("(pointer: coarse)").matches;

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

    const scrollTween =
        gsap.to(
            camera.position,
            {
                z:
                    baseCameraPosition.z +
                    SCENE_CONFIG
                        .interaction
                        .scroll
                        .cameraZ,

                ease: "none",

                scrollTrigger: {
                    trigger:
                        wrapper,

                    start:
                        "top top",

                    end: () =>
                        `+=${window.innerHeight * SCENE_CONFIG.interaction.scroll.endMultiplier}px`,

                    scrub:
                        SCENE_CONFIG
                            .interaction
                            .scroll
                            .scrub,

                    invalidateOnRefresh:
                        true,

                    onLeave: () => {
                        gsap.to(
                            ".webgl-section",
                            {
                                opacity: 0,
                                duration: .5,
                                ease: "none",
                            }
                        );

                        onLeave?.();
                    },

                    onEnterBack: () => {
                        gsap.to(
                            ".webgl-section",
                            {
                                opacity: 1,
                                duration: .2,
                                ease: "none",
                            }
                        );

                        onEnterBack?.();
                    },
                },
            }
        );

    handleResize();

    const timer =
        new THREE.Timer();

    timer.connect(document);

    const render = (timestamp) => {
        if (disposed) {
            return;
        }

        timer.update(timestamp);

        const elapsedTime =
            timer.getElapsed();

        updateParticleSystem(
            particleSystem,
            elapsedTime
        );

        layers.forEach(
            (layer) => {
                layer.update?.(
                    elapsedTime
                );
            }
        );

        atmospherePass
            .uniforms
            .uTime
            .value =
            elapsedTime;

        renderer.setRenderTarget(
            null
        );

        composer.render();

        renderer.clearDepth();

        if (photo || text) {
            renderer.render(
                photoScene,
                camera
            );
        }

        layers.forEach(
            (layer) => {
                if (
                    !layer.scene ||
                    !layer.camera
                ) {
                    return;
                }

                renderer.render(
                    layer.scene,
                    layer.camera
                );
            }
        );

        animationFrame =
            requestAnimationFrame(
                render
            );
    };

    render();

    return {
        registerLayer,

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

            cancelAnimationFrame(
                animationFrame
            );

            timer.dispose();

            scrollTween
                .scrollTrigger
                ?.kill();

            scrollTween.kill();

            gsap.killTweensOf(
                camera.rotation
            );

            gsap.killTweensOf(
                camera.position
            );

            gsap.killTweensOf(
                coreLight.color
            );

            if (photo) {
                gsap.killTweensOf(
                    photo.position
                );
            }

            if (photoGlow) {
                gsap.killTweensOf(
                    photoGlow.position
                );
            }

            if (text) {
                gsap.killTweensOf(
                    text.position
                );
            }

            disposeObject(
                model
            );

            disposeObject(
                particleSystem
            );

            disposeObject(
                particleVolumeHelper
            );

            disposePhoto(
                photo
            );

            disposePhotoGlow(
                photoGlow
            );

            disposeText(
                text
            );

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