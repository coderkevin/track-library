import { useEffect, useState } from "react";
import "./App.css";
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  Toolbar,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  IconButton,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

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
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <CssBaseline />
      <AppBar position="static" elevation={0} sx={{ bgcolor: "#111827" }}>
        <Toolbar>
          <Typography variant="h6" component="div">
            Track Library
          </Typography>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth="lg"
        sx={{ mt: 3, mb: 3, flex: 1, display: "flex", flexDirection: "column" }}
      >
        {loading && <Typography>Loading…</Typography>}
        {error && <Typography color="error">{error}</Typography>}
        {!loading && !error && (
          <Paper variant="outlined" sx={{ width: "100%", overflow: "hidden" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Artist</TableCell>
                  <TableCell>BPM</TableCell>
                  <TableCell>Key</TableCell>
                  <TableCell>Preview</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tracks.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>{t.title || "—"}</TableCell>
                    <TableCell>{t.artist || "—"}</TableCell>
                    <TableCell>{t.bpm ?? "—"}</TableCell>
                    <TableCell>{t.key || "—"}</TableCell>
                    <TableCell>
                      {t.fileUrl ? (
                        <audio
                          src={t.fileUrl}
                          controls
                          preload="none"
                          style={{ width: 220 }}
                        />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
      </Container>
    </Box>
  );
}

export default App;
