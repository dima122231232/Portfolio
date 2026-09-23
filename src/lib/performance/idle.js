export function scheduleIdleTask(task, { timeout = 2000 } = {}) {
    if (typeof window === "undefined") {
        return () => {};
    }

    let cancelled = false;
    let idleId = null;
    let timeoutId = null;

    const cancel = () => {
        cancelled = true;

        if (idleId !== null && "cancelIdleCallback" in window) {
            window.cancelIdleCallback(idleId);
        }

        if (timeoutId !== null) {
            window.clearTimeout(timeoutId);
        }

        idleId = null;
        timeoutId = null;
    };

    const run = (deadline = null) => {
        if (cancelled) {
            return;
        }

        idleId = null;
        timeoutId = null;
        task(deadline);
    };

    if ("requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(
            run,
            { timeout }
        );
    } else {
        timeoutId = window.setTimeout(
            () => run(),
            0
        );
    }

    return cancel;
}
