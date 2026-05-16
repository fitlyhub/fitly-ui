# AI Development Guidelines for Fitly UI

This document provides instructions and rules for AI agents (and developers) working on the `fitly-ui` project. Before making any changes or proposing new code, please read and adhere strictly to these guidelines to maintain architectural consistency.

## 1. Required Reading

- **[Frontend Architecture](./frontend-architecture.md)**: The primary document explaining the core design of the project, focusing on separating the metadata-driven "engines" from specific ERP modules.

## 2. Core Architecture Rules

You must strictly follow the folder structure and their intended purposes:

- **`src/app/`**
  - **Role:** Bootstrap, providers, global theming, and route shells. 
  - **Rule:** Do not place business logic or reusable UI components here.

- **`src/shared/`**
  - **Role:** Pure utilities, mappers, formatters, and atomic/presentational UI components (`shared/ui`).
  - **Rule:** **STRICTLY for generic code.** No business domain logic or module-specific code is allowed here.

- **`src/engines/`**
  - **Role:** Reusable renderers for dynamic content (e.g., `dynamic-form`, `dynamic-page`) and adapters for UI libraries (like Ant Design).
  - **Rule:** Engines must remain agnostic to specific ERP models. They should only process and render metadata schemas. Do not inject hardcoded business domain logic here.

- **`src/features/`**
  - **Role:** The home for specific ERP modules and domain-specific logic.
  - **Examples:** `auth` (login, session, API), `workspace` (layouts post-login like sidebar, header), and future modules like Users, Inventory, Finance, etc.
  - **Rule:** Keep feature modules isolated from each other where possible.

## 3. Coding Standards & Principles

- **Separation of Concerns (Logic vs. UI):**
  - UI components should remain as pure as possible (focused on rendering).
  - State management and business logic (Custom Hooks) should be placed close to the corresponding `engine` or `feature`.
- **Metadata-Driven Approach:**
  - Understand that the core of this app renders forms and pages dynamically based on JSON metadata from the backend.
  - Always handle metadata with versioning in mind to ensure backward compatibility as schemas evolve.
- **UI Framework:**
  - The project uses Ant Design. New UI components and dynamic engine adapters should integrate seamlessly with Ant Design patterns and components.

## 4. Instructions for AI Agents

- **Determine Scope Before Writing Code:** Always ask yourself if a new component is generic (`shared/`), part of the rendering engine (`engines/`), or business-specific (`features/`).
- **Leverage Existing Engines:** When tasked with creating forms or pages, first check if the `dynamic-form` or `dynamic-page` engines can achieve the goal via metadata rather than writing hardcoded React components.
- **Maintain Boundaries:** Do not cross-contaminate `features/` with generic UI, and do not put domain logic inside `shared/` or `engines/`.
- **File Structure:** Adhere to the skeleton already present in the repository (e.g., `src/engines/dynamic-form/DynamicFormRenderer`).
