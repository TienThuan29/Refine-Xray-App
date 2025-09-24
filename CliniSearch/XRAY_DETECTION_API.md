# X-ray Detection API

This API endpoint uses the BiomedCLIP model to detect if an uploaded image is an X-ray image.

## Endpoint

```
POST /xray/detect
```

## Request

- **Method**: POST
- **Content-Type**: multipart/form-data
- **Body**: 
  - `image` (file): The image file to analyze

## Response

```json
{
  "is_xray": true,
  "xray_probability": 0.8542,
  "confidence_level": "high",
  "model_available": true
}
```

### Response Fields

- `is_xray` (boolean): Whether the image is classified as an X-ray (probability >= 0.5)
- `xray_probability` (float): Probability score between 0.0 and 1.0
- `confidence_level` (string): Confidence level based on probability:
  - `"high"`: probability >= 0.8
  - `"medium"`: probability >= 0.6
  - `"low"`: probability >= 0.4
  - `"very_low"`: probability < 0.4
  - `"unavailable"`: model not available
- `model_available` (boolean): Whether the BiomedCLIP model is loaded and available

## Usage Examples

### Using curl

```bash
# Test with an X-ray image
curl -X POST -F "image=@xray_image.png" http://localhost:8000/xray/detect

# Test with a non-X-ray image
curl -X POST -F "image=@regular_photo.jpg" http://localhost:8000/xray/detect
```

### Using Python requests

```python
import requests

# Test X-ray detection
with open('xray_image.png', 'rb') as f:
    response = requests.post(
        'http://localhost:8000/xray/detect',
        files={'image': f}
    )

result = response.json()
print(f"Is X-ray: {result['is_xray']}")
print(f"Probability: {result['xray_probability']}")
print(f"Confidence: {result['confidence_level']}")
```

### Using JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

fetch('http://localhost:8000/xray/detect', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => {
    console.log('Is X-ray:', data.is_xray);
    console.log('Probability:', data.xray_probability);
    console.log('Confidence:', data.confidence_level);
});
```

## Model Information

The API uses the Microsoft BiomedCLIP model (`microsoft/BiomedCLIP-PubMedBERT_256-vit_base_patch16_224`) which is specifically trained on medical images and text.

### Supported X-ray Types
- Chest X-ray radiographs
- Bone X-ray radiographs  
- Dental X-ray radiographs

### Non-X-ray Types (for comparison)
- CT scans
- MRI scans
- Ultrasound images
- Natural photographs
- Document scans
- Drawings or illustrations

## Error Handling

- **400 Bad Request**: If the uploaded file is not an image
- **500 Internal Server Error**: If there's an error during processing
- **503 Service Unavailable**: If the BiomedCLIP model is not available

## Health Check

Check if the X-ray detection model is available:

```bash
curl http://localhost:8000/health
```

Response includes `biomedclip_available` field indicating model status.

## Dependencies

The X-ray detection feature requires:
- `torch`
- `torchvision` 
- `open_clip_torch`
- `PIL` (Pillow)

Install with:
```bash
pip install open_clip_torch torch torchvision
```
