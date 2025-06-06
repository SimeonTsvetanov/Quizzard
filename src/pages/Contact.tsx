import { Typography, Box, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import PageLayout from "../shared/components/PageLayout";

export default function Contact() {
  const navigate = useNavigate();
  return (
    <PageLayout>
      <Box sx={{ mb: 2 }}>
        <IconButton aria-label="back" onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
      </Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Contact Us
      </Typography>
      <Box>
        <Typography variant="body1">
          Contact information coming soon...
        </Typography>
      </Box>
    </PageLayout>
  );
}
