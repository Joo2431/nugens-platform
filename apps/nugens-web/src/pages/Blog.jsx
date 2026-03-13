import React from "react";
import { Link } from "react-router-dom";

const blogs = [
  {
    id: "ai-career",
    title: "How AI is Transforming Career Opportunities in 2025",
    excerpt:
      "Artificial Intelligence is reshaping how people learn, prepare, and get hired. Here’s what it means for the future.",
    category: "AI & Careers",
    date: "Jan 2025",
    readTime: "5 min read",
  },
  {
    id: "digital-presence",
    title: "Why Digital Presence is No Longer Optional for Brands",
    excerpt:
      "From startups to enterprises, a strong digital footprint decides who wins attention and trust.",
    category: "Digital Marketing",
    date: "Dec 2024",
    readTime: "4 min read",
  },
  {
    id: "visual-storytelling",
    title: "The Power of Visual Storytelling in Brand Building",
    excerpt:
      "Photography, video, and design are no longer aesthetics — they are strategy.",
    category: "Creative",
    date: "Dec 2024",
    readTime: "6 min read",
  },
  {
    id: "skill-gap",
    title: "Bridging the Skill Gap: Learning Beyond Degrees",
    excerpt:
      "Why practical learning and mentorship matter more than traditional education alone.",
    category: "Education",
    date: "Nov 2024",
    readTime: "5 min read",
  },
];

export default function Blog() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl">
          <h1 className="text-4xl font-bold text-gray-900">
            Nugens <span className="text-pink-600">Insights</span>
          </h1>
          <p className="mt-4 text-gray-600">
            Thoughts, stories, and insights on technology, creativity, careers,
            and digital growth.
          </p>
        </div>

        {/* Blog Grid */}
        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <Link
              key={blog.id}
              to={`/blog/${blog.id}`}
              className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition"
            >
              {/* Category */}
              <span className="inline-block text-xs font-medium text-pink-600 bg-pink-50 px-3 py-1 rounded-full">
                {blog.category}
              </span>

              {/* Title */}
              <h3 className="mt-4 text-xl font-semibold text-gray-900 group-hover:text-pink-600 transition">
                {blog.title}
              </h3>

              {/* Excerpt */}
              <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                {blog.excerpt}
              </p>

              {/* Meta */}
              <div className="mt-6 flex items-center justify-between text-xs text-gray-500">
                <span>{blog.date}</span>
                <span>{blog.readTime}</span>
              </div>

              {/* CTA */}
              <div className="mt-6 text-sm font-medium text-pink-600 group-hover:underline">
                Read article →
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
