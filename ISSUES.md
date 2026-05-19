# Tutor Onboarding — Issues & Optimization

## Performance Issues

## Logic/Bug Issues

## UI/UX Issues

---

## Completed Work (Archive)
- **[P0-Critical] Backend local compilation failure (Java 21 target)**
  - **Resolution**: Changed the target Java version from `21` to `17` in `pom.xml` to match the local OpenJDK 17 installation. Verified the backend builds successfully with `mvnw compile`.
- **[P0-Critical] Test compilation failure (getFirst method not found)**
  - **Resolution**: Replaced Java 21's `.getFirst()` Sequenced Collections list method with Java 17 compatible `.get(0)` calls in `TutorRepositoryTest`, `ChatServiceTest`, and `OnlineSessionServiceTest`. Verified that all 105 tests build and pass successfully.
- **[P1-High] ESLint error in useOnboarding.ts**
  - **Resolution**: Refactored the `useOnboarding` hook to dynamically compute the `isTourVisible` state in render phase, removing synchronous `setState` updates from the `useEffect` body. Resolved all lint errors.
- **[P1-High] Avoid unnecessary re-renders or state changes during page transitions**
  - **Resolution**: Cleaned up the effect to run only when needed and avoided redundant renders using derived state.
- **[P2-Medium] Verify overlay positioning and z-index overlap**
  - **Resolution**: Verified that the spotlight overlay has a `z-index` of 998 and the tour step card has a `z-index` of 999, ensuring it remains on top of all other page elements.
