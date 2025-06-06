import { Typography, Box, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import PageLayout from "../shared/components/PageLayout";

export default function Terms() {
  const navigate = useNavigate();
  return (
    <PageLayout>
      <Box sx={{ mb: 2 }}>
        <IconButton aria-label="back" onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
      </Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Terms
      </Typography>
      <Typography variant="body1">
        Terms of Service content coming soon...
      </Typography>
    </PageLayout>
  );
}
