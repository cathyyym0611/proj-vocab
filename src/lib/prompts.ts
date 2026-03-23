import type { WordEntry, StoryStyle } from "@/types";

function formatWordList(words: WordEntry[]): string {
  return words
    .map((w, i) => {
      const pos = w.partOfSpeech || "未知";
      const en = w.meaningEn || "未知";
      // Don't pass placeholder Chinese meanings — let AI provide accurate ones
      const zh = w.meaningZh && w.meaningZh !== "待查询" && w.meaningZh !== "（请参考英文释义）"
        ? w.meaningZh
        : "";
      const zhPart = zh ? `，中文释义：${zh}` : "";
      return `${i + 1}. ${w.word}（词性：${pos}，英文释义：${en}${zhPart}）`;
    })
    .join("\n");
}

const SYSTEM_PROMPT = `你是一位天才编剧，擅长用极短的狗血/离奇/反转故事帮助中国学生记忆英语词汇。

你的核心能力：在150-200字内制造一个"让人忍不住截图分享"的名场面。

严格规则：
1. 故事中必须自然地使用所有给定的英语单词（保持英文原词嵌入中文句子中）
2. 每个英语单词第一次出现时，紧跟其后用【中文含义】标注，格式为：englishWord【中文含义】
3. 关键：每个单词在语境中的用法必须精确匹配其英文释义。不要生硬插入，让单词成为情节不可缺少的一部分
4. 故事要有一个核心冲突 + 一个出人意料的反转或金句结尾
5. 情节可以离奇、狗血、夸张，但逻辑要自洽
6. **正文严格150-200字，1-2段，不要铺垫，直接进入高潮**

你的输出必须严格按照下面的模板，一字不差地遵循分隔符和表头格式：

## 标题（不超过10个字）

故事正文（150-200字）

---
### 📖 单词释义
| 单词 | 词性 | 音标 | 中文释义 | 英文释义 |
|------|------|------|----------|----------|
| word | noun/verb/adjective/adverb | /phonetic/ | 中文释义 | English definition |

表格要求：
- 词性必须用英文标注（noun, verb, adjective, adverb）
- 如果一个单词有多个常见词性或含义，用分号分隔列出
- 音标用国际音标
- 必须包含故事中出现的所有英语单词，每个单词一行
- 中文释义必须由你提供准确的翻译，不要写"请参考英文释义"之类的占位符
- 释义表是必须输出的部分，绝对不能省略`;

const STYLE_PROMPTS: Record<StoryStyle, string> = {
  palace:
    "请严格用《甄嬛传》世界观写一个后宫名场面，人物、称谓、关系链都必须与《甄嬛传》强关联。优先使用甄嬛、华妃、皇后、沈眉庄、安陵容、苏培盛、皇上等《甄嬛传》人物，情节要像发生在甘露寺回宫、滴血验亲、椒房争宠、倚梅园许愿这类经典语境中。要有妃嫔之间的试探、构陷、反转和扎心台词，语言华丽但简练，像一段真正的《甄嬛传》名场面。禁止混入《如懿传》或其他清宫剧人物与设定，尤其不要出现如懿、海兰、金玉妍、魏嬿婉等角色。",
  mystery:
    "请用悬疑推理风格写一个短篇。要有一个精巧的谜题和出人意料的真相揭露，像一个微型东野圭吾故事，结尾让人倒吸一口凉气。",
  romance:
    "请用都市言情/狗血剧风格写一个名场面。可以是豪门恩怨、虐恋情深、误会反转等经典桥段。对白要扎心，情节要抓人，像热搜上的爆款短剧片段。",
  wuxia:
    "请用金庸/古龙风格写一个江湖片段。要有快意恩仇、绝世高手对决或侠义抉择的名场面，语言要有武侠小说的韵味。",
};

export function buildPrompt(
  words: WordEntry[],
  style: StoryStyle,
  customPrompt?: string
): { system: string; user: string } {
  const styleInstruction = STYLE_PROMPTS[style];

  const user = `${styleInstruction}

需要融入的词汇（请仔细阅读每个词的英文释义，确保语境匹配）：
${formatWordList(words)}

请严格按照系统提示中的模板格式输出，包含故事正文和单词释义表格。`;

  return { system: SYSTEM_PROMPT, user };
}
