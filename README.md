<p align="center">
  <a href="docs/index.md">
    <picture>
      <source srcset="docs/images/PyPNM-WebUI-dark.png" media="(prefers-color-scheme: dark)" />
      <img src="docs/images/PyPNM-WebUI-light.png" alt="PyPNM WebUI" width="240" style="border-radius: 24px;" />
    </picture>
  </a>
</p>

# PyPNM-CMTS-WebUI

[![PyPNM-WebUI Version](https://img.shields.io/github/v/tag/PyPNMApps/PyPNM-WebUI?label=PyPNM-WebUI&sort=semver)](https://github.com/PyPNMApps/PyPNM-WebUI/tags)
[![Ubuntu Checks](https://github.com/PyPNMApps/PyPNM-WebUI/actions/workflows/ubuntu-checks.yml/badge.svg?branch=main)](https://github.com/PyPNMApps/PyPNM-WebUI/actions/workflows/ubuntu-checks.yml)
[![Ubuntu PyPNM Integration](https://github.com/PyPNMApps/PyPNM-WebUI/actions/workflows/ubuntu-pypnm-integration.yml/badge.svg?branch=main)](https://github.com/PyPNMApps/PyPNM-WebUI/actions/workflows/ubuntu-pypnm-integration.yml)
![CodeQL](https://github.com/PyPNMApps/PyPNM-WebUI/actions/workflows/codeql.yml/badge.svg)
[![Docs Publish](https://github.com/PyPNMApps/PyPNM-WebUI/actions/workflows/publish-mkdocs.yml/badge.svg?branch=main)](https://github.com/PyPNMApps/PyPNM-WebUI/actions/workflows/publish-mkdocs.yml)
[![Node](https://img.shields.io/badge/Node-%E2%89%A520.19.0-339933?logo=node.js&logoColor=white)](https://github.com/PyPNMApps/PyPNM-WebUI)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Ubuntu](https://img.shields.io/badge/Ubuntu-22.04%20%7C%2024.04%20LTS-E95420?logo=ubuntu&logoColor=white)](https://github.com/PyPNMApps/PyPNM-WebUI)

Frontend-only web client for CMTS-facing REST APIs.

## Source structure

- `src/pcw`: CMTS-specific workflows, pages, and services
- `src/pw`: PW-derived shared explorer/analysis/capture modules
- `src/components/common`: shared UI primitives
- `src/services`: shared infra services (HTTP, health, files, etc.)

## Requirements

- Linux, validated on:
  - Ubuntu 22.04 LTS
  - Ubuntu 24.04 LTS

Other modern Linux distributions may work but are not yet part of the test matrix.

## Minimum shell dependencies

From a fresh system, install Git:

```bash
sudo apt-get update
sudo apt-get install -y git
```

## Get PyPNM-CMTS-WebUI

```bash
git clone https://github.com/PyPNMApps/PyPNM-CMTS-WebUI.git
cd PyPNM-CMTS-WebUI
```

## Install

```bash
./install.sh
```

Same-machine WebUI + `pypnm-docsis` install:

```bash
./install.sh --with-pypnm-docsis
```

Install Python development tooling (docs/release helpers) into `.venv`:

```bash
./install.sh --development
```

On Ubuntu/Debian, `install.sh` may prompt for sudo to install missing Python
venv packages required by `--development` or `--with-pypnm-docsis`.

Reset local install artifacts for a clean reinstall:

```bash
./uninstall.sh --confirm-uninstall
```

## Run locally

```bash
pypnm-cmts-webui serve
```

Start same-machine backend (PyPNM) + frontend from the normal serve flow:

```bash
pypnm-cmts-webui serve --start-local-pypnm-docsis
```

Default local URL:
- `http://127.0.0.1:4175`

CLI help:

```bash
pypnm-cmts-webui --help
pypnm-cmts-webui serve --help
pypnm-cmts-webui config-menu --help
pypnm-cmts-webui kill-pypnm-webui --help
```

## User docs

- [Documentation Index](docs/index.md)
- [Getting Started](docs/user/getting-started.md)
- [Install And Bootstrap](docs/user/install-and-bootstrap.md)
- [Runtime Configuration](docs/user/runtime-configuration.md)
- [Serving Group RxMER](docs/user/serving-group-rxmer.md)
- [Troubleshooting](docs/user/troubleshooting.md)

## Development docs

- [Development Workflow](docs/development/workflow.md)
- [CI Workflows](docs/development/ci-workflows.md)
