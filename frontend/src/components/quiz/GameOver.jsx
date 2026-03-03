import { useNavigate } from "react-router";

export default function GameOver({ score, bestStreak, questionsAnswered, correctAnswers, onPlayAgain }) {
  const navigate = useNavigate();
  const accuracy = questionsAnswered > 0
    ? Math.round((correctAnswers / questionsAnswered) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-md text-center">
      <h2 className="text-3xl font-bold text-gray-900">Game Over</h2>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-primary-50 p-4">
          <p className="text-3xl font-bold text-primary-700">{score}</p>
          <p className="text-sm text-primary-600">Final Score</p>
        </div>
        <div className="rounded-xl bg-orange-50 p-4">
          <p className="text-3xl font-bold text-orange-600">{bestStreak}</p>
          <p className="text-sm text-orange-500">Best Streak</p>
        </div>
        <div className="rounded-xl bg-green-50 p-4">
          <p className="text-3xl font-bold text-green-600">{accuracy}%</p>
          <p className="text-sm text-green-500">Accuracy</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-3xl font-bold text-gray-700">{questionsAnswered}</p>
          <p className="text-sm text-gray-500">Questions</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onClick={onPlayAgain}
          className="rounded-full bg-primary-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-xl"
        >
          Play Again
        </button>
        <button
          onClick={() => navigate("/")}
          className="rounded-full border border-gray-200 bg-white px-8 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
