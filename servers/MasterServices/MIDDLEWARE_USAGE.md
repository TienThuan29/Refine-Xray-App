# JWT Middleware Usage Guide

## Tổng quan
Đã tạo `JwtValidationMiddleware` để kiểm tra JWT token và ủy quyền cho các route cụ thể thay thế việc kiểm tra token thủ công trong controller.

## Cách hoạt động

### 1. Middleware được áp dụng cho route cụ thể
```csharp
// Trong Program.cs
app.MapWhen(context => 
    context.Request.Path.StartsWithSegments("/api/auth/profile") ||
    context.Request.Path.StartsWithSegments("/api/auth/users") ||
    context.Request.Path.StartsWithSegments("/api/protected"),
    appBuilder => 
    {
        appBuilder.UseJwtValidationMiddleware();
        appBuilder.UseRouting();
        appBuilder.UseEndpoints(endpoints => endpoints.MapControllers());
    });
```

### 2. Middleware kiểm tra JWT và lưu vào context
```csharp
// Trong JwtValidationMiddleware
var user = await authService.GetUserByTokenAsync(token);
context.Items["User"] = user;
context.Items["AccessToken"] = token;
```

### 3. Controller sử dụng thông tin từ context
```csharp
// Thay vì:
var accessToken = GetAccessToken();
var user = await _authService.GetUserByTokenAsync(accessToken);

// Sử dụng:
var user = HttpContext.Items["User"] as User;
var accessToken = HttpContext.Items["AccessToken"] as string;
```

## Routes được bảo vệ
- `/api/auth/profile` - Lấy thông tin profile
- `/api/auth/users` - Quản lý users (cần ADMIN/SYSTEM role)
- `/api/protected/*` - Tất cả routes trong ProtectedController

## Routes không cần authentication
- `/api/auth/login` - Đăng nhập
- `/api/auth/register` - Đăng ký
- `/api/auth/refresh` - Refresh token
- `/health` - Health check

## Lợi ích
1. **Tách biệt logic**: Authentication logic được tách ra khỏi controller
2. **Tái sử dụng**: Middleware có thể áp dụng cho nhiều route
3. **Hiệu suất**: Chỉ kiểm tra JWT cho route cần thiết
4. **Bảo trì**: Dễ dàng thay đổi logic authentication ở một nơi
5. **Clean code**: Controller chỉ tập trung vào business logic

## Cách thêm route mới
Để thêm route cần authentication, chỉ cần cập nhật điều kiện trong `MapWhen()`:

```csharp
app.MapWhen(context => 
    context.Request.Path.StartsWithSegments("/api/auth/profile") ||
    context.Request.Path.StartsWithSegments("/api/auth/users") ||
    context.Request.Path.StartsWithSegments("/api/protected") ||
    context.Request.Path.StartsWithSegments("/api/new-protected-route"), // Thêm route mới
    appBuilder => 
    {
        appBuilder.UseJwtValidationMiddleware();
        appBuilder.UseRouting();
        appBuilder.UseEndpoints(endpoints => endpoints.MapControllers());
    });
```
