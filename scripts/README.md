# WSL2 to Windows Development Scripts

This directory contains scripts to facilitate development workflow between WSL2 and Windows.

## Scripts Overview

### 1. `copy-to-windows.sh` (WSL2/Linux)
Copies the built Windows executable and assets to `/mnt/g/WSL/win/inhibit-windows-events/`.

**Usage:**
```bash
# Copy release build (default)
./scripts/copy-to-windows.sh

# Copy debug build
./scripts/copy-to-windows.sh debug

# Or use npm scripts
pnpm copy:win          # release build
pnpm copy:win:debug    # debug build
```

### 2. `setup-port-forwarding.ps1` (Windows PowerShell)
Sets up port forwarding from Windows to WSL2 for development servers.

**Usage (run as Administrator):**
```powershell
# Setup port forwarding with default settings
.\scripts\setup-port-forwarding.ps1

# Setup with custom ports
.\scripts\setup-port-forwarding.ps1 -Ports 9833,9834,3000

# Remove existing rules
.\scripts\setup-port-forwarding.ps1 -Remove

# List current rules
.\scripts\setup-port-forwarding.ps1 -List

# Get help
.\scripts\setup-port-forwarding.ps1 -Help
```

### 3. `setup-firewall.ps1` (Windows PowerShell)
Creates Windows Firewall exceptions for development ports.

**Usage (run as Administrator):**
```powershell
# Setup firewall rules with default settings
.\scripts\setup-firewall.ps1

# Setup with custom ports
.\scripts\setup-firewall.ps1 -Ports 9833,9834,3000

# Remove existing rules
.\scripts\setup-firewall.ps1 -Remove

# List current rules
.\scripts\setup-firewall.ps1 -List

# Get help
.\scripts\setup-firewall.ps1 -Help
```

## Development Workflow

### Initial Setup (One-time)

1. **On Windows (run PowerShell as Administrator):**
   ```powershell
   # Navigate to your project directory
   cd "G:\WSL\win\inhibit-windows-events"
   
   # Setup port forwarding
   .\scripts\setup-port-forwarding.ps1
   
   # Setup firewall rules
   .\scripts\setup-firewall.ps1
   ```

### Daily Development

1. **In WSL2:**
   ```bash
   # Build for Windows
   pnpm build:win
   
   # Copy to Windows
   pnpm copy:win
   
   # Start development server (for frontend)
   pnpm dev:win
   ```

2. **On Windows:**
   - Run the copied executable: `G:\WSL\win\inhibit-windows-events\inhibit-windows-events.exe`
   - Access frontend at: `http://localhost:9833`

## Port Configuration

- **9833**: Vite development server
- **9834**: HMR (Hot Module Replacement) websocket

These ports are configured in:
- `vite.config.ts`
- The PowerShell scripts (default values)

## Troubleshooting

### Port Forwarding Issues
```powershell
# Check current port proxy rules
netsh interface portproxy show all

# Check if WSL2 is running
wsl -l -v

# Get WSL2 IP address
wsl -- ip addr show eth0 | findstr "inet "
```

### Firewall Issues
```powershell
# Check firewall rules
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*WSL2*" }

# Test port connectivity
Test-NetConnection -ComputerName localhost -Port 9833
```

### File Copy Issues
```bash
# Check if G: drive is mounted
ls -la /mnt/g/

# Check if target directory exists
ls -la /mnt/g/WSL/win/

# Check executable exists
ls -la ./target/x86_64-pc-windows-gnu/release/inhibit-windows-events.exe
```

## Security Notes

- Port forwarding rules bind to `0.0.0.0`, making ports accessible from any network interface
- Firewall rules allow access on Domain, Private, and Public profiles
- Consider restricting access if running on untrusted networks
- Development servers should only be used for development, not production

## Advanced Usage

### Custom WSL Distribution
```powershell
.\setup-port-forwarding.ps1 -WSLDistro "Ubuntu-22.04"
```

### Additional Ports
```powershell
# Add more ports for other services
.\setup-port-forwarding.ps1 -Ports 9833,9834,3000,8080
.\setup-firewall.ps1 -Ports 9833,9834,3000,8080
```

### Automated Setup
Create a batch file to run both scripts:
```batch
@echo off
echo Setting up WSL2 development environment...
powershell -ExecutionPolicy Bypass -File "scripts\setup-port-forwarding.ps1"
powershell -ExecutionPolicy Bypass -File "scripts\setup-firewall.ps1"
echo Setup complete!
pause
```