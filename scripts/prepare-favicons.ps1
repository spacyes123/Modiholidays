$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Make compact raster derivatives from the exact approved transparent logo exports.
# The crop shows the original aircraft and adjoining gold flight stroke. It does not
# redraw, recolour, or otherwise alter the approved artwork.
$root = Split-Path -Parent $PSScriptRoot
$brand = Join-Path $root 'assets/brand'
$crop = [System.Drawing.Rectangle]::new(1600, 55, 240, 190)
$sizes = @(16, 32, 48)

function Write-FaviconVariant([string] $sourcePath, [string] $variant) {
    $source = [System.Drawing.Bitmap]::new($sourcePath)
    try {
        if ($source.Width -ne 2077 -or $source.Height -ne 724) {
            throw "Approved $variant logo dimensions changed; review and update the favicon crop deliberately."
        }
        if ($source.Width -lt ($crop.X + $crop.Width) -or $source.Height -lt ($crop.Y + $crop.Height)) {
            throw "Approved $variant logo is smaller than the reviewed favicon crop."
        }

        foreach ($size in $sizes) {
            $canvas = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            try {
                $graphics = [System.Drawing.Graphics]::FromImage($canvas)
                try {
                    $graphics.Clear([System.Drawing.Color]::Transparent)
                    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
                    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
                    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                    $scale = [Math]::Min($size / $crop.Width, $size / $crop.Height)
                    $width = [Math]::Max(1, [int][Math]::Round($crop.Width * $scale))
                    $height = [Math]::Max(1, [int][Math]::Round($crop.Height * $scale))
                    $left = [int][Math]::Floor(($size - $width) / 2)
                    $top = [int][Math]::Floor(($size - $height) / 2)
                    $target = [System.Drawing.Rectangle]::new($left, $top, $width, $height)
                    $graphics.DrawImage($source, $target, $crop, [System.Drawing.GraphicsUnit]::Pixel)
                } finally {
                    $graphics.Dispose()
                }

                $path = Join-Path $brand "favicon-$variant-$size.png"
                $canvas.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
            } finally {
                $canvas.Dispose()
            }
        }

        if ($variant -eq 'light') {
          foreach ($entry in @(@{ Size = 180; Name = 'apple-touch-icon.png' }, @{ Size = 192; Name = 'pwa-icon-192.png' }, @{ Size = 512; Name = 'pwa-icon-512.png' })) {
            $canvas = [System.Drawing.Bitmap]::new($entry.Size, $entry.Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            try {
                $graphics = [System.Drawing.Graphics]::FromImage($canvas)
                try {
                    $graphics.Clear([System.Drawing.Color]::Transparent)
                    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
                    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
                    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                    $scale = [Math]::Min($entry.Size / $crop.Width, $entry.Size / $crop.Height)
                    $width = [Math]::Max(1, [int][Math]::Round($crop.Width * $scale))
                    $height = [Math]::Max(1, [int][Math]::Round($crop.Height * $scale))
                    $left = [int][Math]::Floor(($entry.Size - $width) / 2)
                    $top = [int][Math]::Floor(($entry.Size - $height) / 2)
                    $target = [System.Drawing.Rectangle]::new($left, $top, $width, $height)
                    $graphics.DrawImage($source, $target, $crop, [System.Drawing.GraphicsUnit]::Pixel)
                } finally {
                    $graphics.Dispose()
                }

                $canvas.Save((Join-Path $brand $entry.Name), [System.Drawing.Imaging.ImageFormat]::Png)
            } finally {
                $canvas.Dispose()
            }
          }
        }
    } finally {
        $source.Dispose()
    }
}

Write-FaviconVariant (Join-Path $brand 'approved/modi-holidays-logo-light-background.png') 'light'
Write-FaviconVariant (Join-Path $brand 'approved/modi-holidays-logo-dark-background.png') 'dark'

$manifest = @{
    name = 'Modi Holidays'
    short_name = 'Modi Holidays'
    start_url = '/'
    display = 'browser'
    background_color = '#FFF8F0'
    theme_color = '#55234B'
    icons = @(
        @{ src = 'pwa-icon-192.png'; sizes = '192x192'; type = 'image/png' },
        @{ src = 'pwa-icon-512.png'; sizes = '512x512'; type = 'image/png' }
    )
}
$manifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $brand 'site-v2.webmanifest') -Encoding utf8

Write-Output 'Generated light/dark tab icons and mobile bookmark icons from the approved transparent logo artwork.'
