import { Typography, Box, Button, Fade } from "@mui/material";
import { Link } from "react-router-dom";
import PageLayout from "../shared/components/PageLayout";

export default function Home() {
  return (
    <PageLayout textAlign="center">
      <Fade in timeout={500}>
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome to Quizzard
          </Typography>
          <Typography variant="h5" gutterBottom>
            Your all-in-one quiz and team tools suite
          </Typography>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              mt: 4,
              width: "100%",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              component={Link}
              to="/team-generator"
              sx={{ minWidth: 0, wordBreak: "break-word" }}
            >
              Random Team Generator
            </Button>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              fullWidth
              component={Link}
              to="/points-counter"
              sx={{ minWidth: 0, wordBreak: "break-word" }}
            >
              Points Counter
            </Button>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              fullWidth
              component={Link}
              to="/quizzes"
              sx={{ minWidth: 0, wordBreak: "break-word" }}
            >
              Quizzes (Build and Play Quizzes)
            </Button>
          </Box>
        </Box>
      </Fade>
    </PageLayout>
  );
}
