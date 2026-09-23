const MOBILE_QUERY = "(max-width: 800px), (pointer: coarse)";

export function isMobileRenderTarget() {
    return window.matchMedia(MOBILE_QUERY).matches;
}

export function getRenderQuality() {
    const isMobile = isMobileRenderTarget();

    return {
        isMobile,
        maxPixelRatio: isMobile ? 1.25 : 1.75,
        // Keep MSAA on mobile: the small DPR reduction is cheaper visually than jagged geometry edges.
        antialias: true,
        workspaceShadowMapSize: isMobile ? 768 : 1024,
    };
}

export function getPixelRatio(maxPixelRatio) {
    return Math.min(
        window.devicePixelRatio || 1,
        maxPixelRatio
    );
}
