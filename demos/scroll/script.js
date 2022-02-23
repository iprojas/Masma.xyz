import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  sRGBEncoding,
  Color,
  MeshBasicMaterial,
  AnimationClip,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import {
  CameraRig,
  ScrollControls,
  ThreeDOFControls,
} from "three-story-controls";
import cameraData from "./camera-data.js";

const canvasParent = document.querySelector(".canvas-parent");
const scrollElement = document.querySelector(".scroller");
const loading = document.querySelector(".loading");

// Set up the three.js scene
const scene = new Scene();
const camera = new PerspectiveCamera(
  75,
  canvasParent.clientWidth / canvasParent.clientHeight,
  0.001,
  1000
);
const renderer = new WebGLRenderer();
renderer.setSize(canvasParent.clientWidth, canvasParent.clientHeight);
renderer.outputEncoding = sRGBEncoding;
scene.background = new Color(0x1d1d1d);
canvasParent.appendChild(renderer.domElement);

// Initialize Camera an Animation
const rig = new CameraRig(camera, scene);
rig.setAnimationClip(AnimationClip.parse(cameraData.animationClip));
rig.setAnimationTime(0);

const controls = new ScrollControls(rig, {
  scrollElement,
  dampingFactor: 0.1,
  startOffset: "-50vh",
  endOffset: "-50vh",
  scrollActions: [
    {
      start: "0%",
      end: "15%",
      callback: transitionTop,
    },
    {
      start: "85%",
      end: "100%",
      callback: transitionBottom,
    },
  ],
});

const controls3dof = new ThreeDOFControls(rig, {
  panFactor: Math.PI / 10,
  tiltFactor: Math.PI / 10,
  truckFactor: 0,
  pedestalFactor: 0,
});

function transitionTop(progress) {
  renderer.domElement.style.opacity = progress;
}

function transitionBottom(progress) {
  renderer.domElement.style.opacity = 1 - progress;
}
controls.enable();
controls3dof.enable();


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

// Render loop
function render(t) {
  window.requestAnimationFrame(render);
  if (rig.hasAnimation) {
    controls.update(t);
    controls3dof.update(t);
  }
  renderer.render(scene, camera);
}

// Handle window resize events
window.addEventListener("resize", () => {
  camera.aspect = canvasParent.clientWidth / canvasParent.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(canvasParent.clientWidth, canvasParent.clientHeight);
});

render();
