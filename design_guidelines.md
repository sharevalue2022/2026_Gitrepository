# Design Guidelines: KingDate (킹데이트) - 2026 Premium Redesign

## Brand Identity

**Purpose**: Exclusive Korean dating platform connecting verified users through premium memberships and authentic profiles.

**Language**: All UI text in Korean (한국어)

**Aesthetic Direction**: Liquid Glass Minimalism (iOS 26 inspired)
- Dark gray base with black and gold accents
- Frosted glass layers with depth and transparency
- Generous whitespace creating breathing room
- Minimal visible UI controls, content-first design
- Quiet luxury through restraint and refinement

**Memorable Element**: Subtle crown glow effect for King membership status, integrated into glass layers rather than explicit iconography.

**UX Philosophy**: Predictive and agentic - the app anticipates user intent, surfaces relevant actions contextually, and minimizes deliberate navigation through intelligent content prioritization.

---

## Navigation Architecture

**Root Navigation**: Tab Navigation (3-4 tabs, contextual based on membership)

**Tab Structure**:
1. **발견** (Discover) - Active users
2. **메시지** (Messages) - Conversations
3. **킹** (King, males only) - Membership management
4. **프로필** (Profile) - Settings

**Auth Flow**: Required
- SSO: Apple Sign-In (iOS), Google Sign-In (Android)
- Post-auth: Gender selection → Profile completion → Verification (females) / Subscription (males)

**Navigation Style**:
- Minimal tab bar with icon-only indicators
- No visible screen headers by default
- Floating back buttons when needed
- Context-aware navigation (swipe gestures, predictive flows)

---

## Screen-by-Screen Specifications

### Welcome Screen (Onboarding Stack)
- **Layout**: Full-screen hero with app icon centered, tagline "의미 있는 만남이 시작되는 곳"
- **Header**: None
- **Content**: Minimal, vertically centered
- **CTA**: Single frosted glass button "시작하기" at bottom
- **Safe Area**: Bottom inset + 32px

### Gender Selection Screen
- **Layout**: Two large frosted glass cards in vertical stack
- **Content**: "남성" / "여성" cards with subtle gradient borders
- **Header**: None, minimal back button top-left
- **Safe Area**: Top inset + 48px, Bottom inset + 48px

### Discover Tab
- **Layout**: Bento grid - asymmetric, responsive layout (staggered cards, varied sizes)
- **Header**: Transparent, no visible bar, logo watermark top-center
- **Content**: Scrollable bento grid of user profile cards
  - Cards: Frosted glass background, user photo with subtle gradient overlay
  - Card info overlay: Name, age, distance (minimal text, large type)
  - Premium users: Faint gold glow on card edges
- **Empty State**: Centered illustration "근처에 활동 중인 사용자가 없습니다"
- **Safe Area**: Top = headerHeight + 48px, Bottom = tabBarHeight + 48px
- **Interaction**: Tap card to expand profile modal, swipe to skip (predictive)

### Messages Tab
- **Layout**: List of conversation cards (frosted glass)
- **Header**: None, title "메시지" integrated as first list item
- **Content**: Scrollable list
  - Each card: Avatar, name, last message preview, timestamp
  - Unread indicator: Subtle gold dot
- **Empty State**: "아직 대화가 없습니다" with illustration
- **Safe Area**: Top = insets.top + 24px, Bottom = tabBarHeight + 48px

### Chat Screen (Modal Stack)
- **Layout**: Full-screen modal, messages at bottom
- **Header**: Minimal - user avatar + name at top, back button, floating glass bar
- **Content**: Message bubbles (outgoing: black glass, incoming: dark gray glass)
- **Input**: Fixed bottom input bar (frosted glass)
- **Safe Area**: Bottom = insets.bottom + 16px

### King Membership Tab (Males Only)
- **Layout**: Bento grid dashboard - subscription status, benefits cards
- **Header**: None, title "킹 멤버십" as first grid item
- **Content**: Staggered cards showing membership perks, subscription CTA
- **CTA**: Gold-accented glass button "구독하기 ₩250,000/월"
- **Safe Area**: Top = insets.top + 48px, Bottom = tabBarHeight + 48px

### Payment Modal
- **Layout**: Centered modal, frosted glass with dark backdrop blur
- **Content**: 
  - Title "결제 방식 안내"
  - Bank account details (국민은행 placeholder)
  - Transfer instructions
  - "확인" button at bottom
- **Safe Area**: All sides 24px padding

### Profile Tab
- **Layout**: Scrollable, bento-style sections
- **Header**: None, profile photo as hero element
- **Content**:
  - Profile photo card (large, top)
  - Bio card (medium)
  - Settings grid (small cards: 프로필 수정, 로그아웃)
- **Safe Area**: Top = insets.top + 24px, Bottom = tabBarHeight + 48px

---

## Color Palette

- **Primary**: #6B5B95 (Desaturated Royal Purple)
- **Accent Gold**: #C4A875 (Muted Gold for King features)
- **Background**: #1A1A1D (Dark Charcoal)
- **Surface Dark**: #2D2D30 (Elevated surfaces)
- **Glass**: rgba(45, 45, 48, 0.6) with 20px blur
- **Text Primary**: #E8E8E8 (Off-white)
- **Text Secondary**: #9B9B9B (Medium gray)
- **Border**: rgba(255, 255, 255, 0.1)
- **Success**: #6B9B7A (Desaturated green)
- **Error**: #B37373 (Desaturated red)

---

## Typography

**Primary Font**: SF Pro (iOS) / Roboto (Android) for Korean text
**Display Font**: System font, weight hierarchy for elegance

- **Display**: Bold, 40px (onboarding)
- **Title**: SemiBold, 28px (section titles)
- **Heading**: SemiBold, 20px (card headers)
- **Body**: Regular, 17px (readable minimum)
- **Caption**: Regular, 15px (timestamps)

**Hierarchy**: Dramatic size differences, ample line-height (1.5x), generous letter-spacing for headings

---

## Visual Design

### Liquid Glass Effects
- All cards/surfaces: backdrop-filter blur (20px), semi-transparent backgrounds
- Layered depth: Multiple glass panes with offset shadows
- Subtle shadows: shadowOffset (0, 4), shadowOpacity 0.15, shadowRadius 12

### Bento Grid System
- Asymmetric responsive grid (not uniform cards)
- Varied card sizes create visual rhythm
- 16px grid gaps, 24px outer margins

### Micro-interactions
- Glass ripple effect on touch
- Smooth spring animations (damping 0.8)
- Haptic feedback on key actions
- Contextual tooltips appear on long-press

### Agentic UX
- Smart suggestions: "You might like" cards auto-surface
- Contextual actions: Send message button appears when viewing profile
- Predictive navigation: Frequent contacts prioritized

---

## Assets to Generate

**App Icon** (icon.png): Minimalist crown symbol in gold gradient on dark purple glass background - Used in device home screen

**Splash Icon** (splash-icon.png): Same crown symbol, centered - Used during app launch

**Welcome Hero** (welcome-hero.png): Abstract glass layers with subtle crown silhouette - Used on welcome screen

**Empty Discover** (empty-discover.png): Soft outline of couple silhouette, glass aesthetic - Used when no users in Discover tab

**Empty Messages** (empty-messages.png): Chat bubble outline in glass style - Used when no conversations in Messages tab

**Profile Placeholder Avatar** (avatar-placeholder.png): Geometric crown icon in frosted glass circle - Used for users without profile photo

**King Badge** (king-badge.png): Small gold crown icon with glow - Used as overlay on premium user cards

---

## Korean Text Reference
시작하기 (Get Started), 계속하기 (Continue), 남성 (Male), 여성 (Female), 발견 (Discover), 메시지 (Messages), 킹 멤버십 (King Membership), 프로필 (Profile), 구독하기 (Subscribe), 로그아웃 (Log Out), 프로필 수정 (Edit Profile), 결제 방식 안내 (Payment Method Info)