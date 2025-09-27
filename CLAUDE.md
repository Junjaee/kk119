# Claude Code Instructions

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md

---

# 작업 운영 규칙 (for Claude)

## 1) 진행 중 작업 확인 프롬프트

* 새로운 작업을 시작하기 전에, 현재 작업 완료 여부를 **반드시 질문하여 검증**할 것

  * 예시 질문:

    * “현재 진행 중인 *FOO* 기능이 정상 작동하나요?”
    * “직전 작업의 테스트와 배포(또는 PR)가 모두 끝났나요?”

## 2) 작업(Task) 관리

* 모든 작업 관리는 **`taskmaster-ai` MCP**로 수행함

  * 신규 작업 생성, 우선순위 지정, 상태 변경을 `taskmaster-ai` MCP 명령으로 처리

## 3) 테스트(E2E) 절차

* 현재 작업을 완료하면 **`playwright-ai` MCP**로 **크롬에서 직접 테스트 + E2E 테스트**를 수행함
* 테스트 중 오류 발생 시:

  * 원인을 **정확히 진단**하고 **완벽히 수정**할 것
  * 수정 후 **테스트 재실행 → 통과 확인**까지 완료

## 4) 커밋 & 푸시 규칙

* 코드 작업 및 테스트가 **완료되었으면**:

  1. `git commit` 수행
  2. `github push` 수행
  3. 다음 작업으로 이동
* **커밋 메시지는 자동 생성**함 (컨벤션에 맞춘 요약/본문/이슈 참조 자동화)

## 5) 로컬 서버 포트 사용 규칙

* 새로운 로컬호스트(개발 서버)를 **새로 띄우기 전**, **기존 포트를 반드시 종료**할 것

  * 예: `:3000` 사용 중이면 해당 프로세스 종료 후 새 서버 실행

---

### 체크리스트 (작업 시작 전/후)

* [ ] “직전 작업 완료됨?” 질문으로 **완료 여부 확인**
* [ ] `taskmaster-ai` MCP로 **작업 상태 최신화**
* [ ] 구현 완료 후 `playwright-ai` MCP로 **크롬/E2E 테스트**
* [ ] **오류 원인 분석 → 수정 → 재테스트 통과**
* [ ] **자동 생성 커밋 메시지**로 `git commit`
* [ ] **`github push` 완료**
* [ ] **다음 작업으로 이동**
* [ ] 새 서버 필요 시 **기존 포트 종료 후** 로컬 서버 실행
