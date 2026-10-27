# AutoAudit-X: Hardware-Software Co-designed AI Agents — From Tesla Digital Key to Full Vehicle Control

**[English](README.md) | [中文](README-zh.md)**

> Black Hat Asia 2026 Briefings Whitepaper
> Topics: Application Security: Offense; AI & ML: Attack and Defense

---

## Abstract

The Tesla App is on your phone, and your car is parked outside — an AI agent-driven attack chain lets any app on your phone open and unlock your vehicle.

This paper discloses three new vulnerabilities in the Tesla App digital key ecosystem. One affects the **entire vehicle lineup**, allowing an app with zero permissions to directly control the vehicle — the owner remains completely unaware (CVE-2026-110446, acknowledged and fixed by Tesla, $1,500 Bugcrowd bounty). Another enables silent rewriting of the in-car navigation destination; the vendor refused to fix it as "expected design" — we disclose the full attack chain and real-vehicle footage for community judgment. The third was deemed a duplicate of an existing external report and not assigned a separate ID. Additionally, this method yielded **3 CVEs and 22 China CAPPVD IDs** across multiple leading automakers.

Powering this is **AutoAudit-X (AX)** — the first AI Agent team that combines software and hardware: the Agent team handles reasoning and adversarial review (reconnaissance, auditing, cross-validation with heterogeneous models to suppress false negatives); the system and hardware substrate handles observation (compiling root hiding, unpacking, method-level hooking, and TLS key export directly into Android, with a dual-track BLE research bench extending the attack surface from the app layer to the physical vehicle). When the strongest public AI Agents are helpless against hardened automotive apps, AutoAudit-X pushes the entire attack chain to the car.

**Core thesis: The next step in AI security is not just optimizing Agents — it is rebuilding system-level and hardware-level observation substrates for them.**

---

## 1. Introduction: Automotive Targets That Break AI

### 1.1 A Problem Too Hard for Both Humans and AI

The connected-vehicle attack surface spans three heterogeneous layers: the mobile app is the core control entry point with traditional mobile security weaknesses; the cloud carries authentication and business APIs as a high-value target; and the BLE digital key between app and vehicle extends the attack chain from the digital world to the physical car.

The attack chain requires all three layers to be connected: an entry point discovered at the app layer may be amplified through the cloud and ultimately land as physical control of a real vehicle via a BLE protocol flaw. But existing toolchains break at every layer:

- **App layer — invisible**: Commercial hardening (code extraction, VMP, anti-debugging, environment checks) defeats traditional dynamic analysis on injection timing, detection evasion, and stability; even after bypassing hardening, Android 7+ defaults to distrust user CAs and certificate pinning turns MITM capture into handshake failures.
- **Cloud — opaque**: Business traffic stacks multiple custom encryption layers on top of TLS; packet capture alone cannot recover protocol semantics, and server-side auth/authorization audits require full client context.
- **Vehicle — untouchable**: BLE digital key protocol analysis requires specialized hardware and a real vehicle, and implementations vary widely; manual analysis of one car can take weeks.

A failure of observation at any single link invalidates the entire attack chain.

### 1.2 The Observation Blind Spot of AI Agents

By 2026, AI Agents have moved from demos to real offense and defense: OpenAI disclosed at Black Hat USA 2026 that multiple Agents autonomously found 0days in internal evaluations and moved laterally into production; GitHub Security Lab’s seclab-taskflows used LLM Agents to find 24 vulnerabilities in Android apps.

**But these results rest on the implicit assumption that the target is observable** — no hardening, decryptable traffic, and verifiable in a software environment. Against connected vehicles, which span layers, domains, and physical targets, AI Agents have no room to operate.

Core thesis: **when the target is wrapped in commercial hardening, multiple encryption layers, and proprietary protocols, the bottleneck is not intelligence — it is observation.**

### 1.3 Our Answer

We present **AutoAudit-X (AX)** — an AI4Sec framework that deeply integrates a **multi-Agent collaborative system** with the **system-intrinsic observation engine HookLogic-X**. Unlike prior work that improves individual layers, AX combines three capabilities in one framework:

- **Observation** is handled by HookLogic-X — unpacking, method-level hooking, and key-export primitives are compiled directly into the runtime via AOSP prebuild patches and exposed upward as system interfaces;
- **Reasoning** is handled by the multi-Agent system — reconnaissance, auditing, and adversarial review run asynchronously across specialized agents with cross-validation;
- **Physical verification** is handled by the dual-track BLE research bench — protocol capture and attack interaction close the loop on a real vehicle.

Low-level observation empowers high-level agents: Agents call system interfaces at runtime, drive real devices and vehicles, and form an end-to-end audit loop from attack surface exploration to PoC output, from hardened app to physical car.

---

## 2. Core Disclosures: Three Tesla Digital Key Vulnerabilities

> This chapter contains the core results of this whitepaper. All vulnerabilities have been reported through Tesla’s official disclosure channel.

### 2.1 Vulnerability 1: Zero-Permission App Silently Controls the Vehicle (CVE-2026-110446)

A third-party app with zero permission requests can directly control the owner’s vehicle — the owner remains completely unaware.

**Scope**: Affects the entire vehicle lineup.

**Vendor response**: Tesla acknowledged the vulnerability and completed a security fix; a $1,500 bounty was awarded via Bugcrowd. The full attack chain and real-vehicle verification details will be disclosed at the conference.

### 2.2 Vulnerability 2: Silent Navigation Destination Tampering (Vendor Refused to Fix)

A full report and reproduction steps were submitted through Tesla’s official disclosure channel; the vendor classified it as “expected design behavior” and refused to fix it. We will disclose the full attack chain, real-vehicle footage, and our counter-evidence at the conference for independent community judgment.

### 2.3 Vulnerability 3: Duplicate Report (No Separate ID Assigned)

Deemed by the vendor to duplicate an existing external report; no separate ID was assigned. Described briefly.

---

## 3. Vulnerability Discovery Methodology: The AutoAudit-X Architecture

### 3.1 Overall Architecture

AX is organized into four layers — **Agent Layer**, **ROM Layer**, **Collaboration Layer**, and **Hardware Layer**:

![architecture-en](docs/architecture-en.svg)

Figure 1  AutoAudit-X overall architecture: Agent layer with ROM, collaboration, and hardware support

**Four-layer coordination**:
- **Agent Layer**: Three-agent architecture (recon / vuln_agent / verify) plus a toolkit layer, orchestrated by Brain
- **ROM Layer**: HookLogic-X compiles observation into the system to break commercial hardening
- **Collaboration Layer**: Blackboard shares artifacts and state; shared forum coordinates dynamically
- **Hardware Layer**: Test devices, BLE research bench, and network equipment provide the physical foundation

### 3.2 HookLogic-X: Compiling Observation into the System

HookLogic-X applies system-level prebuild modifications to AOSP 14 (PixelBuilds-derived, kernel msm-4.14), modifying **22 files** across **kernel VFS, ART runtime, Framework services, and BoringSSL**. The core design philosophy: **sink every capability into the ROM itself, making the attack surface part of the system**.

![Android custom ROM system-level attack/defense platform: overall architecture and attack chain](docs/rom-architecture-en.svg)

Figure 2  Android custom ROM system-level attack/defense platform: overall architecture and attack chain

#### 3.2.1 Kernel VFS Source-Level Interception (fs/namei.c, fs/readdir.c, fs/proc/array.c)

Traditional root-hiding tools (e.g., Shamiko) intercept `openat`/`stat` via syscall hooks, leaving comparable signatures in kernel memory. HookLogic-X instead modifies logic directly at **three VFS source callbacks**:

```c
// fs/namei.c — path resolution layer interception
static int filename_lookup(...) {
    if (is_hidden_path_name(name->name)) {
        putname(name);
        return -ENOENT;  // not EACCES — the file truly does not exist
    }
    ...
}
```

```c
// fs/readdir.c — directory enumeration interception (all three: filldir/filldir64/compat_filldir)
if (current_uid().val >= 10000 && namlen >= 3 && !strncmp(name, "pts", 3))
    return 0;  // skip this entry, never write it to the userspace buffer
```

```c
// fs/proc/array.c — proc status anti-debugging
if (current_uid().val >= 10000)
    seq_put_decimal_ull(m, "\nTracerPid:\t", 0);  // always 0, even when actively ptraced
```

**Why VFS source instead of syscall hooks**: Hooks themselves leave jump-instruction signatures in kernel memory and can conflict when multiple hook frameworks coexist. Filtering at the VFS source is equivalent to "the file truly does not exist" — `ENOENT` is indistinguishable from a genuinely empty path, while `EACCES` proves the file exists.

#### 3.2.2 ART Runtime Three-Phase Injector (art/runtime/pb_agent.cc, frameworks/base/core/jni/com_android_internal_os_Zygote.cpp)

Frida Server’s exposure surface (a separate process, port 27042, thread names gmain/gum-js-loop) is already catalogued by every commercial hardening product. HookLogic-X compiles the Gadget loader **directly into libart**, loading it at one of three optional phases after Zygote forks the app process:

| Phase | Trigger | Purpose |
|------|--------|------|
| `zygote` | `ZygoteHooks.postForkCommon()` | Before any app code runs, positioned before the shell decrypts dex; dumps the original dex from memory |
| `early` | After `Application.attachBaseContext()`, before `onCreate()` | Hooks cover the Application initialization path; can intercept MultiDex and dynamic loading |
| `stable` | After providers + `Application.onCreate()` (default) | **Specifically avoids shells that initialize anti-debug .so in onCreate** (libmsaoaidsec, libkadp class) — the shell’s self-check completes before the Gadget enters |

The Zygote side uses **two-stage package matching** (first proving package ownership via `app_data_dir`, then narrowing to a single process) and never injects into `system_server` or `child_zygote`, avoiding bricking.

#### 3.2.3 Framework Pine Hook Channel (frameworks/base/core/java/top/canyie/pin3/)

Pine’s Java source code (an ART-level Java method hooking framework) is **compiled directly into the boot classpath**. This means:

- Hook logic dex does not need to bundle Pine, minimizing size
- Pine classes appear as "system classes" to app processes, indistinguishable from framework classes; detectors cannot flag "app loaded a suspicious class"
- Complementary to the Gadget channel: Pine handles Java method-level hooks (argument/return tampering, stack tracing), Gadget handles native-level hooks and scripted analysis

Loading uses **safe staging**: it does not directly load `/data/user/0/<pkg>/pb/pine/hooklogic.dex` (if adb-pushed, the owner is shell/root — an executable dex in the app’s own data directory that is not owned by the app is an obvious IOC). Instead, it copies to the app’s own `runtime/load.dex` and sets it read-only, making the file attributes indistinguishable from a normal app cache.

#### 3.2.4 Conscrypt TLS Key Export (external/conscrypt/.../native_crypto.cc)

Android 7+ apps distrust user CAs by default, and certificate pinning turns MITM capture into handshake failures. Frida hooking `SSL_read/SSL_write` requires injection, and per-connection hooks have cost and stability issues at scale.

HookLogic-X takes a fourth path: **exporting TLS session keys from inside BoringSSL**:

```cpp
// external/conscrypt/common/src/jni/main/cpp/conscrypt/native_crypto.cc
static jlong NativeCrypto_SSL_CTX_new(JNIEnv* env, jclass) {
    ...
    /* add-boluo: Always register the keylog callback. The callback decides output
       based on system properties; off by default, zero overhead. No longer
       depends on the kWithJniTraceKeys compile-time switch. */
    SSL_CTX_set_keylog_callback(sslCtx.get(), debug_print_session_key);
    ...
}
```

The callback filters by property (`debug.conscrypt.sslkeylog.uid`), outputting `SSLKEY: uid=<uid> pid=<pid> pkg=<package> || <NSS keylog line>`; a single `sed` on the host yields a clean keylog file, natively supported by Wireshark.

Because nearly all Java TLS on Android converges on Conscrypt (including Java binding paths for OkHttp, Retrofit, WebView, and Cronet), **this single change covers HTTPS traffic for the vast majority of apps**.

#### 3.2.5 From "Can Hook" to "Cannot Be Detected"

These four layers of modification establish a new capability boundary where traditional approaches fail.

Magisk’s DenyList is essentially "userspace hiding userspace," bypassable by kernel-level or earlier detection. HookLogic-X intercepts at the VFS source: any app access to `su`, the `adbd` socket, or `/dev/pts/*` returns `ENOENT` — **indistinguishable from a genuinely empty path**. SELinux policy shadowing makes policy files read by tools like NativeTest match official image hashes; even the fact that a different file was opened is invisible.

Traditional unpacking (Xposed/Frida scripts dumping dex at the app layer) injects too late against shells that initialize anti-debugging at startup: the shell completes its self-check before hooks are established. HookLogic-X’s `stable` phase **waits until the shell’s self-check completes before injecting**; combined with kernel hiding (TracerPid always 0), runtime re-checks also fail. Many hardening shells initialize anti-debug natively in `Application.onCreate()`; the `zygote` phase would be immediately detected, while `stable` fully avoids this.

MITM proxies fail against Android 7+’s default distrust of user CAs and certificate pinning. Frida SSL hooking requires injection and suffers from per-connection cost and instability. HookLogic-X registers a keylog callback in Conscrypt’s `SSL_CTX_new` — **keys are exported from inside the library while ciphertext flows normally** — paired with passive capture (PCAPdroid local VPN) for offline decryption in Wireshark. Since OkHttp, Retrofit, and WebView all converge on Conscrypt, this single change covers most HTTPS traffic and also works for QUIC/HTTP3 (same SSL_CTX path).

Frida Server is a separate process with a port, thread names, and maps traces. HookLogic-X’s Gadget loader is compiled into libart, making the loading behavior itself part of ART. Pine is in the boot classpath; after hooking there is no JNI bridge, no extra thread, and no suspicious .so in maps. **The entire attack surface shifts from "userspace add-on" to "intrinsic system behavior"**, defeating detection based on file, port, and process signatures.

#### 3.2.6 System-Intrinsic Observation

The common property across these four layers: **key modifications live inside custom system source and the ART execution path, and large-scale rewriting of target method bodies is avoided.**

From the target app’s perspective:
- No `ptrace` attachment (HookLogic-X is inside ART)
- No external `.so` mapping (observation logic is compiled into boot.oat)
- No exposed control channel (data is exported via system properties/shared memory)
- Method bytecode is not modified (entry replacement is preferred over inline patching)
- `/proc/self/status` TracerPid is always 0 (kernel proc layer lies)
- `access("/system/bin/su", F_OK)` returns `ENOENT` (VFS source interception)

**This is not "stealthier Frida" — it makes observation an intrinsic system behavior.** Just as a process cannot distinguish a memory read by GC from one by a debugger, it cannot distinguish a method link performed by normal ART flow from one performed by a HookLogic-X observation point.

**Advantage**: Commercially hardened apps go from "black box" to "white box"; LLMs can directly read real business logic. This is a system-level capability that app-layer approaches (Frida/Xposed) cannot reach.

### 3.3 Three-Agent Architecture: Fusion and Isolation

![ax-agent-pipeline-en](docs/agent-workflow-en.svg)

Figure 3  AX Agent-layer workflow: from reconnaissance to verdict

#### 3.3.1 Architecture Design

AX uses a **three-agent architecture plus a toolkit layer** (see Figure 3):

**Core roles**:

- **recon (pre-reconnaissance, single instance, serial)**: Handles hardening identification → unpacking → decompilation → raw artifact persistence. **Key discipline: produce only raw material (code baseline/Manifest/resources); no attack-surface mapping, no API extraction, no IDOR scanning** — preventing recon’s erroneous conclusions from cascading to downstream workers and preventing premature conclusions from fixing worker thinking.

- **vuln_agent (elastic worker pool, 0-N)**: Each worker independently owns one component’s full audit (from reading code to producing a vulnerability report), maintaining cognitive closure.

- **verify (independent instance per component)**: Independent adversarial review.

- **toolkit (one instance paired with each worker)**: cve_scan / traffic_audit / phone_automation / ble_control act as the worker’s "hands." Workers call `toolkit.cve_scan` for CVE scanning, `toolkit.traffic_audit` for packet capture, and `toolkit.phone_automation` or `toolkit.ble_control` for physical interaction.

#### 3.3.2 Three-Layer Isolation for Adversarial Review

verify is not a "worker parrot" but an **adversarial reviewer**:

**Information isolation (blind verification)**: verify does not see the worker’s reasoning, only final evidence (PoC, packet captures, code snippets). This avoids confirmation bias from "the worker’s reasoning sounds plausible."

**Perspective isolation (multi-perspective verification)**: verify reviews from multiple independent perspectives, with the core goal of **preventing the misjudgment that "one failed attack path means the vulnerability does not exist."**

**Key design: vulnerability "existence" is decoupled from "success of this particular path."**

- **Developer perspective**: Reason as a designer: "What vulnerabilities does this component’s design pattern produce?" — rather than judging whether the worker’s finding exists, it actively enumerates **all possible vulnerability types** under the design pattern and checks what the worker missed. For example, seeing WebView + JSBridge triggers reasoning about whitelist validation, interface permissions, and token leakage rather than only re-checking the reported path.

- **Attacker perspective**: Beyond the worker’s attack path, what other angles were missed? If the worker’s PoC fails, **failure eliminates only that path, not the vulnerability hypothesis** — the attacker perspective tries different exploitation approaches (parameter changes, alternative entry points, combining weaknesses).

- **Adversarial perspective**: If told "this component is fine," what counter-evidence can I find? **"Missing evidence is not evidence of absence"** — no PoC does not mean no vulnerability; it may be an environment limitation, insufficient permissions, or a missing trigger condition. The adversarial perspective checks whether the worker’s "not exploitable" conclusion has sufficient evidence, and whether "looks like a vulnerability but the worker tried the wrong method" applies.

**Key constraints**: verify cannot reject a vulnerability for the following reasons:
- "The worker’s PoC failed" (only that path failed, not that the vulnerability does not exist)
- "A sibling call site is safe" (A being safe does not make B safe)
- "Controls exist on another path" (middleware protecting the main route does not protect internal callers)
- "I could not reproduce it" (environment/permission problems do not mean the vulnerability does not exist)

**Three-state verdicts**:
- `CONFIRMED`: A working PoC, or a complete source → control → sink → impact chain plus reachability evidence
- `RULED_OUT`: Must explicitly state "this component is safe because <specific control> at <file:line> does <what>, and it is effective on **every path** attacker-reachable"
- `OPEN_PROOF_GAP`: "Cannot confirm or rule out" is a legitimate, expected terminal state — recorded as `needs_follow_up` for subsequent audit or human review

**Advantage**: From "if the worker says no, it’s no" to "verify must prove no," dramatically reducing false negatives.

**Model isolation (heterogeneous adversarial review)**: Workers use model A (e.g., glm-5.3) while verify uses model B (e.g., deepseek-v4.1flash) — different vendors, architectures, and training data. On conflict, a third model C (e.g., kimi-k3) arbitrates. An ICLR 2026 study (arXiv:2509.17995) shows that same-family verifiers and generators share blind spots; heterogeneous models are key to suppressing consensus traps.

### 3.4 Collaboration Layer: Blackboard + Shared Forum

All agents collaborate through the **Collaboration Layer** — infrastructure beneath Brain with two complementary mechanisms:

#### 3.4.1 Blackboard: State-Driven Asynchronous Collaboration Hub

The blackboard is a classic multi-agent architecture pattern (HEARSAY-II, 1970s): **agents do not communicate directly; they monitor state changes in a shared public data space**. AX’s blackboard is the `workspace/<pkg>/` directory, and **the directory structure itself is the coverage ledger**:

```
workspace/<pkg>/
├── recon/
│   ├── manifest.xml              # artifact
│   ├── code_baseline/            # artifact
│   └── status.json               # state: { "phase": "completed", "evidence": "..." }
├── components/
│   ├── MallWebActivity/
│   │   ├── vuln_report.md        # artifact
│   │   ├── poc.har               # artifact
│   │   └── status.json           # state: { "verdict": "confirmed", "confidence": "HIGH" }
│   ├── BluetoothService/
│   │   └── status.json           # state: { "verdict": "pending", "missing_evidence": ["requires BLE connection"] }
│   └── ...
└── forum/
    ├── thread_001.md             # shared forum message
    └── ...
```

**What the blackboard actually does**:

- **State-driven**: Agents monitor specific fields on the blackboard and act autonomously when trigger conditions are met. When recon writes `code_baseline/`, a vuln_agent listener fires and starts auditing; when a vuln_agent writes `verdict: confirmed` to `status.json`, a verify listener fires and starts review. **Agents decide whether to act without explicit Brain scheduling.**

- **Token savings**: Each agent subscribes only to fields it cares about (e.g., vuln_agent subscribes only to the `verdict` field in `components/*/status.json`), avoiding loading full message history. Compared with an orchestrator-worker architecture, the blackboard saves roughly 59% token consumption.

- **Failure-domain isolation**: If one worker crashes, others can restore the scene from the blackboard and continue. The blackboard is the single persistent store; even if Brain restarts, no state is lost.

- **Knowledge accumulation**: The blackboard is the persistent store across apps and audit cycles; the temporal knowledge graph extracts vulnerability patterns from it (whitelist bypass, JSBridge leakage, BLE protocol flaws, and 20+ other classes).

**Each component directory’s `status.json` is a coverage ledger entry**:
- `confirmed`: A working PoC, or a complete source → control → sink → impact chain plus reachability evidence
- `pending`: Must list missing evidence ("requires a real account," "requires a BLE connection," "requires root")
- `refuted`: Must explicitly state "this component is safe because <specific control> at <file:line> does <what>, and it is effective on every attacker-reachable path"
- `not_applicable`: Must state why it does not apply ("the component is not exported," "the protocol is not enabled")
- `needs_follow_up`: "Cannot confirm or rule out" is a legitimate, expected terminal state, handed to subsequent audit or human review

**Key constraint**: "Missing evidence is not evidence of absence" — failure to find a PoC does not mean no vulnerability; it may be an environment limitation, insufficient permission, or a missing trigger condition.

#### 3.4.2 Shared Forum: Message-Driven Active Coordination

The shared forum is an **active coordination mechanism** among agents, following **contractualized tool invocation** (agents treat peers as "tools with explicit inputs and outputs," not "long-term unstructured peers"):

- **Clue broadcast**: When vuln_agent_1 discovers "this app’s WebView whitelist uses contains matching," it writes to `forum/thread_001.md`; other workers check whether their components share the pattern
- **Help coordination**: If vuln_agent_2 needs BLE protocol analysis but lacks ble_control permission, it posts a help request; Brain coordinates a worker or toolkit instance with permission
- **Counter-evidence sharing**: When verify finds a class of false positives, it broadcasts the pattern ("this whitelist check appears bypassable but has a second validation layer"), preventing other workers from repeating the mistake

**Forum messages are stored in `workspace/<pkg>/forum/`**, sharing storage with blackboard artifacts; no separate message queue is needed.

**Relation to the blackboard**: The blackboard is **state-driven** (agents listen for state changes and are passively triggered); the shared forum is **message-driven** (agents actively publish messages to seek help or share clues). The blackboard answers "when to act"; the forum answers "who to find when problems arise."

**Relation to tiered reporting**: Tiered reporting is **upward** (Agent → Brain); the shared forum is **lateral** (Agent ↔ Agent). Both live in the collaboration layer — tiered reports write to component `status.json`, forum messages write to `forum/`.

**Tiered reporting protocol** (all agents must comply, to avoid "free-form output causing comprehension drift"):
- recon must report Phase/Status/Evidence/Blocker
- vuln_agent must report Component/Confidence/Evidence/Limits
- verify must report Verdict/Confidence/Counter_Evidence

**Confidence is the only mandatory cross-role field** — it propagates through recon → vuln_agent → verify, and Brain uses it for resource scheduling decisions.

Additionally, AX uses a **temporal knowledge graph** to accumulate vulnerability patterns across apps and audit cycles (whitelist bypass, JSBridge leakage, BLE protocol flaws, 20+ classes), and a **verification-driven refinement pipeline** ensures knowledge purity — only verify-PASSED conclusions enter long-term memory (Playbook); FALSE_POSITIVE cases are recorded as anti-patterns.

**Advantages**:
- **Comprehensive**: The blackboard is the ledger; every component’s audit state is trackable, avoiding "we missed an exported activity"
- **Accurate**: Three-state verdicts (confirmed/pending/refuted) give every conclusion a complete, auditable evidence chain
- **Collaborative**: The shared forum enables emergent cooperation (Anthropic 2026 experiment: collaborative swarms produced 12× the vulnerabilities of independent parallel agents)

### 3.5 BLE Research Bench: Physical-Layer Protocol Analysis

The BLE research bench is AX’s core software-hardware infrastructure, providing physical-layer protocol analysis for toolkit.ble_control. We designed a **dual-track hardware solution**: a commercial deployment for internal deep research and a personal deployment that lets Bluetooth security enthusiasts reproduce our attack chains.

#### 3.5.1 Commercial Deployment: Ellisys Capture + nRF52840 Transmit

**Ellisys Bluetooth Vanguard (capture side)**:
- **Hardware**: Professional BLE protocol analyzer, BLE 5.3 all-channel (37/38/39) simultaneous sniffing, ±1μs hardware timestamp precision, large built-in capture buffer
- **Capabilities**:
  - **Full physical-layer capture**: Not limited by connection state; captures raw RF frames for Advertising, CONNECT_IND, and Data Channel PDUs — including CRC-error frames, retransmissions, and timing deviations critical for protocol reverse engineering
  - **Protocol reverse engineering**: Captures the full connection establishment (CONNECT_IND → LL_FEATURE_REQ → LL_ENC_REQ → ...), recovering proprietary handshake sequences
  - **Timing analysis**: Precisely measures per-packet send times, detecting timing side channels (e.g., some vehicles delay responses on wrong keys)
  - **Multi-protocol alignment**: BLE / Classic / Wi-Fi time-aligned on one screen, enabling cross-protocol causal analysis (e.g., BLE unlock command → vehicle CAN wakeup)
  - **Interference validation**: Verifies attack-chain robustness under packet loss/jitter in complex RF environments (parking lots, multi-device dealerships)
- **Data output**: `.btt` capture files automatically convert to PCAPNG and write to the blackboard’s `workspace/<pkg>/ble_captures/` for offline replay during verify

**nRF52840 Dongle (transmit side)**:
- **Hardware**: Nordic nRF52840 SoC (ARM Cortex-M4F @ 64MHz, 1MB Flash, 256KB RAM), BLE 5.0 full protocol stack (Advertising/Scanning/Central/Peripheral)
- **Firmware**: Flashed with Nordic’s official NCS (nRF Connect SDK) `hci_usb` firmware, exposed to the host as a standard USB Bluetooth controller via HCI
- **Capabilities**:
  - **Active attack**: As Central, connects directly to the vehicle and sends custom GATT writes; as Peripheral, clones the vehicle’s advertisement to lure the phone app into connecting
  - **Two-role relay**: One dongle acts as Central to the car, the other as Peripheral to the phone; Bumble forwards PDUs between them, implementing an end-to-end relay
  - **Address spoofing**: Modifiable MAC address bypasses naive identity binding based on MAC whitelists
  - **Cost**: ~$10 each; the standard entry-level device for Bluetooth security research

**Why this division**: Ellisys provides the RF perspective (raw over-the-air frames, including retransmissions, timing, and signal strength); nRF52840 provides the protocol-stack perspective (post-Link-Layer PDUs). Ellisys "sees clearly," nRF52840 "hits accurately" — together they validate both physical reachability and correct protocol-layer semantics.

#### 3.5.2 Personal Deployment: Dual nRF52840 Capture + Transmit

**Hardware**: Two Nordic nRF52840 dongles, ~$10 each — the standard entry-level kit for Bluetooth security enthusiasts; a laptop completes the full attack chain.

**Role assignment**:
- **nRF52840 #1 (capture/car side)**: Acts as Observer monitoring target advertisements; switches to Central during the attack phase to connect to the vehicle
- **nRF52840 #2 (phone-lure side)**: Acts as Peripheral cloning the target vehicle’s advertisement, luring the victim’s phone app into connecting
- **Relay attack**: One dongle connects to the car, the other to the phone; Bumble forwards PDUs in the middle, implementing an end-to-end bidirectional relay

**Google Bumble protocol stack (software layer)**:
- **What**: Google’s open-source pure-Python BLE stack, fully implementing Link Layer / L2CAP / ATT / GATT / SMP
- **Why not the host OS Bluetooth stack**: Android/iOS stacks are black boxes with no fine-grained control over low-level behavior (custom advertising intervals, PDU field modification, Connection Parameter tuning, forced pairing downgrade). Bumble is pure software with complete control over every protocol field (advertisement payload, PDU header, ATT opcode, SMP pairing parameters) — a prerequisite for protocol attacks
- **Capabilities**:
  - **Scripted control**: toolkit.ble_control uses Bumble’s Python API for precise role switching (Observer ↔ Central ↔ Peripheral), scheduling advertising/scanning/connection timing at millisecond precision
  - **Protocol-field fuzzing**: Constructs malformed PDUs (illegal ATT_MTU, out-of-range GATT handle, incorrect L2CAP length) to test parsing robustness
  - **Custom pairing flows**: Bypasses standard SMP, manually controlling every Pairing Request/Response field (forcing low IO Capability to trigger Just Works, modifying Encryption Key Size to force downgrade) — key for testing KNOB-class negotiation downgrade flaws (CVE-2019-9506)
  - **Cross-platform consistency**: The same attack scripts behave identically on Android Termux, Linux USB, and macOS — validating that the attack chain is protocol-layer and host-OS independent

**Key design**: AX’s BLE attack chain is **fully decoupled from the radio/host stack** — the same attack code runs on Ellisys + nRF52840 (commercial), dual nRF52840 (personal), and even Linux BlueZ (pure software). This validates that the chain is protocol-layer in nature and hardware-independent.

#### 3.5.3 Hardware Collaboration Workflow

![ble-attack-paths-en](docs/ble-attack-paths-en.svg)

Figure 4  BLE digital key three attack paths: replay / relay / protocol flaw exploitation

Using a "BLE digital key attack" as the example, three hardware classes (Ellisys / nRF52840 / Bumble stack) collaborate. The shared reconnaissance phase produces three classes of intelligence, feeding three parallel attack paths — any one confirming the vulnerability:

(See Figure 4 for the full three-path flow)

The three paths complement each other — protocol encryption strength affects only path 1 and cannot stop paths 2 and 3.

#### 3.5.4 Relation to toolkit.ble_control

- **toolkit.ble_control is the software abstraction**: When a vuln_agent calls `toolkit.ble_control.scan()`, Bumble drives nRF52840 #1 into Observer mode
- **Self-managed hardware conflicts**: When multiple workers operate BLE hardware simultaneously, toolkit.ble_control decides to queue, retry, or switch to an idle dongle
- **Automatic Ellisys sync**: Ellisys Vanguard captures (`.btt`) automatically convert to PCAPNG and write to the blackboard’s `workspace/<pkg>/ble_captures/` for verify review

**Design constraint**: BLE antenna contention (two nRF52840s + Ellisys) is handled by toolkit.ble_control (queue/retry/switch/error); Brain performs no resource arbitration.

---

## 4. Vulnerability Results

AX has been validated at scale in authorized security research across multiple leading automakers, covering **real-vehicle attack** scenarios.

### 4.1 Tesla: 3 Vulnerabilities, 1 CVE

| ID | Vulnerability | Status |
|------|------|------|
| CVE-2026-110446 | Zero-permission app directly controls the vehicle (all lineups); owner unaware | Acknowledged and fixed by Tesla; $1,500 Bugcrowd bounty |
| (unassigned) | Silent in-car navigation destination tampering | Vendor refused to fix as "expected design"; full attack chain to be disclosed |
| (unassigned) | Third finding | Deemed duplicate of an existing external report; no separate ID assigned |

![image-20261022170931651](docs/image-20261022170931651.png)

![image-20261022171235230](docs/image-20261022171235230.png)

### 4.2 Other CVEs and CAPPVDs

- **CVE-2026-7516**, **CVE-2026-7554**: Cloud component vulnerabilities
- **22 CAPPVD IDs** (China’s national vulnerability database under MIIT, equivalent to CVE), covering multiple leading automakers and mobility platforms: #zhong, #lai, #qi, etc. (vendor names anonymized)

### 4.3 BLE Digital Key Weaknesses: Complete App-to-Vehicle Chain

**HookLogic-X** breaks hardening, giving vuln_agent the complete BLE digital key business logic. toolkit.ble_control performs protocol analysis next to a real vehicle, finding multiple protocol-layer weaknesses that enable remote vehicle control without the victim’s account.

verify independently re-reviewed with a different model and confirmed the findings were not false positives. Reproduced independently on Android BLE (nRF52840), Linux BlueZ, and macOS — **the attack chain is fully decoupled from the radio/host stack**.

(During the coordinated disclosure period, details are withheld and will be explained in detail during the meeting.)

---

## 5. Related Work and Differentiation

### 5.1 2026 AI Agent Offense and Defense

OpenAI’s autonomous GPT Agent attacks disclosed at Black Hat USA 2026, GitHub Security Lab’s seclab-taskflows (24 Android vulnerabilities), and Zhiqiang Peng’s OffByOne 2026 annual report (LLM+Agent finding nearly 1000 vulnerabilities on customized Android systems) collectively mark AI Agents’ evolution from assistive tools to autonomous vulnerability researchers.

**AX’s fundamental difference: these works assume targets are observable with existing tools; AX turns observation from an adversarial problem into a system capability via HookLogic-X.**

### 5.2 Multi-Agent Collaboration and Hallucination Suppression

Fudan’s AgentFuzz found 34 0days (including 23 CVEs) through "attacker Agent vs. target Agent" framing; PentestAgent and Strix integrate multi-agent + toolchains into penetration testing; GitHub’s seclab-taskflows proposes "decompose research into incremental steps" to improve LLM vulnerability discovery; VEXAIoT brings multi-agent frameworks to IoT exploitation.

**AX’s difference: through the three-agent architecture plus three-layer isolation and adversarial review, AX suppresses hallucination and consensus traps on long-chain tasks, reducing the false-positive rate from 40% to below 5%.**

### 5.3 Application-Layer Dynamic Instrumentation and Automated Unpacking

Frida and Xposed have long been the de facto standards for mobile dynamic analysis, but their reliance on `ptrace`, external `.so` mappings, and control channels has become a detection signature against modern hardening. FART and related work pioneered intercepting restored `CodeItem` on the `ClassLinker` path.

**HookLogic-X inherits this idea but upgrades it from a point tool to a system capability, packaged in the same substrate as method-level hooking, key export, and device-fingerprint spoofing primitives.**

### 5.4 Summary of Four Divergences

| Divergence | Mainstream | AX |
|------|----------|-----------|
| **Path** | Optimize the Agent itself (better prompts, more tools, longer context) | Observation first: compile observation into the system |
| **Capability boundary** | Root hiding, injection, hooking, and capture are point tools | System-intrinsic primitives: kernel interception, runtime injection, framework hooks, and TLS key export unified |
| **Adversarial mechanism** | Single model or same-family multi-model | Three-layer isolation: information/perspective/model + existence decoupled from path success |
| **Attack surface** | App-only audit / BLE-only analysis / cloud-only pentest | Three-layer integration: app source → cloud API → BLE protocol → physical vehicle |

---

## 6. Conclusion

In 2026, AI Agents have moved from demos to real offense and defense, yet almost all public work avoids the same question: **when the target is wrapped in commercial-grade hardening, what can AI still see?**

AX’s answer: **do not stuff AI into old tools; put AI on a substrate that can see the truth.**

HookLogic-X makes observation a system capability; the three-agent architecture makes AI accurate; hardware-software integration extends the attack surface from the app layer to the physical layer. **3 CVEs (including Tesla full-lineup silent control CVE-2026-110446), 22 CAPPVD IDs, and three BLE digital key attack paths** — these are starting points, not endpoints. When observation becomes a system capability and AI is no longer blind, the rules of connected-vehicle security are rewritten.

This represents a paradigm shift in AI-era mobile security auditing: from "expert craftsmanship" to "system-intrinsic engineering."



![IMG_1243](docs/IMG_1243.png)

## Acknowledgments

We thank the security response teams of all affected vendors for their professional handling of our reports, the AOSP, Google Bumble, Zephyr Project, Nordic NCS, and Pine open-source projects, and the Black Hat, USENIX Security, and OffByOne communities for advancing AI Agent security.
