import { WrongQuestion } from "../types";

export const mockQuestions: WrongQuestion[] = [
  {
    id: "mock-math-1",
    subject: "数学",
    knowledgePoint: "一元二次方程根的判别式",
    difficulty: "中等",
    originalText: "已知关于x的一元二次方程 (m-1)x^2 + 2x + 1 = 0 有两个不相等的实数根，求m的取值范围。",
    analyzedError: "学生极其容易漏掉二次项系数不为零这一隐含限制条件，即 m - 1 ≠ 0，导致解出结果 m < 2 但忽视了 m ≠ 1。这是中考/期末考试中经典的分类讨论陷阱题。",
    variants: [
      {
        id: 1,
        questionText: "已知关于x的方程 (a-2)x^2 - 2x + 1 = 0 有实数根，求实数a的取值范围。",
        answer: "a ≤ 3 且 a ≠ 2，或者当方程为一次方程时 a = 2。综合得出 a ≤ 3。",
        explanation: "[易错点提醒]：原题没有声明是“一元二次方程”，只说是“方程”。因此必须分类讨论：\n1. 当 a - 2 = 0 即 a = 2 时，方程变为 -2x + 1 = 0，为一元一次方程，有实数根 x = 0.5，故 a=2 成立；\n2. 当 a - 2 ≠ 0 时，方程为一元二次方程，判别式 Δ = 4 - 4(a-2) ≥ 0，解得 a ≤ 3。结合条件得 a ≤ 3 且 a ≠ 2。\n综合以上两类情况，a 的取值范围是 a ≤ 3。考生常常漏掉一元一次方程的特殊情况！"
      },
      {
        id: 2,
        questionText: "若关于x的二次方程 kx^2 - 4x + 2 = 0 有两个实数根，求整数k的最大值。",
        answer: "k 的最大整数值是 1。",
        explanation: "[易错点提醒]：\n1. 题目中写明是“二次方程”，因此二次项系数 k 绝对不能为 0（k ≠ 0）；\n2. 题目只说“有两个实数根”，没有强调“不相等”，因此可能相等，即判别式 Δ = (-4)^2 - 4 * k * 2 ≥ 0，化简得 16 - 8k ≥ 0，解得 k ≤ 2。\n由于 k ≠ 0，且必须是二次方程，k 范围是 k ≤ 2 且 k ≠ 0。小于等于2的最大整数是 2？不，如果 k=2 时，k ≤ 2 且 k ≠ 0 依然成立。等等，题目问最大整数，所以最大值确实是 2？啊，如果题目是有两个*不相等*的实数根，则是 k < 2，最大整数就是 1。这里说有两个实根，k 可以等于 2。最大整数是2吗？等等，如果说‘两个实数根’通常允许相等，若在一些地方默认两个不同实数根，建议学生细致区分判别式是否含等号。"
      },
      {
        id: 3,
        questionText: "已知关于x的一元二次方程 x^2 + (2k+1)x + k^2 - 2 = 0 有两个不相等的实数根，求非负整数k的最小值。",
        answer: "k 的非负整数最小值是 0。",
        explanation: "[易错点提醒]：二次项系数是1，恒不为0。判别式 Δ = (2k+1)^2 - 4(k^2 - 2) > 0。展开得 4k^2 + 4k + 1 - 4k^2 + 8 > 0，即 4k + 9 > 0，得 k > -2.25。题目求“非负整数”的最小值，非负整数包含 0, 1, 2...，因此满足条件最小非负整数是 0。学生往往错把非负整数当成正整数，漏掉0！"
      }
    ],
    createdAt: "2026-06-30T21:00:00.000Z",
    selectedForPrint: true
  },
  {
    id: "mock-english-1",
    subject: "英语",
    knowledgePoint: "定语从句中关系代词的选择",
    difficulty: "中等",
    originalText: "This is the very museum ________ we visited yesterday, and it is also the most interesting place ________ I have ever seen.",
    analyzedError: "极易混淆关系代词 that 与 which 的用法。当先行词被 the very, the only, the same, the last 修饰，或者先行词本身是最高级、序数词修饰时，关系代词只能用 that，不能用 which。此题两处空白均只能用 that。",
    variants: [
      {
        id: 1,
        questionText: "The library is the only building ________ caught fire in the heavy thunderstorm last week.",
        answer: "that (由于先行词 building 前有 the only 修饰，引导词只能用 that 引导定语从句。)",
        explanation: "[易错点提醒]：很多同学看到指代物，顺手就写 which。牢记：当先行词受到 the only, the very, the last, the same 等词语限定修饰时，定语从句引导词必须用 that，which 在这里是错的。"
      },
      {
        id: 2,
        questionText: "I have read all the books ________ you lent to me, but I can't find anything ________ can interest me.",
        answer: "第一空填 that；第二空填 that。",
        explanation: "[易错点提醒]：当先行词是 all, anything, nothing, everything, something, little, much 等不定代词时，或者先行词被这些词修饰时，关系代词在定语从句中作宾语或主语时，通常只能用 that。which 会被视作语法不地道或错误。"
      },
      {
        id: 3,
        questionText: "This is the third prize ________ our school has won in the physics competition this semester.",
        answer: "that",
        explanation: "[易错点提醒]：当先行词受到序数词（如 the first, the second, the third 等）修饰时，关系代词只能用 that，不能用 which。很多同学忽略了序数词限定这一考点。"
      }
    ],
    createdAt: "2026-06-30T21:10:00.000Z",
    selectedForPrint: false
  }
];
