# KingDate (킹데이트) - Premium Dating App

KingDate는 한국 사용자를 위한 프리미엄 데이팅 플랫폼입니다. 검증된 사용자들을 프리미엄 멤버십과 진짜 프로필로 연결합니다.

## 주요 기능

- 성별별 온보딩 플로우 (남성: 킹 구독 필수, 여성: 전화 인증 필수)
- 남성 사용자를 위한 프리미엄 "킹" 멤버십 (월 ₩250,000)
- 수동 계좌이체 결제 플로우 (KB국민은행)
- 검증된 사용자 간 실시간 메시징
- 이성 사용자만 표시되는 프로필 카드 기반 발견 기능
- 글래스모피즘 UI와 부드러운 애니메이션
- 블랙 & 골드 테마

## 기술 스택

### Frontend
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7
- **State Management**: React Context + TanStack React Query
- **Animations**: React Native Reanimated
- **Styling**: StyleSheet with theme constants

### Backend
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript (ESM modules)
- **Database**: PostgreSQL with Drizzle ORM
- **SMS**: Twilio (전화 인증)

## 시작하기

### 사전 요구사항

- Node.js 18+
- npm 또는 yarn
- PostgreSQL 데이터베이스 (선택사항)
- Expo CLI
- iOS Simulator (macOS) 또는 Android Emulator
- Twilio 계정 (SMS 인증용, 선택사항)

### 설치

1. **저장소 클론**
```bash
git clone https://github.com/sharevalue2022/2026_Gitrepository.git
cd 2026_Gitrepository
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
```bash
# .env.example을 .env로 복사
cp .env.example .env

# .env 파일을 편집하여 설정값 입력
```

`.env` 파일 예시:
```env
PORT=5000
NODE_ENV=development
EXPO_PUBLIC_DOMAIN=localhost:5000

# PostgreSQL (선택사항 - 없으면 메모리 저장소 사용)
DATABASE_URL=postgresql://username:password@localhost:5432/kingdate

# Twilio (선택사항)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_phone_number
```

4. **데이터베이스 설정** (PostgreSQL 사용 시)
```bash
# 데이터베이스 스키마 푸시
npm run db:push
```

### 개발 서버 실행

#### 방법 1: 서버와 클라이언트 동시 실행 (추천)
```bash
npm run dev
```

#### 방법 2: 별도 터미널에서 실행
```bash
# 터미널 1: 백엔드 서버 시작
npm run server:dev

# 터미널 2: Expo 개발 서버 시작
npm run expo:dev
```

서버는 `http://localhost:5000`에서 실행됩니다.

### 앱 실행

Expo 개발 서버가 시작되면:

1. **iOS Simulator** (macOS만 가능)
   - 키보드에서 `i` 입력

2. **Android Emulator**
   - 키보드에서 `a` 입력

3. **실제 기기** (Expo Go 앱 설치 필요)
   - Expo Go 앱에서 QR 코드 스캔

4. **웹 브라우저**
   - 키보드에서 `w` 입력

## 프로젝트 구조

```
2026_Gitrepository/
├── client/                 # React Native 클라이언트
│   ├── components/        # 재사용 가능한 UI 컴포넌트
│   ├── screens/           # 화면 컴포넌트
│   ├── navigation/        # 네비게이션 설정
│   ├── hooks/             # 커스텀 React 훅
│   ├── context/           # React Context (AuthContext 등)
│   ├── lib/               # 유틸리티 및 설정
│   └── types/             # TypeScript 타입 정의
├── server/                # Express 백엔드 서버
│   ├── routes.ts          # API 라우트
│   ├── index.ts           # 서버 진입점
│   ├── db.ts              # 데이터베이스 연결
│   ├── storage.ts         # 저장소 인터페이스
│   ├── lib/               # 서버 유틸리티
│   └── templates/         # HTML 템플릿
├── shared/                # 클라이언트/서버 공유 코드
│   └── schema.ts          # 데이터베이스 스키마
├── assets/                # 이미지, 폰트 등
├── scripts/               # 빌드 스크립트
├── app.json               # Expo 설정
├── package.json           # 프로젝트 의존성
├── tsconfig.json          # TypeScript 설정
└── .env.example           # 환경 변수 템플릿
```

## 사용 가능한 스크립트

- `npm run dev` - 서버와 클라이언트 동시 실행
- `npm run expo:dev` - Expo 개발 서버만 실행
- `npm run server:dev` - Express 서버만 실행 (개발 모드)
- `npm run server:build` - 서버 프로덕션 빌드
- `npm run server:prod` - 프로덕션 서버 실행
- `npm run expo:static:build` - Expo 정적 빌드 생성
- `npm run db:push` - 데이터베이스 스키마 푸시
- `npm run lint` - 코드 린팅
- `npm run format` - 코드 포맷팅
- `npm run check:types` - TypeScript 타입 체크

## 환경 변수 설명

| 변수 | 설명 | 기본값 | 필수 여부 |
|------|------|--------|----------|
| `PORT` | 서버 포트 번호 | 5000 | 선택 |
| `NODE_ENV` | 환경 (development/production) | development | 선택 |
| `EXPO_PUBLIC_DOMAIN` | 클라이언트가 서버 API 호출 시 사용하는 도메인 | localhost:5000 | **필수** |
| `DATABASE_URL` | PostgreSQL 연결 문자열 | - | 선택 |
| `TWILIO_ACCOUNT_SID` | Twilio 계정 SID | - | 선택 |
| `TWILIO_AUTH_TOKEN` | Twilio 인증 토큰 | - | 선택 |
| `TWILIO_PHONE_NUMBER` | Twilio 전화번호 | - | 선택 |

## Replit에서 실행하기

Replit 환경에서 실행하려면:

```bash
npm run expo:dev:replit
```

이 스크립트는 Replit 특정 환경 변수를 자동으로 설정합니다.

## 문제 해결

### "EXPO_PUBLIC_DOMAIN is not set" 에러
`.env` 파일에 `EXPO_PUBLIC_DOMAIN=localhost:5000`을 추가하세요.

### 서버 연결 실패
1. 서버가 실행 중인지 확인 (`npm run server:dev`)
2. `.env`의 `EXPO_PUBLIC_DOMAIN`이 올바른지 확인
3. 포트 5000이 사용 가능한지 확인

### Expo 앱이 실행되지 않음
```bash
# Expo 캐시 삭제
npx expo start -c
```

### 데이터베이스 연결 에러
DATABASE_URL이 없으면 자동으로 메모리 저장소를 사용합니다. 에러가 발생하면 `.env`에서 DATABASE_URL을 주석 처리하세요.

## 라이선스

Private

## 기여

이 프로젝트는 비공개 프로젝트입니다.

## 연락처

문의사항이 있으시면 프로젝트 관리자에게 연락해주세요.
