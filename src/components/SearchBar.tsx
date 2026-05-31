"use client";

import {useState, KeyboardEvent} from "react";
import {useGraph} from "@/hooks/useGraph";

export default function SearchBar(){
    const [input, setInput] = useState("");
    const{generateGraph, status} = useGraph();

    const isLoading = status === "loading";

    const handleSearch = async () => {
        const trimmed = input.trim();
        if(!trimmed || isLoading) return;
        await generateGraph(trimmed);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if(e.key === "Enter") handleSearch();
    };

    return (
    <div className="flex flex-col items-center gap-3 w-full max-w-2xl px-4">
      {/* Title */}
      <div className="flex flex-col items-center gap-1 mb-2">
        <h1 className="text-4xl font-bold tracking-tight text-white">
          Quagmire
        </h1>
        <p className="text-sm text-zinc-500 tracking-widest uppercase">
          The internet is a web. Follow the threads.
        </p>
      </div>

      {/* Search input */}
      <div className="flex w-full gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a topic, trend, or idea..."
          disabled={isLoading}
          className="
            flex-1 px-4 py-3 rounded-xl text-sm text-white
            bg-white/5 border border-white/10
            placeholder:text-zinc-600
            focus:outline-none focus:border-violet-500/60 focus:bg-white/8
            disabled:opacity-50 disabled:cursor-not-allowed
            backdrop-blur-sm transition-all duration-200
          "
        />
        <button
          onClick={handleSearch}
          disabled={isLoading || !input.trim()}
          className="
            px-5 py-3 rounded-xl text-sm font-medium
            bg-violet-600 hover:bg-violet-500 text-white
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-200
          "
        >
          {isLoading ? "Mapping..." : "Explore"}
        </button>
      </div>

      {/* Status messages */}
      {status === "error" && (
        <p className="text-sm text-red-400 mt-1">
          Something went wrong. Try again.
        </p>
      )}

      {status === "expanding" && (
        <p className="text-sm text-violet-400 mt-1">
          Following the thread...
        </p>
      )}
    </div>
  );
}


