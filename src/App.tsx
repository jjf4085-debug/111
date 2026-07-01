import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  Upload, 
  Trash2, 
  Printer, 
  BookOpen, 
  Sparkles, 
  RefreshCw, 
  FileText, 
  CheckCircle, 
  Check, 
  Search, 
  Filter, 
  Edit, 
  Eye, 
  EyeOff, 
  ChevronDown, 
  ChevronUp, 
  BookMarked, 
  PenTool, 
  HelpCircle,
  Plus,
  AlertTriangle,
  FileDown,
  User
} from "lucide-react";
import { WrongQuestion, VariantQuestion, TabType } from "./types";
import { mockQuestions } from "./data/mockQuestions";
import PrintPreview from "./components/PrintPreview";

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>("identify");

  // Notebook State
  const [questions, setQuestions] = useState<WrongQuestion[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("全部");

  // Identification / Input form State
  const [inputText, setInputText] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/jpeg");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");

  // Extracted Error Question details (Editable)
  const [extractedQuestion, setExtractedQuestion] = useState<Partial<WrongQuestion> | null>(null);
  const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);
  const [showExtractedEditor, setShowExtractedEditor] = useState(false);

  // Active Variant Questions State
  const [variants, setVariants] = useState<VariantQuestion[]>([]);

  // UI state variables
  const [showAnswerForId, setShowAnswerForId] = useState<Record<string, boolean>>({});
  const [editQuestionId, setEditQuestionId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<WrongQuestion> | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [regeneratingQuestions, setRegeneratingQuestions] = useState<Record<string, boolean>>({});

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMsg]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load wrong questions from local storage on mount, fallback to default mock cases if empty
  useEffect(() => {
    const saved = localStorage.getItem("error_notebook_questions");
    if (saved) {
      try {
        setQuestions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse error notebook localData:", e);
        setQuestions(mockQuestions);
      }
    } else {
      setQuestions(mockQuestions);
    }
  }, []);

  // Save to local storage whenever notebook changes
  const saveQuestions = (newQuestions: WrongQuestion[]) => {
    setQuestions(newQuestions);
    localStorage.setItem("error_notebook_questions", JSON.stringify(newQuestions));
  };

  // Drag and drop event handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Convert uploaded image file to base64 Data URL
  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("请上传图片文件（JPG, PNG 等）");
      return;
    }
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
      setInputText(""); // Reset manual text when image is loaded
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Simulate OCR analyze with mock templates
  const loadMockTemplate = (index: number) => {
    const templates = [
      {
        text: "若 a, b 为实数，且满足 |a-2| + √(b+3) = 0，求代数式 (a+b)^2026 的值。",
        image: null
      },
      {
        text: "The man ________ lives next door is a famous scientist. We always see him reading books ________ are hard for us to understand.",
        image: null
      },
      {
        text: "将一个重为10N的物体放在水平地面上，在3N的水平拉力作用下做匀速直线运动。此时物体受到的摩擦力是____N；如果将水平拉力增大到5N，物体受到的静摩擦力是____N，此时物体的加速度变为____。",
        image: null
      }
    ];

    const target = templates[index];
    setInputText(target.text);
    setUploadedImage(null);
  };

  // 1. OCR / Text Input Analysis
  const handleOCRAndAnalyze = async () => {
    if (!uploadedImage && !inputText.trim()) {
      alert("请先上传错题图片或手动输入错题文本！");
      return;
    }

    setIsAnalyzing(true);
    setVariants([]);
    setExtractedQuestion(null);

    // Dynamic progression loading text
    const steps = [
      "📷 正在提取错题视觉文本 (OCR)...",
      "🧠 正在结合知识图谱研判学科领域...",
      "🏷️ 正在精准标注核心重难点知识点...",
      "🔍 正在深度剖析该题常见的坑点与丢分原因...",
      "✨ 识别与错因分析完成！"
    ];

    let currentStep = 0;
    setAnalysisStep(steps[currentStep]);
    const interval = setInterval(() => {
      if (currentStep < steps.length - 2) {
        currentStep++;
        setAnalysisStep(steps[currentStep]);
      }
    }, 1200);

    try {
      const response = await fetch("/api/ocr-and-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadedImage,
          mimeType: imageMime,
          text: inputText
        })
      });

      clearInterval(interval);

      if (!response.ok) {
        throw new Error("大模型识别接口异常，请重试");
      }

      const data = await response.json();
      setExtractedQuestion(data);
      setAnalysisStep("✨ 识别与错因分析完成！");
      
      // Automatically generate variants in background/next step
      await generateVariants(data);
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      alert(`错题提取分析失败: ${err.message || "网络或服务异常"}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Analog Variant generation (举一反三)
  const generateVariants = async (extracted: Partial<WrongQuestion>) => {
    setIsGeneratingVariants(true);
    try {
      const response = await fetch("/api/generate-variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: extracted.originalText,
          subject: extracted.subject,
          knowledgePoint: extracted.knowledgePoint,
          difficulty: extracted.difficulty
        })
      });

      if (!response.ok) {
        throw new Error("智能生成变式题目失败，请重试");
      }

      const list = await response.json();
      setVariants(list);
    } catch (err: any) {
      console.error(err);
      alert(`变式题生成失败: ${err.message || "服务发生故障"}`);
    } finally {
      setIsGeneratingVariants(false);
    }
  };

  // 2.2. Regenerate variants for a saved question in Notebook
  const regenerateVariantsForSavedQuestion = async (questionId: string, q: WrongQuestion) => {
    setRegeneratingQuestions(prev => ({ ...prev, [questionId]: true }));
    try {
      const response = await fetch("/api/generate-variants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalText: q.originalText,
          subject: q.subject,
          knowledgePoint: q.knowledgePoint,
          difficulty: q.difficulty
        })
      });

      if (!response.ok) {
        throw new Error("智能生成变式题目失败，请重试");
      }

      const list = await response.json();
      
      const updated = questions.map(item => 
        item.id === questionId ? { ...item, variants: list } : item
      );
      saveQuestions(updated);
      setToastMsg("成功为该错题重新生成了 3 道全新的变式强化训练题！");
    } catch (err: any) {
      console.error(err);
      alert(`重新生成变式失败: ${err.message || "服务异常"}`);
    } finally {
      setRegeneratingQuestions(prev => ({ ...prev, [questionId]: false }));
    }
  };

  // Save finalized error & variants to the persistent notebook
  const saveToNotebook = () => {
    if (!extractedQuestion || !extractedQuestion.originalText) {
      alert("没有可保存的错题内容！");
      return;
    }

    const newQuestion: WrongQuestion = {
      id: "q-" + Date.now(),
      originalText: extractedQuestion.originalText,
      subject: extractedQuestion.subject || "通用",
      knowledgePoint: extractedQuestion.knowledgePoint || "未标明知识点",
      difficulty: extractedQuestion.difficulty || "中等",
      analyzedError: extractedQuestion.analyzedError || "无易错点说明",
      variants: variants,
      image: uploadedImage || undefined,
      createdAt: new Date().toISOString(),
      selectedForPrint: true // selected by default
    };

    const updated = [newQuestion, ...questions];
    saveQuestions(updated);

    // Reset generator states
    setInputText("");
    setUploadedImage(null);
    setExtractedQuestion(null);
    setVariants([]);
    
    // Auto switch to notebook to view the result
    setActiveTab("notebook");
  };

  // Manual Edit of extracted question text or metadata
  const handleUpdateExtracted = (field: keyof WrongQuestion, value: any) => {
    if (extractedQuestion) {
      setExtractedQuestion({
        ...extractedQuestion,
        [field]: value
      });
    }
  };

  // Toggle Print selections
  const toggleSelectForPrint = (id: string) => {
    const updated = questions.map(q => 
      q.id === id ? { ...q, selectedForPrint: !q.selectedForPrint } : q
    );
    saveQuestions(updated);
  };

  // Select all or deselect all for printing
  const toggleSelectAll = (select: boolean) => {
    const updated = questions.map(q => ({ ...q, selectedForPrint: select }));
    saveQuestions(updated);
  };

  // Delete question from notebook
  const handleDeleteQuestion = (id: string) => {
    if (confirm("确定要删除这道错题及它生成的变式题吗？此操作无法撤销。")) {
      const updated = questions.filter(q => q.id !== id);
      saveQuestions(updated);
    }
  };

  // Inline Question Editor state
  const startEditQuestion = (q: WrongQuestion) => {
    setEditQuestionId(q.id);
    setEditFormData({ ...q });
  };

  const handleEditChange = (field: keyof WrongQuestion, value: any) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [field]: value
      });
    }
  };

  const saveEditQuestion = () => {
    if (!editFormData || !editQuestionId) return;
    const updated = questions.map(q => 
      q.id === editQuestionId ? (editFormData as WrongQuestion) : q
    );
    saveQuestions(updated);
    setEditQuestionId(null);
    setEditFormData(null);
  };

  // Highlight helper for pitfall descriptions
  const renderHighlightedText = (text: string) => {
    if (!text) return null;
    // Replace markdown bold, and special pitfall keywords like [易错点]
    const parts = text.split(/(\[易错点\]|【易错点】|易错点提醒|易错点提示|\*\*.*?\*\*)/g);
    return (
      <span className="leading-relaxed">
        {parts.map((part, index) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={index} className="text-gray-950 font-bold bg-amber-50 px-1 py-0.5 rounded">
                {part.slice(2, -2)}
              </strong>
            );
          }
          if (["[易错点]", "【易错点】", "易错点提醒", "易错点提示"].includes(part)) {
            return (
              <span key={index} className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded mr-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                {part}
              </span>
            );
          }
          return part;
        })}
      </span>
    );
  };

  // Filtering list
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = 
      q.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.knowledgePoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSubject = subjectFilter === "全部" || q.subject === subjectFilter;
    
    return matchesSearch && matchesSubject;
  });

  const subjects = ["全部", ...Array.from(new Set(questions.map(q => q.subject))).filter(s => s)];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-32 select-none">
      {/* Top Main Banner Header */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 sticky top-0 z-40 flex items-center justify-between no-print shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Printer className="w-4.5 h-4.5" />
          </div>
          <h1 className="text-base font-bold tracking-tight text-slate-800">
            错题举一反三 <span className="text-blue-600">| 智能打印机</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowPrintModal(true)}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition"
          >
            打印配置
          </button>
          <div className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-700">
            已存 {questions.length} 题
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto px-6 py-6 no-print">
        
        {/* TAB 1: OCR Identify and AI Generator */}
        {activeTab === "identify" && (
          <div className="space-y-6">
            
            {/* Quick Presets Banner */}
            <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100/60 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-slate-800">快速载入真题体验样本</h3>
                  <p className="text-xs text-slate-500 mt-0.5">点击下方一键载入不同学科的经典错题，免去拍照与录入，即刻感受大模型智能举一反三！</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button 
                  onClick={() => loadMockTemplate(0)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 rounded-lg shadow-2xs transition"
                >
                  数学：代数求值
                </button>
                <button 
                  onClick={() => loadMockTemplate(1)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 rounded-lg shadow-2xs transition"
                >
                  英语：定语从句
                </button>
                <button 
                  onClick={() => loadMockTemplate(2)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 rounded-lg shadow-2xs transition"
                >
                  物理：摩擦力分析
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              
              {/* Upload & Raw Text Input Block */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-blue-600" />
                    原始题目输入区
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">支持拍照、截屏图与键盘输入</span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Drag Drop Area */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition flex flex-col items-center justify-center min-h-[160px] ${
                      isDragging ? "border-blue-500 bg-blue-50" : 
                      uploadedImage ? "border-emerald-300 bg-emerald-50/20" : "border-slate-200 hover:border-blue-400"
                    }`}
                  >
                    {uploadedImage ? (
                      <div className="relative w-full max-h-56 overflow-hidden rounded-lg border border-emerald-100">
                        <img 
                          src={uploadedImage} 
                          alt="上传错题" 
                          className="w-full h-auto max-h-52 object-contain mx-auto"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          onClick={() => setUploadedImage(null)}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition"
                          title="移除图片"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                          <Camera className="w-5 h-5" />
                        </div>
                        <div className="text-xs text-slate-600">
                          <span className="text-blue-600 font-bold hover:underline">点击上传错题照片</span> 或拖拽到这里
                        </div>
                        <p className="text-[10px] text-slate-400">支持 JPG, PNG 等标准错题试卷截图</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  {/* OR divider */}
                  <div className="flex items-center gap-3">
                    <div className="h-[1px] bg-slate-100 flex-1" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">或 手动录入</span>
                    <div className="h-[1px] bg-slate-100 flex-1" />
                  </div>

                  {/* Manual Text Area */}
                  <div className="space-y-1.5">
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      rows={4}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans bg-slate-50/50"
                      placeholder="请输入或复制错题的题目文字..."
                    />
                  </div>

                  {/* Run OCR / Analysis Button */}
                  <button
                    onClick={handleOCRAndAnalyze}
                    disabled={isAnalyzing || (!uploadedImage && !inputText.trim())}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 shadow-sm transition flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>正在智能识别与剖析错因...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>1键极速提取 & 分析错因</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Real-time OCR & Variant Generator Display Area */}
              <div className="space-y-6">
                
                {/* Loader Overlay when analyzing */}
                {isAnalyzing && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-4">
                    <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 border-4 border-blue-100 rounded-full animate-pulse" />
                      <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-sm">大模型思考中</h4>
                      <p className="text-xs text-blue-600 font-bold animate-pulse">{analysisStep}</p>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-500 text-left space-y-1">
                      <p className="font-semibold text-slate-700">✨ 小贴士：</p>
                      <p>Gemini 正在针对错题类型挖掘最容易掉入的思维误区。变式训练题会专门强化考生的避坑能力！</p>
                    </div>
                  </div>
                )}

                {/* Extracted question & manual correction board */}
                {!isAnalyzing && extractedQuestion && (
                  <div className="bg-white rounded-2xl border border-blue-200 flex flex-col overflow-hidden ring-4 ring-blue-500/5 shadow-sm space-y-0">
                    <div className="px-4 py-3 border-b border-blue-100 bg-blue-50/50 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700">大模型精准识别与分析</span>
                      </div>
                      <button
                        onClick={() => setShowExtractedEditor(!showExtractedEditor)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>{showExtractedEditor ? "完成微调" : "手动修改(防OCR误错)"}</span>
                      </button>
                    </div>

                    {/* Editor Form if editable toggle is on */}
                    <div className="p-5 space-y-4">
                      {showExtractedEditor ? (
                        <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block font-semibold text-slate-500 mb-1">学科分类</label>
                              <input
                                type="text"
                                value={extractedQuestion.subject || ""}
                                onChange={(e) => handleUpdateExtracted("subject", e.target.value)}
                                className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none text-xs"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-500 mb-1">难度等级</label>
                              <select
                                value={extractedQuestion.difficulty || "中等"}
                                onChange={(e) => handleUpdateExtracted("difficulty", e.target.value)}
                                className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none text-xs"
                              >
                                <option value="简单">简单</option>
                                <option value="中等">中等</option>
                                <option value="困难">困难</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-500 mb-1">核心知识点</label>
                            <input
                              type="text"
                              value={extractedQuestion.knowledgePoint || ""}
                              onChange={(e) => handleUpdateExtracted("knowledgePoint", e.target.value)}
                              className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none text-xs"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-500 mb-1">识别出的题目文本</label>
                            <textarea
                              value={extractedQuestion.originalText || ""}
                              onChange={(e) => handleUpdateExtracted("originalText", e.target.value)}
                              rows={3}
                              className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none text-xs"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-500 mb-1">易错点深度解析</label>
                            <textarea
                              value={extractedQuestion.analyzedError || ""}
                              onChange={(e) => handleUpdateExtracted("analyzedError", e.target.value)}
                              rows={3}
                              className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none text-xs"
                            />
                          </div>

                          <button
                            onClick={() => {
                              setShowExtractedEditor(false);
                              generateVariants(extractedQuestion);
                            }}
                            className="w-full py-1.5 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition flex items-center justify-center gap-1 text-xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>更新变式题目内容</span>
                          </button>
                        </div>
                      ) : (
                        // Read Only visual layout
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded">
                              {extractedQuestion.subject || "全科"}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded border border-slate-200">
                              考点: {extractedQuestion.knowledgePoint}
                            </span>
                            <span className={`px-2 py-0.5 rounded font-medium ${
                              extractedQuestion.difficulty === "简单" ? "bg-emerald-100 text-emerald-800" :
                              extractedQuestion.difficulty === "困难" ? "bg-rose-100 text-rose-800" :
                              "bg-amber-100 text-amber-800"
                            }`}>
                              难度: {extractedQuestion.difficulty}
                            </span>
                          </div>

                          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm font-serif leading-relaxed whitespace-pre-wrap text-slate-700">
                            {extractedQuestion.originalText}
                          </div>

                          {/* Pitfall analysis with custom highlighter */}
                          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-900 space-y-2">
                            <p className="font-bold flex items-center gap-1.5 text-amber-800">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>易错点分析</span>
                            </p>
                            <p className="whitespace-pre-wrap leading-relaxed">
                              {renderHighlightedText(extractedQuestion.analyzedError || "")}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Generated 3 variants */}
                {isGeneratingVariants && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm space-y-3">
                    <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-xs text-slate-500">正在根据该知识点，智能生成 3 套类似难度的“举一反三”考试变式题...</p>
                  </div>
                )}

                {!isGeneratingVariants && variants.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        举一反三 · 专项智能变式强化
                      </h3>
                      
                      {/* Regenerate Trigger */}
                      <button
                        onClick={() => extractedQuestion && generateVariants(extractedQuestion)}
                        className="text-xs font-bold text-blue-600 hover:text-white hover:bg-blue-600 flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/50 border border-blue-200 hover:border-blue-600 rounded-xl transition shadow-2xs cursor-pointer"
                        title="对题目不满意？一键重新生成所有变式题"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>不满意？一键重新生成相似题目</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {variants.map((v, vIdx) => (
                        <div key={v.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                          <div className="flex items-start gap-1.5 text-sm">
                            <span className="font-bold text-indigo-600 shrink-0">变式 {vIdx + 1}：</span>
                            <div className="font-serif leading-relaxed whitespace-pre-wrap flex-1 text-slate-800">
                              {v.questionText}
                            </div>
                          </div>

                          {/* Quick Toggle to see answers inside generators */}
                          <div>
                            <button
                              onClick={() => {
                                setShowAnswerForId(prev => ({ ...prev, [`gen-${v.id}`]: !prev[`gen-${v.id}`] }));
                              }}
                              className="text-xs font-semibold text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                            >
                              {showAnswerForId[`gen-${v.id}`] ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>隐藏参考答案与解析</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>查看参考答案与解析</span>
                                </>
                              )}
                            </button>

                            {showAnswerForId[`gen-${v.id}`] && (
                              <div className="mt-2.5 p-3 bg-indigo-50/50 rounded-lg text-xs text-indigo-950/90 border border-indigo-100 space-y-1">
                                <p className="font-bold text-indigo-900">参考答案：{v.answer}</p>
                                <p className="leading-relaxed text-slate-600 whitespace-pre-wrap">
                                  {renderHighlightedText(v.explanation)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Final step: Save to Book button */}
                    <button
                      onClick={saveToNotebook}
                      className="w-full py-3 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-md hover:bg-slate-850 transition flex items-center justify-center gap-2"
                    >
                      <BookMarked className="w-4 h-4" />
                      <span>加入错题本</span>
                    </button>
                  </div>
                )}

                {/* Clean onboarding status when empty */}
                {!extractedQuestion && !isAnalyzing && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm text-slate-400 flex flex-col items-center justify-center min-h-[250px] space-y-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-700 text-sm">等待录入或提取错题</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        在左侧上传错题图片或手动输入题目文本，大模型将自动判断知识点，秒级生成高质量变式。
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Notebook Records List & Printing */}
        {activeTab === "notebook" && (
          <div className="space-y-6">
            
            {/* Filter and Control Headers */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between">
              
              {/* Left Search input and Subject buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索知识点、原题关键词..."
                    className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-60 bg-slate-50"
                  />
                </div>

                {/* Subjects Selector */}
                <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none shrink-0 max-w-xs sm:max-w-md">
                  {subjects.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setSubjectFilter(sub)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition whitespace-nowrap ${
                        subjectFilter === sub 
                          ? "bg-blue-600 text-white" 
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right printing triggers & Bulk selection */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end border-t md:border-t-0 pt-3 md:pt-0">
                <button
                  onClick={() => toggleSelectAll(true)}
                  className="text-xs font-semibold text-blue-600 hover:underline px-2 py-1"
                >
                  全选
                </button>
                <button
                  onClick={() => toggleSelectAll(false)}
                  className="text-xs font-semibold text-slate-500 hover:underline px-2 py-1"
                >
                  清空选择
                </button>

                <div className="h-4 w-[1px] bg-slate-200 mx-1" />

                <button
                  onClick={() => setShowPrintModal(true)}
                  className="py-2.5 px-4 rounded-xl text-sm font-bold bg-gradient-to-tr from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>排版并批量打印 ({questions.filter(q => q.selectedForPrint).length})</span>
                </button>
              </div>

            </div>

            {/* List of wrong questions */}
            {filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                <BookOpen className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="font-bold text-slate-700">错题本空空如也</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  没有找到符合过滤条件的错题。请前往“错题识别”页，上传照片并添加首个错题！
                </p>
                <button
                  onClick={() => setActiveTab("identify")}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white font-medium text-xs rounded-xl hover:bg-blue-700 transition"
                >
                  去识别提取错题
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question) => {
                  const isEditing = editQuestionId === question.id;
                  
                  return (
                    <div 
                      key={question.id}
                      className={`bg-white rounded-2xl border transition duration-200 p-5 shadow-xs space-y-4 ${
                        question.selectedForPrint ? "border-blue-200 ring-2 ring-blue-500/10" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Card Header & Multi-select Checkbox */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Selection Checkbox */}
                          <button
                            onClick={() => toggleSelectForPrint(question.id)}
                            className={`w-5.5 h-5.5 rounded-lg border-2 flex items-center justify-center transition shrink-0 ${
                              question.selectedForPrint 
                                ? "border-blue-600 bg-blue-600 text-white" 
                                : "border-slate-300 hover:border-blue-400"
                            }`}
                          >
                            {question.selectedForPrint && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>

                          {/* Metadata Badges */}
                          <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">
                              {question.subject}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded border border-slate-200">
                              考点: {question.knowledgePoint}
                            </span>
                            <span className={`px-2 py-0.5 rounded font-medium ${
                              question.difficulty === "简单" ? "bg-emerald-50 text-emerald-700" :
                              question.difficulty === "困难" ? "bg-rose-50 text-rose-700" :
                              "bg-amber-50 text-amber-700"
                            }`}>
                              难度: {question.difficulty}
                            </span>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditQuestion(question)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
                            title="微调题目内容"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition"
                            title="从本中删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Editing View */}
                      {isEditing && editFormData ? (
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block font-semibold text-slate-500 mb-1">学科</label>
                              <input
                                type="text"
                                value={editFormData.subject || ""}
                                onChange={(e) => handleEditChange("subject", e.target.value)}
                                className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-500 mb-1">考点</label>
                              <input
                                type="text"
                                value={editFormData.knowledgePoint || ""}
                                onChange={(e) => handleEditChange("knowledgePoint", e.target.value)}
                                className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-slate-500 mb-1">难度</label>
                              <select
                                value={editFormData.difficulty || "中等"}
                                onChange={(e) => handleEditChange("difficulty", e.target.value)}
                                className="w-full border border-slate-200 rounded px-2 py-1 bg-white text-xs"
                              >
                                <option value="简单">简单</option>
                                <option value="中等">中等</option>
                                <option value="困难">困难</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-500 mb-1">错题内容</label>
                            <textarea
                              value={editFormData.originalText || ""}
                              onChange={(e) => handleEditChange("originalText", e.target.value)}
                              rows={3}
                              className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-white text-xs"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-slate-500 mb-1">易错解析</label>
                            <textarea
                              value={editFormData.analyzedError || ""}
                              onChange={(e) => handleEditChange("analyzedError", e.target.value)}
                              rows={3}
                              className="w-full border border-slate-200 rounded px-2.5 py-1.5 bg-white text-xs"
                            />
                          </div>

                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              onClick={() => {
                                setEditQuestionId(null);
                                setEditFormData(null);
                              }}
                              className="px-3 py-1.5 border border-slate-200 rounded hover:bg-slate-100 transition text-xs font-semibold"
                            >
                              取消
                            </button>
                            <button
                              onClick={saveEditQuestion}
                              className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-semibold"
                            >
                              保存修改
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Regular View
                        <div className="space-y-3.5">
                          {/* Main Question Text */}
                          <div className="font-serif text-slate-800 leading-relaxed whitespace-pre-wrap pl-1.5 border-l-3 border-slate-300">
                            {question.originalText}
                          </div>

                          {/* Original Photo attachment (if any) */}
                          {question.image && (
                            <div className="max-h-48 overflow-hidden rounded-lg border border-slate-100 bg-slate-50/50 inline-block">
                              <img 
                                src={question.image} 
                                alt="错题照片" 
                                className="max-w-full h-auto max-h-44 object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          {/* Pitfall analysis in amber badge */}
                          <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-xl text-xs text-amber-950/90 leading-relaxed">
                            <div className="font-bold text-amber-800 flex items-center gap-1.5 mb-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>易错重难点透析：</span>
                            </div>
                            <p className="whitespace-pre-wrap pl-1">
                              {renderHighlightedText(question.analyzedError)}
                            </p>
                          </div>

                          {/* Analog Variant questions toggler */}
                          {question.variants && question.variants.length > 0 && (
                            <div className="pt-2 border-t border-slate-100">
                              <button
                                onClick={() => {
                                  setShowAnswerForId(prev => ({ ...prev, [question.id]: !prev[question.id] }));
                                }}
                                className="w-full flex items-center justify-between text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
                              >
                                <span className="flex items-center gap-1.5">
                                  <Sparkles className="w-4 h-4 text-indigo-500" />
                                  <span>查看该考点的“举一反三”变式特训题 ({question.variants.length} 题)</span>
                                </span>
                                {showAnswerForId[question.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>

                              {showAnswerForId[question.id] && (
                                <div className="mt-3 space-y-2.5 pl-3 border-l-2 border-indigo-100">
                                  {/* Regenerate Header Trigger */}
                                  <div className="flex justify-between items-center bg-indigo-50/45 rounded-xl px-3 py-2 border border-indigo-100/60 mb-2">
                                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                                      <Sparkles className="w-3.5 h-3.5" />
                                      AI 智能变式训练题
                                    </span>
                                    <button
                                      onClick={() => regenerateVariantsForSavedQuestion(question.id, question)}
                                      disabled={regeneratingQuestions[question.id]}
                                      className="text-[10px] font-bold text-blue-600 hover:text-white hover:bg-blue-600 flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-200 hover:border-blue-600 rounded-lg transition shadow-2xs cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
                                      title="不满意当前的相似题？点击一键重新生成 3 道全新的题目"
                                    >
                                      <RefreshCw className={`w-3 h-3 ${regeneratingQuestions[question.id] ? "animate-spin" : ""}`} />
                                      <span>{regeneratingQuestions[question.id] ? "正在智能重新生成..." : "换一批：重新生成相似题"}</span>
                                    </button>
                                  </div>

                                  {regeneratingQuestions[question.id] ? (
                                    <div className="py-6 text-center space-y-2">
                                      <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin mx-auto" />
                                      <p className="text-[11px] text-slate-500 font-medium">正在通过 AI 为该知识点重新设计并生成 3 套全新的变式试题...</p>
                                    </div>
                                  ) : (
                                    question.variants.map((v, index) => (
                                      <div key={v.id} className="text-xs space-y-1 bg-slate-50/85 p-3 rounded-lg border border-slate-100">
                                        <p className="font-bold text-slate-800">
                                          变式 {index + 1}：{v.questionText}
                                        </p>
                                        <p className="font-semibold text-emerald-700">
                                          参考答案：{v.answer}
                                        </p>
                                        <p className="text-slate-500 leading-relaxed">
                                          解析：{renderHighlightedText(v.explanation)}
                                        </p>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Sticky Bottom Tab Switcher - Five Tab style with center FAB highlight */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 h-20 z-40 no-print shadow-lg">
        <div className="max-w-xl mx-auto h-full flex items-center justify-around px-2">
          
          {/* Tab 1: OCR Identify */}
          <button
            onClick={() => setActiveTab("identify")}
            className={`flex flex-col items-center gap-1 transition-all w-16 ${
              activeTab === "identify" 
                ? "text-blue-600 font-bold scale-105" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <Camera className={`w-5.5 h-5.5 ${activeTab === "identify" ? "stroke-[2.5]" : "stroke-2"}`} />
            <span className="text-[10px] font-semibold">错题识别</span>
          </button>

          {/* Tab 2: Wrong Questions Notebook */}
          <button
            onClick={() => setActiveTab("notebook")}
            className={`flex flex-col items-center gap-1 transition-all w-16 ${
              activeTab === "notebook" 
                ? "text-blue-600 font-bold scale-105" 
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            <div className="relative">
              <BookOpen className={`w-5.5 h-5.5 ${activeTab === "notebook" ? "stroke-[2.5]" : "stroke-2"}`} />
              {questions.length > 0 && (
                <span className="absolute -top-1.5 -right-2 px-1 py-0.2 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-4 text-center">
                  {questions.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold">错题本</span>
          </button>

          {/* Center: FAB Printer Button */}
          <div className="-mt-8">
            <button
              onClick={() => setShowPrintModal(true)}
              className="w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-200 flex items-center justify-center text-white border-4 border-slate-50 transition-transform hover:scale-105 active:scale-95"
              title="智能排版与批量打印"
            >
              <Printer className="w-5.5 h-5.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Tab 3: Mock Download Center */}
          <button
            onClick={() => setToastMsg("下载中心已就绪，所有错题均支持导出为标准 A4 PDF 试卷版！")}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition w-16"
          >
            <FileDown className="w-5.5 h-5.5 stroke-2" />
            <span className="text-[10px] font-semibold">下载中心</span>
          </button>

          {/* Tab 4: Mock Profile My Page */}
          <button
            onClick={() => setToastMsg("用户中心：当前登录 jjf4085@gmail.com (VIP 智能会员)")}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition w-16"
          >
            <User className="w-5.5 h-5.5 stroke-2" />
            <span className="text-[10px] font-semibold">我的</span>
          </button>

        </div>
      </nav>

      {/* Minimalist Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-md z-50 flex items-center gap-2 max-w-sm border border-slate-800 backdrop-blur-xs animate-in fade-in duration-200">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Embedded Full Screen Print preview overlay */}
      {showPrintModal && (
        <PrintPreview 
          questions={questions}
          onClose={() => setShowPrintModal(false)}
        />
      )}

    </div>
  );
}
