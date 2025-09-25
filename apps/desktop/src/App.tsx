import { useEffect, useState } from "react";
import "./App.css";
import {
  AppBar,
  Box,
  Button,
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
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddIcon from "@mui/icons-material/Add";

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
  const [adding, setAdding] = useState(false);
  const [snack, setSnack] = useState<string | null>(null);

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

  const refresh = async () => {
    try {
      setLoading(true);
      const list = await window.tracksAPI.list();
      setTracks(list);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      setAdding(true);
      const ok = await window.tracksAPI.add();
      if (ok) {
        await refresh();
        setSnack("Track added");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setAdding(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <CssBaseline />
      <AppBar position="static" elevation={0} sx={{ bgcolor: "#111827" }}>
        <Toolbar>
          <Typography variant="h6" component="div">
            Track Library
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Button
            color="inherit"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={adding}
          >
            {adding ? "Adding…" : "Add Track"}
          </Button>
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

      <Snackbar
        open={!!snack}
        autoHideDuration={2500}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          onClose={() => setSnack(null)}
          sx={{ width: "100%" }}
        >
          {snack}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default App;
