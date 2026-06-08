"use client";

import { useState, KeyboardEvent } from "react";
import { useGraph } from "@/hooks/useGraph";
import Image from "next/image";

export default function SearchBar() {
  const [input, setInput] = useState("");
  const { generateGraph, status } = useGraph();

  const isLoading = status === "loading";
  const showTitle = status === "idle" || status === "loading";

  const handleSearch = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    await generateGraph(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full px-4">
      {showTitle && (
        <div className="flex flex-col items-center gap-1 mt-2">
          <img
            src="/transparent-quagmire.png"
            alt="Quagmire symbol"
            className="w-32 sm:w-48 md:w-72"
            style={{
              height: "auto",
              filter: "invert(1)",
              marginBottom: "-30px",
            }}
          />
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mt-1">
            Quagmire
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 tracking-widest uppercase text-center w-full px-2">
            The internet is a web. Follow the threads.
          </p>
          {isLoading && (
            <p className="text-xs sm:text-sm text-violet-400 tracking-widest uppercase animate-pulse mt-1">
              Mapping the web...
            </p>
          )}
        </div>
      )}

      <div className="flex w-full max-w-2xl gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a topic, trend, or idea..."
          disabled={isLoading}
          className="flex-1 min-w-0 px-3 sm:px-4 py-3 rounded-xl text-base text-white bg-white/5 border border-white/10 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm transition-all duration-200"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !input.trim()}
          className="shrink-0 px-4 py-3 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? "..." : "Explore"}
        </button>
      </div>
      {/* Explanation - only show when idle */}
      {status === "idle" && (
        <div className="flex flex-col items-center gap-6 w-full mt-4">
          {/* One line explanation */}
          <p className="text-xs text-zinc-600 text-center max-w-sm leading-relaxed">
            Type any topic, trend, person, or idea — Quagmire maps how it
            connects to the rest of the internet.
          </p>

          {/* Three feature pills */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full max-w-lg">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex-1 w-full min-h-20">
              <Image
                src="/globe.png"
                alt="Globe "
                width={20}
                height={20}
                className="shrink-0"
              />
              <div>
                <p className="text-xs font-semibold text-zinc-300">
                  Map connections
                </p>
                <p className="text-[11px] text-zinc-600">
                  See how ideas link across internet culture
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex-1 w-full min-h-20">
              <Image
                src="/rabbit.png"
                alt="Rabbit "
                width={20}
                height={20}
                className="shrink-0"
              />
              <div>
                <p className="text-xs font-semibold text-zinc-300">
                  Follow rabbit holes
                </p>
                <p className="text-[11px] text-zinc-600">
                  Click any node to go deeper
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex-1 w-full min-h-20">
              <span className="text-lg">✦</span>
              <div>
                <p className="text-xs font-semibold text-zinc-300">
                  Discover surprises
                </p>
                <p className="text-[11px] text-zinc-600">
                  Find unexpected connections you never knew existed
                </p>
              </div>
            </div>
          </div>

          {/* Example topics */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-[11px] text-zinc-600 uppercase tracking-widest">
              Try one of these
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "dopamine detox",
                "black pill",
                "vaporwave",
                "kanye west",
                "sigma male",
                "brain rot",
                "elon musk",
                "hustle culture",
              ].map((topic) => (
                <button
                  key={topic}
                  onClick={() => generateGraph(topic)}
                  className="cursor-pointer whitespace-nowrap text-[11px] px-3 py-1.5 rounded-full border border-white/10 text-zinc-400 bg-white/5 hover:border-violet-500/60 hover:text-violet-300 hover:bg-violet-500/10 transition-all duration-200"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {status === "error" && (
        <p className="text-sm text-red-400 mt-1">
          Something went wrong. Try again.
        </p>
      )}
    </div>
  );
}
