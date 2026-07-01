import { useState } from "react";
import { WrongQuestion } from "../types";
import { X, Printer, Settings, Eye, CheckSquare, Square, AlignJustify } from "lucide-react";

interface PrintPreviewProps {
  questions: WrongQuestion[];
  onClose: () => void;
}

export default function PrintPreview({ questions, onClose }: PrintPreviewProps) {
  const [paperTitle, setPaperTitle] = useState("错题自主过关与举一反三特训卷");
  const [showAnswerAtEnd, setShowAnswerAtEnd] = useState(true); // separate answers page
  const [showAnswerInSitu, setShowAnswerInSitu] = useState(false); // print answers directly under each question
  const [spacingLines, setSpacingLines] = useState(4); // 0 (compact), 4, 8 lines space for answers
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [studentInfo, setStudentInfo] = useState(true);

  const selectedQuestions = questions.filter(q => q.selectedForPrint);

  const fontClass = {
    sm: "text-xs",
    base: "text-sm",
    lg: "text-base",
  }[fontSize];

  const handlePrint = () => {
    window.print();
  };

  if (selectedQuestions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">未选择错题</h3>
          <p className="text-gray-500 mb-6">您还没有在错题本中勾选需要打印的错题，请先在列表中勾选错题。</p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl transition"
          >
            返回错题本
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-100/90 backdrop-blur-sm flex flex-col md:flex-row h-screen no-print">
      {/* Settings Panel - Sticky on Left for Desktop, Top for Mobile */}
      <div className="w-full md:w-80 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-5 flex flex-col gap-6 overflow-y-auto shrink-0 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">排版打印设置</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition"
            title="关闭预览"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <hr className="border-gray-100" />

        {/* Paper Title Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">试卷大标题</label>
          <input
            type="text"
            value={paperTitle}
            onChange={(e) => setPaperTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="自定义试卷标题..."
          />
        </div>

        {/* Name Board Toggle */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">考生信息栏</label>
          <button
            onClick={() => setStudentInfo(!studentInfo)}
            className={`w-full flex items-center justify-between px-3 py-2 border rounded-xl text-sm transition ${
              studentInfo ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className="font-medium">包含 姓名/班级/得分 栏</span>
            {studentInfo ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>
        </div>

        {/* Font Size Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">文字字号</label>
          <div className="grid grid-cols-3 gap-2">
            {(["sm", "base", "lg"] as const).map((sz) => (
              <button
                key={sz}
                onClick={() => setFontSize(sz)}
                className={`py-1.5 text-xs font-medium rounded-lg border transition ${
                  fontSize === sz
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {sz === "sm" ? "较小" : sz === "base" ? "适中" : "较大"}
              </button>
            ))}
          </div>
        </div>

        {/* Spacer lines for answering */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">留白作答区大小</label>
          <div className="grid grid-cols-4 gap-2">
            {([0, 3, 6, 10] as const).map((lines) => (
              <button
                key={lines}
                onClick={() => setSpacingLines(lines)}
                className={`py-1.5 text-xs font-medium rounded-lg border transition ${
                  spacingLines === lines
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {lines === 0 ? "不留白" : `${lines} 行`}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">控制打印时题目下方的横线行数，方便书写。</p>
        </div>

        {/* Answers Position Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">答案与解析显示方式</label>
          <div className="space-y-2">
            <button
              onClick={() => {
                setShowAnswerAtEnd(true);
                setShowAnswerInSitu(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 border rounded-xl text-sm transition ${
                showAnswerAtEnd ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="font-medium text-left">在卷末另起新页（推荐）</span>
              {showAnswerAtEnd ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setShowAnswerAtEnd(false);
                setShowAnswerInSitu(true);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 border rounded-xl text-sm transition ${
                showAnswerInSitu ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="font-medium text-left">直接显示在题目下方</span>
              {showAnswerInSitu ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                setShowAnswerAtEnd(false);
                setShowAnswerInSitu(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 border rounded-xl text-sm transition ${
                !showAnswerAtEnd && !showAnswerInSitu ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="font-medium text-left">纯享版（不打印答案）</span>
              {!showAnswerAtEnd && !showAnswerInSitu ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
          >
            返回
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>确认打印</span>
          </button>
        </div>
      </div>

      {/* Main Page Area - Renders A4 Page Simulator */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-gray-50 border-t md:border-t-0">
        <div 
          id="printable-exam"
          className="bg-white p-[15mm] md:p-[20mm] shadow-2xl rounded-sm w-[210mm] min-h-[297mm] flex flex-col font-serif select-text border border-gray-200"
        >
          {/* Header Area */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-black border-b-4 border-double border-black pb-2 px-1 inline-block tracking-wide">
              {paperTitle}
            </h1>
          </div>

          {/* Student Info Bar */}
          {studentInfo && (
            <div className="flex justify-center items-center gap-8 text-sm text-black mb-8 border-b border-dashed border-gray-300 pb-3 font-sans">
              <span>班级：__________________</span>
              <span>姓名：__________________</span>
              <span>得分：__________________</span>
            </div>
          )}

          {/* Exam Questions List */}
          <div className="space-y-6 flex-1">
            <div className="border-b border-black pb-1 mb-4 font-sans font-bold text-sm">
              一、 错题巩固与智能变式训练（共 {selectedQuestions.length} 组）
            </div>

            {selectedQuestions.map((question, index) => (
              <div key={question.id} className="avoid-break space-y-4 text-black">
                {/* Original Wrong Question Container */}
                <div className="border border-gray-300 p-4 rounded-lg bg-gray-50/50 print:bg-transparent print:border-black space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 font-sans font-medium print:text-black">
                    <span className="px-1.5 py-0.5 bg-gray-200 rounded font-semibold text-gray-700 print:border print:border-black print:rounded-none">
                      原题 {index + 1}
                    </span>
                    <span>学科：{question.subject}</span>
                    <span>•</span>
                    <span>核心考点：{question.knowledgePoint}</span>
                  </div>
                  <div className={`${fontClass} leading-relaxed whitespace-pre-wrap`}>
                    {question.originalText}
                  </div>
                  {/* Photo if uploaded and printing is desired */}
                  {question.image && (
                    <div className="mt-2 max-h-48 overflow-hidden rounded border border-gray-100 print:border-black">
                      <img 
                        src={question.image} 
                        alt="错题原图" 
                        className="max-w-full h-auto max-h-44 object-contain mx-auto"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Print answer directly under the original question */}
                  {showAnswerInSitu && (
                    <div className="mt-3 pt-3 border-t border-dashed border-gray-300 text-xs text-gray-700 print:text-black space-y-1 font-sans">
                      <p className="font-bold text-blue-800 print:text-black">[原题深度解析与易错点]</p>
                      <p className="whitespace-pre-wrap">{question.analyzedError}</p>
                    </div>
                  )}
                </div>

                {/* Draw answers spacers for Original if needed */}
                {!showAnswerInSitu && spacingLines > 0 && (
                  <div className="pl-4 space-y-3.5 no-print print:block">
                    {Array.from({ length: Math.min(spacingLines, 5) }).map((_, i) => (
                      <div key={i} className="border-b border-dotted border-gray-400 h-1 w-full" />
                    ))}
                  </div>
                )}

                {/* Analog Variant questions (举一反三) */}
                {question.variants && question.variants.length > 0 && (
                  <div className="pl-4 space-y-6 mt-4">
                    <div className="text-xs font-bold font-sans text-blue-900 border-l-2 border-blue-600 pl-2 mb-2 print:border-black print:text-black">
                      举一反三·专项变式演练 ({question.variants.length} 题)
                    </div>
                    
                    {question.variants.map((v, vIdx) => (
                      <div key={v.id} className="avoid-break space-y-2">
                        <div className="flex items-start gap-1">
                          <span className="font-bold shrink-0">{index + 1}.{vIdx + 1} 题：</span>
                          <div className={`${fontClass} leading-relaxed whitespace-pre-wrap flex-1`}>
                            {v.questionText}
                          </div>
                        </div>

                        {/* Answers directly in place */}
                        {showAnswerInSitu && (
                          <div className="mt-2 ml-8 p-3 bg-blue-50/50 rounded-lg text-xs text-gray-700 print:bg-transparent print:border-l print:border-black print:pl-4 space-y-1 font-sans">
                            <p className="font-bold text-blue-900 print:text-black">参考答案：{v.answer}</p>
                            <p className="whitespace-pre-wrap"><span className="font-bold text-red-700 print:text-black">[易错解析]</span> {v.explanation}</p>
                          </div>
                        )}

                        {/* Blank write spaces for Variant */}
                        {!showAnswerInSitu && spacingLines > 0 && (
                          <div className="pl-8 space-y-3.5 pt-2">
                            {Array.from({ length: spacingLines }).map((_, i) => (
                              <div key={i} className="border-b border-dotted border-gray-400 h-1 w-full" />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Thick break line between error sets */}
                {index < selectedQuestions.length - 1 && (
                  <div className="border-b-2 border-black/10 print:border-black my-8" />
                )}
              </div>
            ))}
          </div>

          {/* Answer Key on Separate Page (End of Paper) */}
          {showAnswerAtEnd && (
            <div className="page-break-before pt-8 mt-12 border-t-2 border-dashed border-black font-sans">
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-black tracking-wide">
                  参考答案与易错点解析
                </h2>
                <p className="text-xs text-gray-500 mt-1 print:text-black">（用于家长及学生核对、深度剖析避坑指南）</p>
              </div>

              <div className="space-y-8">
                {selectedQuestions.map((question, index) => (
                  <div key={`ans-${question.id}`} className="avoid-break space-y-4">
                    <div className="font-bold text-sm text-white bg-black px-2 py-1 inline-block">
                      第 {index + 1} 题 组解析
                    </div>

                    {/* Original explanation */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1.5 print:bg-transparent print:border-black">
                      <p className="font-bold text-red-800">[原题核心考点]：{question.knowledgePoint}</p>
                      <p className="font-bold text-amber-700">[大模型易错点分析]：</p>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed print:text-black">
                        {question.analyzedError}
                      </p>
                    </div>

                    {/* Variants explanations */}
                    {question.variants && question.variants.length > 0 && (
                      <div className="pl-4 space-y-4">
                        {question.variants.map((v, vIdx) => (
                          <div key={`ans-v-${v.id}`} className="text-xs space-y-1 border-l-2 border-gray-300 pl-3 print:border-black">
                            <p className="font-bold text-gray-950">
                              题目 {index + 1}.{vIdx + 1}
                            </p>
                            <p className="font-bold text-blue-900 print:text-black">
                              【正确答案】：{v.answer}
                            </p>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed print:text-black">
                              【深度解析】：{v.explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Real Print Area (only shown in window.print) */}
      <div className="print-only absolute top-0 left-0 bg-white w-[210mm] text-black">
        {/* We use standard window.print on #printable-exam which renders perfectly */}
      </div>
    </div>
  );
}
