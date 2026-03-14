import { useState, useRef } from "react";

const API = import.meta.env.VITE_GEN_E_API_URL || "https://nugens-platform.onrender.com";

export function useGeneTool() {
  const [output,  setOutput]  = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const tokenRef = useRef(null);

  const run = async (tool, inputs, token) => {
    setOutput(""); setError(""); setLoading(true);
    tokenRef.current = token;
    try {
      const res = await fetch(`${API}/api/gene/tool`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ tool, inputs }),
      });
      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const d = JSON.parse(line.slice(6));
            if (d.chunk) setOutput(p => p + d.chunk);
            if (d.error) setError(d.error);
          } catch {}
        }
      }
    } catch (e) {
      setError(e.message || "Something went wrong.");
    }
    setLoading(false);
  };

  const reset = () => { setOutput(""); setError(""); };

  return { output, loading, error, run, reset };
}
