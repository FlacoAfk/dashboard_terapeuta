Add-Type -AssemblyName System.Drawing

$scriptDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDirectory = Split-Path -Parent $scriptDirectory
$buildResourcesDirectory = Join-Path $frontendDirectory 'build\icons'

if (-not (Test-Path $buildResourcesDirectory)) {
    New-Item -Path $buildResourcesDirectory -ItemType Directory | Out-Null
}

$pngPath = Join-Path $buildResourcesDirectory 'icon.png'
$icoPath = Join-Path $buildResourcesDirectory 'icon.ico'

$size = 256
$bitmap = New-Object System.Drawing.Bitmap $size, $size
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.Clear([System.Drawing.Color]::Transparent)

$backgroundBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#6366F1'))
$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$backgroundRectangle = New-Object System.Drawing.RectangleF 18, 18, 220, 220
$cornerRadius = 42

$path = New-Object System.Drawing.Drawing2D.GraphicsPath
$diameter = $cornerRadius * 2

$path.AddArc($backgroundRectangle.X, $backgroundRectangle.Y, $diameter, $diameter, 180, 90)
$path.AddArc($backgroundRectangle.Right - $diameter, $backgroundRectangle.Y, $diameter, $diameter, 270, 90)
$path.AddArc($backgroundRectangle.Right - $diameter, $backgroundRectangle.Bottom - $diameter, $diameter, $diameter, 0, 90)
$path.AddArc($backgroundRectangle.X, $backgroundRectangle.Bottom - $diameter, $diameter, $diameter, 90, 90)
$path.CloseFigure()

$graphics.FillPath($backgroundBrush, $path)

$graphics.FillEllipse($whiteBrush, 17, 102, 22, 52)
$graphics.FillEllipse($whiteBrush, 217, 102, 22, 52)

$framePath = New-Object System.Drawing.Drawing2D.GraphicsPath
$framePath.AddArc(28, 74, 22, 22, 180, 90)
$framePath.AddArc(206, 74, 22, 22, 270, 90)
$framePath.AddArc(206, 134, 22, 22, 0, 90)
$framePath.AddArc(28, 134, 22, 22, 90, 90)
$framePath.CloseFigure()
$graphics.FillPath($whiteBrush, $framePath)

$leftLensBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml('#6366F1'))
$graphics.FillEllipse($leftLensBrush, 64, 96, 48, 48)
$graphics.FillEllipse($leftLensBrush, 144, 96, 48, 48)
$graphics.FillRectangle($whiteBrush, 102, 129, 52, 16)

$bitmap.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

$pngBytes = [System.IO.File]::ReadAllBytes($pngPath)
$memoryStream = New-Object System.IO.MemoryStream
$writer = New-Object System.IO.BinaryWriter($memoryStream)

$writer.Write([UInt16]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]1)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([Byte]0)
$writer.Write([UInt16]1)
$writer.Write([UInt16]32)
$writer.Write([UInt32]$pngBytes.Length)
$writer.Write([UInt32]22)
$writer.Write($pngBytes)
$writer.Flush()

[System.IO.File]::WriteAllBytes($icoPath, $memoryStream.ToArray())

$writer.Dispose()
$memoryStream.Dispose()
$framePath.Dispose()
$path.Dispose()
$leftLensBrush.Dispose()
$whiteBrush.Dispose()
$backgroundBrush.Dispose()
$graphics.Dispose()
$bitmap.Dispose()

Write-Host "Windows icons generated at $buildResourcesDirectory"