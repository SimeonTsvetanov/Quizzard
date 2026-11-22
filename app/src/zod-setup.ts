// The FIRST import of main.ts (engineering → frontend-level1 §5): Zod 4 decides at schema-creation
// time whether to compile parsers with `new Function`, which the meta CSP blocks — the probe alone
// raises a `script-src` violation. Mini-app chunks that bring Zod (TeamSync's core) create their
// schemas when they load, long after this ran, and share this one Zod instance (one version in the
// lockfile), so jitless covers them too (PLAN T-10).
import { config } from "zod";

config({ jitless: true });
