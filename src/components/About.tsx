import { Typography, Box, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import PageLayout from "./PageLayout";

export default function About() {
  const navigate = useNavigate();
  return (
    <PageLayout>
      <Box sx={{ mb: 2 }}>
        <IconButton aria-label="back" onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
      </Box>
      <Typography variant="h4" component="h1" gutterBottom>
        About Quizzard
      </Typography>
      <Box>
        <Typography variant="body1" gutterBottom>
          Quizzard is a modern, responsive, and accessible quiz and team tools
          suite built with React, TypeScript, and Material UI. Our mission is to
          provide a professional, device-consistent, and delightful experience
          for teams, educators, and event organizers.
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          This project is open for feedback and contributions. For more
          information, visit our GitHub or contact us via the links in the
          footer.
        </Typography>
      </Box>
    </PageLayout>
  );
}
