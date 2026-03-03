const DIFFICULTIES = [
  { value: "easy", label: "Easy", desc: "Phylum & Class" },
  { value: "medium", label: "Medium", desc: "Class & Order" },
  { value: "hard", label: "Hard", desc: "Order & Family" },
];

const FEATURES = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
      </svg>
    ),
    title: "3 Question Types",
    desc: "Placement, odd one out, and closer kin",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
      </svg>
    ),
    title: "Streak Multiplier",
    desc: "Chain correct answers for up to 5x points",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    title: "3 Lives",
    desc: "Wrong answers cost a life — game ends at zero",
  },
];

export default function QuizMenu({ difficulty, setDifficulty, onStart }) {
  return (
    <div className="mx-auto max-w-lg">
      {/* Hero area */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-8 text-center text-white shadow-xl">
        <div className="relative">
          <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

          <div className="relative">
            <p className="text-sm font-medium uppercase tracking-widest text-primary-200">
              Animal Wiki
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">
              Taxonomy Quiz
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-primary-100">
              How well do you know the tree of life? Identify species by their
              taxonomic groups.
            </p>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-gray-100 bg-white p-3 text-center shadow-sm"
          >
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              {f.icon}
            </div>
            <p className="mt-2 text-xs font-semibold text-gray-800">
              {f.title}
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-gray-400">
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Difficulty selector */}
      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
          Choose Difficulty
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
        <p className="mt-2 text-center text-xs text-gray-400">
          {DIFFICULTIES.find((d) => d.value === difficulty)?.desc}
        </p>
      </div>

      {/* Start button */}
      <button
        onClick={onStart}
        className="mt-6 w-full rounded-xl bg-primary-600 py-3.5 text-lg font-semibold text-white shadow-lg transition-all hover:bg-primary-700 hover:shadow-xl"
      >
        Start Quiz
      </button>
    </div>
  );
}
