import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  sRGBEncoding,
  Color,
  MeshBasicMaterial,
  AnimationClip,
  GridHelper,
  ConeGeometry,
  MeshPhongMaterial,
  Mesh,
  Vector3,
  HemisphereLight,
} from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { CameraRig, PathPointsControls, ThreeDOFControls } from 'three-story-controls'
import cameraData from './camera-data.js'

const canvasParent = document.querySelector('.canvas-parent')
const caption = document.querySelector('.caption p')

const scene = new Scene()
const camera = new PerspectiveCamera(45, canvasParent.clientWidth / canvasParent.clientHeight, 0.1, 10000)
const renderer = new WebGLRenderer()
renderer.setSize(canvasParent.clientWidth, canvasParent.clientHeight)
canvasParent.appendChild(renderer.domElement)

const light = new HemisphereLight(0xffffbb, 0x080820, 1)
scene.add(light)




// Initialize loaders
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("https://unpkg.com/three/examples/js/libs/draco/");
loader.setDRACOLoader(dracoLoader);

//  Ensure model materials are not lit
function resetMaterials(model) {
  model.scene.traverse((child) => {
    if (child.isMesh) {
      const map = child.material.map;
      child.material = new MeshBasicMaterial({ map });
    }
  });
}

// Wait for both assets to load to hide the loading text and initialize controls
Promise.all([loader.loadAsync("../assets/model1.glb")])
  .then((assets) => {
    const [model] = assets;
    resetMaterials(model);
    scene.add(model.scene);
    loading.style.display = "none";
  })
  .catch((e) => console.log(e));


const pois = cameraData.pois.map((item, index) => {
  return {
    frame: index * 10,
    caption: `This is caption for point #${index + 1}`,
  }
})

const rig = new CameraRig(camera, scene)
const clip = AnimationClip.parse(cameraData.animationClip)
rig.setAnimationClip(clip)
rig.setAnimationTime(0)
caption.innerText = pois[0].caption

const controls = new PathPointsControls(rig, pois)
controls.addEventListener('update', (event) => {
  if (event.progress > 0.8) {
    caption.innerText = pois[event.upcomingIndex].caption
  }
})

const controls3dof = new ThreeDOFControls(rig, {
  panFactor: Math.PI / 10,
  tiltFactor: Math.PI / 10,
  truckFactor: 0,
  pedestalFactor: 0,
})

controls.enable()
controls3dof.enable()


function render(t) {
  window.requestAnimationFrame(render)
  if (rig.hasAnimation) {
    controls.update(t)
    controls3dof.update(t)
  }
  renderer.render(scene, camera)
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

render()
