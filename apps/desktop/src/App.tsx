import { useEffect, useState } from "react";
import "./App.css";

type Track = {
  id: string;
  title?: string;
  artist?: string;
  album?: string;
  bpm?: number;
  key?: string;
  wavPath?: string;
  fileUrl?: string;
};

function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const list = await window.tracksAPI.list();
        if (mounted) setTracks(list);
      } catch (e) {
        if (mounted) setError(String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="App" style={{ padding: 16 }}>
      <h1>Track Library</h1>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #444" }}>
                Title
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #444" }}>
                Artist
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #444" }}>
                BPM
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #444" }}>
                Key
              </th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #444" }}>
                Preview
              </th>
            </tr>
          </thead>
          <tbody>
            {tracks.map((t) => (
              <tr key={t.id}>
                <td>{t.title || "—"}</td>
                <td>{t.artist || "—"}</td>
                <td>{t.bpm ?? "—"}</td>
                <td>{t.key || "—"}</td>
                <td>
                  {t.fileUrl ? (
                    <audio
                      src={t.fileUrl}
                      controls
                      preload="none"
                      style={{ width: 200 }}
                    />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
