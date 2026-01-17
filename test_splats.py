"""
Test script to compare splat quality between different configurations.
This script sends test images to both endpoints and saves the PLY files for comparison.
"""

import base64
import json
import time
from pathlib import Path

import requests

# Configuration
SHOPIVERSE_ENDPOINT = (
    "https://nicholasterek1--apple-sharp-sharpmodel-generate.modal.run"
)
# SHAPR_ML_ENDPOINT = (
#     "https://your-shapr-ml-endpoint.modal.run"  # Update this with actual endpoint
# )


def encode_image_to_base64(image_path):
    """Convert image file to base64 string."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def test_endpoint(endpoint_url, image_b64, endpoint_name):
    """Test a single endpoint with an image."""
    print(f"\n🧪 Testing {endpoint_name}...")
    print(f"   Endpoint: {endpoint_url}")

    start_time = time.time()

    try:
        response = requests.post(
            endpoint_url,
            json={"image": image_b64},
            headers={"Content-Type": "application/json"},
            timeout=120,
        )

        elapsed = time.time() - start_time
        print(f"   Response time: {elapsed:.2f}s")
        print(f"   Status code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                ply_data = base64.b64decode(result["ply_base64"])
                print(f"   ✓ Success! PLY size: {len(ply_data):,} bytes")
                return ply_data
            else:
                print(f"   ❌ Error: {result.get('error', 'Unknown error')}")
                return None
        else:
            print(f"   ❌ HTTP Error: {response.text}")
            return None

    except requests.exceptions.Timeout:
        print(f"   ⏰ Timeout after 120s")
        return None
    except Exception as e:
        print(f"   💥 Exception: {e}")
        return None


def analyze_ply_file(ply_data, name):
    """Quick analysis of PLY file structure."""
    if not ply_data:
        return

    print(f"\n📊 Analyzing {name} PLY file:")

    # Convert to string to search for header info
    try:
        header = ply_data[:2000].decode("utf-8", errors="ignore")

        # Look for vertex count
        import re

        vertex_match = re.search(r"element vertex (\d+)", header)
        if vertex_match:
            vertex_count = int(vertex_match.group(1))
            print(f"   Gaussians count: {vertex_count:,}")

        # Look for properties
        properties = re.findall(r"property float (\w+)", header)
        print(
            f"   Properties: {', '.join(properties[:10])}{'...' if len(properties) > 10 else ''}"
        )

    except Exception as e:
        print(f"   Could not parse header: {e}")


def main():
    """Main test function."""
    print("🚀 Gaussian Splat Quality Comparison Test")
    print("=" * 50)

    # Look for test images in common locations
    test_images = ["test_image.jpg", "sample.jpg", "test.png", "image.jpg", "photo.jpg"]

    test_image_path = None
    for img_path in test_images:
        if Path(img_path).exists():
            test_image_path = img_path
            break

    if not test_image_path:
        print(f"❌ No test image found. Please add one of: {', '.join(test_images)}")
        print("You can download a sample image from:")
        print("https://picsum.photos/800/600.jpg")
        print("Save it as 'test_image.jpg' in this directory.")
        return

    print(f"📷 Using test image: {test_image_path}")

    # Encode image
    try:
        image_b64 = encode_image_to_base64(test_image_path)
        print(f"   Image size: {len(image_b64):,} chars (base64)")
    except Exception as e:
        print(f"❌ Failed to encode image: {e}")
        return

    # Test Shopiverse (your fixed version)
    shopiverse_ply = test_endpoint(SHOPIVERSE_ENDPOINT, image_b64, "Shopiverse (Fixed)")

    # For now, we'll just test the fixed Shopiverse endpoint
    print("\n⏭️  Only testing Shopiverse (fixed version)")
    shapr_ml_ply = None

    # Save results
    output_dir = Path("test_outputs")
    output_dir.mkdir(exist_ok=True)

    timestamp = int(time.time())

    if shopiverse_ply:
        shopiverse_path = output_dir / f"shopiverse_{timestamp}.ply"
        with open(shopiverse_path, "wb") as f:
            f.write(shopiverse_ply)
        print(f"\n💾 Saved Shopiverse PLY: {shopiverse_path}")
        analyze_ply_file(shopiverse_ply, "Shopiverse")

    if shapr_ml_ply:
        shapr_ml_path = output_dir / f"shapr_ml_{timestamp}.ply"
        with open(shapr_ml_path, "wb") as f:
            f.write(shapr_ml_ply)
        print(f"\n💾 Saved SHAPR-ML PLY: {shapr_ml_path}")
        analyze_ply_file(shapr_ml_ply, "SHAPR-ML")

    # Summary
    print("\n" + "=" * 50)
    print("🎯 Test Summary:")
    print(f"   Shopiverse: {'✓ Success' if shopiverse_ply else '❌ Failed'}")
    print(f"   SHAPR-ML:   {'✓ Success' if shapr_ml_ply else '❌ Failed or Skipped'}")

    if shopiverse_ply:
        print(f"\n🔍 Next steps:")
        print(f"   1. Open the PLY file in a 3D viewer (Blender, MeshLab, etc.)")
        print(f"   2. Check if the splats look properly positioned and colored")
        print(f"   3. Test the web interface at: file://{Path().absolute()}/index.html")
        print(f"   4. If quality is good, the transform matrix fix worked! 🎉")
        print(f"\n🌐 To test the web interface:")
        print(f"   1. Open index.html in your browser")
        print(f"   2. Upload the same test image")
        print(f"   3. Compare the 3D viewer output")


def test_with_sample_images():
    """Test with multiple sample images if available."""
    sample_images = ["test_portrait.jpg", "test_object.jpg", "test_landscape.jpg"]

    print("🧪 Testing with multiple sample images...")

    for img_path in sample_images:
        if Path(img_path).exists():
            print(f"\n📷 Testing with {img_path}")

            try:
                image_b64 = encode_image_to_base64(img_path)
                ply_data = test_endpoint(
                    SHOPIVERSE_ENDPOINT, image_b64, f"Shopiverse ({img_path})"
                )

                if ply_data:
                    output_path = (
                        Path("test_outputs") / f"{Path(img_path).stem}_fixed.ply"
                    )
                    output_path.parent.mkdir(exist_ok=True)
                    with open(output_path, "wb") as f:
                        f.write(ply_data)
                    print(f"   💾 Saved: {output_path}")

            except Exception as e:
                print(f"   ❌ Failed: {e}")


if __name__ == "__main__":
    # Run basic test
    main()

    # Uncomment to test with multiple images
    # test_with_sample_images()
