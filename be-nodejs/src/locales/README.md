# Multi-Language Support

This backend now supports English and Vietnamese languages for API responses.

## How to Use

### 1. Via Query Parameter (Recommended)
Add `?lang=en` or `?lang=vi` to your API requests:

```
GET /api/v1/auth/profile?lang=vi
POST /api/v1/auth/authenticate?lang=en
```

### 2. Via Accept-Language Header
Set the `Accept-Language` header:

```
Accept-Language: vi-VN,vi;q=0.9,en;q=0.8
Accept-Language: en-US,en;q=0.9
```

### 3. Default Language
If no language is specified, English (`en`) will be used as default.

## Supported Languages

- **English (en)**: Default language
- **Vietnamese (vi)**: Full translation support

## Example API Responses

### English Response
```json
{
  "success": true,
  "message": "Login successful",
  "dataResponse": { ... }
}
```

### Vietnamese Response
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "dataResponse": { ... }
}
```

## Translation Keys

All messages use translation keys in the format `category.key`:

- `success.login` → "Login successful" / "Đăng nhập thành công"
- `error.invalid_credentials` → "Invalid email or password" / "Email hoặc mật khẩu không đúng"
- `error.access_token_required` → "Access token required" / "Cần access token"

## Adding New Translations

1. Add new keys to both `en/common.json` and `vi/common.json`
2. Use the key in your code: `'success.new_action'`
3. The system will automatically return the appropriate language
