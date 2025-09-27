# Claude Code Instructions

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md


- 새로운 작업을 시작할 때 현재 진행중인 작업이 완료되었는지 검증하기 위해서 나에게 질문해줘, Ex) FOO 기능이 정상 작동하나요?

- 작업(Task) 관리는 taskmaster-ai mcp를 사용해줘

- 현재 작업을 완료하면 playwright-ai mcp를 통해 크롬에서 직접 테스트 하고 새로 개발한 부분의 e2e테스트를 진행한다. 테스트 시 오류가 발생하면 원인을 정확히 파악하고 완벽하게 수정.

- 현재 작업이 코드 작업 및 테스트가 완료되었으면 git commit을 하고 github push를 한 뒤 다음 작업을 시작해야 한다.

- 커밋 메시지 내용은 자동으로 생성한다