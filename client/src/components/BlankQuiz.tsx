import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface QuizQuestion {
  id: string;
  type: "fill-in-the-blank" | "multiple-choice" | "short-answer";
  question: string;
  blanks?: string[];
  options?: string[];
  correctAnswer: string | string[];
  difficulty: "easy" | "medium" | "hard";
  explanation?: string;
}

interface QuizResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
}

interface QuizResultSummary {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: string;
  feedback: string;
  results: QuizResult[];
}

interface BlankQuizProps {
  questions: QuizQuestion[];
  title: string;
  description: string;
  estimatedTime: number;
  onComplete?: (results: QuizResultSummary) => void;
  onContinue?: () => void;
}

export default function BlankQuiz({
  questions,
  title,
  description,
  estimatedTime,
  onComplete,
  onContinue,
}: BlankQuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState<QuizResultSummary | null>(null);

  // 안전한 데이터 처리
  if (!questions || questions.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center text-gray-500">
          퀴즈 데이터를 불러올 수 없습니다. 다시 시도해주세요.
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  // currentQuestion이 undefined인 경우 추가 처리
  if (!currentQuestion) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center text-gray-500">
          문제를 불러올 수 없습니다.
        </CardContent>
      </Card>
    );
  }

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-900";
      case "medium":
        return "bg-yellow-100 text-yellow-900";
      case "hard":
        return "bg-red-100 text-red-900";
      default:
        return "bg-gray-100 text-gray-900";
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "쉬움";
      case "medium":
        return "중간";
      case "hard":
        return "어려움";
      default:
        return "불명";
    }
  };

  const handleAnswerChange = (value: string) => {
    setUserAnswers({
      ...userAnswers,
      [currentQuestion.id]: value,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    // Evaluate answers
    let correctCount = 0;
    const results = questions.map((question) => {
      const userAnswer = userAnswers[question.id] || "";
      const correctAnswer = Array.isArray(question.correctAnswer)
        ? question.correctAnswer[0]
        : question.correctAnswer;

      const normalizedUser = userAnswer.trim().toLowerCase();
      const normalizedCorrect = correctAnswer.trim().toLowerCase();
      const isCorrect = normalizedUser === normalizedCorrect;

      if (isCorrect) {
        correctCount++;
      }

      return {
        questionId: question.id,
        isCorrect,
        userAnswer,
        correctAnswer,
        explanation: question.explanation,
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const feedback =
      score >= 80
        ? "훌륭합니다! 내용을 잘 이해하고 있습니다."
        : score >= 60
          ? "좋습니다! 더 복습하면 더 나아질 수 있습니다."
          : "더 많은 복습이 필요합니다. 틀린 부분을 다시 공부해보세요.";

    const finalResults = {
      score,
      correctAnswers: correctCount,
      totalQuestions: questions.length,
      accuracy: `${score}%`,
      feedback,
      results,
    };

    setQuizResults(finalResults);
    setShowResults(true);

    if (onComplete) {
      onComplete(finalResults);
    }
  };

  if (showResults && quizResults) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>📊 퀴즈 결과</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Display */}
          <div className="text-center space-y-4">
            <div className="text-6xl font-bold text-indigo-600">
              {quizResults.score}%
            </div>
            <div className="text-2xl font-semibold text-gray-900">
              {quizResults.correctAnswers} / {quizResults.totalQuestions}
            </div>
            <p className="text-lg text-gray-700">{quizResults.feedback}</p>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">정답률</span>
              <span className="text-sm font-medium">{quizResults.accuracy}</span>
            </div>
            <Progress value={quizResults.score} className="h-3" />
          </div>

          {/* Detailed Results */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">상세 결과</h3>
            {quizResults.results.map(
              (
                result: {
                  questionId: string;
                  isCorrect: boolean;
                  userAnswer: string;
                  correctAnswer: string;
                  explanation?: string;
                },
                idx: number
              ) => (
                <div
                  key={result.questionId}
                  className={`p-4 rounded-lg border-2 ${
                    result.isCorrect
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        문제 {idx + 1}
                      </p>
                      <p className="text-gray-700 mt-1">
                        {questions[idx].question}
                      </p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">당신의 답:</span>{" "}
                          <span
                            className={
                              result.isCorrect
                                ? "text-green-700"
                                : "text-red-700"
                            }
                          >
                            {result.userAnswer || "(답변 없음)"}
                          </span>
                        </p>
                        {!result.isCorrect && (
                          <p className="text-sm">
                            <span className="font-medium">정답:</span>{" "}
                            <span className="text-green-700">
                              {result.correctAnswer}
                            </span>
                          </p>
                        )}
                      </div>
                      {result.explanation && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-gray-700">
                          <span className="font-medium">설명:</span>{" "}
                          {result.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
                setUserAnswers({});
              }}
              variant="outline"
              className="flex-1"
            >
              다시 풀기
            </Button>
            <Button
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              onClick={onContinue}
            >
              학습 계속하기
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="space-y-2">
          <CardTitle>{title}</CardTitle>
          <p className="text-sm text-gray-600">{description}</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              예상 소요 시간: {estimatedTime}분
            </span>
            {currentQuestion?.difficulty && (
              <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                {getDifficultyLabel(currentQuestion.difficulty)}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">
              문제 {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentQuestion?.question || "문제를 불러올 수 없습니다."}
          </h3>

          {/* Answer Input */}
          <div>
            <Input
              type="text"
              placeholder="답을 입력하세요..."
              value={userAnswers[currentQuestion?.id || ""] || ""}
              onChange={(e) => handleAnswerChange(e.target.value)}
              className="text-lg py-3"
              onKeyPress={(e) => {
                if (e.key === "Enter" && currentQuestionIndex === questions.length - 1) {
                  handleSubmit();
                } else if (e.key === "Enter") {
                  handleNext();
                }
              }}
            />
          </div>

          {/* Hint */}
          {currentQuestion?.blanks && currentQuestion.blanks.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium">힌트:</p>
                <p>{currentQuestion.blanks[0]}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex gap-2">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            variant="outline"
            className="flex-1"
          >
            이전
          </Button>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              제출
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              다음
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
