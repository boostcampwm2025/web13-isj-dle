import { generateUniqueNickname } from "src/nickname/nickname.generator";

describe("generateUniqueNickname", () => {
  test("기본 생성: 중복이 없으면 숫자가 1이어야 함", () => {
    const nickname = generateUniqueNickname(() => false);

    // 형용사+명사+1 형식인지 확인 (예: 행복한호랑이1)
    // 정규식: 한글 시작(^) + 한글 반복(+) + 숫자 1 + 끝($)
    expect(nickname).toMatch(/^[가-힣]+1$/);
  });

  test("중복 처리: 1번이 중복이면 형용사+명사+2번이 나와야 함", () => {
    // 생성된 닉네임이 '1'로 끝나면 중복이라고 가정하는 시나리오
    const nickname = generateUniqueNickname((name) => name.endsWith("1"));

    expect(nickname).toMatch(/^[가-힣]+2$/);
  });

  test("연속 중복 처리: 1, 2, 3번이 중복이면 형용사+명사+4번이 나와야 함", () => {
    // 1, 2, 3으로 끝나는 경우 모두 중복으로 처리
    const nickname = generateUniqueNickname((name) => /([1-3])$/.test(name));

    expect(nickname).toMatch(/^[가-힣]+4$/);
  });
});
