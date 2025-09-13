import React, { useState, useEffect } from "react";

interface Program {
  id: number;
  name: string;
  university: string;
  department: string;
  requirementType: string;
  requiredSubjects: string[];
  minGrade: string;
  popularity: number;
  match?: number;
  description?: string;
}

interface SubjectGrade {
  id: number;
  subject: string;
  grade: string;
}

interface Qualifications {
  subjects: SubjectGrade[];
}

const ProgramMatcher = () => {
  const [qualifications, setQualifications] = useState<Qualifications>({
    subjects: [
      { id: 1, subject: "English Language", grade: "C4" },
      { id: 2, subject: "Mathematics", grade: "B3" },
      { id: 3, subject: "Physics", grade: "C5" },
      { id: 4, subject: "Chemistry", grade: "C4" },
      { id: 5, subject: "Biology", grade: "B3" },
      { id: 6, subject: "Further Mathematics", grade: "B2" },
      { id: 7, subject: "Geography", grade: "A1" },
      { id: 8, subject: "History", grade: "C6" },
      { id: 9, subject: "Economics", grade: "C4" },
      { id: 10, subject: "Government", grade: "C5" },
      { id: 11, subject: "Literature in English", grade: "B3" },
      { id: 12, subject: "French", grade: "B2" },
      { id: 13, subject: "Christian Religious Studies", grade: "B3" },
      { id: 14, subject: "Islamic Religious Studies", grade: "A1" },
      { id: 15, subject: "Agriculture", grade: "E8" },
      { id: 16, subject: "Business Management", grade: "F9" },
      { id: 17, subject: "Financial Accounting", grade: "D7" },
      { id: 18, subject: "Principles of Cost Accounting", grade: "A1" },
      { id: 19, subject: "Commerce", grade: "B2" },
      { id: 20, subject: "Food and Nutrition", grade: "B3" },
      { id: 21, subject: "Management in Living", grade: "C6" },
      { id: 22, subject: "Physical Health Education", grade: "D7" },
      { id: 23, subject: "Technical Drawing", grade: "C4" },
      { id: 24, subject: "Engineering Science", grade: "C5" },
      { id: 25, subject: "Science (Core)", grade: "C4" },
    ],
  });

  const [matchedPrograms, setMatchedPrograms] = useState<Program[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showDetails, setShowDetails] = useState<number | null>(null);
  const [visibleSubjects, setVisibleSubjects] = useState(5);
  const [selectedSubjectsCount, setSelectedSubjectsCount] = useState(0);

  const sierraLeonePrograms: Program[] = [
    {
      id: 1,
      name: "Electrical Engineering BSc",
      university: "University of Sierra Leone",
      department: "Fourah Bay College - Faculty of Engineering",
      requirementType: "GRADE",
      requiredSubjects: ["Mathematics", "Physics", "English Language"],
      minGrade: "B3",
      popularity: 0.92,
      description:
        "Focus on power systems, electronics, and telecommunications with hands-on laboratory experience.",
    },
    {
      id: 2,
      name: "Medicine and Surgery",
      university: "University of Sierra Leone",
      department: "College of Medicine and Allied Health Sciences",
      requirementType: "GRADE",
      requiredSubjects: [
        "English Language",
        "Mathematics",
        "Biology",
        "Chemistry",
        "Physics",
      ],
      minGrade: "B2",
      popularity: 0.98,
      description:
        "Comprehensive medical training program preparing students for careers in healthcare and surgery.",
    },
    {
      id: 3,
      name: "Business Administration",
      university: "University of Sierra Leone",
      department: "Institute of Public Administration and Management",
      requirementType: "GRADE",
      requiredSubjects: ["English Language", "Mathematics"],
      minGrade: "C4",
      popularity: 0.85,
      description:
        "Develop management skills and business acumen for leadership roles in various industries.",
    },
    {
      id: 4,
      name: "Agriculture",
      university: "Njala University",
      department: "School of Agriculture",
      requirementType: "GRADE",
      requiredSubjects: ["Biology", "Chemistry", "Agriculture"],
      minGrade: "C5",
      popularity: 0.75,
      description:
        "Study modern agricultural techniques, crop science, and sustainable farming practices.",
    },
    {
      id: 5,
      name: "Peace and Conflict Studies",
      university: "University of Sierra Leone",
      department: "Fourah Bay College - Faculty of Social Sciences",
      requirementType: "GRADE",
      requiredSubjects: ["English Language", "History", "Government"],
      minGrade: "C4",
      popularity: 0.82,
      description:
        "Examine conflict resolution, peacebuilding, and international relations in diverse contexts.",
    },
    {
      id: 6,
      name: "Law",
      university: "University of Sierra Leone",
      department: "Fourah Bay College - Faculty of Law",
      requirementType: "GRADE",
      requiredSubjects: [
        "English Language",
        "Literature in English",
        "Government",
      ],
      minGrade: "B3",
      popularity: 0.92,
      description:
        "Comprehensive legal education covering various aspects of national and international law.",
    },

    {
      id: 7,
      name: "Public Health",
      university: "University of Makeni",
      department: "Department of Health Sciences",
      requirementType: "GRADE",
      requiredSubjects: ["English Language", "Biology", "Chemistry"],
      minGrade: "C4",
      popularity: 0.78,
      description:
        "Focus on community health, epidemiology, and health policy development.",
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

  const calculateMatch = (program: Program): number => {
    let score = 0;
    let totalPossibleScore = program.requiredSubjects.length * 100;

    program.requiredSubjects.forEach((requiredSubject) => {
      const userSubject = qualifications.subjects.find(
        (s) => s.subject === requiredSubject
      );

      if (userSubject) {
        const userGradeValue = gradeToNumber(userSubject.grade);
        const requiredGradeValue = gradeToNumber(program.minGrade);

        if (userGradeValue >= requiredGradeValue) {
          // Full points for meeting or exceeding requirement
          score += 100;
        } else {
          // Partial points based on how close they are to requirement
          const proximity = (userGradeValue / requiredGradeValue) * 100;
          score += Math.max(proximity, 0);
        }
      }
    });

    // Calculate percentage and apply popularity factor
    const matchPercentage = (score / totalPossibleScore) * 100;
    return Math.round(matchPercentage * program.popularity);
  };

  useEffect(() => {
    // Count how many subjects have grades selected
    const count = qualifications.subjects.filter(
      (subject) => subject.grade !== ""
    ).length;
    setSelectedSubjectsCount(count);

    if (count >= 5) {
      setIsCalculating(true);

      const timer = setTimeout(() => {
        const newMatches = sierraLeonePrograms
          .map((program) => ({
            ...program,
            match: calculateMatch(program),
          }))
          .sort((a, b) => (b.match || 0) - (a.match || 0));

        setMatchedPrograms(newMatches);
        setIsCalculating(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setMatchedPrograms([]);
    }
  }, [qualifications]);

  // Handle grade changes
  const handleGradeChange = (id: number, grade: string) => {
    setQualifications((prev) => ({
      ...prev,
      subjects: prev.subjects.map((subject) =>
        subject.id === id ? { ...subject, grade } : subject
      ),
    }));
  };

  // Calculate statistics
  const calculateStats = () => {
    const totalPrograms = matchedPrograms.length;
    const eligiblePrograms = matchedPrograms.filter(
      (p) => (p.match || 0) >= 70
    ).length;
    const averageMatch =
      matchedPrograms.reduce((sum, p) => sum + (p.match || 0), 0) /
      totalPrograms;

    return {
      totalPrograms,
      eligiblePrograms,
      averageMatch: Math.round(averageMatch),
    };
  };

  const stats = calculateStats();

  const showMoreSubjects = () => {
    setVisibleSubjects(qualifications.subjects.length);
  };

  const showLessSubjects = () => {
    setVisibleSubjects(5);
  };

  const handleReset = () => {
    setQualifications({
      subjects: qualifications.subjects.map((subject) => ({
        ...subject,
        grade: "",
      })),
    });
  };

  const handleRandomize = () => {
    const grades = ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"];

    setQualifications({
      subjects: qualifications.subjects.map((subject) => ({
        ...subject,
        grade: grades[Math.floor(Math.random() * grades.length)],
      })),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            UniQualifyer Program Matcher Simulator
          </h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Select grades for at least 5 subjects to discover matching
            university programs
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-600 font-medium">
                Selected Subjects
              </p>
              <p className="text-2xl font-bold text-blue-800">
                {selectedSubjectsCount}/5
              </p>
              <p className="text-xs text-blue-600 mt-1">Minimum required</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
              <p className="text-sm text-green-600 font-medium">
                Eligible Programs
              </p>
              <p className="text-2xl font-bold text-green-800">
                {stats.eligiblePrograms}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
              <p className="text-sm text-purple-600 font-medium">
                Average Match
              </p>
              <p className="text-2xl font-bold text-purple-800">
                {selectedSubjectsCount >= 5 ? `${stats.averageMatch}%` : "N/A"}
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Subjects Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Your Subjects
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

              <div className="mb-4 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-600">
                  <span className="font-medium">Note:</span> Select grades for
                  at least 5 subjects to see program matches. Core subjects like
                  English and Mathematics are required for all programs.
                </p>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {qualifications.subjects
                  .slice(0, visibleSubjects)
                  .map((subject) => (
                    <div
                      key={subject.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <span className="font-medium text-gray-900 text-lg flex-1">
                          {subject.subject}
                        </span>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <select
                            value={subject.grade}
                            onChange={(e) =>
                              handleGradeChange(subject.id, e.target.value)
                            }
                            className="w-40 p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          >
                            <option value="">Select grade</option>
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
                  ))}

                {/* Show More/Less Buttons */}
                {qualifications.subjects.length > 5 && (
                  <div className="text-center mt-4">
                    {visibleSubjects <= 5 ? (
                      <button
                        onClick={showMoreSubjects}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Show all {qualifications.subjects.length} subjects ↓
                      </button>
                    ) : (
                      <button
                        onClick={showLessSubjects}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Show only 5 subjects ↑
                      </button>
                    )}
                  </div>
                )}
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
                  Clear All
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
                  Randomize All
                </button>
              </div>
            </div>

            {/* Matches Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Recommended Programs
                </h3>
              </div>

              {selectedSubjectsCount < 5 ? (
                <div className="p-8 text-center bg-yellow-50 rounded-lg border border-yellow-200">
                  <svg
                    className="w-12 h-12 mx-auto text-yellow-500 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <h4 className="text-lg font-medium text-yellow-800 mb-2">
                    Select More Subjects
                  </h4>
                  <p className="text-yellow-600">
                    Please select grades for at least 5 subjects to see program
                    matches. You've selected {selectedSubjectsCount} out of 5
                    required subjects.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {matchedPrograms.map((program) => (
                    <div
                      key={program.id}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() =>
                        setShowDetails(
                          showDetails === program.id ? null : program.id
                        )
                      }
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {program.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {program.university} • {program.department}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Required: {program.requiredSubjects.join(", ")} •
                            Minimum: {program.minGrade}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            (program.match || 0) >= 85
                              ? "bg-green-100 text-green-800"
                              : (program.match || 0) >= 70
                              ? "bg-blue-100 text-blue-800"
                              : (program.match || 0) >= 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {program.match}%
                        </span>
                      </div>

                      <div className="bg-gray-200 rounded-full h-2 mb-2">
                        <div
                          className={`h-2 rounded-full ${
                            (program.match || 0) >= 85
                              ? "bg-green-500"
                              : (program.match || 0) >= 70
                              ? "bg-blue-500"
                              : (program.match || 0) >= 50
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${program.match}%` }}
                        ></div>
                      </div>

                      {showDetails === program.id && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <p className="text-sm text-gray-700">
                            {program.description}
                          </p>
                          <div className="mt-2 text-xs text-gray-500">
                            <span>
                              Popularity:{" "}
                              {(program.popularity * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramMatcher;
