const MOBILE_QUERY = "(max-width: 800px), (pointer: coarse)";

export function isMobileRenderTarget() {
    return window.matchMedia(MOBILE_QUERY).matches;
}

export function getRenderQuality() {
    const isMobile = isMobileRenderTarget();

    return {
        isMobile,
        maxPixelRatio: isMobile ? 0.8 : 1.75,
        composerMaxPixelRatio: isMobile ? 0.75 : 1.75,
        antialias: !isMobile,
        workspaceShadowMapSize: isMobile ? 512 : 1024,
    };
}

export function getPixelRatio(maxPixelRatio) {
    return Math.min(
        window.devicePixelRatio || 1,
        maxPixelRatio
    );
}
