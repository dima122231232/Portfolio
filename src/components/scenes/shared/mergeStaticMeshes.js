import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

function collectMergeableMeshes(root) {
    const meshes = [];

    root.traverse((object) => {
        if (
            !object.isMesh ||
            object.isSkinnedMesh ||
            object.morphTargetInfluences ||
            !object.geometry ||
            Array.isArray(object.material) ||
            !object.material
        ) {
            return;
        }

        meshes.push(object);
    });

    return meshes;
}

function scheduleSlice(callback) {
    if (typeof window === "undefined") {
        const id = setTimeout(callback, 0);
        return () => clearTimeout(id);
    }

    if ("requestIdleCallback" in window) {
        const id = window.requestIdleCallback(
            callback,
            { timeout: 120 }
        );

        return () => window.cancelIdleCallback(id);
    }

    const id = window.setTimeout(callback, 0);
    return () => window.clearTimeout(id);
}

/**
 * Merges static meshes progressively so that no single main-thread task
 * has to clone/apply/merge the entire scene at once.
 *
 * The original model remains visible during the whole process and is
 * replaced only after all merged geometry has been prepared successfully.
 */
export function mergeStaticMeshesAsync(root, options = {}) {
    const meshes = collectMergeableMeshes(root);

    if (meshes.length < 2) {
        return {
            promise: Promise.resolve({
                root,
                merged: false,
            }),
            cancel() {},
        };
    }

    let cancelled = false;
    let cancelScheduled = () => {};
    let settled = false;
    let resolvePromise;

    const promise = new Promise((resolve) => {
        resolvePromise = resolve;
    });

    const settle = (result) => {
        if (settled) {
            return;
        }

        settled = true;
        cancelScheduled();
        resolvePromise(result);
    };

    const cleanupBuckets = (buckets) => {
        buckets.forEach((bucket) => {
            bucket.geometries.forEach((geometry) => {
                geometry.dispose();
            });
        });
    };

    root.updateMatrixWorld(true);

    const inverseRoot = new THREE.Matrix4()
        .copy(root.matrixWorld)
        .invert();

    const buckets = new Map();
    const mergedGroup = new THREE.Group();
    mergedGroup.name = "MergedStaticGeometry";

    let meshIndex = 0;
    let bucketIndex = 0;
    let bucketList = null;

    const prepareMeshes = () => {
        if (cancelled) {
            cleanupBuckets(buckets);
            settle({
                root,
                merged: false,
                cancelled: true,
            });
            return;
        }

        const started = performance.now();
        const budget = 3;

        while (
            meshIndex < meshes.length &&
            performance.now() - started < budget
        ) {
            const mesh = meshes[meshIndex++];
            const material = mesh.material;
            const key = material.uuid;

            let bucket = buckets.get(key);

            if (!bucket) {
                bucket = {
                    material,
                    geometries: [],
                    names: [],
                };

                buckets.set(key, bucket);
            }

            const geometry = mesh.geometry.clone();
            const localMatrix = new THREE.Matrix4().multiplyMatrices(
                inverseRoot,
                mesh.matrixWorld
            );

            geometry.applyMatrix4(localMatrix);

            bucket.geometries.push(geometry);
            bucket.names.push(mesh.name);
        }

        if (meshIndex < meshes.length) {
            cancelScheduled = scheduleSlice(prepareMeshes);
            return;
        }

        bucketList = Array.from(buckets.values());
        buildNextBucket();
    };

    const buildNextBucket = () => {
        if (cancelled) {
            mergedGroup.traverse((object) => {
                object.geometry?.dispose?.();
            });

            cleanupBuckets(buckets);

            settle({
                root,
                merged: false,
                cancelled: true,
            });
            return;
        }

        if (bucketIndex >= bucketList.length) {
            meshes.forEach((mesh) => {
                mesh.parent?.remove(mesh);
                mesh.geometry?.dispose?.();
            });

            root.add(mergedGroup);

            settle({
                root,
                merged: true,
            });
            return;
        }

        const bucket = bucketList[bucketIndex++];

        try {
            const mergedGeometry = mergeGeometries(
                bucket.geometries,
                false
            );

            if (!mergedGeometry) {
                throw new Error(
                    `Unable to merge static geometry for material ${bucket.material.name || bucket.material.uuid}`
                );
            }

            mergedGeometry.computeBoundingBox();
            mergedGeometry.computeBoundingSphere();

            const mesh = new THREE.Mesh(
                mergedGeometry,
                bucket.material
            );

            mesh.name = bucket.names.join("+");
            mesh.castShadow =
                options.castShadow ?? true;
            mesh.receiveShadow =
                options.receiveShadow ?? true;

            mergedGroup.add(mesh);

            bucket.geometries.forEach((geometry) => {
                geometry.dispose();
            });

            cancelScheduled = scheduleSlice(
                buildNextBucket
            );
        } catch (error) {
            mergedGroup.traverse((object) => {
                object.geometry?.dispose?.();
            });

            cleanupBuckets(buckets);

            console.warn(
                "Three.js: static mesh merge skipped; original scene kept intact.",
                error
            );

            settle({
                root,
                merged: false,
                error,
            });
        }
    };

    prepareMeshes();

    return {
        promise,
        cancel() {
            if (settled) {
                return;
            }

            cancelled = true;
            cancelScheduled();

            mergedGroup.traverse((object) => {
                object.geometry?.dispose?.();
            });

            cleanupBuckets(buckets);

            settle({
                root,
                merged: false,
                cancelled: true,
            });
        },
    };
}
