import React, { useState } from "react";

const jobs = [
  {
    id: 1,
    title: "Website Developer",
    type: "Full Time / Freelance",
    description:
      "Build, maintain, and optimize websites for our clients using modern frameworks and CMS platforms.",
    responsibilities: [
      "Develop websites using Shopify, WordPress, HTML, CSS, JS, React",
      "Maintain Git repositories",
      "Ensure responsive & SEO-friendly builds",
      "Collaborate with designers & marketers",
    ],
    skills: ["HTML", "CSS", "JavaScript", "React", "Git", "Shopify / WordPress"],
  },
  {
    id: 2,
    title: "Graphic Designer",
    type: "Full Time / Freelance",
    description:
      "Create visually compelling designs for brands, ads, and digital platforms.",
    responsibilities: [
      "Design social media creatives",
      "Brand identity & marketing assets",
      "Collaborate with marketing team",
    ],
    skills: ["Photoshop", "Canva", "Illustrator (optional)"],
  },
  {
    id: 3,
    title: "Video Editor",
    type: "Full Time / Freelance",
    description:
      "Edit high-quality videos for brands, ads, weddings, and social media.",
    responsibilities: [
      "Edit reels & long-form videos",
      "Add motion graphics & transitions",
      "Optimize videos for social platforms",
    ],
    skills: ["Premiere Pro", "After Effects", "CapCut"],
  },
  {
    id: 4,
    title: "Content Creation Associate",
    type: "Full Time",
    description:
      "Manage content strategy and social media presence for Nugens and client brands.",
    responsibilities: [
      "Create ad & organic content",
      "Manage social media accounts",
      "Plan content calendars & strategies",
    ],
    skills: ["Content Writing", "Social Media", "Strategy"],
  },
  {
    id: 5,
    title: "Office Administration Associate",
    type: "Full Time",
    description:
      "Handle basic office operations and internal coordination.",
    responsibilities: [
      "Basic office administration",
      "Client coordination",
      "Documentation & reports",
    ],
    skills: ["English Communication", "Computer Knowledge", "MS Office"],
  },
];

export default function Careers() {
  const [activeJob, setActiveJob] = useState(null);

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900">
            Careers at <span className="text-pink-600">Nugens</span>
          </h1>
          <p className="mt-4 text-gray-600">
            Join our creative & technology-driven team. Build products, brands,
            and careers with us.
          </p>
        </div>

        {/* Job Cards */}
      <div className="mt-16 grid grid-cols-1 gap-6">
          {jobs.map((job) => (
            <div
           key={job.id}
             className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-lg transition self-start"
>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{job.type}</p>
                </div>

                <button
                  onClick={() =>
                    setActiveJob(activeJob === job.id ? null : job.id)
                  }
                  className="text-pink-600 font-medium"
                >
                  {activeJob === job.id ? "Hide" : "View"}
                </button>
              </div>

              {/* Expanded Content */}
              {activeJob === job.id && (
                <div className="mt-6 border-t pt-6">
                  <p className="text-gray-700">{job.description}</p>

                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-900">
                      Responsibilities
                    </h4>
                    <ul className="list-disc list-inside mt-2 text-gray-600 text-sm space-y-1">
                      {job.responsibilities.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-semibold text-gray-900">
                      Skills & Tools
                    </h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {job.skills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <a
                    href={`mailto:careers@nugens.in?subject=Application for ${job.title}`}
                    className="inline-block mt-6 px-5 py-3 rounded-md text-white bg-gradient-to-r from-pink-600 to-orange-400"
                  >
                    Apply Now
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
