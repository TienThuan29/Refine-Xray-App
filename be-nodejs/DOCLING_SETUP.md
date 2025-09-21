# Docling Setup Guide

Hướng dẫn cài đặt và sử dụng Docling để chuyển đổi PDF sang Markdown.

## Yêu cầu hệ thống

- Python 3.8 hoặc cao hơn
- pip (Python package manager)
- Node.js 16.0.0 hoặc cao hơn

## Cài đặt

### 1. Cài đặt Python dependencies

#### Trên Windows (Nếu gặp lỗi pip):
```bash
cd be-nodejs/scripts
fix-pip-and-install.bat
```

#### Trên Windows (Cách thông thường):
```bash
cd be-nodejs/scripts
setup-python-deps.bat
```

#### Trên Linux/macOS:
```bash
cd be-nodejs/scripts
chmod +x setup-python-deps.sh
./setup-python-deps.sh
```

#### Hoặc cài đặt thủ công:
```bash
pip install docling
```

### 2. Kiểm tra cài đặt

```bash
python -c "from docling.document_converter import DocumentConverter; print('Docling installed successfully!')"
```

### 3. Test Docling với file PDF

```bash
# Test cơ bản
python scripts/test-docling.py

# Test với file PDF cụ thể
python scripts/test-docling.py path/to/your/file.pdf
```

## Cách sử dụng

### API Endpoints

1. **Upload từ file path:**
   ```
   POST /report-template/upload-from-path
   Body: {
     "filePath": "/path/to/file.pdf",
     "createBy": "user_id",
     "fileName": "document.pdf"
   }
   ```

2. **Upload từ URL:**
   ```
   POST /report-template/upload-from-url
   Body: {
     "fileUrl": "https://example.com/document.pdf",
     "createBy": "user_id",
     "fileName": "document.pdf"
   }
   ```

### Các file type được hỗ trợ

- PDF (.pdf) - Sử dụng Docling
- Microsoft Word (.doc, .docx) - Sử dụng mammoth + turndown

## Troubleshooting

### Lỗi "No module named 'pip'"
- **Nguyên nhân**: pip không được cài đặt hoặc không có trong PATH
- **Giải pháp**:
  ```bash
  # Cài đặt pip
  python -m ensurepip --upgrade
  
  # Hoặc tải và cài đặt get-pip.py
  curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
  python get-pip.py
  ```

### Lỗi "Docling not installed"
- Đảm bảo Python và pip đã được cài đặt
- Chạy lại script cài đặt dependencies
- Kiểm tra Python version >= 3.8
- Thử cài đặt thủ công: `pip install docling`

### Lỗi "Python script execution timeout"
- **Nguyên nhân**: File PDF quá lớn hoặc phức tạp, Docling cần thời gian xử lý lâu
- **Giải pháp**:
  - Timeout đã được tăng lên 5 phút (300 giây)
  - Kiểm tra log để xem progress: `Processing PDF file`, `Starting PDF conversion`, etc.
  - Thử với file PDF nhỏ hơn để test
  - Kiểm tra file PDF có bị corrupt không
  - Test Docling trực tiếp: `python scripts/test-docling.py <path_to_pdf>`

### Lỗi "Failed to spawn Python process"
- Python không có trong PATH
- Kiểm tra Python installation
- Thử sử dụng `python3` thay vì `python`

### Lỗi "ModuleNotFoundError: No module named 'docling'"
- Docling chưa được cài đặt đúng cách
- Kiểm tra Python environment
- Thử cài đặt lại: `pip install docling --upgrade`

## Cấu trúc file

```
be-nodejs/
├── scripts/
│   ├── docling_converter.py      # Python script chính
│   ├── setup-python-deps.sh      # Setup script cho Linux/macOS
│   └── setup-python-deps.bat     # Setup script cho Windows
├── requirements.txt              # Python dependencies
└── src/services/
    └── reporttemplate.service.ts # Service chính với Docling integration
```

## Lợi ích của Docling

- **Chất lượng cao**: Docling tạo ra markdown chất lượng tốt hơn với formatting chính xác
- **Hỗ trợ OCR**: Có thể xử lý PDF được scan
- **Nhận dạng bảng**: Chuyển đổi bảng biểu chính xác
- **Xử lý hình ảnh**: Hỗ trợ xử lý hình ảnh trong PDF
- **Đa định dạng**: Hỗ trợ nhiều loại tài liệu khác nhau
