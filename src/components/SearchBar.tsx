"use client";

import { useState, KeyboardEvent } from "react";
import { useGraph } from "@/hooks/useGraph";

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
    <div className="flex flex-col items-center gap-3 w-full px-2 sm:px-4">
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
          <p className="text-xs sm:text-sm text-zinc-500 tracking-widest uppercase text-center">
            The internet is a web. Follow the threads.
          </p>
          {isLoading && (
            <p className="text-xs sm:text-sm text-violet-400 tracking-widest uppercase animate-pulse mt-1">
              Mapping the web...
            </p>
          )}
        </div>
      )}

      <div className="flex w-full gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a topic, trend, or idea..."
          disabled={isLoading}
          className="flex-1 px-3 sm:px-4 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/60 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm transition-all duration-200"
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !input.trim()}
          className="px-4 sm:px-5 py-3 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 whitespace-nowrap"
        >
          {isLoading ? "Mapping..." : "Explore"}
        </button>
      </div>

      {status === "error" && (
        <p className="text-sm text-red-400 mt-1">
          Something went wrong. Try again.
        </p>
      )}
    </div>
  );
}
