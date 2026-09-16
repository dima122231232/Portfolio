import * as THREE from "three";
import { SCENE_CONFIG } from "./config";

function createParticleMaterial(config) {
    return new THREE.ShaderMaterial({
        transparent: true,

        depthWrite: false,
        depthTest: true,

        blending:
            THREE.AdditiveBlending,

        uniforms: {
            uColor: {
                value: new THREE.Color(
                    config.color
                ),
            },

            uSize: {
                value: config.size,
            },

            uOpacity: {
                value: config.opacity,
            },

            uPixelRatio: {
                value: Math.min(
                    window.devicePixelRatio,
                    SCENE_CONFIG.renderer
                        .maxPixelRatio
                ),
            },
        },

        vertexShader: `
            uniform float uSize;
            uniform float uPixelRatio;

            attribute float aSize;

            varying float vAlpha;

            void main() {
                vec4 mvPosition =
                    modelViewMatrix *
                    vec4(position, 1.0);

                float depthScale =
                    1.0 /
                    max(
                        0.35,
                        -mvPosition.z
                    );

                gl_PointSize =
                    uSize *
                    aSize *
                    uPixelRatio *
                    depthScale *
                    135.0;

                gl_PointSize =
                    clamp(
                        gl_PointSize,
                        1.0,
                        100.0
                    );

                gl_Position =
                    projectionMatrix *
                    mvPosition;

                vAlpha =
                    clamp(
                        depthScale,
                        0.18,
                        1.0
                    );
            }
        `,

        fragmentShader: `
            uniform vec3 uColor;
            uniform float uOpacity;

            varying float vAlpha;

            void main() {
                vec2 uv =
                    gl_PointCoord -
                    0.5;

                float distanceToCenter =
                    length(uv) *
                    2.0;

                float soft =
                    1.0 -
                    smoothstep(
                        0.0,
                        1.0,
                        distanceToCenter
                    );

                float core =
                    pow(
                        soft,
                        1.8
                    );

                float outerGlow =
                    pow(
                        soft,
                        3.5
                    );

                float alpha =
                    (
                        core * 0.65 +
                        outerGlow * 0.35
                    ) *
                    uOpacity *
                    vAlpha;

                alpha *=
                    smoothstep(
                        1.0,
                        0.0,
                        distanceToCenter
                    );

                gl_FragColor =
                    vec4(
                        uColor,
                        alpha
                    );
            }
        `,
    });
}

export function createParticleVolumeHelper() {
    const {
        position,
        width,
        height,
        depth,
        debug,
    } = SCENE_CONFIG.particleVolume;

    if (!debug) {
        return null;
    }

    const geometry =
        new THREE.BoxGeometry(
            width,
            height,
            depth
        );

    const edges =
        new THREE.EdgesGeometry(
            geometry
        );

    const material =
        new THREE.LineBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.35,
        });

    const helper =
        new THREE.LineSegments(
            edges,
            material
        );

    helper.position.set(
        position.x,
        position.y,
        position.z
    );

    geometry.dispose();

    return helper;
}

function createParticleLayer(config) {
    const geometry =
        new THREE.BufferGeometry();

    const positions =
        new Float32Array(
            config.count * 3
        );

    const sizes =
        new Float32Array(
            config.count
        );

    const phases =
        new Float32Array(
            config.count
        );

    const speeds =
        new Float32Array(
            config.count
        );

    const drift =
        new Float32Array(
            config.count
        );

    const volume =
        SCENE_CONFIG.particleVolume;

    for (
        let i = 0;
        i < config.count;
        i++
    ) {
        const index = i * 3;

        let x =
            Math.random() - 0.5;

        let y =
            Math.random() - 0.5;

        let z =
            Math.random() - 0.5;

        if (
            Math.random() <
            config.edgeBias
        ) {
            const edge =
                Math.floor(
                    Math.random() * 4
                );

            if (edge === 0) {
                x = -0.5;
            }

            if (edge === 1) {
                x = 0.5;
            }

            if (edge === 2) {
                y = -0.5;
            }

            if (edge === 3) {
                y = 0.5;
            }

            x +=
                (Math.random() - 0.5) *
                0.15;

            y +=
                (Math.random() - 0.5) *
                0.15;
        }

        positions[index] =
            volume.position.x +
            x * volume.width;

        positions[index + 1] =
            volume.position.y +
            y * volume.height;

        positions[index + 2] =
            volume.position.z +
            z * volume.depth;

        sizes[i] =
            0.55 +
            Math.random() * 1.3;

        phases[i] =
            Math.random() *
            Math.PI *
            2;

        speeds[i] =
            config.speed *
            (
                0.65 +
                Math.random() *
                    0.8
            );

        drift[i] =
            config.drift *
            (
                0.65 +
                Math.random() *
                    0.8
            );
    }

    geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
            positions,
            3
        )
    );

    geometry.setAttribute(
        "aSize",
        new THREE.BufferAttribute(
            sizes,
            1
        )
    );

    const material =
        createParticleMaterial(
            config
        );

    const points =
        new THREE.Points(
            geometry,
            material
        );

    points.frustumCulled = true;

    points.userData = {
        phases,
        speeds,
        drift,

        basePositions:
            positions.slice(),
    };

    return points;
}

export function createParticleSystem() {
    const group =
        new THREE.Group();

    const far =
        createParticleLayer(
            SCENE_CONFIG.particles.far
        );

    const mid =
        createParticleLayer(
            SCENE_CONFIG.particles.mid
        );

    const near =
        createParticleLayer(
            SCENE_CONFIG.particles.near
        );

    group.add(far);
    group.add(mid);
    group.add(near);

    return group;
}

function updateParticleLayer(
    layer,
    time
) {
    const positionAttribute =
        layer.geometry.attributes.position;

    const positions =
        positionAttribute.array;

    const {
        phases,
        speeds,
        drift,
        basePositions,
    } = layer.userData;

    for (
        let i = 0;
        i < phases.length;
        i++
    ) {
        const index = i * 3;

        const phase =
            phases[i];

        const speed =
            speeds[i];

        const particleDrift =
            drift[i];

        const baseX =
            basePositions[index];

        const baseY =
            basePositions[index + 1];

        const baseZ =
            basePositions[index + 2];

        positions[index] =
            baseX +
            Math.sin(
                time *
                    speed +
                    phase
            ) *
                particleDrift;

        positions[index + 1] =
            baseY +
            Math.cos(
                time *
                    speed *
                    0.73 +
                    phase
            ) *
                particleDrift;

        positions[index + 2] =
            baseZ +
            Math.sin(
                time *
                    speed *
                    0.41 +
                    phase
            ) *
                particleDrift;
    }

    positionAttribute.needsUpdate =
        true;
}



export function updateParticleSystem(particleSystem, time) {
    particleSystem.children.forEach((layer) => updateParticleLayer(layer, time));

    particleSystem.rotation.y = Math.sin(time * 0.08) * 0.025;
    particleSystem.rotation.x = Math.cos(time * 0.06) * 0.012;
}
