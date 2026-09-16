function disposeMaterial(material, disposedMaterials) {
    if (!material || disposedMaterials.has(material)) {
        return;
    }

    disposedMaterials.add(material);

    Object.values(material).forEach((value) => {
        if (!value?.isTexture) return;
        value.dispose();
    });

    material.dispose();
}

export function disposeObject(root) {
    if (!root) return;

    const disposedMaterials = new Set();

    root.traverse((object) => {
        if (!object.isMesh && !object.isPoints && !object.isLineSegments) {
            return;
        }

        object.geometry?.dispose();

        const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];

        materials.forEach((material) => {
            disposeMaterial(material, disposedMaterials);
        });
    });
}
