import { Typography, Box } from "@mui/material";
import PageLayout from "./PageLayout";

export default function PointsCounter() {
  return (
    <PageLayout textAlign="center">
      <Typography variant="h4" component="h1" gutterBottom>
        Points Counter
      </Typography>
      <Typography variant="body1" gutterBottom>
        Track scores and points for teams, individuals, or quiz sessions with
        persistent storage.
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" color="text.secondary">
          Coming Soon!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          This feature will include:
        </Typography>
        <Box
          component="ul"
          sx={{ textAlign: "left", mt: 2, color: "text.secondary" }}
        >
          <li>Multiple scoring categories</li>
          <li>Real-time score updates</li>
          <li>Session history and statistics</li>
          <li>Export score reports</li>
        </Box>
      </Box>
    </PageLayout>
  );
}
