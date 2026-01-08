import { ADJECTIVES, NOUNS } from "./nickname.constants";

export function generateUniqueNickname(isDuplicate: (nickname: string) => boolean): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];

  let number = 1;

  let nickname = `${adjective} ${noun} ${number}`;

  while (isDuplicate(nickname)) {
    number++;
    nickname = `${adjective} ${noun} ${number}`;
  }

  return nickname;
}
