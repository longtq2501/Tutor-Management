# Tutor Onboarding — Issues & Optimization

## Performance Issues

## Logic/Bug Issues

## UI/UX Issues

---

## Completed Work (Archive)
- **[P0-Critical] Revert to Java 21 Target & Restored getFirst()**
  - **Resolution**: Reverted the target Java version from `17` back to `21` in `pom.xml` and restored all `.getFirst()` calls. This ensures compatibility with the production build environment and deployment pipeline (which runs on JDK 21), resolving the 502 Bad Gateway / CORS errors caused by compilation failures on the GitHub Actions runner.
- **[P1-High] ESLint error in useOnboarding.ts**
  - **Resolution**: Refactored the `useOnboarding` hook to dynamically compute the `isTourVisible` state in render phase, removing synchronous `setState` updates from the `useEffect` body. Resolved all lint errors.
- **[P1-High] Avoid unnecessary re-renders or state changes during page transitions**
  - **Resolution**: Cleaned up the effect to run only when needed and avoided redundant renders using derived state.
- **[P2-Medium] Verify overlay positioning and z-index overlap**
  - **Resolution**: Verified that the spotlight overlay has a `z-index` of 998 and the tour step card has a `z-index` of 999, ensuring it remains on top of all other page elements.
