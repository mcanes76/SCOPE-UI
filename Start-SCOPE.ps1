# SCOPE Design Studio local, offline HTTP server (Windows PowerShell 5.1+).
# Place alongside Launch-SCOPE.bat at the ROOT of the extracted SCOPE-UI folder.
$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$studio = Join-Path $root 'design-studio\index.html'
if (-not [System.IO.File]::Exists($studio)) {
    Write-Host "ERROR: Cannot find design-studio\index.html under $root" -ForegroundColor Red
    Write-Host 'Move both launcher files into the top-level extracted SCOPE-UI directory.'
    exit 1
}

$mime = @{
    '.html' = 'text/html; charset=utf-8'; '.htm' = 'text/html; charset=utf-8';
    '.css' = 'text/css; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8';
    '.mjs' = 'text/javascript; charset=utf-8'; '.json' = 'application/json; charset=utf-8';
    '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg';
    '.svg' = 'image/svg+xml'; '.gif' = 'image/gif'; '.webp' = 'image/webp';
    '.ico' = 'image/x-icon'; '.woff' = 'font/woff'; '.woff2' = 'font/woff2';
    '.txt' = 'text/plain; charset=utf-8'; '.map' = 'application/json; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$port = $null
foreach ($candidate in 8080..8099) {
    $prefix = "http://127.0.0.1:$candidate/"
    try {
        $listener.Prefixes.Clear()
        $listener.Prefixes.Add($prefix)
        $listener.Start()
        $port = $candidate
        break
    } catch {
        if ($listener.IsListening) { $listener.Stop() }
    }
}
if ($null -eq $port) {
    Write-Host 'ERROR: Cannot start a local listener on ports 8080-8099.' -ForegroundColor Red
    Write-Host 'This computer may restrict local HTTP listeners. Contact your IT team if necessary.'
    exit 1
}
$url = "http://127.0.0.1:$port/design-studio/"
Write-Host "Serving SCOPE files from: $root" -ForegroundColor Cyan
Write-Host "Opening: $url" -ForegroundColor Green
Write-Host 'Leave this window open while presenting. Press Ctrl+C to stop.'
try { Start-Process $url } catch { Write-Host "Open this URL manually: $url" -ForegroundColor Yellow }

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $response = $ctx.Response
        try {
            $request = $ctx.Request
            if ($request.HttpMethod -ne 'GET' -and $request.HttpMethod -ne 'HEAD') {
                $response.StatusCode = 405
                $response.AddHeader('Allow', 'GET, HEAD')
                continue
            }
            $path = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
            $relative = $path.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
            if ([string]::IsNullOrEmpty($relative) -or $path.EndsWith('/')) {
                $relative = Join-Path $relative 'index.html'
            }
            $full = [System.IO.Path]::GetFullPath((Join-Path $root $relative))
            if (-not $full.StartsWith(($root.TrimEnd('\') + '\'), [System.StringComparison]::OrdinalIgnoreCase)) {
                $response.StatusCode = 403
                continue
            }
            if (-not [System.IO.File]::Exists($full)) {
                $response.StatusCode = 404
                continue
            }
            $extension = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
            if (-not $mime.ContainsKey($extension)) {
                $response.StatusCode = 403
                continue
            }
            $response.ContentType = $mime[$extension]
            $response.AddHeader('Cache-Control', 'no-store')
            $response.AddHeader('X-Content-Type-Options', 'nosniff')
            $response.StatusCode = 200
            $bytes = [System.IO.File]::ReadAllBytes($full)
            $response.ContentLength64 = $bytes.Length
            if ($request.HttpMethod -eq 'GET') {
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            }
        } catch {
            Write-Host "Request error: $($_.Exception.Message)" -ForegroundColor Yellow
            try { $response.StatusCode = 500 } catch { }
        } finally {
            try { $response.Close() } catch { }
        }
    }
} catch [System.Net.HttpListenerException] {
    Write-Host 'HTTP listener stopped.'
} finally {
    if ($listener.IsListening) { $listener.Stop() }
    $listener.Close()
}
