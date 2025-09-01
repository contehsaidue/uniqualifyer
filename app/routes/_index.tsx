import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { HeroSection } from "@/components/sections/HeroSection";
import { FeatureCards } from "@/components/sections/FeatureCards";
import { HowItWorks } from "@/components/sections/HowItWorks";
import {
  HomepageData,
  UniversityExplorer,
} from "~/components/sections/UniversityExplorer";
import { getUniversities } from "@/utils/models/university.server";
import { getDepartments } from "@/utils/models/department.server";
import { getPrograms } from "@/utils/models/program.server";
import ProgramMatcher from "~/components/sections/ProgramMatcher";
import Footer from "~/components/sections/Footer";

export const meta: MetaFunction = () => {
  return [
    { title: "UniQualifyer" },
    { name: "description", content: "Welcome to the portal!" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const [universities, departments, programs] = await Promise.all([
      getUniversities(),
      getDepartments(),
      getPrograms(),
    ]);

    // Transform the data to match your interface
    const transformedData = {
      universities: universities.map((uni) => ({
        id: uni.id,
        name: uni.name,
        slug: uni.slug,
        location: "Various locations", // Default value
        rating: 4.0 + Math.random(), // Random rating between 4.0-5.0
        description: `${uni.name} is a leading institution with ${uni.departments.length} departments.`,
        imageUrl: `https://source.unsplash.com/random/300x200?university&${uni.id}`,
      })),
      departments: departments.map((dept) => ({
        id: dept.id,
        name: dept.name,
        code: dept.code,
        universityId: dept.universityId,
        university: {
          name: dept.university.name,
          slug: dept.university.slug,
        },
      })),
      programs: programs.map((program) => ({
        id: program.id,
        name: program.name,
        departmentId: program.departmentId || "",
        department: {
          name: program.department?.name || "General Studies",
          university: {
            name: program.department?.university?.name || "University",
          },
        },
        duration: ["2 years", "3 years", "4 years", "5 years"][
          Math.floor(Math.random() * 4)
        ],
        degreeType: ["BACHELOR", "MASTER", "PHD", "CERTIFICATE"][
          Math.floor(Math.random() * 4)
        ],
      })),
    };

    return transformedData;
  } catch (error) {
    console.error("Error loading homepage data:", error);
    return {
      universities: [],
      departments: [],
      programs: [],
    };
  }
}

export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100">
        <HeroSection />
        <FeatureCards />
        <HowItWorks />
        <ProgramMatcher />
        <UniversityExplorer data={data as unknown as HomepageData} />
        <Footer />
      </div>
    </>
  );
}
