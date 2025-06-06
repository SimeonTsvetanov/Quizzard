import { Typography, Box } from "@mui/material";
import PageLayout from "../../shared/components/PageLayout";

export default function Quizzes() {
  return (
    <PageLayout textAlign="center">
      <Box>
        <Typography variant="h3" component="h1" gutterBottom>
          Quizzes
        </Typography>
        <Typography variant="h5" gutterBottom>
          Build and Play Quizzes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Quizzes coming soon...
        </Typography>
      </Box>
    </PageLayout>
  );
} 