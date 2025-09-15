import pandas as pd
import os
import random
from pathlib import Path

def load_test_samples(dataset_path, num_samples=10):
    """
    Load test samples from NIH Chest X-ray 14 dataset
    
    Args:
        dataset_path: Path to nih_chestxray_14 folder
        num_samples: Number of test samples to load (default: 10)
        
    Returns:
        List of dictionaries with image info and ground truth
    """
    # Read the data entry CSV
    csv_path = os.path.join(dataset_path, "Data_Entry_2017.csv")
    if not os.path.exists(csv_path):
        return []
    
    df = pd.read_csv(csv_path)
    
    # Get diverse samples (different diseases)
    test_samples = []
    
    # Define interesting cases for demo
    target_cases = [
        "Cardiomegaly",
        "Pneumonia", 
        "Effusion",
        "Atelectasis",
        "Mass",
        "Nodule",
        "Pneumothorax",
        "Consolidation",
        "Hernia",
        "Infiltration",
        "Emphysema",
        "Fibrosis",
        "Pleural_Thickening",
        "Edema"
    ]
    
    # Try to get one sample for each disease
    for disease in target_cases[:num_samples]:
        # Find samples with this disease
        disease_samples = df[df['Finding Labels'].str.contains(disease, na=False)]
        
        if not disease_samples.empty:
            # Pick random sample for this disease
            sample = disease_samples.sample(1).iloc[0]
            
            # Find the image file
            image_name = sample['Image Index']
            image_path = find_image_path(dataset_path, image_name)
            
            if image_path and os.path.exists(image_path):
                test_samples.append({
                    'image_name': image_name,
                    'image_path': image_path,
                    'ground_truth': sample['Finding Labels'],
                    'patient_age': sample['Patient Age'],
                    'patient_gender': sample['Patient Gender'],
                    'view_position': sample['View Position'],
                    'primary_disease': disease
                })
            
            if len(test_samples) >= num_samples:
                break
    
    # If we need more samples, add some "No Finding" cases
    if len(test_samples) < num_samples:
        no_finding_samples = df[df['Finding Labels'] == 'No Finding']
        remaining_needed = num_samples - len(test_samples)
        
        for _, sample in no_finding_samples.sample(min(remaining_needed, len(no_finding_samples))).iterrows():
            image_name = sample['Image Index']
            image_path = find_image_path(dataset_path, image_name)
            
            if image_path and os.path.exists(image_path):
                test_samples.append({
                    'image_name': image_name,
                    'image_path': image_path,
                    'ground_truth': sample['Finding Labels'],
                    'patient_age': sample['Patient Age'],
                    'patient_gender': sample['Patient Gender'],
                    'view_position': sample['View Position'],
                    'primary_disease': 'No Finding'
                })
    
    return test_samples[:num_samples]

def find_image_path(dataset_path, image_name):
    """
    Find the full path to an image file in the dataset
    
    Args:
        dataset_path: Path to nih_chestxray_14 folder
        image_name: Name of the image file
        
    Returns:
        Full path to the image file or None if not found
    """
    # Search in all image folders
    for i in range(1, 13):  # images_001 to images_012
        folder_name = f"images_{i:03d}"
        images_folder = os.path.join(dataset_path, folder_name, "images")
        
        if os.path.exists(images_folder):
            image_path = os.path.join(images_folder, image_name)
            if os.path.exists(image_path):
                return image_path
    
    return None

def get_sample_info(sample):
    """
    Format sample information for display
    
    Args:
        sample: Sample dictionary
        
    Returns:
        Formatted string with sample info
    """
    return f"""
**Image:** {sample['image_name']}
**Ground Truth:** {sample['ground_truth']}
**Patient Info:** {sample['patient_age']} years old, {sample['patient_gender']}
**View:** {sample['view_position']}
**Primary Disease:** {sample['primary_disease']}
"""

def parse_ground_truth_labels(ground_truth_str):
    """
    Parse ground truth labels string into list
    
    Args:
        ground_truth_str: String like "Cardiomegaly|Effusion" or "No Finding"
        
    Returns:
        List of disease labels
    """
    if ground_truth_str == "No Finding":
        return ["No Finding"]
    
    return ground_truth_str.split("|")

def compare_predictions_with_ground_truth(predicted_diseases, ground_truth_str):
    """
    Compare AI predictions with ground truth
    
    Args:
        predicted_diseases: List of predicted diseases from AI model
        ground_truth_str: Ground truth string from dataset
        
    Returns:
        Dictionary with comparison results
    """
    ground_truth_labels = parse_ground_truth_labels(ground_truth_str)
    predicted_labels = [d['disease'] for d in predicted_diseases]
    
    # Find matches
    matches = []
    for pred in predicted_labels:
        if pred in ground_truth_labels:
            matches.append(pred)
    
    # Find missed diseases (in ground truth but not predicted)
    missed = []
    for gt in ground_truth_labels:
        if gt not in predicted_labels and gt != "No Finding":
            missed.append(gt)
    
    # Find false positives (predicted but not in ground truth)
    false_positives = []
    for pred in predicted_labels:
        if pred not in ground_truth_labels:
            false_positives.append(pred)
    
    return {
        'matches': matches,
        'missed': missed, 
        'false_positives': false_positives,
        'ground_truth': ground_truth_labels,
        'predicted': predicted_labels
    }