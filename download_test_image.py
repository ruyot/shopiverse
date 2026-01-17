"""
Download a test image for testing the Gaussian splat generation.
"""

from pathlib import Path

import requests


def download_test_image():
    """Download a sample image for testing."""

    # High-quality sample image URLs
    test_images = [
        {
            "url": "https://picsum.photos/800/600.jpg",
            "filename": "test_image.jpg",
            "description": "Random landscape/object photo",
        },
        {
            "url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
            "filename": "mountain_landscape.jpg",
            "description": "Mountain landscape",
        },
        {
            "url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=600&fit=crop",
            "filename": "red_shoe.jpg",
            "description": "Red sneaker (good for object reconstruction)",
        },
    ]

    print("🖼️  Downloading test images for Gaussian splat testing...")

    for img_info in test_images:
        try:
            print(f"\n📥 Downloading: {img_info['description']}")
            print(f"   URL: {img_info['url']}")

            response = requests.get(img_info["url"], timeout=30)
            response.raise_for_status()

            filepath = Path(img_info["filename"])
            with open(filepath, "wb") as f:
                f.write(response.content)

            file_size = len(response.content)
            print(f"   ✓ Saved: {filepath} ({file_size:,} bytes)")

        except Exception as e:
            print(f"   ❌ Failed to download {img_info['filename']}: {e}")

    print(f"\n🎯 Test images downloaded! You can now run:")
    print(f"   python test_splats.py")
    print(f"   or open index.html in your browser")


if __name__ == "__main__":
    download_test_image()
