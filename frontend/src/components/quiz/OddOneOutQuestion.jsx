import { useState } from "react";

export default function OddOneOutQuestion({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (speciesId) => {
    if (selected !== null) return;
    setSelected(speciesId);
    onAnswer(speciesId === question.correct_answer);
  };

  return (
    <div className="mx-auto max-w-lg">
      <p className="mb-4 text-center text-lg font-semibold text-gray-800">
        {question.question}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {question.species.map((sp) => {
          let ringStyle = "border-gray-200";
          if (selected !== null) {
            if (sp.id === question.correct_answer) {
              ringStyle = "border-green-400 ring-2 ring-green-200";
            } else if (sp.id === selected) {
              ringStyle = "border-red-400 ring-2 ring-red-200";
            } else {
              ringStyle = "border-gray-100 opacity-50";
            }
          }

          return (
            <button
              key={sp.id}
              onClick={() => handleSelect(sp.id)}
              disabled={selected !== null}
              className={`overflow-hidden rounded-xl border-2 bg-white text-left shadow-sm transition-all hover:shadow-md ${ringStyle}`}
            >
              <img
                src={sp.image_url}
                alt={sp.common_name}
                className="h-28 w-full object-cover sm:h-36"
              />
              <div className="p-2">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {sp.common_name}
                </p>
                <p className="text-xs italic text-gray-500 truncate">
                  {sp.scientific_name}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
