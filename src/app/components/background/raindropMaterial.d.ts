import { MeshStandardNodeMaterial } from 'three/webgpu';

declare function createWindowMaterial(bgTexture: any, cubemap: any): MeshStandardNodeMaterial;

export default createWindowMaterial;
