import { Typography, Box } from "@mui/material";
import PageLayout from "./PageLayout";

export default function RandomTeamGenerator() {
  return (
    <PageLayout title="Random Team Generator" textAlign="center">
      <Typography variant="body1" gutterBottom>
        Create balanced teams from a list of participants with customizable
        options.
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
          <li>Import participant lists</li>
          <li>Set team size preferences</li>
          <li>Balance teams by skill level</li>
          <li>Export team assignments</li>
        </Box>
      </Box>
    </PageLayout>
  );
}
