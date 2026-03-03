import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { apiGet } from "../api.js";
import CloserKinQuestion from "../components/quiz/CloserKinQuestion.jsx";
import GameOver from "../components/quiz/GameOver.jsx";
import OddOneOutQuestion from "../components/quiz/OddOneOutQuestion.jsx";
import PlaceItQuestion from "../components/quiz/PlaceItQuestion.jsx";
import QuizMenu from "../components/quiz/QuizMenu.jsx";
import ScoreBar from "../components/quiz/ScoreBar.jsx";

const RANK_POINTS = {
  phylum: 10,
  class: 15,
  order: 20,
  family: 30,
};

const QUESTION_COMPONENTS = {
  place_it: PlaceItQuestion,
  odd_one_out: OddOneOutQuestion,
  closer_kin: CloserKinQuestion,
};

export default function QuizPage() {
  const navigate = useNavigate();

  // Game state
  const [phase, setPhase] = useState("menu"); // menu | playing | review | gameover
  const [difficulty, setDifficulty] = useState("medium");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [lives, setLives] = useState(3);
  const [questionNum, setQuestionNum] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  // Current question
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(null);

  // Prefetched next question
  const nextQuestionRef = useRef(null);

  // SEO
  useEffect(() => {
    document.title = "Taxonomy Quiz — Animal Wiki";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute(
        "content",
        "Test your taxonomy knowledge! Identify animals by their taxonomic groups in this interactive quiz."
      );
    }
  }, []);

  const fetchQuestion = useCallback(async () => {
    const data = await apiGet(`/quiz/?difficulty=${difficulty}`);
    return data;
  }, [difficulty]);

  const loadQuestion = useCallback(async () => {
    setLoading(true);
    try {
      // Use prefetched question if available
      let q = nextQuestionRef.current;
      nextQuestionRef.current = null;
      if (!q) {
        q = await fetchQuestion();
      }
      setQuestion(q);
      setQuestionNum((n) => n + 1);
      setLastCorrect(null);
    } catch {
      // Retry once
      try {
        const q = await fetchQuestion();
        setQuestion(q);
        setQuestionNum((n) => n + 1);
        setLastCorrect(null);
      } catch {
        setQuestion(null);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchQuestion]);

  const prefetchNext = useCallback(() => {
    fetchQuestion()
      .then((q) => {
        nextQuestionRef.current = q;
      })
      .catch(() => {});
  }, [fetchQuestion]);

  const handleStart = () => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setLives(3);
    setQuestionNum(0);
    setCorrectAnswers(0);
    setPhase("playing");
    loadQuestion();
  };

  const handleAnswer = (correct) => {
    setLastCorrect(correct);

    if (correct) {
      const points = RANK_POINTS[question?.rank] || 15;
      const multiplier = Math.min(1 + streak * 0.5, 5);
      setScore((s) => s + Math.round(points * multiplier));
      setStreak((s) => {
        const newStreak = s + 1;
        setBestStreak((b) => Math.max(b, newStreak));
        return newStreak;
      });
      setCorrectAnswers((c) => c + 1);
    } else {
      setStreak(0);
      setLives((l) => l - 1);
    }

    // Prefetch next question during review
    prefetchNext();
    setPhase("review");
  };

  const handleNext = () => {
    if (lives <= 0 || (lastCorrect === false && lives - 1 <= 0)) {
      setPhase("gameover");
      return;
    }
    setPhase("playing");
    loadQuestion();
  };

  const handlePlayAgain = () => {
    setPhase("menu");
  };

  // Get the explore link for current question
  const getExploreId = () => {
    if (!question) return null;
    if (question.type === "place_it") return question.species?.id;
    if (question.type === "odd_one_out") return question.species?.[0]?.id;
    if (question.type === "closer_kin") return question.subject?.id;
    return null;
  };

  const QuestionComponent = question ? QUESTION_COMPONENTS[question.type] : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            &larr; Animal Wiki
          </button>
          <h1 className="text-sm font-bold text-primary-700">Taxonomy Quiz</h1>
        </div>
      </header>

      <main className={`mx-auto max-w-4xl px-4 py-8 ${phase === "menu" || phase === "gameover" ? "flex min-h-[calc(100vh-57px)] items-start justify-center pt-12 sm:pt-16" : ""}`}>
        {phase === "menu" && (
          <QuizMenu
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            onStart={handleStart}
          />
        )}

        {(phase === "playing" || phase === "review") && (
          <div className="space-y-6">
            <ScoreBar
              questionNum={questionNum}
              lives={lives}
              score={score}
              streak={streak}
            />

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
              </div>
            ) : question && QuestionComponent ? (
              <>
                <QuestionComponent
                  question={question}
                  onAnswer={handleAnswer}
                />

                {phase === "review" && (
                  <div className="mx-auto max-w-lg space-y-3 text-center">
                    <p
                      className={`text-lg font-bold ${
                        lastCorrect ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {lastCorrect ? "Correct!" : "Wrong!"}
                    </p>

                    {!lastCorrect && question.type === "place_it" && (
                      <p className="text-sm text-gray-600">
                        The answer was <strong>{question.correct_answer}</strong>
                      </p>
                    )}

                    <div className="flex items-center justify-center gap-3">
                      {getExploreId() && (
                        <button
                          onClick={() =>
                            navigate(`/explore?taxon=${getExploreId()}`)
                          }
                          className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                        >
                          Explore this taxon
                        </button>
                      )}
                      <button
                        onClick={handleNext}
                        className="rounded-full bg-primary-600 px-6 py-2 text-sm font-semibold text-white hover:bg-primary-700"
                      >
                        {lives <= 0 ? "See Results" : "Next Question"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center text-gray-500">
                <p>Could not load question. Please try again.</p>
                <button
                  onClick={loadQuestion}
                  className="mt-4 text-sm text-primary-600 hover:underline"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {phase === "gameover" && (
          <GameOver
            score={score}
            bestStreak={bestStreak}
            questionsAnswered={questionNum}
            correctAnswers={correctAnswers}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </main>
    </div>
  );
}
