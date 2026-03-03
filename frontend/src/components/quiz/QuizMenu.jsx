const DIFFICULTIES = [
  { value: "easy", label: "Easy", desc: "Phylum & Class" },
  { value: "medium", label: "Medium", desc: "Class & Order" },
  { value: "hard", label: "Hard", desc: "Order & Family" },
];

export default function QuizMenu({ difficulty, setDifficulty, onStart }) {
  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="text-3xl font-bold text-gray-900">Taxonomy Quiz</h1>
      <p className="mt-2 text-gray-600">
        Test your knowledge of the tree of life!
      </p>

      <div className="mt-8">
        <p className="mb-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
          Difficulty
        </p>
        <div className="flex justify-center gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setDifficulty(d.value)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                difficulty === d.value
                  ? "bg-primary-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          {DIFFICULTIES.find((d) => d.value === difficulty)?.desc}
        </p>
      </div>

      <div className="mt-6 space-y-3 text-left rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
        <p><strong>3 lives</strong> — game ends when you run out</p>
        <p><strong>Streaks</strong> — consecutive correct answers multiply your score</p>
        <p><strong>3 question types</strong> — placement, odd one out, and closer kin</p>
      </div>

      <button
        onClick={onStart}
        className="mt-8 rounded-full bg-primary-600 px-10 py-3 font-semibold text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-xl"
      >
        Start Quiz
      </button>
    </div>
  );
}
