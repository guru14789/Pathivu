# BeWell AssetIQ — Documentation Index

This `docs/` directory contains the complete planning and technical documentation for BeWell AssetIQ.

---

## Document Index

| # | File | Description |
|---|---|---|
| 01 | [Project Overview](./01-project-overview.md) | Business objectives, user roles, functional & non-functional requirements, architecture overview, production checklist, roadmap |
| 02 | [Database Schema](./02-database-schema.md) | All 17 table definitions, ER relationships, indexes, enums, migration & backup strategy |
| 03 | [Frontend Planning](./03-frontend-planning.md) | UI/UX strategy, color system, typography, component patterns, routing, state management, all pages documented |
| 04 | [Backend Architecture](./04-backend-architecture.md) | Module structure, middleware chain, JWT/RBAC, all API endpoints with request/response specs |
| 05 | [Buttons & Interactions](./05-buttons-and-interactions.md) | Every button, action, form, validation, confirmation dialog, and keyboard shortcut |
| 06 | [Security & Deployment](./06-security-and-deployment.md) | Auth flows, security headers, Docker setup, Nginx, CI/CD, backup strategy, environment variables |

---

## Quick Reference

### Default Admin Login
- **Email:** `admin@bewell.com`  
- **Password:** `password123` (change immediately after first login)

### API Base URL
- Development: `http://localhost:4000/api`
- Production: `https://app.bewell.in/api`

### Key Ports
| Service | Port |
|---|---|
| Vite Dev Server | 5173 |
| Express API | 4000 |
| PostgreSQL | 5432 |
| Redis | 6379 |

### Healthcare Theme Colors
| Name | Hex | Use |
|---|---|---|
| Primary Purple | `#682784` | CTAs, active nav, primary badges |
| Secondary Purple | `#601A7D` | Hover states, gradients |
| Medical Red | `#E81F23` | Critical faults, errors, expired |
| Health Green | `#95C223` | Active, success, resolved |
| Care Blue | `#66C3CB` | Info, calibration, neutral |
| Orange | `#EF7A19` | Warnings, expiring, medium severity |
| Grey | `#A397A6` | Placeholder, disabled, muted text |
| Black | `#1E1E1E` | Primary text |
| White | `#FCFBFC` | Backgrounds |

---

## See Also
- [README.md](../README.md) — Project overview, installation, and contribution guide
