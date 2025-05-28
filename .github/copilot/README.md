# GitHub Copilot Configuration

This directory contains configuration files for GitHub Copilot to ensure it has access to all the necessary resources even when behind a firewall.

## Files

- **firewall.yml**: Contains allowlist configuration for hosts and URLs that Copilot needs to access.
- **setup.sh**: Setup script that runs before the firewall is enabled to pre-install dependencies and download required files.
- **config.yml**: Configuration file that specifies which setup steps to run.

## Background

Copilot was previously failing with firewall rule errors when trying to connect to:
- cdn.fwupd.org (for firmware updates)
- googlechromelabs.github.io (for Chrome for Testing)
- storage.googleapis.com (for Chrome for Testing downloads)

These configurations ensure Copilot can access these resources either through the firewall allowlist or by pre-downloading them during setup.

## Modifying This Configuration

If additional resources need to be allowed or pre-downloaded, update:
- Add domains to the `allowList` section in **firewall.yml**
- Add pre-download steps in **setup.sh**