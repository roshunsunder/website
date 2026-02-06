# Bloomberg LP
I'm part of a small engineering team building enterprise trading workflow solutions for sell-side institutions. Most recently, I spent the past year leading the development of a next-generation inquiry management blotter that's being integrated into Bloomberg's Trade Order Management Solution (TOMS).
This project required architecting a multi-tenant system from scratch to handle real-time data ingestion from four different sources, normalize and process high-volume streams, and render them in a performant and fast UI. The stack is primarily C++ microservices with a TypeScript frontend, all designed to scale beyond our previous user loads while maintaining sub-second responsiveness.

Beyond feature development, I've focused heavily on infrastructure and reliability. I modernized our build pipeline by migrating legacy manual processes to CMake and establishing automated CI/CD workflows, which became the standard for all new applications on the team. More recently, I've been implementing comprehensive observability; designing metrics collection, instrumenting distributed tracing, and building monitoring dashboards to support production operations ahead of our Q1 client release.

The work involves constant collaboration with product teams to translate complex trading workflows into technical requirements, architectural decision-making around scalability and performance, and hands-on implementation across the entire stack—from database migrations to UI components.

I also worked at Bloomberg as an intern. I worked on a low-level systems problem involving Bloomberg's high-performance stackful coroutine library. The existing distributed tracing framework relied on thread-local storage to track spans, which broke down when coroutines could migrate between threads mid-execution, causing traces to become incoherent or lost entirely.

I investigated whether coroutines could maintain their own "virtual" thread-local storage. This required reverse-engineering glibc's TLS implementation through extensive GDB sessions, understanding how the dynamic loader manages TLS blocks, and identifying the register manipulation needed (FS on Linux, GS on Windows) to redirect TLS access. By the end of the internship, I had a working prototype that used an internal dynamic loader API and custom syscalls at coroutine context-switch boundaries to maintain correct TLS state per coroutine.

At the time, this made the coroutine library the first of its kind with this functionality.

---
# Sparkmate
Co-founded and built a real-time video matchmaking application as solo technical lead. Designed the full system architecture and implemented the entire stack—Node.js backend, React Native mobile app, and WebRTC streaming infrastructure. Developed a nearest-neighbors matching algorithm that paired users for live video chats based on onboarding preferences, designed to improve over time as user interaction data accumulated. Owned all technical decisions around architecture, streaming protocols, and deployment strategy to enable rapid product iteration.

---
# Cedar
As an intern, I built an end-to-end feature exposing medical bill collections data within patient payment workflows. Designed database schema, implemented Django REST APIs, and built frontend components to surface collections visibility to Cedar's 25M+ user base. Delivered production-ready code in a high-scale monorepo environment with tight product iteration cycles.