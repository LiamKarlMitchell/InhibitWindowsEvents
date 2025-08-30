# PowerShell script to set up port forwarding for WSL2 development
# Run this script as Administrator on Windows

param(
    [string]$WSLDistro = "Ubuntu-AI",
    [int[]]$Ports = @(9833, 9834),
    [switch]$Remove,
    [switch]$List,
    [switch]$Help
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Cyan"
    White = "White"
}

function Write-ColorText {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Colors[$Color]
}

function Show-Help {
    Write-ColorText "=== WSL2 Port Forwarding Setup Script ===" "Blue"
    Write-Host ""
    Write-ColorText "Usage:" "Yellow"
    Write-Host "  .\setup-port-forwarding.ps1 [OPTIONS]"
    Write-Host ""
    Write-ColorText "Parameters:" "Yellow"
    Write-Host "  -WSLDistro <name>    WSL distribution name (default: Ubuntu-AI)"
    Write-Host "  -Ports <array>       Ports to forward (default: 9833,9834)"
    Write-Host "  -Remove             Remove existing port forwarding rules"
    Write-Host "  -List               List existing port proxy rules"
    Write-Host "  -Help               Show this help message"
    Write-Host ""
    Write-ColorText "Examples:" "Yellow"
    Write-Host "  .\setup-port-forwarding.ps1"
    Write-Host "  .\setup-port-forwarding.ps1 -Ports 9833,9834,3000"
    Write-Host "  .\setup-port-forwarding.ps1 -Remove"
    Write-Host "  .\setup-port-forwarding.ps1 -List"
    Write-Host ""
    Write-ColorText "Note: This script must be run as Administrator" "Red"
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-WSLIPAddress {
    param([string]$DistroName)
    
    try {
        Write-ColorText "Getting IP address for WSL distribution: $DistroName..." "Blue"
        $wslIP = wsl -d $DistroName -- ip addr show eth0 | Select-String "inet\s" | ForEach-Object {
            ($_.ToString().Split()[1]).Split('/')[0]
        } | Select-Object -First 1
        
        if ($wslIP) {
            Write-ColorText "Found WSL IP: $wslIP" "Green"
            return $wslIP
        } else {
            throw "Could not find IP address"
        }
    } catch {
        Write-ColorText "Error getting WSL IP address: $($_.Exception.Message)" "Red"
        Write-ColorText "Make sure WSL distribution '$DistroName' is running" "Yellow"
        return $null
    }
}

function Remove-PortForwarding {
    param([int[]]$PortList)
    
    Write-ColorText "Removing existing port forwarding rules..." "Blue"
    
    foreach ($port in $PortList) {
        try {
            $result = netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-ColorText "✓ Removed port forwarding for port $port" "Green"
            } else {
                Write-ColorText "! No existing rule found for port $port" "Yellow"
            }
        } catch {
                Write-ColorText "Error removing port $port: $($_.Exception.Message)" "Red"
        }
    }
}

function Add-PortForwarding {
    param([int[]]$PortList, [string]$WSLIPAddress)
    
    Write-ColorText "Adding port forwarding rules..." "Blue"
    
    foreach ($port in $PortList) {
        try {
            Write-ColorText "Setting up port forwarding: 0.0.0.0:$port -> $WSLIPAddress`:$port" "Blue"
            $result = netsh interface portproxy add v4tov4 listenport=$port listenaddress=0.0.0.0 connectport=$port connectaddress=$WSLIPAddress 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-ColorText "✓ Added port forwarding for port $port" "Green"
            } else {
                Write-ColorText "Error adding port $port`: $result" "Red"
            }
        } catch {
                Write-ColorText "Error adding port $port: $($_.Exception.Message)" "Red"
        }
    }
}

function Show-PortProxy {
    Write-ColorText "Current port proxy rules:" "Blue"
    try {
        $rules = netsh interface portproxy show all
        if ($rules -match "Listen on") {
            $rules | ForEach-Object { Write-Host $_ }
        } else {
            Write-ColorText "No port proxy rules found" "Yellow"
        }
    } catch {
        Write-ColorText "Error listing port proxy rules: $($_.Exception.Message)" "Red"
    }
}

# Main script execution
if ($Help) {
    Show-Help
    exit 0
}

Write-ColorText "=== WSL2 Port Forwarding Setup ===" "Blue"
Write-Host ""

# Check if running as Administrator
if (-not (Test-Administrator)) {
    Write-ColorText "ERROR: This script must be run as Administrator!" "Red"
    Write-ColorText "Please right-click PowerShell and select 'Run as Administrator'" "Yellow"
    exit 1
}

# List existing rules if requested
if ($List) {
    Show-PortProxy
    exit 0
}

# Remove existing rules if requested
if ($Remove) {
    Remove-PortForwarding -PortList $Ports
    Write-ColorText "Port forwarding removal completed!" "Green"
    exit 0
}

# Get WSL IP address
$wslIP = Get-WSLIPAddress -DistroName $WSLDistro
if (-not $wslIP) {
    Write-ColorText "Failed to get WSL IP address. Exiting." "Red"
    exit 1
}

Write-Host ""
Write-ColorText "Configuration:" "Yellow"
Write-ColorText "  WSL Distribution: $WSLDistro" "White"
Write-ColorText "  WSL IP Address: $wslIP" "White"
Write-ColorText "  Ports to forward: $($Ports -join ', ')" "White"
Write-Host ""

# Remove existing rules first (to avoid conflicts)
Remove-PortForwarding -PortList $Ports

# Add new port forwarding rules
Add-PortForwarding -PortList $Ports -WSLIPAddress $wslIP

Write-Host ""
Write-ColorText "=== Port Forwarding Setup Complete! ===" "Green"
Write-Host ""

# Show current rules
Show-PortProxy

Write-Host ""
Write-ColorText "Next steps:" "Yellow"
Write-ColorText "1. Run the firewall exception script" "White"
Write-ColorText "2. Start your development server in WSL2" "White"
Write-ColorText "3. Access from Windows: http://localhost:9833" "White"