// Configuration
const API_ENDPOINT =
  "https://nicholasterek1--apple-sharp-sharpmodel-generate.modal.run";

// State
let selectedFile = null;
let plyData = null;
let viewer = null;
let renderer = null;

// DOM Elements
const uploadSection = document.getElementById("uploadSection");
const fileInput = document.getElementById("fileInput");
const previewSection = document.getElementById("previewSection");
const imagePreview = document.getElementById("imagePreview");
const generateBtn = document.getElementById("generateBtn");
const loadingSection = document.getElementById("loadingSection");
const statusMessage = document.getElementById("statusMessage");
const errorSection = document.getElementById("errorSection");
const viewerSection = document.getElementById("viewerSection");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");

// Event Listeners
uploadSection.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", handleFileSelect);
generateBtn.addEventListener("click", generateGaussianSplat);
downloadBtn.addEventListener("click", downloadPLY);
resetBtn.addEventListener("click", resetApp);

// Drag and drop
uploadSection.addEventListener("dragover", (e) => {
  e.preventDefault();
  uploadSection.classList.add("dragover");
});

uploadSection.addEventListener("dragleave", () => {
  uploadSection.classList.remove("dragover");
});

uploadSection.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadSection.classList.remove("dragover");

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleFile(files[0]);
  }
});

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) {
    handleFile(file);
  }
}

function handleFile(file) {
  if (!file.type.startsWith("image/")) {
    showError("Please select a valid image file (JPG, PNG, WebP)");
    return;
  }

  selectedFile = file;

  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    previewSection.classList.add("active");
    uploadSection.style.display = "none";
  };
  reader.readAsDataURL(file);
}

async function generateGaussianSplat() {
  if (!selectedFile) return;

  try {
    // Show loading state
    generateBtn.disabled = true;
    loadingSection.classList.add("active");
    errorSection.classList.remove("active");
    statusMessage.textContent = "Uploading image...";

    // Convert image to base64
    const base64Image = await fileToBase64(selectedFile);

    statusMessage.textContent =
      "Processing with Apple Sharp Model... This may take 30-60 seconds...";

    // Call the Modal API
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image.split(",")[1], // Remove data:image/... prefix
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `API request failed: ${response.status}`,
      );
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to generate 3D Gaussian splat");
    }

    statusMessage.textContent = "Rendering 3D Gaussian Splat viewer...";

    // Store PLY data
    plyData = result.ply_base64;

    // Load and display the Gaussian splat viewer
    await loadGaussianSplatViewer(plyData);

    // Hide loading, show viewer
    loadingSection.classList.remove("active");
    viewerSection.classList.add("active");
  } catch (error) {
    console.error("Error:", error);
    showError(`Error: ${error.message}`);
    loadingSection.classList.remove("active");
    generateBtn.disabled = false;
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function loadGaussianSplatViewer(plyBase64) {
  const viewerContainer = document.getElementById("viewer");
  viewerContainer.innerHTML = ""; // Clear previous content

  try {
    // Import the Gaussian Splats 3D library and Three.js
    const GaussianSplats3D = await import("@mkkellogg/gaussian-splats-3d");
    const THREE = await import("three");
    const { OrbitControls } =
      await import("three/addons/controls/OrbitControls.js");

    const width = viewerContainer.clientWidth;
    const height = viewerContainer.clientHeight;

    // Create our own renderer for better control
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    viewerContainer.appendChild(renderer.domElement);

    // Create camera with proper positioning for Sharp output
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 500);
    camera.position.set(0, 0, -3);
    camera.up.set(0, -1, 0);
    camera.lookAt(0, 0, 0);

    // Create orbit controls with improved settings
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.8;
    controls.enableZoom = true;
    controls.zoomSpeed = 1.2;
    controls.minDistance = 0.1;
    controls.maxDistance = 50;
    controls.enablePan = true;
    controls.panSpeed = 0.8;
    controls.screenSpacePanning = true;
    controls.target.set(0, 0, 0);

    // Limit vertical rotation to prevent disorientation
    controls.minPolarAngle = 0.1;
    controls.maxPolarAngle = Math.PI - 0.1;

    // Enhanced zoom controls for "flying through" effect
    const handleWheel = (e) => {
      e.preventDefault();
      const dollySpeed = 0.003;
      const delta = e.deltaY * dollySpeed;

      // Get camera forward direction and move both camera and target
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);

      camera.position.addScaledVector(forward, -delta);
      controls.target.addScaledVector(forward, -delta);
    };

    renderer.domElement.addEventListener("wheel", handleWheel, {
      passive: false,
    });

    // Create the Gaussian Splats 3D viewer
    viewer = new GaussianSplats3D.Viewer({
      renderer: renderer,
      camera: camera,
      selfDrivenMode: false,
      useBuiltInControls: false,
      sharedMemoryForWorkers: false,
      dynamicScene: false,
      sceneRevealMode: GaussianSplats3D.SceneRevealMode.Gradual,
      antialiased: true,
      focalAdjustment: 1.0,
      sphericalHarmonicsDegree: 0,
      enableOptionalEffects: false,
    });

    // Convert base64 PLY to blob URL
    const plyBlob = base64ToBlob(plyBase64, "application/octet-stream");
    const plyUrl = URL.createObjectURL(plyBlob);

    // Load the PLY file into the viewer
    await viewer.addSplatScene(plyUrl, {
      showLoadingUI: false,
      progressiveLoad: true,
      rotation: [0, 0, 0, 1], // No rotation
      scale: [1, 1, 1], // No scaling
      position: [0, 0, 0], // Centered
    });

    // Start the viewer
    viewer.start();

    // Animation loop for controls
    const animate = () => {
      controls.update();
      requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const newWidth = viewerContainer.clientWidth;
      const newHeight = viewerContainer.clientHeight;

      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    console.log("✅ Gaussian Splats 3D viewer loaded successfully!");
  } catch (error) {
    console.error("❌ Error loading Gaussian Splats viewer:", error);

    // Fallback: Show a simple message with download option
    viewerContainer.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: white;
                text-align: center;
                padding: 40px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 15px;
            ">
                <h3 style="margin-bottom: 20px; color: #667eea;">✨ Gaussian Splat Generated!</h3>
                <p style="margin-bottom: 30px; line-height: 1.6;">
                    Your 3D Gaussian splat has been successfully created! <br>
                    For the best viewing experience, download the PLY file and open it in:
                </p>
                <ul style="text-align: left; margin-bottom: 30px; line-height: 2;">
                    <li><strong>supersplat.com/editor</strong> - Online viewer</li>
                    <li><strong>Blender</strong> - With gaussian splat addon</li>
                    <li><strong>MeshLab</strong> - 3D processing software</li>
                </ul>
                <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center;">
                    <a href="https://supersplat.com/editor" target="_blank"
                       style="
                         background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                         color: white;
                         padding: 12px 24px;
                         text-decoration: none;
                         border-radius: 25px;
                         font-weight: 600;
                         transition: transform 0.2s;
                       "
                       onmouseover="this.style.transform='translateY(-2px)'"
                       onmouseout="this.style.transform='translateY(0px)'">
                        🚀 Open in SuperSplat
                    </a>
                </div>
            </div>
        `;
  }
}

function base64ToBlob(base64, mimeType) {
  const bytes = atob(base64);
  const ab = new ArrayBuffer(bytes.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < bytes.length; i++) {
    ia[i] = bytes.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
}

function downloadPLY() {
  if (!plyData) {
    showError("No PLY data available to download");
    return;
  }

  try {
    const blob = base64ToBlob(plyData, "application/octet-stream");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gaussian_splat_${Date.now()}.ply`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download error:", error);
    showError("Failed to download PLY file");
  }
}

function resetApp() {
  // Clean up viewer
  if (viewer) {
    try {
      viewer.dispose();
      viewer = null;
    } catch (e) {
      console.warn("Error disposing viewer:", e);
    }
  }

  if (renderer) {
    try {
      renderer.dispose();
      renderer = null;
    } catch (e) {
      console.warn("Error disposing renderer:", e);
    }
  }

  // Reset state
  selectedFile = null;
  plyData = null;
  fileInput.value = "";

  // Reset UI
  uploadSection.style.display = "block";
  previewSection.classList.remove("active");
  loadingSection.classList.remove("active");
  errorSection.classList.remove("active");
  viewerSection.classList.remove("active");
  generateBtn.disabled = false;

  // Clear viewer container
  const viewerContainer = document.getElementById("viewer");
  viewerContainer.innerHTML = "";
}

function showError(message) {
  errorSection.textContent = message;
  errorSection.classList.add("active");
}

// Handle window resize
window.addEventListener("resize", () => {
  if (renderer && document.getElementById("viewer").querySelector("canvas")) {
    const container = document.getElementById("viewer");
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Update renderer size
    renderer.setSize(width, height);

    // Update camera if it exists
    if (viewer && viewer.camera) {
      viewer.camera.aspect = width / height;
      viewer.camera.updateProjectionMatrix();
    }
  }
});

// Initialize
console.log("🚀 Shopiverse Gaussian Splat Generator initialized");
console.log("📡 API Endpoint:", API_ENDPOINT);
