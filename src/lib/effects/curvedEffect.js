const CURVE_CONFIG = {
    perspective: 2500,
    depth: 125,
    rotation: 15,
    smoothing: 0.1,
};

const SOURCE_SELECTOR = "[data-curved-effect-source]";
const SECTION_SELECTOR = "[data-curved-effect-section]";
const CELL_SELECTOR = "[data-curved-effect-cell]";

function waitForImages(root) {
    const images = Array.from(root.querySelectorAll("img"));

    if (!images.length) {
        return Promise.resolve();
    }

    return Promise.all(
        images.map((image) => {
            if (image.complete && image.naturalWidth > 0) {
                const decoded = image.decode?.();
                return decoded ? decoded.catch(() => undefined) : undefined;
            }

            return new Promise((resolve) => {
                const done = () => {
                    image.removeEventListener("load", done);
                    image.removeEventListener("error", done);
                    resolve();
                };

                image.addEventListener("load", done, { once: true });
                image.addEventListener("error", done, { once: true });
            });
        })
    );
}

function getCells(section) {
    const markedCells = Array.from(
        section.querySelectorAll(`:scope > ${CELL_SELECTOR}`)
    );

    if (markedCells.length) {
        return markedCells;
    }

    return Array.from(section.children);
}

export function setupCurvedEffect(root) {
    if (!root) return;

    let disposed = false;
    let frame = 0;
    let startToken = 0;

    const source = root.querySelector(SOURCE_SELECTOR);
    if (!source) return;

    const sections = Array.from(
        source.querySelectorAll(SECTION_SELECTOR)
    );

    if (!sections.length) return;

    const stage = document.createElement("div");

    Object.assign(stage.style, {
        position: "fixed",
        inset: "0",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: "5",
        perspective: `${CURVE_CONFIG.perspective}px`,
        perspectiveOrigin: "50% 50%",
        transformStyle: "preserve-3d",
    });

    stage.className = "CurvedEffect__stage";
    root.appendChild(stage);

    source.style.visibility = "hidden";
    source.style.pointerEvents = "none";

    const sectionItems = sections.map((originalSection) => {
        const clone = originalSection.cloneNode(true);
        // clone.classList.add("Work__effectClone");

        // stage.appendChild(clone);
        Object.assign(clone.style, {
            position: "absolute",
            margin: "0",
            left: "0",
            top: "0",
            transform: "none",
            transformStyle: "preserve-3d",
            pointerEvents: "none",
        });

        clone.querySelectorAll("a, button").forEach((element) => {
            element.style.pointerEvents = "auto";
        });

        stage.appendChild(clone);

        const originalCells = getCells(originalSection);
        const clonedMarkedCells = Array.from(
            clone.querySelectorAll(`:scope > ${CELL_SELECTOR}`)
        );
        const clonedCells = clonedMarkedCells.length
            ? clonedMarkedCells
            : Array.from(clone.children);

        const cells = originalCells.map((originalCell, index) => ({
            original: originalCell,
            clone: clonedCells[index],
            depth: 0,
            rotation: 0,
        }));

        return {
            original: originalSection,
            clone,
            cells,
        };
    });

    const update = () => {
        if (disposed) return;

        const viewportHeight = window.innerHeight;
        const centerY = viewportHeight * 0.5;
        const halfHeight = viewportHeight * 0.5 || 1;

        sectionItems.forEach((sectionItem) => {
            const sectionRect = sectionItem.original.getBoundingClientRect();

            sectionItem.clone.style.width = `${sectionRect.width}px`;
            sectionItem.clone.style.height = `${sectionRect.height}px`;
            sectionItem.clone.style.left = `${sectionRect.left}px`;
            sectionItem.clone.style.top = `${sectionRect.top}px`;

            sectionItem.cells.forEach((cell) => {
                if (!cell.clone) return;

                const rect = cell.original.getBoundingClientRect();
                const itemCenterY = rect.top + rect.height * 0.5;

                let normalized = (itemCenterY - centerY) / halfHeight;
                normalized = Math.max(-1, Math.min(1, normalized));

                const distance = Math.abs(normalized);
                const eased = distance * distance;
                const targetDepth = eased * CURVE_CONFIG.depth;
                const targetRotation = normalized * CURVE_CONFIG.rotation;

                cell.depth +=
                    (targetDepth - cell.depth) * CURVE_CONFIG.smoothing;
                cell.rotation +=
                    (targetRotation - cell.rotation) * CURVE_CONFIG.smoothing;

                cell.clone.style.transform =
                    `translate3d(0, 0, ${cell.depth}px) rotateX(${cell.rotation}deg)`;
            });
        });

        frame = requestAnimationFrame(update);
    };

    const reset = () => {
        sectionItems.forEach((sectionItem) => {
            sectionItem.cells.forEach((cell) => {
                cell.depth = 0;
                cell.rotation = 0;

                if (cell.clone) {
                    cell.clone.style.transform = "";
                }
            });
        });
    };

    const resizeObserver = new ResizeObserver(() => {
        reset();
    });

    resizeObserver.observe(source);

    const handleResize = () => {
        reset();
    };

    window.addEventListener("resize", handleResize);

    const start = async () => {
        const token = ++startToken;

        await waitForImages(source);
        await document.fonts?.ready;

        if (disposed || token !== startToken) return;

        sectionItems.forEach((sectionItem) => {
            const sectionRect = sectionItem.original.getBoundingClientRect();

            sectionItem.clone.style.width = `${sectionRect.width}px`;
            sectionItem.clone.style.height = `${sectionRect.height}px`;

            sectionItem.cells.forEach((cell) => {
                const rect = cell.original.getBoundingClientRect();

                if (cell.clone) {
                    cell.clone.style.width = `${rect.width}px`;
                    cell.clone.style.height = `${rect.height}px`;
                }
            });
        });

        frame = requestAnimationFrame(update);
    };

    start();

    return () => {
        disposed = true;
        startToken += 1;

        cancelAnimationFrame(frame);
        resizeObserver.disconnect();
        window.removeEventListener("resize", handleResize);
        stage.remove();

        source.style.visibility = "";
        source.style.pointerEvents = "";
    };
}
