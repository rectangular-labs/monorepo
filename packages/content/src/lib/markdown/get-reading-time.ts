import getReadingTime from "reading-time";

export function getContentReadingTime({
  content,
  wordsPerMinute = 200,
}: {
  content: string;
  wordsPerMinute?: number;
}) {
  const readingTime = getReadingTime(content, {
    wordsPerMinute,
  });
  return readingTime;
}
