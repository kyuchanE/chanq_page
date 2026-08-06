# ADR-0004: Use Separate Apple Silicon macOS Hosts

## Status

Accepted

## Context

Development and production run on two different physical Macs. Both machines use Apple Silicon. The previous architecture baseline assumed a self-hosted Linux production machine, which no longer matches the selected hardware.

Docker on macOS runs Linux containers through a virtualized Linux environment. Host operations, container architecture support, persistent storage, restart behavior, and recovery therefore need explicit macOS and `linux/arm64` verification even when Compose definitions remain portable.

## Decision

Use separate Apple Silicon Macs for development and production.

- The development Mac owns source changes, local PostgreSQL development data, migrations, seeds, imports, and automated verification.
- The production Mac owns the public Docker runtime, production secrets, production PostgreSQL data, operational backups, and service health.
- Run production application, PostgreSQL, Nginx, and Cloudflare Tunnel services as pinned Linux containers compatible with `linux/arm64`.
- Do not share Docker volumes, bind-mounted PostgreSQL data directories, credentials, or environment files between the two Macs.
- Require the production Docker runtime to recover after a host restart without depending on an interactive development workflow.
- Prevent unintended host sleep and verify disk capacity, Docker virtual-machine storage, clock synchronization, restart behavior, remote recovery access, and backup destinations before public launch.
- Keep Compose definitions portable where practical, but document any macOS host path, filesystem, networking, or runtime-specific behavior.

## Alternatives considered

- **Use one Mac for development and production:** rejected because development activity, restarts, local experiments, and credential exposure would directly affect the public service.
- **Keep the self-hosted Linux production target:** operationally conventional, but rejected because the selected production hardware and operating system are a dedicated Apple Silicon Mac running macOS.
- **Use an x86_64 production host:** rejected because both available hosts are Apple Silicon and adding emulation would introduce avoidable performance and compatibility risk.
- **Use a managed hosting platform immediately:** deferred because the MVP is intended to demonstrate a controlled self-hosted Docker deployment.

## Consequences

- Every production image and native dependency must be verified for `linux/arm64`.
- macOS and the Docker virtualization layer become explicit operational dependencies.
- Host restart, sleep, storage growth, Docker runtime startup, and remote recovery require production runbooks and monitoring.
- Development and production failures remain isolated at the host, credential, network, and persistent-volume boundaries.
- A future move to Linux or managed hosting requires updating the deployment topology but does not require changing application or database ownership boundaries.

## Revisit when

Revisit this decision when the macOS Docker runtime cannot meet measured availability or recovery requirements, `linux/arm64` image support blocks a required component, traffic requires multiple hosts, or a managed platform provides a clearer operational advantage.
