import { ADJECTIVES, NOUNS } from "./nickname.constants";

export const generateUniqueNickname = async (
  isDuplicate: (nickname: string) => Promise<boolean> | boolean,
): Promise<string> => {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];

  let number = 1;

  let nickname = `${adjective} ${noun} ${number}`;

  while (await isDuplicate(nickname)) {
    number++;
    nickname = `${adjective} ${noun} ${number}`;
  }

  return nickname;
};
