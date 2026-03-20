import { google } from 'googleapis'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const query = getQuery(event)
  const code = query.code as string
  const error = query.error as string

  if (error) {
    throw createError({
      statusCode: 400,
      statusMessage: `Google OAuth error: ${error}`
    })
  }

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing authorization code'
    })
  }

  const oauth2Client = new google.auth.OAuth2(
    config.googleClientId as string,
    config.googleClientSecret as string,
    config.googleRedirectUri as string
  )

  const { tokens } = await oauth2Client.getToken(code)

  if (!tokens.refresh_token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Không nhận được refresh_token. Vui lòng revoke quyền và thử lại.'
    })
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Google OAuth Setup - Nhat Nam Manager</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    .success { background: #d1fae5; border: 1px solid #059669; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .error { background: #fee2e2; border: 1px solid #dc2626; padding: 20px; border-radius: 8px; }
    h1 { color: #1f2937; }
    code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; word-break: break-all; }
    .token-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0; }
    .copy-btn { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; }
    .copy-btn:hover { background: #2563eb; }
    .instructions { background: #fffbeb; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-top: 20px; }
    pre { background: #1f2937; color: #e5e7eb; padding: 15px; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>🎉 Google OAuth Setup Thành Công!</h1>
  
  <div class="success">
    <strong>Refresh Token đã được lấy thành công!</strong>
    <p>Copy token bên dưới và thêm vào file <code>.env</code></p>
  </div>

  <div class="token-box">
    <label><strong>GOOGLE_REFRESH_TOKEN:</strong></label><br><br>
    <code id="token">${tokens.refresh_token}</code><br><br>
    <button class="copy-btn" onclick="copyToken()">📋 Copy Token</button>
  </div>

  <div class="instructions">
    <strong>📝 Hướng dẫn:</strong>
    <ol>
      <li>Mở file <code>.env</code> trong thư mục gốc của dự án</li>
      <li>Thêm hoặc cập nhật dòng sau:</li>
    </ol>
    <pre>GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}</pre>
    <ol start="3">
      <li>Khởi động lại server để áp dụng thay đổi</li>
    </ol>
  </div>

  <script>
    function copyToken() {
      const token = document.getElementById('token').textContent;
      navigator.clipboard.writeText(token).then(() => {
        alert('Đã copy token!');
      });
    }
  </script>
</body>
</html>
  `

  setHeader(event, 'Content-Type', 'text/html')
  return html
})
