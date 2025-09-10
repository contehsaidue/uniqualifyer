import React, { useState, useEffect } from "react";

interface SubjectGrade {
  id: number;
  subject: string;
  grade: string;
  interpretation?: string;
}

const gradeInterpretation: Record<string, string> = {
  A1: "Excellent",
  B2: "Very Good",
  B3: "Good",
  C4: "Credit",
  C5: "Credit",
  C6: "Credit",
  D7: "Pass",
  E8: "Pass",
  F9: "Fail",
};

const gradeColors: Record<string, string> = {
  A1: "bg-green-100 text-green-800 border-green-200",
  B2: "bg-blue-100 text-blue-800 border-blue-200",
  B3: "bg-blue-50 text-blue-700 border-blue-100",
  C4: "bg-yellow-100 text-yellow-800 border-yellow-200",
  C5: "bg-yellow-50 text-yellow-700 border-yellow-100",
  C6: "bg-amber-100 text-amber-800 border-amber-200",
  D7: "bg-orange-100 text-orange-800 border-orange-200",
  E8: "bg-orange-50 text-orange-700 border-orange-100",
  F9: "bg-red-100 text-red-800 border-red-200",
};

const WassceInterpreter = () => {
  const [results, setResults] = useState<SubjectGrade[]>([
    { id: 1, subject: "Mathematics", grade: "B3" },
    { id: 2, subject: "English Language", grade: "C4" },
    { id: 3, subject: "Biology", grade: "B2" },
    { id: 4, subject: "Chemistry", grade: "B3" },
    { id: 5, subject: "Physics", grade: "A1" },
    { id: 6, subject: "Geography", grade: "C5" },
  ]);

  const [isCalculating, setIsCalculating] = useState(false);
  const [activeSubject, setActiveSubject] = useState<number | null>(null);

  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => {
      setResults((prev) =>
        prev.map((r) => ({
          ...r,
          interpretation: gradeInterpretation[r.grade],
        }))
      );
      setIsCalculating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [results.map((r) => r.grade).join(",")]);

  const handleGradeChange = (id: number, grade: string) => {
    setResults((prev) => prev.map((r) => (r.id === id ? { ...r, grade } : r)));
    setActiveSubject(id);
    setTimeout(() => setActiveSubject(null), 1000);
  };

  const handleReset = () => {
    setResults([
      { id: 1, subject: "Mathematics", grade: "B3" },
      { id: 2, subject: "English Language", grade: "C4" },
      { id: 3, subject: "Biology", grade: "B2" },
      { id: 4, subject: "Chemistry", grade: "B3" },
      { id: 5, subject: "Physics", grade: "A1" },
      { id: 6, subject: "Geography", grade: "C5" },
    ]);
  };

  const handleRandomize = () => {
    const grades = Object.keys(gradeInterpretation);
    const randomized = results.map((r) => ({
      ...r,
      grade: grades[Math.floor(Math.random() * grades.length)],
    }));
    setResults(randomized);
  };

  const calculateStats = () => {
    const gradeValues: Record<string, number> = {
      A1: 1,
      B2: 2,
      B3: 3,
      C4: 4,
      C5: 5,
      C6: 6,
      D7: 7,
      E8: 8,
      F9: 9,
    };

    const totalScore = results.reduce(
      (sum, result) => sum + gradeValues[result.grade],
      0
    );
    const averageScore = totalScore / results.length;

    const passedSubjects = results.filter((result) =>
      ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8"].includes(result.grade)
    ).length;

    const passRate = (passedSubjects / results.length) * 100;

    return { averageScore, passRate };
  };

  const { averageScore, passRate } = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-full mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Result Interpreter
          </h2>
          <p className="text-xl text-indigo-200 max-w-3xl mx-auto">
            Adjust your grades and get instant feedback on your performance with
            detailed insights
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 bg-white rounded-2xl p-6 shadow-2xl">
          {/* Left Column - Grade Management */}
          <div>
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Your Grades
                </h3>
                {isCalculating && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Calculating...
                  </span>
                )}
              </div>

              <div className="space-y-4 max-h-auto overflow-y-auto pr-2">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className={`p-4 border rounded-lg transition-all duration-300 ${
                      activeSubject === result.id
                        ? "ring-2 ring-blue-500 border-blue-300 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      {/* Subject */}
                      <span className="font-medium text-gray-900 text-lg flex-1">
                        {result.subject}
                      </span>

                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {/* Grade Selector */}
                        <select
                          value={result.grade}
                          onChange={(e) =>
                            handleGradeChange(result.id, e.target.value)
                          }
                          className="w-20 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        >
                          {Object.keys(gradeInterpretation).map((grade) => (
                            <option key={grade} value={grade}>
                              {grade}
                            </option>
                          ))}
                        </select>

                        {/* Interpretation Badge */}
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold border ${
                            gradeColors[result.grade]
                          } min-w-[100px] text-center`}
                        >
                          {gradeInterpretation[result.grade]}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex-1"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Reset Demo
                </button>
                <button
                  onClick={handleRandomize}
                  className="inline-flex items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex-1"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Randomize Grades
                </button>
              </div>
            </div>
          </div>
          {/* Right Column - Performance Summary */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Performance Summary
            </h3>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-600 font-medium">
                  Average Grade
                </p>
                <p className="text-2xl font-bold text-blue-800">
                  {averageScore.toFixed(1)}
                </p>
                <p className="text-xs text-blue-600 mt-1">Lower is better</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <p className="text-sm text-green-600 font-medium">Pass Rate</p>
                <p className="text-2xl font-bold text-green-800">
                  {passRate.toFixed(0)}%
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Of subjects passed
                </p>
              </div>
            </div>

            {/* Subject Breakdown */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-700 mb-3">
                Subject Breakdown
              </h4>
              <div className="space-y-3">
                {results.map((r) => (
                  <div
                    key={r.id}
                    className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                  >
                    <span className="text-gray-700">{r.subject}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{r.grade}</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          gradeColors[r.grade]
                        }`}
                      >
                        {gradeInterpretation[r.grade]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div>
              <h4 className="text-lg font-semibold text-gray-700 mb-3">
                Grade Legend
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(gradeInterpretation).map(
                  ([grade, interpretation]) => (
                    <div key={grade} className="flex items-center">
                      <span
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold mr-2 ${gradeColors[grade]}`}
                      >
                        {grade}
                      </span>
                      <span className="text-sm text-gray-600">
                        {interpretation}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WassceInterpreter;
