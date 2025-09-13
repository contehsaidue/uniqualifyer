import React, { useState, useEffect } from "react";

// Define interfaces for our data structures
interface Program {
  id: number;
  name: string;
  university: string;
  department: string;
  requirementType: string;
  minGrade: string;
  minEnglish: number;
  extracurricularWeight: number;
  workExperienceWeight: number;
  popularity: number;
  match?: number; // Optional because we add this later
}

interface Qualifications {
  wassce: string;
  necta: string | null;
  undergraduateGpa: number;
  englishProficiency: string;
  englishScore: number;
  extracurriculars: number;
  workExperience: number;
}

const ProgramMatcher = () => {
  // State for user qualifications with proper typing
  const [qualifications, setQualifications] = useState<Qualifications>({
    wassce: "B2",
    necta: null,
    undergraduateGpa: 0,
    englishProficiency: "IELTS",
    englishScore: 6.0,
    extracurriculars: 2,
    workExperience: 1,
  });

  // State for matched programs with proper typing
  const [matchedPrograms, setMatchedPrograms] = useState<Program[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Sierra Leone universities and programs with proper typing
  const sierraLeonePrograms: Program[] = [
    {
      id: 1,
      name: "Electrical Engineering BSc",
      university: "Fourah Bay College",
      department: "Faculty of Engineering",
      requirementType: "GRADE",
      minGrade: "B3",
      minEnglish: 7.0,
      extracurricularWeight: 0.1,
      workExperienceWeight: 0.05,
      popularity: 0.92,
    },
    {
      id: 2,
      name: "Medicine and Surgery",
      university: "University of Sierra Leone",
      department: "College of Medicine and Allied Health Sciences",
      requirementType: "GRADE",
      minGrade: "B2",
      minEnglish: 6.5,
      extracurricularWeight: 0.15,
      workExperienceWeight: 0.1,
      popularity: 0.98,
    },
    {
      id: 3,
      name: "Business Administration",
      university: "Njala University",
      department: "School of Business",
      requirementType: "GRADE",
      minGrade: "C4",
      minEnglish: 5.5,
      extracurricularWeight: 0.2,
      workExperienceWeight: 0.15,
      popularity: 0.85,
    },
    {
      id: 4,
      name: "Agriculture",
      university: "Njala University",
      department: "School of Agriculture",
      requirementType: "GRADE",
      minGrade: "C5",
      minEnglish: 5.0,
      extracurricularWeight: 0.15,
      workExperienceWeight: 0.1,
      popularity: 0.75,
    },
    {
      id: 5,
      name: "Peace and Conflict Studies",
      university: "Fourah Bay College",
      department: "Faculty of Social Sciences",
      requirementType: "GRADE",
      minGrade: "C4",
      minEnglish: 6.0,
      extracurricularWeight: 0.25,
      workExperienceWeight: 0.2,
      popularity: 0.82,
    },
    {
      id: 6,
      name: "Law",
      university: "Fourah Bay College",
      department: "Faculty of Law",
      requirementType: "GRADE",
      minGrade: "B3",
      minEnglish: 7.0,
      extracurricularWeight: 0.1,
      workExperienceWeight: 0.05,
      popularity: 0.92,
    },
    {
      id: 7,
      name: "Computer Science BSc",
      university: "Njaala University",
      department: "School of Technology",
      requirementType: "GRADE",
      minGrade: "B3",
      minEnglish: 6.0,
      extracurricularWeight: 0.1,
      workExperienceWeight: 0.05,
      popularity: 0.95,
    },
  ];

  const gradeToNumber = (grade: string): number => {
    const gradeScale: Record<string, number> = {
      A1: 9,
      B2: 8,
      B3: 7,
      C4: 6,
      C5: 5,
      C6: 4,
      D7: 3,
      E8: 2,
      F9: 1,
    };
    return gradeScale[grade] || 0;
  };

  // Calculate match percentage
  const calculateMatch = (program: Program): number => {
    let score = 0;
    let totalWeight = 0;

    // Academic qualification calculation (50% weight)
    const userGradeValue = gradeToNumber(qualifications.wassce);
    const requiredGradeValue = gradeToNumber(program.minGrade);

    if (userGradeValue >= requiredGradeValue) {
      const gradeScore = (userGradeValue / 9) * 100;
      score += gradeScore * 0.5;
    }
    totalWeight += 0.5;

    // English proficiency calculation (20% weight)
    if (qualifications.englishScore >= program.minEnglish) {
      const englishScore = (qualifications.englishScore / 9) * 100;
      score += englishScore * 0.2;
    }
    totalWeight += 0.2;

    // Extracurriculars (15% weight)
    const extracurricularScore = Math.min(
      qualifications.extracurriculars * 20,
      100
    );
    score += extracurricularScore * program.extracurricularWeight;
    totalWeight += program.extracurricularWeight;

    // Work experience (15% weight)
    const workExperienceScore = Math.min(
      qualifications.workExperience * 25,
      100
    );
    score += workExperienceScore * program.workExperienceWeight;
    totalWeight += program.workExperienceWeight;

    // Calculate final percentage with popularity factor
    let finalScore = (score / totalWeight) * program.popularity;

    // Ensure score is between 0-100
    finalScore = Math.min(Math.max(finalScore, 0), 100);

    return Math.round(finalScore);
  };

  // Update matches when qualifications change
  useEffect(() => {
    setIsCalculating(true);

    // Simulate calculation delay for better UX
    const timer = setTimeout(() => {
      const newMatches = sierraLeonePrograms
        .map((program) => ({
          ...program,
          match: calculateMatch(program),
        }))
        .sort((a, b) => (b.match || 0) - (a.match || 0));

      setMatchedPrograms(newMatches);
      setIsCalculating(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [qualifications]);

  // Handle input changes
  const handleInputChange = (field: keyof Qualifications, value: number) => {
    setQualifications((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle select changes
  const handleSelectChange = (field: keyof Qualifications, value: string) => {
    setQualifications((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-blue-900 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Interact with the eligibility algorithm
          </h2>
          <p className="text-xl text-gray-300">
            Adjust your result and find the best programs for you
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Result Section */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Your Grades
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <label className="block mb-2 font-medium">Grade</label>
                  <select
                    value={qualifications.wassce}
                    onChange={(e) =>
                      handleSelectChange("wassce", e.target.value)
                    }
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="A1">A1 (Excellent)</option>
                    <option value="B2">B2 (Very Good)</option>
                    <option value="B3">B3 (Good)</option>
                    <option value="C4">C4 (Credit)</option>
                    <option value="C5">C5 (Credit)</option>
                    <option value="C6">C6 (Credit)</option>
                    <option value="D7">D7 (Pass)</option>
                    <option value="E8">E8 (Pass)</option>
                    <option value="F9">F9 (Fail)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Matches Section */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Your Matches{" "}
                {isCalculating && (
                  <span className="text-sm font-normal text-blue-500">
                    Calculating...
                  </span>
                )}
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {matchedPrograms.map((program) => (
                  <div
                    key={program.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {program.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {program.university} - {program.department}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Minimum Requirements: WASSCE {program.minGrade},
                          English {program.minEnglish}+
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-sm font-medium ${
                          (program.match || 0) >= 90
                            ? "bg-green-100 text-green-800"
                            : (program.match || 0) >= 75
                            ? "bg-blue-100 text-blue-800"
                            : (program.match || 0) >= 60
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {program.match}%
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          (program.match || 0) >= 90
                            ? "bg-green-500"
                            : (program.match || 0) >= 75
                            ? "bg-blue-500"
                            : (program.match || 0) >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${program.match}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => {
                // Reset to default values
                setQualifications({
                  wassce: "B2",
                  necta: null,
                  undergraduateGpa: 0,
                  englishProficiency: "IELTS",
                  englishScore: 6.0,
                  extracurriculars: 2,
                  workExperience: 1,
                });
              }}
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mr-4"
            >
              Reset Demo
            </button>
            <button
              onClick={() => {
                const wassceGrades = ["A1", "B2", "B3", "C4", "C5", "C6"];
                const randomGrade =
                  wassceGrades[Math.floor(Math.random() * wassceGrades.length)];

                setQualifications({
                  wassce: randomGrade,
                  necta: null,
                  undergraduateGpa: parseFloat(
                    (Math.random() * 2 + 2).toFixed(1)
                  ),
                  englishProficiency: "IELTS",
                  englishScore: parseFloat((Math.random() * 3 + 5).toFixed(1)),
                  extracurriculars: Math.floor(Math.random() * 6),
                  workExperience: Math.floor(Math.random() * 6),
                });
              }}
              className="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Randomize
              <svg
                className="w-5 h-5 ml-2"
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
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramMatcher;
