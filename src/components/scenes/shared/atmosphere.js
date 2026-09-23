import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";

const VERTEX_SHADER = `
    varying vec2 vUv;

    void main() {
        vUv = uv;

        gl_Position =
            projectionMatrix *
            modelViewMatrix *
            vec4(position, 1.0);
    }
`;

const RANDOM_FUNCTION = `
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
`;

const DESKTOP_FRAGMENT_SHADER = `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform float uScanline;
    uniform float uVignette;
    uniform float uChromatic;

    varying vec2 vUv;

    ${RANDOM_FUNCTION}

    void main() {
        vec2 uv = vUv;

        float r = texture2D(
            tDiffuse,
            uv + vec2(uChromatic, 0.0)
        ).r;

        float g = texture2D(
            tDiffuse,
            uv
        ).g;

        float b = texture2D(
            tDiffuse,
            uv - vec2(uChromatic, 0.0)
        ).b;

        vec3 color = vec3(r, g, b);

        float noise = random(
            uv * 900.0 + uTime
        );

        color += (
            noise - .5
        ) * uGrain;

        float scan =
            sin(uv.y * 900.0) * .5 + .5;

        color *= 1.0 - scan * uScanline;

        vec2 centered = uv - .5;

        float vignette = smoothstep(
            .15,
            .8,
            dot(centered, centered)
        );

        color *= 1.0 - vignette * uVignette;

        gl_FragColor = vec4(color, 1.0);
    }
`;

const MOBILE_FRAGMENT_SHADER = `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform float uScanline;
    uniform float uVignette;

    varying vec2 vUv;

    ${RANDOM_FUNCTION}

    void main() {
        vec2 uv = vUv;
        vec3 color = texture2D(tDiffuse, uv).rgb;

        float noise = random(
            uv * 900.0 + uTime
        );

        color += (
            noise - .5
        ) * uGrain;

        float scan =
            sin(uv.y * 900.0) * .5 + .5;

        color *= 1.0 - scan * uScanline;

        vec2 centered = uv - .5;

        float vignette = smoothstep(
            .15,
            .8,
            dot(centered, centered)
        );

        color *= 1.0 - vignette * uVignette;

        gl_FragColor = vec4(color, 1.0);
    }
`;

export function createAtmospherePass(config, isMobile) {
    const shader = {
        uniforms: {
            tDiffuse: {
                value: null,
            },
            uTime: {
                value: 0,
            },
            uGrain: {
                value: config.grain,
            },
            uScanline: {
                value: config.scanline,
            },
            uVignette: {
                value: config.vignette,
            },
            uChromatic: {
                value: isMobile ? 0 : config.chromatic,
            },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: isMobile
            ? MOBILE_FRAGMENT_SHADER
            : DESKTOP_FRAGMENT_SHADER,
    };

    return new ShaderPass(shader);
}
