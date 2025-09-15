import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np
import matplotlib.pyplot as plt
from PIL import Image
import cv2
import io
import base64
from torchvision import transforms 
from copy import deepcopy
import json
from pathlib import Path
import os

# Define disease labels
disease_labels = ['Atelectasis', 'Consolidation', 'Infiltration', 'Pneumothorax', 
                 'Edema', 'Emphysema', 'Fibrosis', 'Effusion', 'Pneumonia', 
                 'Pleural_Thickening', 'Cardiomegaly', 'Nodule', 'Mass', 'Hernia']

# Model Configuration class
class ModelConfig:
    # Momentum Encoder parameters
    MOMENTUM = 0.9999
    
    # Spatial Attention parameters
    ATTENTION_REDUCTION = 8
    
    # Memory Bank parameters
    BANK_SIZE = 512
    RARITY_THRESHOLD = 0.2
    RETRIEVAL_K = 3
    
    # Model architecture parameters
    DROPOUT_RATE = 0.3
    HIDDEN_DIM = 512
    
    @staticmethod
    def get_feature_dim(model_name):
        if model_name == 'resnet50':
            return 2048
        elif model_name == 'densenet121':
            return 1024
        elif model_name in ['efficientnet_b0', 'efficientnet_b1']:
            # This is a placeholder - actual value is determined at runtime
            return None
        else:
            raise ValueError(f"Model {model_name} not supported")

# Momentum Encoder: Simplified to final block copy
class MomentumFinalBlock(nn.Module):
    def __init__(self, final_block, momentum=None):
        super(MomentumFinalBlock, self).__init__()
        self.momentum = momentum if momentum is not None else ModelConfig.MOMENTUM
        self.final_block = deepcopy(final_block)
        for param in self.final_block.parameters():
            param.requires_grad = False

    def forward(self, x):
        return self.final_block(x)

    def update(self, main_final_block):
        for param_q, param_k in zip(main_final_block.parameters(), self.final_block.parameters()):
            param_k.data = param_k.data * self.momentum + param_q.data * (1. - self.momentum)

# Spatial Attention: Lightweight ROI selection
class SpatialAttention(nn.Module):
    def __init__(self, in_channels, reduction=None):
        super(SpatialAttention, self).__init__()
        reduction = reduction if reduction is not None else ModelConfig.ATTENTION_REDUCTION
        reduced_channels = max(in_channels // reduction, 8)
        
        self.conv1 = nn.Conv2d(in_channels, reduced_channels, kernel_size=1)
        self.conv3 = nn.Conv2d(in_channels, reduced_channels, kernel_size=3, padding=1)
        self.conv5 = nn.Conv2d(in_channels, reduced_channels, kernel_size=5, padding=2)
        
        self.spatial_att = nn.Sequential(
            nn.Conv2d(reduced_channels * 3, 1, kernel_size=1),
            nn.Sigmoid()
        )

    def forward(self, x):
        f1 = self.conv1(x)
        f3 = self.conv3(x)
        f5 = self.conv5(x)
        
        features = torch.cat([f1, f3, f5], dim=1)
        attention = self.spatial_att(features)  # [batch_size, 1, H, W]
        return attention

# Memory Bank: Store rare/important features
class MemoryBank(nn.Module):
    def __init__(self, feature_dim, bank_size=None, rarity_threshold=None):
        super(MemoryBank, self).__init__()
        self.feature_dim = feature_dim
        self.bank_size = bank_size if bank_size is not None else ModelConfig.BANK_SIZE
        self.rarity_threshold = rarity_threshold if rarity_threshold is not None else ModelConfig.RARITY_THRESHOLD
        
        self.register_buffer('memory', torch.zeros(self.bank_size, feature_dim))
        self.register_buffer('index', torch.tensor(0))

    def update(self, features, rarity_scores):
        batch_size = features.size(0)
        mask = rarity_scores < self.rarity_threshold
        rare_features = features[mask]
        
        if rare_features.size(0) > 0:
            num_to_add = min(rare_features.size(0), self.bank_size - self.index.item())
            if num_to_add > 0:
                self.memory[self.index:self.index + num_to_add] = rare_features[:num_to_add]
                self.index = (self.index + num_to_add) % self.bank_size

    def retrieve(self, query, k=None):
        k = k if k is not None else ModelConfig.RETRIEVAL_K
        valid_memory = self.memory
        if valid_memory.size(0) == 0:
            return torch.zeros_like(query)
        
        norm_query = F.normalize(query, dim=1)
        norm_memory = F.normalize(valid_memory, dim=1)
        similarity = torch.matmul(norm_query, norm_memory.T)
        
        # Create a mask for entries where similarity != 1
        mask = similarity != 1.0
        
        k = min(k, valid_memory.size(0))
        
        # Initialize containers for results
        batch_size = query.size(0)
        result = torch.zeros_like(query)
        
        for i in range(batch_size):
            # Get indices where similarity is not 1 for this query
            valid_indices = torch.where(mask[i])[0]
            
            if len(valid_indices) == 0:
                # If all memories have similarity=1, just return zeros
                continue
            
            # Get similarities only for valid indices
            valid_similarities = similarity[i, valid_indices]
            
            # Get top-k among valid similarities
            k_valid = min(k, valid_similarities.size(0))
            weights, rel_indices = valid_similarities.topk(k_valid)
            
            # Convert relative indices to absolute indices
            abs_indices = valid_indices[rel_indices]
            
            # Get features for these indices
            retrieved = valid_memory[abs_indices]
            
            # Apply weights
            weights = weights.unsqueeze(1).expand_as(retrieved)
            weighted_features = (retrieved * weights).sum(dim=0)
            
            result[i] = weighted_features
            
        return result

# Main Model
class ChestXrayModel(nn.Module):
    def __init__(self, num_classes, model_name='efficientnet_b0', config=None):
        super(ChestXrayModel, self).__init__()
        
        # Use provided config or the default ModelConfig
        self.config = config if config is not None else ModelConfig
        
        # Import required models
        import torchvision.models as models
        
        # Backbone and Final Block
        if model_name == 'resnet50':
            self.base_model = models.resnet50(weights='DEFAULT')
            self.backbone = nn.Sequential(
                self.base_model.conv1, self.base_model.bn1, self.base_model.relu,
                self.base_model.maxpool, self.base_model.layer1, self.base_model.layer2,
                self.base_model.layer3
            )
            self.final_block = self.base_model.layer4
            self.feature_dim = 2048
        elif model_name == 'densenet121':
            self.base_model = models.densenet121(weights='DEFAULT')
            features = list(self.base_model.features.children())
            self.backbone = nn.Sequential(*features[:-1])
            self.final_block = nn.Sequential(features[-1])
            self.feature_dim = 1024
        elif model_name in ['efficientnet_b0', 'efficientnet_b1']:
            self.base_model = models.efficientnet_v2_s(weights='DEFAULT') if model_name == 'efficientnet_b0' else models.efficientnet_b1(weights='DEFAULT')
            features = list(self.base_model.features)
            self.backbone = nn.Sequential(*features[:-1])
            self.final_block = nn.Sequential(features[-1])
            self.feature_dim = self.base_model.features[-1][0].out_channels
        else:
            raise ValueError(f"Model {model_name} not supported")

        self.base_model.fc = nn.Identity() if hasattr(self.base_model, 'fc') else None
        self.base_model.classifier = nn.Identity() if hasattr(self.base_model, 'classifier') else None

        # Momentum Encoder
        self.momentum_final_block = MomentumFinalBlock(self.final_block, momentum=self.config.MOMENTUM)

        # Spatial Attention
        self.spatial_attention = SpatialAttention(self.feature_dim, reduction=self.config.ATTENTION_REDUCTION)

        # Memory Bank
        self.memory_bank = MemoryBank(
            self.feature_dim, 
            bank_size=self.config.BANK_SIZE, 
            rarity_threshold=self.config.RARITY_THRESHOLD
        )

        # Classifier
        self.classifier = nn.Sequential(
            nn.BatchNorm1d(self.feature_dim),
            nn.Linear(self.feature_dim, self.config.HIDDEN_DIM),
            nn.ReLU(),
            nn.Dropout(self.config.DROPOUT_RATE),
            nn.Linear(self.config.HIDDEN_DIM, num_classes)
        )
        self.model_name = model_name

    def forward(self, x):
        # Extract features
        backbone_features = self.backbone(x)
        main_features = self.final_block(backbone_features)
        with torch.no_grad():
            momentum_features = self.momentum_final_block(backbone_features)

        # Spatial attention and ROI extraction
        attention_map = self.spatial_attention(main_features)
        roi_features = main_features * attention_map
        roi_pooled = F.adaptive_avg_pool2d(roi_features, (1, 1)).flatten(1)

        # Momentum features
        momentum_pooled = F.adaptive_avg_pool2d(momentum_features, (1, 1)).flatten(1)

        # Combine ROI and momentum features (simple addition)
        fused_features = roi_pooled + momentum_pooled

        # Update and retrieve from memory bank during training
        if self.training:
            mean_norm = torch.mean(torch.norm(fused_features, dim=1))
            rarity_scores = torch.abs(torch.norm(fused_features, dim=1) - mean_norm) / mean_norm
            self.memory_bank.update(fused_features.detach(), rarity_scores)
        
        memory_features = self.memory_bank.retrieve(fused_features, k=self.config.RETRIEVAL_K)
        enhanced_features = fused_features + memory_features

        # Classification
        out = self.classifier(enhanced_features)

        # Update momentum encoder during training
        if self.training:
             self.momentum_final_block.update(self.final_block)

        return out

# GradCAM Implementation
class GradCAMExtractor:
    """GradCAM implementation for the ChestXrayModel"""
    def __init__(self, model, target_layer_name='final_block'):
        self.model = model
        self.target_layer_name = target_layer_name
        self.gradients = None
        self.activations = None
        self.hooks = []
        
    def save_gradient(self, grad):
        self.gradients = grad
        
    def save_activation(self, module, input, output):
        self.activations = output
        
    def register_hooks(self):
        """Register hooks for gradient and activation capture"""
        target_layer = self._get_target_layer()
        
        hook_grad = target_layer.register_full_backward_hook(
            lambda module, grad_input, grad_output: self.save_gradient(grad_output[0])
        )
        
        hook_act = target_layer.register_forward_hook(self.save_activation)
        
        self.hooks = [hook_grad, hook_act]
        
    def _get_target_layer(self):
        """Get the target layer for GradCAM"""
        if self.target_layer_name == 'final_block':
            return self.model.final_block
        elif self.target_layer_name == 'backbone':
            return self.model.backbone
        else:
            raise ValueError(f"Unknown target layer: {self.target_layer_name}")
    
    def remove_hooks(self):
        """Remove all registered hooks"""
        for hook in self.hooks:
            hook.remove()
            
    def generate_cam(self, input_tensor, class_idx=None):
        """
        Generate GradCAM heatmap
        """
        self.model.eval()
        self.register_hooks()
        
        output = self.model(input_tensor)
        
        if class_idx is None:
            class_idx = output.argmax(dim=1).item()
        
        self.model.zero_grad()
        if output.shape[1] > 1:  # Multi-class case
            class_score = output[0, class_idx]
        else:  # Single class case
            class_score = output[0]
            
        class_score.backward(retain_graph=True)
        
        gradients = self.gradients[0].cpu().data.numpy()
        activations = self.activations[0].cpu().data.numpy()
        
        weights = np.mean(gradients, axis=(1, 2))
        
        cam = np.zeros(activations.shape[1:], dtype=np.float32)
        for i, w in enumerate(weights):
            cam += w * activations[i]
        
        cam = np.maximum(cam, 0)
        cam = cv2.resize(cam, (224, 224))
        cam = cam - np.min(cam)
        cam = cam / np.max(cam) if np.max(cam) > 0 else cam
        
        self.remove_hooks()
        
        return cam, output.sigmoid()

# Helper functions for model inference and visualization
def load_model(model_path=None, num_classes=14, device='cuda' if torch.cuda.is_available() else 'cpu'):
    """
    Load the ChestXrayModel with pretrained weights
    Enhanced to handle FastAI learner format and standalone format
    
    Args:
        model_path: Path to the model weights
        num_classes: Number of disease classes (default: 14)
        device: Device to load the model on
        
    Returns:
        Loaded model instance
    """
    print(f"Loading model for {num_classes} classes on {device}")
    model = ChestXrayModel(num_classes=num_classes, model_name='efficientnet_b0')
    
    if model_path and Path(model_path).exists():
        try:
            print(f"Loading model from: {model_path}")
            
            # Load checkpoint
            checkpoint = torch.load(model_path, map_location=device, weights_only=False)
            
            # Handle different checkpoint formats
            if isinstance(checkpoint, dict):
                if 'model' in checkpoint:
                    # FastAI learner format - extract model state dict
                    if hasattr(checkpoint['model'], 'state_dict'):
                        state_dict = checkpoint['model'].state_dict()
                    elif isinstance(checkpoint['model'], dict) and 'state_dict' in checkpoint['model']:
                        state_dict = checkpoint['model']['state_dict']
                    else:
                        state_dict = checkpoint['model']
                elif 'state_dict' in checkpoint:
                    state_dict = checkpoint['state_dict']
                else:
                    # Assume the checkpoint is the state dict itself
                    state_dict = checkpoint
            else:
                # If checkpoint is the model directly or just state dict
                if hasattr(checkpoint, 'state_dict'):
                    state_dict = checkpoint.state_dict()
                else:
                    state_dict = checkpoint
            
            # Clean state dict keys if they have wrapper prefixes
            cleaned_state_dict = {}
            for key, value in state_dict.items():
                # Remove common wrapper prefixes
                clean_key = key
                if key.startswith('model.model.'):
                    clean_key = key[12:]  # Remove 'model.model.'
                elif key.startswith('model.'):
                    clean_key = key[6:]   # Remove 'model.'
                elif key.startswith('module.'):
                    clean_key = key[7:]   # Remove 'module.' (DataParallel wrapper)
                
                cleaned_state_dict[clean_key] = value
            
            # Load the cleaned state dict
            missing_keys, unexpected_keys = model.load_state_dict(cleaned_state_dict, strict=False)
            
            if missing_keys:
                print(f"Warning: Missing keys in state dict: {missing_keys}")
            if unexpected_keys:
                print(f"Warning: Unexpected keys in state dict: {unexpected_keys}")
                
            print(f"✅ Model weights loaded successfully from {model_path}")
            
        except Exception as e:
            print(f"❌ Error loading model weights: {e}")
            print("🔄 Using model with random initialization instead")
    else:
        print("No model weights loaded. Using model with random initialization.")
    
    model = model.to(device)
    model.eval()
    return model

def test_model_inference(model, device='cuda' if torch.cuda.is_available() else 'cpu'):
    """Test that the loaded model can perform inference"""
    print("Testing model inference...")
    
    # Create dummy input
    dummy_input = torch.randn(1, 3, 224, 224).to(device)
    
    try:
        with torch.no_grad():
            output = model(dummy_input)
            probabilities = torch.sigmoid(output)
            
        print(f"✅ Model inference successful!")
        print(f"Output shape: {output.shape}")
        print(f"Sample probabilities: {probabilities[0][:5].cpu().numpy()}")
        return True
        
    except Exception as e:
        print(f"❌ Model inference failed: {e}")
        return False

def preprocess_image(image_data):
    """
    Preprocess an image for the model
    
    Args:
        image_data: PIL image or path to image
        
    Returns:
        Preprocessed image tensor
    """
    if isinstance(image_data, str):
        # If image_data is a path
        image = Image.open(image_data).convert('RGB')
    elif isinstance(image_data, Image.Image):
        # If image_data is already a PIL Image
        image = image_data.convert('RGB')
    else:
        raise ValueError("Unsupported image_data type. Expected PIL Image or path string.")
    
    # Define preprocessing transforms
    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Apply preprocessing
    img_tensor = preprocess(image)
    
    return img_tensor.unsqueeze(0)  # Add batch dimension

def predict(model, img_tensor, threshold=0.4, device='cuda' if torch.cuda.is_available() else 'cpu'):
    """
    Run inference on an image
    
    Args:
        model: The ChestXrayModel instance
        img_tensor: Preprocessed image tensor
        threshold: Confidence threshold for positive detection
        device: Device to run inference on
        
    Returns:
        Dictionary with predictions and confidence scores
    """
    img_tensor = img_tensor.to(device)
    
    with torch.no_grad():
        outputs = model(img_tensor)
        probs = torch.sigmoid(outputs)
    
    probs = probs.cpu().numpy()[0]
    
    # Get predictions above threshold
    positives = probs >= threshold
    
    results = []
    for i, (prob, is_positive) in enumerate(zip(probs, positives)):
        if is_positive:
            results.append({
                'disease': disease_labels[i],
                'confidence': float(prob),
                'index': i
            })
    
    # Also get top 5 diseases regardless of threshold for comprehensive analysis
    top_5_indices = np.argsort(probs)[-5:][::-1]
    top_5_diseases = []
    for idx in top_5_indices:
        top_5_diseases.append({
            'disease': disease_labels[idx],
            'confidence': float(probs[idx]),
            'index': int(idx)
        })
    
    # Sort by confidence
    results = sorted(results, key=lambda x: x['confidence'], reverse=True)
    
    return {
        'raw_probabilities': probs.tolist(),
        'predicted_diseases': results,
        'top_5_diseases': top_5_diseases
    }

def generate_gradcam_all(model, img_tensor, prediction_results, output_dir=None, device='cuda' if torch.cuda.is_available() else 'cpu'):
    """
    Generate GradCAM visualizations for all detected diseases
    
    Args:
        model: The ChestXrayModel instance
        img_tensor: Preprocessed image tensor
        prediction_results: Results from the predict function
        output_dir: Directory to save the visualization images
        device: Device to run on
        
    Returns:
        Dictionary mapping disease names to GradCAM visualizations
    """
    img_tensor = img_tensor.to(device)
    gradcam = GradCAMExtractor(model)
    
    # Original image for overlay
    img_np = img_tensor.cpu().numpy()[0].transpose(1, 2, 0)
    # Denormalize the image for proper visualization
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    img_np = img_np * std + mean
    img_np = np.clip(img_np, 0, 1)
    
    gradcam_results = {}
    
    for result in prediction_results['predicted_diseases']:
        disease = result['disease']
        class_idx = result['index']
        
        # Generate GradCAM for this class
        cam, _ = gradcam.generate_cam(img_tensor, class_idx=class_idx)
        
        # Colorize the heatmap
        heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        heatmap = heatmap / 255.0
        
        # Overlay on the original image
        overlay = 0.6 * img_np + 0.4 * heatmap
        
        # Save visualization if output_dir is provided
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            
            # Create a figure with original and GradCAM
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
            
            # Original image
            ax1.imshow(img_np)
            ax1.set_title('Original X-ray')
            ax1.axis('off')
            
            # GradCAM overlay
            ax2.imshow(overlay)
            ax2.set_title(f'{disease} GradCAM\n(Confidence: {result["confidence"]:.3f})')
            ax2.axis('off')
            
            plt.tight_layout()
            gradcam_path = f"{output_dir}/{disease}_gradcam_analysis.png"
            plt.savefig(gradcam_path, bbox_inches='tight', dpi=150)
            plt.close()
            
            print(f"Saved GradCAM visualization: {gradcam_path}")
        
        # Save result
        gradcam_results[disease] = {
            'heatmap': cam.tolist(),
            'overlay': overlay.tolist(),
            'confidence': result['confidence']
        }
    
    return gradcam_results

def generate_gradcam_top5(model, img_tensor, top_5_diseases, output_dir=None, device='cuda' if torch.cuda.is_available() else 'cpu'):
    """
    Generate GradCAM visualizations for top 5 diseases
    
    Args:
        model: The ChestXrayModel instance
        img_tensor: Preprocessed image tensor
        top_5_diseases: List of top 5 diseases from predict function
        output_dir: Directory to save the visualization images
        device: Device to run on
        
    Returns:
        Dictionary mapping disease names to GradCAM visualizations
    """
    img_tensor = img_tensor.to(device)
    gradcam = GradCAMExtractor(model)
    
    # Original image for overlay
    img_np = img_tensor.cpu().numpy()[0].transpose(1, 2, 0)
    # Denormalize the image for proper visualization
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    img_np = img_np * std + mean
    img_np = np.clip(img_np, 0, 1)
    
    gradcam_results = {}
    
    for i, disease_info in enumerate(top_5_diseases):
        disease = disease_info['disease']
        class_idx = disease_info['index']
        confidence = disease_info['confidence']
        
        print(f"Generating GradCAM for top {i+1} disease: {disease} (confidence: {confidence:.3f})")
        
        # Generate GradCAM for this class
        cam, _ = gradcam.generate_cam(img_tensor, class_idx=class_idx)
        
        # Colorize the heatmap
        heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
        heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
        heatmap = heatmap / 255.0
        
        # Overlay on the original image
        overlay = 0.6 * img_np + 0.4 * heatmap
        
        # Save visualization if output_dir is provided
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
            
            # Create a figure with original and GradCAM
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
            
            # Original image
            ax1.imshow(img_np)
            ax1.set_title('Original X-ray')
            ax1.axis('off')
            
            # GradCAM overlay
            ax2.imshow(overlay)
            ax2.set_title(f'{disease} GradCAM\n(Top {i+1} - Confidence: {confidence:.3f})')
            ax2.axis('off')
            
            plt.tight_layout()
            gradcam_path = f"{output_dir}/top{i+1}_{disease}_gradcam.png"
            plt.savefig(gradcam_path, bbox_inches='tight', dpi=150)
            plt.close()
            
            print(f"Saved GradCAM visualization: {gradcam_path}")
        
        # Save result
        gradcam_results[f"top{i+1}_{disease}"] = {
            'disease': disease,
            'rank': i + 1,
            'heatmap': cam.tolist(),
            'overlay': overlay.tolist(),
            'confidence': confidence
        }
    
    return gradcam_results

def extract_attention_map(model, img_tensor, device='cuda' if torch.cuda.is_available() else 'cpu'):
    """
    Extract the attention map from the model
    
    Args:
        model: The ChestXrayModel instance
        img_tensor: Preprocessed image tensor
        device: Device to run on
        
    Returns:
        The attention map as a numpy array (original 7x7 size)
    """
    img_tensor = img_tensor.to(device)
    
    # Register a hook to get the attention map
    attention_maps = []
    
    def hook_fn(module, input, output):
        attention_maps.append(output.detach().cpu().numpy())
    
    hook = model.spatial_attention.register_forward_hook(hook_fn)
    
    # Forward pass
    with torch.no_grad():
        _ = model(img_tensor)
    
    # Remove the hook
    hook.remove()
    
    # Extract the attention map - keep original 7x7 size
    attention_map = attention_maps[0][0, 0]
    
    # Don't resize - keep original 7x7 dimensions
    return attention_map

def visualize_attention_map(model, img_tensor, output_dir=None, device='cuda' if torch.cuda.is_available() else 'cpu'):
    """
    Visualize the attention map (7x7 grid without overlay)
    
    Args:
        model: The ChestXrayModel instance
        img_tensor: Preprocessed image tensor
        output_dir: Directory to save the visualization
        device: Device to run on
        
    Returns:
        Dictionary with attention map visualization
    """
    # Get the attention map (7x7)
    attention_map = extract_attention_map(model, img_tensor, device)
    
    # Original image for reference (denormalized)
    img_np = img_tensor.cpu().numpy()[0].transpose(1, 2, 0)
    mean = np.array([0.485, 0.456, 0.406])
    std = np.array([0.229, 0.224, 0.225])
    img_np = img_np * std + mean
    img_np = np.clip(img_np, 0, 1)
    
    # Save visualization if output_dir is provided
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        
        # Create figure with two subplots only (no overlay)
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
        
        # Original image
        ax1.imshow(img_np)
        ax1.set_title('Original X-ray')
        ax1.axis('off')
        
        # Attention map (7x7 grid)
        im2 = ax2.imshow(attention_map, cmap='jet', interpolation='nearest')
        ax2.set_title('Model Attention Map (7x7)')
        ax2.axis('off')
        
        # Add colorbar
        plt.colorbar(im2, ax=ax2, fraction=0.046, pad=0.04)
        
        # Add grid lines to show 7x7 structure
        ax2.set_xticks(np.arange(-0.5, 7, 1), minor=True)
        ax2.set_yticks(np.arange(-0.5, 7, 1), minor=True)
        ax2.grid(which='minor', color='white', linestyle='-', linewidth=0.5, alpha=0.7)
        
        plt.tight_layout()
        attention_path = f"{output_dir}/attention_analysis.png"
        plt.savefig(attention_path, bbox_inches='tight', dpi=150)
        plt.close()
        
        print(f"Saved attention visualization: {attention_path}")
    
    return {
        'attention_map': attention_map.tolist()
    }

async def get_pubmed_for_disease(disease_name, perform_rag_func, vector_store):
    """
    Get PubMed information for a specific disease
    
    Args:
        disease_name: Name of the disease to search for
        perform_rag_func: The perform_rag function
        vector_store: Vector store instance
        
    Returns:
        Tuple of (context, sources) from PubMed
    """
    try:
        query = f"human chest X-ray {disease_name} radiographic signs location anatomy patient"
        context, sources = await perform_rag_func(
            query, 
            vector_store, 
            use_web=False, 
            use_pubmed=True
        )
        return context, sources
    except Exception as e:
        print(f"Error getting PubMed for {disease_name}: {e}")
        return None, None

def analyze_individual_disease_with_pubmed(gemini_client, disease_name, confidence, gradcam_overlay, original_image_pil, pubmed_context=None, pubmed_sources=None):
    """
    Get concise individual analysis for a specific disease with PubMed citations
    
    Args:
        gemini_client: Initialized Gemini client
        disease_name: Name of the disease
        confidence: Confidence score
        gradcam_overlay: GradCAM overlay image as numpy array
        original_image_pil: Original PIL image
        pubmed_context: PubMed context for this disease
        pubmed_sources: PubMed sources for this disease
        
    Returns:
        Concise analysis with PubMed citations
    """
    # Format citations
    citations = ""
    if pubmed_sources:
        for i, source in enumerate(pubmed_sources[:2]):  # Use top 2 sources
            pmid = source.get('link', '').split('/')[-1] if source.get('link') else 'N/A'
            citations += f"[{i+1}] {source.get('title', 'N/A')} (PMID: {pmid})\n"
    
    prompt = f"""You are a radiologist. Provide a CONCISE analysis of {disease_name} for this human chest X-ray.

**Disease**: {disease_name}
**PubMed Evidence:**
{pubmed_context if pubmed_context else "No PubMed information available"}

**References:**
{citations if citations else "No references available"}

**Required Analysis (Keep VERY brief):**

1. **Location & Signs** (1-2 sentences):
   - Where does {disease_name} typically appear on human chest X-ray?
   - What are the key radiographic signs in humans? Cite evidence [number]

2. **GradCAM Assessment** (1-2 sentences):
   - Does the highlighted area match the expected anatomical location from literature?
   - Is the model focusing on the correct region for {disease_name}?

3. **Quick Assessment** (1 sentence):
   - Based on PubMed evidence, is this finding consistent with {disease_name} in humans?

**Guidelines:**
- Maximum 5 sentences total
- Always cite PubMed sources using [number]
- Focus only on human pathology and anatomical accuracy
- Do not include any animal disease references"""

    try:
        # Create visualization image
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
        
        # Original image
        ax1.imshow(original_image_pil)
        ax1.set_title('Original X-ray')
        ax1.axis('off')
        
        # GradCAM overlay
        ax2.imshow(gradcam_overlay)
        ax2.set_title(f'{disease_name} GradCAM')
        ax2.axis('off')
        
        plt.tight_layout()
        
        # Convert to bytes
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='PNG', bbox_inches='tight', dpi=150)
        img_buffer.seek(0)
        img_bytes = img_buffer.getvalue()
        plt.close()
        
        # Create multimodal prompt
        prompt_parts = [
            prompt,
            {
                "mime_type": "image/png",
                "data": img_bytes
            }
        ]
        
        analysis = gemini_client.model.generate_content(prompt_parts)
        return analysis.text
        
    except Exception as e:
        return f"Error getting analysis for {disease_name}: {str(e)}"

def analyze_individual_disease_with_gemini(gemini_client, disease_name, confidence, gradcam_overlay, original_image_pil):
    """
    Get individual analysis for a specific disease from Gemini
    
    Args:
        gemini_client: Initialized Gemini client
        disease_name: Name of the disease
        confidence: Confidence score
        gradcam_overlay: GradCAM overlay image as numpy array
        original_image_pil: Original PIL image
        
    Returns:
        Gemini's analysis for this specific disease
    """
    prompt = f"""You are an expert radiologist. Analyze this human chest X-ray specifically for {disease_name}.

**Disease**: {disease_name} (Human pathology only)
**AI Confidence**: {confidence:.3f}

**Please provide a focused analysis for {disease_name} including:**

1. **Clinical Description**: What is {disease_name} and how does it typically present on human chest X-rays?

2. **GradCAM Interpretation**: Looking at the highlighted regions in the GradCAM visualization:
   - Are the highlighted areas anatomically consistent with {disease_name} in humans?
   - Do the focus areas match typical radiographic patterns for this condition in human patients?
   - Any concerning or unexpected areas of attention?

3. **Confidence Assessment**: Based on the visualization and confidence score ({confidence:.3f}):
   - Does this confidence level seem appropriate for human diagnosis?
   - What factors support or contradict this diagnosis in humans?

4. **Clinical Recommendations**: For this specific finding in human patients:
   - What additional views or imaging might be helpful?
   - What clinical correlation would be important?

Keep your response focused specifically on {disease_name} in human patients only. Do not reference veterinary or animal pathology."""

    try:
        # Create visualization image
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
        
        # Original image
        ax1.imshow(original_image_pil)
        ax1.set_title('Original X-ray')
        ax1.axis('off')
        
        # GradCAM overlay
        ax2.imshow(gradcam_overlay)
        ax2.set_title(f'{disease_name} GradCAM\n(Confidence: {confidence:.3f})')
        ax2.axis('off')
        
        plt.tight_layout()
        
        # Convert to bytes
        img_buffer = io.BytesIO()
        plt.savefig(img_buffer, format='PNG', bbox_inches='tight', dpi=150)
        img_buffer.seek(0)
        img_bytes = img_buffer.getvalue()
        plt.close()
        
        # Create multimodal prompt
        prompt_parts = [
            prompt,
            {
                "mime_type": "image/png",
                "data": img_bytes
            }
        ]
        
        analysis = gemini_client.model.generate_content(prompt_parts)
        return analysis.text
        
    except Exception as e:
        return f"Error getting individual analysis for {disease_name}: {str(e)}"

def get_concise_conclusion_from_gemini(gemini_client, top_5_diseases, individual_analyses, original_image_pil):
    """
    Get concise conclusion and overall assessment from Gemini
    
    Args:
        gemini_client: Initialized Gemini client
        top_5_diseases: List of top 5 diseases with confidence scores
        individual_analyses: Dictionary of individual disease analyses
        original_image_pil: Original PIL image
        
    Returns:
        Concise conclusion from Gemini
    """
    diseases_summary = ""
    for i, disease in enumerate(top_5_diseases[:3]):  # Only top 3
        diseases_summary += f"{i+1}. {disease['disease']}: {disease['confidence']:.3f}\n"
    
    prompt = f"""You are a radiologist providing a CONCISE conclusion for this human chest X-ray.

**AI Results (Top 3):**
{diseases_summary}

**Provide a BRIEF conclusion (maximum 6 sentences):**

1. **Primary Finding** (1-2 sentences):
   - What is the most significant finding on this human X-ray?

2. **Clinical Significance** (1-2 sentences): 
   - What does this mean for the human patient?

3. **Immediate Recommendations** (1-2 sentences):
   - What should be done next for this patient?

**Guidelines:**
- Maximum 6 sentences total
- Focus only on the most important findings in humans
- Be concise and actionable for human healthcare
- Do not reference animal or veterinary conditions"""

    try:
        # Convert original image to bytes
        img_buffer = io.BytesIO()
        original_image_pil.save(img_buffer, format='JPEG')
        img_buffer.seek(0)
        img_bytes = img_buffer.getvalue()
        
        prompt_parts = [
            prompt,
            {
                "mime_type": "image/jpeg",
                "data": img_bytes
            }
        ]
        
        conclusion = gemini_client.model.generate_content(prompt_parts)
        return conclusion.text
        
    except Exception as e:
        return f"Error getting concise conclusion: {str(e)}"

def get_comprehensive_conclusion_from_gemini(gemini_client, top_5_diseases, individual_analyses, original_image_pil):
    """
    Get comprehensive conclusion and overall assessment from Gemini
    
    Args:
        gemini_client: Initialized Gemini client
        top_5_diseases: List of top 5 diseases with confidence scores
        individual_analyses: Dictionary of individual disease analyses
        original_image_pil: Original PIL image
        
    Returns:
        Comprehensive conclusion from Gemini
    """
    diseases_summary = ""
    for i, disease in enumerate(top_5_diseases):
        diseases_summary += f"{i+1}. {disease['disease']}: {disease['confidence']:.3f}\n"
    
    individual_summary = ""
    for disease_key, analysis in individual_analyses.items():
        disease_name = disease_key.split('_', 1)[1]  # Remove 'top1_' prefix
        individual_summary += f"\n**Analysis for {disease_name}:**\n{analysis[:500]}...\n"
    
    prompt = f"""You are a senior radiologist providing a comprehensive conclusion for this human chest X-ray analysis.

**AI Model Results - Top 5 Predictions:**
{diseases_summary}

**Individual Disease Analyses Summary:**
{individual_summary}

**Please provide a COMPREHENSIVE CONCLUSION including:**

1. **Overall Radiological Impression**:
   - Primary findings and their significance in human patients
   - Most likely diagnoses based on the complete analysis
   - Confidence in the overall assessment for human pathology

2. **Clinical Synthesis**:
   - How do the individual findings relate to each other in humans?
   - Are there any patterns or combinations that suggest specific human conditions?
   - What is the most coherent clinical picture for this patient?

3. **Risk Stratification**:
   - Which findings require immediate attention for the patient?
   - Which findings need follow-up monitoring in humans?
   - Any incidental findings of note in human healthcare?

4. **Recommendations**:
   - Next steps for human patient management
   - Additional imaging or studies needed for humans
   - Clinical correlation required for this patient
   - Timeline for follow-up in human healthcare

5. **Limitations and Caveats**:
   - Limitations of AI analysis for human diagnosis
   - Factors that might affect interpretation in humans
   - Importance of clinical correlation with patient history

6. **Final Assessment**:
   - Summary statement of key findings in this human patient
   - Overall clinical significance for human health
   - Recommended action priority level for patient care

Provide a professional, structured conclusion that synthesizes all the individual analyses into a coherent radiological report for human healthcare only. Do not reference veterinary or animal pathology."""

    try:
        # Convert original image to bytes
        img_buffer = io.BytesIO()
        original_image_pil.save(img_buffer, format='JPEG')
        img_buffer.seek(0)
        img_bytes = img_buffer.getvalue()
        
        prompt_parts = [
            prompt,
            {
                "mime_type": "image/jpeg",
                "data": img_bytes
            }
        ]
        
        conclusion = gemini_client.model.generate_content(prompt_parts)
        return conclusion.text
        
    except Exception as e:
        return f"Error getting comprehensive conclusion: {str(e)}"

def diagnose_and_visualize(image_data, model_path=None, output_dir=None, threshold=0.4, device='cuda' if torch.cuda.is_available() else 'cpu'):
    """
    End-to-end pipeline to diagnose an image and generate visualizations
    
    Args:
        image_data: PIL image or path to image
        model_path: Path to the model weights
        output_dir: Directory to save visualizations
        threshold: Confidence threshold for positive detection
        device: Device to run on
        
    Returns:
        Dictionary with diagnosis and visualization results
    """
    # 1. Load model with enhanced compatibility
    model = load_model(model_path, device=device)
    
    # 2. Test model inference
    if not test_model_inference(model, device):
        return {
            'diagnosis': {'raw_probabilities': [], 'predicted_diseases': [], 'top_5_diseases': []},
            'gradcam': {},
            'gradcam_top5': {},
            'attention': {},
            'error': 'Model inference test failed'
        }
    
    # 3. Preprocess image
    img_tensor = preprocess_image(image_data)
    
    # 4. Run prediction
    prediction_results = predict(model, img_tensor, threshold, device)
    
    # 5. Generate GradCAM for predicted classes above threshold
    gradcam_results = generate_gradcam_all(model, img_tensor, prediction_results, output_dir, device)
    
    # 6. Generate GradCAM for top 5 diseases
    gradcam_top5_results = generate_gradcam_top5(model, img_tensor, prediction_results['top_5_diseases'], output_dir, device)
    
    # 7. Generate attention map
    attention_results = visualize_attention_map(model, img_tensor, output_dir, device)
    
    # 8. Format results
    results = {
        'diagnosis': prediction_results,
        'gradcam': gradcam_results,
        'gradcam_top5': gradcam_top5_results,
        'attention': attention_results
    }
    
    # Save results as JSON if output_dir is provided
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        with open(f"{output_dir}/diagnosis_results.json", 'w') as f:
            json.dump(results, f, indent=4)
    
    return results

def prepare_gemini_analysis_from_results(original_image_pil, diagnosis_results, output_dir=None):
    """
    Prepare comprehensive analysis for Gemini based on diagnosis results
    
    Args:
        original_image_pil: PIL Image of the original chest X-ray
        diagnosis_results: Results from diagnose_and_visualize
        output_dir: Optional directory to save visualization images
        
    Returns:
        Dictionary with prompt and image data for Gemini
    """
    # Create analysis prompt
    predicted_diseases = diagnosis_results['diagnosis']['predicted_diseases']
    
    prompt = f"""You are an expert radiologist analyzing a human chest X-ray. I have performed AI-assisted analysis and will provide:

1. The original human chest X-ray image
2. AI model predictions with confidence scores for human pathology
3. GradCAM visualizations showing model attention for each predicted disease
4. Overall attention map showing general areas of focus

**AI Model Predictions (Human Pathology Only):**
"""
    
    if predicted_diseases:
        for disease in predicted_diseases:
            prompt += f"- {disease['disease']}: {disease['confidence']:.3f} confidence\n"
    else:
        prompt += "- No diseases detected above threshold\n"
    
    prompt += """
**Please provide a comprehensive radiological analysis for human healthcare including:**

1. **Clinical Assessment**: For each predicted disease in humans, explain:
   - What the condition represents clinically in human patients
   - Typical radiographic findings in humans
   - How the GradCAM visualization aligns with expected findings in human chest X-rays

2. **GradCAM Analysis**: Interpret the highlighted regions in each GradCAM:
   - Are the highlighted areas anatomically relevant for human pathology?
   - Do they correspond to typical locations for each condition in humans?
   - Any concerning or unexpected focus areas for human diagnosis?

3. **Attention Map Analysis**: 
   - Overall pattern of model attention across the human chest image
   - Whether attention aligns with clinically relevant human anatomical structures
   - Any areas of high attention that weren't flagged for specific human diseases

4. **Clinical Correlation**:
   - Overall interpretation of findings for human patient care
   - Confidence in AI predictions based on visualization analysis for humans
   - Recommended follow-up or additional imaging needed for human patients
   - Any limitations or caveats specific to human diagnosis

5. **Quality Assessment**:
   - Image quality and technical factors affecting human diagnosis
   - Any artifacts or limitations affecting interpretation for patient care

Please structure your response clearly and provide specific observations about the visualizations relevant to human healthcare only. Do not reference animal or veterinary pathology."""

    # Prepare image data for multimodal input
    images_for_analysis = []
    
    # Convert PIL image to bytes for Gemini
    img_byte_arr = io.BytesIO()
    original_image_pil.save(img_byte_arr, format='JPEG')
    original_image_bytes = img_byte_arr.getvalue()
    
    images_for_analysis.append({
        "description": "Original Chest X-ray",
        "data": original_image_bytes,
        "mime_type": "image/jpeg"
    })
    
    # Create visualization images for Gemini if output_dir is provided
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
        
        # Save and add GradCAM images
        for disease_name, gradcam_data in diagnosis_results['gradcam'].items():
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
            
            # Original image
            img_np = np.array(original_image_pil.convert('RGB'))
            ax1.imshow(img_np, cmap='gray')
            ax1.set_title('Original X-ray')
            ax1.axis('off')
            
            # GradCAM overlay
            overlay = np.array(gradcam_data['overlay'])
            ax2.imshow(overlay)
            ax2.set_title(f'{disease_name} GradCAM\n(Confidence: {gradcam_data["confidence"]:.3f})')
            ax2.axis('off')
            
            plt.tight_layout()
            gradcam_path = f"{output_dir}/{disease_name}_gradcam_analysis.png"
            plt.savefig(gradcam_path, bbox_inches='tight', dpi=150)
            plt.close()
            
            # Add to images for analysis
            with open(gradcam_path, 'rb') as f:
                gradcam_bytes = f.read()
            images_for_analysis.append({
                "description": f"GradCAM visualization for {disease_name}",
                "data": gradcam_bytes,
                "mime_type": "image/png"
            })
        
        # Save and add attention map
        attention_data = diagnosis_results['attention']
        fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(15, 5))
        
        # Original
        img_np = np.array(original_image_pil.convert('RGB'))
        ax1.imshow(img_np, cmap='gray')
        ax1.set_title('Original X-ray')
        ax1.axis('off')
        
        # Attention map
        attention_map = np.array(attention_data['attention_map'])
        im2 = ax2.imshow(attention_map, cmap='jet')
        ax2.set_title('Model Attention Map')
        ax2.axis('off')
        plt.colorbar(im2, ax=ax2, fraction=0.046, pad=0.04)
        
        # Overlay
        overlay = np.array(attention_data['overlay'])
        ax3.imshow(overlay)
        ax3.set_title('Attention Overlay')
        ax3.axis('off')
        
        plt.tight_layout()
        attention_path = f"{output_dir}/attention_analysis.png"
        plt.savefig(attention_path, bbox_inches='tight', dpi=150)
        plt.close()
        
        # Add to images for analysis
        with open(attention_path, 'rb') as f:
            attention_bytes = f.read()
        images_for_analysis.append({
            "description": "Model attention map and overlay",
            "data": attention_bytes,
            "mime_type": "image/png"
        })
    
    return {
        "prompt": prompt,
        "images": images_for_analysis
    }

def analyze_with_gemini_and_pubmed(gemini_client, original_image_pil, diagnosis_results, pubmed_context=None, pubmed_sources=None):
    """
    Generate concise analysis with PubMed citations for diagnosis results
    
    Args:
        gemini_client: Initialized Gemini client
        original_image_pil: PIL Image of the original chest X-ray
        diagnosis_results: Results from diagnose_and_visualize
        pubmed_context: Context retrieved from PubMed search
        pubmed_sources: PubMed sources with citation information
        
    Returns:
        Concise analysis with scientific citations
    """
    top_5_diseases = diagnosis_results['diagnosis']['top_5_diseases']
    
    # Create disease summary
    diseases_summary = ""
    for i, disease in enumerate(top_5_diseases[:3]):  # Focus on top 3
        diseases_summary += f"{i+1}. {disease['disease']}: {disease['confidence']:.3f}\n"
    
    # Format PubMed citations
    citations = ""
    if pubmed_sources:
        for i, source in enumerate(pubmed_sources[:3]):  # Use top 3 relevant sources
            pmid = source.get('link', '').split('/')[-1] if source.get('link') else 'N/A'
            citations += f"[{i+1}] {source.get('title', 'N/A')} (PMID: {pmid})\n"
    
    prompt = f"""You are a professional radiologist. Provide a concise analysis of the AI diagnosis results with scientific evidence from PubMed for human healthcare.

**AI Results (Top 3 Human Pathologies):**
{diseases_summary}

**PubMed Context (Human Studies Only):**
{pubmed_context if pubmed_context else "No PubMed information available"}

**References:**
{citations if citations else "No references available"}

**Analysis Requirements:**

1. **Clinical Assessment** (2-3 sentences):
   - Comment on the detected pathologies in human patients
   - Clinical significance of the findings for human health

2. **Scientific Evidence** (2-3 sentences):
   - Based on PubMed information, explain why the model produced these results for humans
   - Cite specific evidence using [number] from human studies only

3. **Recommendations** (1-2 sentences):
   - Next steps required for human patient care
   - Follow-up or additional testing needed for humans

**Guidelines:** 
- Keep responses concise, maximum 3 sentences per section
- Always cite PubMed sources using [number] from human studies only
- Do not evaluate whether confidence scores are high or low
- Focus exclusively on human pathology and healthcare
- Do not reference animal or veterinary studies"""

    try:
        # Convert image to bytes
        img_buffer = io.BytesIO()
        original_image_pil.save(img_buffer, format='JPEG')
        img_buffer.seek(0)
        img_bytes = img_buffer.getvalue()
        
        prompt_parts = [
            prompt,
            {
                "mime_type": "image/jpeg",
                "data": img_bytes
            }
        ]
        
        analysis = gemini_client.model.generate_content(prompt_parts)
        return analysis.text
        
    except Exception as e:
        return f"Error getting analysis with PubMed citations: {str(e)}"

def analyze_with_gemini(gemini_client, original_image_pil, diagnosis_results, output_dir=None):
    """
    Complete pipeline to analyze chest X-ray with Gemini
    
    Args:
        gemini_client: Initialized Gemini client
        original_image_pil: PIL Image of the original chest X-ray
        diagnosis_results: Results from diagnose_and_visualize
        output_dir: Optional directory to save visualizations
        
    Returns:
        Gemini's comprehensive analysis
    """
    # Prepare analysis data
    analysis_data = prepare_gemini_analysis_from_results(
        original_image_pil, diagnosis_results, output_dir
    )
    
    # Create multimodal prompt for Gemini
    prompt_parts = [analysis_data["prompt"]]
    
    # Add images to prompt
    for img_info in analysis_data["images"]:
        prompt_parts.append({
            "mime_type": img_info["mime_type"],
            "data": img_info["data"]
        })
    
    # Get Gemini's analysis
    try:
        analysis = gemini_client.model.generate_content(prompt_parts)
        return analysis.text
    except Exception as e:
        return f"Error getting Gemini analysis: {str(e)}"
