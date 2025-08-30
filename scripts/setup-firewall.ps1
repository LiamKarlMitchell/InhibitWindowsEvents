# PowerShell script to set up Windows Firewall exceptions for WSL2 development
# Run this script as Administrator on Windows

param(
    [int[]]$Ports = @(9833, 9834),
    [string]$RuleName = "WSL2-DevServer",
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
    Write-ColorText "=== Windows Firewall Setup Script ===" "Blue"
    Write-Host ""
    Write-ColorText "Usage:" "Yellow"
    Write-Host "  .\setup-firewall.ps1 [OPTIONS]"
    Write-Host ""
    Write-ColorText "Parameters:" "Yellow"
    Write-Host "  -Ports <array>       Ports to allow (default: 9833,9834)"
    Write-Host "  -RuleName <name>     Firewall rule name prefix (default: WSL2-DevServer)"
    Write-Host "  -Remove             Remove firewall rules"
    Write-Host "  -List               List existing WSL2 firewall rules"
    Write-Host "  -Help               Show this help message"
    Write-Host ""
    Write-ColorText "Examples:" "Yellow"
    Write-Host "  .\setup-firewall.ps1"
    Write-Host "  .\setup-firewall.ps1 -Ports 9833,9834,3000"
    Write-Host "  .\setup-firewall.ps1 -Remove"
    Write-Host "  .\setup-firewall.ps1 -List"
    Write-Host ""
    Write-ColorText "Note: This script must be run as Administrator" "Red"
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Remove-FirewallRules {
    param([int[]]$PortList, [string]$RulePrefix)
    
    Write-ColorText "Removing existing firewall rules..." "Blue"
    
    foreach ($port in $PortList) {
        $inboundRuleName = "$RulePrefix-Inbound-$port"
        $outboundRuleName = "$RulePrefix-Outbound-$port"
        
        try {
            # Remove inbound rule
            $inboundRule = Get-NetFirewallRule -DisplayName $inboundRuleName -ErrorAction SilentlyContinue
            if ($inboundRule) {
                Remove-NetFirewallRule -DisplayName $inboundRuleName
                Write-ColorText "✓ Removed inbound rule for port $port" "Green"
            } else {
                Write-ColorText "! No existing inbound rule found for port $port" "Yellow"
            }
            
            # Remove outbound rule
            $outboundRule = Get-NetFirewallRule -DisplayName $outboundRuleName -ErrorAction SilentlyContinue
            if ($outboundRule) {
                Remove-NetFirewallRule -DisplayName $outboundRuleName
                Write-ColorText "✓ Removed outbound rule for port $port" "Green"
            } else {
                Write-ColorText "! No existing outbound rule found for port $port" "Yellow"
            }
        } catch {
            Write-ColorText "Error removing firewall rules for port $port`: $_" "Red"
        }
    }
}

function Add-FirewallRules {
    param([int[]]$PortList, [string]$RulePrefix)
    
    Write-ColorText "Adding firewall rules..." "Blue"
    
    foreach ($port in $PortList) {
        $inboundRuleName = "$RulePrefix-Inbound-$port"
        $outboundRuleName = "$RulePrefix-Outbound-$port"
        
        try {
            # Add inbound rule
            Write-ColorText "Adding inbound rule for port $port..." "Blue"
            New-NetFirewallRule -DisplayName $inboundRuleName `
                -Direction Inbound `
                -Protocol TCP `
                -LocalPort $port `
                -Action Allow `
                -Profile @("Domain", "Private", "Public") `
                -Description "Allow inbound traffic on port $port for WSL2 development server" | Out-Null
            
            Write-ColorText "✓ Added inbound rule for port $port" "Green"
            
            # Add outbound rule
            Write-ColorText "Adding outbound rule for port $port..." "Blue"
            New-NetFirewallRule -DisplayName $outboundRuleName `
                -Direction Outbound `
                -Protocol TCP `
                -LocalPort $port `
                -Action Allow `
                -Profile @("Domain", "Private", "Public") `
                -Description "Allow outbound traffic on port $port for WSL2 development server" | Out-Null
            
            Write-ColorText "✓ Added outbound rule for port $port" "Green"
            
        } catch {
            Write-ColorText "Error adding firewall rules for port $port`: $_" "Red"
        }
    }
}

function Show-FirewallRules {
    param([string]$RulePrefix)
    
    Write-ColorText "Current WSL2 development firewall rules:" "Blue"
    try {
        $rules = Get-NetFirewallRule | Where-Object { $_.DisplayName -like "$RulePrefix*" }
        
        if ($rules.Count -gt 0) {
            $rules | ForEach-Object {
                $portInfo = Get-NetFirewallPortFilter -AssociatedNetFirewallRule $_
                $status = if ($_.Enabled) { "Enabled" } else { "Disabled" }
                Write-ColorText "  $($_.DisplayName) - $($_.Direction) TCP:$($portInfo.LocalPort) [$status]" "White"
            }
        } else {
            Write-ColorText "No WSL2 development firewall rules found" "Yellow"
        }
    } catch {
        Write-ColorText "Error listing firewall rules: $_" "Red"
    }
}

function Test-FirewallRules {
    param([int[]]$PortList, [string]$RulePrefix)
    
    Write-ColorText "Testing firewall configuration..." "Blue"
    
    foreach ($port in $PortList) {
        $inboundRuleName = "$RulePrefix-Inbound-$port"
        $outboundRuleName = "$RulePrefix-Outbound-$port"
        
        $inboundRule = Get-NetFirewallRule -DisplayName $inboundRuleName -ErrorAction SilentlyContinue
        $outboundRule = Get-NetFirewallRule -DisplayName $outboundRuleName -ErrorAction SilentlyContinue
        
        if ($inboundRule -and $outboundRule) {
            if ($inboundRule.Enabled -and $outboundRule.Enabled) {
                Write-ColorText "✓ Port $port is properly configured and enabled" "Green"
            } else {
                Write-ColorText "! Port $port rules exist but are disabled" "Yellow"
            }
        } else {
            Write-ColorText "✗ Port $port is missing firewall rules" "Red"
        }
    }
}

# Main script execution
if ($Help) {
    Show-Help
    exit 0
}

Write-ColorText "=== Windows Firewall Setup for WSL2 Development ===" "Blue"
Write-Host ""

# Check if running as Administrator
if (-not (Test-Administrator)) {
    Write-ColorText "ERROR: This script must be run as Administrator!" "Red"
    Write-ColorText "Please right-click PowerShell and select 'Run as Administrator'" "Yellow"
    exit 1
}

# List existing rules if requested
if ($List) {
    Show-FirewallRules -RulePrefix $RuleName
    exit 0
}

# Remove existing rules if requested
if ($Remove) {
    Remove-FirewallRules -PortList $Ports -RulePrefix $RuleName
    Write-ColorText "Firewall rule removal completed!" "Green"
    exit 0
}

Write-ColorText "Configuration:" "Yellow"
Write-ColorText "  Rule Name Prefix: $RuleName" "White"
Write-ColorText "  Ports to configure: $($Ports -join ', ')" "White"
Write-ColorText "  Profiles: Domain, Private, Public" "White"
Write-Host ""

# Remove existing rules first (to avoid conflicts)
Remove-FirewallRules -PortList $Ports -RulePrefix $RuleName

# Add new firewall rules
Add-FirewallRules -PortList $Ports -RulePrefix $RuleName

Write-Host ""
Write-ColorText "=== Firewall Setup Complete! ===" "Green"
Write-Host ""

# Test configuration
Test-FirewallRules -PortList $Ports -RulePrefix $RuleName

Write-Host ""
Write-ColorText "Current firewall rules:" "Yellow"
Show-FirewallRules -RulePrefix $RuleName

Write-Host ""
Write-ColorText "Next steps:" "Yellow"
Write-ColorText "1. Ports $($Ports -join ', ') are now allowed through Windows Firewall" "White"
Write-ColorText "2. Start your WSL2 development server" "White"
Write-ColorText "3. Access from any device on your network: http://YOUR_WINDOWS_IP:9833" "White"