import { Typography, Box, Button } from "@mui/material";
import { Link } from "react-router-dom";
import PageLayout from "./PageLayout";

export default function Home() {
  return (
    <PageLayout title="Welcome to Quizzard" textAlign="center">
      <Typography variant="subtitle1" gutterBottom>
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
        {" "}
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
      </Box>
    </PageLayout>
  );
}
