import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            <span className="text-primary">词忆</span>
            <span className="text-muted text-2xl md:text-3xl ml-3">VocabStory</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted font-light">
            AI驱动的词汇记忆工具
          </p>
        </div>

        <p className="text-base text-muted leading-relaxed max-w-lg mx-auto">
          输入你记不住的单词，AI会将它们编织进
          <span className="text-foreground font-medium">宫斗剧</span>、
          <span className="text-foreground font-medium">都市言情</span>、
          <span className="text-foreground font-medium">悬疑小说</span>
          等高情绪场景中，用故事的力量帮你记住每一个单词。
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/generate"
            className="px-8 py-3.5 bg-primary text-white rounded-xl font-medium text-base hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
          >
            开始记单词
          </Link>
          <Link
            href="/wordbook"
            className="px-8 py-3.5 border border-border rounded-xl font-medium text-base hover:bg-surface-hover transition-colors"
          >
            我的单词本
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">4</p>
            <p className="text-xs text-muted mt-1">故事风格</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">AI</p>
            <p className="text-xs text-muted mt-1">智能生成</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">📖</p>
            <p className="text-xs text-muted mt-1">情境记忆</p>
          </div>
        </div>
      </div>
    </div>
  );
}
