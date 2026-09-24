# Project architecture

The existing visual design, CSS, animations, canvas/WebGL logic, and copy are kept intact. This document describes the source structure only.

```text
src/
├── app/                         # Next.js entrypoint + global/page styles
├── components/
│   ├── providers/              # application-wide client providers
│   ├── scenes/                 # WebGL scenes and scene-specific runtime
│   │   ├── Hero/               # ThreeScene + config + particles + runtime
│   │   ├── Workspace/          # PcRoom + config + runtime
│   │   └── shared/             # WebGL helpers used by multiple scenes
│   ├── sections/               # normal page sections
│   │   ├── About/
│   │   └── Work/
│   └── visuals/                # self-contained canvas visuals
│       └── Cloud/
└── lib/
    └── effects/                # reusable DOM effects
```

The project intentionally does not introduce extra abstraction layers. Scene-specific code stays next to the scene that owns it; only genuinely shared WebGL helpers live in `scenes/shared`.
