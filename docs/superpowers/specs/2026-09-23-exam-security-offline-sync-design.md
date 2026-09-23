# Design Spec: Exam Security, Offline Answer Sync, Lucide, and Browser Compatibility

- **Date:** 2026-09-23
- **Status:** Draft for human review
- **Scope:** Student CBT application

## 1. Goals

1. Replace hand-authored UI control icons with `lucide-react` icons.
2. Keep students on the active exam route when possible and record attempted exits.
3. Make answer saving resilient to transient network failures:
   - make at most three total request attempts for the latest answer;
   - persist the latest failed payload locally;
   - flush pending answers when connectivity returns;
   - do not submit until all pending answers are synchronized.
4. Configure and audit a practical browser target from the 2020 era.

## 2. Non-goals and browser limitations

- This is not a kiosk operating-system lock. A student may still force-quit a browser, use another device, or bypass client-side controls through external tooling.
- `beforeunload` can request native confirmation but cannot guarantee that a student remains on the page.
- Next.js 16 and React 19 officially target modern browsers. The 2020-era matrix below is a pragmatic compatibility target, not a claim of official Next.js support.
- IE 11 and Android 4 are explicitly out of scope. Supporting them would require a separate framework/toolchain migration.
- The decorative illustration in `components/WelcomeBanner.jsx` is not a control icon and remains unchanged.

## 3. Current-state findings

- `pages/exam/index.jsx` already blocks some copy, context-menu, drag, and selected keyboard shortcuts and listens for `blur`.
- The current `blur` handler calls `/api/exam/warn-exam`, but browser back/forward, reload, and internal Next.js navigation are not guarded as a single lifecycle.
- `components/Exam/QuestionSection.jsx` currently performs one direct save request per answer change. It does not retry or persist failed payloads separately.
- `store/useSavedAnswers.js` persists answers through Zustand, but it is not an offline request queue.
- `getResult` redirects to `/exam/selesai`; the security layer must explicitly allow that route after a successful submission or time expiry.
- There is no test runner script. Bun's built-in `bun:test` can test pure modules without adding a test framework dependency.

## 4. Architecture

### 4.1 Answer queue module

Create a deep module at `lib/exam/answerQueue.js`. Its external interface should remain small and keep queue mechanics out of React components:

- `enqueueAnswer(payload)` stores the latest answer for a `sheet_id + exam_soal_id` key.
- `flushAnswerQueue({ send })` attempts pending entries and resolves with the remaining queue/status.
- `getAnswerQueueState()` returns pending count and status summary.
- `subscribeAnswerQueue(listener)` lets the exam UI observe queue changes.
- `clearAnswerQueue(sheetId)` removes entries for a completed exam.
- `retryAnswerQueue()` is an explicit manual retry entry point for failed entries.

The persistent record is versioned in `localStorage`, with an entry containing the latest payload, attempt count, last error, status, and update timestamp. Replacing an answer for the same exam/question replaces the previous payload instead of appending a duplicate, and resets its retry count because the new answer is a new request to synchronize.

The queue must treat network and 5xx failures as retryable, keep the payload on terminal failure, and avoid deleting data on quota/JSON errors. A server validation error is recorded as a failed entry and is not blindly retried until the student changes the answer or explicitly retries.

The local answer store is updated immediately when the student changes an answer. Network success only confirms synchronization; it must not be the sole source of the displayed answer.

### 4.2 Answer synchronization adapter

`components/Exam/QuestionSection.jsx` calls the queue module rather than owning retry state. A small client-side synchronization hook/module owns:

- the three-attempt schedule for the latest payload;
- `online` event handling;
- a fallback interval while the page is open;
- status updates for the exam UI;
- a final flush before submission.

The first request plus two retries are the maximum. Retry delays increase slightly between attempts. The queue is processed serially per answer to prevent an older request from overwriting a newer answer.

Submission is blocked while the queue is non-empty. The UI must tell the student that answers are waiting for synchronization. When the queue is empty, the existing result endpoint can be called.

### 4.3 Exam security module/context

Add a small exam security seam, for example `components/Exam/ExamSecurityProvider.jsx` plus `lib/hooks/useExamSecurity.js`:

- The provider accepts `enabled`, `sheetId`, and warning behavior.
- It exposes `allowExit()` for the official submit/time-expiry transition.
- It owns all lifecycle listener registration and cleanup.

While an exam is active and `warnEnabled` is true:

1. `beforeunload` prevents the default action and sets `event.returnValue` for the native browser confirmation.
2. `router.beforePopState` rejects browser back/forward navigation.
3. Same-origin link/navigation interception blocks known internal exit links. `router.events` observes programmatic route changes; because a route change is already in progress, it redirects unauthorized changes back to `/exam` rather than pretending to cancel them.
4. `blur`, `visibilitychange`, and `pagehide` share a deduplicated warning function. The warning request uses the authenticated API adapter; a keepalive/fetch fallback is used only when the adapter can safely carry the existing token.
5. The existing copy/context-menu/selection protections remain in place.

`allowExit()` is called only after a successful `getResult` response or the timer-driven auto-submit. It permits only the official `/exam/selesai` transition and clears the security listeners during unmount. No generic logout or dashboard link is treated as an allowed exam exit.

The UI should show a short warning toast and the backend warning count. The backend remains the source of truth for recorded violations.

### 4.4 Lucide migration

Install `lucide-react` with Bun and use named imports. Replace UI icons in:

- `components/Login.jsx`: `Eye`, `EyeOff`.
- `components/QuestionOption.jsx`: `Check`.
- `components/Header.jsx`: `Menu`.
- `components/UserMenu.jsx`: `ChevronDown`.
- `components/Sidebar.jsx`: `X`, `LayoutDashboard`, `Link2`, and the appropriate left-panel expand/collapse icons.
- `components/Dashboard/ExamSchedule.jsx`: `ArrowLeft`, `FileText`, `Sparkles`, `Clock3`, `X`.
- `components/Dashboard/ExamPlan.jsx`: `Clock3`.
- `components/Loading.js`: `LoaderCircle` with the existing loading treatment.

Use `size`/`strokeWidth` and the current color classes. Decorative icons remain `aria-hidden`; icon-only buttons receive an Indonesian `aria-label`. Do not add an icon library for the decorative welcome illustration.

## 5. Browser compatibility

Set an explicit practical target in `package.json` for Chrome/Edge 80, Firefox 73, Safari/iOS 13, and Chrome Android 80-era browsers. Keep the target list explicit rather than relying on a broad `>= 0.1%` rule.

Audit the APIs used by the new modules:

- `beforeunload`, `popstate`, `localStorage`, `online`, `sendBeacon`, and Promise/fetch behavior;
- syntax and CSS emitted by the Next.js production build;
- unsupported API fallbacks for older browsers.

Use existing Next.js injected polyfills where available. Add only a narrowly justified polyfill if the compatibility audit proves it necessary. The design does not promise IE 11 or Android 4 support; if a 2020-era browser cannot execute the Next/React runtime, a separate toolchain decision is required.

Record the tested browser matrix and any unsupported caveat in the project documentation.

## 6. Data flow and error handling

### Answer changes

1. Update the local answer state.
2. Replace the queue entry for the question.
3. Start the three-attempt send cycle.
4. On success, remove the entry.
5. On retryable failure, retain the entry and schedule the next attempt.
6. On terminal failure, retain the entry and expose `queued`/`failed` status.
7. On `online` or next exam load, flush pending entries.

### Exam exit attempts

1. Intercept the supported lifecycle event.
2. Prepare native confirmation where the browser provides it.
3. Deduplicate and record the warning.
4. Keep the student on `/exam` where the platform permits blocking.
5. Allow navigation only through the official submit/auto-submit transition.

### Submission

1. Flush the queue.
2. If entries remain, show a sync-required message and do not submit.
3. If empty, submit using the existing result endpoint.
4. On success, allow the result route and clear exam/queue storage.
5. On submit failure, keep the exam state and do not silently discard answers.

## 7. Testing and acceptance criteria

### Automated tests

Add focused `bun:test` tests for:

- three total attempts;
- replacement/deduplication of a newer answer;
- persistence and recovery after a page reload;
- flush on the `online` event;
- retryable versus validation failures;
- queue cleanup by exam/sheet;
- allowed and blocked security routes.

Avoid testing implementation details through component internals; test the queue and security module interfaces.

### Manual/browser checks

- Password eye toggles and retains the value.
- Lucide icons render and icon-only controls remain accessible.
- Browser back, reload, close confirmation, and internal route attempts are handled as designed.
- Offline answer changes survive a reload, sync after `online`, and update the status.
- Submission remains disabled while any queue entry exists.
- Successful submission reaches `/exam/selesai` and clears queue state.
- Desktop and mobile layouts remain usable.

### Commands

- `bun run lint`
- `bun test`
- `bun run build`
- Browser smoke test against the practical 2020-era target where available.

## 8. Rollout and rollback

The changes can be implemented in independent slices: Lucide migration, queue/sync module, security context, and browser configuration. Each slice should pass lint/build. If the security guard causes false positives, disable it behind the existing `warnEnabled` flag rather than removing the data queue. Do not downgrade the existing exam state or answer store before the queue is verified.
