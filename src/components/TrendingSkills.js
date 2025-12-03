// TrendingSkills.js
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaCode, FaCloud, FaChartBar, FaDatabase } from "react-icons/fa";
import { Tooltip } from "react-tooltip";
import axiosInstance from "../axiosInstance";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const ICON_SET = [FaCode, FaCloud, FaChartBar, FaDatabase];

const DEFAULT_SKILLS = [
  {
    name: "Artificial Intelligence & Machine Learning",
    courseName: "AI For Everyone by Andrew Ng",
    courseUrl: "https://www.coursera.org/learn/ai-for-everyone",
  },
  {
    name: "Cybersecurity",
    courseName: "Introduction to Cyber Security Specialization",
    courseUrl: "https://www.coursera.org/specializations/intro-cyber-security",
  },
  {
    name: "Cloud Computing",
    courseName: "Architecting with Google Cloud Platform",
    courseUrl: "https://www.coursera.org/specializations/gcp-architecture",
  },
  {
    name: "Data Science & Analytics",
    courseName: "IBM Data Science Professional Certificate",
    courseUrl:
      "https://www.coursera.org/professional-certificates/ibm-data-science",
  },
  {
    name: "DevOps & Automation",
    courseName: "DevOps on AWS",
    courseUrl: "https://www.coursera.org/learn/devops-aws",
  },
  {
    name: "Blockchain Development",
    courseName: "Blockchain Basics",
    courseUrl: "https://www.coursera.org/learn/blockchain-basics",
  },
];

// Animation for slide-up fade-in
const skillVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const collapseWhitespace = (value = "") => value.replace(/\s+/g, " ").trim();

const inferNameFromUrl = (url) => {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    if (!segments.length) return parsed.hostname.replace(/^www\./, "");
    const candidate = decodeURIComponent(segments.pop())
      .replace(/[-_]/g, " ")
      .replace(/\.(html|php)$/i, "")
      .trim();
    return candidate.length > 3 ? candidate : parsed.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const extractCourseDetails = (line = "") => {
  if (!line) {
    return { courseName: "", courseUrl: "" };
  }

  const markdownMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
  const urlMatch = line.match(/https?:\/\/[^\s)\]]+/);

  const courseUrl = markdownMatch?.[2]?.trim() || urlMatch?.[0]?.trim() || "";

  let courseName = markdownMatch?.[1]?.trim() || "";

  if (!courseName) {
    courseName = line
      .replace(/^(Best\s+Course|Course)\s*:\s*/i, "")
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1")
      .replace(/\((https?:\/\/[^)]+)\)/g, "")
      .replace(/https?:\/\/[^\s)]+/g, "")
      .replace(/[-–—]\s*$/g, "")
      .trim();
  }

  if (!courseName && courseUrl) {
    courseName = inferNameFromUrl(courseUrl);
  }

  if (courseUrl) {
    try {
      const validated = new URL(courseUrl);
      courseName = collapseWhitespace(courseName);
      return { courseName, courseUrl: validated.href };
    } catch {
      return { courseName: collapseWhitespace(courseName), courseUrl: "" };
    }
  }

  return { courseName: collapseWhitespace(courseName), courseUrl: "" };
};

// Parses flexible AI responses into structured skill objects
const parseSkills = (rawText = "") => {
  if (typeof rawText !== "string") return [];
  const normalized = rawText.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const blocks = normalized
    .split(/\n{2,}|\n(?=Skill\s*:)/i)
    .map((block) => block.trim())
    .filter(Boolean);

  const seenNames = new Set();
  const parsed = [];

  blocks.forEach((block) => {
    const lines = block
      .split("\n")
      .map((line) =>
        line
          .replace(/^[\d\-*.\s]+/, "")
          .replace(/\*\*/g, "")
          .trim()
      )
      .filter(Boolean);

    if (!lines.length) return;

    const skillLine = lines.find((line) => /^Skill\b/i.test(line)) || lines[0];
    let name = skillLine.replace(/^Skill\s*:\s*/i, "").trim();
    name = collapseWhitespace(name.replace(/[-–—]\s*$/g, ""));
    if (!name) return;

    const { courseName, courseUrl } = extractCourseDetails(
      lines.find((line) => /^(Best\s+Course|Course)\b/i.test(line))
    );

    if (!courseUrl && !courseName) return;

    const key = name.toLowerCase();
    if (seenNames.has(key)) return;
    seenNames.add(key);

    parsed.push({
      name,
      courseName,
      courseUrl,
    });
  });

  return parsed.slice(0, 6);
};

const finalizeSkills = (skills) => {
  const defaultsMap = new Map(
    DEFAULT_SKILLS.map((skill) => [skill.name.toLowerCase(), skill])
  );

  const merged = skills.map((skill) => {
    const fallback = defaultsMap.get(skill.name.toLowerCase());
    return {
      name: collapseWhitespace(skill.name),
      courseName: collapseWhitespace(
        skill.courseName || fallback?.courseName || ""
      ),
      courseUrl: (skill.courseUrl || fallback?.courseUrl || "").trim(),
    };
  });

  const combined = [...merged];
  DEFAULT_SKILLS.forEach((fallback) => {
    if (combined.length >= 6) return;
    const exists = combined.some(
      (skill) => skill.name.toLowerCase() === fallback.name.toLowerCase()
    );
    if (!exists) {
      combined.push({ ...fallback });
    }
  });

  const unique = [];
  const seen = new Set();

  combined.forEach((skill) => {
    if (!skill.name || !skill.courseUrl) return;
    const key = skill.name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    unique.push({
      name: skill.name,
      courseName: collapseWhitespace(
        skill.courseName || inferNameFromUrl(skill.courseUrl)
      ),
      courseUrl: skill.courseUrl,
    });
  });

  return unique.slice(0, 6).map((skill, index) => ({
    ...skill,
    id: `skill-${index}`,
    demand: 90 - index * 7,
    icon: ICON_SET[index % ICON_SET.length],
    tooltip: skill.courseName ? `Best course: ${skill.courseName}` : undefined,
  }));
};

export default function TrendingSkills() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const year = new Date().getFullYear();

  useEffect(() => {
    const fetchSkills = async () => {
      setLoading(true);
      setError("");
      try {
        // Stronger prompt: require real, best course name and direct link for each skill
        const aiPrompt = `List the top trending tech skills for ${year}. For each skill, provide:\n- The skill name\n- The best real online course name for learning it (from Coursera, Udemy, edX, or similar)\n- A valid, direct link to that course (not a homepage, but the actual course page)\nFormat: Skill: <name>\nBest Course: <course name> - <course URL>\nIf you don't know a real course, search and use a real, popular one.`;
        const res = await axiosInstance.post("/ai/trending-skills", {
          year,
          prompt: aiPrompt,
        });
        const suggestions = typeof res.data?.suggestions === "string"
          ? res.data.suggestions
          : "";
        const parsed = parseSkills(suggestions);
        const finalSkills = finalizeSkills(parsed);
        setSkills(finalSkills.length ? finalSkills : finalizeSkills([]));
      } catch (err) {
        if (err?.response?.status === 401) {
          setError("Please log in to view AI-powered trending skills.");
        } else {
          setError("⚠ Failed to fetch trending skills. Please try again later.");
        }
        setSkills(finalizeSkills([]));
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, [year]);

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
        >
          Trending Skills {year}
        </motion.h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-6 h-48 bg-white dark:bg-gray-800 shadow-md"
              >
                <Skeleton height={32} width={60} style={{ marginBottom: 16 }} />
                <Skeleton height={24} width={120} style={{ marginBottom: 8 }} />
                <Skeleton
                  height={12}
                  width="100%"
                  style={{ marginBottom: 16 }}
                />
                <Skeleton height={16} width={160} />
              </div>
            ))}
          </div>
        ) : (
          <>
            {error && (
              <p className="mt-4 text-red-500" role="status">
                {error}
              </p>
            )}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8"
              variants={skillVariants}
              initial="hidden"
              animate="visible"
            >
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, type: "spring" }}
                  className="rounded-2xl p-6 shadow-xl hover:shadow-glow bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
                  data-tooltip-id={skill.id}
                  data-tooltip-content={skill.tooltip}
                  aria-label={`Skill: ${skill.name}`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <motion.span
                      className="text-4xl text-indigo-600 dark:text-purple-400"
                      whileHover={{ scale: 1.2 }}
                    >
                      {skill.icon()}
                    </motion.span>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {skill.name}
                    </h3>
                  </div>
                  <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute h-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.demand}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </div>
                  {skill.courseName && skill.courseUrl ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                      Best Course:{" "}
                      <a
                        href={skill.courseUrl}
                        className="text-indigo-600 dark:text-purple-400 hover:underline font-medium"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {skill.courseName}
                      </a>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-4">
                      No course available
                    </p>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </>
        )}
        {skills
          .filter((skill) => skill.tooltip)
          .map((skill) => (
            <Tooltip
              key={skill.id}
              id={skill.id}
              place="top"
              className="bg-indigo-900 dark:bg-purple-900 text-white rounded-md px-3 py-1 shadow-lg"
              effect="float"
            />
          ))}
      </div>
    </section>
  );
}
