# Mobile ↔ Web Parity Matrix (source of truth)

This document compares **web routes** (from `client/src/App.tsx`) to **mobile screens/navigation** (from `tracklit-mobile/App.tsx` and `tracklit-mobile/src/navigation/types.ts`).

Legend:
- ✅ **Implemented**: mobile screen exists and is wired to backend where applicable
- 🟡 **Partial**: screen exists but functionality differs or is stubbed/placeholder
- ❌ **Missing**: no mobile equivalent yet
- 🚫 **Out of scope**: intentionally not targeting for “most end-user features” milestone

## Authentication / Onboarding
- **/auth**: ✅ Mobile `AuthScreen` (`tracklit-mobile/src/screens/AuthScreen.tsx`)
- **/reset-password**: ❌ Missing (web uses `AuthPage` flow)
- **/onboarding/***: 🚫 Out of scope for now (can be added later if needed)
- **/affiliate**: 🚫 Out of scope

## Home / Dashboard
- **/**, **/home**, **/dashboard**: ✅ Mobile `HomeScreen`

## Practice / Journal entry
- **/practice**: 🟡 Mobile `PracticeScreen` exists; needs parity review of all actions + scroll behavior
- **/journal-entry**: ❌ Missing (web `JournalEntryPage`)

## Tools (hub + individual tools)
- **/tools**, **/training-tools**: 🟡 Mobile has `ToolsScreen` as hub; web has richer “training-tools” page
- **/tools/stopwatch**: ✅ Mobile `StopwatchScreen`
- **/tools/start-gun**: 🟡 Mobile `StartGunScreen` exists but currently crashes for some users (Hermes `onError is not a function`)
- **/tools/journal**: ✅ Mobile `JournalScreen`
- **/tools/photo-finish**: 🟡 Mobile `PhotoFinishScreen` exists but is a simulated placeholder (no backend parity)
- **/tools/photo-finish/analysis**: ❌ Missing
- **/tools/velocity-tracker**: ✅ Mobile `VelocityTrackerScreen`
- **/tools/exercise-library**: 🟡 Mobile `ExerciseLibraryScreen` exists; parity review + feature coverage needed
- **/tools/exercise-library/add**: ❌ Missing
- **/tools/video-analysis**: ✅ Mobile `VideoAnalysisScreen` exists; parity review needed

## Programs
- **/programs**: ✅ Mobile `ProgramsScreen`
- **/programs/create**: ✅ Mobile `ProgramCreateScreen`
- **/programs/:id**: ✅ Mobile `ProgramDetailScreen`
- **/programs/:id/edit**: ❌ Missing (web program editor)
- **/programs/:id/document**: ❌ Missing
- **/programs/:id/checkout**: ❌ Missing (mobile currently shows purchase as “coming soon”)
- **/assigned-programs**: ❌ Missing
- **/assign-program/:programId**: ❌ Missing

## Meets / Results / Competition
- **/meets**: ✅ Mobile `MeetsScreen`
- **/meets/create**: ❌ Missing
- **/results**: ❌ Missing
- **/competitions**: 🚫 Web route appears commented; not targeting yet

## Social / Community / Chat
- **/feed**: ✅ Mobile `FeedScreen`
- **/feed/:id**: ✅ Mobile `FeedDetailScreen` (mobile route name `FeedPost`)
- **/connections**: ✅ Mobile `ConnectionsScreen`
- **/chats / chat overlay**: ✅ Mobile `ChatScreen` + `ChatConversationScreen`
- **/chats/channels/:id/settings**: ❌ Missing
- **/friends**: ❌ Missing
- **/conversation-detail**: ❌ Missing

## Athletes / Coaches / Rosters
- **/my-athletes**: ❌ Missing (mobile has `AthletesScreen` but not “My Athletes” parity)
- **/athletes**: ✅ Mobile `AthletesScreen`
- **/coaches**: ✅ Mobile `CoachesScreen`
- **/roster-stats**: ❌ Missing

## Clubs / Groups
- **/clubs**: ❌ Missing
- **/club/:id**: ❌ Missing
- **/club-management/:id**: ❌ Missing
- **/create-group**: ❌ Missing

## Marketplace
- **/marketplace**: ✅ Mobile `MarketplaceScreen`
- **/marketplace/create**: ❌ Missing
- **/marketplace/listings/:id**: ❌ Missing
- **/marketplace/cart**: ❌ Missing

## Subscriptions / Payments
- **/subscription**: 🟡 Mobile `SubscriptionsScreen` exists; parity review needed
- **/my-subscriptions**: ❌ Missing
- **/manage-subscription**: ❌ Missing
- **/checkout**: ❌ Missing

## Rehab
- **/rehab**: ✅ Mobile `RehabScreen`
- **/rehab/acute-muscle/hamstring**: ❌ Missing
- **/rehab/chronic-injuries/foot**: ❌ Missing

## Spikes (account)
- **/spikes**: ✅ Mobile `SpikesScreen`

## Profiles
- **/profile**: ✅ Mobile `ProfileScreen` (includes an embedded settings modal)
- **/user/:userId**: ❌ Missing (public profile view)

## AI / Video
- **/sprinthia**: ✅ Mobile `SprinthiaScreen`
- **/video-player/:id**: ❌ Missing

## Arcade / Misc
- **/arcade**: ❌ Missing

## Admin / Debug
- **/admin-panel**, **/admin-affiliate-submissions**, **/debug**, **/emergency**, **/test**: 🚫 Out of scope

---

## Highest-impact gaps to close for “most end-user features” milestone
1. Clubs/Groups (multiple missing screens)\n+2. Results + Create Meet\n+3. Marketplace listing details/cart/create listing\n+4. Subscription management + my subscriptions\n+5. Rehab sub-pages\n+6. Tools: Photo finish analysis + Exercise Library add\n+7. Program editor/document/assigned programs flows\n+

