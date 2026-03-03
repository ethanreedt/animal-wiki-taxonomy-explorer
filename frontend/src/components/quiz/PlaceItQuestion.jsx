import { useState } from "react";

export default function PlaceItQuestion({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (option) => {
    if (selected !== null) return;
    setSelected(option);
    onAnswer(option === question.correct_answer);
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 overflow-hidden rounded-2xl bg-white shadow-md">
        <img
          src={question.species.image_url}
          alt={question.species.common_name}
          className="h-48 w-full object-cover sm:h-56"
        />
        <div className="p-4 text-center">
          <p className="text-lg font-bold text-gray-900">
            {question.species.common_name}
          </p>
          <p className="text-sm italic text-gray-500">
            {question.species.scientific_name}
          </p>
        </div>
      </div>

      <p className="mb-4 text-center text-lg font-semibold text-gray-800">
        {question.question}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {question.options.map((option) => {
          let style = "border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50";
          if (selected !== null) {
            if (option === question.correct_answer) {
              style = "border-green-400 bg-green-50 text-green-800";
            } else if (option === selected) {
              style = "border-red-400 bg-red-50 text-red-800";
            } else {
              style = "border-gray-100 bg-gray-50 text-gray-400";
            }
          }

          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={selected !== null}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-all ${style}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
