# Nginx Configuration cho PRM392-RefineXrayApp

## Tại sao cần Nginx?

**Có, bạn CẦN file nginx config khi deploy lên EC2** vì:

1. **Reverse Proxy**: Route traffic từ port 80/443 (HTTP/HTTPS) đến các services
2. **SSL/TLS Termination**: Xử lý HTTPS, giảm tải cho backend services
3. **Security**: Thêm security headers, rate limiting
4. **Load Balancing**: Phân tải khi scale services
5. **Single Entry Point**: Chỉ expose port 80/443, không cần mở nhiều port

## Cách sử dụng

### Bước 1: Copy file config

```bash
# Trên EC2 server
sudo cp nginx/nginx.conf /etc/nginx/sites-available/prm392
```

### Bước 2: Cập nhật domain

```bash
sudo nano /etc/nginx/sites-available/prm392
```

Thay `your-domain.com` bằng domain thực tế của bạn (hoặc IP nếu chưa có domain).

### Bước 3: Enable site

```bash
# Tạo symbolic link
sudo ln -s /etc/nginx/sites-available/prm392 /etc/nginx/sites-enabled/

# Xóa default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Bước 4: Cấu hình SSL (Sau khi có domain)

```bash
# Cài đặt Certbot (nếu chưa có)
sudo apt install -y certbot python3-certbot-nginx

# Cấp SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Certbot sẽ tự động:
# - Cập nhật nginx config với SSL paths
# - Uncomment các dòng SSL trong config
# - Redirect HTTP sang HTTPS
```

## Cấu trúc

```
nginx/
├── nginx.conf          # Main nginx configuration
└── README.md          # This file
```

## Các tính năng

- ✅ Reverse proxy cho API Gateway (port 8080)
- ✅ Reverse proxy cho Web App (port 3000)
- ✅ WebSocket support
- ✅ SSL/TLS ready (với Let's Encrypt)
- ✅ Security headers
- ✅ File upload support (100MB max)
- ✅ Long timeout cho AI processing (300s)
- ✅ Health check endpoint

## Troubleshooting

### Test nginx config

```bash
sudo nginx -t
```

### Xem logs

```bash
# Access logs
sudo tail -f /var/log/nginx/prm392_access.log

# Error logs
sudo tail -f /var/log/nginx/prm392_error.log

# Nginx error log
sudo tail -f /var/log/nginx/error.log
```

### Reload nginx

```bash
sudo systemctl reload nginx
# hoặc
sudo nginx -s reload
```

### Kiểm tra services đang chạy

```bash
# Kiểm tra API Gateway
curl http://localhost:8080/health

# Kiểm tra Web App
curl http://localhost:3000
```

## Lưu ý

1. **Trước khi có SSL**: Comment dòng redirect HTTP → HTTPS trong block `server` port 80
2. **Sau khi có SSL**: Uncomment dòng redirect và các SSL settings
3. **Security Group**: Chỉ cần mở port 22, 80, 443 trên EC2
4. **Domain**: Cần cấu hình DNS A record trỏ về EC2 IP trước khi cấp SSL

## Không dùng Nginx?

Nếu không dùng Nginx, bạn có thể:
- Truy cập trực tiếp: `http://your-ec2-ip:3000` (Web App)
- Truy cập trực tiếp: `http://your-ec2-ip:8080` (API Gateway)

**Nhưng không khuyến nghị** vì:
- Không có SSL/HTTPS
- Phải mở nhiều port trên Security Group
- Không có security headers
- Khó scale và maintain

